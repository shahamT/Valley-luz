<template>
  <div 
    class="KanbanEventCard"
    :style="{ borderTopColor: categoryColor }"
  >
    <div class="KanbanEventCard-time">{{ event.timeText }}</div>
    <div class="KanbanEventCard-content">
      <h3 class="KanbanEventCard-title">{{ event.title }}</h3>
      <p class="KanbanEventCard-desc">{{ event.shortDescription || event.desc }}</p>
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

// computed
const categoryColor = computed(() => {
  return getCategoryColor(props.event.mainCategory, categories.value)
})
</script>

<style lang="scss">
.KanbanEventCard {
  background-color: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border-top: 4px solid;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  &-time {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text);
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
  }

  &-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-light);
    margin: 0;
    line-height: 1.5;
  }
}
</style>
