<template>
  <div class="KanbanEventCard" @click="handleCardClick">
    <div
      class="KanbanEventCard-accent"
      :style="{ backgroundColor: categoryColor }"
    />
    <div class="KanbanEventCard-body">
      <div class="KanbanEventCard-time">{{ event.timeText }}</div>
      <div class="KanbanEventCard-content">
        <h3 class="KanbanEventCard-title">{{ event.title }}</h3>
        <div class="KanbanEventCard-locationChip">
          <UiIcon name="location_on" size="xs" class="KanbanEventCard-locationChipIcon" />
          <span class="KanbanEventCard-locationChipText">{{ event.locationDisplay }}</span>
        </div>
        <p class="KanbanEventCard-desc">{{ event.shortDescription || event.desc }}</p>
      </div>
      <div v-if="categoryChips.length" class="KanbanEventCard-chips">
        <span
          v-for="chip in categoryChips"
          :key="chip.id ?? `more-${chip.count}`"
          class="KanbanEventCard-chip"
          :class="{ 'KanbanEventCard-chip--more': chip.isMore }"
          :style="chip.isMore ? {} : { backgroundColor: getChipColor(chip.id) }"
        >
          {{ chip.isMore ? `+${chip.count}` : getCategoryLabel(chip.id) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getCategoryColor } from '~/utils/calendar-display.helpers'

defineOptions({ name: 'KanbanEventCard' })

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
})

// data
const { categories } = useCalendarViewData()
const uiStore = useUiStore()

// computed
const categoryColor = computed(() => {
  return getCategoryColor(props.event.mainCategory, categories.value)
})

const orderedCategoryIds = computed(() => {
  const main = props.event.mainCategory
  const list = props.event.categories ?? []
  if (!main && !list.length) return []
  const rest = list.filter((id) => id !== main)
  return main ? [main, ...rest] : list
})

const categoryChips = computed(() => {
  const ordered = orderedCategoryIds.value
  if (ordered.length === 0) return []
  if (ordered.length === 1) {
    return [{ id: ordered[0] }]
  }
  if (ordered.length === 2) {
    return [{ id: ordered[0] }, { id: ordered[1] }]
  }
  return [
    { id: ordered[0] },
    { id: ordered[1] },
    { isMore: true, count: ordered.length - 2 },
  ]
})

// methods
const getChipColor = (categoryId) => {
  return getCategoryColor(categoryId, categories.value)
}

const getCategoryLabel = (categoryId) => {
  return categories.value?.[categoryId]?.label ?? categoryId
}

const handleCardClick = () => {
  uiStore.openEventModal(props.event.eventId)
}
</script>

<style lang="scss">
.KanbanEventCard {
  background-color: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: row;
  align-items: stretch;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  &-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: 8px 12px 12px 12px;
  }

  &-accent {
    width: 6px;
    flex-shrink: 0;
  }

  &-locationChip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    height: 20px;
    padding: 0 6px 0 0.75rem;
    border-radius: 9999px;
    background-color: var(--chip-more-bg);
    color: var(--color-text-light);
    font-size: var(--font-size-xs);
    font-weight: 500;
    width: fit-content;
    max-width: 100%;
    min-width: 0;
  }

  &-locationChipIcon {
    flex-shrink: 0;
  }

  &-locationChipText {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &-time {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-secondary);
  }

  &-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  &-title {
    font-size: var(--font-size-base);
    font-weight: 700;
    color: var(--color-text);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-light);
    margin: 0;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: var(--spacing-sm);
  }

  &-chip {
    padding: 0 6px;
    font-size: 0.6875rem;
    font-weight: 500;
    border-radius: 9999px;
    color: var(--chip-text-white);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    &--more {
      background-color: var(--chip-more-bg);
      color: var(--color-text);
    }
  }
}
</style>
