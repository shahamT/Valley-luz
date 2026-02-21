<template>
  <LayoutAppShell>
    <div class="IndexRedirect">
      <UiLoader size="md" />
    </div>
  </LayoutAppShell>
</template>

<script setup>
defineOptions({ name: 'IndexRedirect' })

// lifecycle
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
