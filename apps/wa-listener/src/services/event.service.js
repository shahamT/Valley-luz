import { openai } from './openai.service.js'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { extractMessageId, timestampToISO } from '../utils/messageHelpers.js'
import { LOG_PREFIXES } from '../consts/index.js'
import { getCategoriesList } from '../consts/events.const.js'
import { resolvePublisherPhone } from '../utils/contactHelpers.js'
import { updateEventDocument, deleteEventDocument, findCandidateEvents, updateEventWithNewData, appendToPreviousVersions, getEventDocument } from './mongo.service.js'
import { sendEventConfirmation, CONFIRMATION_REASONS } from '../utils/messageSender.js'
import { deleteMediaFromCloudinary } from './cloudinary.service.js'
import { ObjectId } from 'mongodb'

/**
 * Validates search keys array structure
 * Ensures searchKeys is a non-empty array of non-empty strings
 * @param {*} searchKeys - Value to validate
 * @returns {boolean} True if valid array of non-empty strings, false otherwise
 */
function validateSearchKeys(searchKeys) {
  if (!Array.isArray(searchKeys)) {
    return false
  }
  if (searchKeys.length === 0) {
    return false
  }
  return searchKeys.every(key => typeof key === 'string' && key.trim().length > 0)
}

/**
 * Validates candidates array structure
 * Ensures candidates is an array where each candidate has _id and rawMessage.text
 * Empty array is valid (no candidates found)
 * @param {*} candidates - Value to validate
 * @returns {boolean} True if valid array (empty or with valid candidates), false otherwise
 */
function validateCandidates(candidates) {
  if (!Array.isArray(candidates)) {
    return false
  }
  // Empty array is valid (no candidates found)
  if (candidates.length === 0) {
    return true
  }
  // If not empty, all candidates must have _id and rawMessage.text
  return candidates.every(candidate => 
    candidate && 
    candidate._id && 
    candidate.rawMessage && 
    typeof candidate.rawMessage.text === 'string'
  )
}


/**
 * Validates classification result structure from AI Call #1
 * Ensures result has isEvent (boolean) and searchKeys (array)
 * If isEvent is true, searchKeys must be valid
 * @param {*} result - Value to validate
 * @returns {boolean} True if valid classification result structure, false otherwise
 */
function validateClassificationResult(result) {
  if (!result || typeof result !== 'object') {
    return false
  }
  if (typeof result.isEvent !== 'boolean') {
    return false
  }
  if (!Array.isArray(result.searchKeys)) {
    return false
  }
  // If isEvent is true, searchKeys should be valid
  if (result.isEvent && !validateSearchKeys(result.searchKeys)) {
    return false
  }
  // reason is optional, but if present should be a string
  if (result.reason !== undefined && typeof result.reason !== 'string' && result.reason !== null) {
    return false
  }
  return true
}

/**
 * Validates comparison result structure from AI Call #2
 * Ensures result has valid status and appropriate fields based on status:
 * - existing_event/updated_event: must have matchedCandidateId
 * - new_event/updated_event: must have valid event object
 * @param {*} result - Value to validate
 * @returns {{valid: boolean, reason?: string}} Object with validation result and reason if invalid
 */
function validateComparisonResult(result) {
  if (!result || typeof result !== 'object') {
    return { valid: false, reason: 'Result is not an object' }
  }
  if (!result.status || !['new_event', 'existing_event', 'updated_event'].includes(result.status)) {
    return { valid: false, reason: `Invalid status: ${result.status}` }
  }
  // existing_event and updated_event must have matchedCandidateId
  if ((result.status === 'existing_event' || result.status === 'updated_event') && !result.matchedCandidateId) {
    return { valid: false, reason: `Missing matchedCandidateId for status: ${result.status}` }
  }
  // new_event and updated_event must have event object
  if ((result.status === 'new_event' || result.status === 'updated_event')) {
    if (!result.event) {
      return { valid: false, reason: `Missing event object for status: ${result.status}` }
    }
    const eventValidation = validateEventStructure(result.event)
    if (!eventValidation.valid) {
      return { valid: false, reason: `Invalid event structure: ${eventValidation.reason}` }
    }
  }
  return { valid: true }
}

/**
 * Validates event object structure
 * Ensures event has all required fields: Title, categories, mainCategory, location, occurrence
 * @param {*} event - Value to validate
 * @returns {{valid: boolean, reason?: string}} Object with validation result and reason if invalid
 */
function validateEventStructure(event) {
  if (!event || typeof event !== 'object') {
    return { valid: false, reason: 'Event is not an object' }
  }
  // Check required fields
  if (typeof event.Title !== 'string' || event.Title.trim().length === 0) {
    return { valid: false, reason: 'Missing or empty Title' }
  }
  if (!Array.isArray(event.categories) || event.categories.length === 0) {
    return { valid: false, reason: 'Missing or empty categories array' }
  }
  if (typeof event.mainCategory !== 'string' || event.mainCategory.trim().length === 0) {
    return { valid: false, reason: 'Missing or empty mainCategory' }
  }
  if (!event.categories.includes(event.mainCategory)) {
    return { valid: false, reason: 'mainCategory not found in categories array' }
  }
  if (!event.location || typeof event.location !== 'object') {
    return { valid: false, reason: 'Missing or invalid location object' }
  }
  if (typeof event.location.City !== 'string') {
    return { valid: false, reason: 'Missing or invalid location.City' }
  }
  if (!event.occurrence || typeof event.occurrence !== 'object') {
    return { valid: false, reason: 'Missing or invalid occurrence object' }
  }
  if (typeof event.occurrence.hasTime !== 'boolean') {
    return { valid: false, reason: 'Missing or invalid occurrence.hasTime' }
  }
  if (typeof event.occurrence.startTime !== 'string' || event.occurrence.startTime.trim().length === 0) {
    return { valid: false, reason: 'Missing or empty occurrence.startTime' }
  }
  return { valid: true }
}

/**
 * Cleans up Cloudinary media and deletes event document, then sends confirmation
 * @param {Object} eventId - MongoDB document _id
 * @param {Object|null} cloudinaryData - Cloudinary metadata or null
 * @param {string} messagePreview - Message preview for confirmation
 * @param {string} reason - Reason code from CONFIRMATION_REASONS
 * @returns {Promise<void>}
 */
