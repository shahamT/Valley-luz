import { getContentType } from '@whiskeysockets/baileys'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { extractMessageId } from '../utils/messageHelpers.js'
import { computeMessageSignature } from '../utils/messageHelpers.js'
import { LOG_PREFIXES } from '../consts/index.js'
import { serializeMessage, processMessage, isMessageTypeAllowed } from './message.service.js'
import { uploadMessageMedia } from './media.service.js'
import { printGroupMetadata } from './group.service.js'
import { insertEventDocument, findEventBySignature } from './mongo.service.js'
import { queueMessage } from './queue.service.js'
import { getClient } from './whatsappClient.service.js'
import { deleteMediaFromCloudinary } from './cloudinary.service.js'
import { sendEventConfirmation, CONFIRMATION_REASONS } from '../utils/messageSender.js'

/**
 * Handles a single incoming Baileys message: duplicate check, media upload, insert event doc, queue pipeline.
 * @param {Object} msg - Baileys message object (proto.IWebMessageInfo)
 */
export async function handleIncomingMessage(msg) {
  const sock = getClient()
  const remoteJid = msg.key?.remoteJid
  if (!remoteJid || !remoteJid.endsWith('@g.us')) return
  if (msg.key?.fromMe) return
  if (!msg.message) return

  const groupId = remoteJid

  if (config.discoveryMode) {
    const chatMeta = { id: groupId, name: null }
    try {
      if (sock) {
        const metadata = await sock.groupMetadata(groupId)
        chatMeta.name = metadata.subject
      }
    } catch (_) { /* ignore */ }
    printGroupMetadata(msg, chatMeta)
    return
  }

  if (!config.groupIds.includes(groupId)) {
    if (config.logLevel === 'info') {
      logger.info(LOG_PREFIXES.WHATSAPP, `Ignoring message from group: ${groupId}`)
    }
    return
  }

  if (!isMessageTypeAllowed(msg)) {
    if (config.logLevel === 'info') {
      const contentType = getContentType(msg.message) || 'unknown'
      logger.info(LOG_PREFIXES.WHATSAPP, `Ignoring message with unsupported type: ${contentType}`)
    }
    return
  }

  const rawMessage = serializeMessage(msg)

  if (!rawMessage || typeof rawMessage !== 'object') {
    logger.error(LOG_PREFIXES.WHATSAPP, 'Failed to serialize message - invalid structure')
    return
  }

  const messageText = rawMessage.text || ''
  const messageSignature = computeMessageSignature(messageText)

  if (messageSignature) {
    const existingEvent = await findEventBySignature(messageSignature)
    if (existingEvent) {
      const messageId = extractMessageId(rawMessage)
      logger.info(LOG_PREFIXES.DUPLICATE_DETECTION, `Duplicate message detected: ${messageId} (signature: ${messageSignature.substring(0, 8)}...) - skipping processing`)
      const messagePreview = (messageText || '').substring(0, 20) || '(no text)'
      const existingEventName = existingEvent.event?.Title || '(ללא כותרת)'
      const existingEventId = existingEvent._id?.toString?.() ?? String(existingEvent._id)
      const reasonDetail = `אירוע קיים: ${existingEventName}, מזהה: ${existingEventId}`
      let groupName = null
      try {
        if (sock) {
          const meta = await sock.groupMetadata(groupId)
          groupName = meta.subject || null
        }
      } catch (_) { /* ignore */ }
      const context = {
        eventId: existingEventId,
        sourceGroupId: groupId,
        sourceGroupName: groupName,
      }
      try {
        await sendEventConfirmation(messagePreview, CONFIRMATION_REASONS.DUPLICATE_MESSAGE, reasonDetail, context)
      } catch (sendError) {
        const sendErrorMsg = sendError instanceof Error ? sendError.message : String(sendError)
        logger.error(LOG_PREFIXES.WHATSAPP, `Failed to send duplicate log to log group: ${sendErrorMsg}`)
      }
      return
    }
  }

  let cloudinaryResult = null
  const hasMedia = rawMessage.hasMedia
  if (hasMedia) {
    const messageId = extractMessageId(msg) || `msg_${Date.now()}`
    cloudinaryResult = await uploadMessageMedia(msg, messageId, rawMessage)
  }

  processMessage(rawMessage, cloudinaryResult)

  try {
    const cloudinaryUrl = cloudinaryResult?.cloudinaryUrl || null
    const cloudinaryData = cloudinaryResult?.cloudinaryData || null

    const eventDoc = await insertEventDocument(rawMessage, cloudinaryUrl, cloudinaryData, messageSignature)

    if (eventDoc && eventDoc._id) {
      queueMessage(
        eventDoc._id,
        rawMessage,
        cloudinaryUrl,
        cloudinaryData,
        msg,
        sock
      )
      const messagePreview = (rawMessage.text || '').substring(0, 20) || '(no text)'
      let groupName = null
      try {
        if (sock) {
          const meta = await sock.groupMetadata(groupId)
          groupName = meta.subject || null
        }
      } catch (_) { /* ignore */ }
      const context = {
        eventId: eventDoc._id.toString(),
        sourceGroupId: groupId,
        sourceGroupName: groupName,
      }
      try {
        await sendEventConfirmation(messagePreview, CONFIRMATION_REASONS.PROCESSING_STARTED, null, context)
      } catch (sendError) {
        const sendErrorMsg = sendError instanceof Error ? sendError.message : String(sendError)
        logger.error(LOG_PREFIXES.WHATSAPP, `Failed to send processing-started confirmation: ${sendErrorMsg}`)
      }
    } else {
      if (cloudinaryResult?.cloudinaryData?.public_id) {
        await deleteMediaFromCloudinary(cloudinaryResult.cloudinaryData.public_id)
      }
      logger.warn(LOG_PREFIXES.WHATSAPP, 'Failed to insert event document, skipping pipeline')
    }
  } catch (error) {
    if (cloudinaryResult?.cloudinaryData?.public_id) {
      try {
        await deleteMediaFromCloudinary(cloudinaryResult.cloudinaryData.public_id)
      } catch (deleteError) {
        const deleteErrorMsg = deleteError instanceof Error ? deleteError.message : String(deleteError)
        logger.error(LOG_PREFIXES.CLOUDINARY, `Failed to cleanup media after insertion error: ${deleteErrorMsg}`)
      }
    }
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.WHATSAPP, `Error in event document insertion (non-blocking): ${errorMsg}`)
  }
}
