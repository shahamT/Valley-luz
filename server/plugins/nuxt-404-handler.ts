export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    // Suppress 404 errors for /_nuxt/ requests (common in development)
    // These are typically from browser extensions or dev tools
    if (
      error.statusCode === 404 &&
      event?.node?.req?.url === '/_nuxt/'
    ) {
      // Silently handle - don't log as error
      return
    }
  })
})
