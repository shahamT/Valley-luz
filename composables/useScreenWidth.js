/**
 * Composable for checking if screen width is under a specified value.
 * Uses VueUse's useMediaQuery under the hood for efficient matchMedia-based detection.
 * @param {number} width - Width threshold in pixels (default: 768)
 * @returns {import('vue').Ref<boolean>} Reactive ref indicating if screen is under the width
 */
export function useScreenWidth(width = 768) {
  return useMediaQuery(`(max-width: ${width - 1}px)`)
}
