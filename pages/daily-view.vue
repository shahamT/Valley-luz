<template>
  <LayoutAppShell>
    <div v-if="isLoading && !events?.length" class="ContentViewLoader">
      <UiLoader size="md" />
    </div>
    <div v-else class="DailyView">
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
            <div v-if="isError" class="DailyView-error">
              <p>{{ UI_TEXT.error }}</p>
            </div>
            <div v-else class="DailyView-kanbanWrapper">
              <DailyKanbanCarousel
                :key="dateParam"
                :visible-days="visibleDays"
                :events-by-date="eventsByDate"
                :current-date="dateParam"
                :today="today"
                :slide-to-date-request="slideToDateRequest"
                @date-change="handleDateChange"
              />
            </div>
          </template>
        </CalendarViewContent>
      </div>
    </div>
  </LayoutAppShell>
</template>

<script setup>
import { UI_TEXT, DAILY_CAROUSEL_DAYS_RANGE } from '~/consts/calendar.const'
import { getTodayDateString, formatMonthYear, parseDateString, formatDateToYYYYMMDD } from '~/utils/date.helpers'
import { isValidRouteDate } from '~/utils/validation.helpers'

const route = useRoute()
const router = useRouter()

// Get events and categories data with loading/error states
const { events, isLoading, isError } = useCalendarViewData()

const calendarStore = useCalendarStore()
const uiStore = useUiStore()

const { getFilteredEventsByDate } = useEventFilters(events)
const { navigateToMonth, navigateToMonthInDailyView, navigateToDay, goToPrevDay, goToNextDay } = useCalendarNavigation()

// Initialize URL state sync (without month sync for daily view - date is in query)
const { initializeFromUrl, startUrlSync } = useUrlState({ syncMonth: false })

onMounted(() => {
  const dateFromQuery = route.query.date
  if (!dateFromQuery || !isValidRouteDate(String(dateFromQuery).trim())) {
    router.replace({ path: '/daily-view', query: { ...route.query, date: getTodayDateString() } })
  }
  initializeFromUrl()
  startUrlSync()
  uiStore.initializeModalFromUrl()
})

const dateParam = computed(() => {
  const param = route.query.date
  if (param && isValidRouteDate(String(param).trim())) {
    return String(param).trim().slice(0, 10)
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

watch(dateParam, (date) => {
  if (date && isValidRouteDate(date)) {
    calendarStore.setLastDailyViewDate(date)
  }
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
    navigateToDay(targetDate)
  }
}

const handleNextDay = () => {
  const targetDate = goToNextDay(dateParam.value)
  if (visibleDays.value.includes(targetDate)) {
    slideToDateRequest.value = targetDate
  } else {
    navigateToDay(targetDate)
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
  navigateToDay(newDate)
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
.ContentViewLoader {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

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
    min-width: 0;
    max-width: 100%;

    @media (max-width: 768px) {
      padding-inline: 1rem;
    }
  }

  &-content {
    grid-row: 2;
    min-height: 0;
    min-width: 0;

    @media (max-width: 768px) {
      display: flex;
      flex-direction: column;
    }
  }

  &-kanbanWrapper {
    @media (max-width: 768px) {
      height: calc(
        100dvh
        - var(--header-height)
        - (2 * var(--spacing-md))
        - var(--daily-view-header-height)
        - var(--spacing-md)
      );
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
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
