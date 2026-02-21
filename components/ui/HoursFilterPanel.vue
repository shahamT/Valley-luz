<template>
  <div class="HoursFilterPanel">
    <div class="HoursFilterPanel-sliderWrap">
      <ClientOnly>
        <Slider
          :model-value="rangeArray"
          :min="0"
          :max="MINUTES_PER_DAY"
          :step="TIME_SLIDER_STEP"
          :format="formatTime"
          direction="ltr"
          class="HoursFilterPanel-slider"
          @update:model-value="handleSliderChange"
        />
        <template #fallback>
          <div class="HoursFilterPanel-sliderFallback">
            {{ formatMinutesToTime(timeFilterStart) }} – {{ formatMinutesToTime(timeFilterEnd) }}
          </div>
        </template>
      </ClientOnly>
    </div>
    <div class="HoursFilterPanel-presets">
      <button
        v-for="preset in TIME_FILTER_PRESETS"
        :key="preset.id"
        type="button"
        class="HoursFilterPanel-presetBtn"
        :class="{ 'HoursFilterPanel-presetBtn--active': isPresetActive(preset) }"
        @click="handlePresetClick(preset.id)"
      >
        <UiIcon :name="preset.icon" size="lg" class="HoursFilterPanel-presetIcon" />
        <span class="HoursFilterPanel-presetText">
          <span class="HoursFilterPanel-presetLabel">{{ preset.label }}</span>
          <span class="HoursFilterPanel-presetHours">{{ preset.id === 'all' ? '00:00–24:00' : presetTimeRange(preset) }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import Slider from '@vueform/slider'
import '@vueform/slider/themes/default.css'
import { MINUTES_PER_DAY, TIME_FILTER_PRESETS, TIME_SLIDER_STEP } from '~/consts/calendar.const'
import { formatMinutesToTime } from '~/utils/date.helpers'

defineOptions({ name: 'HoursFilterPanel' })

// data
const calendarStore = useCalendarStore()
const { timeFilterStart, timeFilterEnd, timeFilterPreset } = storeToRefs(calendarStore)

// computed
const rangeArray = computed(() => [timeFilterStart.value, timeFilterEnd.value])

const isAllHoursSelected = computed(
  () => timeFilterStart.value === 0 && timeFilterEnd.value === MINUTES_PER_DAY
)

// methods
function isPresetActive(preset) {
  if (preset.id === 'all') {
    return isAllHoursSelected.value
  }
  return timeFilterPreset.value === preset.id
}
function formatTime(value) {
  return formatMinutesToTime(value)
}

function handleSliderChange(value) {
  if (Array.isArray(value) && value.length >= 2) {
    calendarStore.setTimeRange(value[0], value[1])
    calendarStore.clearTimePreset()
  }
}

function presetTimeRange(preset) {
  return `${formatMinutesToTime(preset.startMinutes)}–${formatMinutesToTime(preset.endMinutes)}`
}

function handlePresetClick(presetId) {
  calendarStore.setTimePreset(presetId)
  if (presetId === 'all') {
    calendarStore.clearTimePreset()
  }
}
</script>

<style lang="scss">
@use '~/assets/css/breakpoints' as *;

.HoursFilterPanel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;

  @include mobile {
    gap: var(--spacing-xl);
  }

  &-sliderWrap {
    padding: var(--spacing-lg) var(--spacing-lg) 0;
    max-width: 100%;
  }

  &-sliderFallback {
    font-size: var(--font-size-sm);
    color: var(--color-text-light);
    padding: var(--spacing-sm) 0;
  }

  &-slider {
    --slider-connect-bg: var(--brand-dark-green);
    --slider-tooltip-bg: var(--brand-dark-green);
    --slider-handle-ring-color: var(--brand-light-green);
  }

  @include mobile {
    .slider-tooltip {
      font-size: var(--font-size-md) !important;
    }
  }

  &-presets {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
    gap: var(--spacing-md);
  }

  &-presetBtn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    width: 100%;
    min-height: 0;
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-light);
    background-color: transparent;
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;

    &:hover:not(.HoursFilterPanel-presetBtn--active) {
      color: var(--color-text);
      border-color: var(--brand-dark-green);
    }

    &--active {
      color: var(--chip-text-white);
      background-color: var(--brand-dark-green);
      border-color: var(--brand-dark-green);

      .HoursFilterPanel-presetIcon {
        color: var(--chip-text-white);
      }
    }

    @include mobile {
      padding: var(--spacing-md);
      font-size: var(--font-size-md);
    }
  }

  &-presetIcon {
    flex-shrink: 0;
    display: block;
  }

  &-presetText {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-2xs);
    text-align: center;
  }

  &-presetLabel {
    font-size: inherit;
    font-weight: 600;
    line-height: 1.2;

    @include mobile {
      font-size: var(--font-size-md) !important;
    }
  }

  &-presetHours {
    font-size: var(--font-size-xs);
    font-variant-numeric: tabular-nums;
    opacity: 0.9;

    @include mobile {
      font-size: var(--font-size-sm);
    }
  }
}
</style>
