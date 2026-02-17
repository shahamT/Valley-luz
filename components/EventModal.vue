<template>
  <Teleport to="body">
    <div v-if="isEventModalShowing" class="EventModal" @click.self="closeModal">
      <div class="EventModal-content">
        <div v-if="!selectedEvent" class="EventModal-notFoundWrapper">
          <p class="EventModal-notFound">{{ MODAL_TEXT.noEventSelected }}</p>
        </div>
        <template v-else>
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

          <!-- Inner Content Wrapper (for direction reset) -->
          <div class="EventModal-innerContent">
            <!-- Info Bar (Location, Time, Price) -->
            <div class="EventModal-infoBar">
              <div class="EventModal-infoItem">
                <UiIcon name="location_on" size="md" color="var(--brand-dark-green)" class="EventModal-infoIcon" />
                <span>{{ formattedLocation }}</span>
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

            <!-- Action Bar (Links, Calendar, Contact) -->
            <div class="EventModal-actionBar">
              <!-- Links -->
              <div v-if="selectedEvent.urls?.length" class="EventModal-linksWrapper">
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

              <!-- Add to Calendar -->
              <div class="EventModal-calendarButton">
                <add-to-calendar-button
                  :name="selectedEvent.title"
                  :description="eventDescription"
                  :location="formattedLocation"
                  :startDate="calendarStartDate"
                  :startTime="calendarStartTime"
                  :endDate="calendarEndDate"
                  :endTime="calendarEndTime"
                  :options="['Google', 'Apple', 'Outlook.com', 'iCal']"
                  :timeZone="calendarTimeZone"
                  :language="'he'"
                  buttonStyle="flat"
                  lightMode="bodyScheme"
                />
              </div>

              <!-- Contact Publisher -->
              <a
                v-if="selectedEvent.publisherPhone"
                :href="whatsappLink"
                target="_blank"
                rel="noopener noreferrer"
                class="EventModal-contactButton"
              >
                <UiIcon name="chat" size="sm" />
                {{ MODAL_TEXT.contactPublisher }}
              </a>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { getCategoryColor } from '~/utils/calendar-display.helpers'
import { formatEventTime, formatEventPrice } from '~/utils/events.helpers'
import { MODAL_TEXT } from '~/consts/ui.const'
import 'add-to-calendar-button'

// data
const uiStore = useUiStore()
const { isEventModalShowing, selectedEventId } = storeToRefs(uiStore)
const { events, categories } = useCalendarViewData()

// computed
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
}

const getCategoryLabel = (categoryId) => {
  return categories.value?.[categoryId]?.label ?? categoryId
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
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal);
  padding: var(--spacing-lg);

  @media (max-width: 768px) {
    padding: 0;
    align-items: flex-start;
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
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;

    @media (max-width: 768px) {
      min-height: 160px;
      border-radius: 0;
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

  &-actionBar {
    background-color: var(--color-background);
    padding: var(--spacing-md) var(--spacing-lg);
    border-top: 1px solid var(--color-border);
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    position: sticky;
    bottom: 0;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);

    @media (max-width: 768px) {
      padding: var(--spacing-md);
      position: relative;
      flex-direction: column;
    }
  }

  &-linksWrapper {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    flex: 1;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  &-linkButton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-surface);
    color: var(--color-primary);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--color-primary);
      color: var(--chip-text-white);
      border-color: var(--color-primary);
    }

    @media (max-width: 768px) {
      width: 100%;
    }
  }

  &-calendarButton {
    flex: 1;

    @media (max-width: 768px) {
      width: 100%;
    }
  }

  &-contactButton {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-lg);
    background-color: var(--brand-dark-green);
    color: var(--chip-text-white);
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--font-size-base);
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
    flex: 1;

    &:hover {
      background-color: color-mix(in srgb, var(--brand-dark-green) 85%, black);
    }

    @media (max-width: 768px) {
      width: 100%;
    }
  }
}
</style>
