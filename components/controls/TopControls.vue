<template>
  <div class="TopControls">
    <div class="TopControls-pills">
      <UiPillButton :label="PILL_LABELS.baseCalendar" />
      <UiPillButton :label="PILL_LABELS.categories" :count="categoriesCount" />
    </div>
    <div class="TopControls-center">
      <slot name="center">
        <div v-if="mode === 'month'" class="TopControls-monthNav">
          <button class="TopControls-navButton" @click="$emit('prev-month')" aria-label="Previous month">
            <UiIcon name="chevron_right" size="md" />
          </button>
          <span class="TopControls-month">{{ monthYear }}</span>
          <button class="TopControls-navButton" @click="$emit('next-month')" aria-label="Next month">
            <UiIcon name="chevron_left" size="md" />
          </button>
        </div>
        <div v-else-if="mode === 'daily'" class="TopControls-dailyNav">
          <button class="TopControls-back" @click="$emit('back')">← {{ backButtonText }}</button>
          <div class="TopControls-date">{{ dateTitle }}</div>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { PILL_LABELS } from '~/consts/ui.const'
import { UI_TEXT } from '~/consts/calendar.const'

const props = defineProps({
  mode: {
    type: String,
    default: 'month', // 'month' or 'daily'
  },
  monthYear: {
    type: String,
    default: '',
  },
  dateTitle: {
    type: String,
    default: '',
  },
  categoriesCount: {
    type: Number,
    default: 0,
  },
})

const backButtonText = computed(() => {
  return UI_TEXT.backToMonthly
})

defineEmits(['prev-month', 'next-month', 'back'])
</script>

<style lang="scss">
.TopControls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);

  &-pills {
    display: flex;
    gap: var(--spacing-md);
  }

  &-center {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  &-monthNav {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
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

  &-month {
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  &-dailyNav {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &-back {
    background: none;
    border: none;
    font-size: var(--font-size-sm);
    cursor: pointer;
    color: var(--color-text);
    text-decoration: underline;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.7;
    }
  }

  &-date {
    font-size: var(--font-size-base);
    font-weight: 500;
  }
}
</style>
