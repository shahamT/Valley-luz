/**
 * Composable for checking if screen width is under a specified value
 * @param {number} width - Width threshold in pixels (default: 768)
 * @returns {import('vue').Ref<boolean>} Reactive ref indicating if screen is under the width
 */
export function useScreenWidth(width = 768) {
  const isUnderWidth = ref(false)

  const checkWidth = () => {
    if (import.meta.client && window.innerWidth !== undefined) {
      isUnderWidth.value = window.innerWidth < width
    }
  }

  onMounted(() => {
    if (import.meta.client) {
      checkWidth()
      window.addEventListener('resize', checkWidth)
    }
  })

  onUnmounted(() => {
    if (import.meta.client) {
      window.removeEventListener('resize', checkWidth)
    }
  })

  return isUnderWidth
}
