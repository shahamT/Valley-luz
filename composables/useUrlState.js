import { parseCategories, serializeCategories, parseTimeFilter, isValidMonthYear } from '~/utils/validation.helpers'
import { MINUTES_PER_DAY } from '~/consts/calendar.const'
import { getTodayDateString } from '~/utils/date.helpers'

const MONTHLY_PATH = '/monthly-view'
const DAILY_PATH = '/daily-view'

/**
 * Composable for syncing calendar state with URL query parameters
 * Monthly: /monthly-view?year=...&month=... ; Daily: /daily-view?date=...
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.syncMonth - Whether to sync currentDate (year/month) to URL (monthly view only)
 * @returns {Object} - URL state management functions
 */
export const useUrlState = (options = {}) => {
  const { syncMonth = false } = options

  const route = useRoute()
  const router = useRouter()
  const calendarStore = useCalendarStore()
  const { selectedCategories, timeFilterStart, timeFilterEnd, timeFilterPreset, currentDate } = storeToRefs(calendarStore)

  const isInitialized = ref(false)

  /**
   * Parse URL query parameters and extract filter state
   * @param {Object} query - Route query object
   * @returns {Object} - Parsed filter state
   */
  const parseUrlParams = (query) => {
    const categories = parseCategories(query.categories)
    const timeRange = parseTimeFilter(query.timeStart, query.timeEnd)
    const preset = query.timePreset || null
    
    return {
      categories,
      timeStart: timeRange.start,
      timeEnd: timeRange.end,
      timePreset: preset,
    }
  }

  /**
   * Parse month/year from URL query parameters
   * @param {Object} query - Route query object
   * @returns {Object|null} - Parsed date or null if invalid
   */
  const parseMonthYearFromUrl = (query) => {
    const year = parseInt(query.year)
    const month = parseInt(query.month)
    
    if (year && month && isValidMonthYear(year, month)) {
      return { year, month }
    }
    
    return null
  }

  /**
   * Build query parameters from current store state (and preserve date on daily view)
   */
  const buildQueryParams = () => {
    const params = {}

    if (syncMonth && currentDate.value) {
      params.year = currentDate.value.year
      params.month = currentDate.value.month
    }

    if (!syncMonth && route.path === DAILY_PATH) {
      params.date = route.query.date || getTodayDateString()
    }

    const categoriesParam = serializeCategories(selectedCategories.value)
    if (categoriesParam) {
      params.categories = categoriesParam
    }

    if (timeFilterStart.value !== 0 || timeFilterEnd.value !== MINUTES_PER_DAY) {
      params.timeStart = timeFilterStart.value
      params.timeEnd = timeFilterEnd.value
      if (timeFilterPreset.value) {
        params.timePreset = timeFilterPreset.value
      }
    }

    return params
  }

  /**
   * Update URL with current store state. Only runs when on the matching route.
   */
  const updateUrl = () => {
    if (!isInitialized.value) return
    if (syncMonth && route.path !== MONTHLY_PATH) return
    if (!syncMonth && route.path !== DAILY_PATH) return

    const newQuery = buildQueryParams()
    const currentQuery = route.query
    const queryChanged = JSON.stringify(currentQuery) !== JSON.stringify(newQuery)

    if (queryChanged) {
      const path = syncMonth ? MONTHLY_PATH : DAILY_PATH
      router.replace({ path, query: newQuery })
    }
  }

  /**
   * Initialize store from URL parameters
   * Called once on mount before watchers are set up
   */
  const initializeFromUrl = () => {
    const query = route.query
    
    // Initialize month/year if syncing month and valid in URL
    if (syncMonth) {
      const dateFromUrl = parseMonthYearFromUrl(query)
      if (dateFromUrl) {
        calendarStore.setCurrentDate(dateFromUrl)
      }
    }
    
    // Initialize filters from URL
    const filters = parseUrlParams(query)
    calendarStore.setFiltersFromUrl(
      filters.categories,
      filters.timeStart,
      filters.timeEnd,
      filters.timePreset
    )
  }

  /**
   * Start watching store and syncing to URL
   * Called after initialization to avoid double-navigation
   */
  const startUrlSync = () => {
    isInitialized.value = true
    updateUrl()

    // Watch filters and sync to URL
    watch(
      () => [
        selectedCategories.value,
        timeFilterStart.value,
        timeFilterEnd.value,
        timeFilterPreset.value,
      ],
      () => {
        updateUrl()
      },
      { deep: true }
    )
    
    // Watch currentDate if syncing month
    if (syncMonth) {
      watch(
        () => currentDate.value,
        () => {
          updateUrl()
        },
        { deep: true }
      )
    }
  }

  return {
    initializeFromUrl,
    startUrlSync,
  }
}
