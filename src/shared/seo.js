import { homeContent } from './i18n/homeContent.js'

export const SITE = 'https://www.gandr.site'
export const BRAND = 'JORU'
export const BRAND_ALTERNATES = ['J.L.JÖRMUNGANDR', 'JLJ']
export const SEO_BRAND = 'JORU'
export const CONTACT_EMAIL = 'info@gandr.site'
export const SOCIAL_IMAGE = `${SITE}/screenshots/deep-data.png`
export const homeAlternates = { en: `${SITE}/`, ru: `${SITE}/ru/` }

export const keywords = {
  en: 'trading journal, trade tracker, free trading journal, best trading journal software, crypto trading journal, forex trading log, desktop trading journal, stock trade journal, automated broker import, trade review, trading psychology, win rate calculator, risk reward ratio, JORU',
  ru: 'дневник трейдера, торговый журнал, журнал сделок, скачать дневник трейдера, бесплатный дневник трейдера, журнал сделок крипта, дневник трейдера для windows и mac, анализ сделок, статистика трейдинга, софт для трейдинга, JORU',
}

export const homeVideos = [
  { id: 'log', src: '/assets/videos/log.mov', poster: '/assets/videos/log-poster.jpg', duration: 'PT14S', name: { en: 'LOG — JORU trading journal', ru: 'LOG — торговый журнал JORU' }, description: { en: 'Review every trade and decision in context so patterns become impossible to miss.', ru: 'Просматривайте каждую сделку и решение в контексте, чтобы закономерности становились очевидными.' } },
  { id: 'equity', src: '/assets/videos/equity.mov', poster: '/assets/videos/equity-poster.jpg', duration: 'PT18S', name: { en: 'EQUITY — JORU trading journal', ru: 'EQUITY — торговый журнал JORU' }, description: { en: 'Track the full performance of your strategy, from the first trade to the final result.', ru: 'Отслеживайте полную эффективность стратегии — от первой сделки до итогового результата.' } },
  { id: 'matrix', src: '/assets/videos/matrix.mov', poster: '/assets/videos/matrix-poster.jpg', duration: 'PT60S', name: { en: 'MATRIX — JORU trading journal', ru: 'MATRIX — торговый журнал JORU' }, description: { en: 'Build, connect, and explore the logic behind every trading strategy in one visual system.', ru: 'Создавайте, связывайте и исследуйте логику каждой торговой стратегии в единой визуальной системе.' } },
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
    '/': 'Free desktop trading journal for Windows and macOS. Record trades, analyze equity and drawdowns, and identify the habits costing you money. 100% private with automated broker API imports.',
    '/ru/': 'Free desktop trading journal for Windows and macOS. Record trades, analyze equity and drawdowns, and identify the habits costing you money. 100% private with automated broker API imports.',
    '/download': 'Download JORU free desktop trading journal for Windows and macOS. Log trades, review execution and analyze performance with local-first privacy and zero time limits.',
    '/pricing': 'Compare JORU free trading journal ($0 forever, no time limit) with the Full plan. Advanced pattern detection, Genesis Matrix and automated broker APIs.',
    '/about': 'Learn about JORU: the desktop trading journal designed to turn trading history into rule-based discipline. 100% private local storage.',
    '/privacy': 'Read JORU privacy commitments: your trades, journal notes and broker exchange API keys stay 100% on your local computer.',
    '/terms': 'Terms of Use governing the JORU desktop trading journal application and analytical workspace.',
  },
  ru: {
    '/': 'Бесплатный дневник трейдера для Windows и macOS. Записывайте сделки, отслеживайте кривую капитала и находите привычки, отнимающие деньги. 100% приватность и импорт брокеров.',
    '/ru/': 'Бесплатный дневник трейдера для Windows и macOS. Записывайте сделки, отслеживайте кривую капитала и находите привычки, отнимающие деньги. 100% приватность и импорт брокеров.',
    '/download': 'Скачайте бесплатный дневник трейдера JORU для Windows и macOS. Журнал сделок без ограничения по времени, локальное хранение данных и аналитика винрейта.',
    '/pricing': 'Тарифы дневника трейдера JORU: бесплатный тариф $0 навсегда без ограничений и план Full с поиском убыточных паттернов Karl-Nikolai I и API брокеров.',
    '/about': 'О проекте JORU: десктопный дневник трейдера для системного анализа решений и соблюдения торговых правил. 100% локальное хранение данных.',
    '/privacy': 'Политика конфиденциальности JORU: ваши сделки, заметки и API-ключи бирж хранятся исключительно на вашем локальном компьютере.',
    '/terms': 'Условия использования приложения торгового дневника JORU и сопутствующих сервисов.',
  },
}

