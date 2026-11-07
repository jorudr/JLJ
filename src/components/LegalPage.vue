<template>
  <div class="d">
    <!-- BAR -->
    <header class="bar">
      <router-link :to="isRu ? '/ru/' : '/'" class="bar__brand" aria-label="JÖRMUNGANDR home">
        <img src="/assets/herb.svg" alt="" width="18" height="16" />
        <span>JÖRMUNGANDR</span>
      </router-link>
      <nav class="bar__nav" aria-label="Main">
        <router-link :to="isRu ? '/ru/#karl-nikolai' : '/#karl-nikolai'">{{ copy.nav.whatItDoes }}</router-link>
        <router-link :to="isRu ? '/ru/about' : '/about'">{{ copy.nav.about }}</router-link>
        <router-link :to="isRu ? '/ru/pricing' : '/pricing'">{{ copy.nav.pricing }}</router-link>
        <router-link :to="isRu ? '/ru/download' : '/download'">{{ copy.nav.download }}</router-link>
      </nav>
    </header>

    <!-- HEADER -->
    <section class="legal-hero" aria-labelledby="legal-title">
      <div class="legal-hero__body">
        <h1 id="legal-title" class="legal-hero__title">
          {{ doc === 'privacy' ? copy.footer.privacy : copy.footer.terms }}
        </h1>
        <div class="legal-tabs" role="tablist" aria-label="Legal documents">
          <router-link :to="isRu ? '/ru/privacy' : '/privacy'" class="btn" :class="{ 'btn--line': doc !== 'privacy' }">{{ copy.footer.privacy }}</router-link>
          <router-link :to="isRu ? '/ru/terms' : '/terms'" class="btn" :class="{ 'btn--line': doc !== 'terms' }">{{ copy.footer.terms }}</router-link>
        </div>
      </div>
    </section>

    <!-- ARTICLE BODY -->
    <main class="legal-wrap">
      <article class="legal-article" :lang="isRu ? 'ru' : 'en'" v-html="html"></article>
    </main>

    <!-- BACK COVER / FOOTER -->
    <footer class="end">
      <h2 class="end__title" v-html="copy.footer.title"></h2>
      <div class="end__actions">
        <a v-for="item in downloads" :key="item.id" :href="item.url" class="btn btn--paper">{{ copy.footer.downloadFor }} {{ item.name }} <span aria-hidden="true">↓</span></a>
      </div>
      <div class="end__foot">
        <span class="end__foot-copy">Jörmungandr © {{ year }}</span>
        <div class="end__foot-aside">
          <div class="end__foot-links">
            <router-link :to="isRu ? '/ru/terms' : '/terms'">{{ copy.footer.terms }}</router-link>
            <span class="end__foot-sep" aria-hidden="true">·</span>
            <router-link :to="isRu ? '/ru/privacy' : '/privacy'">{{ copy.footer.privacy }}</router-link>
            <span class="end__foot-sep" aria-hidden="true">·</span>
            <a href="https://t.me/gandr_trade" target="_blank" rel="noopener">Telegram</a>
          </div>
          <div class="end__foot-lang">
            <LangDropdown />
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../shared/i18n/useI18n'
import { landingCopy } from '../shared/i18n/landingCopy.js'
import { renderMarkdown } from '../shared/legal/renderMarkdown'
import { downloads, refreshDownloads } from '../shared/downloads'
import LangDropdown from './LangDropdown.vue'

const props = defineProps({
  doc: {
    type: String,
    required: true,
    validator: value => ['privacy', 'terms'].includes(value),
  },
})

const route = useRoute()
const { locale } = useI18n()
const isRu = computed(() => locale.value === 'ru' || route.path.startsWith('/ru'))
const copy = computed(() => landingCopy[isRu.value ? 'ru' : 'en'])

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;800&family=JetBrains+Mono:wght@400;500&display=swap'
const year = new Date().getFullYear()

const sources = import.meta.glob('../shared/legal/*.md', { query: '?raw', import: 'default', eager: true })

const html = computed(() => {
  const lang = isRu.value ? 'ru' : 'en'
  const source = sources[`../shared/legal/${props.doc}.${lang}.md`]
    || sources[`../shared/legal/${props.doc}.en.md`]
  return renderMarkdown(source || '')
})

let fontLink = null

onMounted(() => {
  if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
    fontLink = document.createElement('link')
    fontLink.rel = 'stylesheet'
    fontLink.href = FONT_HREF
    document.head.appendChild(fontLink)
  }
  refreshDownloads()
})

onBeforeUnmount(() => {
  fontLink?.remove()
})
</script>

<style scoped>
.d {
  --edge: clamp(14px, 1.6vw, 24px);
  --gut: clamp(14px, 1.5vw, 22px);
  --sans: 'Inter Tight', 'Helvetica Neue', Arial, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  background: #fff;
  color: #000;
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.15;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  overflow-x: clip;
}
.d *, .d *::before, .d *::after { box-sizing: border-box; }
.d a { color: inherit; text-decoration: none; }
.d :focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
.mono { font-family: var(--mono); font-size: 12px; font-weight: 400; letter-spacing: 0.04em; text-transform: uppercase; line-height: 1.2; margin: 0; }

