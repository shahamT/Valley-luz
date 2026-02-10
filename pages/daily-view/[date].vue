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
        <DailyKanbanView
          v-else
          :dates="threeDays"
          :events-by-date="eventsByDate"
          :is-prev-disabled="isPrevDisabled"
          :center-index="centerIndex"
          @prev="handlePrevDay"
          @next="handleNextDay"
        />
      </div>
    </div>
  </LayoutAppShell>
</template>

<script setup>
import { UI_TEXT } from '~/consts/calendar.const'
import { getTodayDateString, formatMonthYear, getPrevMonth, getNextMonth, getThreeDaysForView, isToday, getNextDay, getPrevDay } from '~/utils/date.helpers'
import { formatDateForDisplay, transformEventForCard, parseDateString } from '~/utils/events.helpers'
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

const threeDays = computed(() => {
  return getThreeDaysForView(dateParam.value)
})

const centerIndex = computed(() => {
  if (isToday(dateParam.value)) {
    return 1 // Tomorrow is center when viewing today
  }
  return 1 // URL date is center
})

const isPrevDisabled = computed(() => {
  return isToday(dateParam.value)
})

const eventsByDate = computed(() => {
  const result = {}
  const categories = selectedCategories.value
  
  threeDays.value.forEach((date) => {
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

const handlePrevDay = () => {
  if (isPrevDisabled.value) {
    return
  }
  const prevDate = getPrevDay(dateParam.value)
  navigateTo(`/daily-view/${prevDate}`)
}

const handleNextDay = () => {
  if (isToday(dateParam.value)) {
    // When viewing today, jump 2 days ahead (to day+2)
    const nextDate = getNextDay(getNextDay(dateParam.value))
    navigateTo(`/daily-view/${nextDate}`)
  } else {
    // Normal navigation: move to next day
    const nextDate = getNextDay(dateParam.value)
    navigateTo(`/daily-view/${nextDate}`)
  }
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
    min-height: 0;
    overflow: hidden;
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
