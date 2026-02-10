<template>
  <Teleport to="body">
    <div
      class="FilterModal"
      @click.self="handleClose"
    >
      <div class="FilterModal-content">
        <div class="FilterModal-header">
          <h2 class="FilterModal-title">{{ title }}</h2>
          <button
            class="FilterModal-closeButton"
            @click="handleClose"
            aria-label="סגור"
          >
            <UiIcon name="close" size="md" />
          </button>
        </div>
        <div
          class="FilterModal-tabs"
          role="tablist"
          aria-label="סינון"
        >
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'categories'"
            :class="{ 'FilterModal-tab--active': activeTab === 'categories' }"
            class="FilterModal-tab"
            @click="activeTab = 'categories'"
          >
            {{ categoriesTabLabel }}
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 'hours'"
            :class="{ 'FilterModal-tab--active': activeTab === 'hours' }"
            class="FilterModal-tab"
            @click="activeTab = 'hours'"
          >
            {{ hoursTabLabel }}
          </button>
        </div>
        <div class="FilterModal-panels">
          <div
            v-show="activeTab === 'categories'"
            role="tabpanel"
            class="FilterModal-panel FilterModal-panel--categories"
          >
            <button
              class="FilterModal-resetButton"
              :class="{ 'FilterModal-resetButton--disabled': !hasSelectedCategories }"
              :disabled="!hasSelectedCategories"
              @click="handleCategoriesReset"
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
          <div
            v-show="activeTab === 'hours'"
            role="tabpanel"
            class="FilterModal-panel FilterModal-panel--hours"
          >
            <p class="FilterModal-hoursPlaceholder">
              {{ hoursFilterLabel }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { UI_TEXT } from '~/consts/calendar.const'

const props = defineProps({
  selectedCategoriesCount: {
    type: Number,
    default: 0,
  },
  hoursFilterLabel: {
    type: String,
    default: () => UI_TEXT.hoursFilterAll,
  },
})

const emit = defineEmits(['close', 'toggle-category', 'reset-filter', 'click-hours'])

const activeTab = ref('categories')

const categoriesStore = useCategoriesStore()
const calendarStore = useCalendarStore()
const { selectedCategories } = storeToRefs(calendarStore)

const title = UI_TEXT.filterButtonLabel
const resetButtonText = UI_TEXT.resetFilter
const categoriesTabLabel = computed(
  () => `${UI_TEXT.categoriesFilter} (${props.selectedCategoriesCount})`
)
const hoursTabLabel = computed(() => `${UI_TEXT.hoursFilter} (${props.hoursFilterLabel})`)

const selectedCategoriesList = computed(() => selectedCategories?.value ?? [])
const categoriesList = computed(() => categoriesStore?.categories ?? {})

const hasSelectedCategories = computed(() => {
  return selectedCategoriesList.value.length > 0
})

const handleClose = () => {
  emit('close')
}

const handleCategoriesReset = () => {
  emit('reset-filter')
  emit('close')
}
</script>

<style lang="scss">
.FilterModal {
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
    min-width: 360px;
    max-width: var(--modal-max-width);
    max-height: 100%;
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    background-color: var(--light-bg, #f2fbf8);
    margin: var(--spacing-lg);
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
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

  &-tabs {
    display: flex;
    gap: 0;
    margin-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  &-tab {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-light);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: color 0.2s ease, border-color 0.2s ease;

    &:hover {
      color: var(--color-text);
    }

    &--active {
      color: var(--brand-dark-green);
      border-bottom-color: var(--brand-dark-green);
    }
  }

  &-panels {
    min-height: 2rem;
  }

  &-panel {
    &--categories {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-md);
      row-gap: calc((var(--spacing-sm) + var(--spacing-md)) / 2);
    }

    &--hours {
      padding: var(--spacing-sm) 0;
    }
  }

  &-hoursPlaceholder {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-light);
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
