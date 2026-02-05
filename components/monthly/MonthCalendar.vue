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
          :day-number="day.dayNumber"
          :is-outside-month="day.isOutsideMonth"
          :events-count="day.eventsCount"
          :date-string="day.dateString"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { eventsService } from '~/utils/events.service'
import { generateCalendarDays } from '~/utils/calendar.helpers'
import { DEFAULT_YEAR, DEFAULT_MONTH } from '~/consts/calendar.const'

const props = defineProps({
  year: {
    type: Number,
    default: DEFAULT_YEAR,
  },
  month: {
    type: Number,
    default: DEFAULT_MONTH,
  },
  events: {
    type: Array,
    default: () => [],
  },
})

const eventCountsMap = computed(() => {
  return eventsService.getEventCountsByDate(props.events, props.year, props.month)
})

const calendarDays = computed(() => {
  return generateCalendarDays(props.year, props.month, eventCountsMap.value)
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
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    padding-right: var(--spacing-md);
    direction: ltr; // Force scrollbar to right side
    
    /* Custom scrollbar styling */
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb-bg) var(--scrollbar-track-bg);
    
    &::-webkit-scrollbar {
      width: var(--scrollbar-width);
    }
    
    &::-webkit-scrollbar-track {
      background: var(--scrollbar-track-bg);
      border-radius: var(--scrollbar-border-radius);
      margin: var(--scrollbar-margin);
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--scrollbar-thumb-bg);
      border-radius: var(--scrollbar-border-radius);
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background: var(--scrollbar-thumb-hover-bg);
    }
  }

  &-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--spacing-md);
    direction: rtl; // Keep grid in RTL for correct column order
  }
}
</style>
