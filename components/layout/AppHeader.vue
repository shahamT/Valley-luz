<template>
  <header class="AppHeader">
    <div class="AppHeader-container">
      <button class="AppHeader-menuButton" type="button" aria-label="תפריט">
        <UiIcon name="menu" size="md" class="AppHeader-menuIcon" />
      </button>
      <div class="AppHeader-leftSpacer" aria-hidden="true"></div>
      <button class="AppHeader-whatsappButton" aria-label="לבוט הוואטסאפ שלנו">
        <img src="/icons/whatsapp-icon.svg" alt="" class="AppHeader-whatsappIcon" />
        <span class="AppHeader-whatsappText">לבוט הוואטסאפ שלנו</span>
      </button>
      <div class="AppHeader-rightSpacer" aria-hidden="true"></div>
      <div class="AppHeader-rightGroup">
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
        <div class="AppHeader-center">
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
      </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { MOBILE_BREAKPOINT } from '~/consts/ui.const'

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

const isMobile = useScreenWidth(MOBILE_BREAKPOINT)

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
  position: sticky;
  top: 0;
  height: var(--header-height);
  background-color: var(--color-background);
  z-index: 1000;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

  &-container {
    max-width: var(--content-max-width);
    width: 100%;
    margin: 0 auto;
    padding-inline: var(--spacing-3xl);
    height: 100%;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);

    @media (max-width: 768px) {
      padding-inline: 1rem;
    }
  }

  &-logo {
    height: 2rem;
    width: auto;
    object-fit: contain;
    flex-shrink: 0;
    direction: ltr;
  }

  &-menuButton {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: none;
    border-radius: var(--radius-md);
    background-color: transparent;
    color: var(--brand-dark-green);
    cursor: pointer;
    transition: background-color 0.2s ease;
    flex-shrink: 0;

    &:hover {
      background-color: var(--weekend-day-bg);
    }
  }

  &-menuIcon {
    flex-shrink: 0;
  }

  &-leftSpacer,
  &-rightSpacer {
    flex: 1;
    min-width: 0;
  }

  &-rightGroup {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    min-width: 0;
  }

  &-center {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 0;
  }

  [dir='rtl'] &-menuButton {
    order: 0;
  }

  [dir='rtl'] &-leftSpacer {
    order: 1;
  }

  [dir='rtl'] &-whatsappButton {
    order: 2;
  }

  [dir='rtl'] &-rightSpacer {
    order: 3;
  }

  [dir='rtl'] &-rightGroup {
    order: 4;
  }

  &-monthNav {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
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

  &-whatsappButton {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    background-color: #25D366;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    padding: var(--spacing-xs) var(--spacing-md);
    transition: opacity 0.2s ease;
    flex-shrink: 0;
    height: 34px;

    &:hover {
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      padding: var(--spacing-xs) var(--spacing-md);
      gap: var(--spacing-xs);
    }
  }

  &-whatsappIcon {
    width: 18px;
    height: 18px;
    filter: brightness(0) saturate(100%);

    @media (max-width: 768px) {
      width: 16px;
      height: 16px;
    }
  }

  &-whatsappText {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
    white-space: nowrap;
  }
}
</style>
