/**
 * UI state store (modals, overlays).
 * Manages event modal state with URL synchronization for shareable links.
 */
export const useUiStore = defineStore('ui', () => {
  const route = useRoute()
  const router = useRouter()

  const isEventModalShowing = ref(false)
  const selectedEventId = ref(null)

  function openEventModal(eventId) {
    selectedEventId.value = eventId
    isEventModalShowing.value = true

    if (import.meta.client) {
      router.push({
        query: { ...route.query, event: eventId }
      })
    }
  }

  function closeEventModal() {
    isEventModalShowing.value = false
    selectedEventId.value = null

    if (import.meta.client) {
      const query = { ...route.query }
      delete query.event
      router.push({ query })
    }
  }

  function initializeModalFromUrl() {
    if (import.meta.client && route.query.event) {
      selectedEventId.value = route.query.event
      isEventModalShowing.value = true
    }
  }

  // Watch for URL changes (browser back/forward)
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

  return {
    isEventModalShowing,
    selectedEventId,
    openEventModal,
    closeEventModal,
    initializeModalFromUrl,
  }
})
