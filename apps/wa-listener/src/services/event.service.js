import { logger } from '../utils/logger.js'
import { extractMessageId } from '../utils/messageHelpers.js'
import { LOG_PREFIXES } from '../consts/index.js'
import { getCategoriesList } from '../consts/events.const.js'
import { validateEventStructure, validateSearchKeys, validateEventProgrammatic } from './eventValidation.js'
import { callOpenAIForClassification, callOpenAIForExtraction, callOpenAIForComparison } from './eventOpenAI.service.js'
import { enrichEvent } from './eventEnrichment.js'
import { updateEventDocument, deleteEventDocument, findCandidateEvents } from './mongo.service.js'
import { sendEventConfirmation, CONFIRMATION_REASONS } from '../utils/messageSender.js'
import { deleteMediaFromCloudinary } from './cloudinary.service.js'

async function cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason, reasonDetail, sourceGroupId, sourceGroupName) {
  if (cloudinaryData?.public_id) {
    try { await deleteMediaFromCloudinary(cloudinaryData.public_id) } catch (_) { /* logged elsewhere */ }
  }
  try { await deleteEventDocument(eventId) } catch (_) { /* logged elsewhere */ }
  const context = {
    eventId: eventId?.toString?.() ?? String(eventId),
    sourceGroupId: sourceGroupId || undefined,
    sourceGroupName: sourceGroupName || undefined,
  }
  try { await sendEventConfirmation(messagePreview, reason, reasonDetail, context) } catch (_) { /* logged elsewhere */ }
}

