/**
 * Global data initialization plugin
 * Initializes events and categories data once on app mount
 * This ensures data is fetched only once and shared across all components
 */
export default defineNuxtPlugin(() => {
  // Initialize data fetching once
  const eventsData = useEvents()
  const categoriesData = useCategories()
  
  // Provide to app context so components can access without re-fetching
  return {
    provide: {
      eventsData,
      categoriesData
    }
  }
})
