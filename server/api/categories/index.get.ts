import { EVENT_CATEGORIES } from '~/server/consts/events.const'

export default defineEventHandler(async (event) => {
  try {
    // Return categories as single source of truth from backend
    return EVENT_CATEGORIES
  } catch (error: unknown) {
    console.error('[categories] Failed to fetch categories:', error instanceof Error ? error.message : String(error))
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch categories',
    })
  }
})
