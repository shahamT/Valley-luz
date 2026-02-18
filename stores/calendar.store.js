import { getCurrentYearMonth } from '~/utils/date.helpers'
import { MINUTES_PER_DAY, TIME_FILTER_PRESETS } from '~/consts/calendar.const'

/**
 * Shared view/filter state for both monthly and daily views:
 * category filter (selectedCategories), time filter (timeFilterStart/End), and selected month (currentDate).
 */

export const useCalendarStore = defineStore('calendar', () => {
  const selectedCategories = ref([])
  const currentDate = ref(getCurrentYearMonth())
  const timeFilterStart = ref(0)
  const timeFilterEnd = ref(MINUTES_PER_DAY)
  const timeFilterPreset = ref(null)

  function toggleCategory(categoryId) {
    const index = selectedCategories.value.indexOf(categoryId)
    if (index > -1) {
      selectedCategories.value.splice(index, 1)
    } else {
      selectedCategories.value.push(categoryId)
    }
  }

  function resetFilter() {
    selectedCategories.value = []
    timeFilterStart.value = 0
    timeFilterEnd.value = MINUTES_PER_DAY
    timeFilterPreset.value = null
  }

  function setTimeRange(startMinutes, endMinutes) {
    const start = Math.max(0, Math.min(MINUTES_PER_DAY, Math.min(startMinutes, endMinutes)))
    const end = Math.max(0, Math.min(MINUTES_PER_DAY, Math.max(startMinutes, endMinutes)))
    timeFilterStart.value = start
    timeFilterEnd.value = end
  }

  function setTimePreset(presetId) {
    const preset = TIME_FILTER_PRESETS.find((p) => p.id === presetId)
    if (preset) {
      timeFilterStart.value = preset.startMinutes
      timeFilterEnd.value = preset.endMinutes
      timeFilterPreset.value = presetId
    }
  }

  function clearTimePreset() {
    timeFilterPreset.value = null
  }

  function setCurrentDate(date) {
    currentDate.value = date
  }

  function setFiltersFromUrl(categories, timeStart, timeEnd, timePreset) {
    selectedCategories.value = categories || []
    timeFilterStart.value = timeStart ?? 0
    timeFilterEnd.value = timeEnd ?? MINUTES_PER_DAY
    timeFilterPreset.value = timePreset || null
  }

  return {
    selectedCategories,
    currentDate,
    timeFilterStart,
    timeFilterEnd,
    timeFilterPreset,
    toggleCategory,
    resetFilter,
    setTimeRange,
    setTimePreset,
    clearTimePreset,
    setCurrentDate,
    setFiltersFromUrl,
  }
})
