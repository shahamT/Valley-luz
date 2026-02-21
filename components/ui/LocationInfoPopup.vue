<template>
  <!-- Mobile & Desktop: Centered compact modal -->
  <div
    class="LocationInfoPopup-modal"
    @click.self="emit('close')"
  >
    <div class="LocationInfoPopup-content">
      <div class="LocationInfoPopup-header">
        <h2 class="LocationInfoPopup-title">מיקום האירוע</h2>
        <button
          class="LocationInfoPopup-closeButton"
          @click="emit('close')"
          aria-label="סגור"
        >
          <UiIcon name="close" size="md" />
        </button>
      </div>
      <div class="LocationInfoPopup-body">
        <p class="LocationInfoPopup-text">{{ fullLocation }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'LocationInfoPopup' })

defineProps({
  fullLocation: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close'])
</script>

<style lang="scss">
// Centered compact modal
.LocationInfoPopup-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--modal-backdrop-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: calc(var(--z-index-modal) + 10);
  padding: var(--spacing-lg);
}

.LocationInfoPopup-content {
  width: 100%;
  max-width: var(--popup-max-width);
  background-color: var(--light-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow: var(--shadow-lg);
}

.LocationInfoPopup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.LocationInfoPopup-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.LocationInfoPopup-closeButton {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  transition: opacity 0.2s ease;
  border-radius: 50%;

  &:hover {
    opacity: 0.7;
    background-color: var(--day-cell-hover-bg);
  }
}

.LocationInfoPopup-body {
  display: flex;
  flex-direction: column;
}

.LocationInfoPopup-text {
  font-size: var(--font-size-base);
  color: var(--color-text);
  line-height: 1.6;
  white-space: pre-line;
  margin: 0;
  text-align: right;
  direction: rtl;
}
</style>
