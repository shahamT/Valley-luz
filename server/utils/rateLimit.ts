import { getRequestIP } from 'h3'

/** Max requests per IP per window for sensitive API routes. */
const RATE_LIMIT_MAX = 100
/** Window duration in milliseconds. */
const RATE_LIMIT_WINDOW_MS = 60_000

const store = new Map<string, { count: number; resetAt: number }>()

/**
 * Best-effort rate limit for sensitive API routes (e.g. whatsapp-messages, whatsapp-media).
 * Uses in-memory store; production may use reverse proxy or external store for stricter limits.
 * Throws 429 if the client IP exceeds the limit.
 */
export function checkRateLimit(event: Parameters<typeof getRequestIP>[0]): void {
  const ip = getRequestIP(event, { xForwardedFor: true })
  const key = ip ?? 'unknown'
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return
  }
  entry.count += 1
  if (entry.count > RATE_LIMIT_MAX) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
    })
  }
}
