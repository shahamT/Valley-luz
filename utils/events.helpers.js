/**
 * Event helper functions for formatting and transformation
 * Note: formatDateToYYYYMMDD and parseDateString live in date.helpers.js - import from there
 */

const ALL_DAY_TEXT = 'כל היום'
const FREE_TEXT = 'חינם'
const PRICE_UNKNOWN_TEXT = 'אין מידע'
const UNKNOWN_LOCATION_TEXT = 'לא ידוע'

export { PRICE_UNKNOWN_TEXT }

/**
 * Format event occurrence time for display
 * @param {Object} occurrence - Event occurrence with startTime, endTime, hasTime
 * @returns {string} Formatted time string or "כל היום" for all-day events
 */
export function formatEventTime(occurrence) {
  if (!occurrence.hasTime) {
    return ALL_DAY_TEXT
  }

  if (!occurrence.startTime) {
    return ''
  }

  // Parse UTC ISO string and convert to local time for display
  const startDate = new Date(occurrence.startTime)
  const startHours = String(startDate.getHours()).padStart(2, '0')
  const startMinutes = String(startDate.getMinutes()).padStart(2, '0')
  const startTime = `${startHours}:${startMinutes}`

  if (occurrence.endTime) {
    const endDate = new Date(occurrence.endTime)
    const endHours = String(endDate.getHours()).padStart(2, '0')
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0')
    const endTime = `${endHours}:${endMinutes}`
    return `${startTime}-${endTime}`
  }

  return startTime
}

/**
 * Format event price for display
 * @param {Object} event - Event object with price property
 * @returns {string} Formatted price string, "חינם" for free (0), or "אין מידע" when price is unknown
 */
export function formatEventPrice(event) {
  if (event.price === null || event.price === undefined) {
    return PRICE_UNKNOWN_TEXT
  }
  if (event.price === 0) {
    return FREE_TEXT
  }
  return `${event.price} ₪`
}

/**
 * Format event location for display
 * @param {Object} event - Event object with location property
 * @returns {string} Formatted location string (city, address) or empty string
 */
export function formatEventLocation(event) {
  if (!event.location) return ''

  const parts = []
  if (event.location.city) parts.push(event.location.city)
  if (event.location.addressLine1) parts.push(event.location.addressLine1)

  return parts.join(', ')
}

/**
 * Format event location for the Kanban card location chip
 * @param {Object} event - Event object with location property
 * @returns {string} "name - city", "city", "name", or "לא ידוע"
 */
export function formatEventLocationForChip(event) {
  const loc = event?.location
  const name = loc?.addressLine1?.trim()
  const city = loc?.city?.trim()
  if (name && city) return `${name} - ${city}`
  if (city) return city
  if (name) return name
  return UNKNOWN_LOCATION_TEXT
}

/**
 * Transform event and occurrence into a card-friendly format
 * @param {Object} event - Event object
 * @param {Object} occurrence - Event occurrence object
 * @returns {Object} Transformed card data with timeText, title, desc, and price
 */
export function transformEventForCard(event, occurrence) {
  return {
    timeText: formatEventTime(occurrence),
    title: event.title,
    desc: event.shortDescription || event.fullDescription || '',
    price: [formatEventPrice(event), formatEventLocation(event)].filter(Boolean).join(' '),
  }
}
