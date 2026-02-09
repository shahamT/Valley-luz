import { EVENT_CATEGORIES } from '~/server/consts/events.const'

export default defineEventHandler(async (event) => {
  try {
    // Return categories as single source of truth from backend
    return EVENT_CATEGORIES
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch categories: ${errorMessage}`,
    })
  }
})
