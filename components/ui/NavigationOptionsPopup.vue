<template>
  <!-- Mobile: Centered compact modal -->
  <div
    v-if="isMobile"
    class="NavigationOptionsPopup-modal"
    @click.self="emit('close')"
  >
    <div class="NavigationOptionsPopup-content">
      <div class="NavigationOptionsPopup-header">
        <div class="NavigationOptionsPopup-titleWrapper">
          <div class="NavigationOptionsPopup-titleLabel">נווטו אל</div>
          <h2 class="NavigationOptionsPopup-title">{{ eventName }}</h2>
        </div>
        <button
          class="NavigationOptionsPopup-closeButton"
          @click="emit('close')"
          aria-label="סגור"
        >
          <UiIcon name="close" size="md" />
        </button>
      </div>
      <div class="NavigationOptionsPopup-options">
        <template v-for="(option, index) in navigationOptions" :key="option.id">
          <button
            type="button"
            class="NavigationOptionsPopup-option"
            @click="handleOptionClick(option.id)"
          >
            <img
              :src="option.iconPath"
              :alt="option.label"
              class="NavigationOptionsPopup-icon"
            />
            <span class="NavigationOptionsPopup-label">{{ option.label }}</span>
          </button>
          <div
            v-if="index < navigationOptions.length - 1"
            class="NavigationOptionsPopup-divider"
          />
        </template>
      </div>
    </div>
  </div>

  <!-- Desktop: Popup above button -->
  <div
    v-else
    ref="popupRef"
    class="NavigationOptionsPopup"
    :style="popupStyle"
    @click.stop
  >
    <button
      v-for="option in navigationOptions"
      :key="option.id"
      type="button"
      class="NavigationOptionsPopup-option"
      @click="handleOptionClick(option.id)"
    >
      <img
        :src="option.iconPath"
        :alt="option.label"
        class="NavigationOptionsPopup-icon"
      />
      <span class="NavigationOptionsPopup-label">{{ option.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { MOBILE_BREAKPOINT } from '~/consts/ui.const'
import { logger } from '~/utils/logger'

defineOptions({ name: 'NavigationOptionsPopup' })

const props = defineProps({
  triggerElement: {
    type: Object,
    required: true,
  },
  navigationOptions: {
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

  if (!isMobile.value && props.triggerElement) {
    try {
      const rect = props.triggerElement.getBoundingClientRect()
      popupStyle.value = {
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 8}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translateX(-50%)',
      }
    } catch (error) {
      logger.error('[NavigationOptionsPopup]', 'Error positioning popup:', error)
    }
  }
})

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
.NavigationOptionsPopup-modal {
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

.NavigationOptionsPopup-content {
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

.NavigationOptionsPopup-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.NavigationOptionsPopup-titleWrapper {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.NavigationOptionsPopup-titleLabel {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-text);
}

.NavigationOptionsPopup-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.NavigationOptionsPopup-closeButton {
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

.NavigationOptionsPopup-options {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.NavigationOptionsPopup-divider {
  height: 1px;
  background-color: var(--color-border);
  margin: var(--spacing-xs) 0;
}

.NavigationOptionsPopup {
  background-color: var(--light-bg, #f2fbf8);
  border-radius: var(--radius-md);
  padding: var(--spacing-xs);
  box-shadow: var(--shadow-lg);
  min-width: 240px;
  z-index: calc(var(--z-index-modal) + 10);
  direction: rtl;
}

.NavigationOptionsPopup-option {
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
  text-align: right;
  direction: rtl;

  &:hover {
    background-color: var(--color-hover, rgba(0, 0, 0, 0.05));
  }

  &:active {
    background-color: var(--color-active, rgba(0, 0, 0, 0.1));
  }
}

.NavigationOptionsPopup-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  object-fit: contain;
}

.NavigationOptionsPopup-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-primary);
  white-space: nowrap;
}

.NavigationOptionsPopup-modal {
  .NavigationOptionsPopup-option {
    padding: var(--spacing-md);
  }

  .NavigationOptionsPopup-icon {
    width: 28px;
    height: 28px;
  }

  .NavigationOptionsPopup-label {
    font-size: var(--font-size-base);
  }
}
</style>
