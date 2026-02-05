<template>
  <div class="App">
    <NuxtPage />
    <EventModal v-if="isEventModalShowing" />
  </div>
</template>

<script setup>
const uiStore = useUiStore()
const { isEventModalShowing } = storeToRefs(uiStore)
</script>

<style lang="scss">
.App {
  min-height: 100vh;
}
</style>
