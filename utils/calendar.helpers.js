import { formatDateToYYYYMMDD } from './events.helpers'
import { DAYS_PER_WEEK } from '~/consts/calendar.const'

/**
 * Generates calendar grid days for a given month/year
 * Shows only the weeks that contain days from the current month
 * @param {number} year - Year (e.g., 2026)
 * @param {number} month - Month (1-12, 1-indexed)
 * @param {Object} eventCountsMap - Map of date strings to event counts
 * @param {Object} eventsMap - Map of date strings to arrays of event objects with mainCategory
 * @returns {Array} Array of day objects with dayNumber, isOutsideMonth, eventsCount, dateString, events
 */
export function generateCalendarDays(year, month, eventCountsMap = {}, eventsMap = {}) {
  const days = []
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay() // 0 = Sunday

  // Calculate leading days from previous month (to complete first week)
  // In RTL: Sunday (0) is first day, so if month starts on Sunday, no leading days needed
  // If month starts on Monday (1), we need 1 leading day (Sunday)
  // If month starts on Tuesday (2), we need 2 leading days (Sunday, Monday), etc.
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate()

  // Add leading days from previous month
  // Loop runs from (startDayOfWeek - 1) down to 0, so count = startDayOfWeek (if > 0)
  let leadingDays = 0
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i
    const date = new Date(year, month - 2, dayNum)
    days.push({
      dayNumber: dayNum,
      isOutsideMonth: true,
      eventsCount: 0,
      dateString: formatDateToYYYYMMDD(date),
      events: [],
    })
    leadingDays++
  }

  // Add current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dateString = formatDateToYYYYMMDD(date)
    days.push({
      dayNumber: day,
      isOutsideMonth: false,
      eventsCount: eventCountsMap[dateString] || 0,
      dateString,
      events: eventsMap[dateString] || [],
    })
  }

  // Calculate trailing days from next month (to complete last week)
  const totalDaysSoFar = leadingDays + daysInMonth
  const trailingDays = totalDaysSoFar % DAYS_PER_WEEK === 0 
    ? 0 
    : DAYS_PER_WEEK - (totalDaysSoFar % DAYS_PER_WEEK)

  for (let day = 1; day <= trailingDays; day++) {
    const date = new Date(year, month, day)
    days.push({
      dayNumber: day,
      isOutsideMonth: true,
      eventsCount: 0,
      dateString: formatDateToYYYYMMDD(date),
      events: [],
    })
  }

  return days
}
