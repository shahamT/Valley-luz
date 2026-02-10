<template>
  <div class="KanbanCarousel">
    <swiper
      ref="swiperRef"
      :modules="modules"
      :slides-per-view="3"
      :space-between="24"
      :centered-slides="true"
      :speed="600"
      :allow-touch-move="true"
      :resistance="true"
      :resistance-ratio="0"
      :dir="'rtl'"
      :initial-slide="initialSlideIndex"
      @slide-change="handleSlideChange"
      class="KanbanCarousel-swiper"
    >
      <swiper-slide
        v-for="(date, index) in visibleDays"
        :key="date || `empty-${index}`"
        class="KanbanCarousel-slide"
      >
        <DailyKanbanColumn
          v-if="date"
          :date="date"
          :events="eventsByDate[date] || []"
        />
        <div v-else class="KanbanCarousel-empty">
          <!-- Empty slot for past dates -->
        </div>
      </swiper-slide>
    </swiper>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation } from 'swiper/modules'

const props = defineProps({
  visibleDays: {
    type: Array,
    required: true,
  },
  eventsByDate: {
    type: Object,
    required: true,
  },
  currentDate: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['date-change'])

const modules = [Navigation]
const swiperRef = ref(null)

// Find the index of currentDate in visibleDays (should be index 2, the center)
const initialSlideIndex = computed(() => {
  const index = props.visibleDays.findIndex((date) => date === props.currentDate)
  return index >= 0 ? index : 2 // Default to center if not found
})

const handleSlideChange = (swiper) => {
  const activeIndex = swiper.activeIndex
  const activeDate = props.visibleDays[activeIndex]
  
  // Only emit if we have a valid date (not null/empty)
  if (activeDate) {
    emit('date-change', activeDate)
  }
}

// Watch for currentDate changes and update swiper position
watch(
  () => props.currentDate,
  (newDate) => {
    if (swiperRef.value && swiperRef.value.swiper) {
      const newIndex = props.visibleDays.findIndex((date) => date === newDate)
      if (newIndex >= 0 && newIndex !== swiperRef.value.swiper.activeIndex) {
        swiperRef.value.swiper.slideTo(newIndex)
      }
    }
  }
)
</script>

<style lang="scss">
.KanbanCarousel {
  width: 100%;
  position: relative;
  direction: rtl; // Ensure RTL direction

  &-swiper {
    width: 100%;
    padding: 0;
  }

  &-slide {
    width: 100%;
    display: flex;
    align-items: flex-start; // Align to top, not stretch
    justify-content: center;
    min-width: 0; // Allow flex shrinking
    height: auto; // Let height be based on content
  }

  &-empty {
    width: 100%;
    // Empty slot for past dates - no styling needed
  }
}

// Swiper RTL and styling overrides
.KanbanCarousel-swiper {
  .swiper-wrapper {
    align-items: flex-start; // Align to top, not stretch
    padding-bottom: var(--spacing-lg); // Prevent shadow cropping
  }

  .swiper-slide {
    height: auto; // Let height be based on content
    // Calculate exact width: (container width - 2 * space-between) / 3
    width: calc((100% - 48px) / 3) !important;
    box-sizing: border-box;
    flex-shrink: 0;
  }

  // Hide default navigation/pagination
  .swiper-button-next,
  .swiper-button-prev,
  .swiper-pagination {
    display: none;
  }

  // Ensure smooth scrolling
  .swiper-wrapper {
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
}
</style>
