<template>
  <div class="KanbanColumn" :class="{ 'KanbanColumn--disabled': isDisabled }">
    <div class="KanbanColumn-header" :class="{ 'KanbanColumn-header--weekend': isWeekend }">
      <h2 class="KanbanColumn-title">{{ formattedDate }}</h2>
    </div>
    <div class="KanbanColumn-events">
      <div class="KanbanColumn-events-inner">
        <DailyKanbanEventCard
          v-for="event in events"
          :key="event.id"
          :event="event"
          :categories="categories"
        />
        <div v-if="events.length === 0" class="KanbanColumn-empty">
          {{ UI_TEXT.noEvents }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { UI_TEXT } from '~/consts/calendar.const'
import { formatKanbanDateHeader } from '~/utils/date.helpers'
import { isWeekendDay } from '~/utils/calendar-display.helpers'

defineOptions({ name: 'KanbanColumn' })

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
  categories: {
    type: Object,
    default: () => ({}),
  },
})

const formattedDate = computed(() => {
  return formatKanbanDateHeader(props.date)
})

const isWeekend = computed(() => isWeekendDay(props.date))
</script>

<style lang="scss">
@use '~/assets/css/breakpoints' as *;

.KanbanColumn {
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  background-color: var(--light-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;

  @include mobile {
    width: 85vw;
    max-width: 85vw;
    min-width: 85vw;
    height: 100%;
  }

  &--disabled {
    opacity: 0.55;
    pointer-events: none;
    filter: saturate(0.7);
  }

  &-header {
    height: var(--section-header-height);
    flex-shrink: 0;
    padding-block: 0;
    padding-inline: var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: color-mix(in srgb, var(--brand-light-green) 35%, white);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;

    &--weekend {
      background-color: color-mix(in srgb, var(--brand-light-blue) 35%, white);

      .KanbanColumn-title {
        color: var(--brand-dark-blue);
      }
    }
  }

  &-title {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: var(--brand-dark-green);
    margin: 0;
    text-align: center;
  }

  &-events {
    direction: ltr; // Inner wrapper restores RTL for cards
    padding: var(--spacing-sm-lg);
    overflow-x: hidden;

    @include mobile {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      scrollbar-gutter: stable;
      padding-inline-start: var(--spacing-sm-lg);
      padding-inline-end: var(--scrollbar-width); /* scrollbar side: total matches other side */
      padding-block: var(--spacing-sm-lg);

      &::-webkit-scrollbar-track {
        background: var(--brand-dark-green-tint-light);
      }

      &::-webkit-scrollbar-thumb {
        background: var(--brand-dark-green-tint);
      }

      &::-webkit-scrollbar-thumb:hover {
        background: var(--brand-dark-green-tint-strong);
      }
    }
  }

  &-events-inner {
    direction: rtl; // Restore RTL so cards keep correct order (accent, body, text)
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm-lg);
  }

  &-empty {
    text-align: center;
    color: var(--color-text-light);
    font-size: var(--font-size-sm);
    padding: var(--spacing-lg);
  }
}
</style>
