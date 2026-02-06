import { config } from '../config.js'

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
}

/**
 * Current log level based on config
 */
const currentLogLevel = config.logLevel === 'debug' ? LOG_LEVELS.DEBUG
  : config.logLevel === 'warn' ? LOG_LEVELS.WARN
  : config.logLevel === 'error' ? LOG_LEVELS.ERROR
  : LOG_LEVELS.INFO

/**
 * Formats log message with prefix
 * @param {string} prefix - Log prefix (e.g., '[WhatsApp]')
 * @param {string} message - Log message
 * @returns {string} Formatted log message
 */
function formatMessage(prefix, message) {
  return `${prefix} ${message}`
}

/**
 * Logger service for structured logging
 */
export const logger = {
  /**
   * Log error message
   * @param {string} prefix - Log prefix
   * @param {string|Error} message - Error message or Error object
   * @param {...any} args - Additional arguments
   */
  error(prefix, message, ...args) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      const formattedMessage = message instanceof Error
        ? formatMessage(prefix, message.message)
        : formatMessage(prefix, message)
      console.error(formattedMessage, ...args)
      if (message instanceof Error && message.stack) {
        console.error(formatMessage(prefix, `Stack: ${message.stack}`))
      }
    }
  },

  /**
   * Log warning message
   * @param {string} prefix - Log prefix
   * @param {string} message - Warning message
   * @param {...any} args - Additional arguments
   */
  warn(prefix, message, ...args) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(formatMessage(prefix, message), ...args)
    }
  },

  /**
   * Log info message
   * @param {string} prefix - Log prefix
   * @param {string} message - Info message
   * @param {...any} args - Additional arguments
   */
  info(prefix, message, ...args) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(formatMessage(prefix, message), ...args)
    }
  },

  /**
   * Log debug message
   * @param {string} prefix - Log prefix
   * @param {string} message - Debug message
   * @param {...any} args - Additional arguments
   */
  debug(prefix, message, ...args) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(formatMessage(prefix, `[DEBUG] ${message}`), ...args)
    }
  },
}
