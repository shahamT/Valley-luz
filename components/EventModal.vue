<template>
  <Teleport to="body">
    <div v-if="isEventModalShowing" class="EventModal" @click.self="closeModal">
      <div class="EventModal-content" :class="{ 'EventModal-content--mobile': isMobile }">
        <div v-if="!selectedEvent" class="EventModal-notFoundWrapper">
          <p class="EventModal-notFound">{{ MODAL_TEXT.noEventSelected }}</p>
        </div>
        <template v-else>
          <!-- Disclaimer Note (Above Header for all screens) -->
          <div class="EventModal-disclaimer">
            <span class="EventModal-disclaimerText">{{ MODAL_TEXT.disclaimer }}</span>
          </div>

          <!-- Image Header -->
          <UiEventModalHeader
            :event="selectedEvent"
            :categories="categories"
            :event-image="eventImage"
            :can-share="canShare"
            @close="closeModal"
            @share="handleShare"
          />

          <!-- Scrollable Body -->
          <div class="EventModal-body">
            <!-- Info Bar (Location, Time, Price) -->
            <UiEventModalInfoBar
              :basic-location="basicLocation"
              :event-time="eventTime"
              :event-price="eventPrice"
              :has-location-details="hasLocationDetails"
              :formatted-location="formattedLocation"
            />

            <!-- Event Image Thumbnail (if exists) -->
            <div v-if="hasEventImage" class="EventModal-imageThumbSection">
              <div class="EventModal-imageThumb" @click="openImagePopup">
                <img :src="eventContentImage" :alt="selectedEvent.title" class="EventModal-thumbImage" />
              </div>
            </div>

            <!-- Description Section -->
            <div v-if="eventDescription" class="EventModal-descriptionSection">
              <div class="EventModal-description" v-html="eventDescription"></div>
            </div>

            <!-- Links & Contact Section -->
            <div v-if="selectedEvent.urls?.length || selectedEvent.publisherPhone" class="EventModal-linksSection">
              <a
                v-for="(link, index) in selectedEvent.urls"
                :key="index"
                :href="link.Url"
                target="_blank"
                rel="noopener noreferrer"
                class="EventModal-linkButton"
              >
                {{ link.Title }}
              </a>

              <!-- Contact Publisher Button -->
              <a
                v-if="selectedEvent.publisherPhone"
                :href="whatsappLink"
                target="_blank"
                rel="noopener noreferrer"
                class="EventModal-linkButton EventModal-linkButton--whatsapp"
              >
                <img src="/icons/whatsapp-icon.svg" alt="WhatsApp" class="EventModal-whatsappIcon" />
                {{ MODAL_TEXT.contactPublisher }}
              </a>
              <button
                v-else
                disabled
                class="EventModal-linkButton EventModal-linkButton--whatsapp EventModal-linkButton--disabled"
              >
                <img src="/icons/whatsapp-icon.svg" alt="WhatsApp" class="EventModal-whatsappIcon" />
                {{ MODAL_TEXT.contactPublisher }}
              </button>
            </div>
          </div>

          <!-- Actions Bar -->
          <UiEventModalActions
            :calendar-start-date="calendarStartDate"
            :event="selectedEvent"
            :event-description="eventDescription"
            :formatted-location="formattedLocation"
            :calendar-start-time="calendarStartTime"
            :calendar-end-date="calendarEndDate"
            :calendar-end-time="calendarEndTime"
          />
        </template>
      </div>
    </div>
  </Teleport>

  <!-- Image Full-Size Popup -->
  <Teleport to="body">
    <UiImagePopup
      v-if="isImagePopupOpen && eventContentImage"
      :image-url="eventContentImage"
      :alt-text="selectedEvent?.title"
      @close="closeImagePopup"
    />
  </Teleport>
</template>

<script setup>
import { MODAL_TEXT, MOBILE_BREAKPOINT } from '~/consts/ui.const'
import { useEventModalData } from '~/composables/useEventModalData'

defineOptions({ name: 'EventModal' })

// --- Store & data ---
const uiStore = useUiStore()
const { isEventModalShowing, selectedEventId } = storeToRefs(uiStore)
const { events, categories } = useCalendarViewData()

const isMobile = useScreenWidth(MOBILE_BREAKPOINT)
const isImagePopupOpen = ref(false)
const canShare = ref(false)

