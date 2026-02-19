<template>
  <span
    class="Icon"
    :class="[`Icon--${size}`, { 'Icon--waiting': !iconFontReady }]"
    :style="{ color: color }"
  >
    <template v-if="iconFontReady">{{ name }}</template>
  </span>
</template>

<script setup>
defineOptions({ name: 'Icon' })

const { iconFontReady } = useIconFontReady()

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value),
  },
  color: {
    type: String,
    default: 'currentColor',
  },
})
</script>

<style lang="scss">
.Icon {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 1.5rem;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
  user-select: none;

  &--xs {
    font-size: 1rem;
  }

  &--sm {
    font-size: 1.25rem;
  }

  &--md {
    font-size: 1.5rem;
  }

  &--lg {
    font-size: 2rem;
  }

  &--xl {
    font-size: 2.5rem;
  }

  &.Icon--waiting {
    min-width: 1em;
    min-height: 1em;
  }
}
</style>