async function cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason) {
  // Delete Cloudinary media if exists
  if (cloudinaryData?.public_id) {
    try {
      await deleteMediaFromCloudinary(cloudinaryData.public_id)
    } catch (deleteError) {
      const errorMsg = deleteError instanceof Error ? deleteError.message : String(deleteError)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Failed to delete Cloudinary media during cleanup: ${errorMsg}`)
    }
  }
  
  // Delete the event document
  try {
    await deleteEventDocument(eventId)
  } catch (deleteError) {
    const errorMsg = deleteError instanceof Error ? deleteError.message : String(deleteError)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Failed to delete event document during cleanup: ${errorMsg}`)
  }
  
  // Send confirmation
  try {
    await sendEventConfirmation(messagePreview, reason)
  } catch (confirmError) {
    const errorMsg = confirmError instanceof Error ? confirmError.message : String(confirmError)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Failed to send confirmation during cleanup: ${errorMsg}`)
  }
}

/**
 * Builds minimal payload for OpenAI API
 * @param {Object} rawMessage - Serialized raw message object
 * @param {string|null} cloudinaryUrl - Cloudinary URL or null
 * @param {Array} categoriesList - List of allowed categories
 * @returns {Object} Payload object for OpenAI
 */
export function buildOpenAIPayload(rawMessage, cloudinaryUrl, categoriesList) {
  // Extract URLs from links array or text
  const links = rawMessage.links || []
  const text = rawMessage.text || ''
  
  // Normalize links array - handle both strings and objects
  const normalizedLinks = links.map((link) => {
    if (typeof link === 'string') {
      return link
    } else if (typeof link === 'object' && link !== null) {
      // Handle link objects (may have 'link', 'url', or 'href' property)
      return link.link || link.url || link.href || String(link)
    }
    return String(link)
  }).filter((link) => typeof link === 'string' && link.startsWith('http'))
  
  // Extract URLs from text if not in links array
  const urlRegex = /https?:\/\/[^\s]+/g
  const textUrls = text.match(urlRegex) || []
  const allUrls = [...new Set([...normalizedLinks, ...textUrls])] // Remove duplicates

  return {
    messageText: text || '',
    messageType: rawMessage.type || 'text',
    hasMedia: rawMessage.hasMedia || false,
    mediaUrl: cloudinaryUrl || null,
    links: allUrls,
    senderName: rawMessage.notifyName || null,
    groupId: rawMessage.from || null,
    authorId: rawMessage.author || null,
    messageTimestampUtc: rawMessage.t ? timestampToISO(rawMessage.t) : null,
    allowedCategories: categoriesList,
  }
}


/**
 * Calls OpenAI API for classification and search keys extraction
 * @param {string} messageText - Raw message text
 * @param {string|null} cloudinaryUrl - Cloudinary URL or null
 * @returns {Promise<{isEvent: boolean, searchKeys: string[], reason: string|null}|null>} Classification result or null on failure
 */
export async function callOpenAIForClassification(messageText, cloudinaryUrl) {
  try {
    const systemPrompt = `You are a message classification assistant. Analyze WhatsApp messages to determine if they describe an event, and extract search key phrases for finding similar events.

CRITICAL DATE REQUIREMENT:
- An event MUST have an ACTUAL, SPECIFIC date (e.g., "15 בינואר", "יום שני 20/01/2025", "ב-25 לחודש")
- Relative dates like "מחר" (tomorrow), "מחרתיים" (day after tomorrow), "בשבוע הבא" (next week), "בחודש הבא" (next month) are NOT sufficient
- The date must be identifiable as a specific calendar date, not relative to when the message was sent
- If the message only contains relative dates without a way to determine the actual date, classify as NOT an event
- If no date information is present at all, classify as NOT an event

NOT AN EVENT - EXCLUDE THESE:
- Business advertisements with regular routine hours (e.g., "ג׳–ה׳ 17:00–21:00", "ימי ראשון-חמישי", recurring weekly schedules)
- Messages that only show operating hours or business hours without a specific event date
- Regular business operations, menus, or service advertisements
- Messages that describe ongoing services rather than a one-time or specific-date event
- If the message contains only recurring schedule patterns (like "every Monday", "weekdays", "weekends") without a specific date, classify as NOT an event

Your task:
1. Determine if the message describes an event (gathering, activity, happening with SPECIFIC date/time and usually a location)
2. REJECT business advertisements, regular operating hours, or recurring schedules without specific dates
3. Extract 3-5 key search phrases that would help find similar events in a database (only if it's an event)
4. If not an event, provide a reason (e.g., "no_date", "business_advertisement", "recurring_hours", etc.)

Return ONLY valid JSON with this structure:
{
  "isEvent": boolean,  // true if message describes an event with actual date, false otherwise
  "searchKeys": ["phrase1", "phrase2", ...],  // Array of 3-5 key phrases for searching similar events (empty if not event)
  "reason": string | null  // Optional reason if isEvent is false (e.g., "no_date", "not_event_description", etc.)
}

Search key guidelines:
- Use meaningful phrases (2-4 words each)
- Focus on event-specific terms: location names, event type, date references, venue names
- Use Hebrew phrases if the message is in Hebrew
- Examples: "חיפה", "קונצרט", "פארק", "תל אביב"
- If not an event, return empty searchKeys array
- Return ONLY JSON, no markdown, no code blocks`

    // Build user message content - use vision API format if image is present
    let userMessageContent
    const hasImage = cloudinaryUrl && (cloudinaryUrl.includes('.jpg') || cloudinaryUrl.includes('.jpeg') || cloudinaryUrl.includes('.png') || cloudinaryUrl.includes('.webp'))
    
    if (hasImage) {
      // Use vision API format with image
      userMessageContent = [
        {
          type: 'text',
          text: `Analyze this WhatsApp message to determine if it describes an event and extract search keys:

Message Text: ${messageText || '(empty - analyze the image for all information)'}

INSTRUCTIONS:
1. Analyze the message text and image (if provided) to determine if this describes an event
2. An event MUST have an ACTUAL, SPECIFIC date (not relative dates like "tomorrow" or "next week")
3. REJECT business advertisements with regular routine hours (e.g., "ג׳–ה׳ 17:00–21:00", recurring weekly schedules)
4. REJECT messages that only show operating hours or business hours without a specific event date
5. Check if the message contains a specific calendar date that can be identified (not recurring schedules)
6. If it only has relative dates or recurring hours without a specific date, classify as NOT an event
7. If it's an event with a specific date, extract 3-5 key search phrases that would help find similar events
8. If not an event, provide a reason (e.g., "no_date", "business_advertisement", "recurring_hours" if no specific date found)
9. Return the classification result in JSON format.`
        },
        {
          type: 'image_url',
          image_url: {
            url: cloudinaryUrl
          }
        }
      ]
    } else {
      // Use text-only format
      userMessageContent = `Analyze this WhatsApp message to determine if it describes an event and extract search keys:

Message Text: ${messageText || '(empty)'}

INSTRUCTIONS:
1. Analyze the message text to determine if this describes an event
2. An event MUST have an ACTUAL, SPECIFIC date (not relative dates like "tomorrow" or "next week")
3. REJECT business advertisements with regular routine hours (e.g., "ג׳–ה׳ 17:00–21:00", recurring weekly schedules)
4. REJECT messages that only show operating hours or business hours without a specific event date
5. Check if the message contains a specific calendar date that can be identified (not recurring schedules)
6. If it only has relative dates or recurring hours without a specific date, classify as NOT an event
7. If it's an event with a specific date, extract 3-5 key search phrases that would help find similar events
8. If not an event, provide a reason (e.g., "no_date", "business_advertisement", "recurring_hours" if no specific date found)
9. Return the classification result in JSON format.`
    }

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessageContent },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500, // Smaller for classification
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, 'OpenAI classification returned empty response')
      return null
    }

    // Parse JSON response
    try {
      const result = JSON.parse(content)
      // Validate structure
      if (typeof result.isEvent !== 'boolean' || !Array.isArray(result.searchKeys)) {
        logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid classification response structure')
        return null
      }
      return {
        isEvent: result.isEvent,
        searchKeys: result.searchKeys || [],
        reason: result.reason || null,
      }
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Failed to parse OpenAI classification JSON: ${errorMsg}`)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Response content: ${content.substring(0, 500)}`)
      return null
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `OpenAI classification API error: ${errorMsg}`)
    if (error instanceof Error && error.stack) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Stack trace: ${error.stack}`)
    }
    return null
  }
}

/**
 * Calls OpenAI API for event comparison and generation
 * @param {string} messageText - Current message text
 * @param {string|null} cloudinaryUrl - Cloudinary URL or null
 * @param {Array} candidates - Array of candidate events with _id and rawMessage.text
 * @param {Array} categoriesList - List of allowed categories
 * @returns {Promise<{status: string, matchedCandidateId?: string, event?: object}|null>} Comparison result or null on failure
 */
