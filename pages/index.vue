<template>
  <LayoutAppShell>
    <ControlsTopControls mode="month" month-year="פברואר 2026" />
    <MonthlyMonthCalendar :year="2026" :month="2" :events="eventsStore.events" />
  </LayoutAppShell>
</template>

<script setup>
const eventsStore = useEventsStore()
</script>
