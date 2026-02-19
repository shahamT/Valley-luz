import { openai } from './openai.service.js'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { extractMessageId } from '../utils/messageHelpers.js'
import { LOG_PREFIXES } from '../consts/index.js'
import { getCategoriesList, getDateTimeContext, isImageUrl } from '../consts/events.const.js'
import { resolvePublisherPhone } from '../utils/contactHelpers.js'
import { updateEventDocument, deleteEventDocument, findCandidateEvents, updateEventWithNewData, appendToPreviousVersions, getEventDocument } from './mongo.service.js'
import { sendEventConfirmation, CONFIRMATION_REASONS } from '../utils/messageSender.js'
import { deleteMediaFromCloudinary } from './cloudinary.service.js'
import { ObjectId } from 'mongodb'

// ─── JSON Schemas for Structured Outputs ────────────────────────────────────

const CLASSIFICATION_SCHEMA = {
  name: 'classification',
  strict: true,
  schema: {
    type: 'object',
    required: ['isEvent', 'searchKeys', 'reason'],
    additionalProperties: false,
    properties: {
      isEvent: { type: 'boolean' },
      searchKeys: { type: 'array', items: { type: 'string' } },
      reason: { type: ['string', 'null'] },
    },
  },
}

const EVENT_SCHEMA_PROPERTIES = {
  media: { type: 'array', items: { type: 'string' } },
  urls: {
    type: 'array',
    items: {
      type: 'object',
      required: ['Title', 'Url'],
      additionalProperties: false,
      properties: {
        Title: { type: 'string' },
        Url: { type: 'string' },
      },
    },
  },
  categories: { type: 'array', items: { type: 'string' } },
  mainCategory: { type: 'string' },
  Title: { type: 'string' },
  fullDescription: { type: 'string' },
  shortDescription: { type: 'string' },
  location: {
    type: 'object',
    required: ['City', 'CityEvidence', 'addressLine1', 'addressLine2', 'locationDetails', 'wazeNavLink', 'gmapsNavLink'],
    additionalProperties: false,
    properties: {
      City: { type: 'string' },
      CityEvidence: { type: ['string', 'null'] },
      addressLine1: { type: ['string', 'null'] },
      addressLine2: { type: ['string', 'null'] },
      locationDetails: { type: ['string', 'null'] },
      wazeNavLink: { type: ['string', 'null'] },
      gmapsNavLink: { type: ['string', 'null'] },
    },
  },
  price: { type: ['number', 'null'] },
  occurrence: {
    type: 'object',
    required: ['hasTime', 'startTime', 'endTime'],
    additionalProperties: false,
    properties: {
      hasTime: { type: 'boolean' },
      startTime: { type: 'string' },
      endTime: { type: ['string', 'null'] },
    },
  },
}

const EXTRACTION_SCHEMA = {
  name: 'event_extraction',
  strict: true,
  schema: {
    type: 'object',
    required: Object.keys(EVENT_SCHEMA_PROPERTIES),
    additionalProperties: false,
    properties: EVENT_SCHEMA_PROPERTIES,
  },
}

const COMPARISON_SCHEMA = {
  name: 'comparison',
  strict: true,
  schema: {
    type: 'object',
    required: ['status', 'matchedCandidateId', 'reason'],
    additionalProperties: false,
    properties: {
      status: { type: 'string', enum: ['new_event', 'existing_event', 'updated_event'] },
      matchedCandidateId: { type: ['string', 'null'] },
      reason: { type: 'string' },
    },
  },
}

// ─── OpenAI retry helpers ───────────────────────────────────────────────────

const MAX_OPENAI_ATTEMPTS = 3

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableOpenAIError(error) {
  const status = error?.status
  if (status === 429) return true
  if (status >= 500) return true
  if (status === 408) return true
  return false
}

/**
 * @param {*} error - OpenAI API error (may have status and message)
 * @param {number} attemptIndex - 0 before first retry, 1 before second retry
 * @returns {number} delay in ms
 */
