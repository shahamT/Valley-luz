import { validateEventStructure } from './eventValidation.js'
import { resolvePublisherPhone } from '../utils/contactHelpers.js'

/**
 * Enriches an event with publisher phone and media from the WhatsApp message.
 * Validates structure before enrichment.
 */
export async function enrichEvent(event, authorId, cloudinaryUrl, originalMessage, client) {
  const validation = validateEventStructure(event)
  if (!validation.valid) throw new Error(`Invalid event for enrichment: ${validation.reason}`)

  if (authorId) {
    try {
      const phone = await resolvePublisherPhone(authorId, originalMessage, client)
      event.publisherPhone = phone || undefined
    } catch (_) {
      event.publisherPhone = undefined
    }
  } else {
    event.publisherPhone = undefined
  }

  event.media = cloudinaryUrl ? [cloudinaryUrl] : []

  return event
}
