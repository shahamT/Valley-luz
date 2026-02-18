<template>
  <!-- Mobile: Full screen modal -->
  <div
    v-if="isMobile"
    class="CalendarOptionsPopup-modal"
    @click.self="emit('close')"
  >
    <div class="CalendarOptionsPopup-content">
      <div class="CalendarOptionsPopup-header">
        <div class="CalendarOptionsPopup-titleWrapper">
          <div class="CalendarOptionsPopup-titleLabel">הוסיפו ליומן את</div>
          <h2 class="CalendarOptionsPopup-title">{{ eventName }}</h2>
        </div>
        <button
          class="CalendarOptionsPopup-closeButton"
          @click="emit('close')"
          aria-label="סגור"
        >
          <UiIcon name="close" size="md" />
        </button>
      </div>
      <div class="CalendarOptionsPopup-options">
        <template v-for="(option, index) in calendarOptions" :key="option.id">
          <button
            type="button"
            class="CalendarOptionsPopup-option"
            @click="handleOptionClick(option.id)"
          >
            <img
              :src="option.iconPath"
              :alt="option.label"
              class="CalendarOptionsPopup-icon"
            />
            <span class="CalendarOptionsPopup-label">{{ option.label }}</span>
          </button>
          <div
            v-if="index < calendarOptions.length - 1"
            class="CalendarOptionsPopup-divider"
          />
        </template>
      </div>
    </div>
  </div>

  <!-- Desktop: Popup above button -->
  <div
    v-else
    ref="popupRef"
    class="CalendarOptionsPopup"
    :style="popupStyle"
    @click.stop
  >
    <button
      v-for="option in calendarOptions"
      :key="option.id"
      type="button"
      class="CalendarOptionsPopup-option"
      @click="handleOptionClick(option.id)"
    >
      <img
        :src="option.iconPath"
        :alt="option.label"
        class="CalendarOptionsPopup-icon"
      />
      <span class="CalendarOptionsPopup-label">{{ option.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { MOBILE_BREAKPOINT } from '~/consts/ui.const'
import { logger } from '~/utils/logger'

defineOptions({ name: 'CalendarOptionsPopup' })

const props = defineProps({
  triggerElement: {
    type: Object,
    required: true,
  },
  calendarOptions: {
    type: Array,
    required: true,
  },
  eventName: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['close', 'select'])

const popupRef = ref(null)
const popupStyle = ref({})

const isMobile = useScreenWidth(MOBILE_BREAKPOINT)

onMounted(async () => {
  await nextTick()
  
  // Only calculate positioning for desktop
  if (!isMobile.value && props.triggerElement) {
    try {
      const rect = props.triggerElement.getBoundingClientRect()
      // Desktop: center above button
      popupStyle.value = {
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 8}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      }
    } catch (error) {
      logger.error('[CalendarOptionsPopup]', 'Error positioning popup:', error)
    }
  }
})

// Only use onClickOutside for desktop
onClickOutside(
  popupRef,
  () => {
    if (!isMobile.value) {
      emit('close')
    }
  },
  {
    ignore: [props.triggerElement],
  }
)

const handleOptionClick = (optionId) => {
  emit('select', optionId)
  emit('close')
}
</script>

<style lang="scss">
// Mobile: Centered compact modal
.CalendarOptionsPopup-modal {
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

.CalendarOptionsPopup-content {
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  background-color: var(--light-bg, #f2fbf8);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: 0;
  box-shadow: var(--shadow-lg);
}

.CalendarOptionsPopup-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.CalendarOptionsPopup-titleWrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.CalendarOptionsPopup-titleLabel {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text);
}

.CalendarOptionsPopup-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.CalendarOptionsPopup-closeButton {
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

.CalendarOptionsPopup-options {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.CalendarOptionsPopup-divider {
  height: 1px;
  background-color: var(--color-border);
  margin: var(--spacing-xs) 0;
}

// Desktop: Popup above button
.CalendarOptionsPopup {
  background-color: var(--light-bg, #f2fbf8);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs);
  box-shadow: var(--shadow-lg);
  min-width: 240px;
  z-index: calc(var(--z-index-modal) + 10);
  direction: ltr;
}

// Shared option styles (both mobile and desktop)
.CalendarOptionsPopup-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: left;
  direction: ltr;
  
  &:hover {
    background-color: var(--color-hover, rgba(0, 0, 0, 0.05));
  }
  
  &:active {
    background-color: var(--color-active, rgba(0, 0, 0, 0.1));
  }
}

.CalendarOptionsPopup-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  object-fit: contain;
}

.CalendarOptionsPopup-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-primary);
  white-space: nowrap;
}

// Mobile-specific option styles
.CalendarOptionsPopup-modal {
  .CalendarOptionsPopup-option {
    padding: var(--spacing-md);
  }
  
  .CalendarOptionsPopup-icon {
    width: 28px;
    height: 28px;
  }
  
  .CalendarOptionsPopup-label {
    font-size: var(--font-size-base);
  }
}
</style>
