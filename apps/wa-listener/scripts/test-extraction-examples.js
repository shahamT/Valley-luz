/**
 * Runs classification + extraction + programmatic validation on example messages.
 * Usage: from apps/wa-listener, run: node scripts/test-extraction-examples.js
 * Requires OPENAI_API_KEY in .env or environment.
 */
import dotenv from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const { callOpenAIForClassification, callOpenAIForExtraction, validateEventProgrammatic } = await import('../src/services/event.service.js')
const { getCategoriesList } = await import('../src/consts/events.const.js')

const EXAMPLES = [
  {
    name: 'All-day (date only, no time)',
    text: 'פיקניק קהילתי ביום שישי 7.3 בגן סאקר, ת"א. מביאים שמיכה וכיף.',
  },
  {
    name: 'With time + city + venue',
    text: 'ערב מוזיקה אתיופית - 25/02 בשעה 20:00\nמתחם שוק תלפיות, חיפה\nכניסה: 30 ₪\nhttps://ul.waze.com/ul?place=abc',
  },
  {
    name: 'Navigation instructions (locationDetails)',
    text: 'סדנת קרמיקה 15.4 ברחובות. ימינה בכיכר הגדולה, מול הבית הצהוב. כניסה חינם.',
  },
  {
    name: 'Vibe description (should NOT go to locationDetails)',
    text: 'מסיבת ריקודים 20.5 במתחם האמנים בחיפה. מקום יפהפה ומואר. 50 ₪.',
  },
  {
    name: 'City abbreviation (ת"א → normalized)',
    text: 'הרצאה על קיימות - יום שלישי 10.3 בשעה 19:00 בת"א, מגדל שלום.',
  },
]

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Set OPENAI_API_KEY in apps/wa-listener/.env or environment')
    process.exit(1)
  }
  const categoriesList = getCategoriesList()
  console.log('Running extraction examples (classification → extraction → validation)\n')

  for (const ex of EXAMPLES) {
    console.log('---', ex.name, '---')
    console.log('Message:', ex.text.slice(0, 80) + (ex.text.length > 80 ? '...' : ''), '\n')

    const classification = await callOpenAIForClassification(ex.text, null)
    if (!classification) {
      console.log('Classification: API error\n')
      continue
    }
    console.log('Classification:', classification.isEvent ? 'isEvent' : 'not event', classification.reason ?? '', '\n')

    if (!classification.isEvent) {
      console.log('Skipping extraction.\n')
      continue
    }

    const extracted = await callOpenAIForExtraction(ex.text, null, categoriesList)
    if (!extracted) {
      console.log('Extraction: API error\n')
      continue
    }
    console.log('Extracted Title:', extracted.Title)
    console.log('Extracted location.City:', extracted.location?.City)
    console.log('Extracted location.CityEvidence:', extracted.location?.CityEvidence)
    console.log('Extracted occurrence.date:', extracted.occurrence?.date)
    console.log('Extracted occurrence.hasTime:', extracted.occurrence?.hasTime)
    console.log('Extracted occurrence.startTime:', extracted.occurrence?.startTime)
    console.log('Extracted justifications.date:', extracted.justifications?.date)
    console.log('Extracted location.locationDetails:', extracted.location?.locationDetails ?? '(null)')

    const { event: validated, corrections } = validateEventProgrammatic(
      JSON.parse(JSON.stringify(extracted)),
      ex.text,
      categoriesList
    )
    if (!validated) {
      console.log('Validation: FAILED', corrections)
    } else {
      if (corrections.length) console.log('Corrections:', corrections)
      console.log('Validated location.City:', validated.location?.City)
      console.log('Validated occurrence.date:', validated.occurrence?.date)
      console.log('Validated occurrence.startTime:', validated.occurrence?.startTime)
    }
    console.log('')
  }
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