function getRetryDelayMs(error, attemptIndex) {
  if (error?.status === 429 && error?.message) {
    const match = String(error.message).match(/try again in (\d+)ms/i)
    if (match) {
      const ms = Math.min(60000, Math.max(500, Number(match[1])))
      return ms
    }
    return 2000
  }
  const backoff = 1000 * Math.pow(2, attemptIndex)
  return Math.min(30000, backoff)
}

// ─── Validation helpers ─────────────────────────────────────────────────────

function validateEventStructure(event) {
  if (!event || typeof event !== 'object') return { valid: false, reason: 'Event is not an object' }
  if (typeof event.Title !== 'string' || !event.Title.trim()) return { valid: false, reason: 'Missing or empty Title' }
  if (!Array.isArray(event.categories) || event.categories.length === 0) return { valid: false, reason: 'Missing or empty categories' }
  if (typeof event.mainCategory !== 'string' || !event.mainCategory.trim()) return { valid: false, reason: 'Missing mainCategory' }
  if (!event.categories.includes(event.mainCategory)) return { valid: false, reason: 'mainCategory not in categories' }
  if (!event.location || typeof event.location !== 'object') return { valid: false, reason: 'Missing location' }
  if (!event.occurrence || typeof event.occurrence !== 'object') return { valid: false, reason: 'Missing occurrence' }
  if (typeof event.occurrence.hasTime !== 'boolean') return { valid: false, reason: 'Missing occurrence.hasTime' }
  if (typeof event.occurrence.startTime !== 'string' || !event.occurrence.startTime.trim()) return { valid: false, reason: 'Missing startTime' }
  return { valid: true }
}

function validateSearchKeys(searchKeys) {
  return Array.isArray(searchKeys) && searchKeys.length > 0 && searchKeys.every(k => typeof k === 'string' && k.trim().length > 0)
}

/**
 * Returns ISO UTC string for Israel (Asia/Jerusalem) midnight on the given date.
 * Used when occurrence.hasTime is false (all-day events).
 * @param {string} dateOrIso - Date part (YYYY-MM-DD) or full ISO string
 * @returns {string} ISO UTC string
 */
function israelMidnightToUtcIso(dateOrIso) {
  const dateOnly = typeof dateOrIso === 'string' ? dateOrIso.slice(0, 10) : ''
  const match = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return dateOrIso
  const [, y, m, d] = match.map(Number)
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  const israelHour = parseInt(noonUtc.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hour12: false }), 10)
  const offsetHours = israelHour - 12
  const utcIsraelMidnight = new Date(Date.UTC(y, m - 1, d) - offsetHours * 3600 * 1000)
  return utcIsraelMidnight.toISOString()
}

/**
 * Returns ISO UTC string for a given date and time in Israel (Asia/Jerusalem).
 * Used to correct startTime when the model stored Israel local time as UTC.
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} timeHHMM - HH:MM or H:MM (Israel local)
 * @returns {string} ISO UTC string
 */
function localTimeIsraelToUtcIso(dateStr, timeHHMM) {
  const dateMatch = (dateStr || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const timeMatch = (timeHHMM || '').match(/^(\d{1,2}):(\d{2})$/)
  if (!dateMatch || !timeMatch) return ''
  const [, y, mo, d] = dateMatch.map(Number)
  const [, h, min] = timeMatch.map(Number)
  if (h < 0 || h > 23 || min < 0 || min > 59) return ''
  const noonUtc = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0))
  const israelHour = parseInt(noonUtc.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hour12: false }), 10)
  const offsetHours = israelHour - 12
  const utcMoment = new Date(Date.UTC(y, mo - 1, d, h, min, 0) - offsetHours * 3600 * 1000)
  return utcMoment.toISOString()
}

// ─── Cleanup helper ─────────────────────────────────────────────────────────

async function cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason) {
  if (cloudinaryData?.public_id) {
    try { await deleteMediaFromCloudinary(cloudinaryData.public_id) } catch (_) { /* logged elsewhere */ }
  }
  try { await deleteEventDocument(eventId) } catch (_) { /* logged elsewhere */ }
  try { await sendEventConfirmation(messagePreview, reason) } catch (_) { /* logged elsewhere */ }
}

// ─── Programmatic validation (replaces AI Call #3) ──────────────────────────

