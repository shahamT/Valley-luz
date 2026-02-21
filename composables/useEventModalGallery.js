/**
 * Composable for EventModal image gallery: layout, visible thumbs, overflow count, and preload state.
 * @param {Ref<Array>} eventMediaRef - Ref to event media array (from useEventModalData)
 * @returns {Object} galleryRef, galleryWidth, isGalleryMediaLoaded, maxVisibleThumbs, showOverflow, overflowCount, visibleMedia, measureGallery
 */
export function useEventModalGallery(eventMediaRef) {
  const THUMB_WIDTH = 93
  const THUMB_GAP = 16

  const galleryRef = ref(null)
  const galleryWidth = ref(0)
  const isGalleryMediaLoaded = ref(true)
  let resizeObserver = null

  const maxVisibleThumbs = computed(() => {
    if (galleryWidth.value <= 0) return 1
    return Math.max(1, Math.floor((galleryWidth.value + THUMB_GAP) / (THUMB_WIDTH + THUMB_GAP)))
  })

  const showOverflow = computed(() => (eventMediaRef?.value?.length ?? 0) > maxVisibleThumbs.value)

  const overflowCount = computed(() => (eventMediaRef?.value?.length ?? 0) - maxVisibleThumbs.value + 1)

  const visibleMedia = computed(() => {
    const media = eventMediaRef?.value ?? []
    if (!showOverflow.value) return media
    return media.slice(0, maxVisibleThumbs.value)
  })

  function measureGallery() {
    if (galleryRef.value) {
      const style = getComputedStyle(galleryRef.value)
      const paddingLeft = parseFloat(style.paddingLeft) || 0
      const paddingRight = parseFloat(style.paddingRight) || 0
      galleryWidth.value = galleryRef.value.clientWidth - paddingLeft - paddingRight
    }
  }

  watch(galleryRef, (el) => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    if (el) {
      measureGallery()
      resizeObserver = new ResizeObserver(measureGallery)
      resizeObserver.observe(el)
    }
  })

  let galleryLoadId = 0
  watch(
    () => eventMediaRef?.value ?? [],
    (media) => {
      if (!import.meta.client || !media?.length) {
        isGalleryMediaLoaded.value = true
        return
      }
      isGalleryMediaLoaded.value = false
      const currentId = ++galleryLoadId
      const urls = media.map((item) => item.displayUrl).filter(Boolean)
      if (urls.length === 0) {
        isGalleryMediaLoaded.value = true
        return
      }
      let done = 0
      const checkComplete = () => {
        done += 1
        if (currentId === galleryLoadId && done >= urls.length) {
          isGalleryMediaLoaded.value = true
        }
      }
      urls.forEach((url) => {
        const img = new Image()
        img.onload = checkComplete
        img.onerror = checkComplete
        img.src = url
      })
    },
    { immediate: true }
  )

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  })

  return {
    galleryRef,
    galleryWidth,
    isGalleryMediaLoaded,
    maxVisibleThumbs,
    showOverflow,
    overflowCount,
    visibleMedia,
    measureGallery,
  }
}
