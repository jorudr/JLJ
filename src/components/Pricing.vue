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

    <!-- HERO -->
    <section class="pricing-hero" aria-labelledby="pricing-title">
      <div class="pricing-hero__body">
        <h1 id="pricing-title" class="pricing-hero__title">
          {{ copy.pricingPage.hero.title }}
        </h1>
        <p class="pricing-hero__sub">
          {{ copy.pricingPage.hero.sub }}
        </p>
      </div>
    </section>

    <!-- PLANS -->
    <section class="pricing-plans" aria-label="Pricing plans">
      <div class="plans">
        <article class="plan">
          <header>
            <span class="mono">{{ copy.dev1.pricing.freeTitle }}</span>
            <strong>{{ copy.dev1.pricing.freePrice }}</strong>
          </header>
          <p>{{ copy.dev1.pricing.freeDesc }}</p>
          <ul>
            <li v-for="item in copy.dev1.pricing.freeFeatures" :key="item">{{ item }}</li>
          </ul>
          <router-link :to="isRu ? '/ru/download' : '/download'" class="btn btn--line">
            {{ copy.dev1.pricing.freeCta }} <span aria-hidden="true">↓</span>
          </router-link>
        </article>

        <article class="plan plan--full">
          <header>
            <span class="mono">{{ copy.dev1.pricing.fullTitle }}</span>
            <strong>{{ copy.dev1.pricing.fullPrice }}<small>{{ copy.dev1.pricing.fullPeriod }}</small></strong>
          </header>
          <p>{{ copy.dev1.pricing.fullDesc }}</p>
          <ul>
            <li v-for="item in copy.dev1.pricing.fullFeatures" :key="item">{{ item }}</li>
          </ul>
          <router-link :to="isRu ? '/ru/download' : '/download'" class="plan__existing">
            {{ copy.pricingPage.alreadySubscribed }}
          </router-link>
          <a
            href="https://www.patreon.com/checkout/jlgandr?rid=28845652"
            target="_blank"
            rel="noreferrer"
            class="btn"
          >
            <span>{{ copy.pricingPage.subscribeViaPatreon }}</span>
            <span aria-hidden="true">↗</span>
          </a>
        </article>
      </div>
    </section>

    <!-- CRYPTO PAYMENT -->
    <section class="crypto-sec" aria-labelledby="crypto-title">
      <div class="label mono">
        <span>{{ copy.pricingPage.crypto.label[0] }}</span>
        <span>{{ copy.pricingPage.crypto.label[1] }}</span>
      </div>
      <div class="crypto-sec__body">
        <h2 id="crypto-title" class="crypto-sec__title">
          {{ copy.pricingPage.crypto.title }}
        </h2>
        <p class="crypto-sec__desc" v-html="copy.pricingPage.crypto.desc"></p>
      </div>
    </section>

    <!-- COMPARISON -->
    <section class="compare" aria-labelledby="compare-title">
      <div class="label mono">
        <span>{{ copy.dev1.comparison.label[0] }}</span>
        <span>{{ copy.dev1.comparison.label[1] }}</span>
      </div>
      <h2 id="compare-title" class="compare__title">{{ copy.dev1.comparison.title }}</h2>
      <table class="compare__table">
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">{{ copy.dev1.comparison.spreadsheet }}</th>
            <th scope="col">JORU</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in comparison" :key="row[0]">
            <th scope="row">{{ row[0] }}</th>
            <td :class="{ 'is-no': !row[1] }">{{ row[1] ? copy.dev1.comparison.yes : copy.dev1.comparison.no }}</td>
            <td>{{ copy.dev1.comparison.yes }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- FAQ -->
    <section class="faq" aria-labelledby="faq-title">
      <div class="label mono">
        <span>{{ copy.pricingPage.faq.label[0] }}</span>
        <span>{{ copy.pricingPage.faq.label[1] }}</span>
      </div>
      <div class="faq__grid">
        <article v-for="item in copy.pricingPage.faq.items" :key="item.q" class="faq__item">
          <h2 class="faq__q">{{ item.q }}</h2>
          <p class="faq__a">{{ item.a }}</p>
        </article>
      </div>
    </section>

    <!-- DATA PRIVACY -->
    <section class="privacy" aria-labelledby="privacy-title">
      <div class="label mono">
        <span>{{ copy.dev1.privacy.label[0] }}</span>
        <span>{{ copy.dev1.privacy.label[1] }}</span>
      </div>
      <div class="privacy__body">
        <h2 id="privacy-title" class="privacy__title">{{ copy.dev1.privacy.title }}</h2>
        <p>{{ copy.dev1.privacy.text }} <router-link :to="isRu ? '/ru/privacy' : '/privacy'">{{ copy.dev1.privacy.link }}</router-link></p>
      </div>
    </section>

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
import { downloads, refreshDownloads } from '../shared/downloads.js'
import LangDropdown from './LangDropdown.vue'

const route = useRoute()
const { locale } = useI18n()
const isRu = computed(() => locale.value === 'ru' || route.path.startsWith('/ru'))
const copy = computed(() => landingCopy[isRu.value ? 'ru' : 'en'])

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;800&family=JetBrains+Mono:wght@400;500&display=swap'
const year = new Date().getFullYear()

const comparison = computed(() => copy.value.dev1.comparison.rows)

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
.d a.btn { display: inline-flex; justify-content: space-between; gap: 12px; align-items: center; padding: 16px 18px 15px; background: #000; color: #fff; border: 2px solid #000; font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em; font-size: 16px; transition: background 0.1s, color 0.1s; }
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
.pricing-hero { border-bottom: 2px solid #000; }
.pricing-hero__body { padding: clamp(36px, 6vw, 84px) var(--edge) clamp(28px, 4vw, 56px); }
.pricing-hero__title { margin: 0; font-weight: 800; letter-spacing: -0.04em; line-height: 0.94; font-size: clamp(38px, 6.4vw, 108px); max-width: 22ch; }
.pricing-hero__sub { margin: clamp(16px, 2.2vw, 28px) 0 0; font-size: clamp(16px, 1.35vw, 22px); line-height: 1.25; letter-spacing: -0.015em; max-width: 54ch; opacity: 0.85; }

/* ── Plans Grid ────────────────────────────────────── */
.pricing-plans { border-bottom: 2px solid #000; }
.plans { display: grid; grid-template-columns: 1fr 1fr; }
.plan { display: flex; flex-direction: column; gap: 14px; padding: var(--edge); min-height: 520px; }
.plan + .plan { border-left: 2px solid #000; }
.plan header { display: flex; justify-content: space-between; align-items: baseline; }
.plan strong { font-weight: 800; letter-spacing: -0.06em; line-height: 0.84; font-size: clamp(64px, 10vw, 170px); }
.plan small { font-size: 16px; font-weight: 500; letter-spacing: -0.01em; margin-left: 10px; }
.plan > p { margin: 0; font-size: clamp(16px, 1.4vw, 22px); font-weight: 500; letter-spacing: -0.02em; }
.plan ul { list-style: none; margin: 4px 0 18px; padding: 0; font-size: clamp(14px, 1.1vw, 17px); }
.plan li { padding: 8px 0; border-top: 1px solid currentColor; }
.plan .btn { margin-top: auto; }
.plan--full .btn { margin-top: 0; }
.plan__existing { margin-top: auto; margin-bottom: 2px; font-size: 13px; text-decoration: underline; text-underline-offset: 3px; opacity: 0.8; }
.plan__existing:hover { opacity: 1; }
.plan--full { background: #000; color: #fff; }
.d .plan--full a.btn { background: #fff; color: #000; border-color: #fff; }
.d .plan--full a.btn:hover { background: #000; color: #fff; }

/* ── Crypto Section ────────────────────────────────── */
.crypto-sec { border-bottom: 2px solid #000; }
.crypto-sec__body { display: grid; grid-template-columns: 1fr minmax(320px, 52ch); gap: var(--gut); align-items: end; padding: clamp(28px, 5vw, 80px) var(--edge); }
.crypto-sec__title { margin: 0; font-weight: 800; letter-spacing: -0.04em; line-height: 0.94; font-size: clamp(32px, 5.2vw, 84px); max-width: 18ch; }
.crypto-sec__desc { margin: 0; font-size: clamp(15px, 1.2vw, 19px); line-height: 1.35; letter-spacing: -0.015em; }

/* ── Comparison ────────────────────────────────────── */
.compare { border-bottom: 2px solid #000; }
.compare__title { margin: 0; padding: clamp(28px, 4.5vw, 64px) var(--edge) clamp(24px, 3.5vw, 44px); font-weight: 800; letter-spacing: -0.035em; line-height: 1; font-size: clamp(28px, 4.2vw, 64px); max-width: 28ch; }
.compare__table { width: calc(100% - 2 * var(--edge)); margin: 0 var(--edge) clamp(36px, 5vw, 64px); border-collapse: collapse; font-size: clamp(14px, 1.2vw, 18px); }
.compare__table th, .compare__table td { border-top: 1px solid rgba(0, 0, 0, 0.15); padding: clamp(12px, 1.3vw, 16px) 0; text-align: left; font-weight: 500; }
.compare__table tbody tr:last-child > * { border-bottom: 1px solid rgba(0, 0, 0, 0.15); }
.compare__table thead th { font-family: var(--mono); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 14px 0; }
.compare__table td { width: 18%; font-family: var(--mono); font-size: 0.9em; }
.compare__table td.is-no { color: #be123c; font-weight: 600; }

/* ── FAQ ───────────────────────────────────────────── */
.faq { border-bottom: 2px solid #000; }
.faq__grid { display: grid; grid-template-columns: 1fr 1fr; }
.faq__item { padding: var(--edge); border-bottom: 2px solid #000; border-right: 2px solid #000; display: flex; flex-direction: column; gap: 12px; }
.faq__item:nth-child(2n) { border-right: 0; }
.faq__item:nth-last-child(-n+2) { border-bottom: 0; }
.faq__q { margin: 0; font-weight: 800; font-size: clamp(18px, 1.8vw, 26px); letter-spacing: -0.025em; line-height: 1.15; }
.faq__a { margin: 0; font-size: clamp(14px, 1.15vw, 17px); line-height: 1.35; opacity: 0.85; max-width: 48ch; }

/* ── Privacy ───────────────────────────────────────── */
.privacy { border-bottom: 2px solid #000; }
.privacy__body { display: grid; grid-template-columns: 1fr minmax(320px, 52ch); gap: var(--gut); align-items: end; padding: clamp(28px, 5vw, 80px) var(--edge); }
.privacy__title { margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.9; font-size: clamp(34px, 6vw, 108px); max-width: 16ch; }
.privacy__body p { margin: 0; font-size: clamp(15px, 1.2vw, 19px); line-height: 1.2; letter-spacing: -0.015em; }
.privacy__body p a { text-decoration: underline; text-underline-offset: 3px; }

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
  .plans { grid-template-columns: 1fr; }
  .plan + .plan { border-left: 0; border-top: 2px solid #000; }
  .crypto-sec__body { grid-template-columns: 1fr; }
  .faq__grid { grid-template-columns: 1fr; }
  .faq__item { border-right: 0; }
  .faq__item:nth-last-child(2) { border-bottom: 2px solid #000; }
  .privacy__body { grid-template-columns: 1fr; }
}
</style>
