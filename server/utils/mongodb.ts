import { MongoClient, Db } from 'mongodb'

let client: MongoClient | null = null
let db: Db | null = null

/**
 * Gets MongoDB connection from environment variables
 * Reuses existing connection if available
 * @returns {Promise<{client: MongoClient, db: Db}>} MongoDB client and database
 */
export async function getMongoConnection() {
  if (client && db) {
    return { client, db }
  }

  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB_NAME

  if (!uri || !dbName) {
    throw new Error('MongoDB configuration missing: MONGODB_URI and MONGODB_DB_NAME are required')
  }

  client = new MongoClient(uri)
  await client.connect()
  db = client.db(dbName)

  return { client, db }
}

/**
 * Closes MongoDB connection
 */
export async function closeMongoConnection() {
  if (client) {
    await client.close()
    client = null
    db = null
  }
}
