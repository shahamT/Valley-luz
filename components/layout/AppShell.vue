<template>
  <div class="AppShell">
    <LayoutAppHeader />
    <div class="AppShell__content">
      <slot />
    </div>
  </div>
</template>

<script setup>
// AppHeader is auto-imported by Nuxt
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
