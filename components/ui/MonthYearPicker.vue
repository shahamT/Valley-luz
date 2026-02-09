<template>
  <div class="MonthYearPicker">
    <div class="MonthYearPicker-yearSection">
      <label class="MonthYearPicker-label">שנה</label>
      <div class="MonthYearPicker-yearGrid">
        <button
          v-for="yearOption in availableYears"
          :key="yearOption"
          class="MonthYearPicker-yearButton"
          :class="{ 'MonthYearPicker-yearButton--active': yearOption === localYear }"
          @click="selectYear(yearOption)"
        >
          {{ yearOption }}
        </button>
      </div>
    </div>
    <div class="MonthYearPicker-monthSection">
      <label class="MonthYearPicker-label">חודש</label>
      <div class="MonthYearPicker-monthGrid">
        <button
          v-for="(monthName, index) in HEBREW_MONTHS"
          :key="index"
          class="MonthYearPicker-monthButton"
          :class="{ 
            'MonthYearPicker-monthButton--active': (index + 1) === localMonth,
            'MonthYearPicker-monthButton--disabled': isMonthDisabled(index + 1)
          }"
          :disabled="isMonthDisabled(index + 1)"
          @click="selectMonth(index + 1)"
        >
          {{ monthName }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { HEBREW_MONTHS } from '~/consts/dates.const'

const props = defineProps({
  year: {
    type: Number,
    required: true,
  },
  month: {
    type: Number,
    required: true,
    validator: (value) => value >= 1 && value <= 12,
  },
})

const emit = defineEmits(['update:year', 'update:month', 'select', 'year-change'])

const localYear = ref(props.year)
const localMonth = ref(props.month)

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const availableYears = computed(() => {
  return [currentYear, currentYear + 1, currentYear + 2]
})

watch(() => props.year, (newYear) => {
  localYear.value = newYear
})

watch(() => props.month, (newMonth) => {
  localMonth.value = newMonth
})

const isMonthDisabled = (month) => {
  if (localYear.value > currentYear) {
    return false
  }
  if (localYear.value < currentYear) {
    return true
  }
  return month < currentMonth
}

const selectYear = (year) => {
  localYear.value = year
  emit('update:year', year)
  emit('year-change', year)
}

const selectMonth = (month) => {
  if (isMonthDisabled(month)) {
    return
  }
  localMonth.value = month
  emit('update:month', month)
  emit('select', localYear.value, month)
}
</script>

<style lang="scss">
.MonthYearPicker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  &-yearSection,
  &-monthSection {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  &-label {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-text-light);
  }

  &-yearGrid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-xs);
  }

  &-yearButton {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-background);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;

    &:hover {
      background-color: var(--brand-dark-green);
      border-color: var(--brand-dark-green);
      color: var(--color-background);
      transform: translateY(-1px);
    }

    &--active {
      background-color: var(--brand-light-green);
      color: var(--color-background);
      border-color: var(--brand-light-green);
      font-weight: 600;

      &:hover {
        background-color: var(--brand-dark-green);
        border-color: var(--brand-dark-green);
      }
    }
  }

  &-monthGrid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-xs);

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &-monthButton {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--color-background);
    color: var(--color-text);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;

    &:hover:not(:disabled) {
      background-color: var(--brand-dark-green);
      border-color: var(--brand-dark-green);
      color: var(--color-background);
      transform: translateY(-1px);
    }

    &--active {
      background-color: var(--brand-light-green);
      color: var(--color-background);
      border-color: var(--brand-light-green);
      font-weight: 600;

      &:hover {
        background-color: var(--brand-dark-green);
        border-color: var(--brand-dark-green);
      }
    }

    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  }
}
</style>
