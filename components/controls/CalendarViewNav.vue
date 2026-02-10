<template>
  <nav class="CalendarViewNav" role="navigation" aria-label="Calendar view navigation">
    <div class="CalendarViewNav-row CalendarViewNav-row--top">
      <div class="CalendarViewNav-rowLeft">
        <div class="CalendarViewNav-viewToggle" role="group" aria-label="View mode">
          <button
            type="button"
            class="CalendarViewNav-viewToggleSegment"
            :class="{ 'CalendarViewNav-viewToggleSegment--active': viewMode === 'month' }"
            :aria-label="monthSegmentAriaLabel"
            :aria-pressed="viewMode === 'month'"
            @click="handleViewSegmentClick('month')"
          >
            <UiIcon name="calendar_month" size="sm" class="CalendarViewNav-viewToggleIcon" />
            <span>{{ viewMonthlyLabel }}</span>
          </button>
          <button
            type="button"
            class="CalendarViewNav-viewToggleSegment"
            :class="{ 'CalendarViewNav-viewToggleSegment--active': viewMode === 'day' }"
            :aria-label="daySegmentAriaLabel"
            :aria-pressed="viewMode === 'day'"
            @click="handleViewSegmentClick('day')"
          >
            <UiIcon name="view_agenda" size="sm" class="CalendarViewNav-viewToggleIcon" />
            <span>{{ viewDailyLabel }}</span>
          </button>
        </div>
      </div>
      <div class="CalendarViewNav-rowCenter">
        <div class="CalendarViewNav-monthTriggerWrapper">
          <button
            ref="monthTriggerButtonRef"
            type="button"
            class="CalendarViewNav-monthTrigger"
            aria-label="Select month and year"
            @click="toggleMonthYearPicker"
          >
            <span class="CalendarViewNav-month">{{ monthYear }}</span>
            <UiIcon name="expand_more" size="sm" class="CalendarViewNav-chevron" />
          </button>
          <UiMonthYearPopup
            v-if="isMonthYearPickerOpen && !isMobile"
            :current-date="currentDate"
            :trigger-element="monthTriggerButtonRef"
            @close="closeMonthYearPicker"
            @select="handleMonthYearSelect"
            @year-change="handleYearChange"
          />
          <UiMonthYearModal
            v-if="isMonthYearPickerOpen && isMobile"
            :current-date="currentDate"
            @close="closeMonthYearPicker"
            @select="handleMonthYearSelect"
            @year-change="handleYearChange"
          />
        </div>
      </div>
      <div class="CalendarViewNav-filterTriggerWrapper">
        <button
          ref="filterTriggerRef"
          type="button"
          class="CalendarViewNav-filterButton"
          :aria-label="filterButtonLabel"
          aria-expanded="isFilterPopupOpen"
          @click="toggleFilterPopup"
        >
          <UiIcon name="filter_list" size="sm" class="CalendarViewNav-filterButtonIcon" />
          <span>{{ filterButtonLabel }}</span>
        </button>
        <UiFilterPopup
          v-if="isFilterPopupOpen && !isMobile"
          :trigger-element="filterTriggerRef"
          :selected-categories-count="selectedCategoriesCount"
          :hours-filter-label="hoursFilterLabel"
          @close="closeFilterPopup"
          @toggle-category="$emit('toggle-category', $event)"
          @reset-filter="handleFilterCategoriesReset"
          @click-hours="$emit('click-hours')"
        />
        <UiFilterModal
          v-if="isFilterPopupOpen && isMobile"
          :selected-categories-count="selectedCategoriesCount"
          :hours-filter-label="hoursFilterLabel"
          @close="closeFilterPopup"
          @toggle-category="$emit('toggle-category', $event)"
          @reset-filter="handleFilterCategoriesReset"
          @click-hours="$emit('click-hours')"
        />
      </div>
    </div>
    <div class="CalendarViewNav-separator"></div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { UI_TEXT } from '~/consts/calendar.const'

const props = defineProps({
  viewMode: {
    type: String,
    required: true,
    validator: (value) => ['month', 'day'].includes(value),
  },
  monthYear: {
    type: String,
    default: '',
  },
  currentDate: {
    type: Object,
    default: () => ({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    }),
  },
  selectedCategoriesCount: {
    type: Number,
    default: 0,
  },
  hoursFilterLabel: {
    type: String,
    default: () => UI_TEXT.hoursFilterAll,
  },
})

