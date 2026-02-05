<template>
  <div class="MonthCalendar">
    <div class="MonthCalendar__weekdays">
      <MonthlyWeekdayRow />
    </div>
    <div class="MonthCalendar__gridWrapper">
      <div class="MonthCalendar__grid">
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

  &__weekdays {
    grid-row: 1;
  }

  &__gridWrapper {
    grid-row: 2;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    padding-right: var(--spacing-md);
    direction: ltr; // Force scrollbar to right side
    
    /* Custom scrollbar styling */
    scrollbar-width: thin;
    scrollbar-color: var(--brand-light-blue) rgba(128, 220, 218, 0.3);
    
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(128, 220, 218, 0.3);
      border-radius: 4px;
      margin: 4px 0;
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--brand-light-blue);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background: var(--brand-dark-blue);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--spacing-md);
    direction: rtl; // Keep grid in RTL for correct column order
  }
}
</style>
