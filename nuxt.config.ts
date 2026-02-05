// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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
