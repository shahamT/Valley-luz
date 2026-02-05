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
  height: 100vh;
  overflow: hidden;
}
</style>
