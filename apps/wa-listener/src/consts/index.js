/**
 * Log prefixes for different services
 */
export const LOG_PREFIXES = {
  WHATSAPP: '[WhatsApp]',
  MONGODB: '[MongoDB]',
  CLOUDINARY: '[Cloudinary]',
  MESSAGE_SERVICE: '[MessageService]',
  MEDIA_SERVICE: '[MediaService]',
  GROUP_SERVICE: '[GroupService]',
  CONFIG: '[Config]',
  MAIN: '[Main]',
  SHUTDOWN: '[Shutdown]',
  FATAL: '[Fatal]',
}

/**
 * Timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  CLIENT_INIT: 90000, // 90 seconds
}

/**
 * Default limits
 */
export const LIMITS = {
  MESSAGES_DEFAULT: 200,
  MESSAGES_MAX: 500,
}

/**
 * Default values
 */
export const DEFAULTS = {
  UNKNOWN_MESSAGE_ID: 'unknown',
  UNKNOWN_GROUP_NAME: 'Unknown Group',
  UNKNOWN_SENDER: 'Unknown',
}

/**
 * Puppeteer browser arguments
 */
export const PUPPETEER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-software-rasterizer',
  '--disable-extensions',
]

/**
 * MIME type to file extension mapping
 */
export const MIME_TYPE_EXTENSIONS = {
  'jpeg': 'jpg',
  'quicktime': 'mov',
  'x-matroska': 'mkv',
}

/**
 * Default MIME type for unknown media
 */
export const DEFAULT_MIME_TYPE = 'application/octet-stream'

/**
 * Allowed message types for processing
 */
export const ALLOWED_MESSAGE_TYPES = ['text', 'image', 'video', 'chat']
