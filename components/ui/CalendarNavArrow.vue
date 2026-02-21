<template>
  <button
    type="button"
    class="CalendarNavArrow"
    :class="{ 'CalendarNavArrow--disabled': disabled }"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @click="$emit('click')"
  >
    <UiIcon :name="iconName" size="md" />
  </button>
</template>

<script setup>
const props = defineProps({
  direction: {
    type: String,
    required: true,
    validator: (v) => ['prev', 'next'].includes(v),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  ariaLabel: {
    type: String,
    required: true,
  },
})

defineEmits(['click'])

const iconName = computed(() =>
  props.direction === 'prev' ? 'chevron_right' : 'chevron_left'
)
</script>

<style lang="scss">
.CalendarNavArrow {
  width: var(--control-height);
  height: var(--control-height);
  border-radius: 50%;
  border: none;
  background-color: var(--light-bg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-dark-green);
  transition: background-color 0.2s ease;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background-color: var(--day-cell-hover-bg);
  }

  &:disabled,
  &--disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }
}
</style>
