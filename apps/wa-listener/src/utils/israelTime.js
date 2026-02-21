/**
 * Israel (Asia/Jerusalem) timezone helpers. DST-aware via Intl.
 */

/**
 * Returns ISO UTC string for Israel (Asia/Jerusalem) midnight on the given date.
 * @param {string} dateOrIso - Date part (YYYY-MM-DD) or full ISO string
 * @returns {string} ISO UTC string
 */
export function israelMidnightToUtcIso(dateOrIso) {
  const dateOnly = typeof dateOrIso === 'string' ? dateOrIso.slice(0, 10) : ''
  const match = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return dateOrIso
  const [, y, m, d] = match.map(Number)
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
  const israelHour = parseInt(noonUtc.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hour12: false }), 10)
  const offsetHours = israelHour - 12
  const utcIsraelMidnight = new Date(Date.UTC(y, m - 1, d) - offsetHours * 3600 * 1000)
  return utcIsraelMidnight.toISOString()
}

/**
 * Returns YYYY-MM-DD in Israel (Asia/Jerusalem) for an ISO UTC string.
 * @param {string} isoString - ISO UTC date-time string
 * @returns {string|null} YYYY-MM-DD or null
 */
export function getDateInIsraelFromIso(isoString) {
  if (!isoString || typeof isoString !== 'string') return null
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return null
  const parts = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).split('-')
  if (parts.length !== 3) return null
  return `${parts[0]}-${parts[1]}-${parts[2]}`
}

/**
 * Returns ISO UTC string for a given date and time in Israel (Asia/Jerusalem).
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} timeHHMM - HH:MM or H:MM (Israel local)
 * @returns {string} ISO UTC string
 */
export function localTimeIsraelToUtcIso(dateStr, timeHHMM) {
  const dateMatch = (dateStr || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const timeMatch = (timeHHMM || '').match(/^(\d{1,2}):(\d{2})$/)
  if (!dateMatch || !timeMatch) return ''
  const [, y, mo, d] = dateMatch.map(Number)
  const [, h, min] = timeMatch.map(Number)
  if (h < 0 || h > 23 || min < 0 || min > 59) return ''
  const noonUtc = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0))
  const israelHour = parseInt(noonUtc.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hour12: false }), 10)
  const offsetHours = israelHour - 12
  const utcMoment = new Date(Date.UTC(y, mo - 1, d, h, min, 0) - offsetHours * 3600 * 1000)
  return utcMoment.toISOString()
}

/**
 * Get Israel local date YYYY-MM-DD for a given Unix timestamp (seconds).
 * @param {number} unixSeconds
 * @returns {string|null}
 */
export function israelDateFromUnix(unixSeconds) {
  if (unixSeconds == null || typeof unixSeconds !== 'number' || !Number.isFinite(unixSeconds)) return null
  const d = new Date(unixSeconds * 1000)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
}
