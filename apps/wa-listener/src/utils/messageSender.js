import { getClient } from '../services/whatsapp.service.js'
import { logger } from './logger.js'
import { LOG_PREFIXES } from '../consts/index.js'
import { config } from '../config.js'

/**
 * Sends a confirmation message to configured confirmation groups
 * @param {string} messagePreview - First 20 characters of the raw message text
 * @param {boolean} success - Whether event was added successfully
 * @returns {Promise<void>}
 */
export async function sendEventConfirmation(messagePreview, success) {
  // If no confirmation groups configured, skip
  if (!config.confirmationGroupIds || config.confirmationGroupIds.length === 0) {
    return
  }

  const client = getClient()
  if (!client) {
    logger.warn(LOG_PREFIXES.WHATSAPP, 'Cannot send confirmation: WhatsApp client not available')
    return
  }

  const status = success ? 'added successfully' : 'failed adding event'
  const messageText = `event - ${messagePreview} has been received. event status - ${status}`

  // Send to all configured confirmation groups
  for (const groupId of config.confirmationGroupIds) {
    try {
      await client.sendMessage(groupId, messageText)
      if (config.logLevel === 'info') {
        logger.info(LOG_PREFIXES.WHATSAPP, `Sent confirmation to group ${groupId}: ${status}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error(LOG_PREFIXES.WHATSAPP, `Failed to send confirmation to group ${groupId}: ${errorMsg}`)
      // Continue to next group even if one fails
    }
  }
}
