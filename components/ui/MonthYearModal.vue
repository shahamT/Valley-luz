<template>
  <div
    v-if="isOpen"
    class="MonthYearModal"
    @click.self="handleClose"
  >
    <div class="MonthYearModal-content">
      <div class="MonthYearModal-header">
        <h2 class="MonthYearModal-title">בחר חודש ושנה</h2>
        <button
          @click="handleClose"
          class="MonthYearModal-close"
          aria-label="Close modal"
        >
          ×
        </button>
      </div>
      <div class="MonthYearModal-body">
        <UiMonthYearPicker
          :year="currentYear"
          :month="currentMonth"
          @select="handleSelect"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  currentYear: {
    type: Number,
    required: true,
  },
  currentMonth: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['close', 'select'])

const handleClose = () => {
  emit('close')
}

const handleSelect = (year, month) => {
  emit('select', year, month)
}
</script>

<style lang="scss">
.MonthYearModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--modal-backdrop-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal);
  padding: var(--spacing-md);

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-end;
  }

  &-content {
    background-color: var(--color-background);
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    max-width: var(--modal-max-width);
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;

    @media (max-width: 768px) {
      max-width: 100%;
      width: 100%;
      max-height: 100vh;
      height: 100vh;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      padding: var(--spacing-lg);
    }
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);
  }

  &-title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  &-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-text-light);
    padding: var(--spacing-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: background-color 0.2s ease, color 0.2s ease;
    width: 2rem;
    height: 2rem;

    &:hover {
      background-color: var(--color-surface);
      color: var(--color-text);
    }
  }

  &-body {
    flex: 1;
    min-height: 0;
  }
}
</style>
