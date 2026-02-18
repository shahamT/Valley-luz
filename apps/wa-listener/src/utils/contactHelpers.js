import { logger } from './logger.js'
import { LOG_PREFIXES } from '../consts/index.js'

/**
 * Resolves WhatsApp author ID to phone number
 * In Baileys, participant JIDs are typically "972501234567@s.whatsapp.net"
 * @param {string} authorId - Participant JID from message
 * @param {Object} message - Baileys message object (unused but kept for API compatibility)
 * @param {Object} sock - Baileys socket instance
 * @returns {Promise<string|undefined>} Phone number string or undefined
 */
export async function resolvePublisherPhone(authorId, message, sock) {
  if (!authorId) {
    return undefined
  }

  try {
    // Method 1: Extract phone directly from participant JID (most reliable in Baileys)
    const phone = extractPhoneFromJid(authorId)
    if (phone) {
      return phone
    }

    // Method 2: Try onWhatsApp lookup if sock is available
    if (sock?.onWhatsApp) {
      try {
        const [result] = await sock.onWhatsApp(authorId)
        if (result?.jid) {
          const resolved = extractPhoneFromJid(result.jid)
          if (resolved) return resolved
        }
      } catch (_) { /* continue */ }
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
 * Extracts phone number from a WhatsApp JID
 * Handles formats like:
 * - "972501234567@s.whatsapp.net" -> "972501234567"
 * - "972501234567@c.us" -> "972501234567"
 * - "82734072487978@lid" -> tries to extract digits
 * @param {string} jid - WhatsApp JID string
 * @returns {string|undefined} Phone number or undefined
 */
function extractPhoneFromJid(jid) {
  if (!jid || typeof jid !== 'string') {
    return undefined
  }

  const number = jid.split('@')[0]
  if (/^\d+$/.test(number) && number.length >= 7 && number.length <= 15) {
    return number
  }

  const digitMatch = jid.match(/\d{7,15}/)
  if (digitMatch) {
    return digitMatch[0]
  }

  return undefined
}
