import pkg from 'whatsapp-web.js'
const { Client, LocalAuth } = pkg
import qrcode from 'qrcode-terminal'
import { config } from './config.js'
import { extractRawMessage, writeMessage, uploadMediaToCloud } from './messageWriter.js'
import { printGroupMetadata, listAllGroups } from './groupDiscovery.js'

let client = null

/**
 * Initializes and starts the WhatsApp client
 * @returns {Promise<Client>} WhatsApp client instance
 */
export async function initializeClient() {
  if (client) {
    console.log('[WhatsApp] Client already exists, returning existing instance')
    return client
  }

  console.log('[WhatsApp] Creating new client instance...')
  console.log(`[WhatsApp] Auth path: ${config.authPath}`)
  
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: config.authPath,
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  })

  // QR Code handler (only in development, never in production)
  client.on('qr', (qr) => {
    if (config.isProduction) {
      console.error('ERROR: QR code should not be displayed in production')
      return
    }
    console.log('\n=== WhatsApp QR Code ===')
    console.log('Scan this QR code with your WhatsApp mobile app:')
    console.log('')
    qrcode.generate(qr, { small: true })
    console.log('')
  })

  // Authentication events
  client.on('authenticating', () => {
    console.log('[WhatsApp] Authenticating...')
  })

  client.on('authenticated', () => {
    console.log('[WhatsApp] Authenticated successfully')
  })

  client.on('auth_failure', (msg) => {
    console.error('[WhatsApp] Authentication failed:', msg)
    console.error('Try deleting the auth folder and restarting')
  })

  client.on('ready', async () => {
    console.log('[WhatsApp] Client is ready!')
    console.log(`[WhatsApp] Mode: ${config.discoveryMode ? 'DISCOVERY' : 'LOCKED'}`)
    
    if (config.discoveryMode) {
      console.log('[WhatsApp] Discovery mode active - listening to all groups')
      console.log('[WhatsApp] Group metadata will be printed when messages arrive')
      await listAllGroups(client)
    } else {
      if (config.groupIds.length === 0) {
        console.log('[WhatsApp] Locked mode active - no groups configured')
      } else {
        console.log(`[WhatsApp] Locked mode active - listening to ${config.groupIds.length} group(s):`)
        config.groupIds.forEach((groupId, index) => {
          console.log(`  ${index + 1}. ${groupId}`)
        })
      }
    }
  })

  // Message handler
  client.on('message', async (message) => {
    try {
      // Only process group messages
      const chat = await message.getChat()
      if (!chat.isGroup) {
        return
      }

      const groupId = chat.id._serialized || chat.id

      // In discovery mode: print metadata only
      if (config.discoveryMode) {
        printGroupMetadata(message, chat)
        return
      }

      // In locked mode: only process messages from configured groups
      if (!config.groupIds.includes(groupId)) {
        if (config.logLevel === 'info') {
          console.log(`[WhatsApp] Ignoring message from group: ${groupId}`)
        }
        return
      }

      // Extract raw message data
      const rawMessage = extractRawMessage(message, chat)
      
      // Upload media to Cloudinary if present
      let cloudinaryResult = null
      if (message.hasMedia) {
        const messageId = message.id?._serialized || message.id?.id || `msg_${Date.now()}`
        cloudinaryResult = await uploadMediaToCloud(message, messageId)
      }
      
      // Write message with Cloudinary URL
      await writeMessage(rawMessage, cloudinaryResult)
    } catch (error) {
      console.error('[WhatsApp] Error processing message:', error.message)
    }
  })

  // Error handling
  client.on('disconnected', (reason) => {
    console.log('[WhatsApp] Client disconnected:', reason)
  })

  client.on('loading_screen', (percent, message) => {
    console.log(`[WhatsApp] Loading: ${percent}% - ${message}`)
  })

  // Add error handler for unhandled errors
  client.on('error', (error) => {
    console.error('[WhatsApp] Client error:', error)
  })

  // Add change_state handler to see state changes
  client.on('change_state', (state) => {
    console.log(`[WhatsApp] State changed to: ${state}`)
  })

  // Initialize client with timeout
  console.log('[WhatsApp] Initializing client...')
  console.log('[WhatsApp] This may take a moment (launching browser)...')
  console.log('[WhatsApp] If this hangs, try:')
  console.log('[WhatsApp]   1. Delete apps/wa-listener/auth folder')
  console.log('[WhatsApp]   2. Delete apps/wa-listener/.wwebjs_cache folder')
  console.log('[WhatsApp]   3. Check if Chromium is installed (npm install puppeteer)')
  
  try {
    // Add a timeout wrapper to detect hanging
    const initPromise = client.initialize()
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Client initialization timeout after 90 seconds. The browser may not be launching. Try: 1) Delete auth and .wwebjs_cache folders, 2) Reinstall puppeteer: npm install puppeteer in apps/wa-listener'))
      }, 90000) // 90 second timeout (increased)
    })
    
    await Promise.race([initPromise, timeoutPromise])
    console.log('[WhatsApp] Client initialization completed')
  } catch (error) {
    console.error('[WhatsApp] Error during initialization:', error.message)
    if (error.stack) {
      console.error('[WhatsApp] Stack trace:', error.stack)
    }
    // Clean up the client on error
    if (client) {
      try {
        await client.destroy()
      } catch (destroyError) {
        // Ignore destroy errors
      }
      client = null
    }
    throw error
  }

  return client
}

/**
 * Gets the current client instance
 * @returns {Client|null}
 */
export function getClient() {
  return client
}

/**
 * Destroys the client
 */
export async function destroyClient() {
  if (client) {
    await client.destroy()
    client = null
  }
}
