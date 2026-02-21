# Galiluz – Frontend architecture

High-level map of the Nuxt frontend: main flows, where they start, and which files they touch.

## Directory layout

- **pages/** – `index` (redirect), `monthly-view`, `daily-view`, `[...slug]` (404).
- **components/** – `layout/` (AppShell, AppHeader), `controls/` (CalendarViewNav, CalendarViewHeader), `monthly/` (MonthCarousel, MonthCalendar, DayCell, WeekdayRow), `daily/` (KanbanCarousel, KanbanColumn, KanbanEventCard), `ui/` (filters, pickers, popups, EventModal sub-parts, Icon, Loader). Root: EventModal, CalendarViewContent.
- **composables/** – Data: useCalendarViewData, useEvents, useCategories. URL/state: useUrlState, useCalendarNavigation, useCalendarPageInit. Filtering: useEventFilters. Modal: useEventModalData. Utils: useScreenWidth, useIconFontReady, usePosthog.
- **stores/** – calendar.store (filters, currentDate, lastDailyViewDate), ui.store (event modal + URL sync).
- **utils/** – events.service, events.helpers, calendar.helpers, calendar-display.helpers, date.helpers, validation.helpers, navigation.service, calendar.service, media.helpers, logger.
- **consts/** – events.const (EVENT_CATEGORIES), calendar.const, ui.const.
- **plugins/** – data-init.client (fetches events + categories once, provides to app).

---

## Flow 1: Calendar view and URL (month/daily, date, view toggle)

1. **View toggle** – User clicks month/day in CalendarViewNav → emit to CalendarViewHeader → monthly-view/daily-view handle: monthly calls `switchToDailyView(currentDate)`, daily calls `navigateToMonth(headerDate)` (useCalendarNavigation).
2. **useCalendarNavigation** – `switchToDailyView` / `navigateToDay` / `navigateToMonth` use router + calendarStore (setCurrentDate, lastDailyViewDate).
3. **URL sync** – useCalendarPageInit({ syncMonth }) returns runPageInit(), which runs initializeFromUrl(), startUrlSync(), and uiStore.initializeModalFromUrl(). Both calendar pages call runPageInit() in onMounted (daily-view after validating/fixing date query and nextTick). Route paths: consts/calendar.const (ROUTE_MONTHLY_VIEW, ROUTE_DAILY_VIEW).
4. **Carousels** – monthly-view passes visibleMonths, currentDate, filteredEvents, categories → MonthCarousel → MonthCalendar → DayCell. daily-view passes visibleDays, eventsByDate, dateParam, categories → KanbanCarousel → KanbanColumn → KanbanEventCard. Swipe/change → emit → page updates store and/or navigates.

**Files:** CalendarViewNav, CalendarViewHeader, monthly-view, daily-view, useCalendarNavigation, useUrlState, calendar.store, MonthCarousel, MonthCalendar, DayCell, KanbanCarousel, KanbanColumn, date.helpers, validation.helpers.

---

## Flow 2: Events data (API → monthly grid & daily columns)

1. **Fetch** – Plugin data-init.client runs on client and calls useEvents() + useCategories(), provides as `$eventsData` / `$categoriesData`. useCalendarViewData() uses those when present, else calls useEvents/useCategories directly (e.g. SSR or EventModal).
2. **useEvents** – useFetch('/api/events', server: false), then flattenEventsByOccurrence (events.service) → one item per occurrence (FlatEvent).
3. **useCategories** – useFetch('/api/categories', server: false) → categories object.
4. **Monthly** – Page gets events from useCalendarViewData, getFilteredEventsForMonth from useEventFilters(events) → filteredEvents → MonthCarousel → MonthCalendar. MonthCalendar uses getEventsByDate + generateCalendarDays → calendarDays with day.events → DayCell.
5. **Daily** – Same events; getFilteredEventsByDate(visibleDays) from useEventFilters(events) → eventsByDate (date → transformed cards) → KanbanCarousel → KanbanColumn → KanbanEventCard.

**Files:** data-init.client, useEvents, useCategories, useCalendarViewData, server/api/events, server/api/categories, events.service, events.helpers, useEventFilters, monthly-view, daily-view, MonthCarousel, MonthCalendar, DayCell, KanbanCarousel, KanbanColumn, KanbanEventCard, calendar.helpers.

---

## Flow 3: Filtering (categories + hours → URL and calendar)

1. **UI** – CalendarViewHeader gets categories from page and filter state from calendarStore; CalendarViewNav opens FilterPopup/FilterModal with FilterPanel. FilterPanel: CategoryPill toggles → calendarStore.toggleCategory; HoursFilterPanel → setTimeRange / setTimePreset.
2. **Store** – calendar.store holds selectedCategories, timeFilterStart/End, timeFilterPreset. setFiltersFromUrl used by useUrlState.initializeFromUrl.
3. **URL / persistence** – useUrlState watchers update query (categories, timeStart, timeEnd, timePreset) and saveFilterPreference (localStorage). On load, initializeFromUrl applies query or saved preference.
4. **Application** – useEventFilters(events) reads store and exposes getFilteredEventsForMonth, getFilteredEventsByDate. Pages use these for filteredEvents / eventsByDate passed to carousels.

**Files:** CalendarViewNav, CalendarViewHeader, FilterPopup, FilterModal, FilterPanel, HoursFilterPanel, CategoryPill, calendar.store, useUrlState, useEventFilters, validation.helpers, events.service, calendar.const.

---

## Flow 4: Event modal (open from daily card or URL)

1. **Open** – KanbanEventCard click → uiStore.openEventModal(eventId). ui.store sets selectedEventId, isEventModalShowing, and router.push({ query: { ...query, event: eventId } }).
2. **Render** – app.vue renders EventModal when isEventModalShowing. EventModal uses useCalendarViewData() for events/categories, finds selectedEvent by selectedEventId, useEventModalData for display fields.
3. **Close** – closeEventModal clears state and removes `event` from query.
4. **URL restore** – initializeModalFromUrl() in both pages on mount; ui.store also watches route.query.event for back/forward.

**Files:** KanbanEventCard, ui.store, app.vue, EventModal, useCalendarViewData, useEventModalData, events.helpers, date.helpers, media.helpers, ui.const, EventModalHeader, EventModalInfoBar, EventModalActions.

---

## Flow 5: Categories (source and propagation)

1. **Source** – consts/events.const.js defines EVENT_CATEGORIES. server/consts/events.const.ts re-exports; server/api/categories returns them. useCategories fetches; plugin provides; useCalendarViewData exposes.
2. **Propagation** – Pages get categories from useCalendarViewData and pass as props: CalendarViewHeader → CalendarViewNav → FilterPopup/FilterModal → FilterPanel; MonthCarousel → MonthCalendar → DayCell; KanbanCarousel → KanbanColumn → KanbanEventCard. EventModal uses useCalendarViewData() (no prop). Filter state (selected IDs) lives in calendarStore; category definitions (labels, colors) come from props or useCalendarViewData.
3. **Usage** – getCategoryColor, getCategoryLabel (calendar-display.helpers) in DayCell, KanbanEventCard, EventModalHeader; FilterPanel renders CategoryPill list.

**Files:** events.const.js, server/api/categories, useCategories, useCalendarViewData, calendar-display.helpers, FilterPanel, DayCell, KanbanEventCard, EventModalHeader.

---

## Conventions

- **Composables:** Prefer composables for reusable, scoped logic; Pinia for global shared state (calendar filters, modal state).
- **URL state:** useUrlState centralizes reading query → store and watching store → URL + localStorage. useCalendarPageInit wraps that plus modal-from-URL; both calendar pages call runPageInit() in onMounted. Route paths are in consts/calendar.const (ROUTE_MONTHLY_VIEW, ROUTE_DAILY_VIEW).
- **Data:** Events and categories are fetched once in the plugin and consumed via useCalendarViewData so components don’t re-fetch. EventModal also uses useCalendarViewData for the same source.
- **Script order (components):** defineOptions → defineProps → defineEmits → data (composables, refs) → lifecycle → computed → methods → watchers. Import order: NPM → project (consts, utils) → components, with blank lines between groups.
