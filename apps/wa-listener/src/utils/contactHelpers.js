import { logger } from './logger.js'
import { LOG_PREFIXES } from '../consts/index.js'

/**
 * Resolves WhatsApp author ID to phone number
 * Attempts multiple methods to get contact information
 * @param {string} authorId - Author ID from message (e.g., "82734072487978@lid")
 * @param {Object} message - WhatsApp message object from whatsapp-web.js
 * @param {Object} client - WhatsApp client instance
 * @returns {Promise<string|undefined>} Phone number string or undefined if resolution fails
 */
export async function resolvePublisherPhone(authorId, message, client) {
  if (!authorId || !message || !client) {
    return undefined
  }

  try {
    // Method 1: Try to get contact from message
    if (message.getContact) {
      try {
        const contact = await message.getContact()
        if (contact && contact.number) {
          return contact.number
        }
        // Try to extract from contact ID if number not available
        if (contact && contact.id) {
          const contactId = contact.id._serialized || contact.id
          const phone = extractPhoneFromId(contactId)
          if (phone) {
            return phone
          }
        }
      } catch (error) {
        // Continue to next method
      }
    }

    // Method 2: Try client.getContactById if available
    if (client.getContactById) {
      try {
        const contact = await client.getContactById(authorId)
        if (contact && contact.number) {
          return contact.number
        }
        if (contact && contact.id) {
          const contactId = contact.id._serialized || contact.id
          const phone = extractPhoneFromId(contactId)
          if (phone) {
            return phone
          }
        }
      } catch (error) {
        // Continue to next method
      }
    }

    // Method 3: Extract phone directly from authorId
    const phone = extractPhoneFromId(authorId)
    if (phone) {
      return phone
    }

    logger.warn(LOG_PREFIXES.CONTACT_SERVICE, `Could not resolve phone for authorId: ${authorId}`)
    return undefined
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.warn(LOG_PREFIXES.CONTACT_SERVICE, `Error resolving phone for authorId ${authorId}: ${errorMsg}`)
    return undefined
  }
}

/**
 * Extracts phone number from WhatsApp ID
 * Handles formats like:
 * - "972501234567@c.us" -> "972501234567"
 * - "82734072487978@lid" -> tries to extract digits
 * @param {string} id - WhatsApp ID string
 * @returns {string|undefined} Phone number or undefined
 */
function extractPhoneFromId(id) {
  if (!id || typeof id !== 'string') {
    return undefined
  }

  // If it's a @c.us format, extract the number part
  if (id.includes('@c.us')) {
    const number = id.split('@')[0]
    // Validate it looks like a phone number (digits only, reasonable length)
    if (/^\d+$/.test(number) && number.length >= 7 && number.length <= 15) {
      return number
    }
  }

  // For @lid format, try to extract digits (may not be reliable)
  if (id.includes('@lid')) {
    const digits = id.split('@')[0]
    // Only return if it looks like a phone number
    if (/^\d+$/.test(digits) && digits.length >= 7 && digits.length <= 15) {
      return digits
    }
  }

  // Try to extract any sequence of digits that looks like a phone number
  const digitMatch = id.match(/\d{7,15}/)
  if (digitMatch) {
    return digitMatch[0]
  }

  return undefined
}
