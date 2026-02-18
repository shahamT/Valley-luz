import { logger } from '../utils/logger.js'
import { extractGroupId, getGroupName, getSenderName } from '../utils/messageHelpers.js'
import { LOG_PREFIXES } from '../consts/index.js'

/**
 * Prints group metadata when a message arrives (discovery mode)
 * @param {Object} msg - Baileys message object
 * @param {Object} chat - Chat-like object with { id, name }
 */
export function printGroupMetadata(msg, chat) {
  const groupId = extractGroupId(chat)
  const groupName = getGroupName(chat)
  const senderName = getSenderName(msg)

  logger.info(LOG_PREFIXES.GROUP_SERVICE, '\n--- Group Message Detected (Discovery Mode) ---')
  logger.info(LOG_PREFIXES.GROUP_SERVICE, `Group Name: ${groupName}`)
  logger.info(LOG_PREFIXES.GROUP_SERVICE, `Group ID: ${groupId}`)
  logger.info(LOG_PREFIXES.GROUP_SERVICE, `Sender: ${senderName}`)
  logger.info(LOG_PREFIXES.GROUP_SERVICE, '---')
  logger.info(LOG_PREFIXES.GROUP_SERVICE, 'Message content is NOT displayed for privacy')
  logger.info(LOG_PREFIXES.GROUP_SERVICE, '')
}

/**
 * Lists all groups the user is part of
 * @param {Object} sock - Baileys socket instance
 */
export async function listAllGroups(sock) {
  try {
    logger.info(LOG_PREFIXES.GROUP_SERVICE, '\n=== Listing All Groups ===')
    const groups = await sock.groupFetchAllParticipating()
    const groupList = Object.values(groups)

    if (groupList.length === 0) {
      logger.info(LOG_PREFIXES.GROUP_SERVICE, 'No groups found.')
      return
    }

    logger.info(LOG_PREFIXES.GROUP_SERVICE, `Found ${groupList.length} group(s):\n`)
    groupList.forEach((group, index) => {
      logger.info(LOG_PREFIXES.GROUP_SERVICE, `${index + 1}. ${group.subject || 'Unknown Group'}`)
      logger.info(LOG_PREFIXES.GROUP_SERVICE, `   ID: ${group.id}`)
      logger.info(LOG_PREFIXES.GROUP_SERVICE, '')
    })

    logger.info(LOG_PREFIXES.GROUP_SERVICE, '=== Instructions ===')
    logger.info(LOG_PREFIXES.GROUP_SERVICE, '1. Send a test message in your target group')
    logger.info(LOG_PREFIXES.GROUP_SERVICE, '2. Copy the Group ID from above (ends with @g.us)')
    logger.info(LOG_PREFIXES.GROUP_SERVICE, '3. Set WHATSAPP_GROUP_IDS in .env')
    logger.info(LOG_PREFIXES.GROUP_SERVICE, '4. Set WA_DISCOVERY_MODE=false in .env')
    logger.info(LOG_PREFIXES.GROUP_SERVICE, '5. Restart the listener')
    logger.info(LOG_PREFIXES.GROUP_SERVICE, '')
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.GROUP_SERVICE, `Error listing groups: ${errorMsg}`, error)
  }
}
