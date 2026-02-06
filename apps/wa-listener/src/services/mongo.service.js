import { MongoClient } from 'mongodb'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { extractMessageId } from '../utils/messageHelpers.js'
import { LOG_PREFIXES } from '../consts/index.js'

let client = null
let db = null

/**
 * Connects to MongoDB and stores connection references
 * Reuses existing connection if already connected
 * @returns {Promise<MongoClient>} MongoDB client instance
 */
export async function connect() {
  if (client) {
    return client
  }

  try {
    logger.info(LOG_PREFIXES.MONGODB, 'Connecting to MongoDB...')
    // Mask password in URI for logging
    const maskedUri = config.mongodb.uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')
    logger.info(LOG_PREFIXES.MONGODB, `URI: ${maskedUri}`)
    logger.info(LOG_PREFIXES.MONGODB, `Database: ${config.mongodb.dbName}`)
    client = new MongoClient(config.mongodb.uri)
    await client.connect()
    db = client.db(config.mongodb.dbName)
    logger.info(LOG_PREFIXES.MONGODB, `Connected to database: ${config.mongodb.dbName}`)
    return client
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Connection error: ${errorMsg}`)
    logger.error(LOG_PREFIXES.MONGODB, 'Connection failed - MongoDB inserts will be skipped')
    // Don't throw - allow process to continue (fail-safe)
    client = null
    db = null
    return null
  }
}

/**
 * Inserts a message document into MongoDB
 * Fails silently - logs errors but never throws
 * @param {Object} rawMessage - The raw message object (without cloudinaryUrl/cloudinaryData)
 * @param {string|null} cloudinaryUrl - Cloudinary URL or null
 * @param {Object|null} cloudinaryData - Cloudinary metadata or null
 */
export async function insertMessage(rawMessage, cloudinaryUrl, cloudinaryData) {
  // If not connected, log warning and skip
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
    // Fail-safe: log error but don't throw
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Error inserting message: ${errorMsg}`)
  }
}

/**
 * Closes the MongoDB connection gracefully
 */
export async function close() {
  if (client) {
    try {
      logger.info(LOG_PREFIXES.MONGODB, 'Closing connection...')
      await client.close()
      client = null
      db = null
      logger.info(LOG_PREFIXES.MONGODB, 'Connection closed')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error(LOG_PREFIXES.MONGODB, `Error closing connection: ${errorMsg}`)
    }
  }
}
