import { createRouter, createWebHistory } from 'vue-router'
import Main from '../components/Main.vue'
import Pricing from '../components/Pricing.vue'
import NotFound from '../components/NotFound.vue'
import About from '../components/About.vue'
import Download from '../components/Download.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
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
      path: '/about',
      name: 'about',
      component: About
    },
    {
      path: '/philosophy',
      redirect: '/about'
    },
    {
      path: '/announcement',
      name: 'announcement',
      redirect: '/download'
    },
    {
      path: '/download',
      name: 'download',
      component: Download
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound
    }
  ]
})

export default router
