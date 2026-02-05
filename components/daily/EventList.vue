<template>
  <div class="EventList">
    <div class="EventList__scrollWrapper">
      <div class="EventList__scrollArea">
        <DailyEventCard
          v-for="event in events"
          :key="event.id"
          :time-text="event.timeText"
          :title="event.title"
          :desc="event.desc"
          :price="event.price"
        />
      </div>
    </div>
    <div class="EventList__scrollbar"></div>
  </div>
</template>

<script setup>
// DailyEventCard is auto-imported by Nuxt

defineProps({
  events: {
    type: Array,
    required: true,
  },
})
</script>

<style lang="scss">
.EventList {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;

  &__scrollWrapper {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: var(--spacing-md);
    min-height: 0;
    direction: ltr; // Force scrollbar to right side
    
    /* Custom scrollbar styling */
    scrollbar-width: thin;
    scrollbar-color: var(--brand-light-blue) rgba(128, 220, 218, 0.3);
    
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(128, 220, 218, 0.3);
      border-radius: 4px;
      margin: 4px 0;
    }
    
    &::-webkit-scrollbar-thumb {
      background: var(--brand-light-blue);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background: var(--brand-dark-blue);
    }
  }

  &__scrollArea {
    // Content area - no overflow here, handled by wrapper
  }

  &__scrollbar {
    display: none; // Using native scrollbar styling instead
  }
}
</style>
