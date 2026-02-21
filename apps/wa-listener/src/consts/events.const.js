/**
 * Event consts for wa-listener: shared categories + listener-specific helpers
 * EVENT_CATEGORIES and getCategoriesList come from root shared source
 */

import { EVENT_CATEGORIES, getCategoriesList } from '../../../../consts/events.const.js'

export { EVENT_CATEGORIES, getCategoriesList }

const TIMEZONE = 'Asia/Jerusalem'

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

/**
 * Builds a context block with current date/time/timezone for injection into OpenAI prompts.
 * Computed fresh on each call so timestamps stay accurate.
 * @returns {string} Multi-line context string
 */
export function getDateTimeContext() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-IL', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map(({ type, value }) => [type, value])
  )

  const localDate = `${parts.year}-${parts.month}-${parts.day}`
  const localTime = `${parts.hour}:${parts.minute}`
  const dayIndex = new Date(
    now.toLocaleString('en-US', { timeZone: TIMEZONE })
  ).getDay()
  const dayNameHeb = HEBREW_DAYS[dayIndex]

  const offsetMs = now.getTime() - new Date(
    now.toLocaleString('en-US', { timeZone: 'UTC' })
  ).getTime()
  const offsetH = Math.round(offsetMs / 3_600_000)
  const utcOffset = `UTC${offsetH >= 0 ? '+' : ''}${offsetH}`

  return [
    `CURRENT_DATE: ${localDate}`,
    `CURRENT_TIME: ${localTime} (Israel local)`,
    `DAY_OF_WEEK: יום ${dayNameHeb}`,
    `TIMEZONE: ${TIMEZONE} (${utcOffset})`,
    `CURRENT_YEAR: ${parts.year}`,
  ].join('\n')
}

/**
 * Returns whether a Cloudinary URL points to an image (not video/audio/document).
 * Does NOT rely on file extensions; checks Cloudinary resource type path segment.
 * @param {string|null} url
 * @returns {boolean}
 */
export function isImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  if (/\/image\/upload\//i.test(url)) return true
  if (/\.(jpe?g|png|webp|gif|bmp|tiff?)(\?|$)/i.test(url)) return true
  return false
}
