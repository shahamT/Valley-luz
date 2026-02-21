/**
 * Unit tests for priceParser.
 * Run from apps/wa-listener: node test/parsers/priceParser.test.js
 */
import assert from 'assert'
import { parsePriceEvidence } from '../../src/parsers/priceParser.js'

function run() {
  let passed = 0
  let failed = 0
  const ok = (name, cond) => {
    if (cond) {
      passed++
      console.log(`  ok: ${name}`)
    } else {
      failed++
      console.log(`  FAIL: ${name}`)
    }
  }

  const p30 = parsePriceEvidence([{ quote: 'כניסה: 30 ₪', source: 'message_text' }])
  ok('30 ₪ -> 30', p30.price === 30 && p30.verified === true)

  const free = parsePriceEvidence([{ quote: 'חינם', source: 'message_text' }])
  ok('חינם -> 0', free.price === 0 && free.verified === true)

  const nis = parsePriceEvidence([{ quote: '50 NIS', source: 'message_text' }])
  ok('50 NIS -> 50', nis.price === 50)

  const ambiguous = parsePriceEvidence([{ quote: '30/50', source: 'message_text' }])
  ok('ambiguous 30/50 -> null or single value', ambiguous.price === null || (ambiguous.price >= 0 && ambiguous.verified))

  const empty = parsePriceEvidence([])
  ok('no candidates -> null', empty.price === null && empty.verified === false)

  console.log(`\nResult: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

run()
