const TIMEZONE = 'Asia/Jerusalem'

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

/**
 * Builds a context block with current date/time/timezone for injection into OpenAI prompts.
 * Computed fresh on each call so timestamps stay accurate.
 * @returns {string} Multi-line context string
 */
export function getDateTimeContext() {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-IL', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map(({ type, value }) => [type, value])
  )

  const localDate = `${parts.year}-${parts.month}-${parts.day}`
  const localTime = `${parts.hour}:${parts.minute}`
  const dayIndex = new Date(
    now.toLocaleString('en-US', { timeZone: TIMEZONE })
  ).getDay()
  const dayNameHeb = HEBREW_DAYS[dayIndex]

  const offsetMs = now.getTime() - new Date(
    now.toLocaleString('en-US', { timeZone: 'UTC' })
  ).getTime()
  const offsetH = Math.round(offsetMs / 3_600_000)
  const utcOffset = `UTC${offsetH >= 0 ? '+' : ''}${offsetH}`

  return [
    `CURRENT_DATE: ${localDate}`,
    `CURRENT_TIME: ${localTime} (Israel local)`,
    `DAY_OF_WEEK: יום ${dayNameHeb}`,
    `TIMEZONE: ${TIMEZONE} (${utcOffset})`,
    `CURRENT_YEAR: ${parts.year}`,
  ].join('\n')
}

/**
 * Returns whether a Cloudinary URL points to an image (not video/audio/document).
 * Does NOT rely on file extensions; checks Cloudinary resource type path segment.
 * @param {string|null} url
 * @returns {boolean}
 */
export function isImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  if (/\/image\/upload\//i.test(url)) return true
  if (/\.(jpe?g|png|webp|gif|bmp|tiff?)(\?|$)/i.test(url)) return true
  return false
}

/**
 * Event categories constants
 * Used in event processing and OpenAI integration
 */
export const EVENT_CATEGORIES = {
  party: {
    label: 'מסיבה / ריקוד',
    color: '#EF4444',
  },
  show: {
    label: 'הופעה',
    color: '#8B5CF6',
  },
  lecture: {
    label: 'הרצאה',
    color: '#3B82F6',
  },
  nature: {
    label: 'טיול / סיור בטבע',
    color: '#10B981',
  },
  volunteering: {
    label: 'התנדבות',
    color: '#06B6D4',
  },
  religion: {
    label: 'דת',
    color: '#6B7280',
  },
  food: {
    label: 'אוכל',
    color: '#F59E0B',
  },
  sport: {
    label: 'ספורט ותנועה',
    color: '#DC2626',
  },
  fair: {
    label: 'יריד',
    color: '#F97316',
  },
  second_hand: {
    label: 'יד שנייה',
    color: '#78716C',
  },
  art: {
    label: 'אמנות ויצירה',
    color: '#A855F7',
  },
  music: {
    label: 'מוזיקה',
    color: '#EC4899',
  },
  community_meetup: {
    label: 'מפגש קהילתי',
    color: '#0EA5E9',
  },
  jam: {
    label: "ג'אם",
    color: '#F43F5E',
  },
  course: {
    label: 'חוג',
    color: '#6366F1',
  },
  festival: {
    label: 'פסטיבל',
    color: '#EAB308',
  },
  workshop: {
    label: 'סדנה',
    color: '#14B8A6',
  },
  health: {
    label: 'בריאות',
    color: '#22C55E',
  },
  kids: {
    label: 'ילדים',
    color: '#FBBF24',
  },
  politics: {
    label: 'פוליטיקה',
    color: '#4338CA',
  },
}

/**
 * Returns an array of category objects with id and label
 * @returns {Array<{id: string, label: string}>} Array of category objects
 */
export function getCategoriesList() {
  return Object.entries(EVENT_CATEGORIES).map(([id, category]) => ({
    id,
    label: category.label,
  }))
}
