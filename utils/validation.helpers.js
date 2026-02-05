/**
 * Validates if a string matches YYYY-MM-DD format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid format
 */
export function isValidDateString(dateString) {
  if (!dateString || typeof dateString !== 'string') return false
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) return false
  
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/**
 * Validates if a string is a valid ISO date string
 * @param {string} isoString - ISO string to validate
 * @returns {boolean} - True if valid ISO format
 */
export function isValidISOString(isoString) {
  if (!isoString || typeof isoString !== 'string') return false
  
  const date = new Date(isoString)
  return !isNaN(date.getTime())
}

/**
 * Validates route date parameter
 * @param {string} dateParam - Route param to validate
 * @returns {boolean} - True if valid
 */
export function isValidRouteDate(dateParam) {
  return isValidDateString(dateParam)
}
