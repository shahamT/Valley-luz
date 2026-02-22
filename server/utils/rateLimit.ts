import { getRequestIP } from 'h3'
import { readRateLimitFile, writeRateLimitFile } from './rateLimitFileStore'

/** Max requests per IP per window for sensitive API routes. */
const RATE_LIMIT_MAX = 100
/** Window duration in milliseconds. */
const RATE_LIMIT_WINDOW_MS = 60_000

const memoryStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Best-effort rate limit for API routes (e.g. whatsapp-messages, whatsapp-media, events).
 * Uses in-memory store by default; when RATE_LIMIT_FILE_PATH is set, persists to that file (survives restarts).
 * Throws 429 if the client IP exceeds the limit.
 */
export async function checkRateLimit(event: Parameters<typeof getRequestIP>[0]): Promise<void> {
  const ip = getRequestIP(event, { xForwardedFor: true })
  const key = ip ?? 'unknown'
  const now = Date.now()
  const filePath = process.env.RATE_LIMIT_FILE_PATH

  if (filePath) {
    const data = await readRateLimitFile(filePath)
    const entry = data[key]
    if (!entry || entry.resetAt < now) {
      data[key] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }
    } else {
      entry.count += 1
      data[key] = entry
    }
    if (data[key].count > RATE_LIMIT_MAX) {
      await writeRateLimitFile(filePath, data)
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
      })
    }
    await writeRateLimitFile(filePath, data)
    return
  }

  const entry = memoryStore.get(key)
  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
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
