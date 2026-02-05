<template>
  <div class="App">
    <router-view />
    <EventModal v-if="isEventModalShowing" />
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useUiStore } from './stores/ui.store'
import EventModal from './components/EventModal.vue'

const uiStore = useUiStore()
const { isEventModalShowing } = storeToRefs(uiStore)
</script>

<style lang="scss">
.App {
  min-height: 100vh;
}
</style>
