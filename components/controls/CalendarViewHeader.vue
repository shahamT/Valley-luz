<template>
  <header class="CalendarViewHeader">
    <ControlsCalendarViewNav
      :view-mode="viewMode"
      :month-year="monthYear"
      :current-date="currentDate"
      :selected-categories-count="selectedCategories?.length ?? 0"
      @select-month-year="$emit('select-month-year', $event)"
      @year-change="$emit('year-change', $event)"
      @view-change="$emit('view-change', $event)"
      @click-hours="$emit('click-hours')"
      @toggle-category="$emit('toggle-category', $event)"
      @reset-filter="$emit('reset-filter')"
    />
  </header>
</template>

<script setup>
import { storeToRefs } from 'pinia'

const props = defineProps({
  viewMode: {
    type: String,
    required: true,
    validator: (value) => ['month', 'day'].includes(value),
  },
  monthYear: {
    type: String,
    default: '',
  },
  currentDate: {
    type: Object,
    default: () => ({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    }),
  },
})

defineEmits([
  'select-month-year',
  'year-change',
  'view-change',
  'toggle-category',
  'reset-filter',
  'click-hours',
])

const calendarStore = useCalendarStore()
const { selectedCategories } = storeToRefs(calendarStore)
</script>

<style lang="scss">
.CalendarViewHeader {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
</style>
