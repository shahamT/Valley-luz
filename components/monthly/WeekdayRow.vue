<template>
  <div class="WeekdayRow">
    <div v-for="day in weekdays" :key="day" class="WeekdayRow__day">
      {{ day }}
    </div>
  </div>
</template>

<script setup>
const weekdays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
</script>

<style lang="scss">
.WeekdayRow {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);

  &__day {
    text-align: center;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-light);
    padding: var(--spacing-sm);
  }
}
</style>