/**
 * Validates an extracted event programmatically.
 * Checks dates, required fields, location word-match, and category validity.
 * Returns the event with corrections applied, or null if unfixable.
 * Exported for use by test scripts.
 */
export function validateEventProgrammatic(event, rawMessageText, categoriesList) {
  const corrections = []
  const validCatIds = categoriesList.map(c => c.id)

  // -- Categories --
  event.categories = (event.categories || []).filter(c => validCatIds.includes(c))
  if (event.categories.length === 0) {
    return { event: null, corrections: ['No valid categories remaining'] }
  }
  if (!event.categories.includes(event.mainCategory)) {
    event.mainCategory = event.categories[0]
    corrections.push(`mainCategory corrected to ${event.mainCategory}`)
  }

  // -- Location City + CityEvidence: verify evidence appears in source; else clear both --
  if (event.location) {
    const evidence = event.location.CityEvidence != null && String(event.location.CityEvidence).trim()
    if (evidence) {
      const evidenceInText = rawMessageText.includes(event.location.CityEvidence.trim())
      if (!evidenceInText) {
        corrections.push(`CityEvidence "${event.location.CityEvidence}" not found in message text - cleared City and CityEvidence`)
        event.location.City = ''
        event.location.CityEvidence = null
      }
    } else if (event.location.City && event.location.City.trim()) {
      corrections.push('City had no CityEvidence - cleared City')
      event.location.City = ''
    }

    // -- addressLine1, addressLine2, locationDetails: must appear verbatim in message or set null --
    const verbatimLocationFields = ['addressLine1', 'addressLine2', 'locationDetails']
    for (const field of verbatimLocationFields) {
      const val = event.location[field]
      if (val != null && typeof val === 'string' && val.trim()) {
        if (!rawMessageText.includes(val.trim())) {
          corrections.push(`location.${field} not found verbatim in message - cleared`)
          event.location[field] = null
        }
      }
    }
  }

  // -- Date reasonability --
  if (event.occurrence?.startTime) {
    const start = new Date(event.occurrence.startTime)
    if (isNaN(start.getTime())) {
      return { event: null, corrections: ['startTime is not a valid date'] }
    }
    const now = new Date()
    const twoYearsFromNow = new Date(now)
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2)
    if (start > twoYearsFromNow) {
      corrections.push(`startTime ${event.occurrence.startTime} is more than 2 years in the future - suspicious`)
    }
  }

  if (event.occurrence?.endTime) {
    const end = new Date(event.occurrence.endTime)
    if (isNaN(end.getTime())) {
      event.occurrence.endTime = null
      corrections.push('endTime was invalid - cleared')
    }
  }

  // -- All-day rule: if hasTime is false, set startTime to Israel midnight UTC and endTime to null --
  if (event.occurrence && event.occurrence.hasTime === false && event.occurrence.startTime) {
    const normalized = israelMidnightToUtcIso(event.occurrence.startTime)
    if (normalized !== event.occurrence.startTime) {
      corrections.push('All-day event: startTime normalized to Israel midnight UTC')
    }
    event.occurrence.startTime = normalized
    event.occurrence.endTime = null
  }

  // -- Media is set programmatically from WhatsApp attachment only; ignore AI value --
  event.media = []
  if (!Array.isArray(event.urls)) event.urls = []

  // -- Null out empty optional strings --
  const optionalLocationFields = ['CityEvidence', 'addressLine1', 'addressLine2', 'locationDetails', 'wazeNavLink', 'gmapsNavLink']
  for (const field of optionalLocationFields) {
    if (event.location?.[field] !== null && event.location?.[field] !== undefined && typeof event.location[field] === 'string' && !event.location[field].trim()) {
      event.location[field] = null
    }
  }

  // -- Title should not contain price --
  if (event.Title && /₪|שקל|ש"ח|חינם|free|NIS/i.test(event.Title)) {
    corrections.push('Title contained price info (not removed, flagged)')
  }

  return { event, corrections }
}

// ─── Enrichment ─────────────────────────────────────────────────────────────

