<template>
  <Teleport to="body">
    <div v-if="isEventModalShowing" class="EventModal" @click.self="closeModal">
      <div class="EventModal-content" :class="{'EventModal-content--mobile': isMobile}">
        <div v-if="!selectedEvent" class="EventModal-notFoundWrapper">
          <p class="EventModal-notFound">{{ MODAL_TEXT.noEventSelected }}</p>
        </div>
        <template v-else>
          <!-- Disclaimer Note (Above Header for all screens) -->
          <div class="EventModal-disclaimer">
            <span class="EventModal-disclaimerText">פרטי האירוע מגיעים מהמפרסם ועוברים עיבוד ב AI - אין לנו אחריות על מהימנות ודיוק הפרטים.</span>
          </div>

          <!-- Image Header with Overlay -->
          <div class="EventModal-imageHeader">
            <img :src="eventImage" :alt="selectedEvent.title" class="EventModal-image" />
            <div class="EventModal-imageOverlay" />
            <button @click="closeModal" class="EventModal-closeButton" :aria-label="MODAL_TEXT.close">
              <UiIcon name="close" size="lg" />
            </button>
            <div class="EventModal-headerContent">
              <h1 class="EventModal-eventTitle">{{ selectedEvent.title }}</h1>
              <div v-if="selectedEvent.categories?.length" class="EventModal-categories">
                <span
                  v-for="categoryId in selectedEvent.categories"
                  :key="categoryId"
                  class="EventModal-categoryChip"
                  :style="{ backgroundColor: getCategoryColor(categoryId, categories) }"
                >
                  {{ getCategoryLabel(categoryId) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Scrollable Body -->
          <div class="EventModal-body">
            <!-- Info Bar (Location, Time, Price) -->
            <div class="EventModal-infoBar">
              <div class="EventModal-infoItem">
                <UiIcon name="location_on" size="md" color="var(--brand-dark-green)" class="EventModal-infoIcon" />
                <div class="EventModal-infoContent">
                  <span>{{ basicLocation }}</span>
                  <button
                    v-if="hasLocationDetails"
                    ref="locationButtonRef"
                    type="button"
                    class="EventModal-moreInfoButton"
                    @click="toggleLocationPopup"
                  >
                    למידע נוסף
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
                <span>{{ eventPrice }}</span>
              </div>
            </div>

            <!-- Description Section -->
            <div v-if="eventDescription" class="EventModal-descriptionSection">
              <p class="EventModal-description">{{ eventDescription }}</p>
            </div>

            <!-- Links Section (if exists) -->
            <div v-if="selectedEvent.urls?.length" class="EventModal-linksSection">
              <a
                v-for="(url, index) in selectedEvent.urls"
                :key="index"
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="EventModal-linkButton"
              >
                {{ MODAL_TEXT.linkButton }} {{ index + 1 }}
              </a>
            </div>

            <!-- Contact Publisher Button (always visible) -->
            <div class="EventModal-contactSection">
              <a
                v-if="selectedEvent.publisherPhone"
                :href="whatsappLink"
                target="_blank"
                rel="noopener noreferrer"
                class="EventModal-contactButton"
              >
                <img src="/icons/whatsapp-icon.svg" alt="WhatsApp" class="EventModal-whatsappIcon" />
                {{ MODAL_TEXT.contactPublisher }}
              </a>
              <button
                v-else
                disabled
                class="EventModal-contactButton EventModal-contactButton--disabled"
              >
                <img src="/icons/whatsapp-icon.svg" alt="WhatsApp" class="EventModal-whatsappIcon" />
                {{ MODAL_TEXT.contactPublisher }}
              </button>
            </div>
          </div>

          <!-- Fixed Actions Bar -->
          <div class="EventModal-actions">
            <!-- Action Bar - Bottom Buttons -->
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
        </template>
      </div>
    </div>
  </Teleport>

  <!-- Calendar Options Popup -->
  <Teleport to="body">
    <UiCalendarOptionsPopup
      v-if="isCalendarPopupOpen && calendarButtonRef && selectedEvent"
      :trigger-element="calendarButtonRef"
      :calendar-options="CALENDAR_OPTIONS"
      :event-name="selectedEvent.title"
      @close="isCalendarPopupOpen = false"
      @select="handleCalendarSelect"
    />
  </Teleport>

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
import { ref, computed, watch, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { getCategoryColor } from '~/utils/calendar-display.helpers'
import { formatEventTime, formatEventPrice } from '~/utils/events.helpers'
import { handleCalendarSelection } from '~/utils/calendar.service'
import { MODAL_TEXT, CALENDAR_OPTIONS, MOBILE_BREAKPOINT } from '~/consts/ui.const'

// data
const uiStore = useUiStore()
const { isEventModalShowing, selectedEventId } = storeToRefs(uiStore)
const { events, categories } = useCalendarViewData()

const isCalendarPopupOpen = ref(false)
const calendarButtonRef = ref(null)

const isLocationPopupOpen = ref(false)
const locationButtonRef = ref(null)

// computed
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= MOBILE_BREAKPOINT
})

// Lock body scroll when modal is open
watch(isEventModalShowing, (isShowing) => {
  if (typeof document === 'undefined') return
  
  if (isShowing) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}, { immediate: true })

// Cleanup on unmount
onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

const selectedEvent = computed(() => {
  if (!selectedEventId.value || !events.value) return null
  return events.value.find((event) => event.id === selectedEventId.value) || null
})

const selectedOccurrence = computed(() => {
  return selectedEvent.value?.occurrences?.[0] || null
})

const eventImage = computed(() => {
  const media = selectedEvent.value?.media
  if (media && media.length > 0) {
    const firstMedia = media[0]
    return typeof firstMedia === 'string' ? firstMedia : firstMedia?.url || '/imgs/default-event-bg.webp'
  }
  return '/imgs/default-event-bg.webp'
})

const eventTime = computed(() => {
  if (!selectedOccurrence.value) return ''
  return formatEventTime(selectedOccurrence.value)
})

const eventPrice = computed(() => {
  if (!selectedEvent.value) return ''
  return formatEventPrice(selectedEvent.value)
})

const eventDescription = computed(() => {
  if (!selectedEvent.value) return ''
  return (
    selectedEvent.value.fullDescription ||
    selectedEvent.value.shortDescription ||
    selectedEvent.value.description ||
    ''
  )
})

const basicLocation = computed(() => {
  if (!selectedEvent.value?.location) return MODAL_TEXT.unknownLocation
  const loc = selectedEvent.value.location
  const parts = []
  if (loc.addressLine1) parts.push(loc.addressLine1)
  if (loc.addressLine2) parts.push(loc.addressLine2)
  if (loc.city) parts.push(loc.city)
  if (parts.length === 0) return MODAL_TEXT.unknownLocation
  return parts.join(', ')
})

const formattedLocation = computed(() => {
  if (!selectedEvent.value?.location) return MODAL_TEXT.unknownLocation
  const loc = selectedEvent.value.location
  const parts = []
  if (loc.addressLine1) parts.push(loc.addressLine1)
  if (loc.addressLine2) parts.push(loc.addressLine2)
  if (loc.city) parts.push(loc.city)
  if (parts.length === 0) return MODAL_TEXT.unknownLocation
  let result = parts.join(', ')
  if (loc.locationDetails) {
    result += `\n${loc.locationDetails}`
  }
  return result
})

const hasLocationDetails = computed(() => {
  return !!selectedEvent.value?.location?.locationDetails
})

const whatsappLink = computed(() => {
  if (!selectedEvent.value?.publisherPhone) return ''
  const cleanPhone = selectedEvent.value.publisherPhone.replace(/\D/g, '')
  return `https://wa.me/${cleanPhone}`
})

const calendarStartDate = computed(() => {
  if (!selectedOccurrence.value?.startTime) return ''
  const date = new Date(selectedOccurrence.value.startTime)
  return date.toISOString().split('T')[0]
})

const calendarStartTime = computed(() => {
  if (!selectedOccurrence.value?.startTime || !selectedOccurrence.value?.hasTime) return ''
  const date = new Date(selectedOccurrence.value.startTime)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
})

const calendarEndDate = computed(() => {
  if (!selectedOccurrence.value?.endTime) return calendarStartDate.value
  const date = new Date(selectedOccurrence.value.endTime)
  return date.toISOString().split('T')[0]
})

const calendarEndTime = computed(() => {
  if (!selectedOccurrence.value?.endTime || !selectedOccurrence.value?.hasTime) return ''
  const date = new Date(selectedOccurrence.value.endTime)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
})

const calendarTimeZone = computed(() => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
})

