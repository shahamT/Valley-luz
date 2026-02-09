<template>
  <div class="WeekdayRow">
    <div 
      v-for="(day, index) in weekdays" 
      :key="day" 
      class="WeekdayRow-day"
      :class="{ 'WeekdayRow-day--weekend': isWeekendDay(index) }"
    >
      {{ day }}
    </div>
  </div>
</template>

<script setup>
import { HEBREW_WEEKDAYS } from '~/consts/dates.const'
import { WEEKEND_DAYS } from '~/consts/calendar.const'

const SHORT_WEEKDAYS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"]

const isMobile = useScreenWidth(768)

const weekdays = computed(() => {
  return isMobile.value ? SHORT_WEEKDAYS : HEBREW_WEEKDAYS
})

const isWeekendDay = (index) => {
  return WEEKEND_DAYS.includes(index)
}
</script>

<style lang="scss">
.WeekdayRow {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-md);
  margin-bottom: calc(var(--spacing-md) - 4px); // Reduced by padding-top amount to maintain visual spacing

  &-day {
    text-align: center;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-light);
    padding: var(--spacing-sm);

    &--weekend {
      color: var(--brand-dark-green);
    }
  }

  @media (max-width: 767px) {
    gap: 4px;
  }
}
</style>
