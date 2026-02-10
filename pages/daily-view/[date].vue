<template>
  <LayoutAppShell :show-month-year="false">
    <div class="DailyView">
      <div class="DailyView-header">
        <ControlsCalendarViewHeader
          view-mode="day"
          :month-year="monthYearDisplay"
          :current-date="headerDate"
          @select-month-year="handleMonthYearSelect"
          @year-change="handleYearChange"
          @view-change="handleViewChange"
          @toggle-category="handleToggleCategory"
          @reset-filter="handleResetFilter"
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
            <UiLoadingSpinner v-if="isLoading" :message="UI_TEXT.loading" />
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
import { storeToRefs } from 'pinia'
import { UI_TEXT } from '~/consts/calendar.const'
import { getTodayDateString, formatMonthYear, getPrevMonth, getNextMonth, isToday, getNextDay, getPrevDay } from '~/utils/date.helpers'
import { formatDateForDisplay, transformEventForCard, parseDateString, formatDateToYYYYMMDD } from '~/utils/events.helpers'
import { eventsService } from '~/utils/events.service'
import { isValidRouteDate } from '~/utils/validation.helpers'

const route = useRoute()
const eventsStore = useEventsStore()
const categoriesStore = useCategoriesStore()
const calendarStore = useCalendarStore()
const { selectedCategories } = storeToRefs(calendarStore)

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

// Virtual window: 11 days total (current + 4 before + 4 after); all dates rendered, past ones shown disabled
const visibleDays = computed(() => {
  const centerDate = parseDateString(dateParam.value)
  const days = []
  for (let i = -4; i <= 4; i++) {
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
  const targetDate = getPrevDay(dateParam.value)
  if (visibleDays.value.includes(targetDate)) {
    slideToDateRequest.value = targetDate
  } else {
    navigateTo(`/daily-view/${targetDate}`)
  }
}

const handleNextDay = () => {
  const targetDate = getNextDay(dateParam.value)
  if (visibleDays.value.includes(targetDate)) {
    slideToDateRequest.value = targetDate
  } else {
    navigateTo(`/daily-view/${targetDate}`)
  }
}

const eventsByDate = computed(() => {
  const result = {}
  const categories = selectedCategories.value
  
  visibleDays.value.forEach((date) => {
    const eventsForDate = eventsService.getEventsForDate(eventsStore.events, date)
    
    let filteredEvents = eventsForDate.map(({ event, occurrence }, index) => ({
      ...transformEventForCard(event, occurrence),
      id: `${event.id}-${index}`,
      eventId: event.id,
      mainCategory: event.mainCategory,
    }))
    
    // Apply category filter
    if (categories.length > 0) {
      filteredEvents = filteredEvents.filter((eventData) => {
        const event = eventsStore.events.find((e) => e.id === eventData.eventId)
        if (!event || !event.categories) {
          return false
        }
        return event.categories.some((categoryId) => 
          categories.includes(categoryId)
        )
      })
    }
    
    result[date] = filteredEvents
  })
  
  return result
})

// Target date for daily view when changing month: first day of month, or today if that month is current
function getDailyTargetDateForMonth(year, month) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  if (year === currentYear && month === currentMonth) {
    return getTodayDateString()
  }
  const monthPadded = String(month).padStart(2, '0')
  return `${year}-${monthPadded}-01`
}

const handlePrevMonth = () => {
  const newDate = getPrevMonth(headerDate.value.year, headerDate.value.month)
  calendarStore.setCurrentDate(newDate)
  const targetDate = getDailyTargetDateForMonth(newDate.year, newDate.month)
  navigateTo(`/daily-view/${targetDate}`)
}

const handleNextMonth = () => {
  const newDate = getNextMonth(headerDate.value.year, headerDate.value.month)
  calendarStore.setCurrentDate(newDate)
  const targetDate = getDailyTargetDateForMonth(newDate.year, newDate.month)
  navigateTo(`/daily-view/${targetDate}`)
}

const handleMonthYearSelect = ({ year, month }) => {
  calendarStore.setCurrentDate({ year, month })
  const targetDate = getDailyTargetDateForMonth(year, month)
  navigateTo(`/daily-view/${targetDate}`)
}

const handleYearChange = ({ year }) => {
  const newDate = { ...headerDate.value, year }
  calendarStore.setCurrentDate(newDate)
  const targetDate = getDailyTargetDateForMonth(newDate.year, newDate.month)
  navigateTo(`/daily-view/${targetDate}`)
}

const handleToggleCategory = (categoryId) => {
  calendarStore.toggleCategory(categoryId)
}

const handleResetFilter = () => {
  calendarStore.resetFilter()
}

const handleDateChange = (newDate) => {
  // Update URL when carousel slide changes
  navigateTo(`/daily-view/${newDate}`)
  slideToDateRequest.value = null
}

const handleBackToMonthly = () => {
  calendarStore.setCurrentDate(headerDate.value)
  navigateTo('/')
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
