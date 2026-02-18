/**
 * Type definitions for Valley Luz events and categories
 * These types document the structure of data used throughout the application
 * and prepare for future TypeScript migration
 */

/**
 * Event location details
 */
export interface EventLocation {
  city?: string
  addressLine1?: string
  addressLine2?: string
  locationDetails?: string
  wazeNavLink?: string
  gmapsNavLink?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

/**
 * Event occurrence - a specific instance of an event
 */
export interface Occurrence {
  startTime: string // ISO 8601 date-time string
  endTime?: string // ISO 8601 date-time string
  hasTime: boolean // If false, it's an all-day event
}

/**
 * Main event entity
 */
export interface Event {
  id: string
  title: string
  shortDescription?: string
  fullDescription?: string
  description?: string
  price?: number | null
  location?: EventLocation
  categories: string[] // Array of category IDs
  mainCategory: string // Primary category ID
  occurrences: Occurrence[]
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  urls?: Array<{ Title: string; Url: string }> // Array of URL objects with Title and Url
  media?: any[] // Media attachments (images, videos)
  publisherPhone?: string // WhatsApp contact number
}

/**
 * Category entity for event categorization
 */
export interface Category {
  id: string
  label: string
  color: string // Hex color code
}

/**
 * Event and occurrence pair used in filtered results
 */
export interface EventOccurrencePair {
  event: Event
  occurrence: Occurrence
}

/**
 * Transformed event card data for display
 */
export interface EventCard {
  id: string
  eventId: string
  mainCategory: string
  timeText: string
  title: string
  desc: string
  price: string
  occurrence: Occurrence
  event: Event
}

/**
 * Calendar date representation
 */
export interface CalendarDate {
  year: number
  month: number // 1-12 (1-indexed)
}

/**
 * Day cell data for monthly calendar grid
 */
export interface DayCell {
  dayNumber: number
  dateString: string // YYYY-MM-DD format
  isOutsideMonth: boolean
  eventsCount: number
  events: Event[]
}
