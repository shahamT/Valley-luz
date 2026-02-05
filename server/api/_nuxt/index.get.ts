// Handle requests to /_nuxt/ (without a specific file)
// This suppresses 404 errors from browser extensions or dev tools
// that try to access /_nuxt/ directory
export default defineEventHandler(() => {
  return sendNoContent()
})
