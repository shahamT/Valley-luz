/**
 * Simple error logger for use in config.js
 * This logger doesn't depend on config to avoid circular dependencies
 * It's a minimal logger that only outputs errors to console.error
 */

/**
 * Logs an error message
 * @param {string} message - Error message
 */
export function logError(message) {
  console.error(`[Config] ${message}`)
}

/**
 * Logs multiple error messages
 * @param {string[]} messages - Array of error messages
 */
export function logErrors(messages) {
  messages.forEach((msg) => logError(msg))
}