const titles = {
  en: {
    '/': 'JORU — Free Desktop Trading Journal for Windows & macOS',
    '/download': 'Download Free Trading Journal for Windows & macOS — JORU',
    '/pricing': 'Trading Journal Plans & Pricing: Free Forever & Full — JORU',
    '/about': 'About JORU — Private Desktop Trading Journal & Analytics',
    '/privacy': 'Privacy Policy & Local Data Guarantees — JORU',
    '/terms': 'Terms of Use — JORU Trading Journal',
  },
  ru: {
    '/': 'JORU — Бесплатный дневник трейдера и журнал сделок для Windows и macOS',
    '/ru/': 'JORU — Бесплатный дневник трейдера и журнал сделок для Windows и macOS',
    '/download': 'Скачать бесплатный дневник трейдера для Windows и macOS — JORU',
    '/pricing': 'Тарифы дневника трейдера: бесплатно навсегда и Full — JORU',
    '/about': 'О проекте JORU — Аналитическое пространство и дневник трейдера',
    '/privacy': 'Политика конфиденциальности и локального хранения — JORU',
    '/terms': 'Условия использования — Торговый журнал JORU',
  },
}

export const contentPages = []

export const indexedPaths = [...Object.keys(titles.en), ...Object.keys(titles.en).map(p => p === '/' ? '/ru/' : `/ru${p}`)]

export function getAlternates(path) {
  const normalized = path.startsWith('/ru/')
    ? (path === '/ru/' ? '/' : path.slice(3))
    : (path.startsWith('/ru') ? (path === '/ru' ? '/' : path.slice(3)) : path)
  if (!['/', '/download', '/pricing', '/about', '/privacy', '/terms'].includes(normalized)) {
    return null
  }
  const enPath = normalized === '/' ? '/' : normalized
  const ruPath = normalized === '/' ? '/ru/' : `/ru${normalized}`
  return {
    en: `${SITE}${enPath}`,
    ru: `${SITE}${ruPath}`,
    'x-default': `${SITE}${enPath}`,
  }
}

export function pageSeo(path, locale = 'en') {
  if (['/dev', '/dev/', '/dev1', '/dev1/'].includes(path)) {
    return { title: `Redesign preview — ${BRAND}`, description: '', keywords: '', canonical: null, index: false, alternates: null }
  }
  const language = path === '/ru/' || path.startsWith('/ru/') ? 'ru' : locale === 'ru' ? 'ru' : 'en'
  const normalizedPath = path.startsWith('/ru/') ? (path === '/ru/' ? '/' : path.slice(3)) : path
  const known = indexedPaths.includes(path) || indexedPaths.includes(normalizedPath)
  const contentPage = contentPages.find(page => page.path === normalizedPath)
  if (contentPage) {
    return {
      title: language === 'ru' ? contentPage.seoTitleRu : contentPage.seoTitle,
      description: language === 'ru' ? contentPage.seoDescriptionRu : contentPage.seoDescription,
      keywords: keywords[language],
      canonical: `${SITE}${path}`,
      index: true,
      alternates: getAlternates(path),
    }
  }

  const resolvedTitle = (titles[language] && (titles[language][path] || titles[language][normalizedPath]))
    || (language === 'ru' ? titles.ru['/ru/'] : titles.en['/'])
    || `${BRAND} — Trading Journal`

  const resolvedDescription = (descriptions[language] && (descriptions[language][path] || descriptions[language][normalizedPath]))
    || (language === 'ru' ? descriptions.ru['/ru/'] : descriptions.en['/'])
    || homeContent[language]?.seoText
    || ''

  return {
    title: known ? resolvedTitle : `${language === 'ru' ? 'Страница не найдена' : 'Page not found'} — ${BRAND}`,
    description: resolvedDescription,
    keywords: keywords[language],
    canonical: known ? `${SITE}${path}` : null,
    index: known,
    alternates: known ? getAlternates(path) : null,
  }
}
