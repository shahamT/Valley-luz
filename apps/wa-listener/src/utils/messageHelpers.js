import crypto from 'crypto'
import { DEFAULTS } from '../consts/index.js'

/**
 * Extracts message ID from WhatsApp message object
 * Handles both original message structure and serialized (flattened) message structure
 * @param {Object} message - Message object from whatsapp-web.js or serialized message
 * @returns {string} Message ID or 'unknown'
 */
export function extractMessageId(message) {
  if (!message) {
    return DEFAULTS.UNKNOWN_MESSAGE_ID
  }
  
  // Handle message.id (works for both original and flattened structures)
  if (message.id) {
    // If id is an object with _serialized property
    if (typeof message.id === 'object' && message.id._serialized) {
      return message.id._serialized
    }
    // If id is an object with id property
    if (typeof message.id === 'object' && message.id.id) {
      return message.id.id
    }
    // If id is a string
    if (typeof message.id === 'string') {
      return message.id
    }
  }
  
  return DEFAULTS.UNKNOWN_MESSAGE_ID
}

/**
 * Extracts group ID from chat object
 * @param {Object} chat - Chat object from whatsapp-web.js
 * @returns {string|null} Group ID or null
 */
export function extractGroupId(chat) {
  if (!chat || !chat.id) {
    return null
  }
  return chat.id._serialized || chat.id || null
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
 * Gets group name from chat object
 * @param {Object} chat - Chat object from whatsapp-web.js
 * @returns {string} Group name or default
 */
export function getGroupName(chat) {
  return chat?.name || DEFAULTS.UNKNOWN_GROUP_NAME
}

/**
 * Gets sender name from message object
 * @param {Object} message - Message object from whatsapp-web.js
 * @returns {string} Sender name or default
 */
export function getSenderName(message) {
  return message?.notifyName || message?._data?.notifyName || DEFAULTS.UNKNOWN_SENDER
}

/**
 * Computes a deterministic message signature from normalized text
 * Normalizes whitespace and creates SHA-256 hash
 * @param {string} text - Message text
 * @returns {string|null} Hex string signature or null if no text
 */
export function computeMessageSignature(text) {
  if (!text || typeof text !== 'string') {
    return null
  }
  // Normalize whitespace: trim, collapse multiple spaces/tabs/newlines to single space
  const normalized = text.trim().replace(/\s+/g, ' ')
  // Create deterministic hash
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex')
}
