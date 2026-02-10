// Calendar grid constants
export const DAYS_PER_WEEK = 7

// Calendar display constants
export const MAX_EVENTS_TO_DISPLAY = 3
export const MAX_REGULAR_CHIPS = 2
export const WEEKEND_DAYS = [5, 6] // Friday (5) and Saturday (6)
export const MORE_EVENTS_TEXT = (count) => `עוד ${count} אירועים...`

// UI text constants
export const UI_TEXT = {
  loading: 'טוען אירועים...',
  error: 'שגיאה בטעינת אירועים',
  backToMonthly: 'חזרה ללו"ז חודשי',
  noEvents: 'אין אירועים',
  notFound: 'הדף המבוקש לא נמצא',
  eventsCount: (count) => `${count} אירועים`,
  viewMonthly: 'חודשי',
  viewDaily: 'יומי',
  filterButtonLabel: 'סינון',
  categoriesFilter: 'קטגוריות',
  categoriesFilterTitle: 'קטגוריות',
  hoursFilter: 'שעות',
  hoursFilterAll: 'כל שעה',
  resetFilter: 'איפוס פילטר',
}
