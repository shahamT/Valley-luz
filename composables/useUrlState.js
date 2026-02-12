import { watch, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { parseCategories, serializeCategories, parseTimeFilter, isValidMonthYear } from '~/utils/validation.helpers'
import { MINUTES_PER_DAY } from '~/consts/calendar.const'

/**
 * Composable for syncing calendar state with URL query parameters
 * Provides bidirectional sync between store and URL for filters and date selection
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.syncMonth - Whether to sync currentDate to URL (monthly view only)
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
   * Build query parameters from current store state
   * @returns {Object} - Query parameters object
   */
  const buildQueryParams = () => {
    const params = {}
    
    // Add month/year if syncing month
    if (syncMonth && currentDate.value) {
      params.year = currentDate.value.year
      params.month = currentDate.value.month
    }
    
    // Add categories if any selected
    const categoriesParam = serializeCategories(selectedCategories.value)
    if (categoriesParam) {
      params.categories = categoriesParam
    }
    
    // Add time filter if not default (0 to MINUTES_PER_DAY)
    if (timeFilterStart.value !== 0 || timeFilterEnd.value !== MINUTES_PER_DAY) {
      params.timeStart = timeFilterStart.value
      params.timeEnd = timeFilterEnd.value
      
      // Add preset if set
      if (timeFilterPreset.value) {
        params.timePreset = timeFilterPreset.value
      }
    }
    
    return params
  }

  /**
   * Update URL with current store state
   * Uses replace to avoid creating history entries
   */
  const updateUrl = () => {
    if (!isInitialized.value) return
    
    const newQuery = buildQueryParams()
    
    // Only update if query actually changed
    const currentQuery = route.query
    const queryChanged = JSON.stringify(currentQuery) !== JSON.stringify(newQuery)
    
    if (queryChanged) {
      router.replace({ query: newQuery })
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
    parseUrlParams,
    buildQueryParams,
    updateUrl,
  }
}
