import { defineNuxtPlugin } from '#app'
import posthog from 'posthog-js'

const noopPosthog = {
  capture: () => {},
  identify: () => {},
}

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  if (!import.meta.env.PROD || !runtimeConfig.public.posthogPublicKey) {
    return { provide: { posthog: noopPosthog } }
  }

  const posthogClient = posthog.init(runtimeConfig.public.posthogPublicKey, {
    api_host: runtimeConfig.public.posthogHost,
    defaults: runtimeConfig.public.posthogDefaults,
    capture_pageview: false, // we capture pageviews in router.afterEach to include SPA navigations
  })

  const router = useRouter()
  router.afterEach((to) => {
    const url = typeof window !== 'undefined' ? window.location.origin + to.fullPath : to.fullPath
    posthogClient.capture('$pageview', { $current_url: url })
  })

  return {
    provide: {
      posthog: posthogClient,
    },
  }
})
