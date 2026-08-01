import { createRouter, createWebHistory } from 'vue-router'
import Main from '../components/Main.vue'
import Pricing from '../components/Pricing.vue'
import UseCase from '../components/UseCase.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.path === from.path && to.query.case !== from.query.case && !to.hash) return false
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: Main
    },
    {
      path: '/pricing',
      name: 'pricing',
      component: Pricing
    },
    {
      path: '/use-cases',
      name: 'use-cases',
      component: UseCase
    }
  ]
})

export default router
