<template>
  <div
    ref="popupRef"
    class="MonthYearPopup"
    @click.stop
  >
    <UiMonthYearPicker
      :year="currentDate.year"
      :month="currentDate.month"
      @select="handlePickerSelect"
      @year-change="handlePickerYearChange"
    />
  </div>
</template>

<script setup>
defineOptions({ name: 'MonthYearPopup' })

const props = defineProps({
  currentDate: {
    type: Object,
    required: true,
  },
  triggerElement: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close', 'select', 'year-change'])

const popupRef = ref(null)

const handlePickerSelect = (year, month) => {
  emit('select', { year, month })
  emit('close')
}

const handlePickerYearChange = (year) => {
  emit('year-change', { year })
}

onClickOutside(
  popupRef,
  () => {
    emit('close')
  },
  {
    ignore: [props.triggerElement],
  }
)
</script>

<style lang="scss">
.MonthYearPopup {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  background-color: var(--light-bg, #f2fbf8);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  z-index: var(--z-index-modal);
}
</style>
