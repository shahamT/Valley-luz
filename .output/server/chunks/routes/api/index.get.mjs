import { c as defineEventHandler, e as createError } from '../../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const EVENT_CATEGORIES = {
  party: {
    label: "\u05DE\u05E1\u05D9\u05D1\u05D4 / \u05E8\u05D9\u05E7\u05D5\u05D3",
    color: "#EF4444"
  },
  show: {
    label: "\u05D4\u05D5\u05E4\u05E2\u05D4",
    color: "#8B5CF6"
  },
  lecture: {
    label: "\u05D4\u05E8\u05E6\u05D0\u05D4",
    color: "#3B82F6"
  },
  nature: {
    label: "\u05D8\u05D9\u05D5\u05DC / \u05E1\u05D9\u05D5\u05E8 \u05D1\u05D8\u05D1\u05E2",
    color: "#10B981"
  },
  volunteering: {
    label: "\u05D4\u05EA\u05E0\u05D3\u05D1\u05D5\u05EA",
    color: "#06B6D4"
  },
  religion: {
    label: "\u05D3\u05EA",
    color: "#6B7280"
  },
  food: {
    label: "\u05D0\u05D5\u05DB\u05DC",
    color: "#F59E0B"
  },
  sport: {
    label: "\u05E1\u05E4\u05D5\u05E8\u05D8 \u05D5\u05EA\u05E0\u05D5\u05E2\u05D4",
    color: "#DC2626"
  },
  fair: {
    label: "\u05D9\u05E8\u05D9\u05D3",
    color: "#F97316"
  },
  second_hand: {
    label: "\u05D9\u05D3 \u05E9\u05E0\u05D9\u05D9\u05D4",
    color: "#78716C"
  },
  art: {
    label: "\u05D0\u05DE\u05E0\u05D5\u05EA \u05D5\u05D9\u05E6\u05D9\u05E8\u05D4",
    color: "#A855F7"
  },
  music: {
    label: "\u05DE\u05D5\u05D6\u05D9\u05E7\u05D4",
    color: "#EC4899"
  },
  community_meetup: {
    label: "\u05DE\u05E4\u05D2\u05E9 \u05E7\u05D4\u05D9\u05DC\u05EA\u05D9",
    color: "#0EA5E9"
  },
  jam: {
    label: "\u05D2'\u05D0\u05DD",
    color: "#F43F5E"
  },
  course: {
    label: "\u05D7\u05D5\u05D2",
    color: "#6366F1"
  },
  festival: {
    label: "\u05E4\u05E1\u05D8\u05D9\u05D1\u05DC",
    color: "#EAB308"
  },
  workshop: {
    label: "\u05E1\u05D3\u05E0\u05D4",
    color: "#14B8A6"
  },
  health: {
    label: "\u05D1\u05E8\u05D9\u05D0\u05D5\u05EA",
    color: "#22C55E"
  },
  kids: {
    label: "\u05D9\u05DC\u05D3\u05D9\u05DD",
    color: "#FBBF24"
  },
  politics: {
    label: "\u05E4\u05D5\u05DC\u05D9\u05D8\u05D9\u05E7\u05D4",
    color: "#4338CA"
  },
  open_day: {
    label: "\u05D9\u05D5\u05DD \u05E4\u05EA\u05D5\u05D7",
    color: "#84CC16"
  },
  studies: {
    label: "\u05DC\u05D9\u05DE\u05D5\u05D3\u05D9\u05DD",
    color: "#2563EB"
  },
  technology: {
    label: "\u05D8\u05DB\u05E0\u05D5\u05DC\u05D5\u05D2\u05D9\u05D4",
    color: "#0EA5E9"
  }
};

const index_get = defineEventHandler(async (event) => {
  try {
    return EVENT_CATEGORIES;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch categories: ${errorMessage}`
    });
  }
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
