import { NOT_STATED_JUSTIFICATION } from '../consts/events.const.js'
import { israelMidnightToUtcIso, getDateInIsraelFromIso, localTimeIsraelToUtcIso } from '../utils/israelTime.js'

function isNotStatedJustification(str) {
  return typeof str === 'string' && str.trim().toLowerCase() === NOT_STATED_JUSTIFICATION.toLowerCase()
}

export function validateEventStructure(event) {
  if (!event || typeof event !== 'object') return { valid: false, reason: 'Event is not an object' }
  if (typeof event.Title !== 'string' || !event.Title.trim()) return { valid: false, reason: 'Missing or empty Title' }
  if (!Array.isArray(event.categories) || event.categories.length === 0) return { valid: false, reason: 'Missing or empty categories' }
  if (typeof event.mainCategory !== 'string' || !event.mainCategory.trim()) return { valid: false, reason: 'Missing mainCategory' }
  if (!event.categories.includes(event.mainCategory)) return { valid: false, reason: 'mainCategory not in categories' }
  if (!event.location || typeof event.location !== 'object') return { valid: false, reason: 'Missing location' }
  if (!Array.isArray(event.occurrences) || event.occurrences.length === 0) return { valid: false, reason: 'Missing or empty occurrences' }
  for (let i = 0; i < event.occurrences.length; i++) {
    const occ = event.occurrences[i]
    if (!occ || typeof occ !== 'object') return { valid: false, reason: `occurrences[${i}] is not an object` }
    if (typeof occ.date !== 'string' || !occ.date.trim()) return { valid: false, reason: `occurrences[${i}].date missing or empty` }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(occ.date.trim().slice(0, 10))) return { valid: false, reason: `occurrences[${i}].date must be YYYY-MM-DD` }
    if (typeof occ.hasTime !== 'boolean') return { valid: false, reason: `occurrences[${i}].hasTime missing or not boolean` }
    if (typeof occ.startTime !== 'string' || !occ.startTime.trim()) return { valid: false, reason: `occurrences[${i}].startTime missing or empty` }
  }
  const justKeys = ['date', 'location', 'startTime', 'endTime', 'price']
  if (!event.justifications || typeof event.justifications !== 'object') return { valid: false, reason: 'Missing justifications' }
  for (const k of justKeys) {
    if (typeof event.justifications[k] !== 'string') return { valid: false, reason: `Missing or invalid justifications.${k}` }
  }
  return { valid: true }
}

export function validateSearchKeys(searchKeys) {
  return Array.isArray(searchKeys) && searchKeys.length > 0 && searchKeys.every(k => typeof k === 'string' && k.trim().length > 0)
}

/**
 * Validates an extracted event programmatically.
 * Checks dates, required fields, location word-match, and category validity.
 * When combinedTextForVerbatim is provided (e.g. messageText + "\n[OCR]\n" + ocrText), verbatim checks use it so evidence from both message and OCR is accepted.
 * Returns the event with corrections applied, or null if unfixable.
 * Exported for use by test scripts.
 * @param {Object} event
 * @param {string} rawMessageText
 * @param {Array<{id: string}>} categoriesList
 * @param {string} [combinedTextForVerbatim] - Optional: message + OCR text for verbatim evidence checks
 */
