import { formatDateToYYYYMMDD } from './events.helpers'
import { CALENDAR_GRID_SIZE } from '~/consts/calendar.const'

/**
 * Generates calendar grid days for a given month/year
 * @param {number} year - Year (e.g., 2026)
 * @param {number} month - Month (1-12, 1-indexed)
 * @param {Object} eventCountsMap - Map of date strings to event counts
 * @returns {Array} Array of day objects with dayNumber, isOutsideMonth, eventsCount, dateString
 */
export function generateCalendarDays(year, month, eventCountsMap = {}) {
  const days = []
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay() // 0 = Sunday

  // Add leading days from previous month
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i
    const date = new Date(year, month - 2, dayNum)
    days.push({
      dayNumber: dayNum,
      isOutsideMonth: true,
      eventsCount: 0,
      dateString: formatDateToYYYYMMDD(date),
    })
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
    })
  }

  // Add trailing days from next month to complete grid
  const remainingCells = CALENDAR_GRID_SIZE - days.length
  for (let day = 1; day <= remainingCells; day++) {
    const date = new Date(year, month, day)
    days.push({
      dayNumber: day,
      isOutsideMonth: true,
      eventsCount: 0,
      dateString: formatDateToYYYYMMDD(date),
    })
  }

  return days
}