export async function callOpenAIForEventComparison(messageText, cloudinaryUrl, candidates, categoriesList) {
  try {
    const categoriesText = categoriesList.map((cat) => `- ${cat.id}: ${cat.label}`).join('\n')
    
    const systemPrompt = `You are an event comparison and extraction assistant. Compare a new WhatsApp message to existing candidate events and decide if it's a new event, an existing event, or an updated version of an existing event.

REQUIRED OUTPUT STRUCTURE (return this exact structure):
{
  "status": "new_event" | "existing_event" | "updated_event",
  "matchedCandidateId": string | null,  // Required if status is "existing_event" or "updated_event"
  "event": { /* event object */ } | null  // Required if status is "new_event" or "updated_event"
}

EVENT OBJECT STRUCTURE (when status is "new_event" or "updated_event"):
{
  "media": Array<string>,  // Array of media URLs/paths
  "urls": Array<{ "Title": string, "Url": string }>,  // Array of URL objects with Title and Url
  "categories": Array<string>,  // Array of category IDs (must be from allowed list)
  "mainCategory": string,  // One category ID from the categories array
  "Title": string,  // Event title in Hebrew
  "fullDescription": string,  // Full description in Hebrew (HTML allowed, may include emojis)
  "shortDescription": string,  // Short description in Hebrew
  "location": {
    "City": string,  // City name
    "addressLine1": string | undefined,
    "addressLine2": string | undefined,
    "locationDetails": string | undefined
  },
  "price": number | 0 | null,  // Price as number (0 if free, null if not specified)
  "occurrence": {
    "hasTime": boolean,  // Whether time is specified
    "startTime": string,  // ISO UTC timestamp string
    "endTime": string | undefined  // ISO UTC timestamp string (optional)
  }
}

ALLOWED CATEGORIES (use only these IDs):
${categoriesText}

DECISION RULES:
- "new_event": The message describes a completely different event from all candidates
- "existing_event": The message is the same event as one of the candidates (same event, same details, just a repost)
- "updated_event": The message is the same event as one candidate but with updated information

CRITICAL: When determining if an event is "updated_event" vs "existing_event", you MUST specifically check for changes in these key fields:
1. PRICE: Compare the price/entrance fee. If the price has changed (e.g., was free now costs money, or price amount changed), it's an "updated_event"
2. DATES: Compare the occurrence.startTime and occurrence.endTime. If the date or time has changed, it's an "updated_event"
3. LINKS: Compare the urls array. If new links were added, removed, or changed, it's an "updated_event"

If ANY of these three fields (price, dates, links) have changed compared to a candidate event, you MUST classify it as "updated_event", NOT "existing_event".

Only classify as "existing_event" if:
- It's the exact same event
- Price is the same (or both are null/0)
- Dates are the same
- Links are the same (or both have no links)
- It's just a repost of the same information

For "existing_event":
- Set matchedCandidateId to the _id of the matching candidate
- Set event to null

For "updated_event":
- Set matchedCandidateId to the _id of the candidate being updated
- Set event to the complete updated event object with all new information (including the changed price, dates, or links)

For "new_event":
- Set matchedCandidateId to null
- Set event to the complete new event object

RULES:
- Return ONLY valid JSON (no markdown, no code blocks)
- All text fields (Title, descriptions) must be in Hebrew
- Categories must be valid IDs from the allowed list
- mainCategory must be one of the categories in the categories array
- If date/time information is missing or unclear, use reasonable defaults based on context
- Extract URLs from the message and include them in the urls array with appropriate titles
- If mediaUrl is provided, include it in the media array

TITLE AND DESCRIPTION RULES (CRITICAL):
- Title: Should contain ONLY the event name/title. DO NOT include price, location, or date information in the title
- shortDescription: Should contain ONLY content-related details about what the event is about. DO NOT include price, location, or date information
- fullDescription: May include all details (price, location, date) as it's the full description
- Price information belongs ONLY in the price field, NOT in Title or shortDescription

IMAGE ANALYSIS (SECONDARY SOURCE - USE WITH CAUTION):
- Images are a SECONDARY source of information - the message text is PRIMARY
- Only use information from the image if you are CERTAIN and CONFIDENT about what you see
- DO NOT guess or invent information from unclear images
- DO NOT use image information if the text in the image is unclear, blurry, or ambiguous
- If you cannot read text in the image with high confidence, ignore that information and rely only on the message text
- Images may contain event posters, flyers, or promotional materials, but only extract information you can clearly see and read
- When combining text and image:
  - Message text is PRIMARY - use it as the main source
  - Image is SECONDARY - only use it to fill gaps or add details that are clearly visible
  - If information conflicts, prefer the message text
  - Only use image information if you are CERTAIN about what you see (high confidence OCR)
- If image text is unclear, partially visible, or ambiguous, ignore it and use only the message text

PRICE RULES (CRITICAL):
- price field represents ENTRANCE/ENTRY PRICE ONLY (the cost to enter/attend the event)
- If you CANNOT determine whether there is an entrance price from the message, set price to null
- If you can conclude that entrance is FREE, set price to 0 (zero)
- If you can conclude that entrance COSTS MONEY, set price to the entrance fee amount as a number
- IGNORE prices of items being sold at the event (food, merchandise, etc.) - these are NOT entrance prices
- Only consider information about the cost to ENTER/ATTEND the event itself
- If no entrance price information is described in the message, set price to null
- If you cannot make a clear conclusion about entrance price, set price to null (do NOT guess)
- JSON does not support undefined - use null for missing/unknown prices

LOCATION ADDRESS RULES (CRITICAL - READ CAREFULLY):
- Do NOT repeat information across address fields - each field should complement the others, not duplicate
- City: Contains ONLY the actual city/town name (e.g., "חיפה", "תל אביב", "ירושלים", "רמת הגולן"). NOT a place name, NOT a venue name, NOT a neighborhood. CRITICAL: ONLY fill if the actual city name is EXPLICITLY STATED in the message/image text. DO NOT guess, infer, or assume the city based on venue names, addresses, or any other context. If the city name is not explicitly written in the message/image, set to empty string "". DO NOT fill with anything if you cannot find the exact city name in the source.
- addressLine1: Contains ONLY a specific place/venue/business name (e.g., "Szold Art", "חוות הג'לבון", "לה רוסטיקה"). This is the NAME of the location, not an address. If no clear place name exists, set to undefined (do NOT fill with random text)
- addressLine2: Contains ONLY a street address with street name and number (e.g., "רחוב הרצל 15", "שדרות בן גוריון 20", "כיכר רבין 1"). This must be an actual street address. If no street address exists, set to undefined (do NOT fill with place names, venue names, or any other text)
- locationDetails: Contains ONLY practical navigation directions or location-specific instructions (e.g., "מיקום מדויק יישלח לרוכשים", "מתחם פתוח עם מחצלות", "ליד הכניסה הראשית"). This is for helping people FIND the location. Do NOT include casual messages, greetings, or non-navigation text. If no such directions exist, set to undefined (do NOT fill)
- IMPORTANT: If a field doesn't have the exact type of information described above, set it to undefined. Do NOT fill fields with irrelevant or incorrect information just to have something there.
- If location information is completely missing or unclear, set City to empty string "" and all other location fields to undefined

STRICT DATA EXTRACTION RULES (CRITICAL):
- ONLY extract information that is EXPLICITLY stated in the message text or clearly visible in the image
- DO NOT invent, assume, or infer information that is not directly present in the source
- DO NOT use common phrases or templates unless they are actually in the message/image
- DO NOT guess city names based on venue names or partial addresses
- DO NOT invent navigation instructions or location details that aren't in the message
- If information is missing or unclear, leave fields empty/null/undefined rather than guessing
- When in doubt, leave the field empty/null/undefined - it's better to have incomplete data than incorrect data

Return the complete response object in JSON format.`

    // Build candidates list for user prompt
    const candidatesText = candidates.length > 0
      ? candidates.map((candidate, idx) => {
          const candidateId = candidate._id.toString()
          const candidateText = candidate.rawMessage?.text || '(no text)'
          return `Candidate ${idx + 1}:
ID: ${candidateId}
Message: ${candidateText}`
        }).join('\n\n')
      : '(no candidates found)'

    // Build user message content - use vision API format if image is present
    let userMessageContent
    const hasImage = cloudinaryUrl && (cloudinaryUrl.includes('.jpg') || cloudinaryUrl.includes('.jpeg') || cloudinaryUrl.includes('.png') || cloudinaryUrl.includes('.webp'))
    
    if (hasImage) {
      // Use vision API format with image
      userMessageContent = [
        {
          type: 'text',
          text: `Compare this new WhatsApp message to the candidate events and decide if it's new, existing, or updated:

NEW MESSAGE:
${messageText || '(empty - analyze the image for all information)'}

CANDIDATE EVENTS:
${candidatesText}

INSTRUCTIONS:
1. Compare the new message to each candidate event
2. Pay special attention to PRICE, DATES, and LINKS when comparing
3. If price, dates, or links have changed compared to a candidate, classify as "updated_event"
4. If it's the same event with no changes to price/dates/links, classify as "existing_event"
5. If it's a completely different event, classify as "new_event"
6. If it's existing_event or updated_event, provide the matchedCandidateId
7. If it's new_event or updated_event, extract and return the complete event object
8. Return the result in JSON format.`
        },
        {
          type: 'image_url',
          image_url: {
            url: cloudinaryUrl
          }
        }
      ]
    } else {
      // Use text-only format
      userMessageContent = `Compare this new WhatsApp message to the candidate events and decide if it's new, existing, or updated:

NEW MESSAGE:
${messageText || '(empty)'}

CANDIDATE EVENTS:
${candidatesText}

INSTRUCTIONS:
1. Compare the new message to each candidate event
2. Pay special attention to PRICE, DATES, and LINKS when comparing
3. If price, dates, or links have changed compared to a candidate, classify as "updated_event"
4. If it's the same event with no changes to price/dates/links, classify as "existing_event"
5. If it's a completely different event, classify as "new_event"
6. If it's existing_event or updated_event, provide the matchedCandidateId
7. If it's new_event or updated_event, extract and return the complete event object
8. Return the result in JSON format.`
    }

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessageContent },
      ],
      response_format: { type: 'json_object' },
      max_tokens: config.openai.maxTokens,
      temperature: 0.3,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, 'OpenAI comparison returned empty response')
      return null
    }

    // Parse JSON response
    try {
      const result = JSON.parse(content)
      
      // Validate structure
      const validation = validateComparisonResult(result)
      if (!validation.valid) {
        logger.error(LOG_PREFIXES.EVENT_SERVICE, `Invalid comparison response structure. Reason: ${validation.reason}. Got: ${JSON.stringify(result).substring(0, 500)}`)
        return null
      }
      
      return result
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Failed to parse OpenAI comparison JSON: ${errorMsg}`)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Response content: ${content.substring(0, 500)}`)
      return null
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `OpenAI comparison API error: ${errorMsg}`)
    if (error instanceof Error && error.stack) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Stack trace: ${error.stack}`)
    }
    return null
  }
}

/**
 * Calls OpenAI API to validate and correct event object against raw message/image
 * @param {Object} event - Event object from AI Call #2
 * @param {string} rawMessageText - Raw message text
 * @param {string|null} cloudinaryUrl - Cloudinary URL or null
 * @param {Array} categoriesList - List of allowed categories
 * @returns {Promise<{event: Object|null, corrections: string[]}|null>} Validation result with corrected event and list of corrections, or null on failure
 */
export async function callOpenAIForValidation(event, rawMessageText, cloudinaryUrl, categoriesList) {
  try {
    const categoriesText = categoriesList.map((cat) => `- ${cat.id}: ${cat.label}`).join('\n')
    
    const systemPrompt = `You are an event validation and correction assistant. Your task is to verify that an event object contains only information that is actually present in the raw WhatsApp message and image, and correct any fields that were invented or incorrectly extracted.

