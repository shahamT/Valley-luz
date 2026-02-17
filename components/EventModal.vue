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
            <div class="EventModal-headerActions">
              <button
                v-if="canShare"
                type="button"
                class="EventModal-shareButton"
                :aria-label="MODAL_TEXT.share"
                @click="handleShare"
              >
                <UiIcon name="share" size="lg" />
              </button>
              <button @click="closeModal" class="EventModal-closeButton" :aria-label="MODAL_TEXT.close">
                <UiIcon name="close" size="lg" />
              </button>
            </div>
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

  <!-- Image Full-Size Popup -->
  <Teleport to="body">
    <UiImagePopup
      v-if="isImagePopupOpen && eventContentImage"
      :image-url="eventContentImage"
      :alt-text="selectedEvent.title"
      @close="closeImagePopup"
    />
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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

const isImagePopupOpen = ref(false)

const canShare = ref(false)
onMounted(() => {
  if (import.meta.client && navigator.share) {
    canShare.value = true
  }
})

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

const hasEventImage = computed(() => {
  const media = selectedEvent.value?.media
  return media && media.length > 0
})

const eventContentImage = computed(() => {
  if (!hasEventImage.value) return null
  const media = selectedEvent.value.media
  const firstMedia = media[0]
  return typeof firstMedia === 'string' ? firstMedia : firstMedia?.url || null
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
  isImagePopupOpen.value = false
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
      url: typeof window !== 'undefined' ? window.location.href : '',
      text: selectedEvent.value.shortDescription || selectedEvent.value.title,
    })
  } catch (e) {
    if (e.name !== 'AbortError') {
      // User cancelled or share failed; no feedback required
    }
  }
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
      padding-bottom: calc(70px + env(safe-area-inset-bottom, 0));
    }
  }
  
  &-actions {
    @media (max-width: 768px) {
      flex-shrink: 0;
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

  &-headerActions {
    position: absolute;
    top: var(--spacing-md);
    left: 0;
    right: 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-inline: var(--spacing-md);
    z-index: 10;
  }

  [dir='rtl'] &-headerActions {
    flex-direction: row-reverse;
  }

  &-shareButton,
  &-closeButton {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--chip-text-white);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s ease;
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
    padding: var(--spacing-lg) var(--spacing-lg) 0 var(--spacing-lg);

    @media (max-width: 768px) {
      padding: var(--spacing-md) var(--spacing-md) 0 var(--spacing-md);
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
      color: #25D366;
      border-color: #25D366;

      &:hover:not(:disabled) {
        background-color: #25D366;
        color: var(--chip-text-white);
        border-color: #25D366;
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
