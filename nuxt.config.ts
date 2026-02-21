// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-15',
  
  devtools: { enabled: true },

  devServer: {
    port: 3000,
  },
  
  css: ['~/assets/css/main.scss'],
  
  modules: ['@pinia/nuxt', '@vueuse/nuxt', 'floating-vue/nuxt'],
  
  app: {
    head: {
      title: 'Valley Luz',
      htmlAttrs: {
        lang: 'he',
        dir: 'rtl',
      },
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200',
        },
      ],
    },
  },
  
  runtimeConfig: {
    // Private keys (only available on server-side)
    mongodbUri: process.env.MONGODB_URI,
    mongodbDbName: process.env.MONGODB_DB_NAME,
    mongodbCollectionEvents: process.env.MONGODB_COLLECTION_EVENTS || 'events',
    mongodbCollectionRawMessages: process.env.MONGODB_COLLECTION_RAW_MESSAGES || 'raw_messages',
    // Public keys (exposed to client-side)
    public: {
      posthogPublicKey: process.env.NUXT_PUBLIC_POSTHOG_PUBLIC_KEY || '',
      posthogHost: process.env.NUXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
      posthogDefaults: process.env.NUXT_PUBLIC_POSTHOG_DEFAULTS || '2026-01-30',
    },
  },
  
  // Auto-import configuration
  imports: {
    dirs: ['stores', 'composables', 'utils'],
  },
})
