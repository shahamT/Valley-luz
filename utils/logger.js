/**
 * Simple logger service for browser-side logging
 * Provides structured logging with prefixes
 */
export const logger = {
  /**
   * Log error message
   * @param {string} prefix - Log prefix (e.g., '[EventsAPI]')
   * @param {string} message - Error message
   * @param {...any} args - Additional arguments
   */
  error(prefix, message, ...args) {
    console.error(`${prefix} ${message}`, ...args)
  },

  /**
   * Log warning message
   * @param {string} prefix - Log prefix
   * @param {string} message - Warning message
   * @param {...any} args - Additional arguments
   */
  warn(prefix, message, ...args) {
    console.warn(`${prefix} ${message}`, ...args)
  },

  /**
   * Log info message
   * @param {string} prefix - Log prefix
   * @param {string} message - Info message
   * @param {...any} args - Additional arguments
   */
  info(prefix, message, ...args) {
    console.log(`${prefix} ${message}`, ...args)
  },

  /**
   * Log debug message
   * @param {string} prefix - Log prefix
   * @param {string} message - Debug message
   * @param {...any} args - Additional arguments
   */
  debug(prefix, message, ...args) {
    console.log(`${prefix} [DEBUG] ${message}`, ...args)
  },
}
