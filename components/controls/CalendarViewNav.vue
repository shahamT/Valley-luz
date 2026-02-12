<template>
  <nav class="CalendarViewNav" :class="{ 'CalendarViewNav--mobile': isMobile, 'CalendarViewNav--small': isSmallMobile, 'CalendarViewNav--monthView': viewMode === 'month' }" role="navigation" aria-label="Calendar view navigation">
    <div class="CalendarViewNav-gridWrapper">
      <div class="CalendarViewNav-row">
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
              <span class="CalendarViewNav-viewToggleText">{{ viewMonthlyLabel }}</span>
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
              <span class="CalendarViewNav-viewToggleText">{{ viewDailyLabel }}</span>
            </button>
          </div>
        </div>
        <div class="CalendarViewNav-rowCenter">
          <button
            v-if="isMobile"
            type="button"
            class="CalendarViewNav-navButton CalendarViewNav-navButton--prev"
            :disabled="prevDisabled"
            :aria-label="prevAriaLabel"
            @click="handlePrev"
          >
            <UiIcon name="chevron_right" size="md" />
          </button>
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
          <button
            v-if="isMobile"
            type="button"
            class="CalendarViewNav-navButton CalendarViewNav-navButton--next"
            :aria-label="nextAriaLabel"
            @click="handleNext"
          >
            <UiIcon name="chevron_left" size="md" />
          </button>
        </div>
        <div class="CalendarViewNav-filterTriggerWrapper">
          <button
            ref="filterTriggerRef"
            type="button"
            class="CalendarViewNav-filterButton"
            :class="{ 'CalendarViewNav-filterButton--active': isFilterActive || isFilterPopupOpen }"
            :aria-label="filterButtonLabel"
            :aria-expanded="isFilterPopupOpen"
            @click="toggleFilterPopup"
          >
            <UiIcon name="filter_list" size="sm" class="CalendarViewNav-filterButtonIcon" />
            <span class="CalendarViewNav-filterButtonText">{{ filterButtonLabel }}</span>
          </button>
          <UiFilterPopup
            v-if="isFilterPopupOpen && !isMobile"
            :trigger-element="filterTriggerRef"
            :selected-categories-count="selectedCategoriesCount"
            :hours-filter-label="hoursFilterLabel"
            @close="closeFilterPopup"
          />
          <UiFilterModal
            v-if="isFilterPopupOpen && isMobile"
            :selected-categories-count="selectedCategoriesCount"
            :hours-filter-label="hoursFilterLabel"
            @close="closeFilterPopup"
          />
        </div>
      </div>
    </div>
    <div class="CalendarViewNav-separator"></div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { UI_TEXT } from '~/consts/calendar.const'
import { MOBILE_BREAKPOINT } from '~/consts/ui.const'

defineOptions({ name: 'CalendarViewNav' })

const emit = defineEmits([
  'select-month-year',
  'year-change',
  'view-change',
  'prev',
  'next',
])

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
  filterButtonLabel: {
    type: String,
    default: () => UI_TEXT.filterButtonLabel,
  },
  isFilterActive: {
    type: Boolean,
    default: false,
  },
  prevDisabled: {
    type: Boolean,
    default: false,
  },
  prevAriaLabel: {
    type: String,
    default: 'Previous',
  },
  nextAriaLabel: {
    type: String,
    default: 'Next',
  },
})

// data
const isMonthYearPickerOpen = ref(false)
const monthTriggerButtonRef = ref(null)
const isFilterPopupOpen = ref(false)
const filterTriggerRef = ref(null)
const isMobile = useScreenWidth(MOBILE_BREAKPOINT)
const isSmallMobile = useScreenWidth(560)

const viewMonthlyLabel = UI_TEXT.viewMonthly
const viewDailyLabel = UI_TEXT.viewDaily

// computed
const monthSegmentAriaLabel = computed(() =>
  props.viewMode === 'month' ? 'Monthly view (current)' : 'Switch to monthly view'
)
const daySegmentAriaLabel = computed(() =>
  props.viewMode === 'day' ? 'Daily view (current)' : 'Switch to daily view'
)

// methods
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

const handlePrev = () => {
  emit('prev')
}

const handleNext = () => {
  emit('next')
}
</script>

<style lang="scss">
.CalendarViewNav {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: var(--spacing-md);

  &-gridWrapper {
    width: 100%;
  }

  &-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: var(--spacing-md);
    direction: rtl;
    margin-bottom: var(--spacing-sm);

    @media (max-width: 768px) {
      margin-bottom: 0;
    }
  }

  &-rowLeft {
    justify-self: start;
  }

  &-rowCenter {
    justify-self: center;
  }

  &-filterTriggerWrapper {
    justify-self: end;
    position: relative;
  }

  @media (max-width: 768px) {
    &-gridWrapper {
      max-width: 400px;
      margin: 0 auto;
    }

    &-row {
      grid-template-columns: auto 1fr;
      grid-template-rows: auto auto;
      gap: var(--spacing-sm);
    }

    &-rowLeft {
      grid-column: 1;
      grid-row: 1;
      justify-self: start;
    }

    &-filterTriggerWrapper {
      grid-column: 2;
      grid-row: 1;
      justify-self: stretch;
    }

    &-rowCenter {
      grid-column: 1 / -1;
      grid-row: 2;
      justify-self: stretch;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: var(--spacing-sm);
    }

    &-monthTriggerWrapper {
      min-width: 0;
    }

    &-monthTrigger {
      width: 100% !important;
      max-width: 100%;
    }

    &-filterButton {
      width: 100%;
      min-width: unset;
    }

    &-viewToggleSegment {
      padding: 0 var(--spacing-sm);
    }
  }

  @media (max-width: 560px) {
    &-viewToggleText {
      display: none;
    }
  }

  &-navButton {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: var(--radius-md);
    background-color: var(--light-bg);
    border: none;
    color: var(--brand-dark-green);
    cursor: pointer;
    transition: background-color 0.2s ease;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      background-color: var(--day-cell-hover-bg);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  }

  &-separator {
    width: 100%;
    height: 1px;
    background-color: var(--brand-light-green);
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
    min-width: 168px;
    padding: 0 var(--spacing-md);
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--brand-dark-green);
    background-color: var(--light-bg);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease;
    white-space: nowrap;

    &:hover:not(.CalendarViewNav-filterButton--active) {
      background-color: var(--day-cell-hover-bg);
    }

    &--active {
      background-color: var(--brand-dark-green);
      color: var(--chip-text-white);

      .CalendarViewNav-filterButtonIcon {
        color: var(--chip-text-white);
      }
    }
  }

  &-filterButtonIcon {
    flex-shrink: 0;
  }

  &-filterButtonText {
    white-space: nowrap;
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

  &-viewToggleText {
    // Text hidden on small screens via media query above
  }
}
</style>
