import { homeContent } from './i18n/homeContent.js'

export const SITE = 'https://www.gandr.site'
export const BRAND = 'J.L.JÖRMUNGANDR'
export const SOCIAL_IMAGE = `${SITE}/screenshots/deep-data.png`
export const homeAlternates = { en: `${SITE}/`, ru: `${SITE}/ru/` }

const descriptions = {
  en: {
    '/download': 'Download J.L.JÖRMUNGANDR for Windows or macOS. Start recording trades and reviewing your trading performance with the free plan.',
    '/pricing': 'Compare the free trading journal with the Full plan for advanced trade analytics, strategy tools and performance review.',
    '/about': 'Learn about the name, ideas and visual identity behind J.L.JÖRMUNGANDR, a desktop trading journal and analytical workspace.',
    '/privacy': 'Read how J.L.JÖRMUNGANDR uses Google Sign-In data and handles your account information, trading journal and exchange API keys.',
    '/terms': 'Read the terms governing use of the J.L.JÖRMUNGANDR trading journal and related services.',
  },
  ru: {
    '/download': 'Скачайте торговый журнал J.L.JÖRMUNGANDR для Windows или macOS. Начните записывать сделки и анализировать результаты бесплатно.',
    '/pricing': 'Сравните бесплатный торговый журнал с тарифом Full: расширенная аналитика сделок, инструменты стратегий и анализ результатов.',
    '/about': 'Узнайте о названии, идеях и визуальном стиле J.L.JÖRMUNGANDR — торгового журнала и аналитического пространства для трейдеров.',
    '/privacy': 'Узнайте, как J.L.JÖRMUNGANDR обрабатывает данные входа через Google, сведения об аккаунте, журнал сделок и API-ключи бирж.',
    '/terms': 'Ознакомьтесь с условиями использования торгового журнала J.L.JÖRMUNGANDR и связанных сервисов.',
  },
}

const titles = {
  en: {
    '/': 'JORU',
    '/download': `Download Trading Journal for Windows and macOS — ${BRAND}`,
    '/pricing': `Trading Journal Plans and Pricing — ${BRAND}`,
    '/about': `About ${BRAND} — Trading Journal for Traders`,
    '/privacy': `Privacy Policy — ${BRAND}`,
    '/terms': `Terms of Use — ${BRAND}`,
  },
  ru: {
    '/ru/': `Дневник трейдера и аналитика сделок — ${BRAND}`,
    '/download': `Скачать торговый журнал для Windows и macOS — ${BRAND}`,
    '/pricing': `Тарифы торгового журнала — ${BRAND}`,
    '/about': `О проекте ${BRAND} — торговый журнал для трейдеров`,
    '/privacy': `Политика конфиденциальности — ${BRAND}`,
    '/terms': `Условия использования — ${BRAND}`,
  },
}

export const contentPages = [
  {
    path: '/trading-journal-software',
    doc: 'trading-journal-software',
    title: 'Trading journal software built for serious traders',
    subtitle: 'What to look for in trading journal software, and how journaling, strategy design and analytics fit together.',
    seoTitle: `Trading Journal Software — ${BRAND}`,
    seoDescription: 'What trading journal software needs to do beyond logging trades: strategy versioning, execution analytics and broker integration.',
  },
  {
    path: '/trading-journal-for-day-traders',
    doc: 'trading-journal-for-day-traders',
    title: 'The trading journal day traders actually need',
    subtitle: 'High trade volume and fast decisions need a journal that surfaces patterns, not just logs trades.',
    seoTitle: `Trading Journal for Day Traders — ${BRAND}`,
    seoDescription: 'What a trading journal for day traders should track: session breakdowns, execution quality and rule discipline.',
  },
  {
    path: '/free-trading-journal',
    doc: 'free-trading-journal',
    title: 'What a free trading journal should cover',
    subtitle: 'The fundamentals that matter most — trade logging, screenshots and context — before you pay for anything.',
    seoTitle: `Free Trading Journal — ${BRAND}`,
    seoDescription: 'What to expect from a free trading journal, and why consistent logging matters more than the feature tier.',
  },
  {
    path: '/how-to-keep-a-trading-journal',
    doc: 'how-to-keep-a-trading-journal',
    title: 'How to keep a trading journal',
    subtitle: 'A practical, step-by-step approach to journaling trades so patterns become visible instead of forgotten.',
    seoTitle: `How to Keep a Trading Journal — ${BRAND}`,
    seoDescription: 'A step-by-step guide to keeping a trading journal: what to record, how to tag trades and how to review them.',
  },
]

export const indexedPaths = [...Object.keys(titles.en), '/ru/', ...contentPages.map(page => page.path)]

export function pageSeo(path, locale = 'en') {
  const language = path === '/ru/' ? 'ru' : path === '/' ? 'en' : locale === 'ru' ? 'ru' : 'en'
  const known = indexedPaths.includes(path)
  const contentPage = contentPages.find(page => page.path === path)
  if (contentPage) {
    return {
      title: contentPage.seoTitle,
      description: contentPage.seoDescription,
      canonical: `${SITE}${path}`,
      index: true,
    }
  }
  return {
    title: known ? titles[language][path] : `${language === 'ru' ? 'Страница не найдена' : 'Page not found'} — ${BRAND}`,
    description: path === '/' || path === '/ru/' ? homeContent[language].seoText : descriptions[language][path] || '',
    canonical: known ? `${SITE}${path}` : null,
    index: known,
  }
}