async function enrichEvent(event, authorId, cloudinaryUrl, originalMessage, client) {
  const validation = validateEventStructure(event)
  if (!validation.valid) throw new Error(`Invalid event for enrichment: ${validation.reason}`)

  if (authorId) {
    try {
      const phone = await resolvePublisherPhone(authorId, originalMessage, client)
      event.publisherPhone = phone || undefined
    } catch (_) {
      event.publisherPhone = undefined
    }
  } else {
    event.publisherPhone = undefined
  }

  // Media is only from the WhatsApp message attachment (Cloudinary); set here, not by AI
  event.media = cloudinaryUrl ? [cloudinaryUrl] : []

  return event
}

// ─── AI Call #1: Classification ─────────────────────────────────────────────

export async function callOpenAIForClassification(messageText, cloudinaryUrl) {
  const dateCtx = getDateTimeContext()
  const hasImage = isImageUrl(cloudinaryUrl)

  const systemPrompt = `You are a message classification assistant for a Hebrew community events calendar.
Determine if a WhatsApp message describes a SPECIFIC event and extract search key phrases.

${dateCtx}

RULES:
1. An event MUST have a SPECIFIC calendar date (day+month or full date). Reject relative-only dates ("מחר", "בשבוע הבא") and recurring schedules ("כל יום שני").
2. An event MUST describe a specific gathering, activity, or happening — not business hours, menus, or ads.
3. If the message text has no date, and an image is provided, check the image for dates. If still none, reject.
4. Extract 3-5 Hebrew search key phrases (location, event type, date references, venue names).

EXAMPLE:
Message: "הופעה של עידן רייכל ב-25 לפברואר בהיכל התרבות חיפה, כרטיסים מ-120 ₪"
→ { "isEvent": true, "searchKeys": ["עידן רייכל", "היכל התרבות", "חיפה", "הופעה", "פברואר"], "reason": null }

Message: "שעות פתיחה: א-ה 9:00-17:00"
→ { "isEvent": false, "searchKeys": [], "reason": "business_hours_no_specific_date" }`

  let userContent
  if (hasImage) {
    userContent = [
      { type: 'text', text: `Classify this WhatsApp message:\n\n${messageText || '(no text – check the image)'}` },
      { type: 'image_url', image_url: { url: cloudinaryUrl } },
    ]
  } else {
    userContent = `Classify this WhatsApp message:\n\n${messageText || '(empty)'}`
  }

  for (let attempt = 1; attempt <= MAX_OPENAI_ATTEMPTS; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_schema', json_schema: CLASSIFICATION_SCHEMA },
        max_tokens: 400,
        temperature: 0.1,
      })

      const content = response.choices[0]?.message?.content
      if (!content) return null

      const result = JSON.parse(content)
      return {
        isEvent: result.isEvent,
        searchKeys: result.searchKeys || [],
        reason: result.reason || null,
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Classification API error (attempt ${attempt}/${MAX_OPENAI_ATTEMPTS}): ${errorMsg}`)
      if (attempt < MAX_OPENAI_ATTEMPTS && isRetryableOpenAIError(error)) {
        const delay = getRetryDelayMs(error, attempt - 1)
        logger.info(LOG_PREFIXES.EVENT_SERVICE, `OpenAI ${error?.status || 'error'}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_OPENAI_ATTEMPTS})`)
        await sleep(delay)
      } else {
        return null
      }
    }
  }
  return null
}

// ─── AI Call #2: Extraction ─────────────────────────────────────────────────

export async function callOpenAIForExtraction(messageText, cloudinaryUrl, categoriesList) {
  const dateCtx = getDateTimeContext()
  const hasImage = isImageUrl(cloudinaryUrl)
  const categoriesText = categoriesList.map(c => `- ${c.id}: ${c.label}`).join('\n')
  const allUrls = extractUrlsFromText(messageText)

  const systemPrompt = `You are an event extraction assistant for a Hebrew community calendar.
Extract structured event data from a WhatsApp message. Return ONLY data that is EXPLICITLY stated in the message or image — never guess or infer.

${dateCtx}

