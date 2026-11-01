import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homeContent } from '../src/shared/i18n/homeContent.js'
import { renderMarkdown } from '../src/shared/legal/renderMarkdown.js'
import { SITE, BRAND, indexedPaths, pageSeo, SOCIAL_IMAGE } from '../src/shared/seo.js'

// The site is a client-rendered SPA, but crawlers that do not run JavaScript
// (including Google's OAuth brand verification) must still see the app name,
// its description and the Privacy Policy link. Each page is published with a
// static copy of its content inside #app; Vue replaces it on mount.

const APP_ROOT = '<div id="app" class="bg-black text-white"></div>'

const template = readFileSync('dist/index.html', 'utf8')
const escapeHtml = (value) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const legalHtml = (doc) => renderMarkdown(readFileSync(`src/shared/legal/${doc}.en.md`, 'utf8'))

// Shown only when JavaScript is unavailable; otherwise hidden until Vue mounts,
// with a delayed reveal in case the bundle fails to load.
const staticStyles = `<script>document.documentElement.classList.add('js')</script>
  <style>
    .static-page { max-width: 880px; margin: 0 auto; padding: 32px 16px 48px; color: rgba(245,245,240,.78); font: 16px/1.65 ui-sans-serif, system-ui, sans-serif; }
    .static-page h1, .static-page h2 { color: #f5f5f0; font-family: 'Cormorant Garamond', serif; font-weight: 400; line-height: 1.15; }
    .static-page a { color: #f5f5f0; }
    .static-page nav { display: flex; flex-wrap: wrap; gap: 8px 20px; }
    .static-page table { width: 100%; border-collapse: collapse; font-size: .9em; }
    .static-page th, .static-page td { padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,.14); text-align: left; vertical-align: top; }
    .static-page .legal-table { overflow-x: auto; }
    .js .static-page { visibility: hidden; animation: static-reveal 0s 4s forwards; }
    @keyframes static-reveal { to { visibility: visible; } }
  </style>`

const header = (locale) => `<header>
      <a href="${locale === 'ru' ? '/ru/' : '/'}"><strong>${BRAND}</strong></a>
      <nav aria-label="Primary">
        <a href="/download">${locale === 'ru' ? 'Скачать' : 'Download'}</a>
        <a href="/pricing">${locale === 'ru' ? 'Тарифы' : 'Pricing'}</a>
        <a href="/about">${locale === 'ru' ? 'О нас' : 'About'}</a>
        <a href="${locale === 'ru' ? '/' : '/ru/'}" hreflang="${locale === 'ru' ? 'en' : 'ru'}">${locale === 'ru' ? 'English' : 'Русский'}</a>
      </nav>
    </header>`

const footer = (locale) => `<footer>
      <p><strong>${BRAND}</strong> — ${escapeHtml(homeContent[locale].seoTitle)}.</p>
      <nav aria-label="Legal">
        <a href="/privacy">${locale === 'ru' ? 'Политика конфиденциальности' : 'Privacy Policy'}</a>
        <a href="/terms">${locale === 'ru' ? 'Условия использования' : 'Terms of Use'}</a>
        <a href="mailto:gandr.trade@gmail.com">gandr.trade@gmail.com</a>
      </nav>
    </footer>`

const homeBody = (locale) => {
  const copy = homeContent[locale]
  return `<h1>${escapeHtml(copy.seoTitle)} — ${BRAND}</h1>
    <p>${escapeHtml(copy.seoText)}</p>
    <section>
      <h2>${escapeHtml(copy.guideTitle)}</h2>
      <p>${escapeHtml(copy.guideIntro)}</p>
      <ol>${copy.guideSteps.map(step => `<li><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.text)}</p></li>`).join('')}</ol>
      <p>${escapeHtml(copy.guideClosing)} <a href="/pricing">${escapeHtml(copy.pricingDetails)}</a>.</p>
    </section>
    <section>
      <h2>${escapeHtml(copy.scenariosTitle)}</h2>
      <ul>${copy.scenarios.map(item => `<li><strong>${escapeHtml(item.title)}.</strong> ${escapeHtml(item.text)}</li>`).join('')}</ul>
    </section>
    <section>
      <h2>${escapeHtml(copy.communityTitle)}</h2>
      <ul>${copy.community.map(item => `<li><strong>${escapeHtml(item.title)}.</strong> ${escapeHtml(item.text)}</li>`).join('')}</ul>
    </section>
    <section id="google-sign-in">
      <h2>${escapeHtml(copy.dataTitle)}</h2>
      <p>${escapeHtml(copy.dataText)} <a href="/privacy">${escapeHtml(copy.dataLink)}</a>.</p>
    </section>
    <section>
      <h2>${escapeHtml(copy.faqTitle)}</h2>
      <dl>${copy.faq.map(item => `<dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd>`).join('')}</dl>
    </section>`
}

