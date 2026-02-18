import { logger } from '../utils/logger.js'
import { extractMessageId } from '../utils/messageHelpers.js'
import { uploadMediaToCloudinary } from './cloudinary.service.js'
import { downloadMedia } from './whatsapp.service.js'
import { LOG_PREFIXES, MIME_TYPE_EXTENSIONS, DEFAULT_MIME_TYPE } from '../consts/index.js'

/**
 * Uploads media from a Baileys message to Cloudinary
 * @param {Object} msg - Baileys message object (proto.IWebMessageInfo)
 * @param {string} messageId - Message ID for filename
 * @param {Object} serializedMessage - Serialized message object (contains imgBody if available)
 * @returns {Promise<{cloudinaryUrl: string, cloudinaryData: object}|null>}
 */
export async function uploadMessageMedia(msg, messageId, serializedMessage = null) {
  try {
    const media = await downloadMedia(msg)
    if (!media || !media.data) {
      return null
    }

    const mimetype = media.mimetype || DEFAULT_MIME_TYPE
    let extension = mimetype.split('/')[1]?.split(';')[0] || 'bin'
    extension = MIME_TYPE_EXTENSIONS[extension] || extension

    const timestamp = msg.messageTimestamp ? Number(msg.messageTimestamp) : Date.now()
    const filename = `${messageId}_${timestamp}.${extension}`

    const buffer = Buffer.from(media.data, 'base64')

    const cloudinaryResult = await uploadMediaToCloudinary(buffer, filename, mimetype)

    if (!cloudinaryResult) {
      logger.error(LOG_PREFIXES.MEDIA_SERVICE, 'Failed to upload media to Cloudinary')
      return null
    }

    return {
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryData: cloudinaryResult,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MEDIA_SERVICE, `Error uploading media: ${errorMsg}`, error)
    return null
  }
}
