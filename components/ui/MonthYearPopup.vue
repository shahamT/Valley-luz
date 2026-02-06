<template>
  <Teleport to="body">
    <div
      v-if="!isMobile"
      class="MonthYearPopup"
      @click.self="handleClose"
    >
      <div
        ref="popupRef"
        class="MonthYearPopup-content"
        :style="popupStyle"
      >
        <UiMonthYearPicker
          :year="currentYear"
          :month="currentMonth"
          @select="handleSelect"
        />
      </div>
    </div>
    <div
      v-else
      class="MonthYearPopup MonthYearPopup--mobile"
      @click.self="handleClose"
    >
      <div
        ref="popupRef"
        class="MonthYearPopup-content MonthYearPopup-content--mobile"
      >
        <UiMonthYearPicker
          :year="currentYear"
          :month="currentMonth"
          @select="handleSelect"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'

const props = defineProps({
  currentYear: {
    type: Number,
    required: true,
  },
  currentMonth: {
    type: Number,
    required: true,
  },
  triggerElement: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'select'])

const popupRef = ref(null)
const popupStyle = ref({})

const isMobile = computed(() => {
  if (process.client) {
    return window.innerWidth <= 768
  }
  return false
})

const updatePosition = async () => {
  if (isMobile.value || !props.triggerElement?.value || !popupRef.value) {
    return
  }

  await nextTick()

  const triggerRect = props.triggerElement.value.getBoundingClientRect()
  const popupRect = popupRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Position below the trigger, aligned to the right (RTL)
  let top = triggerRect.bottom + 8
  let right = viewportWidth - triggerRect.right

  // Adjust if popup would overflow viewport
  if (top + popupRect.height > viewportHeight) {
    top = triggerRect.top - popupRect.height - 8
  }

  if (right + popupRect.width > viewportWidth) {
    right = viewportWidth - triggerRect.left - popupRect.width
  }

  popupStyle.value = {
    top: `${top}px`,
    right: `${right}px`,
  }
}

const handleClose = () => {
  emit('close')
}

const handleSelect = (year, month) => {
  emit('select', year, month)
}

const handleClickOutside = (event) => {
  if (popupRef.value && !popupRef.value.contains(event.target)) {
    if (props.triggerElement?.value && !props.triggerElement.value.contains(event.target)) {
      handleClose()
    }
  }
}

watch(() => props.triggerElement, () => {
  if (props.triggerElement?.value) {
    updatePosition()
  }
}, { immediate: true })

onMounted(() => {
  if (process.client) {
    updatePosition()
    window.addEventListener('resize', updatePosition)
    document.addEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  if (process.client) {
    window.removeEventListener('resize', updatePosition)
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style lang="scss">
.MonthYearPopup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-index-modal);
  pointer-events: none;

  // Desktop: no backdrop, just positioning container
  @media (min-width: 769px) {
    background: transparent;
  }

  &--mobile {
    background-color: var(--modal-backdrop-bg);
    pointer-events: all;
    display: flex;
    align-items: flex-end;
    padding: 0;
  }

  &-content {
    position: fixed;
    background-color: var(--color-background);
    border-radius: var(--radius-lg);
    padding: var(--spacing-md);
    box-shadow: var(--shadow-lg);
    min-width: 280px;
    pointer-events: all;
    z-index: calc(var(--z-index-modal) + 1);

    &--mobile {
      position: relative;
      width: 100%;
      max-width: 100%;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      padding: var(--spacing-lg);
    }
  }
}
</style>
