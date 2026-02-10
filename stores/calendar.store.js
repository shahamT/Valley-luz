import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCurrentYearMonth } from '~/utils/date.helpers'

export const useCalendarStore = defineStore('calendar', () => {
  const selectedCategories = ref([])
  const currentDate = ref(getCurrentYearMonth())

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
  }

  function setCurrentDate(date) {
    currentDate.value = date
  }

  return {
    selectedCategories,
    currentDate,
    toggleCategory,
    resetFilter,
    setCurrentDate,
  }
})
