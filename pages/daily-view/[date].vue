<template>
  <LayoutAppShell :show-month-year="false">
    <div class="DailyView">
      <div class="DailyView-header">
        <ControlsCalendarViewHeader
          view-mode="day"
          :month-year="monthYearDisplay"
          :current-date="headerDate"
          :prev-disabled="isTodayOrPast"
          prev-aria-label="Previous day"
          next-aria-label="Next day"
          @select-month-year="handleMonthYearSelect"
          @year-change="handleYearChange"
          @view-change="handleViewChange"
          @prev="handlePrevDay"
          @next="handleNextDay"
        />
      </div>
      <div class="DailyView-content">
        <CalendarViewContent
          view-mode="day"
          :prev-disabled="isTodayOrPast"
          prev-aria-label="Previous day"
          next-aria-label="Next day"
          @prev="handlePrevDay"
          @next="handleNextDay"
        >
          <template #day>
            <UiLoadingSpinner v-if="isLoading && !events?.length" :message="UI_TEXT.loading" />
            <div v-else-if="isError" class="DailyView-error">
              <p>{{ UI_TEXT.error }}</p>
            </div>
            <DailyKanbanCarousel
              v-else
              :visible-days="visibleDays"
              :events-by-date="eventsByDate"
              :current-date="dateParam"
              :today="today"
              :slide-to-date-request="slideToDateRequest"
              @date-change="handleDateChange"
            />
          </template>
        </CalendarViewContent>
      </div>
    </div>
  </LayoutAppShell>
</template>

<script setup>
import { onMounted } from 'vue'
import { UI_TEXT, DAILY_CAROUSEL_DAYS_RANGE } from '~/consts/calendar.const'
import { getTodayDateString, formatMonthYear, parseDateString, formatDateToYYYYMMDD } from '~/utils/date.helpers'
import { isValidRouteDate } from '~/utils/validation.helpers'

const route = useRoute()

// Get events and categories data with loading/error states
const { events, isLoading, isError } = useCalendarViewData()

const calendarStore = useCalendarStore()

const { getFilteredEventsByDate } = useEventFilters(events)
const { navigateToMonth, navigateToMonthInDailyView, goToPrevDay, goToNextDay } = useCalendarNavigation()

// Initialize URL state sync (without month sync for daily view - date is in path)
const { initializeFromUrl, startUrlSync } = useUrlState({ syncMonth: false })

onMounted(() => {
  // Initialize filter state from URL params
  initializeFromUrl()
  // Start watching store and syncing filters to URL
  startUrlSync()
})

// Validate and redirect invalid dates
if (route.params.date && !isValidRouteDate(route.params.date)) {
  await navigateTo(`/daily-view/${getTodayDateString()}`, { replace: true })
}

const dateParam = computed(() => {
  const param = route.params.date
  if (param && isValidRouteDate(param)) {
    return param
  }
  return getTodayDateString()
})

// SEO metadata with dynamic date
const pageTitle = computed(() => {
  const date = parseDateString(dateParam.value)
  const day = date.getDate()
  const monthName = formatMonthYear(date.getFullYear(), date.getMonth() + 1)
  return `יומן Valley Luz - ${day} ${monthName}`
})

useHead({
  title: pageTitle,
})

useSeoMeta({
  description: 'תצוגה יומית של אירועים ופעילויות ב-Valley Luz',
  ogTitle: pageTitle,
  ogDescription: 'תצוגה יומית של אירועים ב-Valley Luz',
})

const headerDate = computed(() => {
  const date = parseDateString(dateParam.value)
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  }
})

watch(headerDate, (newHeaderDate) => {
  calendarStore.setCurrentDate(newHeaderDate)
}, { immediate: true })

const monthYearDisplay = computed(() => {
  return formatMonthYear(headerDate.value.year, headerDate.value.month)
})

const visibleDays = computed(() => {
  const centerDate = parseDateString(dateParam.value)
  const days = []
  for (let i = -DAILY_CAROUSEL_DAYS_RANGE; i <= DAILY_CAROUSEL_DAYS_RANGE; i++) {
    const date = new Date(centerDate)
    date.setDate(centerDate.getDate() + i)
    days.push(formatDateToYYYYMMDD(date))
  }
  return days
})

const today = computed(() => getTodayDateString())

const slideToDateRequest = ref(null)

const isTodayOrPast = computed(() => {
  return dateParam.value <= today.value
})

const handlePrevDay = () => {
  if (isTodayOrPast.value) return
  const targetDate = goToPrevDay(dateParam.value)
  if (visibleDays.value.includes(targetDate)) {
    slideToDateRequest.value = targetDate
  } else {
    navigateTo(`/daily-view/${targetDate}`)
  }
}

const handleNextDay = () => {
  const targetDate = goToNextDay(dateParam.value)
  if (visibleDays.value.includes(targetDate)) {
    slideToDateRequest.value = targetDate
  } else {
    navigateTo(`/daily-view/${targetDate}`)
  }
}

const eventsByDate = computed(() => getFilteredEventsByDate(visibleDays.value))

const handleMonthYearSelect = ({ year, month }) => {
  navigateToMonthInDailyView(year, month)
}

// Year change in month picker should not close popup or navigate - only month select triggers navigation
const handleYearChange = ({ year }) => {
  calendarStore.setCurrentDate({ year, month: headerDate.value.month })
}

const handleDateChange = (newDate) => {
  navigateTo(`/daily-view/${newDate}`)
  slideToDateRequest.value = null
}

const handleBackToMonthly = () => {
  navigateToMonth(headerDate.value.year, headerDate.value.month)
}

const handleViewChange = ({ view }) => {
  if (view === 'month') handleBackToMonthly()
}
</script>

<style lang="scss">
.DailyView {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  gap: var(--spacing-md);
  min-height: 0;
  min-width: 0;

  &-header {
    grid-row: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  &-content {
    grid-row: 2;
    min-height: 0;
    min-width: 0;
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
