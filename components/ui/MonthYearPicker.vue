<template>
  <div class="MonthYearPicker">
    <div class="MonthYearPicker-yearSection">
      <label class="MonthYearPicker-label">שנה</label>
      <div class="MonthYearPicker-yearSelector">
        <button
          class="MonthYearPicker-yearButton"
          @click="decrementYear"
          aria-label="Previous year"
        >
          <UiIcon name="chevron_right" size="sm" />
        </button>
        <input
          v-model.number="localYear"
          type="number"
          class="MonthYearPicker-yearInput"
          :min="minYear"
          :max="maxYear"
          @change="handleYearChange"
        />
        <button
          class="MonthYearPicker-yearButton"
          @click="incrementYear"
          aria-label="Next year"
        >
          <UiIcon name="chevron_left" size="sm" />
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
          :class="{ 'MonthYearPicker-monthButton--active': (index + 1) === localMonth }"
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

const emit = defineEmits(['update:year', 'update:month', 'select'])

const localYear = ref(props.year)
const localMonth = ref(props.month)

const minYear = 2020
const maxYear = 2030

watch(() => props.year, (newYear) => {
  localYear.value = newYear
})

watch(() => props.month, (newMonth) => {
  localMonth.value = newMonth
})

const handleYearChange = () => {
  if (localYear.value < minYear) {
    localYear.value = minYear
  } else if (localYear.value > maxYear) {
    localYear.value = maxYear
  }
  emit('update:year', localYear.value)
}

const incrementYear = () => {
  if (localYear.value < maxYear) {
    localYear.value++
    emit('update:year', localYear.value)
  }
}

const decrementYear = () => {
  if (localYear.value > minYear) {
    localYear.value--
    emit('update:year', localYear.value)
  }
}

const selectMonth = (month) => {
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

  &-yearSelector {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
  }

  &-yearButton {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    border: none;
    background-color: var(--color-background);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text);
    transition: background-color 0.2s ease, transform 0.2s ease;
    box-shadow: var(--shadow-sm);

    &:hover {
      background-color: var(--day-cell-hover-bg);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  &-yearInput {
    font-size: var(--font-size-base);
    font-weight: 600;
    text-align: center;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--spacing-xs) var(--spacing-sm);
    width: 4.5rem;
    background-color: var(--color-background);
    color: var(--color-text);

    &:focus {
      outline: none;
      border-color: var(--brand-dark-blue);
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
    transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;

    &:hover {
      background-color: var(--day-cell-hover-bg);
      border-color: var(--brand-dark-blue);
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
}
</style>
