import crypto from 'crypto'
import { DEFAULTS } from '../consts/index.js'

/**
 * Extracts message ID from a Baileys message or serialized message
 * @param {Object} message - Baileys msg object or serialized (flattened) message
 * @returns {string} Message ID or 'unknown'
 */
export function extractMessageId(message) {
  if (!message) {
    return DEFAULTS.UNKNOWN_MESSAGE_ID
  }

  // Serialized flat format (has .id as string)
  if (typeof message.id === 'string') {
    return message.id
  }

  // Baileys raw format (has .key.id)
  if (message.key?.id) {
    return message.key.id
  }

  return DEFAULTS.UNKNOWN_MESSAGE_ID
}

/**
 * Extracts group ID from a chat-like object
 * In Baileys the group JID is already a plain string (e.g. "120363...@g.us")
 * @param {Object} chat - Object with { id, name } or plain string
 * @returns {string|null} Group ID or null
 */
export function extractGroupId(chat) {
  if (!chat) return null
  if (typeof chat === 'string') return chat
  return chat.id || null
}

/**
 * Converts Unix timestamp to ISO string
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} ISO timestamp string
 */
export function timestampToISO(timestamp) {
  if (!timestamp) {
    return 'unknown'
  }
  return new Date(timestamp * 1000).toISOString()
}

/**
 * Gets group name from a chat-like object
 * @param {Object} chat - Object with { name } or { subject }
 * @returns {string} Group name or default
 */
export function getGroupName(chat) {
  return chat?.name || chat?.subject || DEFAULTS.UNKNOWN_GROUP_NAME
}

/**
 * Gets sender name from a Baileys message or serialized message
 * @param {Object} message - Baileys msg or serialized message
 * @returns {string} Sender name or default
 */
export function getSenderName(message) {
  return message?.pushName || message?.notifyName || DEFAULTS.UNKNOWN_SENDER
}

/**
 * Computes a deterministic message signature from normalized text
 * @param {string} text - Message text
 * @returns {string|null} Hex string signature or null if no text
 */
export function computeMessageSignature(text) {
  if (!text || typeof text !== 'string') {
    return null
  }
  const normalized = text.trim().replace(/\s+/g, ' ')
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex')
}
