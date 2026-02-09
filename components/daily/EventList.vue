<template>
  <div class="EventList">
    <div class="EventList-scrollWrapper">
      <DailyEventCard
        v-for="event in events"
        :key="event.id"
        :event="event"
      />
    </div>
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

  &-scrollWrapper {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: var(--scrollbar-padding);
    min-height: 0;
    direction: ltr; // Force scrollbar to right side

    /* Custom scrollbar styling - reserve space for scrollbar */
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb-bg) var(--scrollbar-track-bg);

    &::-webkit-scrollbar {
      width: var(--scrollbar-width);
    }

    &::-webkit-scrollbar-track {
      background: var(--scrollbar-track-bg);
      border-radius: var(--scrollbar-border-radius);
      margin: var(--scrollbar-margin);
    }

    &::-webkit-scrollbar-thumb {
      background: var(--scrollbar-thumb-bg);
      border-radius: var(--scrollbar-border-radius);
    }

    &::-webkit-scrollbar-thumb:hover {
      background: var(--scrollbar-thumb-hover-bg);
    }
  }
}
</style>
