<template>
  <Teleport to="body">
    <div
      class="CategoriesModal"
      @click.self="handleClose"
    >
      <div class="CategoriesModal-content">
        <div class="CategoriesModal-header">
          <h2 class="CategoriesModal-title">{{ title }}</h2>
          <button
            class="CategoriesModal-closeButton"
            @click="handleClose"
            aria-label="סגור"
          >
            <UiIcon name="close" size="md" />
          </button>
        </div>
        <div class="CategoriesModal-body">
          <button
            class="CategoriesModal-resetButton"
            :class="{ 'CategoriesModal-resetButton--disabled': !hasSelectedCategories }"
            :disabled="!hasSelectedCategories"
            @click="handleReset"
          >
            {{ resetButtonText }}
          </button>
          <UiCategoryPill
            v-for="(category, categoryId) in categoriesList"
            :key="categoryId"
            :category="category"
            :category-id="categoryId"
            :is-selected="selectedCategoriesList.includes(categoryId)"
            @click="$emit('toggle-category', categoryId)"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { UI_TEXT } from '~/consts/calendar.const'

const emit = defineEmits(['close', 'toggle-category', 'reset-filter'])

const categoriesStore = useCategoriesStore()
const calendarStore = useCalendarStore()
const { selectedCategories } = storeToRefs(calendarStore)

const title = UI_TEXT.categoriesFilterTitle
const resetButtonText = UI_TEXT.resetFilter

const selectedCategoriesList = computed(() => selectedCategories?.value ?? [])
const categoriesList = computed(() => categoriesStore?.categories ?? {})

const hasSelectedCategories = computed(() => {
  return selectedCategoriesList.value.length > 0
})

const handleClose = () => {
  emit('close')
}

const handleReset = () => {
  emit('reset-filter')
  emit('close')
}
</script>

<style lang="scss">
.CategoriesModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--modal-backdrop-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal);
  padding: 0;

  &-content {
    position: relative;
    width: 100%;
    max-width: var(--modal-max-width);
    max-height: 100%;
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    background-color: var(--color-background);
    margin: var(--spacing-lg);
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  &-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  &-closeButton {
    background: none;
    border: none;
    cursor: pointer;
    padding: var(--spacing-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text);
    transition: opacity 0.2s ease;
    border-radius: 50%;

    &:hover {
      opacity: 0.7;
      background-color: var(--day-cell-hover-bg);
    }
  }

  &-body {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-md);
    row-gap: calc((var(--spacing-sm) + var(--spacing-md)) / 2);
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
