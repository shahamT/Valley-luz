<template>
  <LayoutAppShell>
    <div class="MonthlyView">
      <div class="MonthlyView-header">
        <ControlsTopControls 
          mode="month" 
          :month-year="monthYearDisplay"
          @prev-month="handlePrevMonth"
          @next-month="handleNextMonth"
        />
      </div>
      <div class="MonthlyView-calendar">
        <MonthlyMonthCalendar :year="currentYear" :month="currentMonth" :events="eventsStore.events" />
      </div>
    </div>
  </LayoutAppShell>
</template>

<script setup>
import { getCurrentYearMonth, formatMonthYear } from '~/utils/date.helpers'

const eventsStore = useEventsStore()

const currentDate = ref(getCurrentYearMonth())

const currentYear = computed(() => currentDate.value.year)
const currentMonth = computed(() => currentDate.value.month)

const monthYearDisplay = computed(() => {
  return formatMonthYear(currentYear.value, currentMonth.value)
})

const handlePrevMonth = () => {
  let newMonth = currentMonth.value - 1
  let newYear = currentYear.value
  
  if (newMonth < 1) {
    newMonth = 12
    newYear--
  }
  
  currentDate.value = { year: newYear, month: newMonth }
}

const handleNextMonth = () => {
  let newMonth = currentMonth.value + 1
  let newYear = currentYear.value
  
  if (newMonth > 12) {
    newMonth = 1
    newYear++
  }
  
  currentDate.value = { year: newYear, month: newMonth }
}
</script>

<style lang="scss">
.MonthlyView {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  gap: var(--spacing-md);
  min-height: 0;

  &-header {
    grid-row: 1;
    padding-right: var(--scrollbar-total-width);
    padding-left: 8px; // Match gridWrapper left padding for alignment
  }

  &-calendar {
    grid-row: 2;
    min-height: 0;
  }
}
</style>
