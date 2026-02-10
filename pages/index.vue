<template>
  <LayoutAppShell
    :show-month-year="true"
    :month-year="monthYearDisplay"
    :current-date="currentDate"
    @prev-month="handlePrevMonth"
    @next-month="handleNextMonth"
    @select-month-year="handleMonthYearSelect"
    @year-change="handleYearChange"
  >
    <div class="MonthlyView">
      <div class="MonthlyView-header">
        <ControlsTopControls 
          mode="month" 
          :categories="categoriesStore.categories"
          :selected-categories="selectedCategories"
          @toggle-category="handleToggleCategory"
          @reset-filter="handleResetFilter"
        />
        <div class="MonthlyView-separator"></div>
      </div>
      <div class="MonthlyView-calendar">
        <UiLoadingSpinner v-if="isLoading" :message="UI_TEXT.loading" />
        <div v-else-if="isError" class="MonthlyView-error">
          <p>{{ UI_TEXT.error }}</p>
        </div>
        <MonthlyMonthCalendar
          v-else
          :key="`${currentDate.year}-${currentDate.month}`"
          :date="currentDate"
          :events="filteredEvents"
        />
      </div>
    </div>
  </LayoutAppShell>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { UI_TEXT } from '~/consts/calendar.const'
import { formatMonthYear, getCurrentYearMonth, getPrevMonth, getNextMonth } from '~/utils/date.helpers'
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

const handlePrevMonth = () => {
  calendarStore.setCurrentDate(getPrevMonth(currentDate.value.year, currentDate.value.month))
}

const handleNextMonth = () => {
  calendarStore.setCurrentDate(getNextMonth(currentDate.value.year, currentDate.value.month))
}

const handleMonthYearSelect = ({ year, month }) => {
  calendarStore.setCurrentDate({ year, month })
}

const handleYearChange = ({ year }) => {
  calendarStore.setCurrentDate({ ...currentDate.value, year })
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

  &-header {
    grid-row: 1;
  }

  &-separator {
    width: 100%;
    height: 1px;
    background-color: var(--brand-light-green);
    margin-top: var(--spacing-md);
  }

  &-calendar {
    grid-row: 2;
    min-height: 0;
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
