<template>
  <div class="KanbanColumn" :class="{ 'KanbanColumn--disabled': isDisabled }">
    <div class="KanbanColumn-header">
      <h2 class="KanbanColumn-title">{{ formattedDate }}</h2>
    </div>
    <div class="KanbanColumn-events">
      <DailyKanbanEventCard
        v-for="event in events"
        :key="event.id"
        :event="event"
      />
      <div v-if="events.length === 0" class="KanbanColumn-empty">
        אין אירועים
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatKanbanDateHeader } from '~/utils/date.helpers'

const props = defineProps({
  date: {
    type: String,
    required: true,
  },
  events: {
    type: Array,
    default: () => [],
  },
  isDisabled: {
    type: Boolean,
    default: false,
  },
})

const formattedDate = computed(() => {
  return formatKanbanDateHeader(props.date)
})
</script>

<style lang="scss">
.KanbanColumn {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);

  &--disabled {
    opacity: 0.55;
    pointer-events: none;
    filter: saturate(0.7);
  }

  &-header {
    background-color: var(--brand-dark-green);
    color: var(--chip-text-white);
    padding: var(--spacing-md);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  &-title {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--chip-text-white);
    margin: 0;
    text-align: center;
  }

  &-events {
    flex: none; // Don't stretch, size based on content
    overflow: visible; // Allow content to determine height
    padding: var(--spacing-md);
  }

  &-empty {
    text-align: center;
    color: var(--color-text-light);
    font-size: var(--font-size-sm);
    padding: var(--spacing-lg);
  }
}
</style>
