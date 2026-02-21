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
const ogImageUrl = new URL('/galiluz-thumbnail.png', requestUrl.origin).href
const socialTitle = 'גלילו"ז'
const socialDescription = 'גלילו״ז – יומן אירועים ופעילויות בגליל ובגולן. גלו מה קורה בצפון.'

useSeoMeta({
  title: socialTitle,
  description: socialDescription,
  ogTitle: socialTitle,
  ogDescription: socialDescription,
  ogImage: ogImageUrl,
  ogType: 'website',
  ogUrl: requestUrl.href,
  twitterCard: 'summary_large_image',
  twitterTitle: socialTitle,
  twitterDescription: socialDescription,
  twitterImage: ogImageUrl,
})
</script>
