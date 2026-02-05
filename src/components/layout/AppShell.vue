<template>
  <div class="AppShell">
    <AppHeader />
    <div class="AppShell__content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import AppHeader from './AppHeader.vue'
</script>

<style lang="scss">
.AppShell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  &__content {
    flex: 1;
    background: linear-gradient(to bottom, var(--gradient-start), var(--gradient-end));
    padding: var(--spacing-xl);
  }
}
</style>
