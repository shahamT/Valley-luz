import { israelMidnightToUtcIso, localTimeIsraelToUtcIso, israelDateFromUnix } from '../utils/israelTime.js'

const TIMEZONE = 'Asia/Jerusalem'
const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
const ENGLISH_MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

/**
 * Parse explicit date from quote: DD/MM, DD.MM, DD-MM, D.M, Hebrew/English month.
 * @param {string} quote - Raw quote
 * @param {number|null} refUnixSeconds - Message timestamp (Unix seconds) for current year
 * @returns {{ date: string } | null} YYYY-MM-DD or null
 */
/** Extract and parse DD.MM, DD/MM, DD-MM from anywhere in string (e.g. "רביעי 18.2" or "יום ד' 18.2"). */
function parseDdMmFromString(s, year) {
  const ddmmyy = s.match(/(\d{1,2})[./\-](\d{1,2})(?:[./\-](\d{2,4}))?/)
  if (!ddmmyy) return null
  const [, d, m, yPart] = ddmmyy
  let y = year
  if (yPart) {
    const yn = parseInt(yPart, 10)
    y = yn < 100 ? 2000 + yn : yn
  }
  const day = parseInt(d, 10)
  const month = parseInt(m, 10)
  if (day < 1 || day > 31 || month < 1 || month > 12) return null
  const dateStr = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const dTest = new Date(dateStr)
  if (isNaN(dTest.getTime())) return null
  return dateStr
}

export function parseDateFromQuote(quote, refUnixSeconds) {
  if (!quote || typeof quote !== 'string') return null
  const s = quote.trim()
  const ref = refUnixSeconds != null && Number.isFinite(refUnixSeconds) ? new Date(refUnixSeconds * 1000) : new Date()
  const year = ref.getFullYear()

  const ddMmDate = parseDdMmFromString(s, year)
  if (ddMmDate) return { date: ddMmDate }

  const monthNameMatch = s.match(new RegExp(`(\\d{1,2})\\s*(?:ב)?(${HEBREW_MONTHS.join('|')})`, 'i'))
  if (monthNameMatch) {
    const [, dayStr, monthHeb] = monthNameMatch
    const monthIndex = HEBREW_MONTHS.findIndex((m) => m === monthHeb || monthHeb.toLowerCase().includes(m))
    if (monthIndex === -1) return null
    const day = parseInt(dayStr, 10)
    if (day < 1 || day > 31) return null
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return { date: dateStr }
  }

  const enMonthMatch = s.match(new RegExp(`(\\d{1,2})\\s+(?:of\\s+)?(${ENGLISH_MONTHS.join('|')})`, 'i'))
  if (enMonthMatch) {
    const [, dayStr, monthEn] = enMonthMatch
    const monthIndex = ENGLISH_MONTHS.findIndex((m) => monthEn.toLowerCase().startsWith(m))
    if (monthIndex === -1) return null
    const day = parseInt(dayStr, 10)
    if (day < 1 || day > 31) return null
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return { date: dateStr }
  }

  return null
}

/**
 * Parse relative date: today, tomorrow, next <weekday> (Hebrew/English).
 * @param {string} quote
 * @param {number|null} refUnixSeconds - Message timestamp
 * @returns {{ date: string } | null}
 */
