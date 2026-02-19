<template>
  <div
    class="DayCell"
    :class="{
      'DayCell--outside': day.isOutsideMonth,
      'DayCell--past': isPast,
      'DayCell--today': isToday,
      'DayCell--no-events': day.eventsCount === 0 && !day.isOutsideMonth && !isPast,
      'DayCell--weekend': isWeekend && !day.isOutsideMonth
    }"
    @click="!day.isOutsideMonth && !isPast && handleClick()"
  >
    <div class="DayCell-number">{{ day.dayNumber }}</div>
    <div v-if="!day.isOutsideMonth && day.eventsCount > 0" class="DayCell-events">
      <div
        v-for="(event, index) in displayEvents"
        :key="event.id || index"
        class="DayCell-chip"
        :class="{ 'DayCell-chip--more': event.isMore }"
        :style="event.isMore ? {} : { backgroundColor: getEventChipColor(event.mainCategory) }"
        v-tooltip="event.isMore ? undefined : (event.title || '')"
      >
        <span class="DayCell-chipText" :class="{ 'DayCell-chipText--more': event.isMore }">
          {{ event.isMore ? getMoreChipText() : (event.title || '') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getTodayDateString } from '~/utils/date.helpers'
import {
  getDisplayEvents,
  getAdditionalEventsCount,
  isWeekendDay,
  getCategoryColor,
  getMoreEventsText,
} from '~/utils/calendar-display.helpers'
import { DAY_CELL_BREAKPOINT } from '~/consts/ui.const'

defineOptions({ name: 'DayCell' })

const props = defineProps({
  day: {
    type: Object,
    required: true,
  },
})

// data
const { categories } = useCalendarViewData()
const { navigateToDay } = useCalendarNavigation()
const isMobile = useScreenWidth(DAY_CELL_BREAKPOINT)

// computed
const isPast = computed(() => {
  return !props.day.isOutsideMonth && props.day.dateString < getTodayDateString()
})

const isToday = computed(() => {
  return !props.day.isOutsideMonth && props.day.dateString === getTodayDateString()
})

const displayEvents = computed(() => {
  if (props.day.isOutsideMonth || props.day.eventsCount === 0) {
    return []
  }
  return getDisplayEvents(props.day.events, props.day.eventsCount, isMobile.value)
})

const additionalEventsCount = computed(() => {
  return getAdditionalEventsCount(props.day.eventsCount, isMobile.value)
})

const isWeekend = computed(() => {
  if (props.day.isOutsideMonth) {
    return false
  }
  return isWeekendDay(props.day.dateString)
})

// methods
const handleClick = () => {
  if (props.day.isOutsideMonth || isPast.value) return
  navigateToDay(props.day.dateString)
}

const getEventChipColor = (mainCategory) => {
  return getCategoryColor(mainCategory, categories.value)
}

const getMoreChipText = () => {
  return getMoreEventsText(additionalEventsCount.value, isMobile.value)
}
</script>

<style lang="scss">
.DayCell {
  background-color: var(--light-bg);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-card);
  padding: var(--spacing-sm);
  min-height: var(--calendar-day-size);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  position: relative;

  @media (max-width: 768px) {
    padding: 4px 2px;
    border-radius: 8px;
    min-height: 7rem;
  }

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

  &--past {
    opacity: 0.55;
    cursor: default;
    pointer-events: none;

    &:hover {
      transform: none;
      box-shadow: var(--shadow-card);
      background-color: var(--light-bg);
    }
  }

  &.DayCell--past.DayCell--weekend {
    &:hover {
      background-color: var(--weekend-day-bg);
    }
  }

  &--today .DayCell-number {
    color: var(--brand-light-green);
    font-weight: 700;
  }

  &--no-events {
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      background-color: var(--day-cell-hover-bg);
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

  &.DayCell--weekend.DayCell--no-events {
    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      background-color: var(--weekend-day-hover-bg);
    }
  }

  &--weekend:not(&--today) .DayCell-number {
    color: var(--brand-dark-blue);
  }

  &-number {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-light);
    line-height: 1;

    @media (max-width: 768px) {
      top: 4px;
      right: 6px;
    }
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

    @media (max-width: 768px) {
      top: calc(4px + 1.25rem);
      left: 2px;
      right: 2px;
      bottom: 4px;
    }
  }

  &-chip {
    padding: 0 6px;
    font-size: 0.6875rem;
    font-weight: 500;
    border-radius: 4px;
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
      font-size: 0.5625rem;
      padding: 0 4px;
      min-height: 18px;
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
      line-height: 18px;
      text-overflow: clip;
    }
  }
}
</style>
