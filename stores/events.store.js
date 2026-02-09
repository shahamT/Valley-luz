import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useEvents } from '~/composables/useEvents'

export const useEventsStore = defineStore('events', () => {
  const query = useEvents()

  const events = computed(() => query.data.value || [])
  const isLoading = query.isLoading
  const isError = query.isError

  return {
    events,
    isLoading,
    isError,
  }
})