const emit = defineEmits([
  'select-month-year',
  'year-change',
  'view-change',
  'click-hours',
  'toggle-category',
  'reset-filter',
])

const isMonthYearPickerOpen = ref(false)
const monthTriggerButtonRef = ref(null)
const isFilterPopupOpen = ref(false)
const filterTriggerRef = ref(null)
const isMobile = useScreenWidth(768)

const viewMonthlyLabel = UI_TEXT.viewMonthly
const viewDailyLabel = UI_TEXT.viewDaily
const filterButtonLabel = UI_TEXT.filterButtonLabel

const monthSegmentAriaLabel = computed(() =>
  props.viewMode === 'month' ? 'Monthly view (current)' : 'Switch to monthly view'
)
const daySegmentAriaLabel = computed(() =>
  props.viewMode === 'day' ? 'Daily view (current)' : 'Switch to daily view'
)

const toggleMonthYearPicker = () => {
  if (isFilterPopupOpen.value) closeFilterPopup()
  isMonthYearPickerOpen.value = !isMonthYearPickerOpen.value
}

const closeMonthYearPicker = () => {
  isMonthYearPickerOpen.value = false
}

const toggleFilterPopup = () => {
  if (isMonthYearPickerOpen.value) closeMonthYearPicker()
  isFilterPopupOpen.value = !isFilterPopupOpen.value
}

const closeFilterPopup = () => {
  isFilterPopupOpen.value = false
}

const handleFilterCategoriesReset = () => {
  closeFilterPopup()
  emit('reset-filter')
}

const handleMonthYearSelect = ({ year, month }) => {
  emit('select-month-year', { year, month })
  closeMonthYearPicker()
}

const handleYearChange = ({ year }) => {
  emit('year-change', { year })
}

const handleViewSegmentClick = (view) => {
  if (view === props.viewMode) return
  emit('view-change', { view })
}
</script>

<style lang="scss">
.CalendarViewNav {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: var(--spacing-md);

  &-row {
    display: flex;
    align-items: center;
    width: 100%;
    gap: var(--spacing-md);

    &--top {
      justify-content: space-between;
    }

    &--bottom {
      justify-content: space-between;
    }
  }

  &-rowLeft {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  &-rowCenter {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &-filterTriggerWrapper {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  &-separator {
    width: 100%;
    height: 1px;
    background-color: var(--brand-light-green);
  }

  &-filterTriggerWrapper {
    position: relative;
  }

  .CalendarViewNav-row--top &-filterTriggerWrapper {
    flex: 1;
    justify-content: flex-end;
  }

  &-monthTriggerWrapper {
    position: relative;
  }

  &-monthTrigger {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    width: 12rem;
    height: 34px;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--brand-dark-green);
    background-color: var(--light-bg);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: var(--day-cell-hover-bg);
    }
  }

  &-month {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &-chevron {
    color: var(--brand-dark-green);
    flex-shrink: 0;
  }

  &-filterButton {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    height: 34px;
    padding: 0 var(--spacing-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--brand-dark-green);
    background-color: var(--light-bg);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color 0.2s ease;
    white-space: nowrap;

    &:hover {
      background-color: var(--day-cell-hover-bg);
    }
  }

  &-filterButtonIcon {
    flex-shrink: 0;
  }

  &-viewToggle {
    display: flex;
    align-items: stretch;
    height: 34px;
    border-radius: var(--radius-md);
    overflow: hidden;
    background-color: var(--light-bg);
  }

  &-viewToggleSegment {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 0 var(--spacing-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--brand-dark-green);
    background-color: transparent;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;

    &:hover:not(.CalendarViewNav-viewToggleSegment--active) {
      background-color: var(--day-cell-hover-bg);
    }

    &--active {
      background-color: var(--brand-dark-green);
      color: var(--chip-text-white);

      .CalendarViewNav-viewToggleIcon {
        color: var(--chip-text-white);
      }
    }
  }

  &-viewToggleIcon {
    flex-shrink: 0;
  }
}
</style>
