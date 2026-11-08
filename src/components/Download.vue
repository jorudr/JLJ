<template>
  <div class="d">
    <!-- BAR -->
    <BarHeader />

    <!-- HERO -->
    <section class="dl-hero" aria-labelledby="dl-title">
      <div class="dl-hero__body">
        <h1 id="dl-title" class="dl-hero__title">{{ copy.downloadPage.hero.title }}</h1>
        <p class="dl-hero__sub">{{ copy.downloadPage.hero.sub }}</p>
      </div>
    </section>

    <!-- PLATFORMS GRID -->
    <section class="dl-grid" aria-label="Download platforms">
      <article v-for="platform in downloads" :key="platform.id" class="dl-card">
        <div class="dl-card__top">
          <span class="mono">{{ platform.id === 'macos' ? copy.downloadPage.macCard.arch : copy.downloadPage.winCard.arch }}</span>
          <span class="mono">{{ copy.downloadPage.macCard.tag }}</span>
        </div>
        <div class="dl-card__main">
          <div class="dl-card__head">
            <h2 class="dl-card__name">{{ platform.name }}</h2>
            <p class="dl-card__req">
              <template v-if="platform.id === 'macos'">{{ copy.downloadPage.macCard.req }}</template>
              <template v-else>{{ copy.downloadPage.winCard.req }}</template>
            </p>
          </div>
          <a :href="platform.url" download class="btn dl-card__btn">
            <span>{{ copy.downloadPage.downloadFor }} {{ platform.name }}</span>
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </article>
    </section>

    <!-- CAROUSEL -->
    <ScreenshotCarousel :is-ru="isRu" />

    <!-- FACTS -->
    <section class="facts" aria-label="Key facts">
      <div v-for="fact in copy.dev1.facts" :key="fact[0]"><strong>{{ fact[0] }}</strong><span>{{ fact[1] }}</span></div>
    </section>

    <!-- HELP & COMMUNITY -->
    <section class="dl-note" aria-labelledby="dl-note-title">
      <div class="label mono"><span>{{ copy.downloadPage.community.label[0] }}</span><span>{{ copy.downloadPage.community.label[1] }}</span></div>
      <div class="dl-note__body">
        <div class="dl-note__col">
          <h2 id="dl-note-title" class="dl-note__heading">{{ copy.downloadPage.community.heading }}</h2>
          <p>{{ copy.downloadPage.community.text }}</p>
          <div class="dl-note__links">
            <a href="https://t.me/gandr_trade" target="_blank" rel="noreferrer" class="btn btn--line">{{ copy.downloadPage.community.tgBtn }}</a>
            <router-link :to="isRu ? '/ru/pricing' : '/pricing'" class="btn btn--line">{{ copy.nav.pricing }} ↗</router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- BACK COVER / FOOTER -->
  </div>
  <footer class="end-wrap">
    <div class="d end">
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
    </div>
  </footer>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../shared/i18n/useI18n'
import { landingCopy } from '../shared/i18n/landingCopy.js'
import { downloads, refreshDownloads } from '../shared/downloads'
import LangDropdown from './LangDropdown.vue'
import BarHeader from './BarHeader.vue'
import ScreenshotCarousel from './ScreenshotCarousel.vue'

const route = useRoute()
const { locale } = useI18n()
const isRu = computed(() => locale.value === 'ru' || route.path.startsWith('/ru'))
const copy = computed(() => landingCopy[isRu.value ? 'ru' : 'en'])

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;800&family=JetBrains+Mono:wght@400;500&display=swap'
const year = new Date().getFullYear()

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
  --edge: clamp(14px, 1.6cqw, 24px);
  --gut: clamp(14px, 1.5cqw, 22px);
  --sans: 'Inter Tight', 'Helvetica Neue', Arial, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  background: #fff;
  color: #000;
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.15;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  max-width: 1440px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  container-type: inline-size;
  overflow-x: clip;
}
.d *, .d *::before, .d *::after { box-sizing: border-box; }
.d a { color: inherit; text-decoration: none; }
.d :focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
.mono { font-family: var(--mono); font-size: 12px; font-weight: 400; letter-spacing: 0.04em; text-transform: uppercase; line-height: 1.2; margin: 0; }

