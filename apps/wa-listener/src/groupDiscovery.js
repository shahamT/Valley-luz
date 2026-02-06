/**
 * Group Discovery Module
 * Provides safe discovery mode that prints only metadata, not message content
 */

/**
 * Prints group metadata when a message arrives (discovery mode)
 * @param {Object} message - Message object from whatsapp-web.js
 * @param {Object} chat - Chat object from whatsapp-web.js
 */
export function printGroupMetadata(message, chat) {
  const groupId = chat.id._serialized || chat.id
  const groupName = chat.name || 'Unknown Group'
  const senderName = message.notifyName || message._data?.notifyName || 'Unknown'

  console.log('\n--- Group Message Detected (Discovery Mode) ---')
  console.log(`Group Name: ${groupName}`)
  console.log(`Group ID: ${groupId}`)
  console.log(`Sender: ${senderName}`)
  console.log('---')
  console.log('⚠️  Message content is NOT displayed for privacy')
  console.log('')
}

/**
 * Lists all groups the user is part of
 * @param {Object} client - WhatsApp client instance
 */
export async function listAllGroups(client) {
  try {
    console.log('\n=== Listing All Groups ===')
    const chats = await client.getChats()
    const groups = chats.filter((chat) => chat.isGroup)

    if (groups.length === 0) {
      console.log('No groups found.')
      return
    }

    console.log(`Found ${groups.length} group(s):\n`)
    groups.forEach((group, index) => {
      const groupId = group.id._serialized || group.id
      const groupName = group.name || 'Unknown Group'
      console.log(`${index + 1}. ${groupName}`)
      console.log(`   ID: ${groupId}`)
      console.log('')
    })

    console.log('=== Instructions ===')
    console.log('1. Send a test message in your target group')
    console.log('2. Copy the Group ID from above (ends with @g.us)')
    console.log('3. Set WHATSAPP_GROUP_ID in .env')
    console.log('4. Set WA_DISCOVERY_MODE=false in .env')
    console.log('5. Restart the listener')
    console.log('')
  } catch (error) {
    console.error('[GroupDiscovery] Error listing groups:', error.message)
  }
}
