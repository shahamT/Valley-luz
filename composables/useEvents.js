export const useEvents = () => {
  const { data, pending, error, refresh } = useFetch('/api/events', {
    key: 'events',
    server: true,
  })

  return {
    data: computed(() => data.value || []),
    isLoading: pending,
    isError: computed(() => !!error.value),
    refresh,
  }
}
