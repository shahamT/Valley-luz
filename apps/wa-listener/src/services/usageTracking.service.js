import { getDb } from './mongoConnection.js'
import { config } from '../config.js'
import { logger } from '../utils/logger.js'
import { LOG_PREFIXES } from '../consts/index.js'

const USAGE_PREFIX = 'UsageTracking'

/**
 * Returns current month key (YYYY-MM) for usage doc.
 * @returns {string}
 */
function getCurrentMonthKey() {
  return new Date().toISOString().slice(0, 7)
}

/**
 * Gets current month usage for OpenAI and Google Vision. Returns zeros if DB unavailable or on error (fail open).
 * @param {string} [monthKey] - Optional month key (YYYY-MM). Defaults to current month.
 * @returns {Promise<{ openaiCalls: number, googleVisionCalls: number }>}
 */
export async function getMonthlyUsage(monthKey = getCurrentMonthKey()) {
  const db = getDb()
  if (!db) {
    return { openaiCalls: 0, googleVisionCalls: 0 }
  }
  try {
    const collectionName = config.mongodb?.collectionApiUsage || 'api_usage'
    const collection = db.collection(collectionName)
    const doc = await collection.findOne({ month: monthKey })
    return {
      openaiCalls: doc?.openaiCalls ?? 0,
      googleVisionCalls: doc?.googleVisionCalls ?? 0,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn(LOG_PREFIXES.EVENT_SERVICE, `${USAGE_PREFIX} getMonthlyUsage failed: ${msg}`)
    return { openaiCalls: 0, googleVisionCalls: 0 }
  }
}

/**
 * Increments OpenAI call count for the given month. No-op if DB unavailable or on error (does not throw).
 * @param {string} [monthKey] - Optional month key (YYYY-MM). Defaults to current month.
 * @param {number} [count] - Number to add (default 1).
 */
export async function incrementOpenAICalls(monthKey = getCurrentMonthKey(), count = 1) {
  const db = getDb()
  if (!db || count <= 0) return
  try {
    const collectionName = config.mongodb?.collectionApiUsage || 'api_usage'
    const collection = db.collection(collectionName)
    await collection.updateOne(
      { month: monthKey },
      { $inc: { openaiCalls: count } },
      { upsert: true }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn(LOG_PREFIXES.EVENT_SERVICE, `${USAGE_PREFIX} incrementOpenAICalls failed: ${msg}`)
  }
}

/**
 * Increments Google Vision call count for the given month. No-op if DB unavailable or on error (does not throw).
 * @param {string} [monthKey] - Optional month key (YYYY-MM). Defaults to current month.
 * @param {number} [count] - Number to add (default 1).
 */
export async function incrementGoogleVisionCalls(monthKey = getCurrentMonthKey(), count = 1) {
  const db = getDb()
  if (!db || count <= 0) return
  try {
    const collectionName = config.mongodb?.collectionApiUsage || 'api_usage'
    const collection = db.collection(collectionName)
    await collection.updateOne(
      { month: monthKey },
      { $inc: { googleVisionCalls: count } },
      { upsert: true }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.warn(LOG_PREFIXES.EVENT_SERVICE, `${USAGE_PREFIX} incrementGoogleVisionCalls failed: ${msg}`)
  }
}
