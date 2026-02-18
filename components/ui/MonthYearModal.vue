<template>
  <Teleport to="body">
    <div
      class="MonthYearModal"
      @click.self="handleClose"
    >
      <div class="MonthYearModal-content">
        <div class="MonthYearModal-header">
          <h2 class="MonthYearModal-title">בחרו חודש ושנה</h2>
          <button
            class="MonthYearModal-closeButton"
            @click="handleClose"
            aria-label="סגור"
          >
            <UiIcon name="close" size="md" />
          </button>
        </div>
        <UiMonthYearPicker
          :year="currentDate.year"
          :month="currentDate.month"
          @select="handlePickerSelect"
          @year-change="handlePickerYearChange"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineOptions({ name: 'MonthYearModal' })

const props = defineProps({
  currentDate: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close', 'select', 'year-change'])

const handleClose = () => {
  emit('close')
}

const handlePickerSelect = (year, month) => {
  emit('select', { year, month })
  emit('close')
}

const handlePickerYearChange = (year) => {
  emit('year-change', { year })
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
  padding: 0;

  &-content {
    position: relative;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    border-radius: 0;
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: column;
    background-color: var(--light-bg, #f2fbf8);
  }

  &-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);

    @media (max-width: 768px) {
      margin-bottom: var(--spacing-sm);
      padding-bottom: var(--spacing-sm);
    }
  }

  &-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  &-closeButton {
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
}
</style>
