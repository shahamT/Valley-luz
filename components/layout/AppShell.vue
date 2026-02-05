<template>
  <div class="AppShell">
    <LayoutAppHeader />
    <div class="AppShell-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
// AppHeader is auto-imported by Nuxt
</script>

<style lang="scss">
.AppShell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #ffffff;
  background-image: linear-gradient(
    135deg,
    var(--gradient-bg-start),
    var(--gradient-bg-end)
  );

  &-content {
    flex: 1;
    max-width: var(--content-max-width);
    width: 100%;
    margin: 0 auto;
    padding: var(--spacing-xl);
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
}
</style>
