/**
 * Unit tests for dateTimeParser (Israel timezone, DST-safe).
 * Run from apps/wa-listener: node test/parsers/dateTimeParser.test.js
 */
import {
  parseDateFromQuote,
  parseRelativeDateFromQuote,
  parseTimeFromQuote,
  parseDateEvidence,
  parseDateRangeFromQuote,
  parseDateOrRangeEvidence,
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

  const range1 = parseDateRangeFromQuote('18-23.2', refUnix)
  ok('parseDateRangeFromQuote 18-23.2 returns 6 dates', range1 && range1.dates.length === 6 && range1.dates[0] === '2025-02-18' && range1.dates[5] === '2025-02-23')
  const range2 = parseDateRangeFromQuote('18.2 - 1.3', refUnix)
  ok('parseDateRangeFromQuote 18.2-1.3 cross-month', range2 && range2.dates.length === 12 && range2.dates[0] === '2025-02-18' && range2.dates[11] === '2025-03-01')
  const range3 = parseDateRangeFromQuote('18 עד ה21 בפברואר', refUnix)
  ok('parseDateRangeFromQuote Hebrew 18 עד ה21 בפברואר returns 4 dates', range3 && range3.dates.length === 4 && range3.dates[0] === '2025-02-18' && range3.dates[3] === '2025-02-21')
  ok('parseDateRangeFromQuote non-range returns null', parseDateRangeFromQuote('25/02', refUnix) === null)

  const rangeEvidence = parseDateOrRangeEvidence([{ quote: '18-23.2', source: 'message_text' }], refUnix)
  ok('parseDateOrRangeEvidence range returns dates array', rangeEvidence.dates.length === 6)
  const singleEvidence = parseDateOrRangeEvidence([{ quote: '25/02', source: 'message_text' }], refUnix)
  ok('parseDateOrRangeEvidence single date returns one date', singleEvidence.dates.length === 1)

  const multiOccs = buildOccurrences(
    [{ quote: '18-23.2', source: 'message_text' }],
    [{ quote: '20:00', source: 'message_text' }],
    refUnix
  )
  ok('buildOccurrences with range returns multiple occurrences', multiOccs.length === 6)
  ok('multi-occurrence same time on each', multiOccs.every((o) => o.hasTime && o.startTime && o.date && o.date.startsWith('2025-02')))

  console.log(`\nResult: ${passed} passed, ${failed} failed`)
  process.exit(failed > 0 ? 1 : 0)
}

run()