REQUIRED OUTPUT STRUCTURE (return this exact structure):
{
  "event": { /* corrected event object */ } | null,  // Corrected event object, or null if critical fields cannot be corrected
  "corrections": ["field1: reason", "field2: reason", ...]  // Array of strings describing what was corrected
}

EVENT OBJECT STRUCTURE (same as input):
{
  "media": Array<string>,
  "urls": Array<{ "Title": string, "Url": string }>,
  "categories": Array<string>,
  "mainCategory": string,
  "Title": string,
  "fullDescription": string,
  "shortDescription": string,
  "location": {
    "City": string,
    "addressLine1": string | undefined,
    "addressLine2": string | undefined,
    "locationDetails": string | undefined
  },
  "price": number | 0 | null,
  "occurrence": {
    "hasTime": boolean,
    "startTime": string,
    "endTime": string | undefined
  }
}

ALLOWED CATEGORIES (use only these IDs):
${categoriesText}

VALIDATION RULES:
1. Compare EVERY field in the event object to the raw message text and image
2. For each field, verify that the information is EXPLICITLY stated in the source
3. If a field contains information NOT found in the raw message/image:
   - Remove or correct that field
   - Add a correction entry explaining what was wrong
4. Pay special attention to:
   - Title and shortDescription: Must NOT contain price information - remove any price mentions from these fields
   - location.City: CRITICAL - Follow these steps EXACTLY:
     1. FIRST: Search the RAW MESSAGE TEXT for the city name word-for-word
     2. If found in message text, keep it
     3. If NOT found in message text, check the image ONLY if it's clearly visible
     4. If the city name in the event object does NOT appear in the message text AND is not clearly visible in the image, set to empty string ""
     5. DO NOT keep any city name that was guessed, inferred, or hallucinated
     6. Example: If event has City="שדרות" but "שדרות" is not in the message text, set to "" even if something else appears in the image
   - location.addressLine1: Must be explicitly stated place name
   - location.addressLine2: Must be explicitly stated street address
   - location.locationDetails: Must be explicitly stated in message/image, DO NOT invent phrases
   - price: Must be explicitly stated entrance price, not inferred
5. If critical fields (Title, categories, occurrence.startTime) are missing or cannot be corrected, return null for event
6. For non-critical fields (price, location details), if not in source, set to null/undefined

CORRECTION EXAMPLES:
- If Title or shortDescription contains price information (e.g., "חינם", "₪50", "ללא תשלום"), remove it - price belongs only in the price field
- If locationDetails contains "מיקום מדויק יישלח לרוכשים" but this text is NOT in the message/image, remove it (set to undefined)
- If City is "שדרות" but "שדרות" does not appear in the raw message text, set to empty string "" - even if the image shows a different city or location information
- If City is filled with a city name that cannot be found word-for-word in the raw message/image text, set to empty string "" - DO NOT keep guessed city names
- If price is filled but no price is mentioned in the message/image, set to null
- If addressLine2 contains a street address that's not in the message/image, set to undefined

Return ONLY valid JSON (no markdown, no code blocks).`

    // Build user message content - use vision API format if image is present
    let userMessageContent
    const hasImage = cloudinaryUrl && (cloudinaryUrl.includes('.jpg') || cloudinaryUrl.includes('.jpeg') || cloudinaryUrl.includes('.png') || cloudinaryUrl.includes('.webp'))
    
    if (hasImage) {
      userMessageContent = [
        {
          type: 'text',
          text: `Validate and correct this event object against the raw WhatsApp message and image:

RAW MESSAGE TEXT:
${rawMessageText || '(empty - analyze the image for all information)'}

EVENT OBJECT TO VALIDATE:
${JSON.stringify(event, null, 2)}

