<template>
  <div class="EventModal-imageHeader">
    <img :src="eventImage" :alt="event.title" class="EventModal-image" />
    <div class="EventModal-imageOverlay" />
    <div class="EventModal-headerActions">
      <button
        v-if="canShare"
        type="button"
        class="EventModal-shareButton"
        :aria-label="MODAL_TEXT.share"
        @click="emit('share')"
      >
        <UiIcon name="share" size="md" />
      </button>
      <button
        type="button"
        class="EventModal-closeButton"
        :aria-label="MODAL_TEXT.close"
        @click="emit('close')"
      >
        <UiIcon name="close" size="lg" />
      </button>
    </div>
    <div class="EventModal-headerContent">
      <h1 class="EventModal-eventTitle">{{ event.title }}</h1>
      <div v-if="sortedCategoryIds.length" class="EventModal-categories">
        <span
          v-for="categoryId in sortedCategoryIds"
          :key="categoryId"
          class="EventModal-categoryChip"
          :style="{ backgroundColor: getCategoryColor(categoryId, categories) }"
        >
          {{ getCategoryLabel(categoryId) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getCategoryColor, sortCategoryIdsWithMainFirst } from '~/utils/calendar-display.helpers'
import { MODAL_TEXT } from '~/consts/ui.const'

defineOptions({ name: 'EventModalHeader' })

const emit = defineEmits(['close', 'share'])

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  categories: {
    type: Object,
    default: () => ({}),
  },
  eventImage: {
    type: String,
    required: true,
  },
  canShare: {
    type: Boolean,
    default: false,
  },
})

const sortedCategoryIds = computed(() =>
  sortCategoryIdsWithMainFirst(props.event.categories, props.event.mainCategory)
)

const getCategoryLabel = (categoryId) => {
  return props.categories?.[categoryId]?.label ?? categoryId
}
</script>

<style lang="scss">
@use '~/assets/css/breakpoints' as *;

.EventModal {
  &-imageHeader {
    position: relative;
    min-height: 180px;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    @include mobile {
      min-height: 160px;
    }
  }

  &-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &-imageOverlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--brand-dark-green-overlay);
  }

  &-headerActions {
    position: absolute;
    top: var(--spacing-md);
    left: 0;
    right: 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-inline: var(--spacing-md);
    z-index: 10;
  }

  [dir='rtl'] &-headerActions {
    flex-direction: row-reverse;
  }

  &-shareButton {
    padding: var(--spacing-xs);
  }

  &-shareButton,
  &-closeButton {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--chip-text-white);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.2s ease;
    font-weight: 700;

    &:hover {
      background-color: var(--overlay-dark-subtle);
    }
  }

  &-headerContent {
    position: relative;
    margin-top: auto;
    padding: var(--spacing-lg);
    padding-top: 80px;
    z-index: 5;

    @include mobile {
      padding: var(--spacing-md);
      padding-top: var(--spacing-lg);
    }
  }

  &-eventTitle {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--chip-text-white);
    margin: 0 0 var(--spacing-md) 0;
    line-height: 1.3;
    text-shadow: var(--text-shadow-overlay);
  }

  &-categories {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  &-categoryChip {
    padding: 0.2rem var(--spacing-sm);
    font-size: 0.625rem;
    font-weight: 500;
    border-radius: var(--radius-full);
    color: var(--chip-text-white);
    white-space: nowrap;

    @include mobile {
      font-size: var(--font-size-xs);
      padding: var(--spacing-xs) 0.625rem;
    }
  }
}
</style>
