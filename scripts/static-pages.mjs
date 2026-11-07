import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homeContent } from '../src/shared/i18n/homeContent.js'
import { renderMarkdown } from '../src/shared/legal/renderMarkdown.js'
import { SITE, BRAND, BRAND_ALTERNATES, CONTACT_EMAIL, indexedPaths, pageSeo, SOCIAL_IMAGE, contentPages, homeVideos, videoStructuredData, HOME_VIDEOS_UPLOAD_DATE } from '../src/shared/seo.js'

const BUILD_DATE = new Date().toISOString().slice(0, 10)

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

// Shown immediately for crawlers and no-JS clients. Once Vue mounts it replaces
// this content directly (no hidden/holding state, so there is no CLS or
// blank-screen risk if the bundle is slow or fails to load).
const staticStyles = `<style>
    .static-page { max-width: 880px; margin: 0 auto; padding: 32px 16px 48px; color: rgba(245,245,240,.78); font: 16px/1.65 ui-sans-serif, system-ui, sans-serif; }
    .static-page h1, .static-page h2 { color: #f5f5f0; font-family: 'Cormorant Garamond', serif; font-weight: 400; line-height: 1.15; }
    .static-page a { color: #f5f5f0; }
    .static-page nav { display: flex; flex-wrap: wrap; gap: 8px 20px; }
    .static-page table { width: 100%; border-collapse: collapse; font-size: .9em; }
    .static-page th, .static-page td { padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,.14); text-align: left; vertical-align: top; }
    .static-page .legal-table { overflow-x: auto; }
    .static-page img { max-width: 100%; }
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
        <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
      </nav>
    </footer>`

