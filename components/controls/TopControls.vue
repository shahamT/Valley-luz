<template>
  <div class="TopControls">
    <div v-if="mode === 'month'" class="TopControls-categoryPills">
      <button
        class="TopControls-resetButton"
        :class="{ 'TopControls-resetButton--disabled': !hasSelectedCategories }"
        :disabled="!hasSelectedCategories"
        @click="$emit('reset-filter')"
      >
        איפוס פילטר
      </button>
      <UiCategoryPill
        v-for="(category, categoryId) in categoriesStore.categories"
        :key="categoryId"
        :category="category"
        :category-id="categoryId"
        :is-selected="selectedCategories.includes(categoryId)"
        @click="$emit('toggle-category', categoryId)"
      />
    </div>
    <div v-if="mode === 'daily'" class="TopControls-dailyNav">
      <button class="TopControls-back" @click="$emit('back')">← {{ backButtonText }}</button>
      <div class="TopControls-date">{{ dateTitle }}</div>
    </div>
  </div>
</template>

<script setup>
import { UI_TEXT } from '~/consts/calendar.const'

const props = defineProps({
  mode: {
    type: String,
    default: 'month',
  },
  dateTitle: {
    type: String,
    default: '',
  },
  selectedCategories: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['back', 'toggle-category', 'reset-filter'])

const categoriesStore = useCategoriesStore()

const backButtonText = computed(() => {
  return UI_TEXT.backToMonthly
})

const hasSelectedCategories = computed(() => {
  return props.selectedCategories && props.selectedCategories.length > 0
})
</script>

<style lang="scss">
.TopControls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  gap: var(--spacing-lg);

  &-categoryPills {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-md);
    row-gap: calc((var(--spacing-sm) + var(--spacing-md)) / 2);
    width: 100%;
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

  &-resetButton {
    border: 2px solid var(--color-text-light);
    border-radius: var(--pill-radius);
    padding: 0.375rem var(--pill-padding-x);
    font-size: var(--font-size-sm);
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.2s ease;
    background-color: transparent;
    color: var(--color-text-light);
    white-space: nowrap;

    &:hover:not(:disabled) {
      opacity: 1;
      transform: translateY(-1px);
      border-color: var(--color-text);
      color: var(--color-text);
    }

    &--disabled {
      opacity: 0.3;
      cursor: not-allowed;
      pointer-events: none;
    }
  }
}
</style>
