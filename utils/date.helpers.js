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

/**
 * Gets the previous month and year
 * @param {number} year - Current year
 * @param {number} month - Current month (1-12, 1-indexed)
 * @returns {{year: number, month: number}} Previous month and year
 */
export function getPrevMonth(year, month) {
  let newMonth = month - 1
  let newYear = year

  if (newMonth < 1) {
    newMonth = 12
    newYear--
  }

  return { year: newYear, month: newMonth }
}

/**
 * Gets the next month and year
 * @param {number} year - Current year
 * @param {number} month - Current month (1-12, 1-indexed)
 * @returns {{year: number, month: number}} Next month and year
 */
export function getNextMonth(year, month) {
  let newMonth = month + 1
  let newYear = year

  if (newMonth > 12) {
    newMonth = 1
    newYear++
  }

  return { year: newYear, month: newMonth }
}

/**
 * Validates if a month is valid (1-12)
 * @param {number} month - Month to validate
 * @returns {boolean} True if month is valid
 */
export function isValidMonth(month) {
  return Number.isInteger(month) && month >= 1 && month <= 12
}

/**
 * Validates if a year is reasonable (1900-2100)
 * @param {number} year - Year to validate
 * @returns {boolean} True if year is valid
 */
export function isValidYear(year) {
  return Number.isInteger(year) && year >= 1900 && year <= 2100
}
