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
