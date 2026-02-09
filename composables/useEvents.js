import { logger } from '~/utils/logger'

const LOG_PREFIX = '[EventsAPI]'

export const useEvents = () => {
  const { data, pending, error, refresh } = useFetch('/api/events', {
    key: 'events',
    server: true,
  })

  // Log on client side only
  if (import.meta.client) {
    // Log when fetching starts
    watch(pending, (isLoading) => {
      if (isLoading) {
        logger.info(LOG_PREFIX, 'Fetching events...')
      }
    }, { immediate: true })

    // Log when data is loaded
    watch(data, (events) => {
      if (events && Array.isArray(events) && events.length > 0) {
        logger.info(LOG_PREFIX, `${events.length} events were fetched:`, events)
      }
    }, { immediate: true })

    // Log errors
    watch(error, (err) => {
      if (err) {
        logger.error(LOG_PREFIX, `Error: ${err.message || 'Failed to fetch events'}`)
      }
    }, { immediate: true })
  }

  return {
    data: computed(() => {
      if (error.value && !data.value) {
        return []
      }
      return data.value || []
    }),
    isLoading: pending,
    isError: computed(() => {
      return !!error.value && !data.value
    }),
    refresh,
  }
}
