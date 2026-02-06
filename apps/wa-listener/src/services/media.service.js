import { logger } from '../utils/logger.js'
import { extractMessageId } from '../utils/messageHelpers.js'
import { uploadMediaToCloudinary } from './cloudinary.service.js'
import { LOG_PREFIXES, MIME_TYPE_EXTENSIONS, DEFAULT_MIME_TYPE } from '../consts/index.js'

/**
 * Uploads media from a WhatsApp message to Cloudinary
 * Uses imgBody from serialized message if available for metadata
 * @param {Object} message - Message object from whatsapp-web.js
 * @param {string} messageId - Message ID for filename
 * @param {Object} serializedMessage - Serialized message object (contains imgBody if available)
 * @returns {Promise<{cloudinaryUrl: string, cloudinaryData: object}|null>} Cloudinary URL and metadata or null if upload failed
 */
export async function uploadMessageMedia(message, messageId, serializedMessage = null) {
  if (!message.hasMedia) {
    return null
  }

  try {
    // Get media buffer from message
    const media = await message.downloadMedia()
    if (!media || !media.data) {
      return null
    }

    // Determine file extension from mimetype
    const mimetype = media.mimetype || message.type || DEFAULT_MIME_TYPE
    let extension = mimetype.split('/')[1]?.split(';')[0] || 'bin'
    
    // Map common mimetypes to extensions
    extension = MIME_TYPE_EXTENSIONS[extension] || extension

    // Create filename: messageId_timestamp.extension
    // Use imgBody from serialized message if available for better filename context
    const timestamp = message.timestamp || message._data?.t || Date.now()
    const filename = `${messageId}_${timestamp}.${extension}`

    // Convert base64 to buffer
    const buffer = Buffer.from(media.data, 'base64')

    // Upload directly to Cloudinary
    // Note: imgBody from serializedMessage can be used for metadata if needed
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
