<template>
  <div class="App">
    <NuxtPage />
    <EventModal v-if="isEventModalShowing" />
  </div>
</template>

<script setup>
const uiStore = useUiStore()
const { isEventModalShowing } = storeToRefs(uiStore)

const requestUrl = useRequestURL()
const ogImageUrl = new URL('/logos/galiluz-logo.svg', requestUrl.origin).href
useSeoMeta({
  ogImage: ogImageUrl,
  twitterImage: ogImageUrl,
  twitterCard: 'summary_large_image',
})
</script>
