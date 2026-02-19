<template>
  <div class="EventModal-infoBar">
    <div class="EventModal-infoItem">
      <UiIcon name="location_on" size="md" color="var(--brand-dark-green)" class="EventModal-infoIcon" />
      <div class="EventModal-infoContent">
        <span>{{ basicLocation }}</span>
        <button
          v-if="hasLocationDetails"
          type="button"
          class="EventModal-moreInfoButton"
          @click="toggleLocationPopup"
        >
          {{ MODAL_TEXT.locationMoreInfo }}
        </button>
      </div>
    </div>
    <div class="EventModal-infoDivider" />
    <div class="EventModal-infoItem">
      <UiIcon name="schedule" size="md" color="var(--brand-dark-green)" class="EventModal-infoIcon" />
      <span>{{ eventTime }}</span>
    </div>
    <div class="EventModal-infoDivider" />
    <div class="EventModal-infoItem">
      <UiIcon name="confirmation_number" size="md" color="var(--brand-dark-green)" class="EventModal-infoIcon" />
      <span :class="{ 'EventModal-priceUnknown': isPriceUnknown }">{{ eventPrice }}</span>
    </div>
  </div>

  <!-- Location Info Popup -->
  <Teleport to="body">
    <UiLocationInfoPopup
      v-if="isLocationPopupOpen"
      :full-location="formattedLocation"
      @close="isLocationPopupOpen = false"
    />
  </Teleport>
</template>

<script setup>
import { MODAL_TEXT } from '~/consts/ui.const'
import { PRICE_UNKNOWN_TEXT } from '~/utils/events.helpers'

defineOptions({ name: 'EventModalInfoBar' })

const props = defineProps({
  basicLocation: {
    type: String,
    required: true,
  },
  eventTime: {
    type: String,
    required: true,
  },
  eventPrice: {
    type: String,
    required: true,
  },
  hasLocationDetails: {
    type: Boolean,
    default: false,
  },
  formattedLocation: {
    type: String,
    required: true,
  },
})

const isPriceUnknown = computed(() => props.eventPrice === PRICE_UNKNOWN_TEXT)
const isLocationPopupOpen = ref(false)

const toggleLocationPopup = () => {
  isLocationPopupOpen.value = !isLocationPopupOpen.value
}
</script>

<style lang="scss">
.EventModal {
  &-infoBar {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: stretch;
    background-color: var(--color-surface);
    padding: var(--spacing-md) var(--spacing-lg);
    gap: var(--spacing-md);

    @media (max-width: 768px) {
      padding: var(--spacing-md);
      flex-direction: column;
      align-items: stretch;
      gap: var(--spacing-sm);
    }
  }

  &-infoItem {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: var(--spacing-sm);
    flex: 1;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-secondary);
    text-align: center;

    @media (max-width: 768px) {
      flex-direction: row;
      align-items: flex-start;
      text-align: right;
      flex: none;
      font-size: var(--font-size-base);
      gap: var(--spacing-md);
    }
  }

  &-infoIcon {
    @media (max-width: 768px) {
      font-size: 1.375rem !important;
      margin-top: 4px;
    }
  }

  &-infoContent {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);

    @media (max-width: 768px) {
      align-items: flex-start;
    }
  }

  &-moreInfoButton {
    background: none;
    border: none;
    color: var(--brand-dark-green);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.7;
    }
  }

  &-infoDivider {
    width: 1px;
    background-color: var(--color-border);
    align-self: stretch;

    @media (max-width: 768px) {
      width: 100%;
      height: 1px;
    }
  }

  &-priceUnknown {
    color: var(--color-text-muted);
  }
}
</style>
