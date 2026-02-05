<template>
  <div class="MonthCalendar">
    <WeekdayRow />
    <div class="MonthCalendar__grid">
      <DayCell
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
import { computed } from 'vue'
import WeekdayRow from './WeekdayRow.vue'
import DayCell from './DayCell.vue'
import { getEventCountsByDate, formatDateToYYYYMMDD } from '../../helpers/events.helpers'

const props = defineProps({
  year: {
    type: Number,
    default: 2025,
  },
  month: {
    type: Number,
    default: 2, // February
  },
  events: {
    type: Array,
    default: () => [],
  },
})

const eventCountsMap = computed(() => {
  return getEventCountsByDate(props.events, props.year, props.month)
})

const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(props.year, props.month - 1, 1)
  const lastDay = new Date(props.year, props.month, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay() // 0 = Sunday

  // Add leading days from previous month
  const prevMonthLastDay = new Date(props.year, props.month - 1, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i
    const date = new Date(props.year, props.month - 2, dayNum)
    days.push({
      dayNumber: dayNum,
      isOutsideMonth: true,
      eventsCount: 0,
      dateString: formatDateToYYYYMMDD(date),
    })
  }

  // Add current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(props.year, props.month - 1, day)
    const dateString = formatDateToYYYYMMDD(date)
    days.push({
      dayNumber: day,
      isOutsideMonth: false,
      eventsCount: eventCountsMap.value[dateString] || 0,
      dateString,
    })
  }

  // Add trailing days from next month to complete grid
  const remainingCells = 42 - days.length // 6 rows * 7 days
  for (let day = 1; day <= remainingCells; day++) {
    const date = new Date(props.year, props.month, day)
    days.push({
      dayNumber: day,
      isOutsideMonth: true,
      eventsCount: 0,
      dateString: formatDateToYYYYMMDD(date),
    })
  }

  return days
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
