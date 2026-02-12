<template>
  <LayoutAppShell :show-month-year="false">
    <div class="MonthlyView">
      <div class="MonthlyView-header">
        <ControlsCalendarViewHeader
          view-mode="month"
          :month-year="monthYearDisplay"
          :current-date="currentDate"
          :prev-disabled="isCurrentMonth"
          prev-aria-label="Previous month"
          next-aria-label="Next month"
          @select-month-year="handleMonthYearSelect"
          @year-change="handleYearChange"
          @view-change="handleViewChange"
          @prev="handlePrevMonth"
          @next="handleNextMonth"
        />
      </div>
      <div class="MonthlyView-calendar">
        <CalendarViewContent
          view-mode="month"
          :prev-disabled="isCurrentMonth"
          prev-aria-label="Previous month"
          next-aria-label="Next month"
          @prev="handlePrevMonth"
          @next="handleNextMonth"
        >
          <template #month>
            <UiLoadingSpinner v-if="isLoading && !events?.length" :message="UI_TEXT.loading" />
            <div v-else-if="isError" class="MonthlyView-error">
              <p>{{ UI_TEXT.error }}</p>
            </div>
            <MonthlyMonthCarousel
              v-else
              :visible-months="visibleMonths"
              :current-date="currentDate"
              :filtered-events="filteredEvents"
              :today-month="todayMonth"
              :slide-to-month-request="slideToMonthRequest"
              @month-change="handleMonthChange"
            />
          </template>
        </CalendarViewContent>
      </div>
    </div>
  </LayoutAppShell>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { UI_TEXT } from '~/consts/calendar.const'
import { formatMonthYear, getCurrentYearMonth, getPrevMonth, getNextMonth } from '~/utils/date.helpers'

// SEO metadata
useHead({
  title: 'יומן Valley Luz - תצוגה חודשית',
})

useSeoMeta({
  description: 'יומן אירועים חודשי של Valley Luz - צפייה בכל האירועים והפעילויות החודשיות',
  ogTitle: 'יומן Valley Luz - תצוגה חודשית',
  ogDescription: 'יומן אירועים חודשי של Valley Luz',
})

// Get events and categories data with loading/error states
const { events, isLoading, isError } = useCalendarViewData()

const calendarStore = useCalendarStore()
const { currentDate } = storeToRefs(calendarStore)

const { getFilteredEventsForMonth } = useEventFilters(events)
const { switchToDailyView } = useCalendarNavigation()

// Initialize URL state sync (with month sync enabled for monthly view)
const { initializeFromUrl, startUrlSync } = useUrlState({ syncMonth: true })

onMounted(() => {
  // Initialize store from URL params first
  initializeFromUrl()
  // Start watching store and syncing to URL
  startUrlSync()
})

const currentYear = computed(() => currentDate.value?.year ?? getCurrentYearMonth().year)
const currentMonth = computed(() => currentDate.value?.month ?? getCurrentYearMonth().month)

const monthYearDisplay = computed(() => {
  return formatMonthYear(currentYear.value, currentMonth.value)
})

const isCurrentMonth = computed(() => {
  if (typeof window === 'undefined') return false
  const now = new Date()
  const date = currentDate.value
  return date && date.year === now.getFullYear() && date.month === now.getMonth() + 1
})

const todayMonth = computed(() => getCurrentYearMonth())

const visibleMonths = computed(() => {
  const c = currentDate.value ?? getCurrentYearMonth()
  if (!c?.year || !c?.month) return []
  return [
    getPrevMonth(c.year, c.month),
    { year: c.year, month: c.month },
    getNextMonth(c.year, c.month),
  ]
})

const slideToMonthRequest = ref(null)

const handlePrevMonth = () => {
  const targetMonth = getPrevMonth(currentDate.value.year, currentDate.value.month)
  const isInVisibleMonths = visibleMonths.value.some(
    m => m.year === targetMonth.year && m.month === targetMonth.month
  )
  
  if (isInVisibleMonths) {
    slideToMonthRequest.value = targetMonth
  } else {
    calendarStore.setCurrentDate(targetMonth)
  }
}

const handleNextMonth = () => {
  const targetMonth = getNextMonth(currentDate.value.year, currentDate.value.month)
  const isInVisibleMonths = visibleMonths.value.some(
    m => m.year === targetMonth.year && m.month === targetMonth.month
  )
  
  if (isInVisibleMonths) {
    slideToMonthRequest.value = targetMonth
  } else {
    calendarStore.setCurrentDate(targetMonth)
  }
}

const handleMonthChange = (payload) => {
  calendarStore.setCurrentDate(payload)
  slideToMonthRequest.value = null
}

const handleMonthYearSelect = ({ year, month }) => {
  calendarStore.setCurrentDate({ year, month })
}

const handleYearChange = ({ year }) => {
  calendarStore.setCurrentDate({ ...currentDate.value, year })
}

const handleViewChange = ({ view }) => {
  if (view !== 'day') return
  switchToDailyView(currentDate.value)
}

const filteredEvents = computed(() => {
  return getFilteredEventsForMonth(currentYear.value, currentMonth.value)
})
</script>

<style lang="scss">
.MonthlyView {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  gap: var(--spacing-md);
  min-height: 0;
  min-width: 0;

  @media (max-width: 768px) {
    gap: 0;
  }

  &-header {
    grid-row: 1;

    @media (max-width: 768px) {
      padding-inline: 1rem;
    }
  }

  &-calendar {
    grid-row: 2;
    min-height: 0;
    min-width: 0;

    @media (max-width: 768px) {
      padding-inline: 1rem;
    }
  }

  &-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: var(--spacing-md);
    color: var(--color-text-light);
  }
}
</style>
