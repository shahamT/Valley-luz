import pkg from 'whatsapp-web.js'
const { Client, LocalAuth } = pkg
import qrcode from 'qrcode-terminal'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { extractMessageId, extractGroupId } from '../utils/messageHelpers.js'
import { LOG_PREFIXES, TIMEOUTS, PUPPETEER_ARGS } from '../consts/index.js'
import { serializeMessage, processMessage, isMessageTypeAllowed } from './message.service.js'
import { uploadMessageMedia } from './media.service.js'
import { printGroupMetadata, listAllGroups } from './group.service.js'
import { insertEventDocument, findEventBySignature } from './mongo.service.js'
import { queueMessage } from './queue.service.js'
import { computeMessageSignature } from '../utils/messageHelpers.js'
import { deleteMediaFromCloudinary } from './cloudinary.service.js'

let client = null

/**
 * Initializes and starts the WhatsApp client
 * @returns {Promise<Client>} WhatsApp client instance
 */
export async function initializeClient() {
  if (client) {
    logger.info(LOG_PREFIXES.WHATSAPP, 'Client already exists, returning existing instance')
    return client
  }

  logger.info(LOG_PREFIXES.WHATSAPP, 'Creating new client instance...')
  logger.info(LOG_PREFIXES.WHATSAPP, `Auth path: ${config.authPath}`)
  
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: config.authPath,
    }),
    puppeteer: {
      headless: true,
      args: PUPPETEER_ARGS,
    },
  })

  // QR Code handler (only in development, never in production)
  client.on('qr', (qr) => {
    if (config.isProduction) {
      logger.error(LOG_PREFIXES.WHATSAPP, 'QR code should not be displayed in production')
      return
    }
    logger.info(LOG_PREFIXES.WHATSAPP, '\n=== WhatsApp QR Code ===')
    logger.info(LOG_PREFIXES.WHATSAPP, 'Scan this QR code with your WhatsApp mobile app:')
    logger.info(LOG_PREFIXES.WHATSAPP, '')
    qrcode.generate(qr, { small: true })
    logger.info(LOG_PREFIXES.WHATSAPP, '')
  })

  // Authentication events
  client.on('authenticating', () => {
    logger.info(LOG_PREFIXES.WHATSAPP, 'Authenticating...')
  })

  client.on('authenticated', () => {
    logger.info(LOG_PREFIXES.WHATSAPP, 'Authenticated successfully')
  })

  client.on('auth_failure', (msg) => {
    logger.error(LOG_PREFIXES.WHATSAPP, `Authentication failed: ${msg}`)
    logger.error(LOG_PREFIXES.WHATSAPP, 'Try deleting the auth folder and restarting')
  })

  client.on('ready', async () => {
    logger.info(LOG_PREFIXES.WHATSAPP, 'Client is ready!')
    logger.info(LOG_PREFIXES.WHATSAPP, `Mode: ${config.discoveryMode ? 'DISCOVERY' : 'LOCKED'}`)
    
    if (config.discoveryMode) {
      logger.info(LOG_PREFIXES.WHATSAPP, 'Discovery mode active - listening to all groups')
      logger.info(LOG_PREFIXES.WHATSAPP, 'Group metadata will be printed when messages arrive')
      await listAllGroups(client)
    } else {
      if (config.groupIds.length === 0) {
        logger.info(LOG_PREFIXES.WHATSAPP, 'Locked mode active - no groups configured')
      } else {
        logger.info(LOG_PREFIXES.WHATSAPP, `Locked mode active - listening to ${config.groupIds.length} group(s):`)
        config.groupIds.forEach((groupId, index) => {
          logger.info(LOG_PREFIXES.WHATSAPP, `  ${index + 1}. ${groupId}`)
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

      const groupId = extractGroupId(chat)

      // In discovery mode: print metadata only
      if (config.discoveryMode) {
        printGroupMetadata(message, chat)
        return
      }

      // In locked mode: only process messages from configured groups
      if (!config.groupIds.includes(groupId)) {
        if (config.logLevel === 'info') {
          logger.info(LOG_PREFIXES.WHATSAPP, `Ignoring message from group: ${groupId}`)
        }
        return
      }

      // Only process messages with allowed types (text, image, video)
      if (!isMessageTypeAllowed(message)) {
        if (config.logLevel === 'info') {
          const messageType = message.type || message._data?.type || 'unknown'
          logger.info(LOG_PREFIXES.WHATSAPP, `Ignoring message with unsupported type: ${messageType}`)
        }
        return
      }

      // Serialize message data (only keeps specific fields)
      const rawMessage = serializeMessage(message)
      
      // Validate serialized message structure
      if (!rawMessage || typeof rawMessage !== 'object') {
        logger.error(LOG_PREFIXES.WHATSAPP, 'Failed to serialize message - invalid structure')
        return
      }
      
      // Check for duplicate messages before processing
      const messageText = rawMessage.text || ''
      const messageSignature = computeMessageSignature(messageText)
      
      // If message has text, check for duplicates
      if (messageSignature) {
        const existingEvent = await findEventBySignature(messageSignature)
        if (existingEvent) {
          // Duplicate found - skip all processing
          const messageId = extractMessageId(rawMessage)
          logger.info(LOG_PREFIXES.DUPLICATE_DETECTION, `Duplicate message detected: ${messageId} (signature: ${messageSignature.substring(0, 8)}...) - skipping processing`)
          // Skip media upload, database insertion, and AI processing
          return
        }
      }
      
      // Upload media to Cloudinary if present
      // Pass serialized message so imgBody can be used in media processing
      let cloudinaryResult = null
      if (message.hasMedia) {
        const messageId = extractMessageId(message) || `msg_${Date.now()}`
        cloudinaryResult = await uploadMessageMedia(message, messageId, rawMessage)
      }
      
      // Process message with Cloudinary URL
      processMessage(rawMessage, cloudinaryResult)
      
      // Insert event document and process pipeline (fire-and-forget, fail-safe)
      // Cloudinary data is stored as top-level fields, not in raw message
      try {
        const cloudinaryUrl = cloudinaryResult?.cloudinaryUrl || null
        const cloudinaryData = cloudinaryResult?.cloudinaryData || null
        
        // Insert event document with event=null initially, including message signature
        const eventDoc = await insertEventDocument(rawMessage, cloudinaryUrl, cloudinaryData, messageSignature)
        
        if (eventDoc && eventDoc._id) {
          // Add message to processing queue (processes sequentially)
          queueMessage(
            eventDoc._id,
            rawMessage,
            cloudinaryUrl,
            cloudinaryData,
            message,
            client
          )
        } else {
          // If document insertion failed but we uploaded media, clean it up
          if (cloudinaryResult?.cloudinaryData?.public_id) {
            await deleteMediaFromCloudinary(cloudinaryResult.cloudinaryData.public_id)
          }
          logger.warn(LOG_PREFIXES.WHATSAPP, 'Failed to insert event document, skipping pipeline')
        }
      } catch (error) {
        // Extra safety catch - should never reach here, but ensure handler never crashes
        // If we uploaded media but insertion failed, try to clean it up
        if (cloudinaryResult?.cloudinaryData?.public_id) {
          try {
            await deleteMediaFromCloudinary(cloudinaryResult.cloudinaryData.public_id)
          } catch (deleteError) {
            // Log but don't throw - cleanup failure shouldn't mask original error
            const deleteErrorMsg = deleteError instanceof Error ? deleteError.message : String(deleteError)
            logger.error(LOG_PREFIXES.CLOUDINARY, `Failed to cleanup media after insertion error: ${deleteErrorMsg}`)
          }
        }
        const errorMsg = error instanceof Error ? error.message : String(error)
        logger.error(LOG_PREFIXES.WHATSAPP, `Error in event document insertion (non-blocking): ${errorMsg}`)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      logger.error(LOG_PREFIXES.WHATSAPP, `Error processing message: ${errorMsg}`)
    }
  })

  // Error handling
  client.on('disconnected', (reason) => {
    logger.info(LOG_PREFIXES.WHATSAPP, `Client disconnected: ${reason}`)
  })

  client.on('loading_screen', (percent, message) => {
    logger.info(LOG_PREFIXES.WHATSAPP, `Loading: ${percent}% - ${message}`)
  })

  // Add error handler for unhandled errors
  client.on('error', (error) => {
    logger.error(LOG_PREFIXES.WHATSAPP, 'Client error', error)
  })

  // Add change_state handler to see state changes
  client.on('change_state', (state) => {
    logger.info(LOG_PREFIXES.WHATSAPP, `State changed to: ${state}`)
  })

  // Initialize client with timeout
  logger.info(LOG_PREFIXES.WHATSAPP, 'Initializing client...')
  logger.info(LOG_PREFIXES.WHATSAPP, 'This may take a moment (launching browser)...')
  logger.info(LOG_PREFIXES.WHATSAPP, 'If this hangs, try:')
  logger.info(LOG_PREFIXES.WHATSAPP, '  1. Delete apps/wa-listener/auth folder')
  logger.info(LOG_PREFIXES.WHATSAPP, '  2. Delete apps/wa-listener/.wwebjs_cache folder')
  logger.info(LOG_PREFIXES.WHATSAPP, '  3. Check if Chromium is installed (npm install puppeteer)')
  
  try {
    // Add a timeout wrapper to detect hanging
    const initPromise = client.initialize()
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        const timeoutSeconds = Math.floor(TIMEOUTS.CLIENT_INIT / 1000)
        reject(new Error(`Client initialization timeout after ${timeoutSeconds} seconds. The browser may not be launching. Try: 1) Delete auth and .wwebjs_cache folders, 2) Reinstall puppeteer: npm install puppeteer in apps/wa-listener`))
      }, TIMEOUTS.CLIENT_INIT)
    })
    
    await Promise.race([initPromise, timeoutPromise])
    logger.info(LOG_PREFIXES.WHATSAPP, 'Client initialization completed')
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.WHATSAPP, `Error during initialization: ${errorMsg}`)
    if (error instanceof Error && error.stack) {
      logger.error(LOG_PREFIXES.WHATSAPP, `Stack trace: ${error.stack}`)
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
