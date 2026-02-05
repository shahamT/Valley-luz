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
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #ffffff;
  background-image: linear-gradient(
    135deg,
    rgba(128, 220, 218, 0.5),
    rgba(133, 200, 75, 0.5)
  );

  &__content {
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
