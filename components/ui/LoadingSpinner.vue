<template>
  <div class="LoadingSpinner">
    <UiIcon :name="icon" :size="size" class="LoadingSpinner-icon" />
    <p v-if="message" class="LoadingSpinner-message">{{ message }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  icon: {
    type: String,
    default: 'autorenew',
  },
  size: {
    type: String,
    default: 'xl',
  },
  message: {
    type: String,
    default: '',
  },
})
</script>

<style lang="scss">
.LoadingSpinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  height: 100%;
  color: var(--color-text-light);

  &-icon {
    animation: spin 1.5s linear infinite;
  }

  &-message {
    font-size: var(--font-size-lg);
    margin: 0;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