// methods
const closeModal = () => {
  uiStore.closeEventModal()
  isCalendarPopupOpen.value = false
  isLocationPopupOpen.value = false
}

const getCategoryLabel = (categoryId) => {
  return categories.value?.[categoryId]?.label ?? categoryId
}

const toggleCalendarPopup = () => {
  isCalendarPopupOpen.value = !isCalendarPopupOpen.value
}

const toggleLocationPopup = () => {
  isLocationPopupOpen.value = !isLocationPopupOpen.value
}

const handleCalendarSelect = async (calendarType) => {
  const eventData = {
    title: selectedEvent.value?.title || '',
    description: eventDescription.value,
    location: formattedLocation.value,
    startDate: calendarStartDate.value,
    startTime: calendarStartTime.value,
    endDate: calendarEndDate.value,
    endTime: calendarEndTime.value,
  }
  
  await handleCalendarSelection(calendarType, eventData)
}
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

  @media (max-width: 768px) {
    padding: 0;
    overflow-y: auto;
  }

  &-content {
    background-color: var(--color-background);
    border-radius: var(--radius-lg);
    max-width: 600px;
    width: 90%;
    box-shadow: var(--shadow-lg);
    position: relative;
    direction: rtl;

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
    }
  }
  
  &-actions {
    @media (max-width: 768px) {
      flex-shrink: 0;
      background-color: var(--color-background);
      border-top: 1px solid var(--color-border);
      box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
      padding-bottom: env(safe-area-inset-bottom, 0);
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

  &-imageHeader {
    position: relative;
    min-height: 180px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    @media (max-width: 768px) {
      min-height: 160px;
    }
  }

  &-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &-imageOverlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(11, 151, 74, 0.75);
  }

  &-closeButton {
    position: absolute;
    top: var(--spacing-md);
    right: var(--spacing-md);
    background: none;
    border: none;
    cursor: pointer;
    color: var(--chip-text-white);
    padding: 0;
    width: var(--modal-close-size);
    height: var(--modal-close-size);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-sm);
    transition: background-color 0.2s ease;
    z-index: 10;
    font-weight: 700;

    &:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }
  }

  &-headerContent {
    position: relative;
    margin-top: auto;
    padding: var(--spacing-lg);
    padding-top: 80px;
    z-index: 5;

    @media (max-width: 768px) {
      padding: var(--spacing-md);
      padding-top: var(--spacing-lg);
    }
  }

  &-eventTitle {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--chip-text-white);
    margin: 0 0 var(--spacing-md) 0;
    line-height: 1.3;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  &-categories {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  &-categoryChip {
    padding: 0.2rem 0.5rem;
    font-size: 0.625rem;
    font-weight: 500;
    border-radius: 9999px;
    color: var(--chip-text-white);
    white-space: nowrap;

    @media (max-width: 768px) {
      font-size: 0.75rem;
      padding: 0.25rem 0.625rem;
    }
  }

  &-innerContent {
    direction: rtl;
  }

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
    color: #2c5aa0;
    line-height: 1.4;
    text-align: center;
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
    white-space: pre-line;
    margin: 0;
  }

  &-linksSection {
    background-color: var(--color-background);
    padding: var(--spacing-lg);
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--spacing-sm);

    @media (max-width: 768px) {
      padding: var(--spacing-md);
    }
  }

  &-linkButton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
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

    &:hover {
      background-color: var(--brand-dark-green);
      color: var(--chip-text-white);
      border-color: var(--brand-dark-green);
    }

    @media (max-width: 768px) {
      width: 100%;
    }
  }

  &-contactSection {
    background-color: var(--color-background);
    padding: 0 var(--spacing-lg) var(--spacing-lg);

    @media (max-width: 768px) {
      padding: 0 var(--spacing-md) var(--spacing-md);
    }
  }

  &-contactButton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: #25D366;
    color: var(--chip-text-white);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
    width: auto;
    cursor: pointer;

    &:hover:not(:disabled) {
      background-color: color-mix(in srgb, #25D366 85%, black);
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
    filter: brightness(0) invert(1);
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
      padding: var(--spacing-md);
      border-top: none;
      box-shadow: none;
      gap: var(--spacing-sm);
      border-radius: 0;
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
