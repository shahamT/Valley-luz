<template>
  <div
    class="DayCell"
    :class="{ 'DayCell--outside': isOutsideMonth }"
    @click="handleClick"
  >
    <div class="DayCell-number">{{ dayNumber }}</div>
    <div v-if="eventsCount > 0" class="DayCell-badge">
      {{ getEventsCountText(eventsCount) }}
    </div>
  </div>
</template>

<script setup>
import { UI_TEXT } from '~/consts/calendar.const'

const props = defineProps({
  dayNumber: {
    type: Number,
    required: true,
  },
  isOutsideMonth: {
    type: Boolean,
    default: false,
  },
  eventsCount: {
    type: Number,
    default: 0,
  },
  dateString: {
    type: String,
    required: true,
  },
})

const getEventsCountText = (count) => {
  return UI_TEXT.eventsCount(count)
}

const handleClick = () => {
  if (!props.isOutsideMonth) {
    navigateTo(`/daily-view/${props.dateString}`)
  }
}
</script>

<style lang="scss">
.DayCell {
  background-color: var(--card-bg);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-card);
  padding: var(--spacing-md);
  min-height: var(--calendar-day-size);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &--outside {
    background-color: var(--calendar-day-outside-bg);
    opacity: 0.6;
  }

  &-number {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
    align-self: flex-start;
    margin-bottom: auto;
    margin-top: 0;
  }

  &-badge {
    background-color: var(--event-badge-bg);
    color: var(--event-badge-text);
    font-size: 0.75rem;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-sm);
    margin-top: auto;
    text-align: center;
    font-weight: 500;
  }
}
</style>
