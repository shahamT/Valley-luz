import { HEBREW_MONTHS } from '~/consts/dates.const'
import { formatDateToYYYYMMDD } from './events.helpers'

/**
 * Gets today's date as YYYY-MM-DD string
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export function getTodayDateString() {
  const today = new Date()
  return formatDateToYYYYMMDD(today)
}

/**
 * Gets current year and month
 * @returns {{year: number, month: number}} Current year and month (month is 1-indexed)
 */
export function getCurrentYearMonth() {
  const today = new Date()
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1, // 1-indexed
  }
}

/**
 * Formats month and year for display (e.g., "פברואר 2026")
 * @param {number} year - Year
 * @param {number} month - Month (1-12, 1-indexed)
 * @returns {string} Formatted month year string
 */
export function formatMonthYear(year, month) {
  const monthName = HEBREW_MONTHS[month - 1]
  return `${monthName} ${year}`
}
