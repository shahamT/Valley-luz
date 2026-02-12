import { computed } from 'vue'
import {
  getPrevMonth,
  getNextMonth,
  getPrevDay,
  getNextDay,
  getTodayDateString,
  formatDateToYYYYMMDD,
} from '~/utils/date.helpers'

/**
 * Composable for calendar navigation logic
 * Centralizes date navigation and route management for monthly and daily views
 *
 * @returns {{
 *   navigateToMonth: (year: number, month: number) => void,
 *   navigateToDay: (dateString: string) => void,
 *   goToPrevMonth: (currentDate: {year: number, month: number}) => {year: number, month: number},
 *   goToNextMonth: (currentDate: {year: number, month: number}) => {year: number, month: number},
 *   goToPrevDay: (dateString: string) => string,
 *   goToNextDay: (dateString: string) => string,
 *   getDailyTargetDateForMonth: (year: number, month: number) => string,
 *   switchToDailyView: (currentDate: {year: number, month: number}) => void,
 *   navigateToMonthInDailyView: (year: number, month: number) => void
 * }}
 */
export const useCalendarNavigation = () => {
  const calendarStore = useCalendarStore()
  const router = useRouter()

  /**
   * Navigate to monthly view with specific year and month
   * Preserves filter query parameters
   * @param {number} year - The year
   * @param {number} month - The month (1-12)
   */
  const navigateToMonth = (year, month) => {
    const currentQuery = router.currentRoute.value.query
    
    calendarStore.setCurrentDate({ year, month })
    navigateTo({
      path: '/',
      query: { ...currentQuery, year, month },
    })
  }

  /**
   * Navigate to daily view for a specific date
   * Preserves filter query parameters
   * @param {string} dateString - Date in YYYY-MM-DD format
   */
  const navigateToDay = (dateString) => {
    const currentQuery = router.currentRoute.value.query
    
    navigateTo({
      path: `/daily-view/${dateString}`,
      query: currentQuery,
    })
  }

  /**
   * Navigate to previous month
   * @param {Object} currentDate - Current date object {year, month}
   */
  const goToPrevMonth = (currentDate) => {
    const newDate = getPrevMonth(currentDate.year, currentDate.month)
    calendarStore.setCurrentDate(newDate)
    return newDate
  }

  /**
   * Navigate to next month
   * @param {Object} currentDate - Current date object {year, month}
   */
  const goToNextMonth = (currentDate) => {
    const newDate = getNextMonth(currentDate.year, currentDate.month)
    calendarStore.setCurrentDate(newDate)
    return newDate
  }

  /**
   * Navigate to previous day
   * @param {string} dateString - Current date in YYYY-MM-DD format
   * @returns {string} New date string
   */
  const goToPrevDay = (dateString) => {
    return getPrevDay(dateString)
  }

  /**
   * Navigate to next day
   * @param {string} dateString - Current date in YYYY-MM-DD format
   * @returns {string} New date string
   */
  const goToNextDay = (dateString) => {
    return getNextDay(dateString)
  }

  /**
   * Get the target date for daily view when navigating to a specific month
   * Returns today if the month is current, otherwise the first day of the month
   * @param {number} year - The year
   * @param {number} month - The month (1-12)
   * @returns {string} Date string in YYYY-MM-DD format
   */
  const getDailyTargetDateForMonth = (year, month) => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    if (year === currentYear && month === currentMonth) {
      return getTodayDateString()
    }
    
    // Use shared formatter for consistency
    return formatDateToYYYYMMDD(new Date(year, month - 1, 1))
  }

  /**
   * Navigate to daily view from monthly view
   * Goes to today if the selected month is current, otherwise to the first day of the month
   */
  const switchToDailyView = (currentDate) => {
    const targetDate = getDailyTargetDateForMonth(currentDate.year, currentDate.month)
    navigateToDay(targetDate)
  }

  /**
   * Navigate to a specific month in daily view
   * Updates both the store and navigates to the appropriate date
   * @param {number} year - The year
   * @param {number} month - The month (1-12)
   */
  const navigateToMonthInDailyView = (year, month) => {
    calendarStore.setCurrentDate({ year, month })
    const targetDate = getDailyTargetDateForMonth(year, month)
    navigateToDay(targetDate)
  }

  return {
    navigateToMonth,
    navigateToDay,
    goToPrevMonth,
    goToNextMonth,
    goToPrevDay,
    goToNextDay,
    getDailyTargetDateForMonth,
    switchToDailyView,
    navigateToMonthInDailyView,
  }
}
