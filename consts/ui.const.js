// UI component constants

// Responsive breakpoint for mobile/desktop switch (in pixels)
// Breakpoints for responsive behavior
export const MOBILE_BREAKPOINT = 768 // Main mobile breakpoint for layouts and navigation
export const SMALL_MOBILE_BREAKPOINT = 560 // Breakpoint for compact mobile layouts (e.g., view toggle)
export const DAY_CELL_BREAKPOINT = 920 // Breakpoint for day cell chip display logic

export const MODAL_TEXT = {
  title: 'פרטי אירוע',
  close: 'סגור',
  noEventSelected: 'אירוע לא נמצא',
  categories: 'קטגוריות',
  location: 'מיקום',
  time: 'זמן',
  price: 'מחיר',
  description: 'תיאור',
  links: 'קישורים',
  contactPublisher: 'יצירת קשר עם המפרסם',
  addToCalendar: 'הוספה ליומן',
  navigateToEvent: 'ניווט לאירוע',
  share: 'שיתוף',
  unknownLocation: 'לא ידוע',
  disclaimer: 'פרטי האירוע מגיעים מהמפרסם ועוברים עיבוד ב AI - אין לנו אחריות על מהימנות ודיוק הפרטים.',
  locationMoreInfo: 'למידע נוסף',
}

export const CALENDAR_OPTIONS = [
  { id: 'google', label: 'Google Calendar', iconPath: '/icons/google-calendar.png' },
  { id: 'apple', label: 'Apple Calendar', iconPath: '/icons/apple-calendar.png' },
  { id: 'outlook', label: 'Outlook', iconPath: '/icons/outlook.png' },
  { id: 'ical', label: 'iCal', iconPath: '/icons/ical.svg' },
]

export const NAVIGATION_OPTIONS = [
  { id: 'waze', label: 'ניווט עם Waze', iconPath: '/icons/waze-icon.svg' },
  { id: 'gmaps', label: 'ניווט עם Google Maps', iconPath: '/icons/google-maps-icon.svg' },
]
