import { getMongoConnection } from '~/server/utils/mongodb'
import { MESSAGES_DEFAULT, MESSAGES_MAX } from '~/server/consts/index'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || MESSAGES_DEFAULT, MESSAGES_MAX)

  try {
    const { db } = await getMongoConnection()
    const collection = db.collection(process.env.MONGODB_COLLECTION_RAW_MESSAGES || 'raw_messages')

    // Query messages, sorted by createdAt descending (newest first)
    const cursor = collection.find({}).sort({ createdAt: -1 }).limit(limit)
    const documents = await cursor.toArray()

    // Extract raw messages from documents
    const messages = documents.map((doc) => doc.raw)

    // Get total count
    const total = await collection.countDocuments({})

    return {
      messages,
      total,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read messages: ${errorMessage}`,
    })
  }
})
