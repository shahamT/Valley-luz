import { logger } from './logger.js'
import { LOG_PREFIXES } from '../consts/index.js'

/**
 * Resolves WhatsApp author ID to phone number.
 * In Baileys, participant can be a phone JID (972501234567@s.whatsapp.net) or a LID (e.g. 82734072487978@lid).
 * For LID we use message.key.participantAlt (Baileys v7) or sock.signalRepository.lidMapping.getPNForLID.
 * @param {string} authorId - Participant JID from message (may be LID or phone JID)
 * @param {Object} message - Baileys message object (message.key.participantAlt when participant is LID)
 * @param {Object} sock - Baileys socket instance (signalRepository.lidMapping for LID lookup)
 * @returns {Promise<string|undefined>} Phone number string (digits) or undefined
 */
export async function resolvePublisherPhone(authorId, message, sock) {
  if (!authorId) {
    return undefined
  }

  try {
    // LID: never use LID digits as phone; resolve via participantAlt or lidMapping (Baileys v7)
    if (authorId.endsWith('@lid')) {
      const fromAlt = message?.key?.participantAlt && extractPhoneFromJid(message.key.participantAlt)
      if (fromAlt) return fromAlt
      const lidMapping = sock?.signalRepository?.lidMapping
      if (typeof lidMapping?.getPNForLID === 'function') {
        try {
          const pnJid = await lidMapping.getPNForLID(authorId)
          if (pnJid) {
            const phone = extractPhoneFromJid(pnJid)
            if (phone) return phone
          }
        } catch (_) { /* continue */ }
      }
      logger.warn(LOG_PREFIXES.CONTACT_SERVICE, `Could not resolve phone for LID authorId: ${authorId}`)
      return undefined
    }

    // Phone JID: extract digits; fallback onWhatsApp if needed
    const phone = extractPhoneFromJid(authorId)
    if (phone) return phone

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
 * Extracts phone number from a WhatsApp JID.
 * Handles: "972501234567@s.whatsapp.net" -> "972501234567"; "972501234567:0@s.whatsapp.net" -> "972501234567".
 * Does not treat LID as phone (LID digits are not a wa.me number).
 * @param {string} jid - WhatsApp JID string
 * @returns {string|undefined} Phone number (digits) or undefined
 */
function extractPhoneFromJid(jid) {
  if (!jid || typeof jid !== 'string') {
    return undefined
  }
  if (jid.endsWith('@lid')) {
    return undefined
  }

  const number = jid.split('@')[0]
  const userPart = number.includes(':') ? number.split(':')[0] : number
  if (/^\d+$/.test(userPart) && userPart.length >= 7 && userPart.length <= 15) {
    return userPart
  }

  const digitMatch = jid.match(/\d{7,15}/)
  if (digitMatch) {
    return digitMatch[0]
  }

  return undefined
}
