import { homeContent } from './i18n/homeContent.js'

export const SITE = 'https://www.gandr.site'
export const BRAND = 'JORU'
export const BRAND_ALTERNATES = ['J.L.JÖRMUNGANDR', 'JLJ']
export const SEO_BRAND = 'JORU'
export const CONTACT_EMAIL = 'info@gandr.site'
export const SOCIAL_IMAGE = `${SITE}/screenshots/deep-data.png`
export const homeAlternates = { en: `${SITE}/`, ru: `${SITE}/ru/` }

export const homeVideos = [
  { id: 'log', src: '/assets/videos/log.mov', poster: '/assets/videos/log-poster.jpg', duration: 'PT14S', name: { en: 'LOG — J. L. JÖRMUNGANDR trading journal', ru: 'LOG — торговый журнал J. L. JÖRMUNGANDR' }, description: { en: 'Review every trade and decision in context so patterns become impossible to miss.', ru: 'Просматривайте каждую сделку и решение в контексте, чтобы закономерности становились очевидными.' } },
  { id: 'equity', src: '/assets/videos/equity.mov', poster: '/assets/videos/equity-poster.jpg', duration: 'PT18S', name: { en: 'EQUITY — J. L. JÖRMUNGANDR trading journal', ru: 'EQUITY — торговый журнал J. L. JÖRMUNGANDR' }, description: { en: 'Track the full performance of your strategy, from the first trade to the final result.', ru: 'Отслеживайте полную эффективность стратегии — от первой сделки до итогового результата.' } },
  { id: 'matrix', src: '/assets/videos/matrix.mov', poster: '/assets/videos/matrix-poster.jpg', duration: 'PT60S', name: { en: 'MATRIX — J. L. JÖRMUNGANDR trading journal', ru: 'MATRIX — торговый журнал J. L. JÖRMUNGANDR' }, description: { en: 'Build, connect, and explore the logic behind every trading strategy in one visual system.', ru: 'Создавайте, связывайте и исследуйте логику каждой торговой стратегии в единой визуальной системе.' } },
]
export const HOME_VIDEOS_UPLOAD_DATE = '2026-08-19'

export function videoStructuredData(locale = 'en') {
  return homeVideos.map(video => ({
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.name[locale] || video.name.en,
    description: video.description[locale] || video.description.en,
    thumbnailUrl: `${SITE}${video.poster}`,
    contentUrl: `${SITE}${video.src}`,
    uploadDate: HOME_VIDEOS_UPLOAD_DATE,
    duration: video.duration,
  }))
}

const descriptions = {
  en: {
    '/': `${BRAND} is a trading journal for Windows and macOS. Log trades, track equity and drawdowns, and find the patterns costing you money.`,
    '/download': `Download ${BRAND} for Windows or macOS. Start recording trades and reviewing your trading performance with the free plan.`,
    '/pricing': 'Compare the free trading journal with the Full plan for advanced trade analytics, strategy tools and performance review.',
    '/about': `Learn about the name, ideas and visual identity behind ${BRAND}, a desktop trading journal and analytical workspace.`,
    '/privacy': `Read how ${BRAND} uses Google Sign-In data and handles your account information, trading journal and exchange API keys.`,
    '/terms': `Read the terms governing use of the ${BRAND} trading journal and related services.`,
  },
  ru: {
    '/ru/': `${BRAND} — торговый журнал для Windows и macOS. Записывайте сделки, отслеживайте капитал и находите закономерности, которые стоят вам денег.`,
    '/download': `Скачайте торговый журнал ${BRAND} для Windows или macOS. Начните записывать сделки и анализировать результаты бесплатно.`,
    '/pricing': 'Сравните бесплатный торговый журнал с тарифом Full: расширенная аналитика сделок, инструменты стратегий и анализ результатов.',
    '/about': `Узнайте о названии, идеях и визуальном стиле ${BRAND} — торгового журнала и аналитического пространства для трейдеров.`,
    '/privacy': `Узнайте, как ${BRAND} обрабатывает данные входа через Google, сведения об аккаунте, журнал сделок и API-ключи бирж.`,
    '/terms': `Ознакомьтесь с условиями использования торгового журнала ${BRAND} и связанных сервисов.`,
  },
}

const titles = {
  en: {
    '/': `Trading Journal — ${SEO_BRAND}`,
    '/download': `Download Trading Journal for Windows and macOS — ${SEO_BRAND}`,
    '/pricing': `Trading Journal Plans and Pricing — ${SEO_BRAND}`,
    '/about': `About ${SEO_BRAND} — Trading Journal for Traders`,
    '/privacy': `Privacy Policy — ${SEO_BRAND}`,
    '/terms': `Terms of Use — ${SEO_BRAND}`,
  },
  ru: {
    '/ru/': `Дневник трейдера и аналитика сделок — ${SEO_BRAND}`,
    '/download': `Скачать торговый журнал для Windows и macOS — ${SEO_BRAND}`,
    '/pricing': `Тарифы торгового журнала — ${SEO_BRAND}`,
    '/about': `О проекте ${SEO_BRAND} — торговый журнал для трейдеров`,
    '/privacy': `Политика конфиденциальности — ${SEO_BRAND}`,
    '/terms': `Условия использования — ${SEO_BRAND}`,
  },
}