INSTRUCTIONS:
1. Compare each field in the event object to the raw message text and image
2. For location.City: FIRST search the raw message text. If the city name is not found in the message text, check the image. If still not found, set to empty string ""
3. Verify that all data is actually present in the source
4. Correct any fields that were invented or incorrectly extracted
5. Remove any information that is not explicitly stated in the message/image
6. Return the corrected event object and list of corrections made
7. If critical fields cannot be corrected, return null for event`
        },
        {
          type: 'image_url',
          image_url: {
            url: cloudinaryUrl
          }
        }
      ]
    } else {
      userMessageContent = `Validate and correct this event object against the raw WhatsApp message:

RAW MESSAGE TEXT:
${rawMessageText || '(empty)'}

EVENT OBJECT TO VALIDATE:
${JSON.stringify(event, null, 2)}

INSTRUCTIONS:
1. Compare each field in the event object to the raw message text
2. For location.City: FIRST search the raw message text. If the city name is not found in the message text, set to empty string ""
3. Verify that all data is actually present in the source
4. Correct any fields that were invented or incorrectly extracted
5. Remove any information that is not explicitly stated in the message
6. Return the corrected event object and list of corrections made
7. If critical fields cannot be corrected, return null for event`
    }

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessageContent },
      ],
      response_format: { type: 'json_object' },
      max_tokens: config.openai.maxTokens,
      temperature: 0.2, // Lower temperature for more accurate validation
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, 'OpenAI validation returned empty response')
      return null
    }

    // Parse JSON response
    try {
      const result = JSON.parse(content)
      
      // Validate structure
      if (!result.event && result.event !== null) {
        logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid validation response: missing event field')
        return null
      }
      if (!Array.isArray(result.corrections)) {
        logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid validation response: missing corrections array')
        return null
      }
      
      // If event is null, log why
      if (result.event === null && result.corrections.length > 0) {
        logger.warn(LOG_PREFIXES.EVENT_SERVICE, `Event validation failed - critical fields could not be corrected: ${result.corrections.join(', ')}`)
      } else if (result.corrections.length > 0) {
        logger.info(LOG_PREFIXES.EVENT_SERVICE, `Event validation made corrections: ${result.corrections.join(', ')}`)
      } else {
        logger.info(LOG_PREFIXES.EVENT_SERVICE, 'Event validation passed - no corrections needed')
      }
      
      return result
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Failed to parse OpenAI validation JSON: ${errorMsg}`)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Response content: ${content.substring(0, 500)}`)
      return null
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `OpenAI validation API error: ${errorMsg}`)
    if (error instanceof Error && error.stack) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Stack trace: ${error.stack}`)
    }
    return null
  }
}

/**
 * Calls OpenAI API to generate event object
 * @param {Object} payload - Payload object from buildOpenAIPayload
 * @param {Array} categoriesList - List of allowed categories
 * @returns {Promise<Object|null>} Event object or null on failure
 */
