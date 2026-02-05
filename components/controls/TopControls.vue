<template>
  <div class="TopControls">
    <div class="TopControls__pills">
      <UiPillButton label="יומן בסיס" />
      <UiPillButton label="קטגוריות" :count="6" />
    </div>
    <div class="TopControls__center">
      <slot name="center">
        <div v-if="mode === 'month'" class="TopControls__monthNav">
          <button class="TopControls__arrow" @click="$emit('prev-month')">←</button>
          <span class="TopControls__month">{{ monthYear }}</span>
          <button class="TopControls__arrow" @click="$emit('next-month')">→</button>
        </div>
        <div v-else-if="mode === 'daily'" class="TopControls__dailyNav">
          <button class="TopControls__back" @click="$emit('back')">← חזרה ללו"ז חודשי</button>
          <div class="TopControls__date">{{ dateTitle }}</div>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
// PillButton is auto-imported by Nuxt

defineProps({
  mode: {
    type: String,
    default: 'month', // 'month' or 'daily'
  },
  monthYear: {
    type: String,
    default: 'פברואר 2025',
  },
  dateTitle: {
    type: String,
    default: 'יום ראשון | 6 בפברואר 2025',
  },
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

  &__pills {
    display: flex;
    gap: var(--spacing-md);
  }

  &__center {
    flex: 1;
    display: flex;
    justify-content: center;
  }

  &__monthNav {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  &__arrow {
    background: none;
    border: none;
    font-size: var(--font-size-lg);
    cursor: pointer;
    color: var(--color-text);
    padding: var(--spacing-xs);
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.7;
    }
  }

  &__month {
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  &__dailyNav {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
  }

  &__back {
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

  &__date {
    font-size: var(--font-size-base);
    font-weight: 500;
  }
}
</style>
