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
import { HEBREW_WEEKDAYS, HEBREW_WEEKDAYS_SHORT } from '~/consts/dates.const'
import { WEEKEND_DAYS } from '~/consts/calendar.const'
import { MOBILE_BREAKPOINT } from '~/consts/ui.const'

defineOptions({ name: 'WeekdayRow' })

const isMobile = useScreenWidth(MOBILE_BREAKPOINT)

const weekdays = computed(() => {
  return isMobile.value ? HEBREW_WEEKDAYS_SHORT : HEBREW_WEEKDAYS
})

const isWeekendDay = (index) => {
  return WEEKEND_DAYS.includes(index)
}
</script>

<style lang="scss">
.WeekdayRow {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  align-items: center;
  height: 44px;
  padding-block: 0;
  gap: var(--spacing-md);

  &-day {
    text-align: center;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-light);
    padding-block: 0;

    &--weekend {
      color: var(--brand-dark-blue);
    }
  }

  @media (max-width: 767px) {
    gap: 4px;
  }
}
</style>
