import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file from wa-listener directory
dotenv.config({ path: join(__dirname, '../.env') })

/**
 * Validates and exports configuration
 * Implements fail-closed logic for production
 */
function loadConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isProduction = nodeEnv === 'production'

  // Parse group IDs from environment variable (comma-separated or single value)
  const groupIdsEnv = process.env.WHATSAPP_GROUP_IDS || process.env.WHATSAPP_GROUP_ID || ''
  const groupIds = groupIdsEnv
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id !== '')

  // Fail closed in production if no groupIds are provided
  if (isProduction) {
    if (groupIds.length === 0) {
      console.error('ERROR: WHATSAPP_GROUP_IDS is required in production mode')
      console.error('Set WHATSAPP_GROUP_IDS in .env (comma-separated) before running in production')
      process.exit(1)
    }

    const discoveryMode = process.env.WA_DISCOVERY_MODE === 'true'
    if (discoveryMode) {
      console.error('ERROR: WA_DISCOVERY_MODE must be false in production')
      process.exit(1)
    }
  }

  const config = {
    nodeEnv,
    isProduction,
    authPath: process.env.WA_AUTH_PATH || './auth',
    dataPath: process.env.WA_DATA_PATH || './data',
    messagesFile: process.env.WA_MESSAGES_FILE || 'messages.jsonl',
    mediaPath: process.env.WA_MEDIA_PATH || './data/media',
    groupIds, // Array of group IDs
    discoveryMode: process.env.WA_DISCOVERY_MODE === 'true',
    logLevel: process.env.WA_LOG_LEVEL || 'info',
    // Cloudinary configuration
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
      folder: process.env.CLOUDINARY_FOLDER || 'whatsapp-listener',
    },
  }

  // Resolve paths relative to wa-listener directory
  const baseDir = join(__dirname, '..')
  config.authPath = join(baseDir, config.authPath)
  config.dataPath = join(baseDir, config.dataPath)
  config.mediaPath = join(baseDir, config.mediaPath)
  const messagesFilePath = join(config.dataPath, config.messagesFile)
  config.messagesFilePath = messagesFilePath

  // Create directories if they don't exist
  if (!existsSync(config.authPath)) {
    mkdirSync(config.authPath, { recursive: true })
  }
  if (!existsSync(config.dataPath)) {
    mkdirSync(config.dataPath, { recursive: true })
  }
  if (!existsSync(config.mediaPath)) {
    mkdirSync(config.mediaPath, { recursive: true })
  }

  return config
}

export const config = loadConfig()
