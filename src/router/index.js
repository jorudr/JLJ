import { createRouter, createWebHistory } from 'vue-router'
import Main from '../components/Main.vue'
import Pricing from '../components/Pricing.vue'
import UseCase from '../components/UseCase.vue'

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
    },
    {
      path: '/use-cases',
      name: 'use-cases',
      component: UseCase
    },
    {
      path: '/use-cases/:caseSlug',
      name: 'use-case',
      component: UseCase,
      props: true
    }
  ]
})

export default router
