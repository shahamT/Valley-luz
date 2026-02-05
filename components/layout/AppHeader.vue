<template>
  <header class="AppHeader">
    <img src="/logos/valleyluz-logo.png" alt="Valley Luz" class="AppHeader-logo" />
  </header>
</template>

<script setup>
// AppHeader component - logo only
</script>

<style lang="scss">
.AppHeader {
  height: var(--header-height);
  padding: var(--spacing-md);
  background-color: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;

  &-logo {
    height: 3rem;
    width: auto;
    object-fit: contain;
  }
}
</style>
