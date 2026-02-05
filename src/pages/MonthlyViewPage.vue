<template>
  <AppShell>
    <TopControls mode="month" month-year="פברואר 2026" />
    <MonthCalendar :year="2026" :month="2" :events="eventsStore.events" />
  </AppShell>
</template>

<script setup>
import AppShell from '../components/layout/AppShell.vue'
import TopControls from '../components/controls/TopControls.vue'
import MonthCalendar from '../components/monthly/MonthCalendar.vue'
import { useEventsStore } from '../stores/events.store'

const eventsStore = useEventsStore()
</script>
