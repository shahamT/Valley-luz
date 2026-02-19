import { MINUTES_PER_DAY } from '~/consts/calendar.const'
import { formatDateToYYYYMMDD, getDateInIsraelFromIso } from './date.helpers'

/**
 * Filters events to only active ones
 * @param {Array} events - Array of events
 * @returns {Array} Array of active events
 */
export function getActiveEvents(events) {
  return events.filter((event) => event.isActive === true)
}

/**
 * Converts ISO string to YYYY-MM-DD format
 * @param {string} isoString - ISO date string
 * @returns {string|null} Date string in YYYY-MM-DD format or null
 */
export function getDateFromISO(isoString) {
  if (!isoString) return null
  const date = new Date(isoString)
  return formatDateToYYYYMMDD(date)
}

/**
 * Gets event occurrences that match a specific date
 * @param {Object} event - Event object
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Array} Array of matching occurrences
 */
export function getEventOccurrencesOnDate(event, dateString) {
  if (!event.occurrences || event.occurrences.length === 0) return []

  return event.occurrences.filter((occurrence) => {
    const occurrenceDate = occurrence.date && /^\d{4}-\d{2}-\d{2}$/.test(String(occurrence.date).trim().slice(0, 10))
      ? String(occurrence.date).trim().slice(0, 10)
      : occurrence.startTime
        ? getDateInIsraelFromIso(occurrence.startTime)
        : null
    return occurrenceDate === dateString
  })
}

/**
 * Gets all events that occur on a specific date
 * @param {Array} events - Array of events
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Array} Array of {event, occurrence} objects
 */
export function getEventsForDate(events, dateString) {
  const activeEvents = getActiveEvents(events)
  const eventsOnDate = []

  activeEvents.forEach((event) => {
    const matchingOccurrences = getEventOccurrencesOnDate(event, dateString)
    if (matchingOccurrences.length > 0) {
      matchingOccurrences.forEach((occurrence) => {
        eventsOnDate.push({ event, occurrence })
      })
    }
  })

  return eventsOnDate
}

/**
 * Gets event data grouped by date for a specific month
 * @param {Array} events - Array of events
 * @param {number} year - Year (e.g., 2026)
 * @param {number} month - Month (1-12, 1-indexed)
 * @returns {Object} Map of date strings to arrays of event objects
 */
export function getEventsByDate(events, year, month) {
  const activeEvents = getActiveEvents(events)
  const eventsMap = {}

  activeEvents.forEach((event) => {
    if (!event.occurrences) return

    event.occurrences.forEach((occurrence) => {
      let dateString
      let occurrenceYear
      let occurrenceMonth
      if (occurrence.date && String(occurrence.date).trim()) {
        const match = String(occurrence.date).trim().slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (match) {
          occurrenceYear = Number(match[1])
          occurrenceMonth = Number(match[2])
          dateString = match[0]
        }
      }
      if (dateString == null && occurrence.startTime) {
        dateString = getDateInIsraelFromIso(occurrence.startTime) || null
        if (dateString) {
          const [y, m] = dateString.split('-').map(Number)
          occurrenceYear = y
          occurrenceMonth = m
        }
      }
      if (dateString != null && occurrenceYear === year && occurrenceMonth === month) {
        if (!eventsMap[dateString]) {
          eventsMap[dateString] = []
        }
        eventsMap[dateString].push(event)
      }
    })
  })

  return eventsMap
}

/**
 * Checks if an event matches any of the given category IDs
 * @param {Object} event - Event object with categories array
 * @param {Array} categoryIds - Array of category IDs to match
 * @returns {boolean} True if event matches at least one category
 */
export function eventMatchesCategories(event, categoryIds) {
  if (!event.categories || !Array.isArray(event.categories)) {
    return false
  }
  return event.categories.some((categoryId) => categoryIds.includes(categoryId))
}

