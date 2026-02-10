import { HEBREW_MONTHS, HEBREW_WEEKDAYS } from '~/consts/dates.const'
import { formatDateToYYYYMMDD, parseDateString } from './events.helpers'

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

/**
 * Gets the next day as YYYY-MM-DD string
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Next day in YYYY-MM-DD format
 */
export function getNextDay(dateString) {
  const date = new Date(dateString + 'T00:00:00')
  date.setDate(date.getDate() + 1)
  return formatDateToYYYYMMDD(date)
}

/**
 * Gets the previous day as YYYY-MM-DD string
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Previous day in YYYY-MM-DD format
 */
export function getPrevDay(dateString) {
  const date = new Date(dateString + 'T00:00:00')
  date.setDate(date.getDate() - 1)
  return formatDateToYYYYMMDD(date)
}

/**
 * Checks if a date string is today
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if date is today
 */
export function isToday(dateString) {
  return dateString === getTodayDateString()
}

/**
 * Checks if a date is before today
 * @param {Date} date - Date object to check
 * @returns {boolean} True if date is before today
 */
export function isBeforeToday(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate < today
}

/**
 * Formats date for kanban column header (e.g., "יום שני, 25 בפברואר")
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
export function formatKanbanDateHeader(dateString) {
  const date = parseDateString(dateString)
  const weekday = HEBREW_WEEKDAYS[date.getDay()]
  const day = date.getDate()
  const month = HEBREW_MONTHS[date.getMonth()]
  return `${weekday}, ${day} ב${month}`
}

/**
 * Gets array of 3 date strings for kanban view
 * @param {string} centerDate - Center date in YYYY-MM-DD format
 * @returns {string[]} Array of 3 date strings [earlier, center, later] (RTL: right to left)
 */
export function getThreeDaysForView(centerDate) {
  if (isToday(centerDate)) {
    // If viewing today: show [today, tomorrow, day+2]
    const tomorrow = getNextDay(centerDate)
    const dayAfterTomorrow = getNextDay(tomorrow)
    return [centerDate, tomorrow, dayAfterTomorrow]
  } else {
    // If viewing future date: show [day-1, center, day+1]
    const prevDay = getPrevDay(centerDate)
    const nextDay = getNextDay(centerDate)
    return [prevDay, centerDate, nextDay]
  }
}