export async function callOpenAIForEvent(payload, categoriesList) {
  try {
    // Build system prompt with exact event structure
    const categoriesText = categoriesList.map((cat) => `- ${cat.id}: ${cat.label}`).join('\n')
    
    const systemPrompt = `You are an event extraction assistant. Extract event information from WhatsApp group messages and return a structured event object in JSON format.

REQUIRED EVENT STRUCTURE (return this exact structure):
{
  "media": Array<string>,  // Array of media URLs/paths
  "urls": Array<{ "Title": string, "Url": string }>,  // Array of URL objects with Title and Url
  "categories": Array<string>,  // Array of category IDs (must be from allowed list)
  "mainCategory": string,  // One category ID from the categories array
  "Title": string,  // Event title in Hebrew
  "fullDescription": string,  // Full description in Hebrew (HTML allowed, may include emojis)
  "shortDescription": string,  // Short description in Hebrew
  "location": {
    "City": string,  // City name
    "addressLine1": string | undefined,
    "addressLine2": string | undefined,
    "locationDetails": string | undefined
  },
  "price": number | 0 | null,  // Price as number (0 if free, null if not specified)
  "occurrence": {
    "hasTime": boolean,  // Whether time is specified
    "startTime": string,  // ISO UTC timestamp string
    "endTime": string | undefined  // ISO UTC timestamp string (optional)
  }
}

ALLOWED CATEGORIES (use only these IDs):
${categoriesText}

RULES:
- Return ONLY valid JSON (no markdown, no code blocks)
- All text fields (Title, descriptions) must be in Hebrew
- Categories must be valid IDs from the allowed list
- mainCategory must be one of the categories in the categories array
- If date/time information is missing or unclear, use reasonable defaults based on context
- Extract URLs from the message and include them in the urls array with appropriate titles
- If mediaUrl is provided, include it in the media array

TITLE AND DESCRIPTION RULES (CRITICAL):
- Title: Should contain ONLY the event name/title. DO NOT include price, location, or date information in the title
- shortDescription: Should contain ONLY content-related details about what the event is about. DO NOT include price, location, or date information
- fullDescription: May include all details (price, location, date) as it's the full description
- Price information belongs ONLY in the price field, NOT in Title or shortDescription

IMAGE ANALYSIS (SECONDARY SOURCE - USE WITH CAUTION):
- Images are a SECONDARY source of information - the message text is PRIMARY
- Only use information from the image if you are CERTAIN and CONFIDENT about what you see
- DO NOT guess or invent information from unclear images
- DO NOT use image information if the text in the image is unclear, blurry, or ambiguous
- If you cannot read text in the image with high confidence, ignore that information and rely only on the message text
- Images may contain event posters, flyers, or promotional materials, but only extract information you can clearly see and read
- When combining text and image:
  - Message text is PRIMARY - use it as the main source
  - Image is SECONDARY - only use it to fill gaps or add details that are clearly visible
  - If information conflicts, prefer the message text
  - Only use image information if you are CERTAIN about what you see (high confidence OCR)
- If image text is unclear, partially visible, or ambiguous, ignore it and use only the message text

PRICE RULES (CRITICAL):
- price field represents ENTRANCE/ENTRY PRICE ONLY (the cost to enter/attend the event)
- ONLY fill price field if you have HIGH CONFIDENCE (90%+) that the entrance price is explicitly stated in the message or image
- If you are uncertain, doubtful, or the price is not clearly stated, set price to null
- DO NOT guess prices based on context or assumptions
- If you CANNOT determine whether there is an entrance price from the message, set price to null
- If you can conclude with HIGH CONFIDENCE that entrance is FREE, set price to 0 (zero)
- If you can conclude with HIGH CONFIDENCE that entrance COSTS MONEY, set price to the entrance fee amount as a number
- IGNORE prices of items being sold at the event (food, merchandise, etc.) - these are NOT entrance prices
- Only consider information about the cost to ENTER/ATTEND the event itself
- If no entrance price information is described in the message, set price to null
- If you cannot make a clear conclusion about entrance price, set price to null (do NOT guess)
- JSON does not support undefined - use null for missing/unknown prices

LOCATION ADDRESS RULES (CRITICAL - READ CAREFULLY):
- ONLY fill location fields if you have HIGH CONFIDENCE (90%+) that the information is explicitly stated in the message or image
- Do NOT repeat information across address fields - each field should complement the others, not duplicate
- City: Contains ONLY the actual city/town name (e.g., "חיפה", "תל אביב", "ירושלים", "רמת הגולן"). NOT a place name, NOT a venue name, NOT a neighborhood. CRITICAL: ONLY fill if the actual city name is EXPLICITLY STATED in the message/image text. DO NOT guess, infer, or assume the city based on venue names, addresses, or any other context. If the city name is not explicitly written in the message/image, set to empty string "". DO NOT fill with anything if you cannot find the exact city name in the source.
- addressLine1: Contains ONLY a specific place/venue/business name (e.g., "Szold Art", "חוות הג'לבון", "לה רוסטיקה"). This is the NAME of the location, not an address. ONLY fill if the exact place name is present in the message/image. If no clear place name exists, set to undefined (do NOT fill with random text)
- addressLine2: Contains ONLY a street address with street name and number (e.g., "רחוב הרצל 15", "שדרות בן גוריון 20", "כיכר רבין 1"). This must be an actual street address. ONLY fill if the exact street address is present in the message/image. DO NOT invent or assume street addresses. If no street address exists, set to undefined (do NOT fill with place names, venue names, or any other text)
- locationDetails: Contains ONLY practical navigation directions or location-specific instructions that are EXPLICITLY stated in the message/image (e.g., "מתחם פתוח עם מחצלות", "ליד הכניסה הראשית"). This is for helping people FIND the location. DO NOT invent phrases like "מיקום מדויק יישלח לרוכשים" unless that exact text is in the message. Do NOT include casual messages, greetings, or non-navigation text. If no such directions exist in the message/image, set to undefined (do NOT fill)
- IMPORTANT: If you cannot find the exact text in the raw message/image, set the field to undefined (not null, use undefined in JSON which becomes null). If a field doesn't have the exact type of information described above, set it to undefined. Do NOT fill fields with irrelevant or incorrect information just to have something there.
- If location information is completely missing or unclear, set City to empty string "" and all other location fields to undefined

STRICT DATA EXTRACTION RULES (CRITICAL):
- ONLY extract information that is EXPLICITLY stated in the message text or clearly visible in the image
- DO NOT invent, assume, or infer information that is not directly present in the source
- DO NOT use common phrases or templates unless they are actually in the message/image
- DO NOT guess city names based on venue names or partial addresses
- DO NOT invent navigation instructions or location details that aren't in the message
- If information is missing or unclear, leave fields empty/null/undefined rather than guessing
- When in doubt, leave the field empty/null/undefined - it's better to have incomplete data than incorrect data

Return the event object directly (no wrapper, no isEvent field).`

    // Build user message content - use vision API format if image is present
    let userMessageContent
    const hasImage = payload.hasMedia && payload.mediaUrl
    
    if (hasImage) {
      // Use vision API format with image (as secondary source)
      userMessageContent = [
        {
          type: 'text',
          text: `Extract event information from this WhatsApp message:

Message Text: ${payload.messageText}
Message Type: ${payload.messageType}
Has Media: ${payload.hasMedia}
Media URL: ${payload.mediaUrl}
Links: ${payload.links.length > 0 ? payload.links.join(', ') : '(none)'}
Sender: ${payload.senderName || '(unknown)'}
Timestamp: ${payload.messageTimestampUtc || '(unknown)'}

INSTRUCTIONS:
1. PRIMARY: Extract all available information from the message text above
2. SECONDARY: If an image is provided, analyze it ONLY as a secondary source
3. Image analysis rules:
   - Only use information from the image if you can read it CLEARLY and with HIGH CONFIDENCE
   - If text in the image is blurry, unclear, or ambiguous - IGNORE it
   - DO NOT guess or invent information from unclear images
   - Use image only to fill gaps or add details that are clearly visible and readable
4. If message text and image conflict, prefer the message text
5. Extract URLs from the message and include them in the urls array with appropriate titles
6. Include the mediaUrl in the media array
7. Return the complete event object in JSON format.`
        },
        {
          type: 'image_url',
          image_url: {
            url: payload.mediaUrl
          }
        }
      ]
    } else {
      // Use text-only format
      userMessageContent = `Extract event information from this WhatsApp message:

Message Text: ${payload.messageText || '(empty)'}
Message Type: ${payload.messageType}
Has Media: ${payload.hasMedia}
Media URL: ${payload.mediaUrl || '(none)'}
Links: ${payload.links.length > 0 ? payload.links.join(', ') : '(none)'}
Sender: ${payload.senderName || '(unknown)'}
Timestamp: ${payload.messageTimestampUtc || '(unknown)'}

INSTRUCTIONS:
1. Extract all available information from the message text
2. Extract URLs from the message and include them in the urls array with appropriate titles
3. If mediaUrl is provided, include it in the media array
4. Return the complete event object in JSON format.`
    }

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessageContent },
      ],
      response_format: { type: 'json_object' },
      max_tokens: config.openai.maxTokens,
      temperature: 0.3, // Lower temperature for more consistent extraction
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, 'OpenAI returned empty response')
      return null
    }

    // Parse JSON response
    try {
      const event = JSON.parse(content)
      return event
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Failed to parse OpenAI JSON response: ${errorMsg}`)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Response content: ${content.substring(0, 500)}`)
      return null
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `OpenAI API error: ${errorMsg}`)
    if (error instanceof Error && error.stack) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Stack trace: ${error.stack}`)
    }
    return null
  }
}

/**
 * Enriches event object with publisherPhone and Cloudinary media
 * @param {Object} event - Event object from OpenAI (must be validated before calling)
 * @param {string} authorId - Author ID from raw message
 * @param {string|null} cloudinaryUrl - Cloudinary URL or null
 * @param {Object} originalMessage - Original WhatsApp message object
 * @param {Object} client - WhatsApp client instance
 * @returns {Promise<Object>} Enriched event object
 */
export async function enrichEvent(event, authorId, cloudinaryUrl, originalMessage, client) {
  // Validate event structure before enrichment
  const validation = validateEventStructure(event)
  if (!validation.valid) {
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Cannot enrich invalid event object: ${validation.reason}`)
    throw new Error(`Invalid event structure for enrichment: ${validation.reason}`)
  }
  // Add publisherPhone
  if (authorId) {
    try {
      const phone = await resolvePublisherPhone(authorId, originalMessage, client)
      if (phone) {
        event.publisherPhone = phone
      } else {
        event.publisherPhone = undefined
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.warn(LOG_PREFIXES.EVENT_SERVICE, `Failed to resolve publisher phone: ${errorMsg}`)
      event.publisherPhone = undefined
    }
  } else {
    event.publisherPhone = undefined
  }

  // Ensure media is an array
  if (!Array.isArray(event.media)) {
    event.media = []
  }

  // Add Cloudinary URL as first item if present (from message media)
  if (cloudinaryUrl && !event.media.includes(cloudinaryUrl)) {
    event.media.unshift(cloudinaryUrl)
  }

  // Ensure media array doesn't exceed 4 images (AI should have already limited it, but safety check)
  if (event.media.length > 4) {
    event.media = event.media.slice(0, 4)
  }

  return event
}

/**
 * Validates inputs to processEventPipeline
 * @param {*} eventId - Event ID to validate
 * @param {*} rawMessage - Raw message to validate
 * @param {*} cloudinaryUrl - Cloudinary URL to validate
 * @param {*} cloudinaryData - Cloudinary data to validate
 * @returns {boolean} True if all inputs are valid
 */
function validatePipelineInputs(eventId, rawMessage, cloudinaryUrl, cloudinaryData) {
  // Validate eventId
  if (!eventId) {
    logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid pipeline input: eventId is required')
    return false
  }
  
  // Validate rawMessage
  if (!rawMessage || typeof rawMessage !== 'object') {
    logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid pipeline input: rawMessage must be an object')
    return false
  }
  if (typeof rawMessage.text !== 'string' && rawMessage.text !== undefined) {
    logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid pipeline input: rawMessage.text must be a string or undefined')
    return false
  }
  
  // Validate cloudinaryUrl
  if (cloudinaryUrl !== null && typeof cloudinaryUrl !== 'string') {
    logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid pipeline input: cloudinaryUrl must be a string or null')
    return false
  }
  
  // Validate cloudinaryData
  if (cloudinaryData !== null && (typeof cloudinaryData !== 'object' || Array.isArray(cloudinaryData))) {
    logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid pipeline input: cloudinaryData must be an object or null')
    return false
  }
  
  return true
}

