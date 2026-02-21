/**
 * Composable for EventModal full-size image/video popup state.
 * @returns {Object} isImagePopupOpen, currentImageIndex, openImagePopup, closeImagePopup
 */
export function useEventModalImagePopup() {
  const isImagePopupOpen = ref(false)
  const currentImageIndex = ref(0)

  function openImagePopup(index = 0) {
    currentImageIndex.value = index
    isImagePopupOpen.value = true
  }

  function closeImagePopup() {
    isImagePopupOpen.value = false
  }

  return {
    isImagePopupOpen,
    currentImageIndex,
    openImagePopup,
    closeImagePopup,
  }
}
