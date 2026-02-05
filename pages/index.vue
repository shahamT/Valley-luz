<template>
  <LayoutAppShell>
    <ControlsTopControls mode="month" :month-year="monthYearDisplay" />
    <MonthlyMonthCalendar :year="currentYear" :month="currentMonth" :events="eventsStore.events" />
  </LayoutAppShell>
</template>

<script setup>
import { getCurrentYearMonth, formatMonthYear } from '~/utils/date.helpers'

const eventsStore = useEventsStore()

const { year: currentYear, month: currentMonth } = getCurrentYearMonth()

const monthYearDisplay = computed(() => {
  return formatMonthYear(currentYear, currentMonth)
})
</script>
