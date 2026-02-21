# Composables

Composables are auto-imported. Use them in setup, plugins, or route middleware.

## Conventions

**Import order** (in any file): NPM packages → Hooks/Services → Components → SVG/Icons, with blank lines between groups.

**Vue script section order** (in components): `defineOptions` (name) → `defineProps` → `defineEmits` → data (composables, stores, refs) → lifecycle hooks → computed → methods → watchers → component imports.

**Page init:** useCalendarPageInit({ syncMonth }) returns runPageInit(). Call runPageInit() from onMounted in monthly-view and daily-view so URL init, URL sync watchers, and modal-from-URL run in one place.

**Flows and architecture:** See [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for a map of calendar view, events data, filtering, event modal, and categories flows and which files they touch.
