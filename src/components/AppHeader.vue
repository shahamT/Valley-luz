<template>
  <header class="AppHeader">
    <nav class="AppHeader__nav">
      <router-link :to="{ name: 'monthly-view' }" class="AppHeader__link">
        Monthly View
      </router-link>
      <router-link :to="{ name: 'daily-view' }" class="AppHeader__link">
        Daily View
      </router-link>
    </nav>
  </header>
</template>

<script setup>
// AppHeader component - placeholder navigation
</script>

<style lang="scss">
.AppHeader {
  padding: var(--spacing-md);
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);

  &__nav {
    display: flex;
    gap: var(--spacing-lg);
  }

  &__link {
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--color-border);
    }

    &.router-link-active {
      background-color: var(--color-primary);
      color: var(--color-background);
    }
  }
}
</style>
