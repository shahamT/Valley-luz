import { getMongoConnection } from '~/server/utils/mongodb'

/** Returns YYYY-MM-DD in Israel (Asia/Jerusalem) from an ISO date-time string. Used when deriving occurrence.date from startTime. */
function getDateInIsraelFromIso(isoString: string | undefined): string | undefined {
  if (!isoString) return undefined
  const d = new Date(isoString)
  if (Number.isNaN(d.getTime())) return undefined
  const formatted = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' })
  const parts = formatted.split('-')
  if (parts.length !== 3) return undefined
  return `${parts[0]}-${parts[1]}-${parts[2]}`
}

/**
 * Transforms backend event structure to frontend format
 * - Title → title
 * - occurrence (singular) → occurrences (array)
 * - location.City → location.city
 * - _id → id (string)
 * - Preserve occurrence.date when present; when missing, derive from startTime for backward compatibility
 */
function transformEventForFrontend(doc: any) {
  const backendEvent = doc.event
  if (!backendEvent) {
    return null
  }

  const eventId = doc._id?.toString() || String(doc._id)
  const dateCreated = doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt)

  // Transform occurrence (singular) to occurrences (array)
  // Preserve the occurrence object structure (date, hasTime, startTime, endTime)
  const rawOccurrences = backendEvent.occurrence
    ? [backendEvent.occurrence]
    : backendEvent.occurrences && Array.isArray(backendEvent.occurrences)
    ? backendEvent.occurrences
    : []
  const occurrences = rawOccurrences.map((occ: any) => {
    const date = occ?.date && /^\d{4}-\d{2}-\d{2}$/.test(String(occ.date).trim().slice(0, 10))
      ? String(occ.date).trim().slice(0, 10)
      : getDateInIsraelFromIso(occ?.startTime)
    return { ...occ, ...(date ? { date } : {}) }
  })

  // Validate occurrence structure
  if (occurrences.length > 0 && !occurrences[0].startTime) {
    console.warn('[EventsAPI] Occurrence missing startTime:', occurrences[0])
  }

  return {
    id: eventId,
    title: backendEvent.Title || '',
    shortDescription: backendEvent.shortDescription || '',
    fullDescription: backendEvent.fullDescription || '',
    categories: backendEvent.categories || [],
    mainCategory: backendEvent.mainCategory || '',
    price: backendEvent.price ?? null,
    media: backendEvent.media || [],
    urls: backendEvent.urls || [],
    location: {
      city: backendEvent.location?.City || '',
      addressLine1: backendEvent.location?.addressLine1 || undefined,
      addressLine2: backendEvent.location?.addressLine2 || undefined,
      locationDetails: backendEvent.location?.locationDetails || undefined,
      wazeNavLink: backendEvent.location?.wazeNavLink || undefined,
      gmapsNavLink: backendEvent.location?.gmapsNavLink || undefined,
    },
    occurrences: occurrences,
    isActive: doc.isActive !== false,
    dateCreated: dateCreated,
    publisherPhone: backendEvent.publisherPhone || undefined,
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const mongoUri = config.mongodbUri || process.env.MONGODB_URI
  const mongoDbName = config.mongodbDbName || process.env.MONGODB_DB_NAME
  const collectionName = config.mongodbCollectionEvents || process.env.MONGODB_COLLECTION_EVENTS || 'events'

  if (!mongoUri || !mongoDbName) {
    console.error('[EventsAPI] MongoDB not configured')
    return []
  }

  try {
    const { db } = await getMongoConnection()
    const collection = db.collection(collectionName)

    // Only fetch events with start date later than 5 days before the first day of current month
    const now = new Date()
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const cutoff = new Date(firstDayOfCurrentMonth)
    cutoff.setDate(cutoff.getDate() - 5)
    const cutoffISO = cutoff.toISOString()

    // Support both BSON Date and ISO string storage for startTime
    const query = {
      isActive: true,
      event: { $ne: null },
      $or: [
        { 'event.occurrence.startTime': { $gt: cutoff } },
        { 'event.occurrence.startTime': { $gt: cutoffISO } },
        { 'event.occurrences.startTime': { $gt: cutoff } },
        { 'event.occurrences.startTime': { $gt: cutoffISO } },
      ],
    }

    const documents = await collection.find(query).toArray()

    const transformedEvents = documents
      .map((doc) => {
        try {
          return transformEventForFrontend(doc)
        } catch (error) {
          console.error('[EventsAPI] Error transforming document:', error instanceof Error ? error.message : String(error))
          return null
        }
      })
      .filter((transformedEvent) => transformedEvent !== null)

    return transformedEvents
  } catch (error) {
    console.error('[EventsAPI] Error fetching events:', error instanceof Error ? error.message : String(error))
    return []
  }
})
