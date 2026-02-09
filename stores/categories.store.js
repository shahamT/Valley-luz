import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCategories } from '~/composables/useCategories'

export const useCategoriesStore = defineStore('categories', () => {
  const query = useCategories()

  const categories = computed(() => query.data.value || {})
  const isLoading = query.isLoading
  const isError = query.isError

  return {
    categories,
    isLoading,
    isError,
  }
})
