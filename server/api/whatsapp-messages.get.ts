import { getMongoConnection } from '~/server/utils/mongodb'
import { requireApiSecret } from '~/server/utils/requireApiSecret'
import { checkRateLimit } from '~/server/utils/rateLimit'
import { MESSAGES_DEFAULT, MESSAGES_MAX } from '~/server/consts/index'

export default defineEventHandler(async (event) => {
  checkRateLimit(event)
  requireApiSecret(event)
  const query = getQuery(event)
  const limit = Math.min(parseInt(query.limit as string) || MESSAGES_DEFAULT, MESSAGES_MAX)

  try {
    const config = useRuntimeConfig()
    const { db } = await getMongoConnection()
    const collection = db.collection(config.mongodbCollectionRawMessages || process.env.MONGODB_COLLECTION_RAW_MESSAGES || 'raw_messages')

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
    console.error('[whatsapp-messages] Failed to read messages:', error instanceof Error ? error.message : String(error))
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to read messages',
    })
  }
})
