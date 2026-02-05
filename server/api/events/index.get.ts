export default defineEventHandler(async (event) => {
  try {
    // Import events data
    // In production, this could fetch from a database
    const eventsData = await import('~/server/data/events.json')
    return eventsData.default
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch events',
    })
  }
})
