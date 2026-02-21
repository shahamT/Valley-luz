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
  
  // Check if month needs adjustment for selected year
  if (year === currentYear && localMonth.value < currentMonth) {
    localMonth.value = currentMonth
    // Emit complete select event to update both year and month together
    emit('select', year, currentMonth)
  } else {
    // Year change doesn't require month adjustment
    emit('update:year', year)
    emit('year-change', year)
  }
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
@use '~/assets/css/breakpoints' as *;

.MonthYearPicker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background-color: var(--light-bg);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);

  &-yearSection,
  &-monthSection {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);

    @include mobile {
      gap: var(--spacing-md);
    }
  }

  &-label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-light);
    text-align: center;

    @include mobile {
      font-size: var(--font-size-md);
    }
  }

  &-yearGrid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-xs);
  }

  &-yearButton {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--light-bg);
    color: var(--color-text-light);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

    &:hover:not(.MonthYearPicker-yearButton--active) {
      color: var(--color-text);
      border-color: var(--brand-dark-green);
    }

    &--active {
      background-color: var(--brand-dark-green);
      color: var(--chip-text-white);
      border-color: var(--brand-dark-green);
      font-weight: 600;
    }

    @include mobile {
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--font-size-md);
    }
  }

  &-monthGrid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-xs);

    @include mobile {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &-monthButton {
    padding: var(--spacing-xs) var(--spacing-sm);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    background-color: var(--light-bg);
    color: var(--color-text-light);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;

    &:hover:not(:disabled):not(.MonthYearPicker-monthButton--active) {
      color: var(--color-text);
      border-color: var(--brand-dark-green);
    }

    &--active {
      background-color: var(--brand-dark-green);
      color: var(--chip-text-white);
      border-color: var(--brand-dark-green);
      font-weight: 600;
    }

    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    @include mobile {
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: var(--font-size-md);
    }
  }
}
</style>