export function validateEventProgrammatic(event, rawMessageText, categoriesList, combinedTextForVerbatim = '') {
  const corrections = []
  const validCatIds = categoriesList.map(c => c.id)
  const textForVerbatim = (typeof combinedTextForVerbatim === 'string' && combinedTextForVerbatim.trim())
    ? combinedTextForVerbatim
    : rawMessageText

  if (!Array.isArray(event.occurrences) || event.occurrences.length === 0) {
    return { event: null, corrections: ['Missing or empty occurrences'] }
  }

  const FALLBACK_CATEGORY_ID = 'community_meetup'
  event.categories = (event.categories || []).filter(c => validCatIds.includes(c))
  if (event.categories.length === 0) {
    event.categories = [FALLBACK_CATEGORY_ID]
    event.mainCategory = FALLBACK_CATEGORY_ID
    corrections.push('No valid categories from extraction; assigned community_meetup as fallback')
  } else if (!event.categories.includes(event.mainCategory)) {
    event.mainCategory = event.categories[0]
    corrections.push(`mainCategory corrected to ${event.mainCategory}`)
  }

  const firstOcc = event.occurrences[0]
  if (firstOcc?.date && typeof firstOcc.date === 'string' && firstOcc.date.trim()) {
    if (isNotStatedJustification(event.justifications?.date)) {
      return { event: null, corrections: ['No justification for calendar date - event rejected'] }
    }
  }
  for (const occ of event.occurrences) {
    if (occ.hasTime === true && occ.startTime) {
      const isMidnightIsrael = (() => {
        const d = new Date(occ.startTime)
        const hrs = parseInt(d.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hour12: false }), 10)
        const min = parseInt(d.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', minute: '2-digit' }), 10)
        return hrs === 0 && min === 0
      })()
      if (!isMidnightIsrael && isNotStatedJustification(event.justifications?.startTime)) {
        occ.hasTime = false
        occ.startTime = israelMidnightToUtcIso(occ.date || occ.startTime)
        occ.endTime = null
        corrections.push('Time of day had no justification - cleared to all-day')
      }
    }
    if (occ.endTime != null && isNotStatedJustification(event.justifications?.endTime)) {
      occ.endTime = null
      corrections.push('endTime had value but no justification - cleared to null')
    }
  }
  if (event.location) {
    const hasLocationData = (event.location.City && String(event.location.City).trim()) ||
      (event.location.addressLine1 && String(event.location.addressLine1).trim()) ||
      (event.location.addressLine2 && String(event.location.addressLine2).trim()) ||
      (event.location.locationDetails && String(event.location.locationDetails).trim())
    if (hasLocationData && isNotStatedJustification(event.justifications?.location)) {
      event.location.City = ''
      event.location.CityEvidence = null
      event.location.addressLine1 = null
      event.location.addressLine2 = null
      event.location.locationDetails = null
      corrections.push('Location had data but no justification - cleared to empty state')
    }
  }
  if (typeof event.price === 'number' && isNotStatedJustification(event.justifications?.price)) {
    event.price = null
    corrections.push('Price had value but no justification - cleared to null')
  }

  if (event.location) {
    const evidence = event.location.CityEvidence != null && String(event.location.CityEvidence).trim()
    if (evidence) {
      const evidenceInText = textForVerbatim.includes(event.location.CityEvidence.trim())
      if (!evidenceInText) {
        corrections.push(`CityEvidence "${event.location.CityEvidence}" not found in message/OCR text - cleared City and CityEvidence`)
        event.location.City = ''
        event.location.CityEvidence = null
      }
    } else if (event.location.City && event.location.City.trim()) {
      corrections.push('City had no CityEvidence - cleared City')
      event.location.City = ''
    }

    const verbatimLocationFields = ['addressLine1', 'addressLine2', 'locationDetails']
    for (const field of verbatimLocationFields) {
      const val = event.location[field]
      if (val != null && typeof val === 'string' && val.trim()) {
        if (!textForVerbatim.includes(val.trim())) {
          corrections.push(`location.${field} not found verbatim in message/OCR - cleared`)
          event.location[field] = null
        }
      }
    }
  }

  for (const occ of event.occurrences) {
    if (occ.startTime) {
      const start = new Date(occ.startTime)
      if (isNaN(start.getTime())) {
        return { event: null, corrections: ['startTime is not a valid date'] }
      }
      const now = new Date()
      const twoYearsFromNow = new Date(now)
      twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2)
      if (start > twoYearsFromNow) {
        corrections.push(`startTime ${occ.startTime} is more than 2 years in the future - suspicious`)
      }
    }
    if (occ.endTime) {
      const end = new Date(occ.endTime)
      if (isNaN(end.getTime())) {
        occ.endTime = null
        corrections.push('endTime was invalid - cleared')
      }
    }
  }

  for (const occ of event.occurrences) {
    if (occ.date && occ.startTime) {
      const expectedDate = (occ.date || '').trim().slice(0, 10)
      const startTimeDateIsrael = getDateInIsraelFromIso(occ.startTime)
      if (expectedDate && startTimeDateIsrael && expectedDate !== startTimeDateIsrael) {
        if (occ.hasTime === false) {
          occ.startTime = israelMidnightToUtcIso(occ.date)
          corrections.push('All-day: startTime normalized to occurrence.date at Israel midnight UTC')
        } else {
          const d = new Date(occ.startTime)
          const h = parseInt(d.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hour12: false }), 10)
          const m = parseInt(d.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem', minute: '2-digit' }), 10)
          const timeStr = `${h}:${String(m).padStart(2, '0')}`
          const rebuilt = localTimeIsraelToUtcIso(occ.date, timeStr)
          if (rebuilt) {
            occ.startTime = rebuilt
            corrections.push('startTime date normalized to match occurrence.date')
          }
        }
      }
    }
  }

  for (const occ of event.occurrences) {
    if (occ.hasTime === false && occ.date) {
      const normalized = israelMidnightToUtcIso(occ.date)
      if (normalized !== occ.startTime) {
        corrections.push('All-day event: startTime set to occurrence.date at Israel midnight UTC')
      }
      occ.startTime = normalized
      occ.endTime = null
    } else if (occ.hasTime === false && occ.startTime) {
      const normalized = israelMidnightToUtcIso(occ.startTime)
      if (normalized !== occ.startTime) {
        corrections.push('All-day event: startTime normalized to Israel midnight UTC')
      }
      occ.startTime = normalized
      occ.endTime = null
    }
  }

  event.media = []
  if (!Array.isArray(event.urls)) event.urls = []

  const optionalLocationFields = ['CityEvidence', 'addressLine1', 'addressLine2', 'locationDetails', 'wazeNavLink', 'gmapsNavLink']
  for (const field of optionalLocationFields) {
    if (event.location?.[field] !== null && event.location?.[field] !== undefined && typeof event.location[field] === 'string' && !event.location[field].trim()) {
      event.location[field] = null
    }
  }

  if (event.Title && /₪|שקל|ש"ח|חינם|free|NIS/i.test(event.Title)) {
    corrections.push('Title contained price info (not removed, flagged)')
  }

  return { event, corrections }
}
