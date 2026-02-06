import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { logError, logErrors } from './utils/errorLogger.js'

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
      logError('WHATSAPP_GROUP_IDS is required in production mode')
      logError('Set WHATSAPP_GROUP_IDS in .env (comma-separated) before running in production')
      process.exit(1)
    }

    const discoveryMode = process.env.WA_DISCOVERY_MODE === 'true'
    if (discoveryMode) {
      logError('WA_DISCOVERY_MODE must be false in production')
      process.exit(1)
    }
  }

  // Validate MongoDB configuration (required)
  const mongodbUri = process.env.MONGODB_URI
  const mongodbDbName = process.env.MONGODB_DB_NAME

  if (!mongodbUri || !mongodbDbName) {
    logError('MongoDB configuration is required')
    const missingVars = []
    if (!mongodbUri) {
      missingVars.push('  - MONGODB_URI')
    }
    if (!mongodbDbName) {
      missingVars.push('  - MONGODB_DB_NAME')
    }
    if (missingVars.length > 0) {
      logError('Missing required environment variables:')
      logErrors(missingVars)
    }
    logError('Please set these variables in your .env file')
    process.exit(1)
  }

  const config = {
    nodeEnv,
    isProduction,
    authPath: process.env.WA_AUTH_PATH || './auth',
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
    // MongoDB configuration
    mongodb: {
      uri: mongodbUri,
      dbName: mongodbDbName,
      collectionRawMessages: process.env.MONGODB_COLLECTION_RAW_MESSAGES || 'raw_messages',
    },
  }

  // Resolve paths relative to wa-listener directory
  const baseDir = join(__dirname, '..')
  config.authPath = join(baseDir, config.authPath)

  // Create auth directory if it doesn't exist
  if (!existsSync(config.authPath)) {
    mkdirSync(config.authPath, { recursive: true })
  }

  return config
}

export const config = loadConfig()
