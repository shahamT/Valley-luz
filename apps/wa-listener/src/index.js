import { config } from './config.js'
import { initializeClient, destroyClient } from './whatsappClient.js'

console.log('=== WhatsApp Group Listener (PoC) ===')
console.log(`Environment: ${config.nodeEnv}`)
console.log(`Discovery Mode: ${config.discoveryMode}`)
if (config.discoveryMode) {
  console.log('Group IDs: (discovery mode - not set)')
} else {
  console.log(`Group IDs: ${config.groupIds.length > 0 ? config.groupIds.join(', ') : '(not set)'}`)
}
console.log('')

// Validate configuration
if (config.isProduction) {
  console.log('Running in PRODUCTION mode')
  if (config.groupIds.length === 0) {
    console.error('ERROR: WHATSAPP_GROUP_IDS is required in production')
    process.exit(1)
  }
  if (config.discoveryMode) {
    console.error('ERROR: WA_DISCOVERY_MODE must be false in production')
    process.exit(1)
  }
}

// Handle graceful shutdown
const shutdown = async () => {
  console.log('\n[Shutdown] Gracefully shutting down...')
  await destroyClient()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Fatal] Uncaught exception:', error)
  shutdown()
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Fatal] Unhandled rejection at:', promise, 'reason:', reason)
  shutdown()
})

// Start the client
try {
  console.log('[Main] Starting WhatsApp client initialization...')
  await initializeClient()
  console.log('[Main] WhatsApp client initialization completed successfully')
} catch (error) {
  console.error('[Fatal] Failed to initialize client:', error.message)
  console.error('[Fatal] Error stack:', error.stack)
  process.exit(1)
}
