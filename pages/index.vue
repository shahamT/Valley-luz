<template>
  <LayoutAppShell>
    <div class="IndexRedirect">
      <UiLoader size="md" />
    </div>
  </LayoutAppShell>
</template>

<script setup>
import { ROUTE_MONTHLY_VIEW } from '~/consts/calendar.const'

defineOptions({ name: 'IndexRedirect' })

// lifecycle
onMounted(() => {
  navigateTo(ROUTE_MONTHLY_VIEW, { replace: true })
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
