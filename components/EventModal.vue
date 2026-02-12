<template>
  <!-- TODO: Event detail flow not yet wired. Wire DayCell/KanbanEventCard clicks to openEventModal and display full event details. -->
  <div v-if="isEventModalShowing" class="EventModal" @click.self="closeModal">
    <div class="EventModal-content">
      <div class="EventModal-header">
        <h2>{{ MODAL_TEXT.title }}</h2>
        <button @click="closeModal" class="EventModal-close" aria-label="Close modal">
          ×
        </button>
      </div>
      <div class="EventModal-body">
        <p>Selected Event ID: <strong>{{ selectedEventId || MODAL_TEXT.noEventSelected }}</strong></p>
        <p>{{ MODAL_TEXT.placeholder }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { MODAL_TEXT } from '~/consts/ui.const'

const uiStore = useUiStore()
const { isEventModalShowing, selectedEventId } = storeToRefs(uiStore)

const closeModal = () => {
  uiStore.closeEventModal()
}
</script>

<style lang="scss">
.EventModal {
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

  &-content {
    background-color: var(--color-background);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    max-width: var(--modal-max-width);
    width: var(--modal-width);
    max-height: var(--modal-max-height);
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }

  &-close {
    background: none;
    border: none;
    font-size: var(--font-size-3xl);
    line-height: 1;
    cursor: pointer;
    color: var(--color-text-light);
    padding: 0;
    width: var(--modal-close-size);
    height: var(--modal-close-size);
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

  &-body {
    p {
      margin-bottom: var(--spacing-md);
    }
  }
}
</style>
