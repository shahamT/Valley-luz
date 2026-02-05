<template>
  <div class="MonthlySchedule">
    <h1>Monthly Schedule</h1>
    <div class="MonthlySchedule__actions">
      <button @click="navigateToDaily" class="MonthlySchedule__button">
        Go to Daily View
      </button>
      <button @click="openModal" class="MonthlySchedule__button">
        Open Event Modal (Test)
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUiStore } from '../stores/ui.store'

const router = useRouter()
const uiStore = useUiStore()

const navigateToDaily = () => {
  router.push({ name: 'daily-view' })
}

const openModal = () => {
  uiStore.openEventModal('event-123')
}
</script>

<style lang="scss">
.MonthlySchedule {
  padding: var(--spacing-xl);

  &__actions {
    display: flex;
    gap: var(--spacing-md);
    margin-top: var(--spacing-lg);
  }

  &__button {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-primary);
    color: var(--color-background);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--color-primary-dark);
    }
  }
}
</style>
