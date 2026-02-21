import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { extractMessageId } from '../utils/messageHelpers.js'
import { LOG_PREFIXES } from '../consts/index.js'
import { getDb } from './mongoConnection.js'

/**
 * Inserts a message document into MongoDB.
 * Fails silently - logs errors but never throws.
 * @param {Object} rawMessage - The raw message object (without cloudinaryUrl/cloudinaryData)
 * @param {string|null} cloudinaryUrl - Cloudinary URL or null
 * @param {Object|null} cloudinaryData - Cloudinary metadata or null
 */
export async function insertMessage(rawMessage, cloudinaryUrl, cloudinaryData) {
  const db = getDb()
  if (!db) {
    logger.warn(LOG_PREFIXES.MONGODB, 'Cannot insert message: MongoDB connection not established')
    return
  }

  try {
    const collection = db.collection(config.mongodb.collectionRawMessages)
    const document = {
      createdAt: new Date(),
      cloudinaryUrl: cloudinaryUrl || null,
      cloudinaryData: cloudinaryData || null,
      raw: rawMessage,
    }

    await collection.insertOne(document)

    if (config.logLevel === 'info') {
      const messageId = extractMessageId(rawMessage)
      logger.info(LOG_PREFIXES.MONGODB, `Inserted message ${messageId} to collection ${config.mongodb.collectionRawMessages}`)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Error inserting message: ${errorMsg}`)
  }
}
