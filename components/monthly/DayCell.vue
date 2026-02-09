<template>
  <div
    class="DayCell"
    :class="{ 
      'DayCell--outside': day.isOutsideMonth,
      'DayCell--no-events': day.eventsCount === 0 && !day.isOutsideMonth,
      'DayCell--weekend': isWeekend && !day.isOutsideMonth
    }"
    @click="!day.isOutsideMonth && handleClick()"
  >
    <div class="DayCell-number">{{ day.dayNumber }}</div>
    <div v-if="!day.isOutsideMonth && day.eventsCount > 0" class="DayCell-events">
      <div
        v-for="(event, index) in displayEvents"
        :key="event.id || index"
        class="DayCell-chip"
        :class="{ 'DayCell-chip--more': event.isMore }"
        :style="event.isMore ? {} : { backgroundColor: getEventChipColor(event.mainCategory) }"
      >
        <span class="DayCell-chipText" :class="{ 'DayCell-chipText--more': event.isMore }">
          {{ event.isMore ? getMoreChipText() : (event.title || '') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  getDisplayEvents,
  getAdditionalEventsCount,
  isWeekendDay,
  getCategoryColor,
  getMoreEventsText,
} from '~/utils/calendar-display.helpers'

const props = defineProps({
  day: {
    type: Object,
    required: true,
  },
})

const categoriesStore = useCategoriesStore()

const isMobile = useScreenWidth(920)

const displayEvents = computed(() => {
  if (props.day.isOutsideMonth || props.day.eventsCount === 0) {
    return []
  }
  return getDisplayEvents(props.day.events, props.day.eventsCount)
})

const additionalEventsCount = computed(() => {
  return getAdditionalEventsCount(props.day.eventsCount)
})

const isWeekend = computed(() => {
  if (props.day.isOutsideMonth) {
    return false
  }
  return isWeekendDay(props.day.dateString)
})

const handleClick = () => {
  if (props.day.eventsCount > 0) {
    navigateTo(`/daily-view/${props.day.dateString}`)
  }
}

const getEventChipColor = (mainCategory) => {
  return getCategoryColor(mainCategory, categoriesStore.categories)
}

const getMoreChipText = () => {
  return getMoreEventsText(additionalEventsCount.value, isMobile.value)
}
</script>

<style lang="scss">
.DayCell {
  background-color: var(--card-bg);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-card);
  padding: var(--spacing-sm);
  min-height: var(--calendar-day-size);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    background-color: var(--day-cell-hover-bg);
  }

  &--outside {
    background-color: var(--calendar-day-outside-bg);
    opacity: 0.6;
    cursor: default;
    pointer-events: none;
  }

  &--no-events {
    cursor: default;

    &:hover {
      transform: none;
      box-shadow: var(--shadow-card);
      background-color: var(--card-bg);
    }
  }

  &--weekend {
    background-color: var(--weekend-day-bg);
  }

  &--weekend:not(&--no-events) {
    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      background-color: var(--weekend-day-hover-bg);
    }
  }

  &--weekend#{&}--no-events {
    &:hover {
      transform: none !important;
      box-shadow: var(--shadow-card) !important;
      background-color: var(--weekend-day-bg) !important;
    }
  }

  &-number {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-light);
    line-height: 1;
  }

  &-events {
    position: absolute;
    top: calc(var(--spacing-sm) + 1.25rem);
    left: var(--spacing-sm);
    right: var(--spacing-sm);
    bottom: var(--spacing-xs);
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    overflow: hidden;
  }

  &-chip {
    padding: 0 6px;
    font-size: 0.6875rem;
    font-weight: 500;
    border-radius: 0.5rem;
    color: var(--chip-text-white);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;

    &--more {
      background-color: var(--chip-more-bg);
      color: var(--color-text);
      overflow: visible;
      text-overflow: clip;
      white-space: normal;
    }

    @media (max-width: 768px) {
      text-overflow: clip;
    }
  }

  &-chipText {
    display: block;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: inherit;
    text-align: center;
    line-height: 20px;

    &--more {
      overflow: visible;
      text-overflow: clip;
      white-space: normal;
    }

    @media (max-width: 768px) {
      text-overflow: clip;
    }
  }
}
</style>
