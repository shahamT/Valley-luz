import { openai } from './openai.service.js'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { extractMessageId, timestampToISO } from '../utils/messageHelpers.js'
import { LOG_PREFIXES } from '../consts/index.js'
import { getCategoriesList } from '../consts/events.const.js'
import { resolvePublisherPhone } from '../utils/contactHelpers.js'
import { updateEventDocument, deleteEventDocument } from './mongo.service.js'
import { sendEventConfirmation } from '../utils/messageSender.js'

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
 * Extracts clean text content from HTML (removes all HTML tags and scripts)
 * @param {string} html - HTML content
 * @returns {string} Clean text content
 */
function extractCleanText(html) {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  
  // Decode HTML entities (basic)
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim()
  
  return text
}

/**
 * Extracts og:image URLs from HTML content
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL for resolving relative image URLs
 * @returns {Array<string>} Array of og:image URLs
 */
function extractOgImages(html, baseUrl) {
  const ogImages = []
  const ogImageRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi
  const ogImageUrlRegex = /<meta[^>]+property=["']og:image:url["'][^>]+content=["']([^"']+)["']/gi
  let match

  // Extract og:image
  while ((match = ogImageRegex.exec(html)) !== null) {
    let imageUrl = match[1]
    if (imageUrl && !imageUrl.startsWith('data:')) {
      // Resolve relative URLs
      if (imageUrl.startsWith('//')) {
        imageUrl = new URL(imageUrl, baseUrl).href
      } else if (imageUrl.startsWith('/')) {
        try {
          const base = new URL(baseUrl)
          imageUrl = `${base.protocol}//${base.host}${imageUrl}`
        } catch (e) {
          continue
        }
      } else if (!imageUrl.startsWith('http')) {
        try {
          imageUrl = new URL(imageUrl, baseUrl).href
        } catch (e) {
          continue
        }
      }
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        ogImages.push(imageUrl)
      }
    }
  }

  // Extract og:image:url
  while ((match = ogImageUrlRegex.exec(html)) !== null) {
    let imageUrl = match[1]
    if (imageUrl && !imageUrl.startsWith('data:')) {
      // Resolve relative URLs
      if (imageUrl.startsWith('//')) {
        imageUrl = new URL(imageUrl, baseUrl).href
      } else if (imageUrl.startsWith('/')) {
        try {
          const base = new URL(baseUrl)
          imageUrl = `${base.protocol}//${base.host}${imageUrl}`
        } catch (e) {
          continue
        }
      } else if (!imageUrl.startsWith('http')) {
        try {
          imageUrl = new URL(imageUrl, baseUrl).href
        } catch (e) {
          continue
        }
      }
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') && !ogImages.includes(imageUrl)) {
        ogImages.push(imageUrl)
      }
    }
  }

  return ogImages
}

/**
 * Extracts image URLs from HTML content
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL for resolving relative image URLs
 * @param {number} maxImages - Maximum number of images to extract
 * @returns {Array<string>} Array of image URLs
 */
function extractImageUrls(html, baseUrl, maxImages = 15) {
  const imageUrls = []
  const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi
  let match

  while ((match = imageRegex.exec(html)) !== null && imageUrls.length < maxImages) {
    let imageUrl = match[1]
    const altText = match[2] || ''
    
    // Skip data URIs
    if (imageUrl.startsWith('data:')) {
      continue
    }
    
    // Resolve relative URLs
    if (imageUrl.startsWith('//')) {
      imageUrl = new URL(imageUrl, baseUrl).href
    } else if (imageUrl.startsWith('/')) {
      try {
        const base = new URL(baseUrl)
        imageUrl = `${base.protocol}//${base.host}${imageUrl}`
      } catch (e) {
        // Invalid base URL, skip
        continue
      }
    } else if (!imageUrl.startsWith('http')) {
      try {
        imageUrl = new URL(imageUrl, baseUrl).href
      } catch (e) {
        // Invalid URL, skip
        continue
      }
    }
    
    // Only add valid HTTP(S) URLs
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      imageUrls.push(imageUrl)
    }
  }

  return imageUrls
}

/**
 * Fetches comprehensive content from URLs including text and images
 * @param {Array<string>} urls - Array of URL strings
 * @returns {Promise<{textContent: Array<{url: string, content: string}>, imageUrls: Array<string>, ogImageUrls: Array<string>}>} Object with text content, image URLs, and prioritized og:image URLs
 */