/**
 * Handles non-event message cleanup
 * @param {Object} eventId - MongoDB document _id
 * @param {Object|null} cloudinaryData - Cloudinary metadata or null
 * @param {string} messagePreview - Message preview for confirmation
 * @param {string} reason - Reason code (defaults to NOT_EVENT)
 * @returns {Promise<void>}
 */
async function handleNonEventMessage(eventId, cloudinaryData, messagePreview, reason = CONFIRMATION_REASONS.NOT_EVENT) {
  logger.info(LOG_PREFIXES.EVENT_SERVICE, `Handling non-event message - cleaning up`)
  await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason)
}

/**
 * Handles existing event (duplicate) cleanup
 * @param {Object} eventId - MongoDB document _id
 * @param {Object|null} cloudinaryData - Cloudinary metadata or null
 * @param {string} messagePreview - Message preview for confirmation
 * @returns {Promise<void>}
 */
async function handleExistingEvent(eventId, cloudinaryData, messagePreview) {
  logger.info(LOG_PREFIXES.EVENT_SERVICE, `Handling existing event (duplicate) - cleaning up`)
  await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.ALREADY_EXISTING)
}

/**
 * Handles new event processing
 * @param {Object} eventId - MongoDB document _id
 * @param {Object} rawMessage - Serialized raw message object
 * @param {string|null} cloudinaryUrl - Cloudinary URL or null
 * @param {Object|null} cloudinaryData - Cloudinary metadata or null
 * @param {Object} event - Event object from AI
 * @param {Object} originalMessage - Original WhatsApp message object
 * @param {Object} client - WhatsApp client instance
 * @param {string} messagePreview - Message preview for confirmation
 * @returns {Promise<void>}
 */
async function handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, event, originalMessage, client, messagePreview) {
  logger.info(LOG_PREFIXES.EVENT_SERVICE, `Handling new event - validating, enriching and saving`)
  
  try {
    // AI Call #3: Validate and correct event object
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `AI Call #3: Validating event object against raw message`)
    const messageText = rawMessage.text || ''
    const categoriesList = getCategoriesList()
    const validation = await callOpenAIForValidation(event, messageText, cloudinaryUrl, categoriesList)
    
    if (!validation) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Event validation failed - AI call returned null`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED)
      return
    }
    
    if (validation.event === null) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Event validation failed - critical fields could not be corrected`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED)
      return
    }
    
    // Use corrected event
    const correctedEvent = validation.event
    if (validation.corrections.length > 0) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Event validation made ${validation.corrections.length} correction(s): ${validation.corrections.join('; ')}`)
    }
    
    // Enrich event
    const authorId = rawMessage.author || null
    const enrichedEvent = await enrichEvent(correctedEvent, authorId, cloudinaryUrl, originalMessage, client)

    // Update MongoDB document
    const updated = await updateEventDocument(eventId, enrichedEvent)
    if (updated) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Successfully processed new event`)
      await sendEventConfirmation(messagePreview, CONFIRMATION_REASONS.NEW_EVENT)
    } else {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Failed to update event document`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.DATABASE_ERROR)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Error processing new event: ${errorMsg}`)
    // Check if it's an enrichment error or database error
    const reason = errorMsg.includes('enrich') || errorMsg.includes('Invalid event structure') 
      ? CONFIRMATION_REASONS.ENRICHMENT_ERROR 
      : CONFIRMATION_REASONS.DATABASE_ERROR
    await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason)
  }
}

/**
 * Handles updated event processing
 * @param {Object} eventId - MongoDB document _id (unprocessed document)
 * @param {Object} rawMessage - Serialized raw message object
 * @param {string|null} cloudinaryUrl - Cloudinary URL or null
 * @param {Object|null} cloudinaryData - Cloudinary metadata or null
 * @param {Object} comparison - Comparison result with matchedCandidateId and event
 * @param {Object} originalMessage - Original WhatsApp message object
 * @param {Object} client - WhatsApp client instance
 * @param {string} messagePreview - Message preview for confirmation
 * @returns {Promise<void>}
 */
async function handleUpdatedEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, comparison, originalMessage, client, messagePreview) {
  logger.info(LOG_PREFIXES.EVENT_SERVICE, `Handling updated event - updating existing event`)
  
  // Convert matchedCandidateId to ObjectId (it comes as string from AI)
  let matchedCandidateId
  try {
    matchedCandidateId = typeof comparison.matchedCandidateId === 'string' 
      ? new ObjectId(comparison.matchedCandidateId)
      : comparison.matchedCandidateId
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Converted matchedCandidateId to ObjectId: ${matchedCandidateId}`)
  } catch (idError) {
    const errorMsg = idError instanceof Error ? idError.message : String(idError)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Invalid matchedCandidateId format '${comparison.matchedCandidateId}': ${errorMsg}`)
    await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED)
    return
  }
  
  // Get matched candidate document
  const matchedEventDoc = await getEventDocument(matchedCandidateId)
  
  if (!matchedEventDoc) {
    logger.warn(LOG_PREFIXES.EVENT_SERVICE, `Matched candidate event ${comparison.matchedCandidateId} not found - treating as new event`)
    
    // Treat as new event instead - validate first
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `AI Call #3: Validating event object against raw message (treating as new event)`)
    const messageText = rawMessage.text || ''
    const categoriesList = getCategoriesList()
    const validation = await callOpenAIForValidation(comparison.event, messageText, cloudinaryUrl, categoriesList)
    
    if (!validation || validation.event === null) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Event validation failed for new event fallback`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED)
      return
    }
    
    const correctedEvent = validation.event
    if (validation.corrections.length > 0) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Event validation made ${validation.corrections.length} correction(s): ${validation.corrections.join('; ')}`)
    }
    
    try {
      const authorId = rawMessage.author || null
      const enrichedEvent = await enrichEvent(correctedEvent, authorId, cloudinaryUrl, originalMessage, client)
      const updated = await updateEventDocument(eventId, enrichedEvent)
      
      if (updated) {
        await sendEventConfirmation(messagePreview, CONFIRMATION_REASONS.NEW_EVENT)
      } else {
        await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.DATABASE_ERROR)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Error treating updated event as new: ${errorMsg}`)
      const reason = errorMsg.includes('enrich') || errorMsg.includes('Invalid event structure')
        ? CONFIRMATION_REASONS.ENRICHMENT_ERROR
        : CONFIRMATION_REASONS.DATABASE_ERROR
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason)
    }
    return
  }

  // Create old version object
  const oldVersion = {
    event: matchedEventDoc.event || null,
    rawMessage: matchedEventDoc.rawMessage || null,
    cloudinaryUrl: matchedEventDoc.cloudinaryUrl || null,
    cloudinaryData: matchedEventDoc.cloudinaryData || null,
    timestamp: matchedEventDoc.updatedAt || matchedEventDoc.createdAt || new Date(),
  }

  // Append old version to previousVersions
  await appendToPreviousVersions(matchedCandidateId, oldVersion)
  logger.info(LOG_PREFIXES.EVENT_SERVICE, `Appended old version to event ${comparison.matchedCandidateId}`)

  // AI Call #3: Validate and correct event object
  logger.info(LOG_PREFIXES.EVENT_SERVICE, `AI Call #3: Validating event object against raw message`)
  const messageText = rawMessage.text || ''
  const categoriesList = getCategoriesList()
  const validation = await callOpenAIForValidation(comparison.event, messageText, cloudinaryUrl, categoriesList)
  
  if (!validation) {
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Event validation failed - AI call returned null`)
    await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED)
    return
  }
  
  if (validation.event === null) {
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Event validation failed - critical fields could not be corrected`)
    await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED)
    return
  }
  
  // Use corrected event
  const correctedEvent = validation.event
  if (validation.corrections.length > 0) {
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Event validation made ${validation.corrections.length} correction(s): ${validation.corrections.join('; ')}`)
  }

  // Enrich new event
  try {
    const authorId = rawMessage.author || null
    const enrichedEvent = await enrichEvent(correctedEvent, authorId, cloudinaryUrl, originalMessage, client)

    // Update matched event with new data
    const updated = await updateEventWithNewData(
      matchedCandidateId,
      enrichedEvent,
      rawMessage,
      cloudinaryUrl,
      cloudinaryData
    )

    if (updated) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Successfully updated event ${comparison.matchedCandidateId}`)
      
      // Delete the unprocessed document
      await deleteEventDocument(eventId)
      
      // Send confirmation message
      await sendEventConfirmation(messagePreview, CONFIRMATION_REASONS.UPDATED_EVENT)
    } else {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Failed to update matched event`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.DATABASE_ERROR)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Error updating event: ${errorMsg}`)
    const reason = errorMsg.includes('enrich') || errorMsg.includes('Invalid event structure')
      ? CONFIRMATION_REASONS.ENRICHMENT_ERROR
      : CONFIRMATION_REASONS.DATABASE_ERROR
    await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason)
  }
}

