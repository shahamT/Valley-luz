/**
 * Event categories constants
 * Used in backend API and processing
 */
export const EVENT_CATEGORIES = {
  party: {
    label: 'מסיבה / ריקודים',
    color: '#FF6B6B',
  },
  show: {
    label: 'הופעה',
    color: '#845EC2',
  },
  lecture: {
    label: 'הרצאה',
    color: '#4D96FF',
  },
  nature: {
    label: 'טיול / סיור בטבע',
    color: '#2ECC71',
  },
  volunteering: {
    label: 'התנדבות',
    color: '#1ABC9C',
  },
  religion: {
    label: 'דת',
    color: '#8E8D8A',
  },
  food: {
    label: 'אוכל',
    color: '#F39C12',
  },
  sport: {
    label: 'ספורט',
    color: '#E74C3C',
  },
  fair: {
    label: 'יריד',
    color: '#F7B801',
  },
  second_hand: {
    label: 'יד שנייה',
    color: '#6C757D',
  },
  art: {
    label: 'אמנות ויצירה',
    color: '#C77DFF',
  },
  music: {
    label: 'מוזיקה',
    color: '#FF4D9D',
  },
  community_meetup: {
    label: 'מפגש קהילתי',
    color: '#00B4D8',
  },
  jam: {
    label: "ג'אם",
    color: '#FF922B',
  },
  course: {
    label: 'חוג',
    color: '#3A86FF',
  },
  festival: {
    label: 'פסטיבל',
    color: '#FF006E',
  },
  workshop: {
    label: 'סדנה',
    color: '#FB5607',
  },
  health: {
    label: 'בריאות',
    color: '#2EC4B6',
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
