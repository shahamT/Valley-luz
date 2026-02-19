import { logger } from '~/utils/logger'

const LOG_PREFIX = '[EventsAPI]'

export const useEvents = () => {
  // useFetch with server: true runs on the server during SSR, so the initial load
  // does not appear as a client network request; data is serialized into the page payload.
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
    })

    // Log when data is loaded (including empty array)
    watch(data, (events) => {
      if (events && Array.isArray(events)) {
        if (events.length > 0) {
          logger.info(LOG_PREFIX, `${events.length} events were fetched:`, events)
        }
        // In development, log the full array so you can expand and explore it in the console
        if (import.meta.DEV) {
          console.log('[EventsAPI] Events array (dev):', events)
        }
      }
    }, { immediate: true })

    // Log errors
    watch(error, (err) => {
      if (err) {
        logger.error(LOG_PREFIX, `Error: ${err.message || 'Failed to fetch events'}`)
      }
    })
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
