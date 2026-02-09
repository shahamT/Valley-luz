<template>
  <header class="AppHeader">
    <div class="AppHeader-container">
      <slot name="center">
        <ClientOnly>
          <div v-if="showMonthYear" class="AppHeader-monthNav">
            <button 
              class="AppHeader-navButton" 
              :class="{ 'AppHeader-navButton--disabled': isCurrentMonth }"
              :disabled="isCurrentMonth"
              @click="$emit('prev-month')" 
              aria-label="Previous month"
            >
              <UiIcon name="chevron_right" size="md" />
            </button>
            <div class="AppHeader-monthTriggerWrapper">
              <button 
                ref="monthTriggerButtonRef"
                class="AppHeader-monthTrigger" 
                @click="toggleMonthYearPicker" 
                aria-label="Select month and year"
              >
                <span class="AppHeader-month">{{ monthYear }}</span>
                <UiIcon name="expand_more" size="sm" class="AppHeader-chevron" />
              </button>
              <UiMonthYearPopup
                v-if="isMonthYearPickerOpen && !isMobile"
                :current-date="currentDate"
                :trigger-element="monthTriggerButtonRef"
                @close="closeMonthYearPicker"
                @select="handleMonthYearSelect"
                @year-change="handleYearChange"
              />
              <UiMonthYearModal
                v-if="isMonthYearPickerOpen && isMobile"
                :current-date="currentDate"
                @close="closeMonthYearPicker"
                @select="handleMonthYearSelect"
                @year-change="handleYearChange"
              />
            </div>
            <button class="AppHeader-navButton" @click="$emit('next-month')" aria-label="Next month">
              <UiIcon name="chevron_left" size="md" />
            </button>
          </div>
          <template #fallback>
            <div v-if="showMonthYear" class="AppHeader-monthNav">
              <button 
                class="AppHeader-navButton" 
                @click="$emit('prev-month')" 
                aria-label="Previous month"
              >
                <UiIcon name="chevron_right" size="md" />
              </button>
              <div class="AppHeader-monthTriggerWrapper">
                <button 
                  class="AppHeader-monthTrigger" 
                  aria-label="Select month and year"
                >
                  <span class="AppHeader-month">{{ monthYear }}</span>
                  <UiIcon name="expand_more" size="sm" class="AppHeader-chevron" />
                </button>
              </div>
              <button class="AppHeader-navButton" @click="$emit('next-month')" aria-label="Next month">
                <UiIcon name="chevron_left" size="md" />
              </button>
            </div>
          </template>
        </ClientOnly>
      </slot>
      <img 
        v-if="!isMobile" 
        src="/logos/valleyluz-logo.png" 
        alt="Valley Luz" 
        class="AppHeader-logo" 
      />
      <img 
        v-else 
        src="/logos/valleyluz-icon.svg" 
        alt="Valley Luz" 
        class="AppHeader-logo AppHeader-logo--icon" 
      />
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'

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

const emit = defineEmits(['prev-month', 'next-month', 'select-month-year', 'year-change'])

const isMonthYearPickerOpen = ref(false)
const monthTriggerButtonRef = ref(null)

const isMobile = useScreenWidth(768)

const isCurrentMonth = computed(() => {
  if (typeof window === 'undefined') {
    return false
  }
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  return props.currentDate.year === currentYear && props.currentDate.month === currentMonth
})

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

const handleYearChange = ({ year }) => {
  emit('year-change', { year })
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
    gap: var(--spacing-sm);
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  &-navButton {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: none;
    background-color: var(--weekend-day-bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-dark-green);
    transition: background-color 0.2s ease;

    &:hover:not(:disabled) {
      background-color: #D4E8C4;
    }

    &--disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  }

  &-monthTriggerWrapper {
    position: relative;
  }

  &-monthTrigger {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    background-color: var(--weekend-day-bg);
    border: none;
    border-radius: 999px;
    cursor: pointer;
    padding: var(--spacing-xs) var(--spacing-md);
    transition: background-color 0.2s ease;
    color: var(--brand-dark-green);
    width: 12rem;
    height: 34px;
    justify-content: center;

    &:hover {
      background-color: #D4E8C4;
    }
  }

  &-chevron {
    color: var(--brand-dark-green);
  }

  &-month {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--brand-dark-green);
  }
}
</style>
