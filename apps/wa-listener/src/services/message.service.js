import { getContentType } from '@whiskeysockets/baileys'
import { logger } from '../utils/logger.js'
import { extractMessageId, timestampToISO } from '../utils/messageHelpers.js'
import { LOG_PREFIXES, ALLOWED_MESSAGE_TYPES } from '../consts/index.js'
import { config } from '../config.js'

const BAILEYS_TO_LEGACY_TYPE = {
  conversation: 'text',
  extendedTextMessage: 'text',
  imageMessage: 'image',
  videoMessage: 'video',
  stickerMessage: 'sticker',
  audioMessage: 'audio',
  documentMessage: 'document',
}

/**
 * Checks if message type is allowed for processing
 * @param {Object} msg - Baileys message object (proto.IWebMessageInfo)
 * @returns {boolean} True if message type is allowed
 */
export function isMessageTypeAllowed(msg) {
  const contentType = getContentType(msg.message)
  const legacyType = BAILEYS_TO_LEGACY_TYPE[contentType] || contentType
  return legacyType && ALLOWED_MESSAGE_TYPES.includes(legacyType)
}

/**
 * Serializes a Baileys message into the same flat structure the rest of the pipeline expects.
 * Preserves field names from the old whatsapp-web.js format so MongoDB documents stay compatible.
 * @param {Object} msg - Baileys message object (proto.IWebMessageInfo)
 * @returns {Object} Serialized message data with flattened structure
 */
export function serializeMessage(msg) {
  const serialized = {}
  const contentType = getContentType(msg.message)
  const inner = msg.message?.[contentType]

  const hasMedia = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(contentType)

  serialized.hasMedia = hasMedia
  if (hasMedia && inner?.mediaKey) {
    serialized.mediaKey = inner.mediaKey
  }

  serialized.id = msg.key?.id || null
  serialized.type = BAILEYS_TO_LEGACY_TYPE[contentType] || contentType || null
  serialized.t = msg.messageTimestamp ? Number(msg.messageTimestamp) : null
  serialized.notifyName = msg.pushName || null
  serialized.from = msg.key?.remoteJid || null
  serialized.to = msg.key?.remoteJid || null
  serialized.author = msg.key?.participant || null

  if (hasMedia) {
    serialized.imgBody = inner?.jpegThumbnail ? Buffer.from(inner.jpegThumbnail).toString('base64') : null
    const caption = inner?.caption || null
    if (caption) {
      serialized.text = caption
    }
  } else {
    const text = inner?.text || msg.message?.conversation || inner || null
    serialized.text = typeof text === 'string' ? text : null
  }

  return serialized
}

/**
 * Processes message and logs processing info
 * @param {Object} rawMessage - Raw message object
 * @param {Object|null} cloudinaryResult - Cloudinary upload result
 */
export function processMessage(rawMessage, cloudinaryResult = null) {
  if (config.logLevel === 'info') {
    const messageId = extractMessageId(rawMessage)
    const timestamp = rawMessage.t ? timestampToISO(rawMessage.t) : 'unknown'
    const mediaInfo = cloudinaryResult ? ` (media: ${cloudinaryResult.cloudinaryUrl})` : ''
    logger.info(
      LOG_PREFIXES.MESSAGE_SERVICE,
      `Processed message ${messageId} at ${timestamp}${mediaInfo}`
    )
  }
}
