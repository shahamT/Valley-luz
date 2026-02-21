<template>
  <LayoutAppShell>
    <div class="NotFoundPage">
      <h1>404</h1>
      <p>{{ UI_TEXT.notFound }}</p>
      <button @click="goToMonthly" class="NotFoundPage-button">
        {{ UI_TEXT.backToMonthly }}
      </button>
    </div>
  </LayoutAppShell>
</template>

<script setup>
import { UI_TEXT, ROUTE_MONTHLY_VIEW } from '~/consts/calendar.const'

defineOptions({ name: 'NotFoundPage' })

// methods
const goToMonthly = () => {
  navigateTo(ROUTE_MONTHLY_VIEW)
}
</script>

<style lang="scss">
.NotFoundPage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  gap: var(--spacing-lg);

  h1 {
    font-size: var(--font-size-4xl);
    color: var(--color-text);
  }

  p {
    font-size: var(--font-size-lg);
    color: var(--color-text-light);
  }

  &-button {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-primary);
    color: var(--color-background);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--font-size-base);
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--color-primary-dark);
    }
  }
}
</style>
