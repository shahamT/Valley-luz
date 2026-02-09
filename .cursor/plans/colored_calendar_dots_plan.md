# Colored Calendar Dots Plan

## Overview
Make the dots in the calendar show in the color of the main category of each event.

## Current State
- Calendar shows dots in fixed color `var(--brand-dark-blue)`
- Events have `mainCategory` field (category ID string)
- Categories are defined in `consts/events.const.js` with colors
- Calendar only passes `eventsCount` to DayCell component
- `getEventCountsByDate` only returns counts, not event data

## Implementation Steps

### Step 1: Modify `utils/events.service.js`
- Change `getEventCountsByDate` to return event data with mainCategory, not just counts
- Return a map of date strings to arrays of event objects (or at least mainCategory info)
- Keep backward compatibility or update all callers

### Step 2: Modify `utils/calendar.helpers.js`
- Update `generateCalendarDays` to accept event data (with mainCategory) instead of just counts
- Include event category information in the day objects

### Step 3: Modify `components/monthly/MonthCalendar.vue`
- Update to pass event data (with mainCategory) to DayCell
- Access categories store to get category colors

### Step 4: Modify `components/monthly/DayCell.vue`
- Accept event data prop (array of events or category info)
- Display dots with colors based on mainCategory
- Handle multiple events on same day - show dots in different colors or use the first event's color

## Files to Modify

1. `utils/events.service.js` - Change `getEventCountsByDate` to return event data
2. `utils/calendar.helpers.js` - Update `generateCalendarDays` to handle event data
3. `components/monthly/MonthCalendar.vue` - Pass event data and categories to DayCell
4. `components/monthly/DayCell.vue` - Display colored dots based on category

## Expected Outcome
- Calendar dots show in the color of each event's main category
- Multiple events on same day can show different colored dots
- Falls back to default color if category not found
