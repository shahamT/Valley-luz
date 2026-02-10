<template>
  <div class="KanbanView">
    <div class="KanbanView-headerRow">
      <button
        class="KanbanView-navButton KanbanView-navButton--prev"
        :disabled="isPrevDisabled"
        @click="$emit('prev')"
        aria-label="Previous day"
      >
        <UiIcon name="chevron_right" size="md" />
      </button>
      <div class="KanbanView-spacer"></div>
      <div class="KanbanView-spacer"></div>
      <button
        class="KanbanView-navButton KanbanView-navButton--next"
        @click="$emit('next')"
        aria-label="Next day"
      >
        <UiIcon name="chevron_left" size="md" />
      </button>
    </div>
    <div class="KanbanView-columns">
      <DailyKanbanColumn
        v-for="(date, index) in dates"
        :key="date"
        :date="date"
        :events="eventsByDate[date] || []"
        :is-center="index === centerIndex"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  dates: {
    type: Array,
    required: true,
  },
  eventsByDate: {
    type: Object,
    required: true,
  },
  isPrevDisabled: {
    type: Boolean,
    default: false,
  },
  centerIndex: {
    type: Number,
    default: 1,
  },
})

defineEmits(['prev', 'next'])
</script>

<style lang="scss">
.KanbanView {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  &-headerRow {
    display: grid;
    grid-template-columns: 34px 1fr 1fr 1fr 34px;
    gap: var(--spacing-md);
    align-items: center;
    margin-bottom: var(--spacing-sm);
    padding: 0 var(--spacing-sm);
  }

  &-spacer {
    width: 100%;
  }

  &-columns {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-lg);
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  &-navButton {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: none;
    background-color: var(--weekend-day-bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-dark-green);
    transition: background-color 0.2s ease;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      background-color: #D4E8C4;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }

    &--spacer {
      width: 34px;
      flex-shrink: 0;
    }
  }
}
</style>
