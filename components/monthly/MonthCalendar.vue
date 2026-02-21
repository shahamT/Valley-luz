<template>
  <div class="MonthCalendar">
    <div class="MonthCalendar-weekdays">
      <MonthlyWeekdayRow />
    </div>
    <div class="MonthCalendar-gridWrapper">
      <div class="MonthCalendar-grid">
        <MonthlyDayCell
          v-for="day in calendarDays"
          :key="day.dateString"
          :day="day"
          :categories="categories"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { generateCalendarDays } from '~/utils/calendar.helpers'
import { getCurrentYearMonth } from '~/utils/date.helpers'
import { getEventsByDate } from '~/utils/events.service'

defineOptions({ name: 'MonthCalendar' })

const props = defineProps({
  date: {
    type: Object,
    default: () => getCurrentYearMonth(),
  },
  events: {
    type: Array,
    required: true,
  },
  categories: {
    type: Object,
    default: () => ({}),
  },
})

const eventsMap = computed(() => {
  return getEventsByDate(props.events, props.date.year, props.date.month)
})

const eventCountsMap = computed(() => {
  const counts = {}
  for (const [dateString, events] of Object.entries(eventsMap.value)) {
    counts[dateString] = events.length
  }
  return counts
})

const calendarDays = computed(() => {
  return generateCalendarDays(props.date.year, props.date.month, eventCountsMap.value, eventsMap.value)
})
</script>

<style lang="scss">
@use '~/assets/css/breakpoints' as *;

.MonthCalendar {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  min-height: 0;

  &-weekdays {
    grid-row: 1;
  }

  &-gridWrapper {
    grid-row: 2;
    min-height: 0;
    padding-top: var(--spacing-xs); // Allow hover transition and shadow to show
    padding-left: var(--spacing-sm); // Allow shadow to show on left side

    @include mobile {
      padding-left: 0;
    }
  }

  &-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--spacing-md);
    direction: rtl; // Keep grid in RTL for correct column order

    @include mobile {
      gap: 2px; // Tighter grid on mobile
    }
  }
}
</style>
