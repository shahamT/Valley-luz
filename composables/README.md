# Composables

Composables are auto-imported. Use them in setup, plugins, or route middleware.

## Conventions

**Import order** (in any file): NPM packages → Hooks/Services → Components → SVG/Icons, with blank lines between groups.

**Vue script section order** (in components): `defineOptions` (name) → `defineProps` → `defineEmits` → data (composables, stores, refs) → lifecycle hooks → computed → methods → watchers → component imports.
