<template>
  <div class="d">
    <!-- BAR -->
    <header class="bar">
      <router-link to="/" class="bar__brand" aria-label="JÖRMUNGANDR home">
        <img src="/assets/herb.svg" alt="" width="18" height="16" />
        <span>JÖRMUNGANDR</span>
      </router-link>
      <nav class="bar__nav" aria-label="Main">
        <router-link to="/#karl-nikolai">What it does</router-link>
        <router-link to="/pricing">Pricing</router-link>
        <router-link to="/download">Download</router-link>
      </nav>
    </header>

    <!-- HERO -->
    <section class="pricing-hero" aria-labelledby="pricing-title">
      <div class="pricing-hero__body">
        <h1 id="pricing-title" class="pricing-hero__title">
          Two plans. No surprises.
        </h1>
        <p class="pricing-hero__sub">
          Start free to log trades and build the review habit. Upgrade when you need deep pattern detection, condition analytics and exchange charts.
        </p>
      </div>
    </section>

    <!-- PLANS -->
    <section class="pricing-plans" aria-label="Pricing plans">
      <div class="plans">
        <article class="plan">
          <header>
            <span class="mono">Free</span>
            <strong>$0</strong>
          </header>
          <p>Build the review habit.</p>
          <ul>
            <li v-for="item in plans.free" :key="item">{{ item }}</li>
          </ul>
          <router-link to="/download" class="btn btn--line">Download free <span aria-hidden="true">↓</span></router-link>
        </article>

        <article class="plan plan--full">
          <header>
            <span class="mono">Full</span>
            <strong>$9.99<small>/ month</small></strong>
          </header>
          <p>Find, fix and prove. Less than the cost of one bad trade.</p>
          <ul>
            <li v-for="item in plans.full" :key="item">{{ item }}</li>
          </ul>
          <router-link to="/download" class="plan__existing">
            Already subscribed? Download desktop app →
          </router-link>
          <a
            href="https://www.patreon.com/checkout/jlgandr?rid=28845652"
            target="_blank"
            rel="noreferrer"
            class="btn"
          >
            <span>Subscribe via Patreon</span>
            <span aria-hidden="true">↗</span>
          </a>
        </article>
      </div>
    </section>

    <!-- CRYPTO PAYMENT -->
    <section class="crypto-sec" aria-labelledby="crypto-title">
      <div class="label mono">
        <span>Payment method</span>
        <span>Cryptocurrency · NOWPayments</span>
      </div>
      <div class="crypto-sec__body">
        <div class="crypto-sec__lead">
          <h2 id="crypto-title" class="crypto-sec__title">
            Pay with crypto inside the application.
          </h2>
          <p class="crypto-sec__desc">
            If you prefer cryptocurrency over card subscriptions, you can pay directly inside the JORU desktop app via <strong>NOWPayments</strong>. Each payment grants <strong>30 days of Full access</strong> as a one-time purchase with no auto-renewal or recurring charges.
          </p>
          <div class="crypto-sec__actions">
            <router-link to="/download" class="btn">
              <span>Download app to pay with crypto</span>
              <span aria-hidden="true">↓</span>
            </router-link>
          </div>
        </div>
        <div class="crypto-sec__steps">
          <div class="crypto-step">
            <span class="mono">Step 01</span>
            <h3>Open License in JORU</h3>
            <p>Launch the desktop application and go to your profile or License settings.</p>
          </div>
          <div class="crypto-step">
            <span class="mono">Step 02</span>
            <h3>Create NOWPayments invoice</h3>
            <p>Select crypto payment. An invoice is generated in USD and converted to your coin.</p>
          </div>
          <div class="crypto-step">
            <span class="mono">Step 03</span>
            <h3>Send payment</h3>
            <p>Pay with Bitcoin, Ethereum, USDT, Solana, Litecoin or 100+ supported coins.</p>
          </div>
          <div class="crypto-step">
            <span class="mono">Step 04</span>
            <h3>Instant activation</h3>
            <p>Your license unlocks automatically once confirmed on the network (usually a few minutes).</p>
          </div>
        </div>
      </div>
    </section>

    <!-- COMPARISON -->
    <section class="compare" aria-labelledby="compare-title">
      <div class="label mono"><span>Comparison</span><span>Spreadsheet vs JORU</span></div>
      <h2 id="compare-title" class="compare__title">A spreadsheet can log trades. It cannot tell you which ones to stop taking.</h2>
      <table class="compare__table">
        <thead>
          <tr>
            <th scope="col"></th>
            <th scope="col">Spreadsheet</th>
            <th scope="col">JORU</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in comparison" :key="row[0]">
            <th scope="row">{{ row[0] }}</th>
            <td :class="{ 'is-no': !row[1] }">{{ row[1] ? 'Yes' : 'No' }}</td>
            <td>Yes</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- FAQ -->
    <section class="faq" aria-labelledby="faq-title">
      <div class="label mono"><span>Frequently Asked Questions</span><span>Billing & Data</span></div>
      <div class="faq__grid">
        <article class="faq__item">
          <h2 class="faq__q">How does the subscription work?</h2>
          <p class="faq__a">Subscriptions are billed monthly through Patreon. You can cancel anytime directly on Patreon without contacting support.</p>
        </article>
        <article class="faq__item">
          <h2 class="faq__q">Can I pay with cryptocurrency?</h2>
          <p class="faq__a">Yes. Crypto payments via NOWPayments are available directly inside the desktop application. You can pay in BTC, ETH, USDT, USDC, Solana and other coins for 30 days of Full access without auto-renewal.</p>
        </article>
        <article class="faq__item">
          <h2 class="faq__q">Where is my trading data stored?</h2>
          <p class="faq__a">100% locally on your computer. Your journal data, notes, screenshots and broker API keys never leave your device.</p>
        </article>
        <article class="faq__item">
          <h2 class="faq__q">Can I use the Free plan forever?</h2>
          <p class="faq__a">Yes. The Free plan has no expiration date or trial limits. You can log trades, track your equity curve, and use core metrics indefinitely.</p>
        </article>
        <article class="faq__item">
          <h2 class="faq__q">How do I activate Full on my computer?</h2>
          <p class="faq__a">After paying on Patreon or via crypto, sign in with your Google account inside the desktop app. Your Full license activates immediately.</p>
        </article>
        <article class="faq__item">
          <h2 class="faq__q">What happens when a paid period ends?</h2>
          <p class="faq__a">Your account returns to the Free plan. All your trades, notes, strategies and historical records remain fully preserved on your machine.</p>
        </article>
      </div>
    </section>

    <!-- DATA PRIVACY -->
    <section class="privacy" aria-labelledby="privacy-title">
      <div class="label mono"><span>Data</span><span>Privacy</span></div>
      <div class="privacy__body">
        <h2 id="privacy-title" class="privacy__title">Your journal and exchange API keys never leave your computer.</h2>
        <p>Google Sign-In is used only for your account: profile, license, forum and events. Your data is never sold or shared with advertisers. <router-link to="/privacy">Privacy Policy ↗</router-link></p>
      </div>
    </section>

    <!-- BACK COVER / FOOTER -->
    <footer class="end">
      <h2 class="end__title">Find the leak.<br />Fix the rule.</h2>
      <div class="end__actions">
        <a v-for="item in downloads" :key="item.id" :href="item.url" class="btn btn--paper">Download for {{ item.name }} <span aria-hidden="true">↓</span></a>
      </div>
      <div class="end__foot mono">
        <span>Jörmungandr © {{ year }}</span>
        <span><router-link to="/terms">Terms</router-link> · <router-link to="/privacy">Privacy</router-link> · <a href="https://t.me/gandr_trade">Telegram</a></span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { downloads, refreshDownloads } from '../shared/downloads.js'

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;800&family=JetBrains+Mono:wght@400;500&display=swap'
const year = new Date().getFullYear()

