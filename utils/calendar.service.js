import { createEvent } from 'ics'
import { logger } from '~/utils/logger'

/**
 * Convert date string to ICS format array [year, month, day, hour, minute]
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} timeStr - Time string in HH:MM format (optional)
 * @returns {Array<number>} - Array in ICS format
 */
function dateToIcsArray(dateStr, timeStr = '') {
  const [year, month, day] = dateStr.split('-').map(Number)
  
  if (timeStr) {
    const [hour, minute] = timeStr.split(':').map(Number)
    return [year, month, day, hour, minute]
  }
  
  return [year, month, day]
}

/**
 * Convert date and time to Google Calendar format (YYYYMMDDTHHmmss or YYYYMMDD)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} timeStr - Time string in HH:MM format (optional)
 * @returns {string} - Formatted date string for Google Calendar
 */
function dateToGoogleFormat(dateStr, timeStr = '') {
  const cleanDate = dateStr.replace(/-/g, '')
  
  if (timeStr) {
    const cleanTime = timeStr.replace(/:/g, '') + '00'
    return `${cleanDate}T${cleanTime}`
  }
  
  return cleanDate
}

/**
 * Generate and download ICS file for calendar event
 * @param {Object} eventData - Event data object
 * @param {string} eventData.title - Event title
 * @param {string} eventData.description - Event description
 * @param {string} eventData.location - Event location
 * @param {string} eventData.startDate - Start date (YYYY-MM-DD)
 * @param {string} eventData.startTime - Start time (HH:MM) - optional
 * @param {string} eventData.endDate - End date (YYYY-MM-DD)
 * @param {string} eventData.endTime - End time (HH:MM) - optional
 * @returns {Promise<boolean>} - Success status
 */
export async function downloadIcsFile(eventData) {
  const { title, description, location, startDate, startTime, endDate, endTime } = eventData
  
  if (!startDate) {
    logger.error('[CalendarService]', 'Start date is required for calendar event')
    return false
  }
  
  const event = {
    start: dateToIcsArray(startDate, startTime),
    end: dateToIcsArray(endDate || startDate, endTime),
    title: title || 'Event',
    description: description || '',
    location: location || '',
    status: 'CONFIRMED',
  }
  
  return new Promise((resolve) => {
    createEvent(event, (error, value) => {
      if (error) {
        logger.error('[CalendarService]', 'Error creating ICS file:', error)
        resolve(false)
        return
      }
      
      try {
        // Create blob and download
        const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${title || 'event'}.ics`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        resolve(true)
      } catch (err) {
        logger.error('[CalendarService]', 'Error downloading ICS file:', err)
        resolve(false)
      }
    })
  })
}

/**
 * Generate Google Calendar URL
 * @param {Object} eventData - Event data object
 * @param {string} eventData.title - Event title
 * @param {string} eventData.description - Event description
 * @param {string} eventData.location - Event location
 * @param {string} eventData.startDate - Start date (YYYY-MM-DD)
 * @param {string} eventData.startTime - Start time (HH:MM) - optional
 * @param {string} eventData.endDate - End date (YYYY-MM-DD)
 * @param {string} eventData.endTime - End time (HH:MM) - optional
 * @returns {string} - Google Calendar URL
 */
export function getGoogleCalendarUrl(eventData) {
  const { title, description, location, startDate, startTime, endDate, endTime } = eventData
  
  if (!startDate) {
    logger.error('[CalendarService]', 'Start date is required for calendar event')
    return ''
  }
  
  const startDateTime = dateToGoogleFormat(startDate, startTime)
  const endDateTime = dateToGoogleFormat(endDate || startDate, endTime || startTime)
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Event',
    dates: `${startDateTime}/${endDateTime}`,
  })
  
  if (description) {
    params.append('details', description)
  }
  
  if (location) {
    params.append('location', location)
  }
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Handle calendar option selection
 * @param {string} calendarType - Type of calendar (google, apple, outlook, ical)
 * @param {Object} eventData - Event data object
 */
export async function handleCalendarSelection(calendarType, eventData) {
  switch (calendarType) {
    case 'google':
      const googleUrl = getGoogleCalendarUrl(eventData)
      if (googleUrl) {
        window.open(googleUrl, '_blank')
      }
      break
    
    case 'apple':
    case 'outlook':
    case 'ical':
      await downloadIcsFile(eventData)
      break
    
    default:
      logger.error('[CalendarService]', 'Unknown calendar type:', calendarType)
  }
}
