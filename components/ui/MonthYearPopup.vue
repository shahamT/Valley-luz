<template>
  <div
    ref="popupRef"
    class="MonthYearPopup"
    @click.stop
  >
    <UiMonthYearSelection
      :current-date="currentDate"
      @select="handleSelect"
      @year-change="handleYearChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

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

const handleSelect = (data) => {
  emit('select', data)
  emit('close')
}

const handleYearChange = (data) => {
  emit('year-change', data)
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
