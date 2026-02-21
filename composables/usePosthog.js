/**
 * Composable for PostHog analytics: capture events and identify users.
 * Use in components or pages (client-side only; safe on SSR – no-op when $posthog is missing).
 *
 * @example
 * const { capture, identify } = usePosthog()
 * capture('event_created', { eventId: '123' })
 * identify('user-123', { email: 'user@example.com' })
 */
export function usePosthog() {
  const nuxtApp = useNuxtApp()
  const posthog = nuxtApp.$posthog

  function capture(eventName, properties = {}) {
    if (posthog) {
      posthog.capture(eventName, properties)
    }
  }

  function identify(distinctId, traits = {}) {
    if (posthog) {
      posthog.identify(distinctId, traits)
    }
  }

  return {
    posthog,
    capture,
    identify,
  }
}
