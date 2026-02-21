/**
 * Centralizes calendar page mount setup: URL state init, URL sync watchers, and modal-from-URL.
 * Call the returned function from onMounted so both monthly-view and daily-view stay in sync.
 *
 * @param {Object} options - Passed to useUrlState
 * @param {boolean} options.syncMonth - true for monthly-view, false for daily-view
 * @returns {{ runPageInit: () => void }}
 */
export const useCalendarPageInit = (options = {}) => {
  const uiStore = useUiStore()
  const { initializeFromUrl, startUrlSync } = useUrlState(options)

  const runPageInit = () => {
    initializeFromUrl()
    startUrlSync()
    uiStore.initializeModalFromUrl()
  }

  return { runPageInit }
}
