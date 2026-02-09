import { logger } from '../utils/logger.js'
import { LOG_PREFIXES } from '../consts/index.js'
import { processEventPipeline } from './event.service.js'
import { extractMessageId } from '../utils/messageHelpers.js'

/**
 * Message processing queue
 * Processes messages sequentially to prevent race conditions
 */
class MessageQueue {
  constructor() {
    this.queue = []
    this.processing = false
  }

  /**
   * Adds a message to the queue
   * @param {Object} task - Task object with eventId, rawMessage, cloudinaryUrl, cloudinaryData, originalMessage, client
   */
  async add(task) {
    const messageId = extractMessageId(task.rawMessage) || 'unknown'
    const queuePosition = this.queue.length + 1
    
    this.queue.push(task)
    logger.info(LOG_PREFIXES.MESSAGE_SERVICE, `Message ${messageId} queued (position ${queuePosition})`)
    
    // Start processing if not already processing
    if (!this.processing) {
      this.process()
    }
  }

  /**
   * Processes messages from the queue sequentially
   */
  async process() {
    if (this.processing) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      const task = this.queue.shift()
      const messageId = extractMessageId(task.rawMessage) || 'unknown'
      const remainingInQueue = this.queue.length

      try {
        logger.info(LOG_PREFIXES.MESSAGE_SERVICE, `Processing message ${messageId} (${remainingInQueue} remaining in queue)`)
        
        await processEventPipeline(
          task.eventId,
          task.rawMessage,
          task.cloudinaryUrl,
          task.cloudinaryData,
          task.originalMessage,
          task.client
        )

        logger.info(LOG_PREFIXES.MESSAGE_SERVICE, `Message ${messageId} completed`)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        logger.error(LOG_PREFIXES.MESSAGE_SERVICE, `Message ${messageId} failed: ${errorMsg}`)
        // Continue processing next message even if this one failed
      }
    }

    this.processing = false
    logger.info(LOG_PREFIXES.MESSAGE_SERVICE, 'Queue processing completed')
  }

  /**
   * Gets current queue size
   * @returns {number} Number of messages waiting in queue
   */
  getSize() {
    return this.queue.length
  }

  /**
   * Checks if queue is currently processing
   * @returns {boolean} True if processing, false otherwise
   */
  isProcessing() {
    return this.processing
  }
}

// Singleton instance
const messageQueue = new MessageQueue()

/**
 * Adds a message to the processing queue
 * @param {Object} eventId - MongoDB document _id
 * @param {Object} rawMessage - Serialized raw message object
 * @param {string|null} cloudinaryUrl - Cloudinary URL or null
 * @param {Object|null} cloudinaryData - Cloudinary metadata or null
 * @param {Object} originalMessage - Original WhatsApp message object
 * @param {Object} client - WhatsApp client instance
 */
export function queueMessage(eventId, rawMessage, cloudinaryUrl, cloudinaryData, originalMessage, client) {
  messageQueue.add({
    eventId,
    rawMessage,
    cloudinaryUrl,
    cloudinaryData,
    originalMessage,
    client,
  })
}

/**
 * Gets current queue status
 * @returns {{size: number, processing: boolean}} Queue status
 */
export function getQueueStatus() {
  return {
    size: messageQueue.getSize(),
    processing: messageQueue.isProcessing(),
  }
}