/**
 * Main event processing pipeline
 * Orchestrates: AI Call #1 (classification) → candidate search → AI Call #2 (comparison) → AI Call #3 (validation) → enrichment → update
 * @param {Object} eventId - MongoDB document _id
 * @param {Object} rawMessage - Serialized raw message object
 * @param {string|null} cloudinaryUrl - Cloudinary URL or null
 * @param {Object|null} cloudinaryData - Cloudinary metadata or null
 * @param {Object} originalMessage - Original WhatsApp message object
 * @param {Object} client - WhatsApp client instance
 */
export async function processEventPipeline(eventId, rawMessage, cloudinaryUrl, cloudinaryData, originalMessage, client) {
  const messageId = extractMessageId(rawMessage)
  
  try {
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Processing event pipeline for message ${messageId}`)

    // Validate inputs
    if (!validatePipelineInputs(eventId, rawMessage, cloudinaryUrl, cloudinaryData)) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Invalid pipeline inputs for message ${messageId} - aborting`)
      return
    }

    // Ignore messages with no text
    const messageText = rawMessage.text || ''
    if (!messageText || messageText.trim().length === 0) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Skipping message ${messageId} - no text content`)
      await handleNonEventMessage(eventId, cloudinaryData, '(no text)', CONFIRMATION_REASONS.NO_TEXT)
      return
    }

    // AI Call #1: Classification + Search Keys
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `AI Call #1: Classifying message ${messageId}`)
    const classification = await callOpenAIForClassification(messageText, cloudinaryUrl)

    if (!classification) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `AI classification failed for message ${messageId}`)
      const messagePreview = (rawMessage.text || '').substring(0, 20) || '(no text)'
      await handleNonEventMessage(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.AI_CLASSIFICATION_FAILED)
      return
    }

    // Validate classification result structure
    if (!validateClassificationResult(classification)) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Invalid classification result structure for message ${messageId}`)
      const messagePreview = (rawMessage.text || '').substring(0, 20) || '(no text)'
      await handleNonEventMessage(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED)
      return
    }

    // If not an event, delete and stop
    if (!classification.isEvent) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Message ${messageId} is not an event - deleting`)
      const messagePreview = (rawMessage.text || '').substring(0, 20) || '(no text)'
      // Check if the reason is specifically about missing date
      const reason = classification.reason && (classification.reason.includes('date') || classification.reason === 'no_date')
        ? CONFIRMATION_REASONS.NO_DATE
        : CONFIRMATION_REASONS.NOT_EVENT
      await handleNonEventMessage(eventId, cloudinaryData, messagePreview, reason)
      return
    }

    // Validate searchKeys before candidate search
    if (!validateSearchKeys(classification.searchKeys)) {
      logger.warn(LOG_PREFIXES.EVENT_SERVICE, `Invalid or empty searchKeys for message ${messageId} - proceeding without candidate search`)
    }

    // Search for candidate events using searchKeys
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Searching for candidate events for message ${messageId} with ${classification.searchKeys.length} search key(s)`)
    const candidates = await findCandidateEvents(classification.searchKeys, eventId)
    
    // Validate candidates structure
    if (!validateCandidates(candidates)) {
      logger.warn(LOG_PREFIXES.EVENT_SERVICE, `Invalid candidates structure for message ${messageId} - treating as empty`)
    }
    
    // Get categories list
    const categoriesList = getCategoriesList()
    const messagePreview = (rawMessage.text || '').substring(0, 20) || '(no text)'

    // If no candidates found, skip comparison and directly generate new event
    if (candidates.length === 0) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `No candidate events found for message ${messageId} - skipping comparison, treating as new event`)
      
      // AI Call #2: Generate event object directly (no comparison needed)
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `AI Call #2: Generating event object for new event`)
      const payload = buildOpenAIPayload(rawMessage, cloudinaryUrl, categoriesList)
      const event = await callOpenAIForEvent(payload, categoriesList)
      
      if (!event) {
        logger.error(LOG_PREFIXES.EVENT_SERVICE, `AI event generation failed for message ${messageId}`)
        await handleNonEventMessage(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.AI_COMPARISON_FAILED)
        return
      }
      
      // Proceed directly to validation and new event handling
      await handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, event, originalMessage, client, messagePreview)
      return
    }
    
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Found ${candidates.length} candidate event(s) for message ${messageId}`)

    // AI Call #2: Compare to candidates and generate/update event
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `AI Call #2: Comparing message ${messageId} to ${candidates.length} candidate(s)`)
    const comparison = await callOpenAIForEventComparison(messageText, cloudinaryUrl, candidates, categoriesList)

    if (!comparison) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `AI comparison failed for message ${messageId}`)
      await handleNonEventMessage(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.AI_COMPARISON_FAILED)
      return
    }

    // Validate comparison result structure
    const comparisonValidation = validateComparisonResult(comparison)
    if (!comparisonValidation.valid) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Invalid comparison result structure for message ${messageId}: ${comparisonValidation.reason}`)
      await handleNonEventMessage(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED)
      return
    }

    // Handle three statuses: existing_event, new_event, updated_event
    if (comparison.status === 'existing_event') {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Message ${messageId} is existing event (duplicate) - deleting`)
      await handleExistingEvent(eventId, cloudinaryData, messagePreview)
      return
    }

    if (comparison.status === 'new_event') {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Message ${messageId} is new event - processing`)
      await handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, comparison.event, originalMessage, client, messagePreview)
      return
    }

    if (comparison.status === 'updated_event') {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Message ${messageId} is updated event - processing`)
      await handleUpdatedEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, comparison, originalMessage, client, messagePreview)
      return
    }

    // Unknown status - should not reach here if validation passed
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Unknown comparison status '${comparison.status}' for message ${messageId} - this should not happen after validation`)
    await handleNonEventMessage(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Error in event pipeline for message ${messageId}: ${errorMsg}`)
    if (error instanceof Error && error.stack) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Stack trace: ${error.stack}`)
    }
    
    // Cleanup on error
    const messagePreview = (rawMessage?.text || '').substring(0, 20) || '(error)'
    try {
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.PIPELINE_ERROR)
    } catch (cleanupError) {
      const cleanupErrorMsg = cleanupError instanceof Error ? cleanupError.message : String(cleanupError)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Failed during error cleanup: ${cleanupErrorMsg}`)
    }
    
    // Don't throw - fail safely
  }
}
