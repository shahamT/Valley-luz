import { MongoClient } from 'mongodb'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { extractMessageId } from '../utils/messageHelpers.js'
import { LOG_PREFIXES } from '../consts/index.js'

let client = null
let db = null

/**
 * Ensures text index exists on rawMessage.text field for candidate search
 * Fails silently - logs warnings but never throws
 * @returns {Promise<boolean>} True if index exists or was created, false otherwise
 */
export async function ensureTextIndex() {
  if (!db) {
    return false
  }
  try {
    const collection = db.collection(config.mongodb.collectionEvents)
    // Check if text index exists
    const indexes = await collection.indexes()
    const hasTextIndex = indexes.some(idx => 
      idx.key && idx.key['rawMessage.text'] === 'text'
    )
    
    if (!hasTextIndex) {
      await collection.createIndex({ 'rawMessage.text': 'text' })
      logger.info(LOG_PREFIXES.MONGODB, 'Created text index on rawMessage.text')
    }
    return true
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.warn(LOG_PREFIXES.MONGODB, `Could not ensure text index: ${errorMsg}`)
    return false
  }
}

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
    
    // Ensure text index exists for candidate search
    await ensureTextIndex()
    
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
 * Finds candidate events using MongoDB text search
 * Fails silently - logs errors but never throws
 * @param {Array<string>} searchKeys - Array of search key phrases
 * @param {Object} excludeEventId - Event ID to exclude from search
 * @returns {Promise<Array>} Array of candidate documents with _id and rawMessage.text
 */
export async function findCandidateEvents(searchKeys, excludeEventId = null) {
  if (!db || !searchKeys || searchKeys.length === 0) {
    return []
  }
  
  try {
    const collection = db.collection(config.mongodb.collectionEvents)
    
    // Combine searchKeys into single search string
    const searchString = searchKeys.join(' ')
    
    // Build query: text search + isActive filter + exclude current event
    const query = {
      $text: { $search: searchString },
      isActive: true,
    }
    
    if (excludeEventId) {
      const excludeId = excludeEventId._id || excludeEventId
      query._id = { $ne: excludeId }
    }
    
    // Find candidates, limit to 5, return only _id and rawMessage.text
    const candidates = await collection
      .find(query)
      .project({ _id: 1, 'rawMessage.text': 1 })
      .limit(5)
      .toArray()
    
    if (config.logLevel === 'info' && candidates.length > 0) {
      logger.info(LOG_PREFIXES.MONGODB, `Found ${candidates.length} candidate event(s) for search: ${searchString.substring(0, 50)}...`)
    }
    
    return candidates
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Error finding candidate events: ${errorMsg}`)
    return []
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
 * Updates an existing event document with new event data and metadata
 * Fails silently - logs errors but never throws
 * @param {Object} eventId - MongoDB ObjectId or document with _id
 * @param {Object} newEvent - New event object
 * @param {Object} newRawMessage - New raw message object
 * @param {string|null} newCloudinaryUrl - New Cloudinary URL or null
 * @param {Object|null} newCloudinaryData - New Cloudinary metadata or null
 * @returns {Promise<boolean>} True if update succeeded, false otherwise
 */
export async function updateEventWithNewData(eventId, newEvent, newRawMessage, newCloudinaryUrl, newCloudinaryData) {
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
      { 
        $set: { 
          event: newEvent,
          rawMessage: newRawMessage,
          cloudinaryUrl: newCloudinaryUrl || null,
          cloudinaryData: newCloudinaryData || null,
          updatedAt: new Date(),
        } 
      }
    )

    if (result.matchedCount === 0) {
      logger.warn(LOG_PREFIXES.MONGODB, `Event document ${id} not found for update`)
      return false
    }

    if (config.logLevel === 'info') {
      logger.info(LOG_PREFIXES.MONGODB, `Updated event document ${id} with new data`)
    }

    return true
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Error updating event with new data: ${errorMsg}`)
    return false
  }
}

/**
 * Appends an old version to the previousVersions array
 * Fails silently - logs errors but never throws
 * @param {Object} eventId - MongoDB ObjectId or document with _id
 * @param {Object} oldVersion - Old version object with event, rawMessage, cloudinaryUrl, cloudinaryData, timestamp
 * @returns {Promise<boolean>} True if append succeeded, false otherwise
 */
export async function appendToPreviousVersions(eventId, oldVersion) {
  if (!db) {
    logger.warn(LOG_PREFIXES.MONGODB, 'Cannot append to previousVersions: MongoDB connection not established')
    return false
  }

  try {
    const collection = db.collection(config.mongodb.collectionEvents)
    
    // Extract _id if eventId is a document object
    const id = eventId._id || eventId

    const result = await collection.updateOne(
      { _id: id },
      { $push: { previousVersions: oldVersion } }
    )

    if (result.matchedCount === 0) {
      logger.warn(LOG_PREFIXES.MONGODB, `Event document ${id} not found for appending previous version`)
      return false
    }

    if (config.logLevel === 'info') {
      logger.info(LOG_PREFIXES.MONGODB, `Appended previous version to event document ${id}`)
    }

    return true
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Error appending to previousVersions: ${errorMsg}`)
    return false
  }
}

/**
 * Gets an event document by ID
 * Fails silently - logs errors but never throws
 * @param {Object} eventId - MongoDB ObjectId or document with _id
 * @returns {Promise<Object|null>} Event document or null if not found
 */
export async function getEventDocument(eventId) {
  if (!db) {
    logger.warn(LOG_PREFIXES.MONGODB, 'Cannot get event: MongoDB connection not established')
    return null
  }

  try {
    const collection = db.collection(config.mongodb.collectionEvents)
    
    // Extract _id if eventId is a document object
    const id = eventId._id || eventId

    const document = await collection.findOne({ _id: id })

    return document
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Error getting event document: ${errorMsg}`)
    return null
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
