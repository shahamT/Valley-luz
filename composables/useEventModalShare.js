/**
 * Composable for EventModal share: capability check and share handler.
 * @param {Ref<Object|null>} selectedEventRef - Ref to the selected event
 * @returns {Object} canShare, handleShare
 */
export function useEventModalShare(selectedEventRef) {
  const canShare = ref(false)

  onMounted(() => {
    if (import.meta.client && navigator.share) {
      canShare.value = true
    }
  })

  async function handleShare() {
    if (!navigator.share || !selectedEventRef?.value) return
    try {
      await navigator.share({
        title: selectedEventRef.value.title,
        url: import.meta.client ? window.location.href : '',
        text: selectedEventRef.value.shortDescription || selectedEventRef.value.title,
      })
    } catch (e) {
      if (e.name !== 'AbortError') {
        // User cancelled or share failed; no feedback required
      }
    }
  }

  return { canShare, handleShare }
}
