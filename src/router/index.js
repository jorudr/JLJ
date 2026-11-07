import { createRouter, createWebHistory } from 'vue-router'
import Main from '../components/Main.vue'
import Pricing from '../components/Pricing.vue'
import NotFound from '../components/NotFound.vue'
import About from '../components/About.vue'
import Download from '../components/Download.vue'
import LegalPage from '../components/LegalPage.vue'
import ContentPage from '../components/ContentPage.vue'
import { useI18n } from '../shared/i18n/useI18n'
import { contentPages } from '../shared/seo'

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
      path: '/ru/',
      name: 'home-ru',
      component: Main
    },
    {
      path: '/pricing',
      name: 'pricing',
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
      path: '/terms',
      name: 'terms',
      component: LegalPage,
      props: { doc: 'terms' },
      meta: { titleKey: 'landing.legal.termsTitle' }
    },
    ...contentPages.flatMap(({ path, doc, title, subtitle, titleRu, subtitleRu }) => [{
      path,
      name: `content-${doc}`,
      component: ContentPage,
      props: { path, doc, title, subtitle, titleRu, subtitleRu },
    }, {
      path: `/ru${path}`,
      name: `content-${doc}-ru`,
      component: ContentPage,
      props: { path, doc, title, subtitle, titleRu, subtitleRu },
    }]),
    {
      // Work-in-progress redesign. Not indexed (see pageSeo in shared/seo.js).
      path: '/dev',
      name: 'dev',
      component: () => import('../components/dev/DevHome.vue')
    },
    {
      // Brutalist editorial redesign. Not indexed (see pageSeo in shared/seo.js).
      path: '/dev1',
      name: 'dev1',
      component: () => import('../components/dev1/Dev1.vue')
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
  if (to.path === '/' || to.path === '/ru/') {
    useI18n().setLocale(to.path === '/ru/' ? 'ru' : 'en')
  } else if (to.path.startsWith('/ru/')) {
    useI18n().setLocale('ru')
  } else if (contentPages.some(({ path }) => path === to.path)) {
    useI18n().setLocale('en')
  }
})

export default router
