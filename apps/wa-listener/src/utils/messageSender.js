import { getClient } from '../services/whatsapp.service.js'
import { logger } from './logger.js'
import { LOG_PREFIXES } from '../consts/index.js'
import { config } from '../config.js'

/**
 * Reason codes for event processing status
 */
export const CONFIRMATION_REASONS = {
  PROCESSING_STARTED: 'processing_started',
  NEW_EVENT: 'new_event',
  UPDATED_EVENT: 'updated_event',
  NO_TEXT: 'no_text',
  NOT_EVENT: 'not_event',
  NO_DATE: 'no_date',
  MULTIPLE_EVENTS: 'multiple_events',
  ALREADY_EXISTING: 'already_existing',
  DUPLICATE_MESSAGE: 'duplicate_message',
  AI_CLASSIFICATION_FAILED: 'ai_classification_failed',
  AI_COMPARISON_FAILED: 'ai_comparison_failed',
  VALIDATION_FAILED: 'validation_failed',
  DATABASE_ERROR: 'database_error',
  ENRICHMENT_ERROR: 'enrichment_error',
  PIPELINE_ERROR: 'pipeline_error',
}

const REASON_MESSAGES = {
  [CONFIRMATION_REASONS.PROCESSING_STARTED]: 'מתחיל עיבוד ההודעה',
  [CONFIRMATION_REASONS.NEW_EVENT]: '✅ אירוע חדש נוסף בהצלחה',
  [CONFIRMATION_REASONS.UPDATED_EVENT]: '🔄 אירוע קיים עודכן בהצלחה',
  [CONFIRMATION_REASONS.NO_TEXT]: '❌ נכשל - הודעה ללא טקסט',
  [CONFIRMATION_REASONS.NOT_EVENT]: '❌ נכשל - ההודעה לא מתארת אירוע',
  [CONFIRMATION_REASONS.NO_DATE]: '❌ נכשל - לא נמצא תאריך לאירוע בהודעה',
  [CONFIRMATION_REASONS.MULTIPLE_EVENTS]: '❌ נכשל - ההודעה מכילה יותר מאירוע אחד',
  [CONFIRMATION_REASONS.ALREADY_EXISTING]: '❌ נכשל - אירוע קיים כבר במערכת (כפילות)',
  [CONFIRMATION_REASONS.DUPLICATE_MESSAGE]: '⚠️ הודעה כפולה - דילוג על עיבוד',
  [CONFIRMATION_REASONS.AI_CLASSIFICATION_FAILED]: '❌ נכשל - שגיאה בניתוח ההודעה (AI)',
  [CONFIRMATION_REASONS.AI_COMPARISON_FAILED]: '❌ נכשל - שגיאה בהשוואת אירועים (AI)',
  [CONFIRMATION_REASONS.VALIDATION_FAILED]: '❌ נכשל - שגיאת אימות נתונים',
  [CONFIRMATION_REASONS.DATABASE_ERROR]: '❌ נכשל - שגיאת מסד נתונים',
  [CONFIRMATION_REASONS.ENRICHMENT_ERROR]: '❌ נכשל - שגיאה בעיבוד האירוע',
  [CONFIRMATION_REASONS.PIPELINE_ERROR]: '❌ נכשל - שגיאה כללית בעיבוד',
}

/**
 * Sends a confirmation (log) message to the configured log group
 * @param {string} messagePreview - First 20 characters of the raw message text
 * @param {string} reason - Reason code from CONFIRMATION_REASONS
 * @param {string} [reasonDetail] - Optional detail (e.g. for VALIDATION_FAILED: the exact validation reason)
 * @param {{ eventId?: string, sourceGroupId?: string, sourceGroupName?: string }} [context] - Optional context for the log (event ID, source group ID and name)
 * @returns {Promise<void>}
 */
export async function sendEventConfirmation(messagePreview, reason, reasonDetail, context) {
  if (!config.logGroupId) {
    return
  }

  const sock = getClient()
  if (!sock) {
    logger.warn(LOG_PREFIXES.WHATSAPP, 'Cannot send confirmation: WhatsApp client not available')
    return
  }

  let reasonMessage = REASON_MESSAGES[reason] || `❌ נכשל - ${reason}`
  if (reasonDetail) {
    reasonMessage = `${reasonMessage}: ${reasonDetail}`
  }
  let messageText = `אירוע - ${messagePreview}\nסטטוס: ${reasonMessage}`
  if (context) {
    if (context.eventId) {
      messageText += `\nמזהה אירוע: ${context.eventId}`
    }
    if (context.sourceGroupId) {
      messageText += `\nקבוצה: ${context.sourceGroupId}${context.sourceGroupName ? ` (${context.sourceGroupName})` : ''}`
    }
  }

  try {
    await sock.sendMessage(config.logGroupId, { text: messageText })
    if (config.logLevel === 'info') {
      logger.info(LOG_PREFIXES.WHATSAPP, `Sent confirmation to log group: ${reason}`)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.WHATSAPP, `Failed to send confirmation to log group: ${errorMsg}`)
  }
}
