import { defineNuxtPlugin } from '#app'
import posthog from 'posthog-js'

const noopPosthog = {
  capture: () => {},
  identify: () => {},
}

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  const runInDev = runtimeConfig.public.posthogInDev === true
  const shouldInit = runtimeConfig.public.posthogPublicKey && (import.meta.env.PROD || runInDev)
  if (!shouldInit) {
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
