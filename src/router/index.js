import { createRouter, createWebHistory } from 'vue-router'
import Main from '../components/Main.vue'
import Pricing from '../components/Pricing.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
    }
  ]
})

export default router
