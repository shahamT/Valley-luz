<template>
  <div class="FilterPanel">
    <div
      class="FilterPanel-tabs"
      role="tablist"
      aria-label="סינון"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'categories'"
        :class="{ 'FilterPanel-tab--active': activeTab === 'categories' }"
        class="FilterPanel-tab"
        @click="activeTab = 'categories'"
      >
        {{ categoriesTabLabel }}
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeTab === 'hours'"
        :class="{ 'FilterPanel-tab--active': activeTab === 'hours' }"
        class="FilterPanel-tab"
        @click="activeTab = 'hours'"
      >
        {{ UI_TEXT.hoursFilter }}
        (<span dir="ltr">{{ hoursFilterLabel }}</span>)
      </button>
    </div>
    <div class="FilterPanel-panels">
      <div
        v-show="activeTab === 'categories'"
        role="tabpanel"
        class="FilterPanel-panel FilterPanel-panel--categories"
      >
        <UiCategoryPill
          v-for="(category, categoryId) in categoriesList"
          :key="categoryId"
          :category="category"
          :category-id="categoryId"
          :is-selected="selectedCategoriesList.includes(categoryId)"
          @click="handleToggleCategory(categoryId)"
        />
      </div>
      <div
        v-show="activeTab === 'hours'"
        role="tabpanel"
        class="FilterPanel-panel FilterPanel-panel--hours"
      >
        <UiHoursFilterPanel />
      </div>
    </div>
    <footer class="FilterPanel-footer">
      <button
        type="button"
        class="FilterPanel-clearAllButton"
        :disabled="!hasAnyFilter"
        @click="handleClearAllFilters"
      >
        <UiIcon name="close" size="sm" class="FilterPanel-clearButtonIcon" />
        {{ resetButtonText }}
      </button>
      <button
        type="button"
        class="FilterPanel-doneButton"
        @click="$emit('close')"
      >
        <UiIcon name="check" size="sm" class="FilterPanel-doneButtonIcon" />
        {{ doneButtonText }}
      </button>
    </footer>
  </div>
</template>

<script setup>
import { UI_TEXT, MINUTES_PER_DAY } from '~/consts/calendar.const'

defineOptions({ name: 'FilterPanel' })

const props = defineProps({
  categories: {
    type: Object,
    default: () => ({}),
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

defineEmits(['close'])

// data
const activeTab = ref('categories')
const calendarStore = useCalendarStore()
const { selectedCategories, timeFilterStart, timeFilterEnd } = storeToRefs(calendarStore)

const resetButtonText = UI_TEXT.resetFilter
const doneButtonText = UI_TEXT.filterDone

// computed
const categoriesTabLabel = computed(
  () => `${UI_TEXT.categoriesFilter} (${props.selectedCategoriesCount})`
)

const selectedCategoriesList = computed(() => selectedCategories?.value ?? [])
const categoriesList = computed(() => props.categories ?? {})

const isTimeFilterActive = computed(() => {
  return timeFilterStart.value !== 0 || timeFilterEnd.value !== MINUTES_PER_DAY
})

const hasAnyFilter = computed(() => {
  return selectedCategoriesList.value.length > 0 || isTimeFilterActive.value
})

// methods
const handleToggleCategory = (categoryId) => {
  calendarStore.toggleCategory(categoryId)
}

const handleClearAllFilters = () => {
  calendarStore.resetFilter()
}
</script>

<style lang="scss">
@use '~/assets/css/breakpoints' as *;

.FilterPanel {
  display: flex;
  flex-direction: column;
  height: 100%;

  @include mobile {
    height: 100dvh;
  }

  &-tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--color-border);
    overflow: hidden;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;

    @include mobile {
      border-radius: 0;
    }
  }

  &-tab {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-sm);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-light);
    background-color: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;

    &:hover:not(.FilterPanel-tab--active) {
      color: var(--color-text);
    }

    &--active {
      background-color: var(--brand-dark-green);
      color: var(--chip-text-white);
      border-bottom-color: var(--brand-dark-green);
    }

    @include mobile {
      padding: var(--spacing-md) var(--spacing-sm);
      font-size: var(--font-size-md);
    }
  }

  &-panels {
    padding: var(--spacing-lg);
    min-height: 320px;
    overflow-y: auto;

    @include mobile {
      flex: 1;
      overflow-y: auto;
    }
  }

  &-panel {
    &--categories {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
      row-gap: calc((var(--spacing-sm) + var(--spacing-md)) / 2);
    }

    &--hours {
      padding: var(--spacing-sm) 0;
    }
  }

  &-footer {
    padding: var(--spacing-lg);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border);

    @include mobile {
      display: flex;
      gap: var(--spacing-sm);
      align-items: center;
    }
  }

  &-clearAllButton {
    width: 100%;
    padding: 0 var(--spacing-md);
    height: var(--control-height);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--brand-dark-green);
    background-color: transparent;
    border: 2px solid var(--brand-dark-green);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);

    &:hover:not(:disabled) {
      background-color: var(--brand-dark-green);
      color: var(--chip-text-white);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    @include mobile {
      flex: 1;
      height: var(--section-header-height);
      font-size: var(--font-size-md);
    }
  }

  &-clearButtonIcon {
    flex-shrink: 0;
  }

  &-doneButton {
    display: none;

    @include mobile {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      flex: 1;
      padding: 0 var(--spacing-md);
      height: var(--section-header-height);
      font-size: var(--font-size-md);
      font-weight: 600;
      color: var(--chip-text-white);
      background-color: var(--brand-dark-green);
      border: 2px solid var(--brand-dark-green);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 0.9;
      }
    }
  }

  &-doneButtonIcon {
    @include mobile {
      flex-shrink: 0;
    }
  }
}
</style>