export function parseRelativeDateFromQuote(quote, refUnixSeconds) {
  if (!quote || typeof quote !== 'string' || refUnixSeconds == null || !Number.isFinite(refUnixSeconds)) return null
  const s = quote.trim().toLowerCase()
  const refDate = israelDateFromUnix(refUnixSeconds)
  if (!refDate) return null
  const [y, m, d] = refDate.split('-').map(Number)
  const refDay = new Date(y, m - 1, d)
  const refWeekday = refDay.getDay()

  if (/(^|\s)(היום|today)(\s|$)/i.test(s) || s.trim() === 'היום' || s.trim() === 'today') {
    return { date: refDate }
  }
  if (/(^|\s)(מחר|tomorrow)(\s|$)/i.test(s) || s.trim() === 'מחר' || s.trim() === 'tomorrow') {
    const next = new Date(refDay)
    next.setDate(next.getDate() + 1)
    const nd = next.toISOString().slice(0, 10)
    return { date: nd }
  }
  const nextWeekdayMatch = s.match(/(?:בשבוע הבא|next)\s+(?:יום\s+)?(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת|sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i)
  if (nextWeekdayMatch) {
    const dayName = nextWeekdayMatch[1]
    let targetDow = HEBREW_DAYS.findIndex((hd) => dayName.includes(hd))
    if (targetDow === -1) {
      const en = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      targetDow = en.findIndex((ed) => dayName.toLowerCase().startsWith(ed))
    }
    if (targetDow === -1) return null
    let daysAhead = (targetDow + 7 - refWeekday) % 7
    if (daysAhead === 0) daysAhead = 7
    const next = new Date(refDay)
    next.setDate(next.getDate() + daysAhead)
    const nd = next.toISOString().slice(0, 10)
    return { date: nd }
  }

  return null
}

/** Extract HH:MM or HH:MM-HH:MM from anywhere in string (e.g. "בשעה 19:00" or "19:00-20:00"). */
function parseHhMmFromString(s) {
  const hhmm = s.match(/(\d{1,2}):(\d{2})(?:\s*-\s*(\d{1,2}):(\d{2}))?/)
  if (!hhmm) return null
  const [, h, min, eh, em] = hhmm
  const hour = parseInt(h, 10)
  const minute = parseInt(min, 10)
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  const out = { hour, minute }
  if (eh != null && em != null) {
    const endHour = parseInt(eh, 10)
    const endMinute = parseInt(em, 10)
    if (endHour >= 0 && endHour <= 23 && endMinute >= 0 && endMinute <= 59) {
      out.endHour = endHour
      out.endMinute = endMinute
    }
  }
  return out
}

/**
 * Parse time of day: HH:MM, H:MM, "8 בערב" (20:00), range 17:30-19:00. Accepts time anywhere in quote.
 * @param {string} quote
 * @returns {{ hour: number, minute: number, endHour?: number, endMinute?: number } | null}
 */
export function parseTimeFromQuote(quote) {
  if (!quote || typeof quote !== 'string') return null
  const s = quote.trim()

  const timeResult = parseHhMmFromString(s)
  if (timeResult) return timeResult

  const hebrewEvening = s.match(/(\d{1,2})\s*(?:בערב| evening)/i)
  if (hebrewEvening) {
    const h = parseInt(hebrewEvening[1], 10)
    if (h >= 1 && h <= 12) return { hour: h + 12, minute: 0 }
  }
  const hebrewMorning = s.match(/(\d{1,2})\s*(?:בבוקר| morning)/i)
  if (hebrewMorning) {
    const h = parseInt(hebrewMorning[1], 10)
    if (h >= 1 && h <= 12) return { hour: h === 12 ? 0 : h, minute: 0 }
  }

  return null
}

/**
 * Parse date evidence candidates and pick first valid date (explicit then relative).
 * @param {Array<{ quote: string, source: string }>} candidates
 * @param {number|null} messageTimestamp - Unix seconds
 * @returns {{ date: string | null, evidenceQuote: string | null, evidenceSource: string | null }}
 */
export function parseDateEvidence(candidates, messageTimestamp) {
  const list = Array.isArray(candidates) ? candidates : []
  for (const c of list) {
    const q = c?.quote?.trim()
    if (!q) continue
    const explicit = parseDateFromQuote(q, messageTimestamp)
    if (explicit) return { date: explicit.date, evidenceQuote: q, evidenceSource: c.source || 'message_text' }
    const relative = parseRelativeDateFromQuote(q, messageTimestamp)
    if (relative) return { date: relative.date, evidenceQuote: q, evidenceSource: c.source || 'message_text' }
  }
  return { date: null, evidenceQuote: null, evidenceSource: null }
}

/**
 * Parse time evidence and return hasTime, startTime (ISO UTC), endTime (ISO UTC | null).
 * @param {Array<{ quote: string, source: string }>} candidates
 * @param {string} dateStr - YYYY-MM-DD
 * @param {number|null} messageTimestamp
 * @returns {{ hasTime: boolean, startTime: string, endTime: string | null, evidenceQuote: string | null, evidenceSource: string | null }}
 */
export function parseTimeEvidence(candidates, dateStr, messageTimestamp) {
  const list = Array.isArray(candidates) ? candidates : []
  for (const c of list) {
    const q = c?.quote?.trim()
    if (!q) continue
    const parsed = parseTimeFromQuote(q)
    if (!parsed) continue
    const timeStr = `${parsed.hour}:${String(parsed.minute).padStart(2, '0')}`
    const startTime = localTimeIsraelToUtcIso(dateStr, timeStr)
    if (!startTime) continue
    let endTime = null
    if (parsed.endHour != null && parsed.endMinute != null) {
      const endStr = `${parsed.endHour}:${String(parsed.endMinute).padStart(2, '0')}`
      endTime = localTimeIsraelToUtcIso(dateStr, endStr) || null
    }
    return {
      hasTime: true,
      startTime,
      endTime,
      evidenceQuote: q,
      evidenceSource: c.source || 'message_text',
    }
  }
  const startTime = israelMidnightToUtcIso(dateStr)
  return {
    hasTime: false,
    startTime,
    endTime: null,
    evidenceQuote: null,
    evidenceSource: null,
  }
}

/**
 * Build occurrences array from date and time evidence. Single occurrence when one date; multi-day not expanded here.
 * @param {Array<{ quote: string, source: string }>} dateCandidates
 * @param {Array<{ quote: string, source: string }>} timeCandidates
 * @param {number|null} messageTimestamp
 * @returns {Array<{ date: string, hasTime: boolean, startTime: string, endTime: string | null, verified: boolean, evidenceQuote?: string, evidenceSource?: string }>}
 */
export function buildOccurrences(dateCandidates, timeCandidates, messageTimestamp) {
  const { date, evidenceQuote: dateQuote, evidenceSource: dateSource } = parseDateEvidence(dateCandidates, messageTimestamp)
  if (!date) {
    return []
  }
  const timeResult = parseTimeEvidence(timeCandidates, date, messageTimestamp)
  const verified = !!(dateQuote && (timeResult.hasTime ? timeResult.evidenceQuote : true))
  const occ = {
    date,
    hasTime: timeResult.hasTime,
    startTime: timeResult.startTime,
    endTime: timeResult.endTime,
    verified,
  }
  if (dateQuote) {
    occ.evidenceQuote = [dateQuote, timeResult.evidenceQuote].filter(Boolean).join('; ') || dateQuote
    occ.evidenceSource = dateSource || timeResult.evidenceSource
  }
  return [occ]
}
