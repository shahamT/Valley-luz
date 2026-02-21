import type { H3Event } from 'h3'

/**
 * If API_SECRET is set, requires the request to provide it via X-API-Key header or apiKey query param.
 * If not set, does nothing. Use only on sensitive routes (e.g. whatsapp-messages, whatsapp-media).
 */
export function requireApiSecret(event: H3Event): void {
  const config = useRuntimeConfig()
  const secret = config.apiSecret
  if (!secret) {
    return
  }
  const headerKey = getHeader(event, 'x-api-key')
  const queryKey = getQuery(event).apiKey
  const provided = (typeof headerKey === 'string' ? headerKey : null) ?? (typeof queryKey === 'string' ? queryKey : null)
  if (provided !== secret) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }
}
