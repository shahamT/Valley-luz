<template>
  <div class="App">
    <AppHeader />
    <main class="App__main">
      <router-view />
    </main>
    <EventModal v-if="isEventModalShowing" />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUiStore } from './stores/ui.store'
import AppHeader from './components/AppHeader.vue'
import EventModal from './components/EventModal.vue'

const uiStore = useUiStore()
const { isEventModalShowing } = storeToRefs(uiStore)
</script>

<style lang="scss">
.App {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  &__main {
    flex: 1;
  }
}
</style>
