<template>
  <div class="WeekdayRow">
    <div v-for="day in weekdays" :key="day" class="WeekdayRow-day">
      {{ day }}
    </div>
  </div>
</template>

<script setup>
import { HEBREW_WEEKDAYS } from '~/consts/dates.const'

const weekdays = HEBREW_WEEKDAYS
</script>

<style lang="scss">
.WeekdayRow {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-md);
  margin-bottom: calc(var(--spacing-md) - 4px); // Reduced by padding-top amount to maintain visual spacing
  padding-right: var(--scrollbar-total-width);
  padding-left: 8px; // Match gridWrapper left padding for alignment

  &-day {
    text-align: center;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-light);
    padding: var(--spacing-sm);
  }
}
</style>
