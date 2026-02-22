import { getMongoConnection } from '~/server/utils/mongodb'
import { escapeRegex } from '~/server/utils/regexEscape'
import { requireApiSecret } from '~/server/utils/requireApiSecret'
import { checkRateLimit } from '~/server/utils/rateLimit'

/**
 * Media endpoint - redirects to Cloudinary URL
 * Looks up message by filename pattern in MongoDB and redirects to Cloudinary URL
 */
export default defineEventHandler(async (event) => {
  await checkRateLimit(event)
  requireApiSecret(event)
  const filename = getRouterParam(event, 'filename')

  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Filename is required',
    })
  }

  // Security: prevent path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid filename',
    })
  }

  try {
    const config = useRuntimeConfig()
    const { db } = await getMongoConnection()
    const collection = db.collection(config.mongodbCollectionRawMessages || process.env.MONGODB_COLLECTION_RAW_MESSAGES || 'raw_messages')

    // Find document where cloudinaryUrl contains the filename (escape to prevent $regex injection)
    // Filename format: messageId_timestamp.extension
    const document = await collection.findOne({
      cloudinaryUrl: { $regex: escapeRegex(filename) }
    })

    if (!document || !document.cloudinaryUrl) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Media file not found',
      })
    }

    // Redirect to Cloudinary URL
    return sendRedirect(event, document.cloudinaryUrl, 302)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('[whatsapp-media] Failed to retrieve media:', error instanceof Error ? error.message : String(error))
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve media',
    })
  }
})
