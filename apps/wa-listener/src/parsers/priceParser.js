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

    const freeMatch = q.match(/(^|\s)(חינם|free|בחינם)(\s|$)/i) || (q.trim() === 'חינם' || q.trim().toLowerCase() === 'free')
    if (freeMatch) {
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
  return {
    price: null,
    verified: false,
    evidenceQuote: null,
    evidenceSource: null,
  }
}
