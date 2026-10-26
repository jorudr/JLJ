import { readFileSync, writeFileSync } from 'node:fs'
import { homeContent } from '../src/shared/i18n/homeContent.js'
import { renderMarkdown } from '../src/shared/legal/renderMarkdown.js'

// The site is a client-rendered SPA, but crawlers that do not run JavaScript
// (including Google's OAuth brand verification) must still see the app name,
// its description and the Privacy Policy link. Each page is published with a
// static copy of its content inside #app; Vue replaces it on mount.

const SITE = 'https://www.gandr.site'
const BRAND = 'J.L.JÖRMUNGANDR'
const APP_ROOT = '<div id="app" class="bg-black text-white"></div>'

const template = readFileSync('dist/index.html', 'utf8')
const en = homeContent.en

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

const header = `<header>
      <a href="/"><strong>${BRAND}</strong></a>
      <nav aria-label="Primary">
        <a href="/download">Download</a>
        <a href="/pricing">Pricing</a>
        <a href="/about">About</a>
      </nav>
    </header>`

const footer = `<footer>
      <p><strong>${BRAND}</strong> — ${escapeHtml(en.seoTitle)}.</p>
      <nav aria-label="Legal">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Use</a>
        <a href="mailto:gandr.trade@gmail.com">gandr.trade@gmail.com</a>
      </nav>
    </footer>`

const intro = `<p>${escapeHtml(en.seoText)}</p>`

const homeBody = `<h1>${BRAND} — ${escapeHtml(en.seoTitle)}</h1>
    ${intro}
    <section>
      <h2>${escapeHtml(en.scenariosTitle)}</h2>
      <ul>${en.scenarios.map(item => `<li><strong>${escapeHtml(item.title)}.</strong> ${escapeHtml(item.text)}</li>`).join('')}</ul>
    </section>
    <section>
      <h2>${escapeHtml(en.communityTitle)}</h2>
      <ul>${en.community.map(item => `<li><strong>${escapeHtml(item.title)}.</strong> ${escapeHtml(item.text)}</li>`).join('')}</ul>
    </section>
    <section id="google-sign-in">
      <h2>${escapeHtml(en.dataTitle)}</h2>
      <p>${escapeHtml(en.dataText)} See our <a href="/privacy">Privacy Policy</a>.</p>
      <p lang="ru">${escapeHtml(homeContent.ru.dataText)} Подробнее — в <a href="/privacy">Политике конфиденциальности</a>.</p>
    </section>
    <section>
      <h2>${escapeHtml(en.faqTitle)}</h2>
      <dl>${en.faq.map(item => `<dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd>`).join('')}</dl>
    </section>`

const legalBody = (title, doc) => `<h1>${title}</h1>
    <p>${BRAND} — <a href="/terms">Terms of Use</a> · <a href="/privacy">Privacy Policy</a></p>
    <article>${legalHtml(doc)}</article>`

const pageBody = (title) => `<h1>${BRAND} — ${title}</h1>
    ${intro}`

const homeTitle = `${BRAND} — Trading Journal for Traders`
const pages = [
  { file: 'index.html', path: '/', title: homeTitle, description: en.seoText, body: homeBody },
  { file: 'privacy.html', path: '/privacy', title: `Privacy Policy — ${BRAND}`, description: `How ${BRAND} collects, uses and protects your data, including data received through Google Sign-In.`, body: legalBody('Privacy Policy', 'privacy') },
  { file: 'terms.html', path: '/terms', title: `Terms of Use — ${BRAND}`, description: `Terms governing the use of the ${BRAND} application and related services.`, body: legalBody('Terms of Use', 'terms') },
  { file: 'download.html', path: '/download', title: `Download — ${BRAND}`, description: en.finalText, body: pageBody('Download') },
  { file: 'pricing.html', path: '/pricing', title: `Pricing — ${BRAND}`, description: en.plansIntro, body: pageBody('Pricing') },
  { file: 'about.html', path: '/about', title: `About — ${BRAND}`, description: en.seoText, body: pageBody('About') },
  { file: 'philosophy.html', path: '/about', title: `About — ${BRAND}`, description: en.seoText, body: pageBody('About') },
  { file: 'announcement.html', path: '/download', title: `Download — ${BRAND}`, description: en.finalText, body: pageBody('Download') },
  { file: '404.html', path: null, title: `Page not found — ${BRAND}`, description: en.seoText, body: pageBody('Page not found') },
]

const setMeta = (html, pattern, content) => {
  if (!pattern.test(html)) throw new Error(`static-pages: ${pattern} not found in dist/index.html`)
  return html.replace(pattern, (_, before, after) => `${before}${escapeHtml(content)}${after}`)
}

const render = ({ path, title, description, body }) => {
  let html = template
  html = setMeta(html, /(<title>)[^<]*(<\/title>)/, title)
  html = setMeta(html, /(<meta name="description" content=")[^"]*(")/, description)
  html = setMeta(html, /(<meta property="og:title" content=")[^"]*(")/, title)
  html = setMeta(html, /(<meta property="og:description" content=")[^"]*(")/, description)
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
  return html
    .replace('</head>', `  ${staticStyles}\n</head>`)
    .replace(APP_ROOT, `<div id="app" class="bg-black text-white">
  <div class="static-page">
    ${header}
    <main>
    ${body}
    </main>
    ${footer}
  </div>
</div>`)
}

// GitHub Pages serves /privacy from privacy.html directly, while a privacy/
// folder would answer with a 301 to /privacy/. Flat files keep every route
// on its canonical URL with a 200 status.
for (const page of pages) {
  writeFileSync(`dist/${page.file}`, render(page))
}
