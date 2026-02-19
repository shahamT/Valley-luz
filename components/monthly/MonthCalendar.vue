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
    padding-top: 4px; // Allow hover transition and shadow to show
    padding-left: 8px; // Allow shadow to show on left side

    @media (max-width: 767px) {
      padding-left: 0;
    }
  }

  &-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--spacing-md);
    direction: rtl; // Keep grid in RTL for correct column order

    @media (max-width: 767px) {
      gap: 2px;
    }
  }
}
</style>
