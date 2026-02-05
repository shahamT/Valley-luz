<template>
  <AppShell>
    <TopControls
      mode="daily"
      :date-title="formattedDate"
      @back="goToMonthly"
    />
    <div v-if="eventsStore.isLoading">טוען אירועים...</div>
    <div v-else-if="eventsStore.isError">שגיאה בטעינת אירועים</div>
    <DailyEventList v-else :events="transformedEvents" />
  </AppShell>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppShell from '../components/layout/AppShell.vue'
import TopControls from '../components/controls/TopControls.vue'
import DailyEventList from '../components/daily/DailyEventList.vue'
import { useEventsStore } from '../stores/events.store'
import {
  getEventsForDate,
  formatDateForDisplay,
  transformEventForCard,
} from '../helpers/events.helpers'
import { isValidRouteDate } from '../helpers/validation.helpers'

const router = useRouter()
const route = useRoute()
const eventsStore = useEventsStore()

const dateParam = computed(() => {
  const param = route.params.date
  if (param && isValidRouteDate(param)) {
    return param
  }
  // Fallback to today's date if invalid
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

const formattedDate = computed(() => {
  return formatDateForDisplay(dateParam.value)
})

const eventsForDate = computed(() => {
  return getEventsForDate(eventsStore.events, dateParam.value)
})

const transformedEvents = computed(() => {
  return eventsForDate.value.map(({ event, occurrence }, index) => ({
    ...transformEventForCard(event, occurrence),
    id: `${event.id}-${index}`,
    eventId: event.id,
  }))
})

const goToMonthly = () => {
  router.push({ name: 'monthly-view' })
}
</script>
