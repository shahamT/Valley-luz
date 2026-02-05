<template>
  <button class="PillButton">
    <span class="PillButton-label">{{ label }}</span>
    <span v-if="count !== undefined" class="PillButton-count">({{ count }})</span>
  </button>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  count: {
    type: Number,
    default: undefined,
  },
})
</script>

<style lang="scss">
.PillButton {
  background-color: var(--pill-bg);
  color: var(--pill-text);
  border: none;
  border-radius: var(--pill-radius);
  padding: var(--pill-padding-y) var(--pill-padding-x);
  font-size: var(--font-size-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }

  &-label {
    font-weight: 500;
  }

  &-count {
    opacity: 0.9;
  }
}
</style>
