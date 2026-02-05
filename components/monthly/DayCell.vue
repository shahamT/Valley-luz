<template>
  <div
    class="DayCell"
    :class="{ 
      'DayCell--outside': isOutsideMonth,
      'DayCell--no-events': eventsCount === 0 && !isOutsideMonth
    }"
    @click="handleClick"
  >
    <div class="DayCell-number">{{ dayNumber }}</div>
    <div v-if="eventsCount > 0" class="DayCell-badge">
      <UiIcon name="event_available" size="lg" color="var(--brand-light-green)" />
    </div>
    <div v-if="eventsCount > 0" class="DayCell-dots">
      <span
        v-for="i in Math.min(eventsCount, 4)"
        :key="i"
        class="DayCell-dot"
      ></span>
      <UiIcon
        v-if="eventsCount > 4"
        name="add"
        size="xs"
        color="var(--brand-dark-blue)"
        class="DayCell-plusIcon"
      />
    </div>
  </div>
</template>

<script setup>
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

const handleClick = () => {
  if (!props.isOutsideMonth && props.eventsCount > 0) {
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

    &:hover {
      background-color: var(--day-cell-hover-bg);
    }
  }

  &--no-events {
    cursor: default;

    &:hover {
      transform: none;
      box-shadow: var(--shadow-card);
      background-color: var(--card-bg);
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

  &-badge {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &-dots {
    position: absolute;
    bottom: var(--spacing-md);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  &-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: var(--brand-dark-blue);
  }

  &-plusIcon {
    margin-left: var(--spacing-xs);
  }
}
</style>
