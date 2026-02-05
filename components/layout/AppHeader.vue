<template>
  <header class="AppHeader">
    <img src="/logos/valleyluz-logo.png" alt="Valley Luz" class="AppHeader__logo" />
  </header>
</template>

<script setup>
// AppHeader component - logo only
</script>

<style lang="scss">
.AppHeader {
  padding: var(--spacing-md);
  background-color: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: flex-start;

  &__logo {
    height: 3rem;
    width: auto;
    object-fit: contain;
  }
}
</style>
