<template>
  <div class="DailySchedule">
    <h1>Daily Schedule</h1>
    <div class="DailySchedule__actions">
      <button @click="navigateToMonthly" class="DailySchedule__button">
        Go to Monthly View
      </button>
      <button @click="openModal" class="DailySchedule__button">
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

const navigateToMonthly = () => {
  router.push({ name: 'monthly-view' })
}

const openModal = () => {
  uiStore.openEventModal('event-456')
}
</script>

<style lang="scss">
.DailySchedule {
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
