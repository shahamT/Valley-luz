import { logger } from '../utils/logger.js'
import { extractMessageId, timestampToISO } from '../utils/messageHelpers.js'
import { LOG_PREFIXES } from '../consts/index.js'
import { config } from '../config.js'

/**
 * Serializes raw message data from WhatsApp message object
 * Preserves all raw data for storage
 * @param {Object} message - Message object from whatsapp-web.js
 * @param {Object} chat - Chat object from whatsapp-web.js
 * @returns {Object} Serialized message data
 */
export function serializeMessage(message, chat) {
  const messageCopy = {}
  
  // Copy all enumerable properties from message
  for (const key in message) {
    try {
      // Skip functions and circular references
      if (typeof message[key] !== 'function') {
        messageCopy[key] = message[key]
      }
    } catch (e) {
      // Skip properties that can't be accessed
    }
  }
  
  // Handle special properties that might be objects
  if (message.id) {
    messageCopy.id = {
      _serialized: message.id._serialized || null,
      id: message.id.id || null,
      fromMe: message.id.fromMe || null,
      remote: message.id.remote || null,
    }
  }
  
  // Add chat information
  messageCopy.chat = {
    id: chat.id?._serialized || chat.id || null,
    name: chat.name || null,
    isGroup: chat.isGroup || false,
    isReadOnly: chat.isReadOnly || false,
    timestamp: chat.timestamp || null,
  }
  
  // Add timestamp as ISO string for easier reading
  if (message.timestamp) {
    messageCopy.timestampISO = timestampToISO(message.timestamp)
  }
  
  return messageCopy
}

/**
 * Processes message and adds Cloudinary URL if available
 * Messages are stored in MongoDB only, not in local files
 * @param {Object} rawMessage - Raw message object
 * @param {Object|null} cloudinaryResult - Cloudinary upload result with url and data
 */
export function processMessage(rawMessage, cloudinaryResult = null) {
  // Add Cloudinary URL to message if available (for MongoDB storage)
  if (cloudinaryResult) {
    rawMessage.cloudinaryUrl = cloudinaryResult.cloudinaryUrl
    rawMessage.cloudinaryData = cloudinaryResult.cloudinaryData
  }

  if (config.logLevel === 'info') {
    const messageId = extractMessageId(rawMessage)
    const timestamp = rawMessage.timestamp ? timestampToISO(rawMessage.timestamp) : 'unknown'
    const mediaInfo = cloudinaryResult ? ` (media: ${cloudinaryResult.cloudinaryUrl})` : ''
    logger.info(
      LOG_PREFIXES.MESSAGE_SERVICE,
      `Processed message ${messageId} at ${timestamp}${mediaInfo}`
    )
  }
}
