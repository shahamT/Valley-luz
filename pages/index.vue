<template>
  <LayoutAppShell
    :show-month-year="true"
    :month-year="monthYearDisplay"
    :current-date="currentDate"
    @prev-month="handlePrevMonth"
    @next-month="handleNextMonth"
    @select-month-year="handleMonthYearSelect"
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
        <MonthlyMonthCalendar v-else :date="currentDate" :events="filteredEvents" />
      </div>
    </div>
  </LayoutAppShell>
</template>

<script setup>
import { UI_TEXT } from '~/consts/calendar.const'
import { formatMonthYear, getCurrentYearMonth, getPrevMonth, getNextMonth } from '~/utils/date.helpers'
import { eventsService } from '~/utils/events.service'

const eventsStore = useEventsStore()
const categoriesStore = useCategoriesStore()

const selectedCategories = ref([])

const currentDate = ref(getCurrentYearMonth())

const currentYear = computed(() => currentDate.value.year)
const currentMonth = computed(() => currentDate.value.month)

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
  currentDate.value = getPrevMonth(currentYear.value, currentMonth.value)
}

const handleNextMonth = () => {
  currentDate.value = getNextMonth(currentYear.value, currentMonth.value)
}

const handleMonthYearSelect = ({ year, month }) => {
  currentDate.value = { year, month }
}

const handleToggleCategory = (categoryId) => {
  const index = selectedCategories.value.indexOf(categoryId)
  if (index > -1) {
    selectedCategories.value.splice(index, 1)
  } else {
    selectedCategories.value.push(categoryId)
  }
}

const handleResetFilter = () => {
  selectedCategories.value = []
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
