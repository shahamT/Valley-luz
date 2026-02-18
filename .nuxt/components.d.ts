
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


export const CalendarViewContent: typeof import("../components/CalendarViewContent.vue").default
export const EventModal: typeof import("../components/EventModal.vue").default
export const ControlsCalendarViewHeader: typeof import("../components/controls/CalendarViewHeader.vue").default
export const ControlsCalendarViewNav: typeof import("../components/controls/CalendarViewNav.vue").default
export const DailyKanbanCarousel: typeof import("../components/daily/KanbanCarousel.vue").default
export const DailyKanbanColumn: typeof import("../components/daily/KanbanColumn.vue").default
export const DailyKanbanEventCard: typeof import("../components/daily/KanbanEventCard.vue").default
export const LayoutAppHeader: typeof import("../components/layout/AppHeader.vue").default
export const LayoutAppShell: typeof import("../components/layout/AppShell.vue").default
export const MonthlyDayCell: typeof import("../components/monthly/DayCell.vue").default
export const MonthlyMonthCalendar: typeof import("../components/monthly/MonthCalendar.vue").default
export const MonthlyMonthCarousel: typeof import("../components/monthly/MonthCarousel.vue").default
export const MonthlyWeekdayRow: typeof import("../components/monthly/WeekdayRow.vue").default
export const UiCalendarNavArrow: typeof import("../components/ui/CalendarNavArrow.vue").default
export const UiCalendarOptionsPopup: typeof import("../components/ui/CalendarOptionsPopup.vue").default
export const UiCategoryPill: typeof import("../components/ui/CategoryPill.vue").default
export const UiEventModalActions: typeof import("../components/ui/EventModalActions.vue").default
export const UiEventModalHeader: typeof import("../components/ui/EventModalHeader.vue").default
export const UiEventModalInfoBar: typeof import("../components/ui/EventModalInfoBar.vue").default
export const UiFilterModal: typeof import("../components/ui/FilterModal.vue").default
export const UiFilterPanel: typeof import("../components/ui/FilterPanel.vue").default
export const UiFilterPopup: typeof import("../components/ui/FilterPopup.vue").default
export const UiHoursFilterPanel: typeof import("../components/ui/HoursFilterPanel.vue").default
export const UiIcon: typeof import("../components/ui/Icon.vue").default
export const UiImagePopup: typeof import("../components/ui/ImagePopup.vue").default
export const UiLoadingSpinner: typeof import("../components/ui/LoadingSpinner.vue").default
export const UiLocationInfoPopup: typeof import("../components/ui/LocationInfoPopup.vue").default
export const UiMonthYearModal: typeof import("../components/ui/MonthYearModal.vue").default
export const UiMonthYearPicker: typeof import("../components/ui/MonthYearPicker.vue").default
export const UiMonthYearPopup: typeof import("../components/ui/MonthYearPopup.vue").default
export const UiNavigationOptionsPopup: typeof import("../components/ui/NavigationOptionsPopup.vue").default
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue").default
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout").default
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only").default
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only").default
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder").default
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link").default
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue").default
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page").default
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components").NoScript
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components").Link
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components").Base
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components").Title
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components").Meta
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components").Style
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components").Head
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components").Html
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components").Body
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island").default
export const LazyCalendarViewContent: LazyComponent<typeof import("../components/CalendarViewContent.vue").default>
export const LazyEventModal: LazyComponent<typeof import("../components/EventModal.vue").default>
export const LazyControlsCalendarViewHeader: LazyComponent<typeof import("../components/controls/CalendarViewHeader.vue").default>
export const LazyControlsCalendarViewNav: LazyComponent<typeof import("../components/controls/CalendarViewNav.vue").default>
export const LazyDailyKanbanCarousel: LazyComponent<typeof import("../components/daily/KanbanCarousel.vue").default>
export const LazyDailyKanbanColumn: LazyComponent<typeof import("../components/daily/KanbanColumn.vue").default>
export const LazyDailyKanbanEventCard: LazyComponent<typeof import("../components/daily/KanbanEventCard.vue").default>
export const LazyLayoutAppHeader: LazyComponent<typeof import("../components/layout/AppHeader.vue").default>
export const LazyLayoutAppShell: LazyComponent<typeof import("../components/layout/AppShell.vue").default>
export const LazyMonthlyDayCell: LazyComponent<typeof import("../components/monthly/DayCell.vue").default>
export const LazyMonthlyMonthCalendar: LazyComponent<typeof import("../components/monthly/MonthCalendar.vue").default>
export const LazyMonthlyMonthCarousel: LazyComponent<typeof import("../components/monthly/MonthCarousel.vue").default>
export const LazyMonthlyWeekdayRow: LazyComponent<typeof import("../components/monthly/WeekdayRow.vue").default>
export const LazyUiCalendarNavArrow: LazyComponent<typeof import("../components/ui/CalendarNavArrow.vue").default>
export const LazyUiCalendarOptionsPopup: LazyComponent<typeof import("../components/ui/CalendarOptionsPopup.vue").default>
export const LazyUiCategoryPill: LazyComponent<typeof import("../components/ui/CategoryPill.vue").default>
export const LazyUiEventModalActions: LazyComponent<typeof import("../components/ui/EventModalActions.vue").default>
export const LazyUiEventModalHeader: LazyComponent<typeof import("../components/ui/EventModalHeader.vue").default>
export const LazyUiEventModalInfoBar: LazyComponent<typeof import("../components/ui/EventModalInfoBar.vue").default>
export const LazyUiFilterModal: LazyComponent<typeof import("../components/ui/FilterModal.vue").default>
export const LazyUiFilterPanel: LazyComponent<typeof import("../components/ui/FilterPanel.vue").default>
export const LazyUiFilterPopup: LazyComponent<typeof import("../components/ui/FilterPopup.vue").default>
export const LazyUiHoursFilterPanel: LazyComponent<typeof import("../components/ui/HoursFilterPanel.vue").default>
export const LazyUiIcon: LazyComponent<typeof import("../components/ui/Icon.vue").default>
export const LazyUiImagePopup: LazyComponent<typeof import("../components/ui/ImagePopup.vue").default>
export const LazyUiLoadingSpinner: LazyComponent<typeof import("../components/ui/LoadingSpinner.vue").default>
export const LazyUiLocationInfoPopup: LazyComponent<typeof import("../components/ui/LocationInfoPopup.vue").default>
export const LazyUiMonthYearModal: LazyComponent<typeof import("../components/ui/MonthYearModal.vue").default>
export const LazyUiMonthYearPicker: LazyComponent<typeof import("../components/ui/MonthYearPicker.vue").default>
export const LazyUiMonthYearPopup: LazyComponent<typeof import("../components/ui/MonthYearPopup.vue").default>
export const LazyUiNavigationOptionsPopup: LazyComponent<typeof import("../components/ui/NavigationOptionsPopup.vue").default>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue").default>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout").default>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue").default>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only").default>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only").default>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder").default>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link").default>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator").default>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue").default>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer").default>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtImg>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs").NuxtPicture>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page").default>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").NoScript>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Link>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Base>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Title>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Meta>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Style>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Head>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Html>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components").Body>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island").default>

export const componentNames: string[]