function validatePipelineInputs(eventId, rawMessage, cloudinaryUrl, cloudinaryData) {
  if (!eventId) { logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Missing eventId'); return false }
  if (!rawMessage || typeof rawMessage !== 'object') { logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid rawMessage'); return false }
  if (cloudinaryUrl !== null && typeof cloudinaryUrl !== 'string') { logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid cloudinaryUrl'); return false }
  if (cloudinaryData !== null && (typeof cloudinaryData !== 'object' || Array.isArray(cloudinaryData))) { logger.error(LOG_PREFIXES.EVENT_SERVICE, 'Invalid cloudinaryData'); return false }
  return true
}

async function handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, event, originalMessage, client, messagePreview, sourceGroupId, sourceGroupName) {
  logger.info(LOG_PREFIXES.EVENT_SERVICE, 'Handling new event — enriching and saving')
  const context = {
    eventId: eventId?.toString?.() ?? String(eventId),
    sourceGroupId: sourceGroupId || undefined,
    sourceGroupName: sourceGroupName || undefined,
  }
  try {
    const authorId = rawMessage.author || null
    const enrichedEvent = await enrichEvent(event, authorId, cloudinaryUrl, originalMessage, client)

    const updated = await updateEventDocument(eventId, enrichedEvent)
    if (updated) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, 'New event saved successfully')
      await sendEventConfirmation(messagePreview, CONFIRMATION_REASONS.NEW_EVENT, undefined, context)
    } else {
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.DATABASE_ERROR, undefined, sourceGroupId, sourceGroupName)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Error saving new event: ${errorMsg}`)
    const reason = errorMsg.includes('enrich') || errorMsg.includes('Invalid event') ? CONFIRMATION_REASONS.ENRICHMENT_ERROR : CONFIRMATION_REASONS.DATABASE_ERROR
    await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason, undefined, sourceGroupId, sourceGroupName)
  }
}

/**
 * Main event processing pipeline.
 * Flow: Classify → Extract → (Compare if candidates) → Programmatic validation → Enrich → Save
 */
export async function processEventPipeline(eventId, rawMessage, cloudinaryUrl, cloudinaryData, originalMessage, client) {
  const messageId = extractMessageId(rawMessage)
  let sourceGroupId = null
  let sourceGroupName = null

  try {
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Pipeline start for ${messageId}`)

    if (!validatePipelineInputs(eventId, rawMessage, cloudinaryUrl, cloudinaryData)) return

    const messageText = rawMessage.text || ''
    const messagePreview = messageText.substring(0, 20) || '(no text)'

    const remoteJid = originalMessage?.key?.remoteJid
    if (remoteJid && typeof remoteJid === 'string' && remoteJid.endsWith('@g.us')) {
      sourceGroupId = remoteJid
      if (client) {
        try {
          const meta = await client.groupMetadata(sourceGroupId)
          sourceGroupName = meta.subject || null
        } catch (_) { /* ignore */ }
      }
    }

    if (!messageText.trim()) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Skipping ${messageId} — no text`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.NO_TEXT, undefined, sourceGroupId, sourceGroupName)
      return
    }

    logger.info(LOG_PREFIXES.EVENT_SERVICE, `[Call 1/Classify] ${messageId}`)
    const classification = await callOpenAIForClassification(messageText, cloudinaryUrl)

    if (!classification) {
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.AI_CLASSIFICATION_FAILED, undefined, sourceGroupId, sourceGroupName)
      return
    }

    if (!classification.isEvent) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Not an event (${classification.reason}) — ${messageId}`)
      const reason = classification.reason === 'multiple_events' || classification.reason?.includes('multiple')
        ? CONFIRMATION_REASONS.MULTIPLE_EVENTS
        : classification.reason?.includes('date')
          ? CONFIRMATION_REASONS.NO_DATE
          : CONFIRMATION_REASONS.NOT_EVENT
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, reason, undefined, sourceGroupId, sourceGroupName)
      return
    }

    const searchKeys = validateSearchKeys(classification.searchKeys) ? classification.searchKeys : []
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Searching candidates with ${searchKeys.length} key(s) for ${messageId}`)
    const candidates = await findCandidateEvents(searchKeys, eventId)

    const categoriesList = getCategoriesList()
    logger.info(LOG_PREFIXES.EVENT_SERVICE, `[Call 2/Extract] ${messageId}`)
    const extractedEvent = await callOpenAIForExtraction(messageText, cloudinaryUrl, categoriesList)

    if (!extractedEvent) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Extraction failed for ${messageId}`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.AI_COMPARISON_FAILED, undefined, sourceGroupId, sourceGroupName)
      return
    }

    logger.info(LOG_PREFIXES.EVENT_SERVICE, `[Validate] ${messageId}`)
    const { event: validatedEvent, corrections } = validateEventProgrammatic(extractedEvent, messageText, categoriesList)

    if (!validatedEvent) {
      const validationReason = corrections.join('; ')
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Validation failed for ${messageId}: ${validationReason}`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED, validationReason, sourceGroupId, sourceGroupName)
      return
    }

    if (corrections.length > 0) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `Corrections (${corrections.length}): ${corrections.join('; ')}`)
    }

    const structureCheck = validateEventStructure(validatedEvent)
    if (!structureCheck.valid) {
      logger.error(LOG_PREFIXES.EVENT_SERVICE, `Structure invalid after validation: ${structureCheck.reason}`)
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.VALIDATION_FAILED, structureCheck.reason, sourceGroupId, sourceGroupName)
      return
    }

    if (!candidates || candidates.length === 0) {
      logger.info(LOG_PREFIXES.EVENT_SERVICE, `No candidates — new event for ${messageId}`)
      await handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, validatedEvent, originalMessage, client, messagePreview, sourceGroupId, sourceGroupName)
      return
    }

    logger.info(LOG_PREFIXES.EVENT_SERVICE, `[Call 3/Compare] ${messageId} vs ${candidates.length} candidate(s)`)
    const comparison = await callOpenAIForComparison(validatedEvent, messageText, candidates)

    if (!comparison) {
      logger.warn(LOG_PREFIXES.EVENT_SERVICE, `Comparison failed — treating as new for ${messageId}`)
      await handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, validatedEvent, originalMessage, client, messagePreview, sourceGroupId, sourceGroupName)
      return
    }

    logger.info(LOG_PREFIXES.EVENT_SERVICE, `Comparison: ${comparison.status} (${comparison.reason})`)

    if (comparison.status === 'existing_event' || comparison.status === 'updated_event') {
      await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.ALREADY_EXISTING, undefined, sourceGroupId, sourceGroupName)
      return
    }

    await handleNewEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, validatedEvent, originalMessage, client, messagePreview, sourceGroupId, sourceGroupName)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.EVENT_SERVICE, `Pipeline error for ${messageId}: ${errorMsg}`)
    const messagePreview = (rawMessage?.text || '').substring(0, 20) || '(error)'
    try { await cleanupAndDeleteEvent(eventId, cloudinaryData, messagePreview, CONFIRMATION_REASONS.PIPELINE_ERROR, undefined, sourceGroupId, sourceGroupName) } catch (_) { /* already logged */ }
  }
}

export { validateEventProgrammatic } from './eventValidation.js'
export { callOpenAIForClassification, callOpenAIForExtraction, callOpenAIForComparison } from './eventOpenAI.service.js'
