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
 * Finds an existing event document by message signature
 * Fails silently - logs errors but never throws
 * @param {string} signature - Message signature (SHA-256 hash)
 * @returns {Promise<Object|null>} Existing document if found, null otherwise
 */
export async function findEventBySignature(signature) {
  if (!db || !signature) {
    return null
  }
  try {
    const collection = db.collection(config.mongodb.collectionEvents)
    const existing = await collection.findOne({ messageSignature: signature })
    return existing
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Error finding event by signature: ${errorMsg}`)
    return null
  }
}

/**
 * Inserts an event document into MongoDB
 * Fails silently - logs errors but never throws
 * @param {Object} rawMessage - The raw message object
 * @param {string|null} cloudinaryUrl - Cloudinary URL or null
 * @param {Object|null} cloudinaryData - Cloudinary metadata or null
 * @param {string|null} messageSignature - Message signature (SHA-256 hash) or null
 * @returns {Promise<Object|null>} Inserted document with _id or null on failure
 */
export async function insertEventDocument(rawMessage, cloudinaryUrl, cloudinaryData, messageSignature = null) {
  // If not connected, log warning and skip
  if (!db) {
    logger.warn(LOG_PREFIXES.MONGODB, 'Cannot insert event: MongoDB connection not established')
    return null
  }

  try {
    const collection = db.collection(config.mongodb.collectionEvents)
    const document = {
      createdAt: new Date(),
      rawMessage: rawMessage,
      cloudinaryUrl: cloudinaryUrl || null,
      cloudinaryData: cloudinaryData || null,
      event: null,
      previousVersions: [],
      isActive: true,
      messageSignature: messageSignature || null,
    }

    const result = await collection.insertOne(document)

    if (config.logLevel === 'info') {
      const messageId = extractMessageId(rawMessage)
      logger.info(LOG_PREFIXES.MONGODB, `Inserted event document ${result.insertedId} for message ${messageId}`)
    }

    // Return document with _id
    return { ...document, _id: result.insertedId }
  } catch (error) {
    // Fail-safe: log error but don't throw
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Error inserting event document: ${errorMsg}`)
    return null
  }
}

/**
 * Deletes an event document from MongoDB
 * Fails silently - logs errors but never throws
 * @param {Object} eventId - MongoDB ObjectId or document with _id
 * @returns {Promise<boolean>} True if deletion succeeded, false otherwise
 */
export async function deleteEventDocument(eventId) {
  // If not connected, log warning and skip
  if (!db) {
    logger.warn(LOG_PREFIXES.MONGODB, 'Cannot delete event: MongoDB connection not established')
    return false
  }

  try {
    const collection = db.collection(config.mongodb.collectionEvents)
    
    // Extract _id if eventId is a document object
    const id = eventId._id || eventId

    const result = await collection.deleteOne({ _id: id })

    if (result.deletedCount === 0) {
      logger.warn(LOG_PREFIXES.MONGODB, `Event document ${id} not found for deletion`)
      return false
    }

    if (config.logLevel === 'info') {
      logger.info(LOG_PREFIXES.MONGODB, `Deleted event document ${id}`)
    }

    return true
  } catch (error) {
    // Fail-safe: log error but don't throw
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Error deleting event document: ${errorMsg}`)
    return false
  }
}

/**
 * Updates an event document with the enriched event object
 * Fails silently - logs errors but never throws
 * @param {Object} eventId - MongoDB ObjectId or document with _id
 * @param {Object} event - Enriched event object to store
 * @returns {Promise<boolean>} True if update succeeded, false otherwise
 */
export async function updateEventDocument(eventId, event) {
  // If not connected, log warning and skip
  if (!db) {
    logger.warn(LOG_PREFIXES.MONGODB, 'Cannot update event: MongoDB connection not established')
    return false
  }

  try {
    const collection = db.collection(config.mongodb.collectionEvents)
    
    // Extract _id if eventId is a document object
    const id = eventId._id || eventId

    const result = await collection.updateOne(
      { _id: id },
      { $set: { event: event } }
    )

    if (result.matchedCount === 0) {
      logger.warn(LOG_PREFIXES.MONGODB, `Event document ${id} not found for update`)
      return false
    }

    if (config.logLevel === 'info') {
      logger.info(LOG_PREFIXES.MONGODB, `Updated event document ${id} with event data`)
    }

    return true
  } catch (error) {
    // Fail-safe: log error but don't throw
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Error updating event document: ${errorMsg}`)
    return false
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
