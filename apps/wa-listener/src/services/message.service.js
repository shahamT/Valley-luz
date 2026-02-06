import { logger } from '../utils/logger.js'
import { extractMessageId, timestampToISO } from '../utils/messageHelpers.js'
import { LOG_PREFIXES, ALLOWED_MESSAGE_TYPES } from '../consts/index.js'
import { config } from '../config.js'

/**
 * Checks if message type is allowed for processing
 * @param {Object} message - Message object from whatsapp-web.js
 * @returns {boolean} True if message type is allowed
 */
export function isMessageTypeAllowed(message) {
  const messageType = message.type || message._data?.type || null
  return messageType && ALLOWED_MESSAGE_TYPES.includes(messageType)
}

/**
 * Serializes raw message data from WhatsApp message object
 * Flattens the structure: moves _data fields to top level along with hasMedia and mediaKey
 * Handles text vs media messages:
 * - No media: body -> text
 * - Has media: body -> imgBody, caption -> text
 * @param {Object} message - Message object from whatsapp-web.js
 * @returns {Object} Serialized message data with flattened structure
 */
export function serializeMessage(message) {
  const serialized = {}
  const hasMedia = message.hasMedia === true
  
  // Keep hasMedia if it exists
  if (message.hasMedia !== undefined) {
    serialized.hasMedia = message.hasMedia
  }
  
  // Keep mediaKey if it exists
  if (message.mediaKey !== undefined) {
    serialized.mediaKey = message.mediaKey
  }
  
  // Flatten _data fields to top level
  if (message._data) {
    const allowedDataFields = ['id', 'type', 't', 'notifyName', 'from', 'to', 'author', 'links']
    
    for (const field of allowedDataFields) {
      if (message._data[field] !== undefined) {
        serialized[field] = message._data[field]
      }
    }
    
    // Handle body/caption based on media presence
    if (hasMedia) {
      // For media messages: body -> imgBody, caption -> text
      if (message._data.body !== undefined) {
        serialized.imgBody = message._data.body
      }
      // Get caption from message (could be in _data.caption or message.caption)
      const caption = message._data.caption || message.caption || null
      if (caption !== null && caption !== undefined) {
        serialized.text = caption
      }
    } else {
      // For non-media messages: body -> text
      if (message._data.body !== undefined) {
        serialized.text = message._data.body
      }
    }
  }
  
  return serialized
}

/**
 * Processes message and logs processing info
 * Note: Cloudinary data is NOT added to rawMessage - it's stored separately in MongoDB
 * @param {Object} rawMessage - Raw message object
 * @param {Object|null} cloudinaryResult - Cloudinary upload result with url and data
 */
export function processMessage(rawMessage, cloudinaryResult = null) {
  if (config.logLevel === 'info') {
    const messageId = extractMessageId(rawMessage)
    // Get timestamp from t field (flattened structure)
    const timestamp = rawMessage.t ? timestampToISO(rawMessage.t) : 'unknown'
    const mediaInfo = cloudinaryResult ? ` (media: ${cloudinaryResult.cloudinaryUrl})` : ''
    logger.info(
      LOG_PREFIXES.MESSAGE_SERVICE,
      `Processed message ${messageId} at ${timestamp}${mediaInfo}`
    )
  }
}
