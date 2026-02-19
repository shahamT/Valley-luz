import { openai } from './openai.service.js'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { extractMessageId } from '../utils/messageHelpers.js'
import { LOG_PREFIXES } from '../consts/index.js'
import { getCategoriesList, getDateTimeContext, isImageUrl } from '../consts/events.const.js'
import { resolvePublisherPhone } from '../utils/contactHelpers.js'
import { updateEventDocument, deleteEventDocument, findCandidateEvents } from './mongo.service.js'
import { sendEventConfirmation, CONFIRMATION_REASONS } from '../utils/messageSender.js'
import { deleteMediaFromCloudinary } from './cloudinary.service.js'
import { convertMessageToHtml } from '../utils/whatsappFormatToHtml.js'

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
  occurrences: {
    type: 'array',
    minItems: 1,
    items: {
      type: 'object',
      required: ['date', 'hasTime', 'startTime', 'endTime'],
      additionalProperties: false,
      properties: {
        date: { type: 'string' },
        hasTime: { type: 'boolean' },
        startTime: { type: 'string' },
        endTime: { type: ['string', 'null'] },
      },
    },
  },
  justifications: {
    type: 'object',
    required: ['date', 'location', 'startTime', 'endTime', 'price'],
    additionalProperties: false,
    properties: {
      date: { type: 'string' },
      location: { type: 'string' },
      startTime: { type: 'string' },
      endTime: { type: 'string' },
      price: { type: 'string' },
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

/** Normalized phrase for justifications when a field has no source in message or image. */
const NOT_STATED_JUSTIFICATION = 'Not stated in message or image.'

function isNotStatedJustification(str) {
  return typeof str === 'string' && str.trim().toLowerCase() === NOT_STATED_JUSTIFICATION.toLowerCase()
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
  if (!Array.isArray(event.occurrences) || event.occurrences.length === 0) return { valid: false, reason: 'Missing or empty occurrences' }
  for (let i = 0; i < event.occurrences.length; i++) {
    const occ = event.occurrences[i]
    if (!occ || typeof occ !== 'object') return { valid: false, reason: `occurrences[${i}] is not an object` }
    if (typeof occ.date !== 'string' || !occ.date.trim()) return { valid: false, reason: `occurrences[${i}].date missing or empty` }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occ.date.trim().slice(0, 10))) return { valid: false, reason: `occurrences[${i}].date must be YYYY-MM-DD` }
    if (typeof occ.hasTime !== 'boolean') return { valid: false, reason: `occurrences[${i}].hasTime missing or not boolean` }
    if (typeof occ.startTime !== 'string' || !occ.startTime.trim()) return { valid: false, reason: `occurrences[${i}].startTime missing or empty` }
  }
  const justKeys = ['date', 'location', 'startTime', 'endTime', 'price']
  if (!event.justifications || typeof event.justifications !== 'object') return { valid: false, reason: 'Missing justifications' }
  for (const k of justKeys) {
    if (typeof event.justifications[k] !== 'string') return { valid: false, reason: `Missing or invalid justifications.${k}` }
  }
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
 * Returns YYYY-MM-DD in Israel (Asia/Jerusalem) for an ISO UTC string.
 * @param {string} isoString - ISO UTC date-time string
 * @returns {string|null} YYYY-MM-DD or null
 */
function getDateInIsraelFromIso(isoString) {
  if (!isoString || typeof isoString !== 'string') return null
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return null
  const parts = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).split('-')
  if (parts.length !== 3) return null
  return `${parts[0]}-${parts[1]}-${parts[2]}`
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

async function cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason, reasonDetail, sourceGroupId, sourceGroupName) {
  if (cloudinaryData?.public_id) {
    try { await deleteMediaFromCloudinary(cloudinaryData.public_id) } catch (_) { /* logged elsewhere */ }
  }
  try { await deleteEventDocument(eventId) } catch (_) { /* logged elsewhere */ }
  const context = {
    eventId: eventId?.toString?.() ?? String(eventId),
    sourceGroupId: sourceGroupId || undefined,
    sourceGroupName: sourceGroupName || undefined,
  }
  try { await sendEventConfirmation(messagePreview, reason, reasonDetail, context) } catch (_) { /* logged elsewhere */ }
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

  if (!Array.isArray(event.occurrences) || event.occurrences.length === 0) {
    return { event: null, corrections: ['Missing or empty occurrences'] }
  }

  // -- Categories --
  const FALLBACK_CATEGORY_ID = 'community_meetup'
  event.categories = (event.categories || []).filter(c => validCatIds.includes(c))
  if (event.categories.length === 0) {
    event.categories = [FALLBACK_CATEGORY_ID]
    event.mainCategory = FALLBACK_CATEGORY_ID
    corrections.push('No valid categories from extraction; assigned community_meetup as fallback')
  } else if (!event.categories.includes(event.mainCategory)) {
    event.mainCategory = event.categories[0]
    corrections.push(`mainCategory corrected to ${event.mainCategory}`)
  }

  // -- Justifications: reject if date has no justification (check first occurrence); per-occurrence: clear to all-day / clear endTime --
  const firstOcc = event.occurrences[0]
  if (firstOcc?.date && typeof firstOcc.date === 'string' && firstOcc.date.trim()) {
    if (isNotStatedJustification(event.justifications?.date)) {
      return { event: null, corrections: ['No justification for calendar date - event rejected'] }
    }
  }
  for (const occ of event.occurrences) {
    if (occ.hasTime === true && occ.startTime) {
      const startDateIsrael = getDateInIsraelFromIso(occ.startTime)
      const isMidnightIsrael = startDateIsrael != null && occ.startTime && (() => {
        const d = new Date(occ.startTime)
        const hrs = parseInt(d.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hour12: false }), 10)
        const min = parseInt(d.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', minute: '2-digit' }), 10)
        return hrs === 0 && min === 0
      })()
      if (!isMidnightIsrael && isNotStatedJustification(event.justifications?.startTime)) {
        occ.hasTime = false
        occ.startTime = israelMidnightToUtcIso(occ.date || occ.startTime)
        occ.endTime = null
        corrections.push('Time of day had no justification - cleared to all-day')
      }
    }
    if (occ.endTime != null && isNotStatedJustification(event.justifications?.endTime)) {
      occ.endTime = null
      corrections.push('endTime had value but no justification - cleared to null')
    }
  }
  if (event.location) {
    const hasLocationData = (event.location.City && String(event.location.City).trim()) ||
      (event.location.addressLine1 && String(event.location.addressLine1).trim()) ||
      (event.location.addressLine2 && String(event.location.addressLine2).trim()) ||
      (event.location.locationDetails && String(event.location.locationDetails).trim())
    if (hasLocationData && isNotStatedJustification(event.justifications?.location)) {
      event.location.City = ''
      event.location.CityEvidence = null
      event.location.addressLine1 = null
      event.location.addressLine2 = null
      event.location.locationDetails = null
      corrections.push('Location had data but no justification - cleared to empty state')
    }
  }
  if (typeof event.price === 'number' && isNotStatedJustification(event.justifications?.price)) {
    event.price = null
    corrections.push('Price had value but no justification - cleared to null')
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

  // -- Date reasonability (per occurrence) --
  for (const occ of event.occurrences) {
    if (occ.startTime) {
      const start = new Date(occ.startTime)
      if (isNaN(start.getTime())) {
        return { event: null, corrections: ['startTime is not a valid date'] }
      }
      const now = new Date()
      const twoYearsFromNow = new Date(now)
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2)
      if (start > twoYearsFromNow) {
        corrections.push(`startTime ${occ.startTime} is more than 2 years in the future - suspicious`)
      }
    }
    if (occ.endTime) {
      const end = new Date(occ.endTime)
      if (isNaN(end.getTime())) {
        occ.endTime = null
        corrections.push('endTime was invalid - cleared')
      }
    }
  }

  // -- Date–startTime consistency: each occurrence.date must match date part of startTime in Israel --
  for (const occ of event.occurrences) {
    if (occ.date && occ.startTime) {
      const expectedDate = (occ.date || '').trim().slice(0, 10)
      const startTimeDateIsrael = getDateInIsraelFromIso(occ.startTime)
      if (expectedDate && startTimeDateIsrael && expectedDate !== startTimeDateIsrael) {
        if (occ.hasTime === false) {
          occ.startTime = israelMidnightToUtcIso(occ.date)
          corrections.push('All-day: startTime normalized to occurrence.date at Israel midnight UTC')
        } else {
          const d = new Date(occ.startTime)
          const h = parseInt(d.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hour12: false }), 10)
          const m = parseInt(d.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', minute: '2-digit' }), 10)
          const timeStr = `${h}:${String(m).padStart(2, '0')}`
          const rebuilt = localTimeIsraelToUtcIso(occ.date, timeStr)
          if (rebuilt) {
            occ.startTime = rebuilt
            corrections.push('startTime date normalized to match occurrence.date')
          }
        }
      }
    }
  }

  // -- All-day rule: for each occurrence with hasTime false, set startTime to Israel midnight UTC and endTime to null --
  for (const occ of event.occurrences) {
    if (occ.hasTime === false && occ.date) {
      const normalized = israelMidnightToUtcIso(occ.date)
      if (normalized !== occ.startTime) {
        corrections.push('All-day event: startTime set to occurrence.date at Israel midnight UTC')
      }
      occ.startTime = normalized
      occ.endTime = null
    } else if (occ.hasTime === false && occ.startTime) {
      const normalized = israelMidnightToUtcIso(occ.startTime)
      if (normalized !== occ.startTime) {
        corrections.push('All-day event: startTime normalized to Israel midnight UTC')
      }
      occ.startTime = normalized
      occ.endTime = null
    }
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
1. An event MUST have a SPECIFIC calendar date (day+month or full date, e.g. 19.2, 25/02). Reject relative-only dates: "היום", "מחר", "בשבוע הבא", etc. Reject recurring-only schedules: when the only date info is weekdays (e.g. "ימי ראשון", "ימי שני", "כל יום שני") with no specific calendar date, set isEvent to false (e.g. reason: "recurring_schedule_no_specific_date").
2. An event MUST describe a specific gathering, activity, or happening — not business hours, menus, or ads.
3. If the message text has no date, and an image is provided, check the image for dates. If still none, reject.
4. The message must describe ONE specific event. If it describes more than one distinct event (e.g. a listing or roundup with several events, each with its own date, venue, or name), set isEvent to false and reason to "multiple_events". We only process single-event messages.
5. Extract 3-5 Hebrew search key phrases (location, event type, date references, venue names).

EXAMPLE:
Message: "הופעה של עידן רייכל ב-25 לפברואר בהיכל התרבות חיפה, כרטיסים מ-120 ₪"
→ { "isEvent": true, "searchKeys": ["עידן רייכל", "היכל התרבות", "חיפה", "הופעה", "פברואר"], "reason": null }

Message: "שעות פתיחה: א-ה 9:00-17:00"
→ { "isEvent": false, "searchKeys": [], "reason": "business_hours_no_specific_date" }

Message with "19.2 | Event A | Venue 1" and "20-21.2 | Event B | Venue 2" (two or more distinct events)
→ { "isEvent": false, "searchKeys": [], "reason": "multiple_events" }

Message with only "היום ב7 בערב" (today at 7 PM) and no calendar date
→ { "isEvent": false, "searchKeys": [], "reason": "relative_date_no_calendar" }

Message with only "ימי ראשון ... ימי שני" (Sundays ... Mondays) and no specific calendar date
→ { "isEvent": false, "searchKeys": [], "reason": "recurring_schedule_no_specific_date" }`

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
  const messageBodyHtml = convertMessageToHtml(messageText || '')

  const systemPrompt = `You are an event extraction assistant for a Hebrew community calendar.
Extract structured event data from a WhatsApp message. Return ONLY data that is EXPLICITLY stated in the message or image — never guess or infer.

${dateCtx}

TIMEZONE RULE (CRITICAL):
All times in messages are in Israel local time (${dateCtx.includes('UTC+3') ? 'UTC+3' : 'UTC+2'}).
You MUST convert them to UTC before putting them in startTime / endTime. For each entry in occurrences, never put the local hour unchanged into the UTC string — subtract the offset.
Examples: message "20:00" Israel, offset UTC+2 → startTime "…T18:00:00.000Z". Message "17:30" Israel, offset UTC+2 → startTime "…T15:30:00.000Z".
If the message mentions multiple times (e.g. activity at 17:30, lecture at 18:30), use the time when the main event actually starts. Interpret Hebrew like "8 בערב" as 20:00 Israel local, then convert that to UTC for startTime.

ALL-DAY RULE (date but no time):
If the message has a calendar DATE but NO explicit time (e.g. "יום שישי 7.3 פיקניק"), set hasTime to false for that occurrence.
Then set startTime to that date at Israel local 00:00 (midnight) converted to UTC (e.g. for 2026-03-07 with UTC+2 → "2026-03-06T22:00:00.000Z"), and endTime to null.

OCCURRENCES (REQUIRED):
- occurrences: An array of one or more occurrence objects. Each object has date, hasTime, startTime, endTime.
- Single-day event: Return exactly one object in occurrences, e.g. [{ "date": "2026-02-25", "hasTime": true, "startTime": "2026-02-25T18:00:00.000Z", "endTime": null }].
- Multi-day event (e.g. "7–9 במרץ", "שישי-שבת 7-8.3", "פסטיבל 20–22.2"): Return one object per calendar day. Each object has that day's date (YYYY-MM-DD Israel), and the same hasTime/startTime/endTime rules. If the event is all-day on each day, use that date at Israel midnight → UTC for startTime and endTime null for each. If specific times are stated per day, set each occurrence accordingly.

ALLOWED CATEGORIES:
${categoriesText}

CATEGORIES RULE (REQUIRED):
- categories and mainCategory MUST use only the exact category ids from the list above (e.g. party, music, workshop). Never use the label text or invent new ids.
- You MUST assign at least one category that fits the event. If the event clearly fits one of the listed types, choose the best-matching id.
- Mapping examples (use these ids): dance / ריקוד / אקסטטיק דאנס / מסיבה → party; תנועה / ספורט → sport; מוזיקה / הופעה → music or show; סדנה / סדנא → workshop; מפגש קהילתי → community_meetup; טיול / טבע → nature; הרצאה → lecture. When in doubt between two, pick the best fit and include it.

FIELD RULES:
The message body you receive is in HTML format. For Title, shortDescription, location, price, dates, and all other fields: extract from the text content; ignore HTML tags.

ACCURACY (date, location, price, time): Use only information explicitly stated in the message or clearly readable in the image. Do not infer or guess. If not clearly stated or readable, set the field to null (or empty string for location.City). When the date appears only in the image (e.g. "17/2", "יום שלישי 17/2"), use that date for each occurrence's date and startTime and cite the image in justifications. For each entry in occurrences: date is YYYY-MM-DD (Israel); startTime is built from that date plus time (Israel) converted to UTC.

- Title: Event name ONLY. No price. No date or time or when — strip from the title: מחר, בשבוע הבא, day names (e.g. יום שלישי), numeric dates (e.g. 17/2), times (e.g. בשעה 20:00). Location is allowed only when the advertiser presents it as part of the event name (e.g. "פסטיבל הגולן", "חן מזרחי מגיע לצפון הגולן"); do not add location if it appears only as a separate detail (e.g. "בחיפה" in another sentence).
- shortDescription: What the event is about. No price, no date, no location.
- fullDescription: When relevant, preserve the provided HTML if it supprts the readability and clarity of info. Use only these tags: <p>, <br>, <strong>, <em>, <del>, <code>, <pre>, <blockquote>, <ul>, <ol>, <li>. No other tags (no div, span, a, script, etc.). Do not re-interpret or strip formatting; keep the structure. You may fix obvious typos (e.g. "הרצאטבע" → "הרצאת טבע"). ALWAYS REMOVE from fullDescription: (1) Every raw URL (they go in urls). (2) The label/title text for each extracted link when it appears attached to that link in the message — for each entry in urls, remove both the URL and the phrase you used as that entry's Title when they appear together (e.g. "כרטיסים אחרונים" next to the URL); remove any arrow/symbol that only links them. The link and its title live in urls only; do not duplicate them in fullDescription. KEEP in fullDescription: Generic phrases that do not repeat a specific link or its title (e.g. "כרטיסים למטה בלינק", "בקישור המצורף", "כרטיסים והרשמה - בקישור המצורף"). NEVER REMOVE: Emojis; taglines or context lines; other event content. Do not summarize or shorten. Before returning, verify: no URL in urls appears in fullDescription, and no link title (urls[].Title) that was the label for that link in the message appears in fullDescription. Output must be HTML only; do not output raw * _ backtick or ~ (input is already HTML).
- fullDescription examples: REMOVE "כרטיסים אחרונים" and the URL when they appear together and you extracted that link to urls with Title "כרטיסים אחרונים". KEEP "כרטיסים למטה בלינק" or "בקישור המצורף" when they are generic and do not repeat the link. KEEP "כרטיסים והרשמה - בקישור המצורף" even when a link follows.
- location.City: NORMALIZED city/town name (e.g. "תל אביב" even if message says "ת"א"). Use standard Hebrew spelling. If not found, use "".
- location.CityEvidence: The VERBATIM snippet from the message/image that indicates the city (e.g. "ת"א" or "חיפה"). Required for verification. null only if no city is mentioned at all.
- location.addressLine1: Venue/place name only — if explicitly stated. Otherwise null.
- location.addressLine2: Street address only — if explicitly stated. Otherwise null.
- location.locationDetails: ONLY practical navigation/arrival instructions (e.g. "ימינה בכיכר הגדולה, מול הבית הצהוב" or "לשים בוויז בית השאנטי כדי להגיע"). NOT descriptions of the place (e.g. "מקום יפהפה ומואר" is NOT locationDetails). null if none.
- location.wazeNavLink: Waze URL found in message text. Otherwise null.
- location.gmapsNavLink: Google Maps URL found in message text. Otherwise null.
- price: Event/entrance price (what attendees pay to participate). Usually when a price appears in the message it is the event price — it does not need to appear next to כניסה, מחיר כניסה, or דמי כניסה. Ignore a price only when it is clearly the price of items sold at the event (e.g. costumes — תחפושות ב-X, מכירת תחפושות ב-X; food — פופקורן, דוכני אוכל; merchandise). In that case do not use that number; if no other price is given, set price to null. 0 if free is explicitly stated. null if no price is mentioned or unclear.
- occurrences: Array of occurrence objects. Each object has:
  - date: REQUIRED. YYYY-MM-DD (Israel local calendar date). Must match the date used for startTime when startTime is converted to Israel local.
  - hasTime: true if a specific time is mentioned; false if only a date is given (all-day event).
  - startTime: ISO UTC string. If hasTime true: combine date with stated time (Israel local), convert to UTC. If hasTime false: date at Israel local 00:00 converted to UTC.
  - endTime: ISO UTC string or null.
- media: Always return an empty array []. Media (images from the message) are added by the system from the actual WhatsApp attachment only. Do NOT put links or URLs here; links go in urls.
- urls: Array of {Title, Url} for links found in the message.
- justifications: For each key state source (text or image) and the exact snippet. If from image, quote the relevant text as read from the image; if from message, quote the relevant part of the message. If from multiple places, list them. When a field has no source in message or image, you MUST use exactly this phrase (no variants): "Not stated in message or image."
  - justifications.date: Source and exact snippet for the CALENDAR DATE only (e.g. "Text: '25/02'", "Image: '17/2'", "Text: 'יום שלישי 17/2'"). If no date in message or image, use exactly: "Not stated in message or image."
  - justifications.location: Source and exact snippet(s). If null/empty location, use exactly: "Not stated in message or image."
  - justifications.startTime: Source and exact snippet for the TIME OF DAY only (e.g. "Text: 'ב 20:00'", "Text: 'החל משעה 17:00'"). If no time or all-day event, use exactly: "Not stated in message or image."
  - justifications.endTime: Source and snippet(s), or exactly: "Not stated in message or image."
  - justifications.price: Source and snippet(s), or exactly: "Not stated in message or image."

IMAGE RULES:
- Message text is PRIMARY source.
- Image is SECONDARY — use only if text is clearly readable with high confidence.
- If image is blurry or ambiguous, ignore it.
- When text in the image contains date, time, location, or price, use it and cite it in justifications (e.g. "Image: 'יום שלישי 17/2, 17:00'").

EXAMPLE:
Message: "🎶 ערב מוזיקה אתיופית - 25/02 בשעה 20:00\nמתחם שוק תלפיות, חיפה\nכניסה: 30 ₪\nhttps://ul.waze.com/ul?place=abc"
→ {
  "Title": "ערב מוזיקה אתיופית",
  "shortDescription": "ערב של מוזיקה אתיופית",
  "fullDescription": "<p>🎶 ערב מוזיקה אתיופית - 25/02 בשעה 20:00</p><p>מתחם שוק תלפיות, חיפה</p><p>כניסה: 30 ₪</p>",
  "categories": ["music"],
  "mainCategory": "music",
  "location": { "City": "חיפה", "CityEvidence": "חיפה", "addressLine1": "מתחם שוק תלפיות", "addressLine2": null, "locationDetails": null, "wazeNavLink": "https://ul.waze.com/ul?place=abc", "gmapsNavLink": null },
  "price": 30,
  "occurrences": [{ "date": "2026-02-25", "hasTime": true, "startTime": "2026-02-25T18:00:00.000Z", "endTime": null }],
  "media": [],
  "urls": [{ "Title": "ניווט Waze", "Url": "https://ul.waze.com/ul?place=abc" }],
  "justifications": {
    "date": "Text: '25/02'",
    "location": "Text: 'מתחם שוק תלפיות, חיפה'",
    "startTime": "Text: 'בשעה 20:00'",
    "endTime": "Not stated in message or image.",
    "price": "Text: 'כניסה: 30 ₪'"
  }
}`

  let userContent
  if (hasImage) {
    userContent = [
      { type: 'text', text: `Extract event from this WhatsApp message (message body below is already in HTML):\n\n${messageBodyHtml || '(no text — check image)'}\n\nLinks found: ${allUrls.length > 0 ? allUrls.join(', ') : '(none)'}` },
      { type: 'image_url', image_url: { url: cloudinaryUrl } },
    ]
  } else {
    userContent = `Extract event from this WhatsApp message (message body below is already in HTML):\n\n${messageBodyHtml || '(empty)'}\n\nLinks found: ${allUrls.length > 0 ? allUrls.join(', ') : '(none)'}`
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
    const occ = c.event?.occurrences?.[0]
    const date = occ?.date || '(none)'
    const start = occ?.startTime || ''
    return `Candidate ${i + 1}:\nID: ${id}\nTitle: ${title}\nCity: ${city}\nDate: ${date}\nStartTime: ${start}\nMessage: ${text}`
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

  const extractedOcc = extractedEvent.occurrences?.[0]
  const userContent = `NEW EVENT:
Title: ${extractedEvent.Title}
City: ${extractedEvent.location?.City || '(none)'}
Date: ${extractedOcc?.date || '(none)'}
StartTime: ${extractedOcc?.startTime || '(none)'}
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

async function handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, event, originalMessage, client, messagePreview, sourceGroupId, sourceGroupName) {
  logger.info(LOG_PREFIXES.EVENT_SERVICE, 'Handling new event — enriching and saving')
  const context = {
    eventId: eventId?.toString?.() ?? String(eventId),
    sourceGroupId: sourceGroupId || undefined,
    sourceGroupName: sourceGroupName || undefined,
  }
  try {
    const authorId = rawMessage.author || null
    const enrichedEvent = await enrichEvent(event, authorId, cloudinaryUrl, originalMessage, client)

    const updated = await updateEventDocument(eventId, enrichedEvent)
    if (updated) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, 'New event saved successfully')
      await sendEventConfirmation(messagePreview, CONFIRMATION_REASONS.NEW_EVENT, undefined, context)
    } else {
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.DATABASE_ERROR, undefined, sourceGroupId, sourceGroupName)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Error saving new event: ${errorMsg}`)
    const reason = errorMsg.includes('enrich') || errorMsg.includes('Invalid event') ? CONFIRMATION_REASONS.ENRICHMENT_ERROR : CONFIRMATION_REASONS.DATABASE_ERROR
    await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason, undefined, sourceGroupId, sourceGroupName)
  }
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

/**
 * Main event processing pipeline.
 * Flow: Classify → Extract → (Compare if candidates) → Programmatic validation → Enrich → Save
 */
export async function processEventPipeline(eventId, rawMessage, cloudinaryUrl, cloudinaryData, originalMessage, client) {
  const messageId = extractMessageId(rawMessage)
  let sourceGroupId = null
  let sourceGroupName = null

  try {
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Pipeline start for ${messageId}`)

    if (!validatePipelineInputs(eventId, rawMessage, cloudinaryUrl, cloudinaryData)) return

    const messageText = rawMessage.text || ''
    const messagePreview = messageText.substring(0, 20) || '(no text)'

    const remoteJid = originalMessage?.key?.remoteJid
    if (remoteJid && typeof remoteJid === 'string' && remoteJid.endsWith('@g.us')) {
      sourceGroupId = remoteJid
      if (client) {
        try {
          const meta = await client.groupMetadata(sourceGroupId)
          sourceGroupName = meta.subject || null
        } catch (_) { /* ignore */ }
      }
    }

    // Skip empty messages
    if (!messageText.trim()) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Skipping ${messageId} — no text`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.NO_TEXT, undefined, sourceGroupId, sourceGroupName)
      return
    }

    // ── AI Call #1: Classification ──
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `[Call 1/Classify] ${messageId}`)
    const classification = await callOpenAIForClassification(messageText, cloudinaryUrl)

    if (!classification) {
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.AI_CLASSIFICATION_FAILED, undefined, sourceGroupId, sourceGroupName)
      return
    }

    if (!classification.isEvent) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Not an event (${classification.reason}) — ${messageId}`)
      const reason = classification.reason === 'multiple_events' || classification.reason?.includes('multiple')
        ? CONFIRMATION_REASONS.MULTIPLE_EVENTS
        : classification.reason?.includes('date')
          ? CONFIRMATION_REASONS.NO_DATE
          : CONFIRMATION_REASONS.NOT_EVENT
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason, undefined, sourceGroupId, sourceGroupName)
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
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.AI_COMPARISON_FAILED, undefined, sourceGroupId, sourceGroupName)
      return
    }

    // ── Programmatic validation ──
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `[Validate] ${messageId}`)
    const { event: validatedEvent, corrections } = validateEventProgrammatic(extractedEvent, messageText, categoriesList)

    if (!validatedEvent) {
      const validationReason = corrections.join('; ')
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Validation failed for ${messageId}: ${validationReason}`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED, validationReason, sourceGroupId, sourceGroupName)
      return
    }

    if (corrections.length > 0) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Corrections (${corrections.length}): ${corrections.join('; ')}`)
    }

    // ── Structure check ──
    const structureCheck = validateEventStructure(validatedEvent)
    if (!structureCheck.valid) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Structure invalid after validation: ${structureCheck.reason}`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED, structureCheck.reason, sourceGroupId, sourceGroupName)
      return
    }

    // ── No candidates → save as new ──
    if (!candidates || candidates.length === 0) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `No candidates — new event for ${messageId}`)
      await handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, validatedEvent, originalMessage, client, messagePreview, sourceGroupId, sourceGroupName)
      return
    }

    // ── AI Call #3: Comparison ──
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `[Call 3/Compare] ${messageId} vs ${candidates.length} candidate(s)`)
    const comparison = await callOpenAIForComparison(validatedEvent, messageText, candidates)

    if (!comparison) {
      logger.warn(LOG_PREFIXES.EVENT_SERVICE, `Comparison failed — treating as new for ${messageId}`)
      await handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, validatedEvent, originalMessage, client, messagePreview, sourceGroupId, sourceGroupName)
      return
    }

    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Comparison: ${comparison.status} (${comparison.reason})`)

    if (comparison.status === 'existing_event' || comparison.status === 'updated_event') {
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.ALREADY_EXISTING, undefined, sourceGroupId, sourceGroupName)
      return
    }

    // new_event or fallback
    await handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, validatedEvent, originalMessage, client, messagePreview, sourceGroupId, sourceGroupName)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Pipeline error for ${messageId}: ${errorMsg}`)
    const messagePreview = (rawMessage?.text || '').substring(0, 20) || '(error)'
    try { await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.PIPELINE_ERROR, undefined, sourceGroupId, sourceGroupName) } catch (_) { /* already logged */ }
  }
}