export async function fetchUrlContent(urls) {
  if (!urls || urls.length === 0) {
    return { textContent: [], imageUrls: [], ogImageUrls: [] }
  }

  const textContent = []
  const allImageUrls = []
  const ogImageUrls = [] // Prioritized og:image URLs
  const maxUrls = Math.min(5, urls.length) // Check up to 5 URLs
  const maxTotalChars = 6000 // Increased for more comprehensive content
  let totalChars = 0

  for (let i = 0; i < maxUrls && totalChars < maxTotalChars; i++) {
    try {
      let url = urls[i]
      
      // Ensure url is a string (handle objects)
      if (typeof url !== 'string') {
        if (typeof url === 'object' && url !== null) {
          url = url.link || url.url || url.href || String(url)
        } else {
          url = String(url)
        }
      }
      
      // Validate URL is a valid HTTP(S) URL
      if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        if (config.logLevel === 'info') {
          logger.info(LOG_PREFIXES.EVENT_SERVICE, `Skipping invalid URL: ${url}`)
        }
        continue
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'he,en-US;q=0.9,en;q=0.8',
        },
        signal: AbortSignal.timeout(8000), // 8 second timeout for more complex pages
      })

      if (!response.ok) {
        continue
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
        continue
      }

      const html = await response.text()
      
      // Log HTML size for debugging (especially for JS-rendered pages)
      if (config.logLevel === 'info') {
        logger.info(LOG_PREFIXES.EVENT_SERVICE, `Fetched ${html.length} chars from ${url}`)
      }
      
      // Skip if HTML is too small (likely JS-rendered or empty)
      if (html.length < 500) {
        if (config.logLevel === 'info') {
          logger.info(LOG_PREFIXES.EVENT_SERVICE, `Skipping ${url} - HTML too small (${html.length} chars), likely JS-rendered`)
        }
        continue
      }
      
      // Extract meaningful content (meta tags, title, main content)
      const metaDescription = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] || ''
      const metaTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || ''
      const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] || ''
      const ogDescription = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] || ''
      const ogPrice = html.match(/<meta[^>]+property=["']og:price["'][^>]+content=["']([^"']+)["']/i)?.[1] || ''
      const productPrice = html.match(/<meta[^>]+property=["']product:price["'][^>]+content=["']([^"']+)["']/i)?.[1] || ''
      
      // Extract clean text content (no HTML)
      const cleanText = extractCleanText(html)
      
      // Combine meta info with clean text content (include price meta tags if available)
      let combinedContent = [metaTitle, ogTitle, metaDescription, ogDescription, ogPrice, productPrice, cleanText]
        .filter(Boolean)
        .join(' ')
        .substring(0, 3000) // Limit per URL
      
      // Extract price patterns from text (look for numbers with currency symbols)
      const pricePatterns = [
        /₪\s*(\d+(?:\.\d+)?)/g,  // ₪50, ₪ 50
        /(\d+(?:\.\d+)?)\s*₪/g,  // 50₪, 50 ₪
        /(\d+(?:\.\d+)?)\s*שקל/g,  // 50 שקל
        /(\d+(?:\.\d+)?)\s*NIS/g,  // 50 NIS
        /(\d+(?:\.\d+)?)\s*ILS/g,  // 50 ILS
        /מחיר[:\s]*(\d+(?:\.\d+)?)/gi,  // מחיר: 50
        /price[:\s]*(\d+(?:\.\d+)?)/gi,  // price: 50
      ]
      
      // Add price hints to content if found
      const foundPrices = []
      for (const pattern of pricePatterns) {
        const matches = combinedContent.match(pattern)
        if (matches) {
          foundPrices.push(...matches)
        }
      }
      if (foundPrices.length > 0) {
        combinedContent = `[PRICE HINTS: ${foundPrices.slice(0, 5).join(', ')}] ${combinedContent}`
      }

      if (combinedContent.length > 0) {
        const remainingChars = maxTotalChars - totalChars
        if (combinedContent.length > remainingChars) {
          combinedContent = combinedContent.substring(0, remainingChars)
        }
        textContent.push({ url, content: combinedContent })
        totalChars += combinedContent.length
        
        if (config.logLevel === 'info') {
          logger.info(LOG_PREFIXES.EVENT_SERVICE, `Extracted ${combinedContent.length} chars of content from ${url}`)
        }
      } else {
        if (config.logLevel === 'info') {
          logger.info(LOG_PREFIXES.EVENT_SERVICE, `No extractable content from ${url} (may be JS-rendered)`)
        }
      }

      // Extract og:image URLs first (prioritized)
      const pageOgImages = extractOgImages(html, url)
      for (const imgUrl of pageOgImages) {
        if (!ogImageUrls.includes(imgUrl)) {
          ogImageUrls.push(imgUrl)
        }
      }

      // Extract regular image URLs from this page (up to 15 per page, AI will decide which are relevant)
      const pageImages = extractImageUrls(html, url, 15)
      for (const imgUrl of pageImages) {
        if (!allImageUrls.includes(imgUrl) && !ogImageUrls.includes(imgUrl)) {
          allImageUrls.push(imgUrl)
        }
      }
    } catch (error) {
      // Continue without this URL's content
      if (config.logLevel === 'info') {
        const errorMsg = error instanceof Error ? error.message : String(error)
        logger.info(LOG_PREFIXES.EVENT_SERVICE, `Failed to fetch URL content from ${urls[i]}: ${errorMsg}`)
      }
    }
  }

  return {
    textContent,
    imageUrls: allImageUrls, // Return all found images, AI will decide which are relevant
    ogImageUrls, // Prioritized og:image URLs
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
- City: Contains ONLY the actual city/town name (e.g., "חיפה", "תל אביב", "ירושלים", "רמת הגולן"). NOT a place name, NOT a venue name, NOT a neighborhood. If city name is not clearly identifiable, set to empty string ""
- addressLine1: Contains ONLY a specific place/venue/business name (e.g., "Szold Art", "חוות הג'לבון", "לה רוסטיקה"). This is the NAME of the location, not an address. If no clear place name exists, set to undefined (do NOT fill with random text)
- addressLine2: Contains ONLY a street address with street name and number (e.g., "רחוב הרצל 15", "שדרות בן גוריון 20", "כיכר רבין 1"). This must be an actual street address. If no street address exists, set to undefined (do NOT fill with place names, venue names, or any other text)
- locationDetails: Contains ONLY practical navigation directions or location-specific instructions (e.g., "מיקום מדויק יישלח לרוכשים", "מתחם פתוח עם מחצלות", "ליד הכניסה הראשית"). This is for helping people FIND the location. Do NOT include casual messages, greetings, or non-navigation text. If no such directions exist, set to undefined (do NOT fill)
- IMPORTANT: If a field doesn't have the exact type of information described above, set it to undefined. Do NOT fill fields with irrelevant or incorrect information just to have something there.
- If location information is completely missing or unclear, set City to empty string "" and all other location fields to undefined

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
 * Note: Image URLs from fetched pages are handled by AI, not added here automatically
 * @param {Object} event - Event object from OpenAI
 * @param {string} authorId - Author ID from raw message
 * @param {string|null} cloudinaryUrl - Cloudinary URL or null
 * @param {Object} originalMessage - Original WhatsApp message object
 * @param {Object} client - WhatsApp client instance
 * @returns {Promise<Object>} Enriched event object
 */
export async function enrichEvent(event, authorId, cloudinaryUrl, originalMessage, client) {
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
 * Main event processing pipeline
 * Orchestrates: payload building → OpenAI call → enrichment → update
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

    // Ignore messages with no text
    const messageText = rawMessage.text || ''
    if (!messageText || messageText.trim().length === 0) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Skipping message ${messageId} - no text content`)
      
      // Delete the event document since it won't have event information
      await deleteEventDocument(eventId)
      
      // Send failure confirmation
      const messagePreview = '(no text)'
      await sendEventConfirmation(messagePreview, false)
      return
    }

    // Get categories list
    const categoriesList = getCategoriesList()

    // Build OpenAI payload
    const payload = buildOpenAIPayload(rawMessage, cloudinaryUrl, categoriesList)

    // Call OpenAI
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Calling OpenAI API for message ${messageId}`)
    const event = await callOpenAIForEvent(payload, categoriesList)

    if (!event) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `OpenAI failed to generate event for message ${messageId}`)
      
      // Delete the event document since it has no event information
      await deleteEventDocument(eventId)
      
      // Send failure confirmation
      const messagePreview = (rawMessage.text || '').substring(0, 20) || '(no text)'
      await sendEventConfirmation(messagePreview, false)
      return
    }

    // Enrich event
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Enriching event for message ${messageId}`)
    const authorId = rawMessage.author || null
    const enrichedEvent = await enrichEvent(event, authorId, cloudinaryUrl, originalMessage, client)

    // Update MongoDB document
    const updated = await updateEventDocument(eventId, enrichedEvent)
    if (updated) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Successfully processed event for message ${messageId}`)
      
      // Send confirmation message
      const messagePreview = (rawMessage.text || '').substring(0, 20) || '(no text)'
      await sendEventConfirmation(messagePreview, true)
    } else {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Failed to update event document for message ${messageId}`)
      
      // Delete the event document since update failed
      await deleteEventDocument(eventId)
      
      // Send failure confirmation
      const messagePreview = (rawMessage.text || '').substring(0, 20) || '(no text)'
      await sendEventConfirmation(messagePreview, false)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Error in event pipeline for message ${messageId}: ${errorMsg}`)
    if (error instanceof Error && error.stack) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Stack trace: ${error.stack}`)
    }
    
    // Delete the event document since processing failed
    try {
      await deleteEventDocument(eventId)
    } catch (deleteError) {
      // Log but don't throw - deletion failure shouldn't mask the original error
      const deleteErrorMsg = deleteError instanceof Error ? deleteError.message : String(deleteError)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Failed to delete event document: ${deleteErrorMsg}`)
    }
    
    // Send failure confirmation on error
    try {
      const messagePreview = (rawMessage.text || '').substring(0, 20) || '(no text)'
      await sendEventConfirmation(messagePreview, false)
    } catch (confirmError) {
      // Don't let confirmation errors mask the original error
      const confirmErrorMsg = confirmError instanceof Error ? confirmError.message : String(confirmError)
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Failed to send confirmation: ${confirmErrorMsg}`)
    }
    
    // Don't throw - fail safely
  }
}
