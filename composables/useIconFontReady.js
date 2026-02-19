/**
 * Shared state for Material Symbols Outlined font load.
 * Icons should only render glyphs after this is true so we don't show literal names (e.g. "menu", "filter_list").
 */
const iconFontReady = ref(false)
let loadStarted = false

const ICON_FONT_SPEC = "1rem 'Material Symbols Outlined'"

export function useIconFontReady() {
  if (import.meta.client && !loadStarted) {
    loadStarted = true
    document.fonts
      .load(ICON_FONT_SPEC)
      .then(() => {
        iconFontReady.value = true
      })
      .catch(() => {
        iconFontReady.value = true
      })
  }
  return { iconFontReady }
}
