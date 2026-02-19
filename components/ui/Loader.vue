<template>
  <div
    class="Loader"
    :class="sizeClass"
    role="status"
    aria-label="Loading"
  />
</template>

<script setup>
defineOptions({ name: 'Loader' })

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
})

const sizeClass = computed(() => `Loader--${props.size}`)
</script>

<style lang="scss">
.Loader {
  width: 100px;
  aspect-ratio: 1;
  display: grid;
  --loader-scale: 1;

  &--sm {
    width: 60px;
    --loader-scale: 0.6;
  }

  &--md {
    width: 100px;
    --loader-scale: 1;
  }

  &--lg {
    width: 140px;
    --loader-scale: 1.4;
  }

  &::before,
  &::after {
    content: "";
    grid-area: 1 / 1;
    --c: no-repeat radial-gradient(farthest-side, var(--brand-dark-green) 92%, #0000);
    background:
      var(--c) 50% 0,
      var(--c) 50% 100%,
      var(--c) 100% 50%,
      var(--c) 0 50%;
    background-size: calc(12px * var(--loader-scale)) calc(12px * var(--loader-scale));
    animation: Loader-spin 1s infinite;
  }

  &::before {
    margin: calc(4px * var(--loader-scale));
    --c: no-repeat radial-gradient(farthest-side, var(--brand-dark-blue) 92%, #0000);
    background-size: calc(8px * var(--loader-scale)) calc(8px * var(--loader-scale));
    animation-timing-function: linear;
  }
}

@keyframes Loader-spin {
  100% {
    transform: rotate(0.5turn);
  }
}
</style>
