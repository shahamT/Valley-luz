<template>
  <LayoutAppShell>
    <div class="IndexRedirect">
      <UiLoader size="md" />
    </div>
  </LayoutAppShell>
</template>

<script setup>
// Redirect root to monthly view (default)
onMounted(() => {
  navigateTo('/monthly-view', { replace: true })
})
</script>

<style lang="scss">
.IndexRedirect {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
