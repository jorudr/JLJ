import { homeContent } from './i18n/homeContent.js'

export const SITE = 'https://www.gandr.site'
export const BRAND = 'J.L.JÖRMUNGANDR'
export const SOCIAL_IMAGE = `${SITE}/screenshots/deep-data.png`

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
    '/': `Trading Journal and Trade Analytics — ${BRAND}`,
    '/download': `Download Trading Journal for Windows and macOS — ${BRAND}`,
    '/pricing': `Trading Journal Plans and Pricing — ${BRAND}`,
    '/about': `About ${BRAND} — Trading Journal for Traders`,
    '/privacy': `Privacy Policy — ${BRAND}`,
    '/terms': `Terms of Use — ${BRAND}`,
  },
  ru: {
    '/': `Торговый журнал и аналитика сделок — ${BRAND}`,
    '/download': `Скачать торговый журнал для Windows и macOS — ${BRAND}`,
    '/pricing': `Тарифы торгового журнала — ${BRAND}`,
    '/about': `О проекте ${BRAND} — торговый журнал для трейдеров`,
    '/privacy': `Политика конфиденциальности — ${BRAND}`,
    '/terms': `Условия использования — ${BRAND}`,
  },
}

export const indexedPaths = Object.keys(titles.en)

export function pageSeo(path, locale = 'en') {
  const language = locale === 'ru' ? 'ru' : 'en'
  const known = indexedPaths.includes(path)
  return {
    title: known ? titles[language][path] : `${language === 'ru' ? 'Страница не найдена' : 'Page not found'} — ${BRAND}`,
    description: path === '/' ? homeContent[language].seoText : descriptions[language][path] || '',
    canonical: known ? `${SITE}${path}` : null,
    index: known,
  }
}
