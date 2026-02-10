<template>
  <div class="AppShell">
    <LayoutAppHeader
      :show-month-year="showMonthYear"
      :month-year="monthYear"
      :current-date="currentDate"
      @prev-month="$emit('prev-month')"
      @next-month="$emit('next-month')"
      @select-month-year="$emit('select-month-year', $event)"
      @year-change="$emit('year-change', $event)"
    />
    <div class="AppShell-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  showMonthYear: {
    type: Boolean,
    default: false,
  },
  monthYear: {
    type: String,
    default: '',
  },
  currentDate: {
    type: Object,
    default: () => ({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    }),
  },
})

defineEmits(['prev-month', 'next-month', 'select-month-year', 'year-change'])
</script>

<style lang="scss">
.AppShell {
  min-height: 100vh;
  background-color: var(--color-background);
  background-image: linear-gradient(
    135deg,
    var(--gradient-bg-start),
    var(--gradient-bg-end)
  );

  &-content {
    max-width: var(--content-max-width);
    width: 100%;
    margin: 0 auto;
    padding: var(--spacing-xl);
    padding-inline: var(--spacing-3xl);
    padding-top: calc(var(--header-height) + var(--spacing-xl));
    display: flex;
    flex-direction: column;
  }
}
</style>
