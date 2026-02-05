// Calendar grid constants
export const DAYS_PER_WEEK = 7

// Deprecated: CALENDAR_GRID_SIZE - Calendar now uses dynamic week calculation
// Kept for reference only, not used in code
// export const CALENDAR_GRID_SIZE = 42 // 6 rows * 7 days (deprecated)

// Default calendar view
export const DEFAULT_YEAR = 2026
export const DEFAULT_MONTH = 2 // February (1-indexed)

// UI text constants
export const UI_TEXT = {
  loading: 'טוען אירועים...',
  error: 'שגיאה בטעינת אירועים',
  backToMonthly: 'חזרה ללו"ז חודשי',
  noEvents: 'אין אירועים',
  notFound: 'הדף המבוקש לא נמצא',
  eventsCount: (count) => `${count} אירועים`,
}
