
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T

interface _GlobalComponents {
  'EventModal': typeof import("../../components/EventModal.vue").default
  'ControlsTopControls': typeof import("../../components/controls/TopControls.vue").default
  'DailyEventCard': typeof import("../../components/daily/EventCard.vue").default
  'DailyEventList': typeof import("../../components/daily/EventList.vue").default
  'LayoutAppHeader': typeof import("../../components/layout/AppHeader.vue").default
  'LayoutAppShell': typeof import("../../components/layout/AppShell.vue").default
  'MonthlyDayCell': typeof import("../../components/monthly/DayCell.vue").default
  'MonthlyMonthCalendar': typeof import("../../components/monthly/MonthCalendar.vue").default
  'MonthlyWeekdayRow': typeof import("../../components/monthly/WeekdayRow.vue").default
  'UiCategoryPill': typeof import("../../components/ui/CategoryPill.vue").default
  'UiIcon': typeof import("../../components/ui/Icon.vue").default
  'UiLoadingSpinner': typeof import("../../components/ui/LoadingSpinner.vue").default
  'UiMonthYearModal': typeof import("../../components/ui/MonthYearModal.vue").default
  'UiMonthYearPicker': typeof import("../../components/ui/MonthYearPicker.vue").default
  'UiMonthYearPopup': typeof import("../../components/ui/MonthYearPopup.vue").default
  'UiMonthYearSelection': typeof import("../../components/ui/MonthYearSelection.vue").default
  'UiPillButton': typeof import("../../components/ui/PillButton.vue").default
  'NuxtWelcome': typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue").default
  'NuxtLayout': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout").default
  'NuxtErrorBoundary': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default
  'ClientOnly': typeof import("../../node_modules/nuxt/dist/app/components/client-only").default
  'DevOnly': typeof import("../../node_modules/nuxt/dist/app/components/dev-only").default
  'ServerPlaceholder': typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder").default
  'NuxtLink': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link").default
  'NuxtLoadingIndicator': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default
  'NuxtTime': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue").default
  'NuxtRouteAnnouncer': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default
  'NuxtImg': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg
  'NuxtPicture': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture
  'NuxtPage': typeof import("../../node_modules/nuxt/dist/pages/runtime/page").default
  'NoScript': typeof import("../../node_modules/nuxt/dist/head/runtime/components").NoScript
  'Link': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Link
  'Base': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Base
  'Title': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Title
  'Meta': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Meta
  'Style': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Style
  'Head': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Head
  'Html': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Html
  'Body': typeof import("../../node_modules/nuxt/dist/head/runtime/components").Body
  'NuxtIsland': typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island").default
  'LazyEventModal': LazyComponent<typeof import("../../components/EventModal.vue").default>
  'LazyControlsTopControls': LazyComponent<typeof import("../../components/controls/TopControls.vue").default>
  'LazyDailyEventCard': LazyComponent<typeof import("../../components/daily/EventCard.vue").default>
  'LazyDailyEventList': LazyComponent<typeof import("../../components/daily/EventList.vue").default>
  'LazyLayoutAppHeader': LazyComponent<typeof import("../../components/layout/AppHeader.vue").default>
  'LazyLayoutAppShell': LazyComponent<typeof import("../../components/layout/AppShell.vue").default>
  'LazyMonthlyDayCell': LazyComponent<typeof import("../../components/monthly/DayCell.vue").default>
  'LazyMonthlyMonthCalendar': LazyComponent<typeof import("../../components/monthly/MonthCalendar.vue").default>
  'LazyMonthlyWeekdayRow': LazyComponent<typeof import("../../components/monthly/WeekdayRow.vue").default>
  'LazyUiCategoryPill': LazyComponent<typeof import("../../components/ui/CategoryPill.vue").default>
  'LazyUiIcon': LazyComponent<typeof import("../../components/ui/Icon.vue").default>
  'LazyUiLoadingSpinner': LazyComponent<typeof import("../../components/ui/LoadingSpinner.vue").default>
  'LazyUiMonthYearModal': LazyComponent<typeof import("../../components/ui/MonthYearModal.vue").default>
  'LazyUiMonthYearPicker': LazyComponent<typeof import("../../components/ui/MonthYearPicker.vue").default>
  'LazyUiMonthYearPopup': LazyComponent<typeof import("../../components/ui/MonthYearPopup.vue").default>
  'LazyUiMonthYearSelection': LazyComponent<typeof import("../../components/ui/MonthYearSelection.vue").default>
  'LazyUiPillButton': LazyComponent<typeof import("../../components/ui/PillButton.vue").default>
  'LazyNuxtWelcome': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue").default>
  'LazyNuxtLayout': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout").default>
  'LazyNuxtErrorBoundary': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default>
  'LazyClientOnly': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only").default>
  'LazyDevOnly': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only").default>
  'LazyServerPlaceholder': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder").default>
  'LazyNuxtLink': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link").default>
  'LazyNuxtLoadingIndicator': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default>
  'LazyNuxtTime': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue").default>
  'LazyNuxtRouteAnnouncer': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default>
  'LazyNuxtImg': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg>
  'LazyNuxtPicture': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture>
  'LazyNuxtPage': LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page").default>
  'LazyNoScript': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").NoScript>
  'LazyLink': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Link>
  'LazyBase': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Base>
  'LazyTitle': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Title>
  'LazyMeta': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Meta>
  'LazyStyle': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Style>
  'LazyHead': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Head>
  'LazyHtml': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Html>
  'LazyBody': LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components").Body>
  'LazyNuxtIsland': LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island").default>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
