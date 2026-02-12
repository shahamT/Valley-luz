import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * UI state store (modals, overlays).
 * TODO: openEventModal is not yet wired - DayCell/KanbanEventCard need click handlers to open event detail modal.
 */
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
