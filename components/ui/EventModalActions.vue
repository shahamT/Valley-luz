<template>
  <div class="EventModal-actions">
    <div v-if="calendarStartDate" class="EventModal-actionBar">
      <button
        ref="calendarButtonRef"
        type="button"
        class="EventModal-calendarButton"
        @click="toggleCalendarPopup"
      >
        <UiIcon name="event_available" size="sm" />
        {{ MODAL_TEXT.addToCalendar }}
      </button>
      <button
        type="button"
        class="EventModal-navigateButton"
        disabled
      >
        <UiIcon name="directions" size="sm" />
        {{ MODAL_TEXT.navigateToEvent }}
      </button>
    </div>
  </div>

  <!-- Calendar Options Popup -->
  <Teleport to="body">
    <UiCalendarOptionsPopup
      v-if="isCalendarPopupOpen && calendarButtonRef && event"
      :trigger-element="calendarButtonRef"
      :calendar-options="CALENDAR_OPTIONS"
      :event-name="event.title"
      @close="isCalendarPopupOpen = false"
      @select="handleCalendarSelect"
    />
  </Teleport>
</template>

<script setup>
import { handleCalendarSelection } from '~/utils/calendar.service'
import { MODAL_TEXT, CALENDAR_OPTIONS } from '~/consts/ui.const'

defineOptions({ name: 'EventModalActions' })

const props = defineProps({
  calendarStartDate: {
    type: String,
    default: '',
  },
  event: {
    type: Object,
    default: null,
  },
  eventDescription: {
    type: String,
    default: '',
  },
  formattedLocation: {
    type: String,
    default: '',
  },
  calendarStartTime: {
    type: String,
    default: '',
  },
  calendarEndDate: {
    type: String,
    default: '',
  },
  calendarEndTime: {
    type: String,
    default: '',
  },
})

const isCalendarPopupOpen = ref(false)
const calendarButtonRef = ref(null)

const toggleCalendarPopup = () => {
  isCalendarPopupOpen.value = !isCalendarPopupOpen.value
}

const handleCalendarSelect = async (calendarType) => {
  const eventData = {
    title: props.event?.title || '',
    description: props.eventDescription,
    location: props.formattedLocation,
    startDate: props.calendarStartDate,
    startTime: props.calendarStartTime,
    endDate: props.calendarEndDate,
    endTime: props.calendarEndTime,
  }
  await handleCalendarSelection(calendarType, eventData)
}
</script>

<style lang="scss">
.EventModal {
  &-actions {
    @media (max-width: 768px) {
      flex-shrink: 0;
    }
  }

  &-actionBar {
    background-color: var(--color-background);
    padding: var(--spacing-md) var(--spacing-lg);
    border-top: 1px solid var(--color-border);
    display: flex;
    gap: var(--spacing-md);
    position: sticky;
    bottom: 0;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);

    @media (max-width: 768px) {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: var(--spacing-md);
      padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom, 0));
      border-top: 1px solid var(--color-border);
      box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
      gap: var(--spacing-sm);
      border-radius: 0;
      z-index: 10;
    }
  }

  &-calendarButton {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: var(--color-primary);
    color: var(--chip-text-white);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
      background-color: color-mix(in srgb, var(--color-primary) 85%, black);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  &-navigateButton {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: var(--brand-dark-green);
    color: var(--chip-text-white);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover:not(:disabled) {
      background-color: color-mix(in srgb, var(--brand-dark-green) 85%, black);
    }

    &:active:not(:disabled) {
      transform: scale(0.98);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
