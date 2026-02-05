<template>
  <LayoutAppShell>
    <ControlsTopControls
      mode="daily"
      :date-title="formattedDate"
      @back="goToMonthly"
    />
    <div v-if="eventsStore.isLoading">{{ UI_TEXT.loading }}</div>
    <div v-else-if="eventsStore.isError">{{ UI_TEXT.error }}</div>
    <DailyEventList v-else :events="transformedEvents" />
  </LayoutAppShell>
</template>

<script setup>
import { getTodayDateString } from '~/utils/date.helpers'
import { UI_TEXT } from '~/consts/calendar.const'

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
