import { appendFile, stat, rename } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { config } from './config.js'
import { uploadMediaToCloudinary } from './cloudinary.service.js'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/**
 * Extracts raw message data from WhatsApp message object
 * Serializes the message object to preserve all raw data
 * @param {Object} message - Message object from whatsapp-web.js
 * @param {Object} chat - Chat object from whatsapp-web.js
 * @returns {Object} Raw message data
 */
export function extractRawMessage(message, chat) {
  // Serialize message object to get all properties
  // Use JSON.parse/stringify to create a deep copy and handle circular references
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
    messageCopy.timestampISO = new Date(message.timestamp * 1000).toISOString()
  }
  
  return messageCopy
}

/**
 * Checks if file needs rotation and rotates if necessary
 */
async function rotateIfNeeded() {
  if (!existsSync(config.messagesFilePath)) {
    return
  }

  try {
    const stats = await stat(config.messagesFilePath)
    if (stats.size > MAX_FILE_SIZE) {
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const rotatedPath = join(
        dirname(config.messagesFilePath),
        `messages_${date}.jsonl`
      )
      await rename(config.messagesFilePath, rotatedPath)
      console.log(`[MessageWriter] Rotated file to ${rotatedPath}`)
    }
  } catch (error) {
    console.error('[MessageWriter] Error checking file size:', error.message)
  }
}

/**
 * Uploads media from a WhatsApp message to Cloudinary
 * @param {Object} message - Message object from whatsapp-web.js
 * @param {string} messageId - Message ID for filename
 * @returns {Promise<{cloudinaryUrl: string, cloudinaryData: object}|null>} Cloudinary URL and metadata or null if upload failed
 */
export async function uploadMediaToCloud(message, messageId) {
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
    const mimetype = media.mimetype || message.type || 'application/octet-stream'
    let extension = mimetype.split('/')[1]?.split(';')[0] || 'bin'
    
    // Map common mimetypes to extensions
    const extensionMap = {
      'jpeg': 'jpg',
      'quicktime': 'mov',
      'x-matroska': 'mkv',
    }
    extension = extensionMap[extension] || extension

    // Create filename: messageId_timestamp.extension
    const timestamp = message.timestamp || Date.now()
    const filename = `${messageId}_${timestamp}.${extension}`

    // Convert base64 to buffer
    const buffer = Buffer.from(media.data, 'base64')

    // Upload directly to Cloudinary
    const cloudinaryResult = await uploadMediaToCloudinary(buffer, filename, mimetype)
    
    if (!cloudinaryResult) {
      console.error('[MessageWriter] Failed to upload media to Cloudinary')
      return null
    }

    return {
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryData: cloudinaryResult,
    }
  } catch (error) {
    console.error('[MessageWriter] Error uploading media:', error.message)
    return null
  }
}

/**
 * Appends a raw message to the JSONL file
 * @param {Object} rawMessage - Raw message object
 * @param {Object|null} cloudinaryResult - Cloudinary upload result with url and data
 */
export async function writeMessage(rawMessage, cloudinaryResult = null) {
  try {
    // Add Cloudinary URL to message if available
    if (cloudinaryResult) {
      rawMessage.cloudinaryUrl = cloudinaryResult.cloudinaryUrl
      rawMessage.cloudinaryData = cloudinaryResult.cloudinaryData
      // For backward compatibility, also set localMediaPath to Cloudinary URL
      rawMessage.localMediaPath = cloudinaryResult.cloudinaryUrl
    }

    // Check and rotate if needed
    await rotateIfNeeded()

    // Append message as JSON line
    const jsonLine = JSON.stringify(rawMessage) + '\n'
    await appendFile(config.messagesFilePath, jsonLine, 'utf8')

    if (config.logLevel === 'info') {
      const messageId = rawMessage.id?._serialized || rawMessage.id?.id || 'unknown'
      const timestamp = rawMessage.timestamp ? new Date(rawMessage.timestamp * 1000).toISOString() : 'unknown'
      const mediaInfo = cloudinaryResult ? ` (media: ${cloudinaryResult.cloudinaryUrl})` : ''
      console.log(
        `[MessageWriter] Saved message ${messageId} at ${timestamp}${mediaInfo}`
      )
    }
  } catch (error) {
    console.error('[MessageWriter] Error writing message:', error.message)
    throw error
  }
}
