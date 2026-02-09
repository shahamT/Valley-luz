<template>
  <header class="AppHeader">
    <div class="AppHeader-container">
      <slot name="center">
        <div v-if="showMonthYear" class="AppHeader-monthNav">
          <button class="AppHeader-navButton" @click="$emit('prev-month')" aria-label="Previous month">
            <UiIcon name="chevron_right" size="md" />
          </button>
          <div class="AppHeader-monthTriggerWrapper">
            <button 
              ref="monthTriggerButtonRef"
              class="AppHeader-monthTrigger" 
              @click="toggleMonthYearPicker" 
              aria-label="Select month and year"
            >
              <UiIcon name="expand_more" size="sm" class="AppHeader-chevron" />
              <span class="AppHeader-month">{{ monthYear }}</span>
            </button>
            <UiMonthYearPopup
              v-if="isMonthYearPickerOpen"
              :current-date="currentDate"
              :trigger-element="monthTriggerButtonRef"
              @close="closeMonthYearPicker"
              @select="handleMonthYearSelect"
            />
          </div>
          <button class="AppHeader-navButton" @click="$emit('next-month')" aria-label="Next month">
            <UiIcon name="chevron_left" size="md" />
          </button>
        </div>
      </slot>
      <img src="/logos/valleyluz-logo.png" alt="Valley Luz" class="AppHeader-logo" />
    </div>
  </header>
</template>

<script setup>
const props = defineProps({
  showMonthYear: {
    type: Boolean,
    default: false,
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

const emit = defineEmits(['prev-month', 'next-month', 'select-month-year'])

const isMonthYearPickerOpen = ref(false)
const monthTriggerButtonRef = ref(null)

const toggleMonthYearPicker = () => {
  isMonthYearPickerOpen.value = !isMonthYearPickerOpen.value
}

const closeMonthYearPicker = () => {
  isMonthYearPickerOpen.value = false
}

const handleMonthYearSelect = ({ year, month }) => {
  emit('select-month-year', { year, month })
  closeMonthYearPicker()
}
</script>

<style lang="scss">
.AppHeader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background-color: var(--color-background);
  z-index: 1000;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  &-container {
    max-width: var(--content-max-width);
    width: 100%;
    margin: 0 auto;
    padding: 0;
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
  }

  &-logo {
    height: 2rem;
    width: auto;
    object-fit: contain;
    position: absolute;
    left: var(--spacing-xl);
    top: 50%;
    transform: translateY(-50%);
    direction: ltr;
  }

  &-monthNav {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  &-navButton {
    width: 2.5rem;
    height: 2.5rem;
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

  &-monthTriggerWrapper {
    position: relative;
  }

  &-monthTrigger {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: opacity 0.2s ease;
    color: var(--brand-dark-blue);

    &:hover {
      opacity: 0.7;
    }
  }

  &-chevron {
    color: var(--brand-dark-blue);
  }

  &-month {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--brand-dark-blue);
  }
}
</style>