TIMEZONE RULE (CRITICAL):
All times in messages are in Israel local time (${dateCtx.includes('UTC+3') ? 'UTC+3' : 'UTC+2'}).
You MUST convert them to UTC before putting them in startTime / endTime. Never put the local hour unchanged into the UTC string — subtract the offset.
Examples: message "20:00" Israel, offset UTC+2 → startTime "…T18:00:00.000Z". Message "17:30" Israel, offset UTC+2 → startTime "…T15:30:00.000Z".
If the message mentions multiple times (e.g. activity at 17:30, lecture at 18:30), use the time when the main event actually starts. Interpret Hebrew like "8 בערב" as 20:00 Israel local, then convert that to UTC for startTime.

ALL-DAY RULE (date but no time):
If the message has a calendar DATE but NO explicit time (e.g. "יום שישי 7.3 פיקניק"), set occurrence.hasTime to false.
Then set occurrence.startTime to that date at Israel local 00:00 (midnight) converted to UTC (e.g. for 2026-03-07 with UTC+2 → "2026-03-06T22:00:00.000Z"), and occurrence.endTime to null.

ALLOWED CATEGORIES:
${categoriesText}

FIELD RULES:
- Title: Event name ONLY. No price, no date, no location.
- shortDescription: What the event is about. No price, no date, no location.
- fullDescription: Keep the message body as close as possible to the original. Preserve all formatting (line breaks, *bold*, spacing, bullets, etc.). You may fix obvious typos, clarify unclear phrases, or add minimal context if needed. Remove only: raw URLs (they are in urls), and any redundant text that merely repeats link/registration info already in urls. Do not summarize or shorten; the result should read like the original with at most light edits.
- location.City: NORMALIZED city/town name (e.g. "תל אביב" even if message says "ת"א"). Use standard Hebrew spelling. If not found, use "".
- location.CityEvidence: The VERBATIM snippet from the message/image that indicates the city (e.g. "ת"א" or "חיפה"). Required for verification. null only if no city is mentioned at all.
- location.addressLine1: Venue/place name only — if explicitly stated. Otherwise null.
- location.addressLine2: Street address only — if explicitly stated. Otherwise null.
- location.locationDetails: ONLY practical navigation/arrival instructions (e.g. "ימינה בכיכר הגדולה, מול הבית הצהוב" or "לשים בוויז בית השאנטי כדי להגיע"). NOT descriptions of the place (e.g. "מקום יפהפה ומואר" is NOT locationDetails). null if none.
- location.wazeNavLink: Waze URL found in message text. Otherwise null.
- location.gmapsNavLink: Google Maps URL found in message text. Otherwise null.
- price: Entrance/entry fee ONLY. 0 if free is explicitly stated. null if not mentioned or unclear. Ignore food/merch prices.
- occurrence.hasTime: true if a specific time is mentioned; false if only a date is given (all-day event).
- occurrence.startTime: ISO UTC string. If hasTime true: convert stated time from Israel local. If hasTime false: use event date at Israel local 00:00 converted to UTC.
- occurrence.endTime: ISO UTC string or null.
- media: Always return an empty array []. Media (images from the message) are added by the system from the actual WhatsApp attachment only. Do NOT put links or URLs here; links go in urls.
- urls: Array of {Title, Url} for links found in the message.

IMAGE RULES:
- Message text is PRIMARY source.
- Image is SECONDARY — use only if text is clearly readable with high confidence.
- If image is blurry or ambiguous, ignore it.

EXAMPLE:
Message: "🎶 ערב מוזיקה אתיופית - 25/02 בשעה 20:00\nמתחם שוק תלפיות, חיפה\nכניסה: 30 ₪\nhttps://ul.waze.com/ul?place=abc"
→ {
  "Title": "ערב מוזיקה אתיופית",
  "shortDescription": "ערב של מוזיקה אתיופית",
  "fullDescription": "🎶 ערב מוזיקה אתיופית...",
  "categories": ["music"],
  "mainCategory": "music",
  "location": { "City": "חיפה", "CityEvidence": "חיפה", "addressLine1": "מתחם שוק תלפיות", "addressLine2": null, "locationDetails": null, "wazeNavLink": "https://ul.waze.com/ul?place=abc", "gmapsNavLink": null },
  "price": 30,
  "occurrence": { "hasTime": true, "startTime": "2026-02-25T18:00:00.000Z", "endTime": null },
  "media": [],
  "urls": [{ "Title": "ניווט Waze", "Url": "https://ul.waze.com/ul?place=abc" }]
}`

  let userContent
  if (hasImage) {
    userContent = [
      { type: 'text', text: `Extract event from this WhatsApp message:\n\n${messageText || '(no text — check image)'}\n\nLinks found: ${allUrls.length > 0 ? allUrls.join(', ') : '(none)'}` },
      { type: 'image_url', image_url: { url: cloudinaryUrl } },
    ]
  } else {
    userContent = `Extract event from this WhatsApp message:\n\n${messageText || '(empty)'}\n\nLinks found: ${allUrls.length > 0 ? allUrls.join(', ') : '(none)'}`
  }

  for (let attempt = 1; attempt <= MAX_OPENAI_ATTEMPTS; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_schema', json_schema: EXTRACTION_SCHEMA },
        max_tokens: config.openai.maxTokens,
        temperature: 0.1,
      })

      const content = response.choices[0]?.message?.content
      if (!content) return null

      return JSON.parse(content)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Extraction API error (attempt ${attempt}/${MAX_OPENAI_ATTEMPTS}): ${errorMsg}`)
      if (attempt < MAX_OPENAI_ATTEMPTS && isRetryableOpenAIError(error)) {
        const delay = getRetryDelayMs(error, attempt - 1)
        logger.info(LOG_PREFIXES.EVENT_SERVICE, `OpenAI ${error?.status || 'error'}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_OPENAI_ATTEMPTS})`)
        await sleep(delay)
      } else {
        return null
      }
    }
  }
  return null
}

