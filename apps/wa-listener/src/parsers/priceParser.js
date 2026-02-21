/** Phrases that indicate free entry / no charge. Quote is treated as free only if it contains one of these and no positive amount. */
const FREE_INDICATING_PHRASES = [
  'חינם',
  'בחינם',
  'free',
  'כניסה חופשית',
  'ללא תשלום',
  'אין תשלום',
  'ללא עלות',
  'אין עלות',
  'חופשי',
  'גרטיס',
  'gratis',
  'no charge',
  'ללא דמי כניסה',
  'אין דמי כניסה',
]

/** True if quote contains a positive numeric price (number + currency). */
function hasPositivePriceInQuote(q) {
  const withCurrency = q.match(/(\d+(?:\.\d+)?)\s*(?:₪|שקל|ש"ח|nis|נ\"ח)/i)
  if (!withCurrency) return false
  const num = parseFloat(withCurrency[1])
  return Number.isFinite(num) && num > 0
}

/** True if quote indicates free (contains a free phrase and no positive amount). */
function quoteIndicatesFree(q) {
  if (!q || typeof q !== 'string') return false
  const s = q.trim()
  if (!s) return false
  const lower = s.toLowerCase()
  const hasFreePhrase = FREE_INDICATING_PHRASES.some((phrase) => {
    const phraseLower = phrase.toLowerCase()
    return s.includes(phrase) || lower.includes(phraseLower)
  })
  return hasFreePhrase && !hasPositivePriceInQuote(s)
}

/**
 * Parse price from evidence quotes. Reject ambiguous multi-tier.
 * @param {Array<{ quote: string, source: string }>} candidates
 * @returns {{ price: number | null, verified: boolean, evidenceQuote: string | null, evidenceSource: string | null }}
 */
export function parsePriceEvidence(candidates) {
  const list = Array.isArray(candidates) ? candidates : []
  for (const c of list) {
    const q = (c?.quote || '').trim()
    if (!q) continue

    if (quoteIndicatesFree(q)) {
      return {
        price: 0,
        verified: true,
        evidenceQuote: q,
        evidenceSource: c.source || 'message_text',
      }
    }

    const multiTier = q.match(/\d+\s*\/\s*\d+|\d+\s*-\s*\d+\s*₪/)
    if (multiTier) {
      continue
    }

    const withCurrency = q.match(/(\d+(?:\.\d+)?)\s*(?:₪|שקל|ש"ח|nis|נ\"ח)/i)
    if (withCurrency) {
      const num = parseFloat(withCurrency[1])
      if (Number.isFinite(num) && num >= 0) {
        return {
          price: Math.round(num),
          verified: true,
          evidenceQuote: q,
          evidenceSource: c.source || 'message_text',
        }
      }
    }

    const numThenShekel = q.match(/(\d+(?:\.\d+)?)\s*₪?/)
    if (numThenShekel && /₪|שקל|כניסה|מחיר|דמי כניסה/i.test(q)) {
      const num = parseFloat(numThenShekel[1])
      if (Number.isFinite(num) && num >= 0) {
        return {
          price: Math.round(num),
          verified: true,
          evidenceQuote: q,
          evidenceSource: c.source || 'message_text',
        }
      }
    }
  }
  // No evidence matched: trust AI that cost is unavailable.
  return {
    price: null,
    verified: true,
    evidenceQuote: null,
    evidenceSource: null,
  }
}
