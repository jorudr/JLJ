<template>
  <div class="bx" :class="{ 'bx--reduced': reducedMotion }">
    <div class="bx-grain" aria-hidden="true"></div>

    <!-- NAV -->
    <header class="bx-nav">
      <router-link to="/dev" class="bx-nav__brand" aria-label="JORU home">
        <img src="/assets/herb.svg" alt="" width="22" height="20" />
        <span><strong>JORU</strong><em>Trading journal</em></span>
      </router-link>
      <nav class="bx-nav__links" :class="{ 'is-open': menuOpen }" aria-label="Main">
        <a v-for="link in navLinks" :key="link.href" :href="link.href" @click="menuOpen = false">{{ link.label }}</a>
      </nav>
      <div class="bx-nav__actions">
        <router-link to="/download" class="bx-button bx-button--small">Download free</router-link>
        <button type="button" class="bx-nav__toggle" :aria-expanded="menuOpen" aria-label="Menu" @click="menuOpen = !menuOpen">
          <span></span><span></span>
        </button>
      </div>
    </header>

    <!-- HERO -->
    <section ref="coverEl" class="bx-hero" aria-labelledby="hero-title">
      <p class="bx-hero__eyebrow"><span>For discretionary and systematic traders</span><span>Desktop app for Windows &amp; macOS</span></p>
      <h1 id="hero-title" class="bx-hero__title">
        <span class="bx-wide">Trading journal</span>
        <span class="bx-hero__sub">that finds the habits costing you money.</span>
      </h1>
      <div class="bx-hero__grid">
        <div class="bx-hero__copy">
          <p class="bx-hero__lead">Record every trade with its context. JORU analyses your history, shows which conditions lose you money, and checks that you stop repeating them.</p>
          <div class="bx-hero__actions">
            <router-link to="/download" class="bx-button">Download free</router-link>
            <a href="#patterns" class="bx-button bx-button--ghost">See how it works ↓</a>
          </div>
          <ul class="bx-hero__facts">
            <li><strong>$0</strong> Free journal, no time limit</li>
            <li><strong>2</strong> Windows and macOS</li>
            <li><strong>100%</strong> Trades and API keys stay on your computer</li>
          </ul>
        </div>
        <figure class="bx-hero__shot" :style="{ '--tilt': coverProgress }">
          <img src="/dev/journal.jpg" alt="JORU trading journal: 26 trades recorded with total P/L, win rate and the list of trades" width="1024" height="638" fetchpriority="high" />
          <figcaption>Fig. 0 — The journal: trades, P/L and win rate at a glance.</figcaption>
        </figure>
      </div>
    </section>

    <!-- §01 CONTENTS -->
    <section id="contents" class="bx-spread bx-spread--black" aria-labelledby="contents-title">
      <div class="bx-page bx-page--text">
        <div class="bx-running"><span>Contents</span><span>What is inside</span></div>
        <h2 id="contents-title" class="bx-issue"><span>Issue</span><span>Nº01</span></h2>
        <ol class="bx-toc">
          <li
            v-for="(item, index) in contents"
            :key="item.title"
            :class="{ 'is-active': activeContent === index }"
            @mouseenter="activeContent = index"
            @focusin="activeContent = index"
          >
            <a :href="item.href">
              <span class="bx-toc__num">{{ index + 1 }}</span>
              <span class="bx-toc__title">{{ item.title }}</span>
              <span class="bx-toc__pages">{{ item.pages }}</span>
              <span class="bx-toc__text">{{ item.text }}</span>
            </a>
          </li>
        </ol>
        <div class="bx-folio"><span>01<br />Table of Contents</span><span>Issue<br />Nº01</span></div>
      </div>
      <div class="bx-page bx-page--image">
        <div class="bx-running"><span>Fig. {{ activeContent + 1 }}</span><span>{{ contents[activeContent].title }}</span></div>
        <figure class="bx-plate">
          <img
            v-for="(item, index) in contents"
            :key="item.image"
            :src="item.image"
            :alt="item.alt"
            :class="{ 'is-visible': activeContent === index }"
            loading="lazy"
            decoding="async"
            width="1440"
            height="900"
          />
        </figure>
        <div class="bx-folio"><span>02<br />Table of Contents</span><span>Issue<br />Nº01</span></div>
      </div>
    </section>

    <!-- §02 THE LEDGER: problem → pattern → rule -->
    <section id="patterns" ref="ledgerEl" class="bx-scroll bx-scroll--ledger" aria-labelledby="ledger-title">
      <div class="bx-sticky">
        <div class="bx-running bx-running--wide">
          <span>§02 — Investigation</span>
          <span>Karl-Nikolai I</span>
          <span class="bx-muted">Illustrative data</span>
        </div>
        <div class="bx-ledger-layout">
          <div class="bx-ledger-copy">
            <p class="bx-counter"><span class="bx-mono">{{ ['512', '01', '01'][ledgerStage] }}</span> {{ ['trades in your journal', 'costly condition found', 'rule accepted'][ledgerStage] }}</p>
            <h2 id="ledger-title" class="bx-headline">
              <template v-if="ledgerStage === 0">Somewhere in here is a habit costing you money.</template>
              <template v-else-if="ledgerStage === 1">Shorts opened before 10:00.</template>
              <template v-else>Commit to a rule. JORU checks that it holds.</template>
            </h2>
            <p class="bx-body">
              <template v-if="ledgerStage === 0">You remember the big losses. The expensive ones are quiet: a time of day, a side, a setup you take after a losing trade. Nobody finds them by scrolling a spreadsheet.</template>
              <template v-else-if="ledgerStage === 1">Karl-Nikolai I tests every condition and every pair of conditions in your history, then ranks the ones that reduce your result by impact and confidence.</template>
              <template v-else>Accept the finding as a rule and Karl-Nikolai I follows your next trades. If the pattern comes back, it is flagged again.</template>
            </p>

            <div v-if="ledgerStage === 1" class="bx-finding">
              <div class="bx-finding__head"><span>Finding 01 / 03</span><span>Confidence — high</span></div>
              <dl>
                <div><dt>Win rate inside</dt><dd class="is-red">31%</dd></div>
                <div><dt>Win rate outside</dt><dd>54%</dd></div>
                <div><dt>In worst 10 trades</dt><dd class="is-red">6</dd></div>
              </dl>
              <p>Effect on the total — without this pattern the result would be 18% higher.</p>
            </div>

            <div v-if="ledgerStage === 2" class="bx-rule">
              <div class="bx-finding__head"><span>Rule — no shorts before 10:00</span><span>{{ ruleKept }} / 30 kept</span></div>
              <div class="bx-rule__grid">
                <i v-for="n in 30" :key="n" :class="ruleCellClass(n)"></i>
              </div>
            </div>
          </div>

          <div class="bx-ledger" :class="`bx-ledger--stage-${ledgerStage}`" aria-hidden="true">
            <div class="bx-ledger__head"><span>Date</span><span>Time</span><span>Asset</span><span>Side</span><span>R</span></div>
            <div class="bx-ledger__rows">
              <div v-for="row in ledgerRows" :key="row.id" class="bx-ledger__row" :class="{ 'is-pattern': row.pattern, 'is-loss': row.r < 0 }">
                <span>{{ row.date }}</span><span>{{ row.time }}</span><span>{{ row.asset }}</span><span>{{ row.side }}</span><span>{{ row.r > 0 ? '+' : '' }}{{ row.r.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="bx-progress"><i :style="{ transform: `scaleX(${ledgerProgress})` }"></i></div>
      </div>
    </section>

    <!-- §03 WHITE SPREAD: Karl-Nikolai I -->
    <section class="bx-spread bx-spread--white" aria-labelledby="kn-title">
      <div class="bx-page bx-page--narrow">
        <div class="bx-running"><span>§03</span><span>— Pattern detection</span></div>
        <h2 id="kn-title" class="bx-caps">Karl-<br />Nikolai I</h2>
        <p class="bx-justify">Every journal shows what happened. Karl-Nikolai I shows what is costing you. It scans the full trade history for the conditions that reduce your result, attaches a confidence score to each, and tells you how much higher the total would be without them.</p>
        <p class="bx-justify bx-push">It then runs a rehabilitation loop: once you accept a rule, the next trades are checked against it, and a pattern that returns is flagged again. Analysis turns into a change in behaviour, not another dashboard.</p>
      </div>
      <div class="bx-page bx-page--wide">
        <figure class="bx-photo" data-reveal>
          <img src="/dev/karl-nikolai.jpg" alt="Karl-Nikolai I showing the effect of a costly pattern on the total result" loading="lazy" decoding="async" width="1024" height="638" />
        </figure>
        <div class="bx-captions">
          <p>Fig. 3 — Integrity score: the share of recent trades that followed your accepted rules.</p>
          <p>Fig. 4 — Effect on the total: “Without this problem the total result would be 5% higher.”</p>
        </div>
      </div>
    </section>

    <!-- §04 ROBUSTNESS: Monte Carlo -->
    <section id="robustness" ref="mcEl" class="bx-scroll bx-scroll--mc" aria-labelledby="mc-title">
      <div class="bx-sticky">
        <div class="bx-running bx-running--wide">
          <span>§04 — Risk</span>
          <span>Robustness Analytics</span>
          <span class="bx-muted">Illustrative simulation</span>
        </div>
        <div class="bx-mc">
          <div class="bx-mc__copy">
            <h2 id="mc-title" class="bx-headline">
              <template v-if="mcProgress < 0.45">Your equity curve is one path.</template>
              <template v-else>Here are {{ mcPaths.length * 5 }} others it could have taken.</template>
            </h2>
            <p class="bx-body">Monte Carlo simulation reshuffles your own trades into hundreds of alternate histories. You see the real range of drawdowns your strategy can produce and the risk of ruin, not just the one path you happened to live through.</p>
            <dl class="bx-stats" :class="{ 'is-visible': mcProgress > 0.55 }">
              <div><dt>Worst drawdown, 95% of paths</dt><dd class="is-red">−{{ mcStats.dd95 }}%</dd></div>
              <div><dt>Paths ending below start</dt><dd>{{ mcStats.below }}%</dd></div>
              <div><dt>Median result</dt><dd>+{{ mcStats.median }}%</dd></div>
            </dl>
          </div>
          <svg class="bx-mc__chart" viewBox="0 0 800 420" preserveAspectRatio="none" aria-hidden="true">
            <line v-for="y in 5" :key="y" x1="0" x2="800" :y1="y * 84 - 42" :y2="y * 84 - 42" class="bx-mc__grid" />
            <line x1="0" x2="800" :y1="mcBaseline" :y2="mcBaseline" class="bx-mc__base" />
            <g :style="{ opacity: Math.max(0, (mcProgress - 0.4) / 0.4) }">
              <polyline v-for="(path, index) in mcPaths" :key="index" :points="path.points" class="bx-mc__path" :class="{ 'is-ruin': path.below }" />
            </g>
            <polyline :points="mcMain" class="bx-mc__main" pathLength="1" :style="{ strokeDashoffset: 1 - Math.min(1, mcProgress / 0.4) }" />
          </svg>
        </div>
        <div class="bx-progress"><i :style="{ transform: `scaleX(${mcProgress})` }"></i></div>
      </div>
    </section>

    <!-- §05 WHITE SPREAD: Genesis Matrix -->
    <section id="strategy" class="bx-spread bx-spread--white bx-spread--flip" aria-labelledby="gm-title">
      <div class="bx-page bx-page--wide">
        <figure class="bx-photo" data-reveal>
          <img src="/screenshots/genesis-matrix.png" alt="Genesis Matrix: a strategy built as a graph of conditions" loading="lazy" decoding="async" width="1440" height="900" />
        </figure>
        <div class="bx-captions">
          <p>Fig. 5 — A strategy as a graph: scenarios, conditions and the links between them.</p>
          <p>Fig. 6 — Each version is saved, so changes can be compared by result.</p>
        </div>
      </div>
      <div class="bx-page bx-page--narrow bx-align-right">
        <div class="bx-running"><span>§05</span><span>— Strategy</span></div>
        <h2 id="gm-title" class="bx-caps">Genesis<br />Matrix</h2>
        <p class="bx-justify">Write your strategy down as it really works: scenarios, entry and exit conditions, position building. Connect them in a visual graph and see which combinations performed best and worst directly on it.</p>
        <p class="bx-justify bx-push">Save every change as a new version and compare versions by win rate, profit factor, average result and execution quality. You keep what works, with numbers behind it.</p>
      </div>
    </section>

    <!-- §06 IMPORT -->
    <section id="import" class="bx-import" aria-labelledby="import-title">
      <div class="bx-running bx-running--wide"><span>§06 — Import</span><span>Broker API</span><span>Stop typing trades by hand</span></div>
      <h2 id="import-title" class="bx-sr">Supported platforms</h2>
      <ul class="bx-import__list">
        <li v-for="(name, index) in platforms" :key="name" data-reveal :style="{ '--i': index }">
          <span class="bx-wide">{{ name }}</span><span class="bx-import__arrow">→ Journal</span>
        </li>
      </ul>
    </section>

    <!-- §07 COMPARISON -->
    <section class="bx-compare" aria-labelledby="compare-title">
      <div class="bx-running bx-running--wide"><span>§07 — Comparison</span><span>Spreadsheet vs JORU</span><span></span></div>
      <h2 id="compare-title" class="bx-headline bx-headline--compact">A spreadsheet can log trades. It cannot tell you which ones to stop taking.</h2>
      <table class="bx-table">
        <thead><tr><th scope="col"></th><th scope="col">Spreadsheet</th><th scope="col">JORU</th></tr></thead>
        <tbody>
          <tr v-for="row in comparison" :key="row[0]">
            <th scope="row">{{ row[0] }}</th>
            <td :class="{ 'is-no': !row[1] }">{{ row[1] ? 'Yes' : 'No' }}</td>
            <td>Yes</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- §08 PRICING -->
    <section id="pricing" class="bx-pricing" aria-labelledby="pricing-title">
      <div class="bx-running bx-running--wide"><span>§08 — Pricing</span><span>One application, two plans</span><span></span></div>
      <h2 id="pricing-title" class="bx-sr">Pricing</h2>
      <div class="bx-plans">
        <article class="bx-plan">
          <header><span>Free</span><strong class="bx-wide">$0</strong></header>
          <p>Build the review habit.</p>
          <ul><li v-for="item in plans.free" :key="item">{{ item }}</li></ul>
          <router-link to="/download" class="bx-button bx-button--ghost">Download free</router-link>
        </article>
        <article class="bx-plan bx-plan--full">
          <header><span>Full</span><strong class="bx-wide">$9.99</strong><em>/ month</em></header>
          <p>Find, fix and prove. Less than the cost of one bad trade.</p>
          <ul><li v-for="item in plans.full" :key="item">{{ item }}</li></ul>
          <router-link to="/pricing" class="bx-button">Subscribe</router-link>
        </article>
      </div>
    </section>

    <!-- §09 PRIVACY -->
    <section class="bx-privacy" aria-labelledby="privacy-title">
      <div class="bx-running bx-running--wide"><span>§09 — Data</span><span>Privacy</span><span></span></div>
      <h2 id="privacy-title" class="bx-headline">Your journal and exchange API keys never leave your computer.</h2>
      <p class="bx-body">Google Sign-In is used only for your account: profile, license, forum and events. Your data is never sold or shared with advertisers. <router-link to="/privacy">Privacy Policy ↗</router-link></p>
    </section>

    <!-- BACK COVER -->
    <section class="bx-back" aria-labelledby="back-title">
      <h2 id="back-title" class="bx-wide bx-back__title">Find the leak.<br />Fix the rule.</h2>
      <div class="bx-back__actions">
        <a v-for="item in downloads" :key="item.id" :href="item.url" class="bx-button">Download for {{ item.name }}</a>
      </div>
      <div class="bx-folio bx-folio--back">
        <span>J.L. Jörmungandr<br />Issue Nº01 — {{ year }}</span>
        <span><router-link to="/terms">Terms</router-link> · <router-link to="/privacy">Privacy</router-link> · <a href="https://t.me/gandr_trade">Telegram</a></span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { downloads, refreshDownloads } from '../../shared/downloads.js'

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=Inter+Tight:wght@200;300;400;500;700;800&family=JetBrains+Mono:wght@400;500&display=swap'

const year = new Date().getFullYear()
const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Deterministic PRNG so the illustrative data never changes between visits.
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ── Contents ─────────────────────────────────────────── */
const contents = [
  { title: 'Trading Journal', pages: '02—03', href: '#patterns', image: '/screenshots/trades-tree.png', alt: 'Trade journal timeline with filters', text: 'Every trade with its screenshots, tags, notes and the reason you took it. Filter by scenario, condition, session or time window.' },
  { title: 'Karl-Nikolai I', pages: '04—05', href: '#patterns', image: '/dev/karl-nikolai.jpg', alt: 'Karl-Nikolai I pattern detection', text: 'Finds the conditions that cost you money, ranks them by impact and confidence, and tracks whether the rule you accept actually holds.' },
  { title: 'Robustness Analytics', pages: '06—07', href: '#robustness', image: '/screenshots/deep-data.png', alt: 'Distribution of trade results from max loss to max profit', text: 'Monte Carlo simulation, risk of ruin, trade distribution and a 3D equity curve. The real range of outcomes, not one lucky path.' },
  { title: 'Genesis Matrix', pages: '08—09', href: '#strategy', image: '/screenshots/genesis-matrix.png', alt: 'Genesis Matrix strategy graph', text: 'Build a strategy as a visual graph of conditions. Save versions and compare them by win rate, profit factor and execution.' },
  { title: 'Trading Report', pages: '10—11', href: '#strategy', image: '/dev/report.jpg', alt: 'Trading report with results by session', text: 'Profit and loss, distribution, risk and execution, drawdowns, results by session and asset, in one readable report.' },
  { title: 'Broker Import', pages: '12', href: '#import', image: '/screenshots/3d-equity.png', alt: 'Equity curve', text: 'MetaTrader 5, Bybit, Binance, Kraken and Interactive Brokers. Trades arrive in the journal without retyping.' },
]
const activeContent = ref(0)

/* ── Nav ──────────────────────────────────────────────── */
const navLinks = [
  { href: '#patterns', label: 'How it works' },
  { href: '#contents', label: 'Features' },
  { href: '#robustness', label: 'Risk' },
  { href: '#import', label: 'Import' },
  { href: '#pricing', label: 'Pricing' },
]
const menuOpen = ref(false)

/* ── Ledger ───────────────────────────────────────────── */
const ASSETS = ['EURUSD', 'BTC', 'ETH', 'SPX500', 'GBPUSD', 'XAUUSD', 'NQ100']
const ledgerRows = (() => {
  const rand = rng(7)
  const rows = []
  for (let i = 0; i < 132; i++) {
    // Every ~6th trade is an early short, so the pattern is visible on any screen size.
    const forced = rand() < 0.16
    const hour = forced ? 8 + Math.floor(rand() * 2) : 7 + Math.floor(rand() * 11)
    const minute = Math.floor(rand() * 60)
    const side = forced || rand() < 0.45 ? 'SHORT' : 'LONG'
    const pattern = side === 'SHORT' && hour < 10
    const win = rand() < (pattern ? 0.31 : 0.56)
    const r = win ? 0.4 + rand() * 2.1 : -(0.3 + rand() * (pattern ? 1.2 : 0.8))
    const day = 1 + (i % 28)
    const month = ['SEP', 'OCT', 'NOV'][Math.floor(i / 44)]
    rows.push({
      id: i,
      date: `${String(day).padStart(2, '0')} ${month}`,
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      asset: ASSETS[Math.floor(rand() * ASSETS.length)],
      side,
      pattern,
      r,
    })
  }
  return rows
})()

/* ── Monte Carlo ──────────────────────────────────────── */
const W = 800
const H = 420
const STEPS = 90
const mcData = (() => {
  const rand = rng(42)
  // Tuned so the illustration shows a modest edge with real tail risk (~12% of paths end below start).
  const returns = Array.from({ length: STEPS }, () => (rand() < 0.5 ? 0.4 + rand() * 2.0 : -(0.5 + rand() * 1.4)))
  const walk = (list) => list.reduce((acc, value) => { acc.push(acc[acc.length - 1] + value); return acc }, [0])
  const main = walk(returns)
  const paths = []
  for (let p = 0; p < 300; p++) {
    const shuffled = Array.from({ length: STEPS }, () => returns[Math.floor(rand() * STEPS)])
    paths.push(walk(shuffled))
  }
  const all = [main, ...paths].flat()
  const min = Math.min(...all)
  const max = Math.max(...all)
  const y = (value) => H - 20 - ((value - min) / (max - min)) * (H - 40)
  const x = (index) => (index / STEPS) * W
  const toPoints = (path) => path.map((value, index) => `${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(' ')
  // Express equity as % of an account risking 1% per R.
  const drawdown = (path) => {
    let peak = 100
    let worst = 0
    for (const value of path) {
      const equity = 100 + value
      peak = Math.max(peak, equity)
      worst = Math.max(worst, (peak - equity) / peak)
    }
    return worst * 100
  }
  const dds = paths.map(drawdown).sort((a, b) => a - b)
  const ends = paths.map(path => path[path.length - 1]).sort((a, b) => a - b)
  return {
    main: toPoints(main),
    baseline: y(0),
    // Render every fifth path to keep the SVG light; stats use all 300.
    paths: paths.filter((_, index) => index % 5 === 0).map(path => ({ points: toPoints(path), below: path[path.length - 1] < 0 })),
    stats: {
      dd95: dds[Math.floor(dds.length * 0.95)].toFixed(1),
      below: Math.round((ends.filter(value => value < 0).length / ends.length) * 100),
      median: ends[Math.floor(ends.length / 2)].toFixed(0),
    },
  }
})()
const mcMain = mcData.main
const mcPaths = mcData.paths
const mcStats = mcData.stats
const mcBaseline = mcData.baseline

/* ── Content blocks ───────────────────────────────────── */
const platforms = ['MetaTrader 5', 'Bybit', 'Binance', 'Kraken', 'Interactive Brokers']
const comparison = [
  ['Log trades, notes and screenshots', true],
  ['Equity curve and drawdowns', true],
  ['Test every condition for what it costs you', false],
  ['Confidence score for each finding', false],
  ['Track whether you kept a new rule', false],
  ['Monte Carlo and risk of ruin', false],
  ['Import from your broker', false],
]
const plans = {
  free: ['Trading journal with screenshots, tags and context', 'Equity curve and core metrics', 'Activity monitor', 'Forum and trading events'],
  full: ['Everything in Free', 'Karl-Nikolai I — pattern detection and rule tracking', 'Robustness Analytics — Monte Carlo, risk of ruin', 'Genesis Matrix and strategy versions', 'Deep trade analytics and trading report', 'Broker API import', 'Forecast Manager'],
}

/* ── Scroll-driven progress ───────────────────────────── */
const coverEl = ref(null)
const ledgerEl = ref(null)
const mcEl = ref(null)
const coverProgress = ref(0)
const ledgerProgress = ref(reducedMotion ? 0.5 : 0)
const mcProgress = ref(reducedMotion ? 1 : 0)

const clamp = (value) => Math.min(1, Math.max(0, value))
const sectionProgress = (el) => {
  if (!el) return 0
  const rect = el.getBoundingClientRect()
  const travel = rect.height - window.innerHeight
  return travel > 0 ? clamp(-rect.top / travel) : 0
}

const ledgerStage = computed(() => (ledgerProgress.value < 0.3 ? 0 : ledgerProgress.value < 0.66 ? 1 : 2))
const ruleFill = computed(() => Math.round(clamp((ledgerProgress.value - 0.66) / 0.3) * 30))
const ruleKept = computed(() => ruleFill.value - (ruleFill.value >= 19 ? 1 : 0) - (ruleFill.value >= 8 ? 1 : 0))
const ruleCellClass = (n) => {
  if (n > ruleFill.value) return ''
  return n === 8 || n === 19 ? 'is-broken' : 'is-kept'
}

let frame = 0
const onScroll = () => {
  if (frame) return
  frame = requestAnimationFrame(() => {
    frame = 0
    checkReveals()
    if (reducedMotion) return
    if (coverEl.value) {
      const rect = coverEl.value.getBoundingClientRect()
      coverProgress.value = clamp(-rect.top / rect.height)
    }
    ledgerProgress.value = sectionProgress(ledgerEl.value)
    mcProgress.value = sectionProgress(mcEl.value)
  })
}

/* ── Reveal on scroll: hard wipe-in once the element enters the viewport ── */
// Checked from the scroll handler rather than IntersectionObserver so a fast jump
// (anchor link, restored scroll position) still reveals everything above the fold.
const pendingReveals = new Set()
const checkReveals = () => {
  for (const el of pendingReveals) {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
      el.classList.add('is-in')
      pendingReveals.delete(el)
    }
  }
}

let fontLink = null
onMounted(() => {
  if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
    fontLink = document.createElement('link')
    fontLink.rel = 'stylesheet'
    fontLink.href = FONT_HREF
    document.head.appendChild(fontLink)
  }
  refreshDownloads()
  document.querySelectorAll('.bx [data-reveal]').forEach((el) => {
    if (reducedMotion) el.classList.add('is-in')
    else pendingReveals.add(el)
  })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  onScroll()
  // Debug helper for screenshots: /dev?y=2400 scrolls to that offset.
  const y = Number(new URLSearchParams(location.search).get('y'))
  if (y) requestAnimationFrame(() => { window.scrollTo(0, y); onScroll() })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  pendingReveals.clear()
  fontLink?.remove()
})
</script>

<style scoped>
.bx {
  --ink: #0b0b0b;
  --paper: #ecebe7;
  --bone: #f2f1ed;
  --grey: #a8a8a3;
  --rule: rgba(242, 241, 237, 0.18);
  --rule-dark: rgba(11, 11, 11, 0.2);
  --red: #e10600;
  --red-text: #ff4a3d; /* brighter red for numbers on the dark background */
  --gutter: clamp(16px, 2.6vw, 40px);
  --sans: 'Inter Tight', 'Helvetica Neue', Arial, sans-serif;
  --wide: 'Archivo', 'Arial Black', sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  position: relative;
  background: var(--ink);
  color: var(--bone);
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.4;
  overflow-x: clip;
}
.bx a { color: inherit; text-decoration: none; }
.bx-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.bx-mono { font-family: var(--mono); }
.bx-muted { color: var(--grey); }
.bx-wide { font-family: var(--wide); font-stretch: 125%; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; line-height: 0.86; }

/* Film grain over everything */
.bx-grain {
  position: fixed; inset: -50%; z-index: 60; pointer-events: none; opacity: 0.09;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: bx-grain 0.6s steps(3) infinite;
}
@keyframes bx-grain { 0% { transform: translate(0, 0) } 33% { transform: translate(-3%, 2%) } 66% { transform: translate(2%, -3%) } }

/* ── Nav ── */
.bx-nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 50; height: 60px;
  display: flex; align-items: center; gap: 28px; padding: 0 var(--gutter);
  background: rgba(11, 11, 11, 0.92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--rule);
}
.bx-nav__brand { display: flex; align-items: center; gap: 10px; }
.bx-nav__brand img { filter: brightness(0) invert(1); width: 22px; height: auto; }
.bx-nav__brand span { display: flex; flex-direction: column; line-height: 1.05; }
.bx-nav__brand strong { font-family: var(--wide); font-stretch: 125%; font-weight: 900; font-size: 17px; letter-spacing: 0.02em; }
.bx-nav__brand em { font-style: normal; font-size: 12px; color: var(--grey); }
.bx-nav__links { display: flex; gap: 26px; margin-left: auto; font-size: 15px; }
.bx-nav__links a { padding: 6px 0; border-bottom: 1px solid transparent; }
.bx-nav__links a:hover { border-bottom-color: var(--bone); }
.bx-nav__actions { display: flex; align-items: center; gap: 12px; }
.bx-nav__toggle { display: none; width: 40px; height: 40px; border: 1px solid var(--rule); background: none; cursor: pointer; flex-direction: column; justify-content: center; align-items: center; gap: 6px; }
.bx-nav__toggle span { display: block; width: 18px; height: 1.5px; background: var(--bone); }

/* ── Shared editorial bits ── */
.bx-running { display: flex; justify-content: space-between; gap: 16px; font-size: 13px; line-height: 1.2; text-transform: uppercase; letter-spacing: 0.04em; }
.bx-running--wide { display: grid; grid-template-columns: 1fr 1fr auto; padding: 0 var(--gutter); }
.bx-folio { display: flex; justify-content: space-between; font-size: 13px; line-height: 1.2; color: var(--grey); }
.bx-headline { font-weight: 300; font-size: clamp(36px, 5.4vw, 92px); line-height: 0.98; letter-spacing: -0.035em; margin: 0; }
.bx-headline--compact { font-size: clamp(30px, 4vw, 64px); max-width: 18ch; }
.bx-body { font-size: clamp(16px, 1.15vw, 19px); line-height: 1.5; max-width: 44ch; color: rgba(242, 241, 237, 0.85); margin: 0; }
.bx-body a { text-decoration: underline; color: var(--bone); }
.bx-caps { font-weight: 800; text-transform: uppercase; font-size: clamp(40px, 5.6vw, 96px); line-height: 0.88; letter-spacing: -0.04em; margin: 0; }
.bx-justify { text-align: justify; hyphens: auto; font-size: 16px; line-height: 1.45; margin: 0; max-width: 42ch; }
.bx-progress { position: absolute; left: var(--gutter); right: var(--gutter); bottom: 18px; height: 1px; background: var(--rule); }
.bx-progress i { display: block; height: 100%; background: var(--bone); transform-origin: left; }
.bx-button {
  display: inline-flex; align-items: center; justify-content: center; padding: 14px 22px;
  background: var(--bone); color: var(--ink) !important; font-size: 14px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  border: 1px solid var(--bone); transition: background 0.15s, color 0.15s;
}
.bx-button:hover { background: var(--red); border-color: var(--red); color: #fff !important; }
.bx-button--ghost { background: transparent; color: var(--bone) !important; }
.bx-button--small { padding: 10px 16px; font-size: 13px; }
.is-red { color: var(--red-text); }

/* ── Hero ── */
.bx-hero { position: relative; min-height: 100svh; padding: 92px var(--gutter) 48px; display: flex; flex-direction: column; overflow: hidden; }
.bx-hero__eyebrow { display: flex; justify-content: space-between; margin: 0 0 18px; font-size: 14px; color: var(--grey); border-bottom: 1px solid var(--rule); padding-bottom: 12px; }
.bx-hero__eyebrow span:first-child { color: var(--bone); font-weight: 500; }
.bx-hero__title { margin: 0; }
.bx-hero__title .bx-wide { display: block; font-size: 7.6vw; white-space: nowrap; margin-left: -0.04em; }
.bx-hero__sub { display: block; margin-top: 0.35em; font-weight: 300; font-size: clamp(26px, 3.6vw, 60px); line-height: 1.02; letter-spacing: -0.03em; }
.bx-hero__grid { flex: 1; display: grid; grid-template-columns: minmax(300px, 0.8fr) 1.5fr; gap: var(--gutter); margin-top: clamp(28px, 4vh, 48px); align-items: start; }
.bx-hero__copy { display: flex; flex-direction: column; gap: 26px; }
.bx-hero__lead { margin: 0; font-size: clamp(17px, 1.35vw, 21px); line-height: 1.45; color: rgba(242, 241, 237, 0.88); max-width: 34ch; }
.bx-hero__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.bx-hero__facts { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--rule); }
.bx-hero__facts li { display: grid; grid-template-columns: 76px 1fr; align-items: baseline; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--rule); font-size: 15px; color: rgba(242, 241, 237, 0.85); }
.bx-hero__facts strong { font-family: var(--mono); font-weight: 500; font-size: 17px; color: var(--bone); }
.bx-hero__shot { margin: 0; perspective: 1600px; }
.bx-hero__shot img {
  display: block; width: 100%; height: auto; border: 1px solid var(--rule);
  transform-origin: 50% 0; transform: rotateX(max(0deg, calc(14deg - var(--tilt) * 50deg)));
  box-shadow: 0 40px 80px -30px rgba(0, 0, 0, 0.9);
}
.bx-hero__shot figcaption { margin-top: 10px; font-size: 14px; color: var(--grey); }

/* ── Spreads ── */
.bx-spread { display: grid; grid-template-columns: 1fr 1fr; min-height: 100svh; }
.bx-spread--black { background: var(--ink); border-top: 1px solid var(--rule); }
.bx-spread--black .bx-page + .bx-page { border-left: 1px solid var(--rule); }
.bx-page { position: relative; display: flex; flex-direction: column; gap: 28px; padding: 84px var(--gutter) 22px; }
.bx-page--text { justify-content: space-between; }
.bx-page--image { padding-bottom: 22px; }

.bx-issue { display: grid; grid-template-columns: 1fr 1fr; margin: 0; font-weight: 300; font-size: clamp(56px, 8vw, 150px); line-height: 0.9; letter-spacing: -0.05em; }
.bx-toc { list-style: none; margin: 0; padding: 0; max-width: 34em; counter-reset: toc; }
.bx-toc li { border-top: 1px solid var(--rule); transition: color 0.15s; }
.bx-toc li:last-child { border-bottom: 1px solid var(--rule); }
.bx-toc a { display: grid; grid-template-columns: 24px 1fr auto; column-gap: 8px; padding: 12px 0; font-size: 16px; line-height: 1.35; }
.bx-toc__num { display: inline-flex; width: 18px; height: 18px; margin-top: 2px; border-radius: 50%; background: var(--bone); color: var(--ink); font-size: 11px; font-weight: 700; align-items: center; justify-content: center; }
.bx-toc__title { font-weight: 500; }
.bx-toc__pages { font-variant-numeric: tabular-nums; }
.bx-toc__text { grid-column: 2 / 4; text-align: justify; hyphens: auto; color: rgba(242, 241, 237, 0.7); font-size: 15px; max-height: 0; overflow: hidden; transition: max-height 0.35s, color 0.15s, margin 0.35s; }
.bx-toc li.is-active .bx-toc__text { max-height: 6em; margin-top: 4px; color: rgba(242, 241, 237, 0.85); }
.bx-toc li.is-active .bx-toc__num { background: var(--red); color: #fff; }

.bx-plate { position: relative; flex: 1; margin: 0; overflow: hidden; background: #000; min-height: 50vh; }
.bx-plate img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.25) brightness(1.05); clip-path: inset(0 0 100% 0); transition: clip-path 0.55s cubic-bezier(0.7, 0, 0.2, 1); }
.bx-plate img.is-visible { clip-path: inset(0 0 0 0); }

.bx-spread--white { background: var(--paper); color: var(--ink); grid-template-columns: minmax(280px, 1fr) 2fr; }
.bx-spread--white.bx-spread--flip { grid-template-columns: 2fr minmax(280px, 1fr); }
.bx-spread--white .bx-justify { color: var(--ink); }
.bx-page--narrow { justify-content: flex-start; }
.bx-page--narrow .bx-caps { margin-top: 18vh; }
.bx-align-right .bx-caps { text-align: right; }
.bx-align-right .bx-justify { margin-left: auto; }
.bx-push { margin-top: auto; }
.bx-page--wide { padding-left: 0; }
.bx-spread--flip .bx-page--wide { padding-left: var(--gutter); padding-right: 0; }
/* The figure itself stays unclipped so IntersectionObserver can see it; the image does the wipe. */
.bx-photo { position: relative; margin: 0; flex: 1; min-height: 60vh; overflow: hidden; }
.bx-photo img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; background: var(--ink);
  filter: grayscale(1) contrast(1.15); clip-path: inset(0 100% 0 0);
  transition: clip-path 0.9s cubic-bezier(0.7, 0, 0.2, 1), filter 1.2s 0.7s;
}
.bx-photo.is-in img { clip-path: inset(0 0 0 0); filter: grayscale(0) contrast(1.05); }
.bx-captions { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gutter); font-size: 14px; line-height: 1.35; text-align: justify; padding-right: var(--gutter); }
.bx-spread--flip .bx-captions { padding-right: 0; padding-left: 0; }
.bx-captions p { margin: 0; }

/* ── Sticky scroll scenes ── */
.bx-scroll { position: relative; border-top: 1px solid var(--rule); }
.bx-scroll--ledger { height: 420vh; }
.bx-scroll--mc { height: 300vh; }
.bx-sticky { position: sticky; top: 0; height: 100svh; display: flex; flex-direction: column; padding: 80px 0 44px; overflow: hidden; }

.bx-ledger-layout { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(300px, 0.9fr) 1.4fr; gap: var(--gutter); padding: 28px var(--gutter) 0; }
.bx-ledger-copy { display: flex; flex-direction: column; gap: 22px; }
.bx-counter { margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 10px; }
.bx-counter .bx-mono { background: var(--red); color: #fff; font-size: 14px; padding: 3px 8px; }
.bx-finding, .bx-rule { border: 1px solid var(--bone); padding: 14px; max-width: 440px; animation: bx-cut 0.25s steps(2) both; }
@keyframes bx-cut { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.bx-finding__head { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid var(--rule); padding-bottom: 10px; }
.bx-finding dl { display: grid; grid-template-columns: repeat(3, 1fr); margin: 14px 0; }
.bx-finding dt { font-size: 12px; color: var(--grey); text-transform: uppercase; letter-spacing: 0.04em; }
.bx-finding dd { margin: 4px 0 0; font-family: var(--mono); font-size: clamp(24px, 2.6vw, 38px); }
.bx-finding p { margin: 0; font-size: 15px; color: rgba(242, 241, 237, 0.88); }
.bx-rule__grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; margin-top: 14px; }
.bx-rule__grid i { aspect-ratio: 1; border: 1px solid var(--rule); }
.bx-rule__grid i.is-kept { background: var(--bone); border-color: var(--bone); }
.bx-rule__grid i.is-broken { background: var(--red); border-color: var(--red); }

.bx-ledger { min-height: 0; display: flex; flex-direction: column; font-family: var(--mono); font-size: 12px; border-top: 1px solid var(--bone); }
.bx-ledger__head, .bx-ledger__row { display: grid; grid-template-columns: 1fr 0.8fr 1fr 0.9fr 0.8fr; padding: 3px 0; }
.bx-ledger__head { color: var(--grey); text-transform: uppercase; border-bottom: 1px solid var(--rule); padding: 6px 0; font-size: 11px; }
.bx-ledger__row span:last-child, .bx-ledger__head span:last-child { text-align: right; }
.bx-ledger__rows { flex: 1; min-height: 0; overflow: hidden; columns: 2; column-gap: var(--gutter); column-rule: 1px solid var(--rule); mask-image: linear-gradient(to bottom, #000 80%, transparent); }
.bx-ledger__row { break-inside: avoid; border-bottom: 1px solid rgba(242, 241, 237, 0.06); transition: color 0.2s, opacity 0.3s, background 0.2s; }
.bx-ledger--stage-0 .bx-ledger__row { color: rgba(242, 241, 237, 0.85); }
.bx-ledger--stage-1 .bx-ledger__row,
.bx-ledger--stage-2 .bx-ledger__row { opacity: 0.18; }
.bx-ledger--stage-1 .bx-ledger__row.is-pattern { opacity: 1; color: var(--bone); box-shadow: inset 0 0 0 1px var(--red); }
.bx-ledger--stage-1 .bx-ledger__row.is-pattern.is-loss { background: var(--red); color: #fff; }
.bx-ledger--stage-2 .bx-ledger__row.is-pattern { opacity: 0.5; text-decoration: line-through; text-decoration-color: var(--red); }

.bx-mc { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(300px, 0.9fr) 1.6fr; gap: var(--gutter); padding: 28px var(--gutter) 0; }
.bx-mc__copy { display: flex; flex-direction: column; gap: 22px; }
.bx-mc__chart { width: 100%; height: 100%; min-height: 0; border-top: 1px solid var(--bone); border-bottom: 1px solid var(--bone); }
.bx-mc__grid { stroke: var(--rule); stroke-width: 1; vector-effect: non-scaling-stroke; }
.bx-mc__base { stroke: var(--grey); stroke-dasharray: 4 4; vector-effect: non-scaling-stroke; }
.bx-mc__path { fill: none; stroke: rgba(242, 241, 237, 0.22); stroke-width: 1; vector-effect: non-scaling-stroke; }
.bx-mc__path.is-ruin { stroke: rgba(225, 6, 0, 0.7); }
.bx-mc__main { fill: none; stroke: var(--bone); stroke-width: 2.5; vector-effect: non-scaling-stroke; stroke-dasharray: 1; }
.bx-stats { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--rule); padding-top: 14px; margin: 0; opacity: 0; transition: opacity 0.3s steps(2); }
.bx-stats.is-visible { opacity: 1; }
.bx-stats dt { font-size: 12px; color: var(--grey); text-transform: uppercase; letter-spacing: 0.04em; padding-right: 8px; }
.bx-stats dd { margin: 6px 0 0; font-family: var(--mono); font-size: clamp(22px, 2.4vw, 36px); }

/* ── Import ── */
.bx-import { padding: 64px 0 40px; border-top: 1px solid var(--rule); }
.bx-import__list { list-style: none; margin: 40px 0 0; padding: 0; }
.bx-import__list li {
  display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; padding: 10px var(--gutter) 6px; border-top: 1px solid var(--rule);
  transform: translateX(-12%); opacity: 0; transition: transform 0.7s cubic-bezier(0.7, 0, 0.2, 1) calc(var(--i) * 80ms), opacity 0.3s calc(var(--i) * 80ms);
}
.bx-import__list li:last-child { border-bottom: 1px solid var(--rule); }
.bx-import__list li.is-in { transform: none; opacity: 1; }
.bx-import__list .bx-wide { font-size: clamp(34px, 7.4vw, 140px); }
.bx-import__arrow { font-size: 14px; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; padding-bottom: 0.6em; }
.bx-import__list li:hover .bx-wide { color: var(--red); }

/* ── Comparison ── */
.bx-compare { background: var(--paper); color: var(--ink); padding: 64px 0 80px; }
.bx-compare .bx-running--wide { color: var(--ink); }
.bx-compare .bx-headline { padding: 48px var(--gutter) 40px; }
.bx-table { width: calc(100% - 2 * var(--gutter)); margin: 0 var(--gutter); border-collapse: collapse; font-size: clamp(14px, 1.3vw, 20px); }
.bx-table th, .bx-table td { border-top: 1px solid var(--rule-dark); padding: 12px 0; text-align: left; font-weight: 400; }
.bx-table tbody tr:last-child > * { border-bottom: 1px solid var(--rule-dark); }
.bx-table thead th { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; border-top: 2px solid var(--ink); }
.bx-table td { width: 18%; font-family: var(--mono); font-size: 0.85em; }
.bx-table td.is-no { color: #b80500; font-weight: 500; }

/* ── Pricing ── */
.bx-pricing { padding: 64px 0 0; border-top: 1px solid var(--rule); }
.bx-plans { display: grid; grid-template-columns: 1fr 1fr; margin-top: 40px; border-top: 1px solid var(--rule); }
.bx-plan { display: flex; flex-direction: column; gap: 18px; padding: 28px var(--gutter) 40px; }
.bx-plan + .bx-plan { border-left: 1px solid var(--rule); }
.bx-plan header { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
.bx-plan header span { font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; width: 100%; }
.bx-plan header strong { font-size: clamp(64px, 9vw, 170px); }
.bx-plan header em { font-style: normal; font-size: 16px; color: var(--grey); }
.bx-plan p { margin: 0; font-size: 19px; }
.bx-plan ul { list-style: none; margin: 0; padding: 0; flex: 1; }
.bx-plan li { border-top: 1px solid var(--rule); padding: 11px 0; font-size: 16px; }
.bx-plan .bx-button { align-self: flex-start; }
.bx-plan--full { background: var(--bone); color: var(--ink); }
.bx-plan--full li { border-color: var(--rule-dark); }
.bx-plan--full header em { color: #555; }
.bx-plan--full .bx-button { background: var(--ink); border-color: var(--ink); color: var(--bone) !important; }
.bx-plan--full .bx-button:hover { background: var(--red); border-color: var(--red); }

/* ── Privacy ── */
.bx-privacy { padding: 64px 0 96px; border-top: 1px solid var(--rule); display: grid; gap: 32px; }
.bx-privacy .bx-headline { padding: 32px var(--gutter) 0; max-width: 20ch; }
.bx-privacy .bx-body { padding: 0 var(--gutter); }

/* ── Back cover ── */
.bx-back { min-height: 100svh; display: flex; flex-direction: column; justify-content: space-between; gap: 40px; padding: 64px var(--gutter) 18px; border-top: 1px solid var(--rule); }
.bx-back__title { font-size: clamp(48px, 10.4vw, 220px); margin: 0; }
.bx-back__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.bx-folio--back a:hover { text-decoration: underline; }

/* ── Reduced motion ── */
.bx--reduced .bx-grain { animation: none; }
.bx--reduced .bx-photo, .bx--reduced .bx-plate img { transition: none; }

/* ── Tablet / mobile ── */
@media (max-width: 900px) {
  .bx-nav__toggle { display: flex; }
  .bx-nav__links {
    display: none; position: absolute; top: 60px; left: 0; right: 0; flex-direction: column; gap: 0;
    background: var(--ink); border-bottom: 1px solid var(--rule); font-size: 20px;
  }
  .bx-nav__links.is-open { display: flex; }
  .bx-nav__links a { padding: 16px var(--gutter); border-bottom: 1px solid var(--rule); }
  .bx-nav__actions { margin-left: auto; }

  .bx-hero { padding-top: 80px; }
  .bx-hero__eyebrow span:last-child { display: none; }
  .bx-hero__title .bx-wide { font-size: 13.6vw; white-space: normal; line-height: 0.88; }
  .bx-hero__grid { grid-template-columns: 1fr; }
  .bx-hero__shot { order: -1; }


  .bx-spread, .bx-spread--white, .bx-spread--white.bx-spread--flip { grid-template-columns: 1fr; }
  .bx-spread--black .bx-page + .bx-page { border-left: 0; border-top: 1px solid var(--rule); }
  .bx-spread--flip .bx-page--wide { order: 2; }
  .bx-page { padding-top: 48px; }
  .bx-page--wide, .bx-spread--flip .bx-page--wide { padding: 0 var(--gutter) 22px; }
  .bx-page--narrow .bx-caps { margin-top: 4vh; }
  .bx-push { margin-top: 0; }
  .bx-photo { min-height: 46vw; }
  .bx-plate { min-height: 56vw; }
  .bx-captions { grid-template-columns: 1fr; padding: 0; }
  .bx-toc__text { max-height: none; margin-top: 4px; }

  .bx-ledger-layout, .bx-mc { grid-template-columns: 1fr; grid-template-rows: auto 1fr; gap: 18px; padding-top: 16px; }
  .bx-ledger-copy, .bx-mc__copy { gap: 12px; }
  .bx-ledger-copy .bx-body, .bx-mc__copy .bx-body { font-size: 13px; }
  .bx-headline { font-size: clamp(28px, 8vw, 44px); }
  .bx-ledger__rows { columns: 1; }
  .bx-finding dl, .bx-stats { gap: 6px; }
  .bx-running--wide { grid-template-columns: 1fr auto; }
  .bx-running--wide span:nth-child(2) { display: none; }

  .bx-plans { grid-template-columns: 1fr; }
  .bx-plan + .bx-plan { border-left: 0; }
  .bx-table td { width: 24%; }
  .bx-import__arrow { display: none; }
}
@media (max-width: 900px) and (max-height: 760px) {
  .bx-ledger-copy .bx-body, .bx-mc__copy .bx-body { display: none; }
}
</style>