// --- Lifecycle ---
onMounted(() => {
  if (import.meta.client && navigator.share) {
    canShare.value = true
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
})

// --- Computed ---
const selectedEvent = computed(() => {
  if (!selectedEventId.value || !events.value) return null
  return events.value.find((event) => event.id === selectedEventId.value) || null
})

const selectedOccurrence = computed(() => {
  return selectedEvent.value?.occurrences?.[0] || null
})

const {
  eventImage,
  hasEventImage,
  eventContentImage,
  eventTime,
  eventPrice,
  eventDescription,
  basicLocation,
  formattedLocation,
  hasLocationDetails,
  whatsappLink,
  calendarStartDate,
  calendarStartTime,
  calendarEndDate,
  calendarEndTime,
} = useEventModalData(selectedEvent, selectedOccurrence)

// --- Methods ---
const closeModal = () => {
  uiStore.closeEventModal()
  isImagePopupOpen.value = false
}

const openImagePopup = () => {
  isImagePopupOpen.value = true
}

const closeImagePopup = () => {
  isImagePopupOpen.value = false
}

const handleShare = async () => {
  if (!navigator.share || !selectedEvent.value) return
  try {
    await navigator.share({
      title: selectedEvent.value.title,
      url: import.meta.client ? window.location.href : '',
      text: selectedEvent.value.shortDescription || selectedEvent.value.title,
    })
  } catch (e) {
    if (e.name !== 'AbortError') {
      // User cancelled or share failed; no feedback required
    }
  }
}

// --- Watchers ---
watch(isEventModalShowing, (isShowing) => {
  if (import.meta.server) return
  document.body.style.overflow = isShowing ? 'hidden' : ''
}, { immediate: true })
</script>

<style lang="scss">
.EventModal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--modal-backdrop-bg);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: var(--z-index-modal);
  padding: var(--spacing-lg);
  padding-top: var(--spacing-xl);
  overflow-y: auto;
  direction: ltr;

  /* Custom scrollbar styling (matching html scrollbar) */
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb-bg) var(--scrollbar-track-bg);

  &::-webkit-scrollbar {
    width: var(--scrollbar-width);
  }

  &::-webkit-scrollbar-track {
    background: var(--scrollbar-track-bg);
    border-radius: var(--scrollbar-border-radius);
    margin: var(--scrollbar-margin);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb-bg);
    border-radius: var(--scrollbar-border-radius);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-thumb-hover-bg);
  }

  @media (max-width: 768px) {
    padding: 0;
    overflow-y: auto;
  }

  &-content {
    direction: rtl;
    background-color: var(--color-background);
    border-radius: var(--radius-lg);
    max-width: 600px;
    width: 90%;
    box-shadow: var(--shadow-lg);
    position: relative;

    @media (max-width: 768px) {
      width: 100%;
      min-height: 100vh;
      border-radius: 0;
      display: flex;
      flex-direction: column;
    }

    &--mobile {
      @media (max-width: 768px) {
        height: 100vh;
      }
    }
  }

  &-body {
    @media (max-width: 768px) {
      flex: 1;
      padding-bottom: calc(70px + env(safe-area-inset-bottom, 0));
    }
  }

  &-notFoundWrapper {
    padding: var(--spacing-xl);
  }

  &-notFound {
    text-align: center;
    color: var(--color-text-light);
    padding: var(--spacing-xl);
  }

  &-disclaimer {
    background-color: rgba(173, 216, 230, 0.15);
    padding: var(--spacing-sm) var(--spacing-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--color-border);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;

    @media (max-width: 768px) {
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: 0;
    }
  }

  &-disclaimerText {
    font-size: 0.6875rem;
    color: var(--disclaimer-text);
    line-height: 1.4;
    text-align: center;
  }

  &-imageThumbSection {
    background-color: var(--color-background);
    padding: var(--spacing-lg);
    padding-bottom: 0;
    display: flex;
    justify-content: flex-start;

    @media (max-width: 768px) {
      padding: var(--spacing-md);
      padding-bottom: 0;
    }
  }

  &-imageThumb {
    max-height: 140px;
    max-width: 100%;
    display: inline-block;
    border-radius: var(--radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: box-shadow 0.2s ease, transform 0.2s ease;

    &:hover {
      box-shadow: var(--shadow-md);
      transform: scale(1.01);
    }
  }

  &-thumbImage {
    max-height: 140px;
    max-width: 100%;
    height: auto;
    width: auto;
    object-fit: contain;
    object-position: center;
    display: block;
    background-color: var(--color-surface);
  }

  &-descriptionSection {
    background-color: var(--color-background);
    padding: var(--spacing-lg);

    @media (max-width: 768px) {
      padding: var(--spacing-md);
    }
  }

  &-description {
    font-size: var(--font-size-base);
    color: var(--color-text);
    line-height: 1.6;
    margin: 0;

    // HTML content styles
    p {
      margin: 0 0 1em 0;

      &:last-child {
        margin-bottom: 0;
      }
    }

    ul, ol {
      margin: 0 0 1em 0;
      padding-right: 1.5em;
      padding-left: 0;

      &:last-child {
        margin-bottom: 0;
      }
    }

    li {
      margin-bottom: 0.5em;

      &:last-child {
        margin-bottom: 0;
      }
    }

    a {
      color: var(--color-primary);
      text-decoration: underline;

      &:hover {
        opacity: 0.8;
      }
    }

    strong, b {
      font-weight: 700;
    }

    em, i {
      font-style: italic;
    }

    h1, h2, h3, h4, h5, h6 {
      margin: 0 0 0.75em 0;
      font-weight: 700;
      color: var(--color-text);
      line-height: 1.4;

      &:last-child {
        margin-bottom: 0;
      }
    }

    h1 { font-size: var(--font-size-xl); }
    h2 { font-size: var(--font-size-lg); }
    h3, h4, h5, h6 { font-size: var(--font-size-base); }
  }

  &-linksSection {
    background-color: var(--color-background);
    padding: 0 var(--spacing-lg) var(--spacing-lg) var(--spacing-lg);
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--spacing-sm);

    @media (max-width: 768px) {
      padding: 0 var(--spacing-md) var(--spacing-md) var(--spacing-md);
    }
  }

  &-linkButton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: transparent;
    color: var(--brand-dark-green);
    border: 2px solid var(--brand-dark-green);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
    width: auto;
    cursor: pointer;

    &:hover:not(:disabled) {
      background-color: var(--brand-dark-green);
      color: var(--chip-text-white);
      border-color: var(--brand-dark-green);

      .EventModal-whatsappIcon {
        filter: brightness(0) invert(1);
      }
    }

    &--whatsapp {
      color: var(--whatsapp-green);
      border-color: var(--whatsapp-green);

      &:hover:not(:disabled) {
        background-color: var(--whatsapp-green);
        color: var(--chip-text-white);
        border-color: var(--whatsapp-green);
      }
    }

    &--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      width: 100%;
    }
  }

  &-whatsappIcon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    filter: invert(59%) sepia(89%) saturate(464%) hue-rotate(94deg) brightness(95%) contrast(87%);
  }
}
</style>
