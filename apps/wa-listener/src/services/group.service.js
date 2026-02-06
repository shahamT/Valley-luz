import { logger } from '../utils/logger.js'
import { extractGroupId, getGroupName, getSenderName } from '../utils/messageHelpers.js'
import { LOG_PREFIXES } from '../consts/index.js'

/**
 * Group Service Module
 * Provides safe discovery mode that prints only metadata, not message content
 */

/**
 * Prints group metadata when a message arrives (discovery mode)
 * @param {Object} message - Message object from whatsapp-web.js
 * @param {Object} chat - Chat object from whatsapp-web.js
 */
export function printGroupMetadata(message, chat) {
  const groupId = extractGroupId(chat)
  const groupName = getGroupName(chat)
  const senderName = getSenderName(message)

  logger.info(LOG_PREFIXES.GROUP_SERVICE, '\n--- Group Message Detected (Discovery Mode) ---')
  logger.info(LOG_PREFIXES.GROUP_SERVICE, `Group Name: ${groupName}`)
  logger.info(LOG_PREFIXES.GROUP_SERVICE, `Group ID: ${groupId}`)
  logger.info(LOG_PREFIXES.GROUP_SERVICE, `Sender: ${senderName}`)
  logger.info(LOG_PREFIXES.GROUP_SERVICE, '---')
  logger.info(LOG_PREFIXES.GROUP_SERVICE, '⚠️  Message content is NOT displayed for privacy')
  logger.info(LOG_PREFIXES.GROUP_SERVICE, '')
}

/**
 * Lists all groups the user is part of
 * @param {Object} client - WhatsApp client instance
 */
export async function listAllGroups(client) {
  try {
    logger.info(LOG_PREFIXES.GROUP_SERVICE, '\n=== Listing All Groups ===')
    const chats = await client.getChats()
    const groups = chats.filter((chat) => chat.isGroup)

    if (groups.length === 0) {
      logger.info(LOG_PREFIXES.GROUP_SERVICE, 'No groups found.')
      return
    }

    logger.info(LOG_PREFIXES.GROUP_SERVICE, `Found ${groups.length} group(s):\n`)
    groups.forEach((group, index) => {
      const groupId = extractGroupId(group)
      const groupName = getGroupName(group)
      logger.info(LOG_PREFIXES.GROUP_SERVICE, `${index + 1}. ${groupName}`)
      logger.info(LOG_PREFIXES.GROUP_SERVICE, `   ID: ${groupId}`)
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
