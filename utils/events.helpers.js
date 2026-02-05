import { HEBREW_WEEKDAYS, HEBREW_MONTHS } from '~/consts/dates.const'

// Date utility functions
export function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateString(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getDateFromISO(isoString) {
  if (!isoString) return null
  const date = new Date(isoString)
  return formatDateToYYYYMMDD(date)
}

export function formatDateForDisplay(dateString) {
  const date = parseDateString(dateString)
  const weekday = HEBREW_WEEKDAYS[date.getDay()]
  const day = date.getDate()
  const month = HEBREW_MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return `יום ${weekday} | ${day} ב${month} ${year}`
}

// Event filtering functions
export function getActiveEvents(events) {
  return events.filter((event) => event.isActive === true)
}

export function getEventOccurrencesOnDate(event, dateString) {
  if (!event.occurrences || event.occurrences.length === 0) return []
  
  return event.occurrences.filter((occurrence) => {
    if (!occurrence.startTime) return false
    const occurrenceDate = getDateFromISO(occurrence.startTime)
    return occurrenceDate === dateString
  })
}

export function getEventsForDate(events, dateString) {
  const activeEvents = getActiveEvents(events)
  const eventsOnDate = []
  
  activeEvents.forEach((event) => {
    const matchingOccurrences = getEventOccurrencesOnDate(event, dateString)
    if (matchingOccurrences.length > 0) {
      matchingOccurrences.forEach((occurrence) => {
        eventsOnDate.push({ event, occurrence })
      })
    }
  })
  
  return eventsOnDate
}

export function getEventCountsByDate(events, year, month) {
  const activeEvents = getActiveEvents(events)
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
}

// Event formatting functions
export function formatEventTime(occurrence) {
  if (!occurrence.hasTime) {
    return 'כל היום'
  }
  
  if (!occurrence.startTime) {
    return ''
  }
  
  // Parse UTC ISO string and convert to local time for display
  const startDate = new Date(occurrence.startTime)
  const startHours = String(startDate.getHours()).padStart(2, '0')
  const startMinutes = String(startDate.getMinutes()).padStart(2, '0')
  const startTime = `${startHours}:${startMinutes}`
  
  if (occurrence.endTime) {
    const endDate = new Date(occurrence.endTime)
    const endHours = String(endDate.getHours()).padStart(2, '0')
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0')
    const endTime = `${endHours}:${endMinutes}`
    return `${startTime}-${endTime}`
  }
  
  return startTime
}

export function formatEventPrice(event) {
  if (event.price === null || event.price === undefined || event.price === 0) {
    return 'חינם'
  }
  return `${event.price} ש"ח`
}

export function formatEventLocation(event) {
  if (!event.location) return ''
  
  const parts = []
  if (event.location.city) parts.push(event.location.city)
  if (event.location.addressLine1) parts.push(event.location.addressLine1)
  
  return parts.join(', ')
}

export function transformEventForCard(event, occurrence) {
  return {
    timeText: formatEventTime(occurrence),
    title: event.title,
    desc: event.shortDescription || event.fullDescription || '',
    price: `${formatEventPrice(event)} ${formatEventLocation(event)}`,
  }
}