/* buttons */
.d a.btn { display: inline-flex; justify-content: space-between; gap: 12px; align-items: center; padding: 16px 18px 15px; background: #000; color: #fff; border: 2px solid #000; font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em; font-size: 16px; transition: background 0.1s, color 0.1s; }
.d a.btn:hover { background: #fff; color: #000; }
.d a.btn--line { background: transparent; color: #000; }
.d a.btn--line:hover { background: #000; color: #fff; }
.d a.btn--paper { background: #fff; color: #000; border-color: #fff; }
.d a.btn--paper:hover { background: #000; color: #fff; }

/* ── Bar ───────────────────────────────────────────── */

/* ── Labels ────────────────────────────────────────── */
.label { display: flex; justify-content: space-between; padding: 12px var(--edge) 11px; border-bottom: 2px solid #000; }

/* ── Hero ──────────────────────────────────────────── */
.dl-hero { border-bottom: 2px solid #000; }
.dl-hero__body { padding: clamp(36px, 6cqw, 84px) var(--edge) clamp(28px, 4cqw, 56px); }
.dl-hero__title { margin: 0; font-weight: 800; letter-spacing: -0.04em; line-height: 0.94; font-size: clamp(38px, 6.4cqw, 108px); max-width: 22ch; }
.dl-hero__sub { margin: clamp(16px, 2.2cqw, 28px) 0 0; font-size: clamp(16px, 1.35cqw, 22px); line-height: 1.25; letter-spacing: -0.015em; max-width: 54ch; opacity: 0.85; }

/* ── Platforms Grid ────────────────────────────────── */
.dl-grid { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 2px solid #000; }
.dl-card { display: flex; flex-direction: column; justify-content: space-between; border-right: 2px solid #000; min-height: 380px; }
.dl-card:last-child { border-right: 0; }
.dl-card__top { display: flex; justify-content: space-between; padding: 12px var(--edge); border-bottom: 2px solid #000; opacity: 0.75; }
.dl-card__main { padding: var(--edge); display: flex; flex-direction: column; justify-content: space-between; flex: 1; gap: 32px; }
.dl-card__name { margin: 0; font-weight: 800; font-size: clamp(48px, 7cqw, 110px); letter-spacing: -0.05em; line-height: 0.9; }
.dl-card__req { margin: 12px 0 0; font-size: clamp(14px, 1.15cqw, 18px); line-height: 1.25; opacity: 0.75; max-width: 36ch; }
.dl-card__btn { width: 100%; margin-top: auto; }

/* ── Facts ─────────────────────────────────────────── */
.facts { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 2px solid #000; }
.facts > div { padding: var(--edge); border-right: 2px solid #000; display: flex; flex-direction: column; gap: 14px; min-height: 200px; justify-content: space-between; }
.facts > div:last-child { border-right: 0; }
.facts strong { font-weight: 800; letter-spacing: -0.06em; line-height: 0.85; font-size: clamp(56px, 7.4cqw, 128px); }
.facts span { font-size: clamp(13px, 1.05cqw, 16px); line-height: 1.2; max-width: 28ch; }

/* ── Help & Community ──────────────────────────────── */
.dl-note { border-bottom: 2px solid #000; }
.dl-note__body { display: grid; grid-template-columns: 1fr; }
.dl-note__col { padding: clamp(28px, 4cqw, 56px) var(--edge); display: flex; flex-direction: column; gap: 14px; }
.dl-note__heading { margin: 0; font-weight: 800; font-size: clamp(24px, 2.6cqw, 42px); letter-spacing: -0.03em; line-height: 1.05; }
.dl-note__col p { margin: 0; font-size: clamp(14px, 1.15cqw, 17px); line-height: 1.35; opacity: 0.85; max-width: 58ch; }
.dl-note__links { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; }

/* ── Back cover ────────────────────────────────────── */
.d.end,
.end { background: #000; color: #fff; padding: clamp(32px, 4cqw, 56px) var(--edge) clamp(20px, 2.5cqw, 36px); display: flex; flex-direction: column; gap: clamp(24px, 4cqw, 56px); min-height: 85vh; box-sizing: border-box; }
.end__title { margin: clamp(32px, 6cqw, 100px) 0 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.82; font-size: clamp(54px, 13cqw, 240px); margin-left: -0.02em; }
.end__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.end__foot { margin-top: auto; display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; padding-top: 28px; border-top: 2px solid #fff; font-family: var(--sans); font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }
.end__foot a { text-decoration: none; transition: opacity 0.1s; }
.end__foot a:hover { text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 2px; }
.end__foot-copy { font-weight: 700; letter-spacing: -0.01em; padding-top: 2px; }
.end__foot-aside { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: flex-end; }
.end__foot-links { display: inline-flex; align-items: center; gap: 12px; }
.end__foot-sep { opacity: 0.35; }
.end__foot-lang { display: flex; justify-content: flex-end; }

@media (max-width: 900px) {
  .dl-grid { grid-template-columns: 1fr; }
  .dl-card { border-right: 0; border-bottom: 2px solid #000; }
  .dl-card:last-child { border-bottom: 0; }
  .facts { grid-template-columns: 1fr 1fr; }
  .facts > div { min-height: 150px; border-bottom: 2px solid #000; }
  .facts > div:nth-child(2) { border-right: 0; }
  .facts > div:last-child { grid-column: 1 / -1; border-right: 0; border-bottom: 0; }
  .d.end,
  .end {
    min-height: auto;
    padding-top: clamp(24px, 5cqw, 36px);
    padding-bottom: clamp(16px, 3cqw, 24px);
    gap: clamp(18px, 4cqw, 28px);
  }
  .end__title {
    margin-top: clamp(8px, 2cqw, 16px);
    font-size: clamp(38px, 11cqw, 64px);
    line-height: 0.88;
  }
  .end__foot {
    margin-top: 24px;
    padding-top: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .end__foot-aside {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .end__foot-lang {
    margin-left: auto;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