const plans = {
  free: [
    'Trading journal with screenshots, tags and context',
    'Equity curve and core metrics',
    'Karl-Nikolai I (without rehabilitation function)',
    'Detailed reports (without scenario and condition analysis)',
    'MetaTrader 5 trade import',
    'Activity monitor',
    'Forum and trading events',
  ],
  full: [
    'Everything in Free without restrictions',
    'Unlimited strategy creation',
    'Exchange chart for every trade',
    'Score Patterns',
    'Broker API import',
    'Forecast Manager',
  ],
}

const comparison = [
  ['Log trades, notes and screenshots', true],
  ['Equity curve and drawdowns', true],
  ['Strategy builder, per-condition analytics and condition recommendations', false],
  ['Exchange chart replay and in-trade behavior analysis', false],
  ['Loss-making pattern detection in trades', false],
  ['Strategy rule adherence verification', false],
]

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
.crypto-sec__body { display: grid; grid-template-columns: 1fr 1fr; }
.crypto-sec__lead { padding: clamp(28px, 4.5vw, 64px) var(--edge); border-right: 2px solid #000; display: flex; flex-direction: column; gap: 20px; }
.crypto-sec__title { margin: 0; font-weight: 800; font-size: clamp(32px, 4.2vw, 68px); letter-spacing: -0.04em; line-height: 0.95; }
.crypto-sec__desc { margin: 0; font-size: clamp(15px, 1.2vw, 18px); line-height: 1.35; opacity: 0.85; max-width: 44ch; }
.crypto-sec__actions { margin-top: auto; padding-top: 16px; }
.crypto-sec__steps { display: grid; grid-template-columns: 1fr 1fr; }
.crypto-step { padding: clamp(20px, 2.5vw, 36px) var(--edge); border-bottom: 1px solid rgba(0, 0, 0, 0.15); border-right: 1px solid rgba(0, 0, 0, 0.15); display: flex; flex-direction: column; gap: 8px; }
.crypto-step:nth-child(2n) { border-right: 0; }
.crypto-step:nth-last-child(-n+2) { border-bottom: 0; }
.crypto-step .mono { opacity: 0.6; }
.crypto-step h3 { margin: 4px 0 0; font-size: clamp(16px, 1.3vw, 20px); font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; }
.crypto-step p { margin: 0; font-size: 13px; line-height: 1.35; opacity: 0.75; }

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
.end { background: #000; color: #fff; padding: var(--edge); display: flex; flex-direction: column; gap: clamp(20px, 3vw, 44px); min-height: 70vh; }
.end__title { margin: clamp(20px, 5vw, 80px) 0 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.82; font-size: clamp(54px, 13vw, 240px); margin-left: -0.02em; }
.end__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.end__foot { margin-top: auto; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-top: 14px; border-top: 2px solid #fff; }
.end__foot a:hover { text-decoration: underline; text-underline-offset: 3px; }

@media (max-width: 900px) {
  .bar__nav a:not(:last-child) { display: none; }
  .plans { grid-template-columns: 1fr; }
  .plan + .plan { border-left: 0; border-top: 2px solid #000; }
  .crypto-sec__body { grid-template-columns: 1fr; }
  .crypto-sec__lead { border-right: 0; border-bottom: 2px solid #000; }
  .crypto-sec__steps { grid-template-columns: 1fr; }
  .crypto-step { border-right: 0; border-bottom: 1px solid rgba(0, 0, 0, 0.15); }
  .crypto-step:last-child { border-bottom: 0; }
  .faq__grid { grid-template-columns: 1fr; }
  .faq__item { border-right: 0; }
  .faq__item:nth-last-child(2) { border-bottom: 2px solid #000; }
  .privacy__body { grid-template-columns: 1fr; }
}
</style>
