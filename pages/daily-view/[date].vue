<template>
  <LayoutAppShell>
    <div class="DailyView">
      <div class="DailyView-header">
        <ControlsTopControls
          mode="daily"
          :date-title="formattedDate"
          @back="goToMonthly"
        />
      </div>
      <div class="DailyView-content">
        <div v-if="eventsStore.isLoading">{{ UI_TEXT.loading }}</div>
        <div v-else-if="eventsStore.isError">{{ UI_TEXT.error }}</div>
        <DailyEventList v-else :events="transformedEvents" />
      </div>
    </div>
  </LayoutAppShell>
</template>

<script setup>
import { getTodayDateString } from '~/utils/date.helpers'
import { UI_TEXT } from '~/consts/calendar.const'
import { isValidRouteDate } from '~/utils/validation.helpers'
import { formatDateForDisplay, transformEventForCard } from '~/utils/events.helpers'
import { eventsService } from '~/utils/events.service'

const route = useRoute()
const eventsStore = useEventsStore()

const dateParam = computed(() => {
  const param = route.params.date
  if (param && isValidRouteDate(param)) {
    return param
  }
  // Fallback to today's date if invalid
  return getTodayDateString()
})

const formattedDate = computed(() => {
  return formatDateForDisplay(dateParam.value)
})

const eventsForDate = computed(() => {
  return eventsService.getEventsForDate(eventsStore.events, dateParam.value)
})

const transformedEvents = computed(() => {
  return eventsForDate.value.map(({ event, occurrence }, index) => ({
    ...transformEventForCard(event, occurrence),
    id: `${event.id}-${index}`,
    eventId: event.id,
  }))
})

const goToMonthly = () => {
  navigateTo('/')
}
</script>

<style lang="scss">
.DailyView {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  gap: var(--spacing-md);

  &-header {
    grid-row: 1;
  }

  &-content {
    grid-row: 2;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
}
</style>
