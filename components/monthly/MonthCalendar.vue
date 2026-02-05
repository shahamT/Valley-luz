<template>
  <div class="MonthCalendar">
    <MonthlyWeekdayRow />
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
  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--spacing-md);
  }
}
</style>
