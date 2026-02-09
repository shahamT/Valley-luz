export const useCategories = () => {
  const { data, pending, error, refresh } = useFetch('/api/categories', {
    key: 'categories',
    server: true,
  })

  return {
    data: computed(() => data.value || {}),
    isLoading: pending,
    isError: computed(() => !!error.value),
    refresh,
  }
}
