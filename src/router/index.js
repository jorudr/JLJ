import { createRouter, createWebHistory } from 'vue-router'
import Main from '../components/Main.vue'
import Dev1 from '../components/dev1/Dev1.vue'
import Pricing from '../components/Pricing.vue'
import NotFound from '../components/NotFound.vue'
import About from '../components/About.vue'
import Download from '../components/Download.vue'
import LegalPage from '../components/LegalPage.vue'
import { useI18n } from '../shared/i18n/useI18n'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, left: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: Dev1,
      alias: '/dev1'
    },
    {
      path: '/ru',
      redirect: '/ru/'
    },
    {
      path: '/ru/',
      name: 'home-ru',
      component: Dev1
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

router.beforeEach((to) => {
  if (to.path === '/ru' || to.path === '/ru/' || to.path.startsWith('/ru/')) {
    useI18n().setLocale('ru')
  } else {
    useI18n().setLocale('en')
  }
})

export default router