const homeBody = (locale) => {
  const copy = homeContent[locale]
  return `<h1>${escapeHtml(copy.seoTitle)} — ${BRAND}</h1>
    <p>${escapeHtml(copy.seoText)}</p>
    <img src="/screenshots/deep-data.png" width="1280" height="800" alt="${locale === 'ru' ? 'Аналитика сделок в приложении ' + BRAND : 'Trade analytics screen in ' + BRAND}" loading="lazy" />
    <section>
      <h2>${escapeHtml(copy.videoTitle)}</h2>
      <p>${escapeHtml(copy.videoIntro)}</p>
      ${homeVideos.map(video => `<figure>
        <video poster="${video.poster}" controls preload="none" width="1280" height="720" aria-label="${escapeHtml(video.name[locale] || video.name.en)}">
          <source src="${video.src}" type="video/quicktime">
        </video>
        <figcaption>${escapeHtml(video.description[locale] || video.description.en)}</figcaption>
      </figure>`).join('')}
    </section>
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
    <p>${BRAND} has no mobile app. If you're on a phone, email yourself this page or write to <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> to get the download link on your computer.</p>
    <p>For installation help and updates, visit the <a href="https://t.me/gandr_trade">Telegram community</a> or email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>`

const pricingBody = `<h1>Trading journal plans and pricing</h1>
    <table class="legal-table">
      <thead><tr><th>Plan</th><th>Price</th><th>Includes</th></tr></thead>
      <tbody>
        <tr>
          <td>Free</td>
          <td>$0 / month</td>
          <td>Core trading journal, screenshots and tags, forum access, activity monitor, equity and drawdown metrics.</td>
        </tr>
        <tr>
          <td>Full</td>
          <td>$9.99 / month, billed via Patreon</td>
          <td>Everything in Free, plus Forecast Manager, Strategy Builder, broker API connections, trading reports and deep trade analytics.</td>
        </tr>
      </tbody>
    </table>
    <p>Subscriptions are managed securely through Patreon. By subscribing you accept the <a href="/terms">Terms of Use</a> and the <a href="/privacy">Privacy Policy</a>.</p>
    <p><a href="/download">Download ${BRAND}</a> for Windows or macOS to get started.</p>`

const aboutBody = `<h1>About ${BRAND}</h1>
    <p>${BRAND} is a desktop trading journal and analytical workspace for reviewing decisions, tracking results and developing trading rules. It is built for traders who want to understand what drives their results rather than just log trades.</p>
    <p>${BRAND} is developed by Ivan Vorobei, an individual developer based in Podgorica, Montenegro. See the <a href="/terms">Terms of Use</a> for the full legal details.</p>
    <p>Trade data, journal entries and exchange API keys stay on your device — they are never uploaded or sold. Google Sign-In is used only to identify your account; see the <a href="/privacy">Privacy Policy</a> for details.</p>
    <p>${BRAND} is also known as ${BRAND_ALTERNATES.join(' and ')}, reflecting the project's name and visual identity.</p>
    <p>Questions or feedback: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a> or the <a href="https://t.me/gandr_trade">Telegram community</a>. Explore the <a href="/">trading journal</a> or <a href="/download">download the application</a>.</p>`


const pages = [
  { file: 'index.html', path: '/', body: homeBody('en'), locale: 'en' },
  { file: 'ru/index.html', path: '/ru/', body: homeBody('ru'), locale: 'ru' },
  { file: 'privacy.html', path: '/privacy', body: legalBody('Privacy Policy', 'privacy') },
  { file: 'ru/privacy.html', path: '/ru/privacy', body: legalBody('Политика конфиденциальности', 'privacy'), locale: 'ru' },
  { file: 'terms.html', path: '/terms', body: legalBody('Terms of Use', 'terms') },
  { file: 'ru/terms.html', path: '/ru/terms', body: legalBody('Условия использования', 'terms'), locale: 'ru' },
  { file: 'download.html', path: '/download', body: downloadBody },
  { file: 'ru/download.html', path: '/ru/download', body: downloadBody, locale: 'ru' },
  { file: 'pricing.html', path: '/pricing', body: pricingBody },
  { file: 'ru/pricing.html', path: '/ru/pricing', body: pricingBody, locale: 'ru' },
  { file: 'about.html', path: '/about', body: aboutBody },
  { file: 'ru/about.html', path: '/ru/about', body: aboutBody, locale: 'ru' },
  { file: 'philosophy.html', path: '/about', body: aboutBody },
  { file: 'ru/philosophy.html', path: '/ru/about', body: aboutBody, locale: 'ru' },
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
    html = html.replace(/\s*<link rel="alternate" hreflang="(?:en|ru|x-default)"[^>]*>/g, '')
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

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND,
    alternateName: BRAND_ALTERNATES,
    url: `${SITE}/`,
    logo: `${SITE}/herb-white.svg`,
    email: CONTACT_EMAIL,
    founder: { '@type': 'Person', name: 'Ivan Vorobei' },
    sameAs: ['https://t.me/gandr_trade'],
  }
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BRAND,
    url: `${SITE}/`,
    inLanguage: ['en', 'ru'],
  }
  const schemas = [organizationSchema, websiteSchema]

  if (path === '/' || path === '/ru/') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: BRAND,
      alternateName: BRAND_ALTERNATES,
      url: `${SITE}${path}`,
      description: homeContent[locale].seoText,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Windows, macOS',
      screenshot: SOCIAL_IMAGE,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', url: `${SITE}/pricing` },
    })
    // Not adding FAQPage schema: Google retired FAQ rich results for all sites
    // (May 2026), and this FAQ is marketing copy, not genuine user Q&A, so
    // QAPage would not fit either.
    schemas.push(...videoStructuredData(locale))
  }
  if (path) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        ...(path !== '/' && path !== '/ru/' ? [{ '@type': 'ListItem', position: 2, name: title, item: `${SITE}${path}` }] : []),
      ],
    })
  }
  html = html.replace('</head>', `  ${schemas.map(schema => `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`).join('\n  ')}\n</head>`)
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
const escapeXml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const videoSitemapEntry = (locale) => homeVideos.map(video => `    <video:video>
      <video:thumbnail_loc>${SITE}${video.poster}</video:thumbnail_loc>
      <video:title>${escapeXml(video.name[locale] || video.name.en)}</video:title>
      <video:description>${escapeXml(video.description[locale] || video.description.en)}</video:description>
      <video:content_loc>${SITE}${video.src}</video:content_loc>
      <video:publication_date>${HOME_VIDEOS_UPLOAD_DATE}T00:00:00+00:00</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>`).join('\n')

writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${indexedPaths.map(path => {
  const locale = path.startsWith('/ru') ? 'ru' : 'en'
  const isHome = path === '/' || path === '/ru/'
  return `  <url>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${BUILD_DATE}</lastmod>${isHome ? `\n${videoSitemapEntry(locale)}` : ''}\n  </url>`
}).join('\n')}\n</urlset>\n`)

writeFileSync('dist/llms.txt', `# ${BRAND}

> ${homeContent.en.seoText}

${BRAND} is a desktop trading journal for Windows and macOS. Also known as ${BRAND_ALTERNATES.join(', ')}.

## Pages

- [Home](${SITE}/): ${homeContent.en.seoTitle}
- [Pricing](${SITE}/pricing): Free and Full plan pricing and features
- [Download](${SITE}/download): Download for Windows and macOS
- [About](${SITE}/about): About ${BRAND}

## Contact

${CONTACT_EMAIL}
`)
