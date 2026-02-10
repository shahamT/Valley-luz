<template>
  <LayoutAppShell :show-month-year="false">
    <div class="MonthlyView">
      <div class="MonthlyView-header">
        <ControlsCalendarViewHeader
          view-mode="month"
          :month-year="monthYearDisplay"
          :current-date="currentDate"
          @select-month-year="handleMonthYearSelect"
          @year-change="handleYearChange"
          @view-change="handleViewChange"
          @toggle-category="handleToggleCategory"
          @reset-filter="handleResetFilter"
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
            <UiLoadingSpinner v-if="isLoading" :message="UI_TEXT.loading" />
            <div v-else-if="isError" class="MonthlyView-error">
              <p>{{ UI_TEXT.error }}</p>
            </div>
            <MonthlyMonthCarousel
              v-else
              :visible-months="visibleMonths"
              :current-date="currentDate"
              :filtered-events="filteredEvents"
              :slide-to-month-request="slideToMonthRequest"
              :today-month="todayMonth"
              @month-change="handleMonthChange"
            />
          </template>
        </CalendarViewContent>
      </div>
    </div>
  </LayoutAppShell>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { UI_TEXT } from '~/consts/calendar.const'
import { formatMonthYear, getCurrentYearMonth, getPrevMonth, getNextMonth, getTodayDateString } from '~/utils/date.helpers'
import { eventsService } from '~/utils/events.service'

const eventsStore = useEventsStore()
const categoriesStore = useCategoriesStore()
const calendarStore = useCalendarStore()
const { currentDate, selectedCategories } = storeToRefs(calendarStore)

const currentYear = computed(() => currentDate.value?.year ?? getCurrentYearMonth().year)
const currentMonth = computed(() => currentDate.value?.month ?? getCurrentYearMonth().month)

const isLoading = computed(() => {
  return unref(eventsStore.isLoading) || unref(categoriesStore.isLoading)
})

const isError = computed(() => {
  return unref(eventsStore.isError) || unref(categoriesStore.isError)
})

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
  slideToMonthRequest.value = getPrevMonth(currentDate.value.year, currentDate.value.month)
}

const handleNextMonth = () => {
  slideToMonthRequest.value = getNextMonth(currentDate.value.year, currentDate.value.month)
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
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const date = currentDate.value
  const targetDate =
    date.year === currentYear && date.month === currentMonth
      ? getTodayDateString()
      : `${date.year}-${String(date.month).padStart(2, '0')}-01`
  navigateTo(`/daily-view/${targetDate}`)
}

const handleToggleCategory = (categoryId) => {
  calendarStore.toggleCategory(categoryId)
}

const handleResetFilter = () => {
  calendarStore.resetFilter()
}

const filteredEvents = computed(() => {
  const allEvents = eventsStore.events
  
  if (selectedCategories.value.length === 0) {
    return allEvents
  }
  
  return eventsService.filterEventsByCategories(allEvents, selectedCategories.value)
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

  &-header {
    grid-row: 1;
  }

  &-calendar {
    grid-row: 2;
    min-height: 0;
    min-width: 0;
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