const legalBody = (title, doc) => `<h1>${title}</h1>
    <p>${BRAND} — <a href="/terms">Terms of Use</a> · <a href="/privacy">Privacy Policy</a></p>
    <article>${legalHtml(doc)}</article>`

const downloadBody = `<h1>Download ${BRAND} for Windows and macOS</h1>
    <p>Download the desktop trading journal for Windows or macOS. Start with the free plan to record trades, screenshots and decision notes. Compare available features on the <a href="/pricing">pricing page</a>.</p>
    <p>For installation help and updates, visit the <a href="https://t.me/gandr_trade">Telegram community</a>.</p>`

const pricingBody = `<h1>Trading journal plans and pricing</h1>
    <p>Start with the free trading journal to record trades, screenshots and notes. The Full plan adds advanced trade analysis and tools for developing trading strategies.</p>
    <p>Review the plans in the application and <a href="/download">download ${BRAND}</a> for Windows or macOS.</p>`

const aboutBody = `<h1>About ${BRAND}</h1>
    <p>${BRAND} is a desktop trading journal and analytical workspace for reviewing decisions, tracking results and developing trading rules.</p>
    <p>Its name and visual identity reflect the project’s approach to disciplined market work. Explore the <a href="/">trading journal</a> or <a href="/download">download the application</a>.</p>`

const pages = [
  { file: 'index.html', path: '/', body: homeBody('en'), locale: 'en' },
  { file: 'ru/index.html', path: '/ru/', body: homeBody('ru'), locale: 'ru' },
  { file: 'privacy.html', path: '/privacy', body: legalBody('Privacy Policy', 'privacy') },
  { file: 'terms.html', path: '/terms', body: legalBody('Terms of Use', 'terms') },
  { file: 'download.html', path: '/download', body: downloadBody },
  { file: 'pricing.html', path: '/pricing', body: pricingBody },
  { file: 'about.html', path: '/about', body: aboutBody },
  { file: 'philosophy.html', path: '/about', body: aboutBody },
  { file: 'announcement.html', path: '/download', body: downloadBody },
  { file: '404.html', path: null, body: `<h1>Page not found</h1><p>Return to the <a href="/">trading journal home page</a>.</p>` },
]

const setMeta = (html, pattern, content) => {
  if (!pattern.test(html)) throw new Error(`static-pages: ${pattern} not found in dist/index.html`)
  return html.replace(pattern, (_, before, after) => `${before}${escapeHtml(content)}${after}`)
}

const render = ({ path, body, locale = 'en' }) => {
  const { title, description } = pageSeo(path || '', locale)
  let html = template
  html = html.replace('<html lang="en"', `<html lang="${locale}"`)
  html = setMeta(html, /(<title>)[^<]*(<\/title>)/, title)
  html = setMeta(html, /(<meta name="description" content=")[^"]*(")/, description)
  html = setMeta(html, /(<meta property="og:title" content=")[^"]*(")/, title)
  html = setMeta(html, /(<meta property="og:description" content=")[^"]*(")/, description)
  html = setMeta(html, /(<meta property="og:image" content=")[^"]*(")/, SOCIAL_IMAGE)
  if (path !== '/' && path !== '/ru/') {
    html = html.replace(/\s*<link rel="alternate" hreflang="(?:en|ru)"[^>]*>/g, '')
  }
  if (path) {
    html = setMeta(html, /(<link rel="canonical" href=")[^"]*(")/, `${SITE}${path}`)
    html = setMeta(html, /(<meta property="og:url" content=")[^"]*(")/, `${SITE}${path}`)
  } else {
    html = html
      .replace(/\s*<link rel="canonical"[^>]*>/, '')
      .replace(/\s*<meta property="og:url"[^>]*>/, '')
      .replace(/(<meta name="robots" content=")[^"]*(")/, '$1noindex$2')
  }
  if (!html.includes(APP_ROOT)) throw new Error('static-pages: #app root not found in dist/index.html')
  if (path === '/' || path === '/ru/') {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: BRAND,
      url: `${SITE}${path}`,
      description: homeContent[locale].seoText,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Windows, macOS',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', url: `${SITE}/pricing` },
    }
    html = html.replace('</head>', `  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>\n</head>`)
  }
  return html
    .replace('</head>', `  ${staticStyles}\n</head>`)
    .replace(APP_ROOT, `<div id="app" class="bg-black text-white">
  <div class="static-page">
    ${header(locale)}
    <main>
    ${body}
    </main>
    ${footer(locale)}
  </div>
</div>`)
}

// Keep existing English routes as flat files. The Russian homepage uses its own
// directory so GitHub Pages serves /ru/ on its canonical URL.
for (const page of pages) {
  if (page.file.includes('/')) mkdirSync(`dist/${page.file.slice(0, page.file.lastIndexOf('/'))}`, { recursive: true })
  writeFileSync(`dist/${page.file}`, render(page))
}

writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`)
writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexedPaths.map(path => `  <url><loc>${SITE}${path}</loc></url>`).join('\n')}\n</urlset>\n`)
