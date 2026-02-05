import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const isEventModalShowing = ref(false)
  const selectedEventId = ref(null)

  function openEventModal(eventId) {
    selectedEventId.value = eventId
    isEventModalShowing.value = true
  }

  function closeEventModal() {
    isEventModalShowing.value = false
    selectedEventId.value = null
  }

  return {
    isEventModalShowing,
    selectedEventId,
    openEventModal,
    closeEventModal,
  }
})
