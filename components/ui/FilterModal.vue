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
          :on-close="handleClose"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { UI_TEXT } from '~/consts/calendar.const'

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

  &-tabs {
    display: flex;
    gap: 0;
    background-color: var(--light-bg);
    border-bottom: 2px solid var(--color-border);
    overflow: hidden;
  }

  &-tab {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-light);
    background-color: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;

    &:hover {
      color: var(--color-text);
    }

    &--active {
      background-color: var(--brand-dark-green);
      color: var(--chip-text-white);
      border-bottom-color: var(--brand-dark-green);
    }
  }

  &-panels {
    padding: var(--spacing-lg);
    min-height: 320px;
    overflow-y: auto;
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

  &-footer {
    padding: var(--spacing-lg);
    padding-top: 0;
    border-top: 1px solid var(--color-border);
  }

  &-clearAllButton {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
    background-color: transparent;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: border-color 0.2s ease, color 0.2s ease;

    &:hover {
      border-color: var(--brand-dark-green);
      color: var(--brand-dark-green);
    }
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
