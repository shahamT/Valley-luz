<template>
  <div class="DailyEventList">
    <div class="DailyEventList__scrollArea">
      <DailyDailyEventCard
        v-for="event in events"
        :key="event.id"
        :time-text="event.timeText"
        :title="event.title"
        :desc="event.desc"
        :price="event.price"
      />
    </div>
    <div class="DailyEventList__scrollbar"></div>
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
.DailyEventList {
  position: relative;
  max-width: 800px;
  margin: 0 auto;

  &__scrollArea {
    max-height: 70vh;
    overflow-y: auto;
    padding-right: var(--spacing-md);
  }

  &__scrollbar {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
    pointer-events: none;
  }
}
</style>
