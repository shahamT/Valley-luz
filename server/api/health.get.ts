/**
 * Lightweight health check for Render (and other platforms).
 * Returns 200 immediately with no DB or heavy work so the health check does not timeout.
 */
export default defineEventHandler(() => {
  return { ok: true }
})
