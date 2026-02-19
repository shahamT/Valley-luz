import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  DisconnectReason,
  downloadMediaMessage,
  getContentType,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import P from 'pino'
import qrcode from 'qrcode-terminal'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { extractMessageId, extractGroupId } from '../utils/messageHelpers.js'
import { LOG_PREFIXES, TIMEOUTS } from '../consts/index.js'
import { serializeMessage, processMessage, isMessageTypeAllowed } from './message.service.js'
import { uploadMessageMedia } from './media.service.js'
import { printGroupMetadata, listAllGroups } from './group.service.js'
import { insertEventDocument, findEventBySignature } from './mongo.service.js'
import { queueMessage } from './queue.service.js'
import { computeMessageSignature } from '../utils/messageHelpers.js'
import { deleteMediaFromCloudinary } from './cloudinary.service.js'
import { sendEventConfirmation, CONFIRMATION_REASONS } from '../utils/messageSender.js'

let sock = null

const baileysLogger = P({ level: 'silent' })

/**
 * Initializes and starts the Baileys WhatsApp socket
 * @returns {Promise<Object>} Baileys socket instance
 */
export async function initializeClient() {
  if (sock) {
    logger.info(LOG_PREFIXES.WHATSAPP, 'Client already exists, returning existing instance')
    return sock
  }

  logger.info(LOG_PREFIXES.WHATSAPP, 'Creating new client instance...')
  logger.info(LOG_PREFIXES.WHATSAPP, `Auth path: ${config.authPath}`)

  const { state, saveCreds } = await useMultiFileAuthState(config.authPath)
  const { version } = await fetchLatestBaileysVersion()

  logger.info(LOG_PREFIXES.WHATSAPP, `Using WA Web version: ${version.join('.')}`)

  sock = makeWASocket({
    version,
    logger: baileysLogger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
    },
    generateHighQualityLinkPreview: false,
  })

  return new Promise((resolve, reject) => {
    const initTimeout = setTimeout(() => {
      const timeoutSeconds = Math.floor(TIMEOUTS.CLIENT_INIT / 1000)
      reject(new Error(`Client initialization timeout after ${timeoutSeconds} seconds`))
    }, TIMEOUTS.CLIENT_INIT)

    sock.ev.process(async (events) => {
      if (events['connection.update']) {
        const { connection, lastDisconnect, qr } = events['connection.update']

        if (qr) {
          if (config.isProduction) {
            logger.error(LOG_PREFIXES.WHATSAPP, 'QR code should not be displayed in production')
          } else {
            logger.info(LOG_PREFIXES.WHATSAPP, '\n=== WhatsApp QR Code ===')
            logger.info(LOG_PREFIXES.WHATSAPP, 'Scan this QR code with your WhatsApp mobile app:')
            logger.info(LOG_PREFIXES.WHATSAPP, '')
            qrcode.generate(qr, { small: true })
            logger.info(LOG_PREFIXES.WHATSAPP, '')
            logger.info(LOG_PREFIXES.WHATSAPP, '=== Raw QR Data (paste into any online QR generator) ===')
            logger.info(LOG_PREFIXES.WHATSAPP, qr)
            logger.info(LOG_PREFIXES.WHATSAPP, '=== End Raw QR Data ===')
          }
        }

        if (connection === 'open') {
          clearTimeout(initTimeout)
          logger.info(LOG_PREFIXES.WHATSAPP, 'Client is ready!')
          logger.info(LOG_PREFIXES.WHATSAPP, `Mode: ${config.discoveryMode ? 'DISCOVERY' : 'LOCKED'}`)

          if (config.discoveryMode) {
            logger.info(LOG_PREFIXES.WHATSAPP, 'Discovery mode active - listening to all groups')
            await listAllGroups(sock)
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

          resolve(sock)
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error)?.output?.statusCode
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut

          logger.info(LOG_PREFIXES.WHATSAPP, `Connection closed. Status: ${statusCode}. Reconnect: ${shouldReconnect}`)

          if (shouldReconnect) {
            clearTimeout(initTimeout)
            sock = null
            try {
              const newSock = await initializeClient()
              resolve(newSock)
            } catch (err) {
              reject(err)
            }
          } else {
            clearTimeout(initTimeout)
            logger.error(LOG_PREFIXES.WHATSAPP, 'Logged out. Delete auth folder and re-authenticate.')
            reject(new Error('WhatsApp logged out'))
          }
        }
      }

      if (events['creds.update']) {
        await saveCreds()
      }

      if (events['messages.upsert']) {
        const { messages: upsertMessages, type } = events['messages.upsert']

        if (type !== 'notify') return

        for (const msg of upsertMessages) {
          try {
            await handleIncomingMessage(msg)
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error)
            logger.error(LOG_PREFIXES.WHATSAPP, `Error processing message: ${errorMsg}`)
          }
        }
      }
    })
  })
}

/**
 * Handles a single incoming Baileys message
 * @param {Object} msg - Baileys message object (proto.IWebMessageInfo)
 */
async function handleIncomingMessage(msg) {
  const remoteJid = msg.key?.remoteJid
  if (!remoteJid || !remoteJid.endsWith('@g.us')) return
  if (msg.key?.fromMe) return
  if (!msg.message) return

  const groupId = remoteJid

  if (config.discoveryMode) {
    const chatMeta = { id: groupId, name: null }
    try {
      const metadata = await sock.groupMetadata(groupId)
      chatMeta.name = metadata.subject
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
      try {
        await sendEventConfirmation(messagePreview, CONFIRMATION_REASONS.PROCESSING_STARTED)
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

/**
 * Gets the current socket instance
 * @returns {Object|null}
 */
export function getClient() {
  return sock
}

/**
 * Destroys the socket connection
 */
export async function destroyClient() {
  if (sock) {
    try {
      sock.end(undefined)
    } catch (_) { /* ignore */ }
    sock = null
  }
}

/**
 * Downloads media from a Baileys message
 * @param {Object} msg - Baileys message object
 * @returns {Promise<{data: string, mimetype: string}|null>} Base64 data + mimetype, matching old format
 */
export async function downloadMedia(msg) {
  try {
    const buffer = await downloadMediaMessage(msg, 'buffer', {})
    if (!buffer) return null

    const contentType = getContentType(msg.message)
    const mediaMsg = msg.message?.[contentType]
    const mimetype = mediaMsg?.mimetype || 'application/octet-stream'

    return {
      data: buffer.toString('base64'),
      mimetype,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    logger.error(LOG_PREFIXES.WHATSAPP, `Error downloading media: ${errorMsg}`)
    return null
  }
}
