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
        <UiLoadingSpinner v-if="isLoading" :message="UI_TEXT.loading" />
        <div v-else-if="isError" class="DailyView-error">
          <p>{{ UI_TEXT.error }}</p>
        </div>
        <DailyEventList v-else :events="transformedEvents" />
      </div>
    </div>
  </LayoutAppShell>
</template>

<script setup>
import { UI_TEXT } from '~/consts/calendar.const'
import { getTodayDateString } from '~/utils/date.helpers'
import { formatDateForDisplay, transformEventForCard } from '~/utils/events.helpers'
import { eventsService } from '~/utils/events.service'
import { isValidRouteDate } from '~/utils/validation.helpers'

const route = useRoute()
const eventsStore = useEventsStore()
const categoriesStore = useCategoriesStore()

const isLoading = computed(() => {
  return unref(eventsStore.isLoading) || unref(categoriesStore.isLoading)
})

const isError = computed(() => {
  return unref(eventsStore.isError) || unref(categoriesStore.isError)
})

const dateParam = computed(() => {
  const param = route.params.date
  if (param && isValidRouteDate(param)) {
    return param
  }
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

  &-error {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--color-text-light);
  }
}
</style>
