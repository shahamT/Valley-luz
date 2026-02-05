import { createRouter, createWebHistory } from 'vue-router'
import { isValidRouteDate } from '../helpers/validation.helpers'

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
      component: () => import('../pages/MonthlyViewPage.vue')
    },
    {
      path: '/daily-view/:date',
      name: 'daily-view',
      component: () => import('../pages/DailyViewPage.vue'),
      props: true,
      beforeEnter: (to, from, next) => {
        const dateParam = to.params.date
        if (isValidRouteDate(dateParam)) {
          next()
        } else {
          next({ name: 'not-found' })
        }
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../pages/NotFoundPage.vue')
    }
  ]
})

export default router
