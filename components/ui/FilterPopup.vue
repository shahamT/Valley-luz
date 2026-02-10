<template>
  <div
    ref="popupRef"
    class="FilterPopup"
    @click.stop
  >
    <div
      class="FilterPopup-tabs"
      role="tablist"
      aria-label="סינון"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'categories'"
        :class="{ 'FilterPopup-tab--active': activeTab === 'categories' }"
        class="FilterPopup-tab"
        @click="activeTab = 'categories'"
      >
        {{ categoriesTabLabel }}
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'hours'"
        :class="{ 'FilterPopup-tab--active': activeTab === 'hours' }"
        class="FilterPopup-tab"
        @click="activeTab = 'hours'"
      >
        {{ hoursTabLabel }}
      </button>
    </div>
    <div class="FilterPopup-panels">
      <div
        v-show="activeTab === 'categories'"
        role="tabpanel"
        class="FilterPopup-panel FilterPopup-panel--categories"
      >
        <button
          class="FilterPopup-resetButton"
          :class="{ 'FilterPopup-resetButton--disabled': !hasSelectedCategories }"
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
        class="FilterPopup-panel FilterPopup-panel--hours"
      >
        <p class="FilterPopup-hoursPlaceholder">
          {{ hoursFilterLabel }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { onClickOutside } from '@vueuse/core'
import { UI_TEXT } from '~/consts/calendar.const'

const props = defineProps({
  triggerElement: {
    type: Object,
    required: true,
  },
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

const popupRef = ref(null)
const activeTab = ref('categories')

const categoriesStore = useCategoriesStore()
const calendarStore = useCalendarStore()
const { selectedCategories } = storeToRefs(calendarStore)

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

const handleCategoriesReset = () => {
  emit('reset-filter')
  emit('close')
}

onClickOutside(
  popupRef,
  () => {
    emit('close')
  },
  {
    ignore: [props.triggerElement],
  }
)
</script>

<style lang="scss">
.FilterPopup {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  background-color: var(--light-bg, #f2fbf8);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-lg);
  min-width: 360px;
  z-index: var(--z-index-modal);

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