// ─── AI Call #3: Comparison (only when candidates exist) ────────────────────

export async function callOpenAIForComparison(extractedEvent, messageText, candidates) {
  const candidatesText = candidates.map((c, i) => {
    const id = c._id.toString()
    const text = c.rawMessage?.text || '(no text)'
    const title = c.event?.Title || '(no title)'
    const city = c.event?.location?.City || ''
    const start = c.event?.occurrence?.startTime || ''
    return `Candidate ${i + 1}:\nID: ${id}\nTitle: ${title}\nCity: ${city}\nStartTime: ${start}\nMessage: ${text}`
  }).join('\n\n')

  const systemPrompt = `You are an event comparison assistant. Given a newly extracted event and a list of candidate events from the database, decide if the new event is:
- "new_event": Different event (different name, location, date, or type) OR no match
- "existing_event": Same event, no meaningful changes (just a repost)
- "updated_event": Same event, but with changes to price, dates, links, location details, or description

Two events are the SAME only if ALL match: similar title, same city, same category type, same or very close date.

If "existing_event" or "updated_event", provide the matchedCandidateId.
Provide a short reason for your decision.

EXAMPLE:
New event title "ערב מוזיקה אתיופית" in חיפה on 2026-02-25, and candidate has title "ערב מוזיקה אתיופית" in חיפה on 2026-02-25 → "existing_event"
Same but candidate price was 30 and new message says 50 → "updated_event"
New event is "סדנת קרמיקה" but candidate is "ערב מוזיקה" → "new_event"`

  const userContent = `NEW EVENT:
Title: ${extractedEvent.Title}
City: ${extractedEvent.location?.City || '(none)'}
StartTime: ${extractedEvent.occurrence?.startTime || '(none)'}
Categories: ${(extractedEvent.categories || []).join(', ')}
Message text: ${messageText || '(empty)'}

CANDIDATES:
${candidatesText}

Decide: new_event, existing_event, or updated_event?`

  for (let attempt = 1; attempt <= MAX_OPENAI_ATTEMPTS; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_schema', json_schema: COMPARISON_SCHEMA },
        max_tokens: 300,
        temperature: 0.1,
      })

      const content = response.choices[0]?.message?.content
      if (!content) return null

      return JSON.parse(content)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Comparison API error (attempt ${attempt}/${MAX_OPENAI_ATTEMPTS}): ${errorMsg}`)
      if (attempt < MAX_OPENAI_ATTEMPTS && isRetryableOpenAIError(error)) {
        const delay = getRetryDelayMs(error, attempt - 1)
        logger.info(LOG_PREFIXES.EVENT_SERVICE, `OpenAI ${error?.status || 'error'}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_OPENAI_ATTEMPTS})`)
        await sleep(delay)
      } else {
        return null
      }
    }
  }
  return null
}

// ─── URL extraction helper ──────────────────────────────────────────────────

function extractUrlsFromText(text) {
  if (!text) return []
  const urlRegex = /https?:\/\/[^\s]+/g
  return [...new Set(text.match(urlRegex) || [])]
}

// ─── Pipeline helpers ───────────────────────────────────────────────────────

function validatePipelineInputs(eventId, rawMessage, cloudinaryUrl, cloudinaryData) {
  if (!eventId) { logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Missing eventId'); return false }
  if (!rawMessage || typeof rawMessage !== 'object') { logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid rawMessage'); return false }
  if (cloudinaryUrl !== null && typeof cloudinaryUrl !== 'string') { logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid cloudinaryUrl'); return false }
  if (cloudinaryData !== null && (typeof cloudinaryData !== 'object' || Array.isArray(cloudinaryData))) { logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid cloudinaryData'); return false }
  return true
}

// ─── Sub-handlers ───────────────────────────────────────────────────────────

async function handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, event, originalMessage, client, messagePreview) {
  logger.info(LOG_PREFIXES.EVENT_SERVICE, 'Handling new event — enriching and saving')
  try {
    const authorId = rawMessage.author || null
    const enrichedEvent = await enrichEvent(event, authorId, cloudinaryUrl, originalMessage, client)

    const updated = await updateEventDocument(eventId, enrichedEvent)
    if (updated) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, 'New event saved successfully')
      await sendEventConfirmation(messagePreview, CONFIRMATION_REASONS.NEW_EVENT)
    } else {
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.DATABASE_ERROR)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Error saving new event: ${errorMsg}`)
    const reason = errorMsg.includes('enrich') || errorMsg.includes('Invalid event') ? CONFIRMATION_REASONS.ENRICHMENT_ERROR : CONFIRMATION_REASONS.DATABASE_ERROR
    await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason)
  }
}

