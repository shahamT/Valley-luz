<template>
  <LayoutAppShell>
    <div class="ErrorPage">
      <div class="ErrorPage-content">
        <div class="ErrorPage-icon">
          <UiIcon name="error" size="xl" color="var(--color-error)" />
        </div>
        <h1 class="ErrorPage-title">
          {{ error.statusCode === 404 ? 'עמוד לא נמצא' : 'אירעה שגיאה' }}
        </h1>
        <p class="ErrorPage-message">{{ errorMessage }}</p>
        <div class="ErrorPage-actions">
          <button class="ErrorPage-button" @click="handleClearError">
            חזור לדף הבית
          </button>
        </div>
      </div>
    </div>
  </LayoutAppShell>
</template>

<script setup>
const props = defineProps({
  error: {
    type: Object,
    required: true,
  },
})

const errorMessage = computed(() => {
  if (props.error.statusCode === 404) {
    return 'הדף שחיפשת לא נמצא במערכת'
  }
  return props.error.message || 'משהו השתבש. אנא נסה שוב מאוחר יותר'
})

const handleClearError = () => {
  clearError({ redirect: '/' })
}
</script>

<style lang="scss">
.ErrorPage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--spacing-xl);

  &-content {
    text-align: center;
    max-width: 500px;
  }

  &-icon {
    margin-bottom: var(--spacing-lg);
  }

  &-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-text);
    margin-bottom: var(--spacing-md);
  }

  &-message {
    font-size: var(--font-size-lg);
    color: var(--color-text-light);
    margin-bottom: var(--spacing-xl);
    line-height: 1.6;
  }

  &-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
  }

  &-button {
    padding: var(--spacing-sm) var(--spacing-xl);
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--chip-text-white);
    background-color: var(--brand-dark-green);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.9;
    }
  }
}
</style>
