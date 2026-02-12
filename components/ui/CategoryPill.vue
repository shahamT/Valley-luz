<template>
  <button
    class="CategoryPill"
    :class="{ 'CategoryPill--selected': isSelected }"
    :style="pillStyle"
    @click="$emit('click')"
  >
    <span class="CategoryPill-label">{{ category.label }}</span>
  </button>
</template>

<script setup>
const props = defineProps({
  category: {
    type: Object,
    required: true,
  },
  categoryId: {
    type: String,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])

const pillStyle = computed(() => {
  const categoryColor = props.category.color
  if (props.isSelected) {
    return {
      backgroundColor: categoryColor,
      color: 'var(--chip-text-white)',
      borderColor: categoryColor,
    }
  }
  return {
    backgroundColor: 'var(--light-bg)',
    color: 'var(--color-text-light)',
    borderColor: categoryColor,
    opacity: 1,
  }
})
</script>

<style lang="scss">
.CategoryPill {
  border: 2px solid;
  border-radius: var(--pill-radius);
  padding: 0.375rem var(--pill-padding-x);
  font-size: var(--font-size-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
  opacity: 0.9;

  &:hover {
    opacity: 1;
    transform: translateY(-1px);
  }

  &--selected {
    opacity: 1;
  }

  &-label {
    font-weight: 500;
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    font-size: var(--font-size-md);
    padding: 0.5rem var(--pill-padding-x);
  }
}
</style>
