/**
 * Unit tests for dateTimeParser (Israel timezone, DST-safe).
 * Run from apps/wa-listener: node test/parsers/dateTimeParser.test.js
 */
import {
  parseDateFromQuote,
  parseRelativeDateFromQuote,
  parseTimeFromQuote,
  parseDateEvidence,
  parseTimeEvidence,
  buildOccurrences,
} from '../../src/parsers/dateTimeParser.js'

const refUnix = 1738000000

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

  const explicitDate = parseDateFromQuote('25/02', refUnix)
  ok('explicit 25/02 returns date', explicitDate && /^\d{4}-02-25$/.test(explicitDate.date))
  const ddmmyy = parseDateFromQuote('17.2', refUnix)
  ok('explicit 17.2 returns date', ddmmyy && /^\d{4}-02-17$/.test(ddmmyy.date))

  const tomorrow = parseRelativeDateFromQuote('מחר', refUnix)
  ok('relative מחר returns date', tomorrow && typeof tomorrow.date === 'string' && tomorrow.date.length === 10)
  const today = parseRelativeDateFromQuote('היום', refUnix)
  ok('relative היום returns date', today && typeof today.date === 'string')

  const time1 = parseTimeFromQuote('20:00')
  ok('time 20:00', time1 && time1.hour === 20 && time1.minute === 0)
  const time2 = parseTimeFromQuote('8 בערב')
  ok('time 8 בערב -> 20:00', time2 && time2.hour === 20 && time2.minute === 0)
  const timeRange = parseTimeFromQuote('17:30-19:00')
  ok('time range', timeRange && timeRange.endHour === 19 && timeRange.endMinute === 0)

  const dateEvidence = parseDateEvidence([{ quote: '25/02', source: 'message_text' }], refUnix)
  ok('parseDateEvidence finds date', dateEvidence.date != null)
  const timeEvidence = parseTimeEvidence([{ quote: '20:00', source: 'message_text' }], dateEvidence.date, refUnix)
  ok('parseTimeEvidence has startTime', timeEvidence.startTime && timeEvidence.hasTime === true)

  const occs = buildOccurrences(
    [{ quote: '25/02', source: 'message_text' }],
    [{ quote: '20:00', source: 'message_text' }],
    refUnix
  )
  ok('buildOccurrences returns one occurrence', occs.length === 1)
  ok('occurrence has date and startTime', occs[0].date && occs[0].startTime)

  const noDate = buildOccurrences([], [], refUnix)
  ok('no date candidates -> empty occurrences', noDate.length === 0)

  console.log(`\nResult: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

run()
