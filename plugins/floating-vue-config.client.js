/**
 * Configure floating-vue defaults (runs after floating-vue/nuxt plugin).
 * Sets tooltip distance so there is a visible gap between trigger and tooltip.
 */
import { options } from 'floating-vue'

export default defineNuxtPlugin(() => {
  // Default is 5; set to 9 so there is a visible ~4px gap between trigger and tooltip
  options.distance = 9
})
