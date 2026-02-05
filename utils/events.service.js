import { formatDateToYYYYMMDD } from './events.helpers'

/**
 * Events Service
 * Handles API calls and business logic for event data operations
 */
export const eventsService = {
  /**
   * Fetches events from the API
   * @returns {Promise<Array>} Array of events
   */
  async fetchEvents() {
    return await $fetch('/api/events')
  },

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
   * Gets event counts grouped by date for a specific month
   * @param {Array} events - Array of events
   * @param {number} year - Year (e.g., 2026)
   * @param {number} month - Month (1-12, 1-indexed)
   * @returns {Object} Map of date strings to event counts
   */
  getEventCountsByDate(events, year, month) {
    const activeEvents = this.getActiveEvents(events)
    const countsMap = {}

    activeEvents.forEach((event) => {
      if (!event.occurrences) return

      event.occurrences.forEach((occurrence) => {
        if (!occurrence.startTime) return

        const occurrenceDate = new Date(occurrence.startTime)
        const occurrenceYear = occurrenceDate.getFullYear()
        const occurrenceMonth = occurrenceDate.getMonth() + 1

        if (occurrenceYear === year && occurrenceMonth === month) {
          const dateString = formatDateToYYYYMMDD(occurrenceDate)
          countsMap[dateString] = (countsMap[dateString] || 0) + 1
        }
      })
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
}
