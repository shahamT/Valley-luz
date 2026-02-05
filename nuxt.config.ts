// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-02-05',
  
  devtools: { enabled: true },
  
  css: ['~/assets/css/main.scss'],
  
  modules: ['@pinia/nuxt'],
  
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
    // Public keys (exposed to client-side)
    public: {},
  },
  
  // Auto-import configuration
  imports: {
    dirs: ['stores', 'composables', 'utils'],
  },
})
