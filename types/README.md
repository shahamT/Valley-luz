# Type Definitions

This directory contains TypeScript type definitions for the Galiluz project.

## Purpose

These type definitions serve two purposes:

1. **Documentation** - They document the structure of data entities used throughout the application
2. **Future Migration** - They prepare the codebase for future TypeScript migration

## Current State

The project currently uses JavaScript (.js files), but these type definitions provide:
- Clear documentation of data structures
- Type hints for IDEs with JSDoc support
- A foundation for incremental TypeScript migration

## Usage

### In JSDoc Comments

You can reference these types in JSDoc comments:

```javascript
/**
 * @param {import('~/types/events').Event} event
 * @returns {string}
 */
export function getEventTitle(event) {
  return event.title
}
```

### For IDE Type Hints

Most modern IDEs will recognize these type definitions and provide autocomplete and type checking even in JavaScript files.

## Migration Path

To migrate to TypeScript:

1. Rename `.js` files to `.ts` incrementally
2. Add type annotations using these interfaces
3. Enable TypeScript checking in `nuxt.config.ts`
4. Fix type errors as they appear

## Type Files

- **events.d.ts** - Event, Category, Occurrence, and related types
