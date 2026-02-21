import { extractUrlsFromText, sanitizeMessageForPrompt } from './eventOpenAI.service.js'
import { convertMessageToHtml } from '../utils/whatsappFormatToHtml.js'

/**
 * Builds the canonical EventSourceDocument for the pipeline.
 * Does not run OCR; caller should set ocrText/ocrData after OCR when image is present.
 *
 * @param {Object} rawMessage - Serialized message from serializeMessage()
 * @param {string|null} cloudinaryUrl - Cloudinary URL if message had image
 * @param {{ fullText: string, blocks?: Array<{id,text,confidence,bbox?}>, lines?: Array<{id,text,confidence,blockId?}> }|null} ocrData - OCR result if already run
 * @returns {import('../../../../types/events').EventSourceDocument}
 */
export function buildSourceDocument(rawMessage, cloudinaryUrl = null, ocrData = null) {
  const messageTextRaw = (rawMessage?.text && typeof rawMessage.text === 'string') ? rawMessage.text : ''
  const messageTextSanitized = sanitizeMessageForPrompt(messageTextRaw)
  const messageHtml = convertMessageToHtml(messageTextRaw)
  const extractedUrls = extractUrlsFromText(messageTextRaw)
  const messageTimestamp = rawMessage?.t != null ? Number(rawMessage.t) : null

  const source = {
    messageTextRaw,
    messageTextSanitized,
    messageHtml,
    extractedUrls,
    messageTimestamp,
    cloudinaryUrl: cloudinaryUrl || null,
    ocrText: ocrData?.fullText ?? null,
    ocrData: ocrData ?? null,
  }

  return source
}
