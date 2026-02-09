import { MAX_EVENTS_TO_DISPLAY, MAX_REGULAR_CHIPS, WEEKEND_DAYS, MORE_EVENTS_TEXT } from '~/consts/calendar.const'

/**
 * Gets events to display in calendar day cell with "more" chip logic
 * @param {Array} events - Array of event objects
 * @param {number} totalCount - Total number of events for the day
 * @returns {Array} Array of events to display, with optional "more" chip object
 */
export function getDisplayEvents(events, totalCount) {
  if (!events || totalCount === 0) {
    return []
  }

  const eventsToShow = []

  if (totalCount <= MAX_EVENTS_TO_DISPLAY) {
    // Show all events (up to MAX_EVENTS_TO_DISPLAY)
    eventsToShow.push(...events.slice(0, totalCount))
  } else {
    // Show first MAX_REGULAR_CHIPS events + "more" chip
    eventsToShow.push(...events.slice(0, MAX_REGULAR_CHIPS))
    eventsToShow.push({ isMore: true })
  }

  return eventsToShow
}

/**
 * Calculates the count of additional events for the "more" chip
 * @param {number} totalCount - Total number of events for the day
 * @returns {number} Number of additional events (0 if no "more" chip needed)
 */
export function getAdditionalEventsCount(totalCount) {
  if (totalCount <= MAX_EVENTS_TO_DISPLAY) {
    return 0
  }
  return totalCount - MAX_REGULAR_CHIPS
}

/**
 * Checks if a date is a weekend day (Friday or Saturday)
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if the date is Friday or Saturday
 */
export function isWeekendDay(dateString) {
  if (!dateString) {
    return false
  }
  const date = new Date(dateString)
  const dayOfWeek = date.getDay()
  return WEEKEND_DAYS.includes(dayOfWeek)
}

/**
 * Gets the color for a category with fallback
 * @param {string} categoryId - Category ID
 * @param {Object} categories - Categories object with categoryId as keys
 * @param {string} fallbackColor - Fallback color if category not found
 * @returns {string} Category color or fallback color
 */
export function getCategoryColor(categoryId, categories, fallbackColor = 'var(--brand-dark-blue)') {
  if (!categoryId || !categories || !categories[categoryId]) {
    return fallbackColor
  }
  return categories[categoryId].color || fallbackColor
}

/**
 * Gets the text for the "more" events chip
 * @param {number} count - Number of additional events
 * @param {boolean} isMobile - Whether to use mobile format
 * @returns {string} Formatted text for the "more" chip
 */
export function getMoreEventsText(count, isMobile = false) {
  if (isMobile) {
    return `+${count}`
  }
  return MORE_EVENTS_TEXT(count)
}
