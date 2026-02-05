import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/monthly-view'
    },
    {
      path: '/monthly-view',
      name: 'monthly-view',
      component: () => import('../components/MonthlySchedule.vue')
    },
    {
      path: '/daily-view',
      name: 'daily-view',
      component: () => import('../components/DailySchedule.vue')
    }
  ]
})

export default router
