<template>
  <div v-if="isEventModalShowing" class="EventModal" @click.self="handleBackdropClick">
    <div class="EventModal__content">
      <div class="EventModal__header">
        <h2>Event Modal</h2>
        <button @click="closeModal" class="EventModal__close" aria-label="Close modal">
          ×
        </button>
      </div>
      <div class="EventModal__body">
        <p>Selected Event ID: <strong>{{ selectedEventId || 'None' }}</strong></p>
        <p>This is a placeholder modal component.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUiStore } from '../stores/ui.store'

const uiStore = useUiStore()
const { isEventModalShowing, selectedEventId } = storeToRefs(uiStore)

const closeModal = () => {
  uiStore.closeEventModal()
}

const handleBackdropClick = () => {
  closeModal()
}
</script>

<style lang="scss">
.EventModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  &__content {
    background-color: var(--color-background);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }

  &__close {
    background: none;
    border: none;
    font-size: var(--font-size-3xl);
    line-height: 1;
    cursor: pointer;
    color: var(--color-text-light);
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover {
      background-color: var(--color-surface);
      color: var(--color-text);
    }
  }

  &__body {
    p {
      margin-bottom: var(--spacing-md);
    }
  }
}
</style>
