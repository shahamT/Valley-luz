<template>
  <LayoutAppShell>
    <div class="MonthlyView">
      <div class="MonthlyView__header">
        <ControlsTopControls mode="month" :month-year="monthYearDisplay" />
      </div>
      <div class="MonthlyView__calendar">
        <MonthlyMonthCalendar :year="currentYear" :month="currentMonth" :events="eventsStore.events" />
      </div>
    </div>
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

<style lang="scss">
.MonthlyView {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  gap: var(--spacing-md);
  min-height: 0;

  &__header {
    grid-row: 1;
  }

  &__calendar {
    grid-row: 2;
    min-height: 0;
  }
}
</style>
