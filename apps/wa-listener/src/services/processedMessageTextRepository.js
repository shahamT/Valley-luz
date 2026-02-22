import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { LOG_PREFIXES } from '../consts/index.js'
import { computeMessageSignature } from '../utils/messageHelpers.js'
import { getDb } from './mongoConnection.js'

/**
 * Finds a processed message text document by exact text match.
 * Uses hash for lookup then verifies exact string (handles hash collision).
 * @param {string} messageText - Raw message text
 * @returns {Promise<Object|null>} Document if exact match found, null otherwise
 */
export async function findByExactText(messageText) {
  if (!messageText || typeof messageText !== 'string') {
    return null
  }
  const db = getDb()
  if (!db) {
    logger.warn(LOG_PREFIXES.MONGODB, 'Cannot find processed message text: MongoDB connection not established')
    return null
  }
  try {
    const textHash = computeMessageSignature(messageText)
    if (!textHash) return null
    const collection = db.collection(config.mongodb.collectionProcessedMessageTexts)
    const doc = await collection.findOne({ textHash })
    if (doc && doc.text === messageText) return doc
    return null
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Error finding processed message text: ${errorMsg}`)
    return null
  }
}

/**
 * Inserts a message text into the processed-message-texts collection.
 * Called immediately after we verify the message is not a duplicate (before media/event insert).
 * Idempotent: duplicate key (race) is treated as success.
 * @param {string} messageText - Raw message text
 * @returns {Promise<void>}
 */
export async function insertProcessedText(messageText) {
  if (!messageText || typeof messageText !== 'string') {
    return
  }
  const db = getDb()
  if (!db) {
    logger.warn(LOG_PREFIXES.MONGODB, 'Cannot insert processed message text: MongoDB connection not established')
    return
  }
  const textHash = computeMessageSignature(messageText)
  if (!textHash) return
  try {
    const collection = db.collection(config.mongodb.collectionProcessedMessageTexts)
    await collection.insertOne({
      textHash,
      text: messageText,
      createdAt: new Date(),
    })
    if (config.logLevel === 'info') {
      logger.info(LOG_PREFIXES.MONGODB, `Registered message text for duplicate detection (hash: ${textHash.substring(0, 8)}...)`)
    }
  } catch (error) {
    const code = error?.code
    if (code === 11000) {
      return
    }
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Error inserting processed message text: ${errorMsg}`)
  }
}
