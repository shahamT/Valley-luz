<template>
  <div
    ref="popupRef"
    class="CategoriesPopup"
    @click.stop
  >
    <div class="CategoriesPopup-content">
      <button
        class="CategoriesPopup-resetButton"
        :class="{ 'CategoriesPopup-resetButton--disabled': !hasSelectedCategories }"
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
})

const emit = defineEmits(['close', 'toggle-category', 'reset-filter'])

const popupRef = ref(null)
const categoriesStore = useCategoriesStore()
const calendarStore = useCalendarStore()
const { selectedCategories } = storeToRefs(calendarStore)

const resetButtonText = UI_TEXT.resetFilter

const selectedCategoriesList = computed(() => selectedCategories?.value ?? [])
const categoriesList = computed(() => categoriesStore?.categories ?? {})

const hasSelectedCategories = computed(() => {
  return selectedCategoriesList.value.length > 0
})

const handleReset = () => {
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
.CategoriesPopup {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  background-color: var(--color-background);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  z-index: var(--z-index-modal);

  &-content {
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
