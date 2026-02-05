import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    isEventModalShowing: false,
    selectedEventId: null
  }),

  actions: {
    openEventModal(eventId) {
      this.selectedEventId = eventId
      this.isEventModalShowing = true
    },

    closeEventModal() {
      this.isEventModalShowing = false
      this.selectedEventId = null
    }
  }
})
