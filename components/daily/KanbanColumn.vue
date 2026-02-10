<template>
  <div class="KanbanColumn" :class="{ 'KanbanColumn--center': isCenter }">
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
  isCenter: {
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
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);

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
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--spacing-md);
    min-height: 0;
  }

  &-empty {
    text-align: center;
    color: var(--color-text-light);
    font-size: var(--font-size-sm);
    padding: var(--spacing-lg);
  }
}
</style>
