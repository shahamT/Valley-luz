import { MongoClient } from 'mongodb'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { LOG_PREFIXES } from '../consts/index.js'

let client = null
let db = null

/**
 * Returns the current database instance (null if not connected).
 * Used by message and event repositories.
 * @returns {import('mongodb').Db|null}
 */
export function getDb() {
  return db
}

/**
 * Ensures text index exists on rawMessage.text field for candidate search.
 * Fails silently - logs warnings but never throws.
 * @returns {Promise<boolean>} True if index exists or was created, false otherwise
 */
export async function ensureTextIndex() {
  if (!db) {
    return false
  }
  try {
    const collection = db.collection(config.mongodb.collectionEvents)
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
 * Connects to MongoDB and stores connection references.
 * Reuses existing connection if already connected.
 * @returns {Promise<MongoClient|null>} MongoDB client instance or null on failure
 */
export async function connect() {
  if (client) {
    return client
  }

  try {
    logger.info(LOG_PREFIXES.MONGODB, 'Connecting to MongoDB...')
    const maskedUri = config.mongodb.uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')
    logger.info(LOG_PREFIXES.MONGODB, `URI: ${maskedUri}`)
    logger.info(LOG_PREFIXES.MONGODB, `Database: ${config.mongodb.dbName}`)
    client = new MongoClient(config.mongodb.uri)
    await client.connect()
    db = client.db(config.mongodb.dbName)
    logger.info(LOG_PREFIXES.MONGODB, `Connected to database: ${config.mongodb.dbName}`)

    await ensureTextIndex()

    return client
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.MONGODB, `Connection error: ${errorMsg}`)
    logger.error(LOG_PREFIXES.MONGODB, 'Connection failed - MongoDB inserts will be skipped')
    client = null
    db = null
    return null
  }
}

/**
 * Closes the MongoDB connection gracefully.
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