/**
 * Filters events by category IDs (checks all categories in event)
 * @param {Array} events - Array of events
 * @param {Array} categoryIds - Array of category IDs to filter by
 * @returns {Array} Filtered array of events
 */
export function filterEventsByCategories(events, categoryIds) {
  if (!Array.isArray(events) || !Array.isArray(categoryIds) || categoryIds.length === 0) {
    return events
  }

  return events.filter((event) => eventMatchesCategories(event, categoryIds))
}

/**
 * Get occurrence time as minutes from midnight (local time). All-day or no time = 0-1440.
 * @param {Object} occurrence - Occurrence with startTime, endTime, hasTime
 * @returns {{ startMinutes: number, endMinutes: number }}
 */
export function getOccurrenceMinutesOfDay(occurrence) {
  if (!occurrence.hasTime || !occurrence.startTime) {
    return { startMinutes: 0, endMinutes: MINUTES_PER_DAY }
  }
  const startDate = new Date(occurrence.startTime)
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes()
  if (!occurrence.endTime) {
    return { startMinutes, endMinutes: startMinutes }
  }
  const endDate = new Date(occurrence.endTime)
  const endMinutes = endDate.getHours() * 60 + endDate.getMinutes()
  return { startMinutes, endMinutes }
}

/**
 * Check if an occurrence's time overlaps a range [rangeStart, rangeEnd) (minutes from midnight).
 * @param {Object} occurrence
 * @param {number} rangeStartMinutes
 * @param {number} rangeEndMinutes
 * @returns {boolean}
 */
export function occurrenceOverlapsTimeRange(occurrence, rangeStartMinutes, rangeEndMinutes) {
  const { startMinutes, endMinutes } = getOccurrenceMinutesOfDay(occurrence)
  return startMinutes < rangeEndMinutes && endMinutes > rangeStartMinutes
}

/**
 * Filter events to those with at least one occurrence in the given month overlapping the time range.
 * No filter when startMinutes === 0 && endMinutes === 1440.
 * @param {Array} events - Array of events
 * @param {number} year
 * @param {number} month - 1-indexed
 * @param {number} startMinutes
 * @param {number} endMinutes
 * @returns {Array}
 */
export function filterEventsByTimeRangeForMonth(events, year, month, startMinutes, endMinutes) {
  if (startMinutes === 0 && endMinutes === MINUTES_PER_DAY) {
    return events
  }
  const activeEvents = getActiveEvents(events)
  return activeEvents.filter((event) => {
    if (!event.occurrences) return false
    return event.occurrences.some((occurrence) => {
      let occYear
      let occMonth
      if (occurrence.date && String(occurrence.date).trim()) {
        const match = String(occurrence.date).trim().slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (match) {
          occYear = Number(match[1])
          occMonth = Number(match[2])
        }
      }
      if (occYear == null && occurrence.startTime) {
        const dateStr = getDateInIsraelFromIso(occurrence.startTime)
        if (dateStr) {
          const [y, m] = dateStr.split('-').map(Number)
          occYear = y
          occMonth = m
        }
      }
      if (occYear != null && occMonth != null && occYear === year && occMonth === month) {
        return occurrenceOverlapsTimeRange(occurrence, startMinutes, endMinutes)
      }
      return false
    })
  })
}

/**
 * Filter { event, occurrence } pairs to those whose occurrence overlaps the time range.
 * No filter when startMinutes === 0 && endMinutes === 1440.
 * @param {Array} pairs - Array of { event, occurrence }
 * @param {number} startMinutes
 * @param {number} endMinutes
 * @returns {Array}
 */
export function filterEventOccurrencesByTimeRange(pairs, startMinutes, endMinutes) {
  if (startMinutes === 0 && endMinutes === MINUTES_PER_DAY) {
    return pairs
  }
  return pairs.filter(({ occurrence }) =>
    occurrenceOverlapsTimeRange(occurrence, startMinutes, endMinutes)
  )
}
