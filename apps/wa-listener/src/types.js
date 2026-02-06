/**
 * @typedef {Object} MessageSender
 * @property {string|null} phone - Phone number if available
 * @property {string|null} name - Contact name/pushname if available
 */

/**
 * @typedef {Object} MessageRaw
 * @property {boolean} hasMedia - Whether message contains media
 * @property {string|null} quotedMsgId - ID of quoted message if any
 */

/**
 * @typedef {Object} NormalizedMessage
 * @property {string} id - Message ID from whatsapp-web.js
 * @property {string} timestamp - ISO string in UTC
 * @property {string} groupId - Chat ID, ends with @g.us
 * @property {string|null} groupName - Group name if available
 * @property {MessageSender} sender - Sender information
 * @property {"text"|"media"|"unknown"} type - Message type
 * @property {string|null} text - Message text content (null for media)
 * @property {MessageRaw} raw - Raw message metadata
 */

export {}