export const contentPages = [
  {
    path: '/trading-journal-software',
    doc: 'trading-journal-software',
    title: 'Trading journal software built for serious traders',
    subtitle: 'What to look for in trading journal software, and how journaling, strategy design and analytics fit together.',
    seoTitle: `Trading Journal Software — ${SEO_BRAND}`,
    seoDescription: 'What trading journal software needs to do beyond logging trades: strategy versioning, execution analytics and broker integration.',
    titleRu: 'Программа для торгового журнала: аналитика и стратегии',
    subtitleRu: 'Как выбрать ПО для торгового журнала и объединить записи, разработку стратегий и аналитику.',
    seoTitleRu: `Программа для торгового журнала — ${SEO_BRAND}`,
    seoDescriptionRu: 'Какие функции нужны программе для торгового журнала помимо записи сделок: аналитика исполнения, проверка стратегий и интеграция с брокером.',
  },
  {
    path: '/trading-journal-for-day-traders',
    doc: 'trading-journal-for-day-traders',
    title: 'The trading journal day traders actually need',
    subtitle: 'High trade volume and fast decisions need a journal that surfaces patterns, not just logs trades.',
    seoTitle: `Trading Journal for Day Traders — ${SEO_BRAND}`,
    seoDescription: 'What a trading journal for day traders should track: session breakdowns, execution quality and rule discipline.',
    titleRu: 'Торговый журнал для дейтрейдеров',
    subtitleRu: 'Высокая частота сделок требует журнала, который находит закономерности, а не просто хранит записи.',
    seoTitleRu: `Торговый журнал для дейтрейдеров — ${SEO_BRAND}`,
    seoDescriptionRu: 'Что должен отслеживать журнал дейтрейдера: торговые сессии, качество исполнения и соблюдение правил.',
  },
  {
    path: '/free-trading-journal',
    doc: 'free-trading-journal',
    title: 'What a free trading journal should cover',
    subtitle: 'The fundamentals that matter most — trade logging, screenshots and context — before you pay for anything.',
    seoTitle: `Free Trading Journal — ${SEO_BRAND}`,
    seoDescription: 'What to expect from a free trading journal, and why consistent logging matters more than the feature tier.',
    titleRu: 'Что должен включать бесплатный торговый журнал',
    subtitleRu: 'Главное — записи сделок, скриншоты и контекст до перехода на платные инструменты.',
    seoTitleRu: `Бесплатный торговый журнал — ${SEO_BRAND}`,
    seoDescriptionRu: 'Что ожидать от бесплатного торгового журнала и почему регулярные записи важнее набора функций.',
  },
  {
    path: '/how-to-keep-a-trading-journal',
    doc: 'how-to-keep-a-trading-journal',
    title: 'How to keep a trading journal',
    subtitle: 'A practical, step-by-step approach to journaling trades so patterns become visible instead of forgotten.',
    seoTitle: `How to Keep a Trading Journal — ${SEO_BRAND}`,
    seoDescription: 'A step-by-step guide to keeping a trading journal: what to record, how to tag trades and how to review them.',
    titleRu: 'Как вести торговый журнал',
    subtitleRu: 'Практическое руководство: как записывать сделки и находить закономерности в своей торговле.',
    seoTitleRu: `Как вести торговый журнал — ${SEO_BRAND}`,
    seoDescriptionRu: 'Пошаговое руководство по торговому журналу: что записывать, как размечать сделки и анализировать результаты.',
  },
]

export const indexedPaths = [...Object.keys(titles.en), '/ru/', ...contentPages.flatMap(page => [page.path, `/ru${page.path}`])]

export function pageSeo(path, locale = 'en') {
  if (['/dev', '/dev/', '/dev1', '/dev1/'].includes(path)) {
    return { title: `Redesign preview — ${BRAND}`, description: '', canonical: null, index: false }
  }
  const language = path === '/ru/' ? 'ru' : path === '/' ? 'en' : locale === 'ru' ? 'ru' : 'en'
  const known = indexedPaths.includes(path)
  const normalizedPath = path.startsWith('/ru/') ? path.slice(3) : path
  const contentPage = contentPages.find(page => page.path === normalizedPath)
  if (contentPage) {
    return {
      title: language === 'ru' ? contentPage.seoTitleRu : contentPage.seoTitle,
      description: language === 'ru' ? contentPage.seoDescriptionRu : contentPage.seoDescription,
      canonical: `${SITE}${path}`,
      index: true,
    }
  }
  return {
    title: known ? titles[language][path] : `${language === 'ru' ? 'Страница не найдена' : 'Page not found'} — ${BRAND}`,
    description: descriptions[language][path] || homeContent[language]?.seoText || '',
    canonical: known ? `${SITE}${path}` : null,
    index: known,
  }
}
