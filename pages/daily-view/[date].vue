<template>
  <LayoutAppShell
    :show-month-year="true"
    :month-year="monthYearDisplay"
    :current-date="headerDate"
    @prev-month="handlePrevMonth"
    @next-month="handleNextMonth"
    @select-month-year="handleMonthYearSelect"
    @year-change="handleYearChange"
  >
    <div class="DailyView">
      <div class="DailyView-header">
        <ControlsTopControls
          mode="month"
          :categories="categoriesStore.categories"
          :selected-categories="selectedCategories"
          @toggle-category="handleToggleCategory"
          @reset-filter="handleResetFilter"
        />
        <div class="DailyView-separator"></div>
      </div>
      <div class="DailyView-content">
        <UiLoadingSpinner v-if="isLoading" :message="UI_TEXT.loading" />
        <div v-else-if="isError" class="DailyView-error">
          <p>{{ UI_TEXT.error }}</p>
        </div>
        <DailyKanbanCarousel
          v-else
          :visible-days="visibleDays"
          :events-by-date="eventsByDate"
          :current-date="dateParam"
          @date-change="handleDateChange"
        />
      </div>
    </div>
  </LayoutAppShell>
</template>

<script setup>
import { UI_TEXT } from '~/consts/calendar.const'
import { getTodayDateString, formatMonthYear, getPrevMonth, getNextMonth, isToday, getNextDay, getPrevDay } from '~/utils/date.helpers'
import { formatDateForDisplay, transformEventForCard, parseDateString, formatDateToYYYYMMDD } from '~/utils/events.helpers'
import { eventsService } from '~/utils/events.service'
import { isValidRouteDate } from '~/utils/validation.helpers'

const route = useRoute()
const eventsStore = useEventsStore()
const categoriesStore = useCategoriesStore()
const calendarStore = useCalendarStore()

const selectedCategories = computed(() => {
  return calendarStore.selectedCategories || []
})

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

const monthYearDisplay = computed(() => {
  return formatMonthYear(headerDate.value.year, headerDate.value.month)
})

// Virtual window: 5 days total (current + 2 before + 2 after)
const visibleDays = computed(() => {
  const centerDate = parseDateString(dateParam.value)
  const today = getTodayDateString()
  const days = []
  
  // Always show 5 slots: [date-2, date-1, date, date+1, date+2]
  for (let i = -2; i <= 2; i++) {
    const date = new Date(centerDate)
    date.setDate(centerDate.getDate() + i)
    const dateString = formatDateToYYYYMMDD(date)
    
    // If date is before today, set to null (empty slot)
    if (dateString < today) {
      days.push(null)
    } else {
      days.push(dateString)
    }
  }
  
  return days
})

const eventsByDate = computed(() => {
  const result = {}
  const categories = selectedCategories.value
  
  // Only calculate events for non-null dates in visibleDays
  visibleDays.value.forEach((date) => {
    if (!date) return // Skip null dates
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

const handlePrevMonth = () => {
  const newDate = getPrevMonth(headerDate.value.year, headerDate.value.month)
  calendarStore.setCurrentDate(newDate)
  navigateTo('/')
}

const handleNextMonth = () => {
  const newDate = getNextMonth(headerDate.value.year, headerDate.value.month)
  calendarStore.setCurrentDate(newDate)
  navigateTo('/')
}

const handleMonthYearSelect = ({ year, month }) => {
  calendarStore.setCurrentDate({ year, month })
  navigateTo('/')
}

const handleYearChange = ({ year }) => {
  calendarStore.setCurrentDate({ ...headerDate.value, year })
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
}
</script>

<style lang="scss">
.DailyView {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  gap: var(--spacing-md);
  min-height: 0;

  &-header {
    grid-row: 1;
  }

  &-separator {
    width: 100%;
    height: 1px;
    background-color: var(--brand-light-green);
    margin-top: var(--spacing-md);
  }

  &-content {
    grid-row: 2;
    overflow: visible; // Allow content to determine height
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
