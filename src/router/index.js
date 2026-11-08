import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import Pricing from '../components/Pricing.vue'
import NotFound from '../components/NotFound.vue'
import About from '../components/About.vue'
import Download from '../components/Download.vue'
import LegalPage from '../components/LegalPage.vue'
import { useI18n } from '../shared/i18n/useI18n'
import { isReadyForTransitions, isNavigating, runPageTransition } from '../shared/pageTransition'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash) {
      const target = typeof document !== 'undefined' ? document.querySelector(to.hash) : null
      if (target && getComputedStyle(target).display !== 'none') {
        return { el: to.hash, top: 46, behavior: 'smooth' }
      }
      if (to.hash === '#chart') {
        return { el: '#karl-nikolai', top: 46, behavior: 'smooth' }
      }
      return { el: to.hash, top: 46, behavior: 'smooth' }
    }
    return { top: 0, left: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      alias: '/dev1'
    },
    {
      path: '/ru',
      redirect: '/ru/'
    },
    {
      path: '/ru/',
      name: 'home-ru',
      component: Home
    },
    {
      path: '/pricing',
      name: 'pricing',
      component: Pricing,
      meta: { titleKey: 'landing.nav.pricing' }
    },
    {
      path: '/ru/pricing',
      name: 'pricing-ru',
      component: Pricing,
      meta: { titleKey: 'landing.nav.pricing' }
    },
    {
      path: '/about',
      name: 'about',
      component: About,
      meta: { titleKey: 'landing.nav.about' }
    },
    {
      path: '/ru/about',
      name: 'about-ru',
      component: About,
      meta: { titleKey: 'landing.nav.about' }
    },
    {
      path: '/philosophy',
      redirect: '/about'
    },
    {
      path: '/ru/philosophy',
      redirect: '/ru/about'
    },
    {
      path: '/announcement',
      name: 'announcement',
      redirect: '/download'
    },
    {
      path: '/download',
      name: 'download',
      component: Download,
      meta: { titleKey: 'landing.nav.download' }
    },
    {
      path: '/ru/download',
      name: 'download-ru',
      component: Download,
      meta: { titleKey: 'landing.nav.download' }
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: LegalPage,
      props: { doc: 'privacy' },
      meta: { titleKey: 'landing.legal.privacyTitle' }
    },
    {
      path: '/ru/privacy',
      name: 'privacy-ru',
      component: LegalPage,
      props: { doc: 'privacy' },
      meta: { titleKey: 'landing.legal.privacyTitle' }
    },
    {
      path: '/terms',
      name: 'terms',
      component: LegalPage,
      props: { doc: 'terms' },
      meta: { titleKey: 'landing.legal.termsTitle' }
    },
    {
      path: '/ru/terms',
      name: 'terms-ru',
      component: LegalPage,
      props: { doc: 'terms' },
      meta: { titleKey: 'landing.legal.termsTitle' }
    },
    {
      // Work-in-progress redesign. Not indexed (see pageSeo in shared/seo.js).
      path: '/dev',
      name: 'dev',
      component: () => import('../components/dev/DevHome.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
      meta: { titleKey: 'landing.notFound.title' }
    }
  ]
})

const normalizePath = (p) => (p === '/ru' ? '/ru/' : p)

router.beforeEach((to, from, next) => {
  if (to.path === '/ru' || to.path === '/ru/' || to.path.startsWith('/ru/')) {
    useI18n().setLocale('ru')
  } else {
    useI18n().setLocale('en')
  }

  if (isNavigating()) {
    return next()
  }

  if (!isReadyForTransitions() || normalizePath(to.path) === normalizePath(from.path)) {
    return next()
  }

  runPageTransition(() => {
    next()
  })
})

export default router
