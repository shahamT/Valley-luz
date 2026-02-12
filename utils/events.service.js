import { MINUTES_PER_DAY } from '~/consts/calendar.const'
import { formatDateToYYYYMMDD } from './date.helpers'

/**
 * Events Service
 * Handles API calls and business logic for event data operations
 */
export const eventsService = {
  /**
   * Filters events to only active ones
   * @param {Array} events - Array of events
   * @returns {Array} Array of active events
   */
  getActiveEvents(events) {
    return events.filter((event) => event.isActive === true)
  },

  /**
   * Gets event occurrences that match a specific date
   * @param {Object} event - Event object
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {Array} Array of matching occurrences
   */
  getEventOccurrencesOnDate(event, dateString) {
    if (!event.occurrences || event.occurrences.length === 0) return []

    return event.occurrences.filter((occurrence) => {
      if (!occurrence.startTime) return false
      const occurrenceDate = this.getDateFromISO(occurrence.startTime)
      return occurrenceDate === dateString
    })
  },

  /**
   * Gets all events that occur on a specific date
   * @param {Array} events - Array of events
   * @param {string} dateString - Date string in YYYY-MM-DD format
   * @returns {Array} Array of {event, occurrence} objects
   */
  getEventsForDate(events, dateString) {
    const activeEvents = this.getActiveEvents(events)
    const eventsOnDate = []

    activeEvents.forEach((event) => {
      const matchingOccurrences = this.getEventOccurrencesOnDate(event, dateString)
      if (matchingOccurrences.length > 0) {
        matchingOccurrences.forEach((occurrence) => {
          eventsOnDate.push({ event, occurrence })
        })
      }
    })

    return eventsOnDate
  },

  /**
   * Gets event data grouped by date for a specific month
   * @param {Array} events - Array of events
   * @param {number} year - Year (e.g., 2026)
   * @param {number} month - Month (1-12, 1-indexed)
   * @returns {Object} Map of date strings to arrays of event objects with mainCategory
   */
  getEventsByDate(events, year, month) {
    const activeEvents = this.getActiveEvents(events)
    const eventsMap = {}

    activeEvents.forEach((event) => {
      if (!event.occurrences) {
        return
      }

      event.occurrences.forEach((occurrence) => {
        if (!occurrence.startTime) {
          return
        }

        const occurrenceDate = new Date(occurrence.startTime)
        const occurrenceYear = occurrenceDate.getFullYear()
        const occurrenceMonth = occurrenceDate.getMonth() + 1

        if (occurrenceYear === year && occurrenceMonth === month) {
          const dateString = formatDateToYYYYMMDD(occurrenceDate)
          if (!eventsMap[dateString]) {
            eventsMap[dateString] = []
          }
          eventsMap[dateString].push(event)
        }
      })
    })

    return eventsMap
  },

  /**
   * Gets event counts grouped by date for a specific month
   * @param {Array} events - Array of events
   * @param {number} year - Year (e.g., 2026)
   * @param {number} month - Month (1-12, 1-indexed)
   * @returns {Object} Map of date strings to event counts
   */
  getEventCountsByDate(events, year, month) {
    const eventsMap = this.getEventsByDate(events, year, month)
    const countsMap = {}

    Object.keys(eventsMap).forEach((dateString) => {
      countsMap[dateString] = eventsMap[dateString].length
    })

    return countsMap
  },

  /**
   * Converts ISO string to YYYY-MM-DD format
   * @param {string} isoString - ISO date string
   * @returns {string|null} Date string in YYYY-MM-DD format or null
   */
  getDateFromISO(isoString) {
    if (!isoString) return null
    const date = new Date(isoString)
    return formatDateToYYYYMMDD(date)
  },

  /**
   * Checks if an event matches any of the given category IDs
   * @param {Object} event - Event object with categories array
   * @param {Array} categoryIds - Array of category IDs to match
   * @returns {boolean} True if event matches at least one category
   */
  eventMatchesCategories(event, categoryIds) {
    if (!event.categories || !Array.isArray(event.categories)) {
      return false
    }
    return event.categories.some((categoryId) => categoryIds.includes(categoryId))
  },

  /**
   * Filters events by category IDs (checks all categories in event)
   * @param {Array} events - Array of events
   * @param {Array} categoryIds - Array of category IDs to filter by
   * @returns {Array} Filtered array of events
   */
  filterEventsByCategories(events, categoryIds) {
    if (!Array.isArray(events) || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return events
    }

    return events.filter((event) => this.eventMatchesCategories(event, categoryIds))
  },

  /**
   * Get occurrence time as minutes from midnight (local time). All-day or no time = 0–1440.
   * @param {Object} occurrence - Occurrence with startTime, endTime, hasTime
   * @returns {{ startMinutes: number, endMinutes: number }}
   */
  getOccurrenceMinutesOfDay(occurrence) {
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
  },

  /**
   * Check if an occurrence's time overlaps a range [rangeStart, rangeEnd) (minutes from midnight).
   * Overlap when occurrenceStart < rangeEnd && occurrenceEnd > rangeStart.
   * @param {Object} occurrence
   * @param {number} rangeStartMinutes
   * @param {number} rangeEndMinutes
   * @returns {boolean}
   */
  occurrenceOverlapsTimeRange(occurrence, rangeStartMinutes, rangeEndMinutes) {
    const { startMinutes, endMinutes } = this.getOccurrenceMinutesOfDay(occurrence)
    return startMinutes < rangeEndMinutes && endMinutes > rangeStartMinutes
  },

  /**
   * Filter events to those that have at least one occurrence in the given month overlapping the time range.
   * No filter when startMinutes === 0 && endMinutes === 1440 (returns events unchanged).
   * @param {Array} events - Array of events
   * @param {number} year
   * @param {number} month - 1-indexed
   * @param {number} startMinutes
   * @param {number} endMinutes
   * @returns {Array}
   */
  filterEventsByTimeRangeForMonth(events, year, month, startMinutes, endMinutes) {
    if (startMinutes === 0 && endMinutes === MINUTES_PER_DAY) {
      return events
    }
    const activeEvents = this.getActiveEvents(events)
    return activeEvents.filter((event) => {
      if (!event.occurrences) return false
      return event.occurrences.some((occurrence) => {
        if (!occurrence.startTime) return false
        const d = new Date(occurrence.startTime)
        if (d.getFullYear() !== year || d.getMonth() + 1 !== month) return false
        return this.occurrenceOverlapsTimeRange(occurrence, startMinutes, endMinutes)
      })
    })
  },

  /**
   * Filter { event, occurrence } pairs to those whose occurrence overlaps the time range.
   * No filter when startMinutes === 0 && endMinutes === 1440 (returns pairs unchanged).
   * @param {Array} pairs - Array of { event, occurrence }
   * @param {number} startMinutes
   * @param {number} endMinutes
   * @returns {Array}
   */
  filterEventOccurrencesByTimeRange(pairs, startMinutes, endMinutes) {
    if (startMinutes === 0 && endMinutes === MINUTES_PER_DAY) {
      return pairs
    }
    return pairs.filter(({ occurrence }) =>
      this.occurrenceOverlapsTimeRange(occurrence, startMinutes, endMinutes)
    )
  },
}
