<template>
  <div class="AppShell">
    <LayoutAppHeader />
    <div class="AppShell-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'AppShell' })
</script>

<style lang="scss">
@use '~/assets/css/breakpoints' as *;

.AppShell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background);
  background-image: linear-gradient(
    135deg,
    var(--gradient-bg-start),
    var(--gradient-bg-end)
  );

  &-content {
    flex: 1;
    min-height: 0;
    min-width: 0;
    max-width: var(--content-max-width);
    width: 100%;
    margin: 0 auto;
    padding: var(--spacing-xl);
    padding-inline: var(--spacing-3xl);
    display: flex;
    flex-direction: column;

    @include mobile {
      padding-inline: 0;
      padding-block: var(--spacing-md);
      padding-bottom: calc(var(--spacing-md) - var(--spacing-sm));
    }
  }
}
</style>