async function handleUpdatedEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, matchedCandidateId, event, originalMessage, client, messagePreview) {
  logger.info(LOG_PREFIXES.EVENT_SERVICE, 'Handling updated event')

  let matchedId
  try {
    matchedId = typeof matchedCandidateId === 'string' ? new ObjectId(matchedCandidateId) : matchedCandidateId
  } catch (_) {
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Invalid matchedCandidateId: ${matchedCandidateId}`)
    await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED)
    return
  }

  const matchedDoc = await getEventDocument(matchedId)
  if (!matchedDoc) {
    logger.warn(LOG_PREFIXES.EVENT_SERVICE, `Matched candidate ${matchedCandidateId} not found — treating as new`)
    await handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, event, originalMessage, client, messagePreview)
    return
  }

  await appendToPreviousVersions(matchedId, {
    event: matchedDoc.event || null,
    rawMessage: matchedDoc.rawMessage || null,
    cloudinaryUrl: matchedDoc.cloudinaryUrl || null,
    cloudinaryData: matchedDoc.cloudinaryData || null,
    timestamp: matchedDoc.updatedAt || matchedDoc.createdAt || new Date(),
  })

  try {
    const authorId = rawMessage.author || null
    const enrichedEvent = await enrichEvent(event, authorId, cloudinaryUrl, originalMessage, client)
    const updated = await updateEventWithNewData(matchedId, enrichedEvent, rawMessage, cloudinaryUrl, cloudinaryData)

    if (updated) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Updated event ${matchedCandidateId}`)
      await deleteEventDocument(eventId)
      await sendEventConfirmation(messagePreview, CONFIRMATION_REASONS.UPDATED_EVENT)
    } else {
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.DATABASE_ERROR)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Error updating event: ${errorMsg}`)
    const reason = errorMsg.includes('enrich') || errorMsg.includes('Invalid event') ? CONFIRMATION_REASONS.ENRICHMENT_ERROR : CONFIRMATION_REASONS.DATABASE_ERROR
    await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason)
  }
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

/**
 * Main event processing pipeline.
 * Flow: Classify → Extract → (Compare if candidates) → Programmatic validation → Enrich → Save
 */
export async function processEventPipeline(eventId, rawMessage, cloudinaryUrl, cloudinaryData, originalMessage, client) {
  const messageId = extractMessageId(rawMessage)

  try {
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Pipeline start for ${messageId}`)

    if (!validatePipelineInputs(eventId, rawMessage, cloudinaryUrl, cloudinaryData)) return

    const messageText = rawMessage.text || ''
    const messagePreview = messageText.substring(0, 20) || '(no text)'

    // Skip empty messages
    if (!messageText.trim()) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Skipping ${messageId} — no text`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.NO_TEXT)
      return
    }

    // ── AI Call #1: Classification ──
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `[Call 1/Classify] ${messageId}`)
    const classification = await callOpenAIForClassification(messageText, cloudinaryUrl)

    if (!classification) {
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.AI_CLASSIFICATION_FAILED)
      return
    }

    if (!classification.isEvent) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Not an event (${classification.reason}) — ${messageId}`)
      const reason = classification.reason?.includes('date') ? CONFIRMATION_REASONS.NO_DATE : CONFIRMATION_REASONS.NOT_EVENT
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason)
      return
    }

    // ── Candidate search ──
    const searchKeys = validateSearchKeys(classification.searchKeys) ? classification.searchKeys : []
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Searching candidates with ${searchKeys.length} key(s) for ${messageId}`)
    const candidates = await findCandidateEvents(searchKeys, eventId)

    // ── AI Call #2: Extraction ──
    const categoriesList = getCategoriesList()
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `[Call 2/Extract] ${messageId}`)
    const extractedEvent = await callOpenAIForExtraction(messageText, cloudinaryUrl, categoriesList)

    if (!extractedEvent) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Extraction failed for ${messageId}`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.AI_COMPARISON_FAILED)
      return
    }

    // ── Programmatic validation ──
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `[Validate] ${messageId}`)
    const { event: validatedEvent, corrections } = validateEventProgrammatic(extractedEvent, messageText, categoriesList)

    if (!validatedEvent) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Validation failed for ${messageId}: ${corrections.join('; ')}`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED)
      return
    }

    if (corrections.length > 0) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Corrections (${corrections.length}): ${corrections.join('; ')}`)
    }

    // ── Structure check ──
    const structureCheck = validateEventStructure(validatedEvent)
    if (!structureCheck.valid) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Structure invalid after validation: ${structureCheck.reason}`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED)
      return
    }

    // ── No candidates → save as new ──
    if (!candidates || candidates.length === 0) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `No candidates — new event for ${messageId}`)
      await handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, validatedEvent, originalMessage, client, messagePreview)
      return
    }

    // ── AI Call #3: Comparison ──
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `[Call 3/Compare] ${messageId} vs ${candidates.length} candidate(s)`)
    const comparison = await callOpenAIForComparison(validatedEvent, messageText, candidates)

    if (!comparison) {
      logger.warn(LOG_PREFIXES.EVENT_SERVICE, `Comparison failed — treating as new for ${messageId}`)
      await handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, validatedEvent, originalMessage, client, messagePreview)
      return
    }

    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Comparison: ${comparison.status} (${comparison.reason})`)

    if (comparison.status === 'existing_event') {
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.ALREADY_EXISTING)
      return
    }

    if (comparison.status === 'updated_event' && comparison.matchedCandidateId) {
      await handleUpdatedEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, comparison.matchedCandidateId, validatedEvent, originalMessage, client, messagePreview)
      return
    }

    // new_event or fallback
    await handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, validatedEvent, originalMessage, client, messagePreview)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Pipeline error for ${messageId}: ${errorMsg}`)
    const messagePreview = (rawMessage?.text || '').substring(0, 20) || '(error)'
    try { await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.PIPELINE_ERROR) } catch (_) { /* already logged */ }
  }
}