/* buttons */
.d a.btn { display: inline-flex; justify-content: space-between; gap: 12px; align-items: center; padding: 14px 18px 13px; background: #000; color: #fff; border: 2px solid #000; font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em; font-size: 14px; transition: background 0.1s, color 0.1s; }
.d a.btn:hover { background: #fff; color: #000; }
.d a.btn--line { background: transparent; color: #000; }
.d a.btn--line:hover { background: #000; color: #fff; }
.d a.btn--paper { background: #fff; color: #000; border-color: #fff; }
.d a.btn--paper:hover { background: #000; color: #fff; }

/* ── Bar ───────────────────────────────────────────── */
.bar { position: sticky; top: 0; z-index: 20; display: flex; justify-content: space-between; align-items: center; gap: 16px; height: 46px; padding: 0 var(--edge); background: #fff; border-bottom: 2px solid #000; }
.bar__brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 14px; letter-spacing: -0.01em; white-space: nowrap; }
.bar__brand img { filter: brightness(0); display: block; }
.bar__nav { display: flex; gap: clamp(14px, 2.4vw, 36px); font-weight: 600; }
.bar__nav a:hover { text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 2px; }

/* ── Labels ────────────────────────────────────────── */
.label { display: flex; justify-content: space-between; padding: 12px var(--edge) 11px; border-bottom: 2px solid #000; }

/* ── Hero ──────────────────────────────────────────── */
.legal-hero { border-bottom: 2px solid #000; }
.legal-hero__body { padding: clamp(36px, 6vw, 72px) var(--edge) clamp(28px, 4vw, 44px); display: flex; flex-direction: column; gap: 24px; }
.legal-hero__title { margin: 0; font-weight: 800; letter-spacing: -0.04em; line-height: 0.92; font-size: clamp(40px, 7vw, 110px); }
.legal-tabs { display: flex; flex-wrap: wrap; gap: 10px; }

/* ── Article Body ──────────────────────────────────── */
.legal-wrap { padding: clamp(36px, 6vw, 72px) var(--edge) clamp(64px, 9vw, 110px); border-bottom: 2px solid #000; }
.legal-article { max-width: 78ch; margin: 0 auto; font-size: clamp(15px, 1.2vw, 18px); line-height: 1.6; }

.legal-article :deep(h2) {
  margin: 56px 0 18px;
  padding-top: 24px;
  border-top: 2px solid #000;
  font-weight: 800;
  letter-spacing: -0.035em;
  font-size: clamp(24px, 2.5vw, 38px);
  line-height: 1.1;
  scroll-margin-top: 60px;
}
.legal-article :deep(h2:first-child) {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}
.legal-article :deep(h3) {
  margin: 28px 0 10px;
  font-weight: 800;
  letter-spacing: -0.02em;
  font-size: clamp(18px, 1.6vw, 24px);
  line-height: 1.2;
}
.legal-article :deep(p),
.legal-article :deep(ul),
.legal-article :deep(ol),
.legal-article :deep(.legal-table) {
  margin: 16px 0;
}
.legal-article :deep(ul),
.legal-article :deep(ol) {
  padding-left: 24px;
}
.legal-article :deep(li) {
  margin-bottom: 8px;
}
.legal-article :deep(strong) {
  font-weight: 700;
}
.legal-article :deep(a) {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.legal-article :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
  margin: 24px 0;
}
.legal-article :deep(th),
.legal-article :deep(td) {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  text-align: left;
  vertical-align: top;
}
.legal-article :deep(th) {
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-top: 2px solid #000;
  border-bottom: 2px solid #000;
  background: #f7f7f7;
}
.legal-article :deep(tr:last-child td) {
  border-bottom: 2px solid #000;
}

/* ── Back cover ────────────────────────────────────── */
.end { background: #000; color: #fff; padding: clamp(32px, 4vw, 56px) var(--edge) clamp(20px, 2.5vw, 36px); display: flex; flex-direction: column; gap: clamp(24px, 4vw, 56px); min-height: 85vh; box-sizing: border-box; }
.end__title { margin: clamp(32px, 6vw, 100px) 0 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.82; font-size: clamp(54px, 13vw, 240px); margin-left: -0.02em; }
.end__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.end__foot { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; padding-top: 28px; border-top: 2px solid #fff; font-family: var(--sans); font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
.end__foot a { text-decoration: none; transition: opacity 0.1s; }
.end__foot a:hover { text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 2px; }
.end__foot-copy { font-weight: 700; letter-spacing: -0.01em; padding-top: 2px; }
.end__foot-aside { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
.end__foot-links { display: inline-flex; align-items: center; gap: 12px; }
.end__foot-sep { opacity: 0.35; }
.end__foot-lang { display: flex; justify-content: flex-end; }
@media (max-width: 600px) {
  .end__foot-aside { align-items: flex-start; }
  .end__foot-lang { justify-content: flex-start; }
}

@media (max-width: 900px) {
  .bar__nav a:not(:last-child) { display: none; }
}
</style>
