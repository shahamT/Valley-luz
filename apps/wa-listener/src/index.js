import { config } from './config.js'
import { initializeClient, destroyClient } from './services/whatsapp.service.js'
import { connect, close } from './services/mongo.service.js'
import { logger } from './utils/logger.js'
import { LOG_PREFIXES } from './consts/index.js'

logger.info(LOG_PREFIXES.MAIN, '=== WhatsApp Message Service ===')
logger.info(LOG_PREFIXES.MAIN, `Environment: ${config.nodeEnv}`)
logger.info(LOG_PREFIXES.MAIN, `Discovery Mode: ${config.discoveryMode}`)
if (config.discoveryMode) {
  logger.info(LOG_PREFIXES.MAIN, 'Group IDs: (discovery mode - not set)')
} else {
  logger.info(LOG_PREFIXES.MAIN, `Group IDs: ${config.groupIds.length > 0 ? config.groupIds.join(', ') : '(not set)'}`)
}
logger.info(LOG_PREFIXES.MAIN, '')

// Validate configuration
if (config.isProduction) {
  logger.info(LOG_PREFIXES.MAIN, 'Running in PRODUCTION mode')
  if (config.groupIds.length === 0) {
    logger.error(LOG_PREFIXES.CONFIG, 'WHATSAPP_GROUP_IDS is required in production')
    process.exit(1)
  }
  if (config.discoveryMode) {
    logger.error(LOG_PREFIXES.CONFIG, 'WA_DISCOVERY_MODE must be false in production')
    process.exit(1)
  }
}

// Handle graceful shutdown
const shutdown = async () => {
  logger.info(LOG_PREFIXES.SHUTDOWN, '\nGracefully shutting down...')
  await destroyClient()
  await close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error(LOG_PREFIXES.FATAL, 'Uncaught exception', error)
  shutdown()
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error(LOG_PREFIXES.FATAL, `Unhandled rejection at: ${promise}, reason: ${reason}`)
  shutdown()
})

// Connect to MongoDB first
try {
  const mongoClient = await connect()
  if (!mongoClient) {
    logger.error(LOG_PREFIXES.FATAL, 'MongoDB connection failed - cannot proceed')
    process.exit(1)
  }
} catch (error) {
  const errorMsg = error instanceof Error ? error.message : String(error)
  logger.error(LOG_PREFIXES.FATAL, `Failed to connect to MongoDB: ${errorMsg}`)
  process.exit(1)
}

// Start the client
try {
  logger.info(LOG_PREFIXES.MAIN, 'Starting WhatsApp client initialization...')
  await initializeClient()
  logger.info(LOG_PREFIXES.MAIN, 'WhatsApp client initialization completed successfully')
} catch (error) {
  const errorMsg = error instanceof Error ? error.message : String(error)
  logger.error(LOG_PREFIXES.FATAL, `Failed to initialize client: ${errorMsg}`)
  if (error instanceof Error && error.stack) {
    logger.error(LOG_PREFIXES.FATAL, `Error stack: ${error.stack}`)
  }
  await close()
  process.exit(1)
}
