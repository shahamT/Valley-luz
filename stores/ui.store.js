import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

/**
 * UI state store (modals, overlays).
 * Manages event modal state with URL synchronization for shareable links.
 */
export const useUiStore = defineStore('ui', () => {
  const isEventModalShowing = ref(false)
  const selectedEventId = ref(null)

  function openEventModal(eventId) {
    selectedEventId.value = eventId
    isEventModalShowing.value = true
    
    // Sync to URL (if in browser)
    if (typeof window !== 'undefined') {
      const route = useRoute()
      const router = useRouter()
      router.push({
        query: { ...route.query, event: eventId }
      })
    }
  }

  function closeEventModal() {
    isEventModalShowing.value = false
    selectedEventId.value = null
    
    // Remove from URL
    if (typeof window !== 'undefined') {
      const route = useRoute()
      const router = useRouter()
      const query = { ...route.query }
      delete query.event
      router.push({ query })
    }
  }

  function initializeModalFromUrl() {
    if (typeof window !== 'undefined') {
      const route = useRoute()
      if (route.query.event) {
        // Set state directly without triggering URL update
        selectedEventId.value = route.query.event
        isEventModalShowing.value = true
      }
    }
  }

  // Watch for URL changes (browser back/forward)
  if (typeof window !== 'undefined') {
    const route = useRoute()
    watch(() => route.query.event, (newEventId) => {
      // Only update state if it differs from current state
      if (newEventId && newEventId !== selectedEventId.value) {
        selectedEventId.value = newEventId
        isEventModalShowing.value = true
      } else if (!newEventId && isEventModalShowing.value) {
        isEventModalShowing.value = false
        selectedEventId.value = null
      }
    })
  }

  return {
    isEventModalShowing,
    selectedEventId,
    openEventModal,
    closeEventModal,
    initializeModalFromUrl,
  }
})
