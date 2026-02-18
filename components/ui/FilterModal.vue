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
        <UiFilterPanel
          :selected-categories-count="selectedCategoriesCount"
          :hours-filter-label="hoursFilterLabel"
          @close="handleClose"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { UI_TEXT } from '~/consts/calendar.const'

defineOptions({ name: 'FilterModal' })

defineProps({
  selectedCategoriesCount: {
    type: Number,
    default: 0,
  },
  hoursFilterLabel: {
    type: String,
    default: () => UI_TEXT.hoursFilterAll,
  },
})

const emit = defineEmits(['close'])

const title = UI_TEXT.filterButtonLabel

const handleClose = () => {
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
    min-width: 420px;
    max-width: var(--modal-max-width);
    max-height: 100%;
    border-radius: var(--radius-lg);
    padding: 0;
    display: flex;
    flex-direction: column;
    background-color: var(--light-bg, #f2fbf8);
    margin: var(--spacing-lg);

    @media (max-width: 768px) {
      min-width: 0;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      border-radius: 0;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-rows: auto 1fr auto;
    }
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);

    @media (max-width: 768px) {
      display: none;
    }
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

}
</style>
