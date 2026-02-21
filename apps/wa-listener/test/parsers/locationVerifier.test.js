/**
 * Unit tests for locationVerifier.
 * Run from apps/wa-listener: node test/parsers/locationVerifier.test.js
 */
import { extractMapLinks, verifyLocation } from '../../src/parsers/locationVerifier.js'

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

  const links = extractMapLinks(['https://ul.waze.com/ul?place=abc', 'https://google.com/maps?q=xyz'])
  ok('Waze link extracted', links.wazeNavLink === 'https://ul.waze.com/ul?place=abc')
  ok('GMaps link extracted', links.gmapsNavLink === 'https://google.com/maps?q=xyz')

  const loc1 = verifyLocation([{ quote: 'חיפה', source: 'message_text' }], [])
  ok('location from quote', loc1.City === 'חיפה' && loc1.CityEvidence === 'חיפה')

  const loc2 = verifyLocation([], ['https://ul.waze.com/ul?place=abc'])
  ok('location with Waze link has link', loc2.wazeNavLink != null)

  const loc3 = verifyLocation([], [])
  ok('no candidates -> empty City', loc3.City === '' && loc3.verified === false)

  console.log(`\nResult: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

run()
