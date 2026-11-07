<template>
  <div class="d">
    <!-- BAR -->
    <header class="bar">
      <router-link to="/" class="bar__brand" aria-label="JÖRMUNGANDR home">
        <img src="/assets/herb.svg" alt="" width="18" height="16" />
        <span>JÖRMUNGANDR</span>
      </router-link>
      <nav class="bar__nav" aria-label="Main">
        <a href="#karl-nikolai">What it does</a>
        <router-link to="/pricing">Pricing</router-link>
        <router-link to="/download">Download</router-link>
      </nav>
    </header>

    <!-- HERO: the wordmark is the picture -->
    <section class="hero">
      <div class="hero__stage">
        <canvas ref="equityCanvas" class="hero__canvas" aria-hidden="true"></canvas>
        <p class="hero__word" aria-hidden="true">JORU</p>
      </div>
      <div class="spec">
        <div class="spec__cell spec__cell--lead">
          <h1><span class="ul">Trading journal</span> that finds the habits costing you money.</h1>
        </div>
        <div class="spec__cell spec__cell--dl">
          <span class="mono">Download free</span>
          <a v-for="item in downloads" :key="item.id" :href="item.url" class="btn">{{ item.name }} <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>

    <!-- THE CHART: left half is the bare price chart, right half the same trade with everything the journal adds -->
    <section class="chart" aria-labelledby="chart-title">
      <div class="label"><h2 id="chart-title" class="mono">Never forget why you opened and closed</h2><span class="mono">Drag the slider</span></div>
      <div ref="cmp" class="cmp" :style="{ '--x': `${split}%` }">
        <div class="cmp__layer"><UiFrame src="/ui/6.html" title="Price chart, candles only" :design="[1440, 560]" ink :patch="cleanPatch" css="main{inset:2% 3% 24px!important}.condition-layer{visibility:hidden}.condition-label{color:rgba(255,255,255,.85)!important}" /></div>
        <div class="cmp__layer cmp__layer--top" aria-hidden="true"><UiFrame src="/ui/6.html" title="" :design="[1440, 560]" ink css="main{inset:2% 3% 24px!important}.condition-label{color:rgba(255,255,255,.85)!important}" /></div>
        <div
          class="cmp__handle" role="slider" tabindex="0" aria-label="Compare the bare chart with the annotated trade"
          aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(split)"
          @pointerdown="dragStart" @pointermove="dragMove" @pointerup="dragEnd" @pointercancel="dragEnd" @keydown="slideKey"
        ><span class="cmp__grip" aria-hidden="true">◀ ▶</span></div>
      </div>
      <p class="chart__text">Reopen any trade on its price chart. The journal draws what you planned and what happened: entry, stop loss, take profit, exit, and the exact conditions of your strategy on the candles that triggered them. Demo data.</p>
    </section>

    <!-- FACTS -->
    <section class="facts" aria-label="Key facts">
      <div><strong>$0</strong><span>Free journal, no time limit.</span></div>
      <div><strong>2</strong><span>Windows and macOS.</span></div>
      <div><strong>5</strong><span>Broker imports: MetaTrader 5, Bybit, Binance, Kraken, Interactive Brokers.</span></div>
      <div><strong>100%</strong><span>Your trades and exchange API keys stay on your computer.</span></div>
    </section>

    <!-- KARL-NIKOLAI I: scroll-driven investigation (problem → pattern → rule) -->
    <section id="karl-nikolai" ref="ledgerEl" class="kn-scroll kn-scroll--ledger" aria-labelledby="ledger-title">
      <div class="kn-sticky">
        <div class="kn-running kn-running--wide">
          <span>Karl-Nikolai I — Investigation</span>
          <span>Pattern detection</span>
          <span class="kn-muted">Illustrative data</span>
        </div>
        <div class="kn-ledger-layout">
          <div class="kn-ledger-copy">
            <p class="kn-counter"><span class="kn-mono">{{ ['512', '01', '01'][ledgerStage] }}</span> {{ ['trades in your journal', 'costly condition found', 'rule accepted'][ledgerStage] }}</p>
            <h2 id="ledger-title" class="kn-headline">
              <template v-if="ledgerStage === 0">Somewhere in here is a habit costing you money.</template>
              <template v-else-if="ledgerStage === 1">Shorts opened before 10:00.</template>
              <template v-else>Commit to a rule. JORU checks that it holds.</template>
            </h2>
            <p class="kn-body">
              <template v-if="ledgerStage === 0">You remember the big losses. The expensive ones are quiet: a time of day, a side, a setup you take after a losing trade. Nobody finds them by scrolling a spreadsheet.</template>
              <template v-else-if="ledgerStage === 1">Karl-Nikolai I tests every condition and every pair of conditions in your history, then ranks the ones that reduce your result by impact and confidence.</template>
              <template v-else>Accept the finding as a rule and Karl-Nikolai I follows your next trades. If the pattern comes back, it is flagged again.</template>
            </p>

            <div v-if="ledgerStage === 1" class="kn-finding">
              <div class="kn-finding__head"><span>Finding 01 / 03</span><span>Confidence — high</span></div>
              <dl>
                <div><dt>Win rate inside</dt><dd class="is-red">31%</dd></div>
                <div><dt>Win rate outside</dt><dd>54%</dd></div>
                <div><dt>In worst 10 trades</dt><dd class="is-red">6</dd></div>
              </dl>
              <p>Effect on the total — without this pattern the result would be 18% higher.</p>
            </div>

            <div v-if="ledgerStage === 2" class="kn-rule">
              <div class="kn-finding__head"><span>Rule — no shorts before 10:00</span><span>{{ ruleKept }} / 30 kept</span></div>
              <div class="kn-rule__grid">
                <i v-for="n in 30" :key="n" :class="ruleCellClass(n)"></i>
              </div>
            </div>
          </div>

          <div class="kn-ledger" :class="`kn-ledger--stage-${ledgerStage}`" aria-hidden="true">
            <div class="kn-ledger__head"><span>Date</span><span>Time</span><span>Asset</span><span>Side</span><span>R</span></div>
            <div class="kn-ledger__rows">
              <div v-for="row in ledgerRows.slice(0, 90)" :key="row.id" class="kn-ledger__row" :class="{ 'is-pattern': row.pattern, 'is-loss': row.r < 0 }">
                <span>{{ row.date }}</span><span>{{ row.time }}</span><span>{{ row.asset }}</span><span>{{ row.side }}</span><span>{{ row.r > 0 ? '+' : '' }}{{ row.r.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="kn-progress"><i :style="{ transform: `scaleX(${ledgerProgress})` }"></i></div>
      </div>
    </section>

    <!-- WHAT IT DOES: plain sections, one after another -->
    <section v-for="(row, i) in rows" :id="row.id" :key="row.id" class="sec" :class="{ 'sec--flip': i % 2 && !row.wide, 'sec--wide': row.wide, 'sec--dark': row.dark, 'sec--flow': row.grid || row.flow, 'sec--tight': row.tight }" :aria-labelledby="`t-${row.id}`">
      <div class="sec__head">
        <span class="mono sec__n">{{ pad(i + 1) }}</span>
        <h2 :id="`t-${row.id}`" class="sec__title">{{ row.title }}</h2>
        <span class="mono sec__tag">{{ row.tag }}</span>
      </div>
      <div class="sec__body">
        <div v-if="row.text" class="sec__text">
          <p v-for="line in row.text" :key="line">{{ line }}</p>
          <dl v-if="row.stats" class="stats">
            <div v-for="stat in row.stats" :key="stat[0]"><dt>{{ stat[0] }}</dt><dd>{{ stat[1] }}</dd></div>
          </dl>
          <p v-if="row.plan" class="mono sec__plan">{{ row.plan }}</p>
        </div>
        <h3 v-if="row.intro" class="sec__intro">{{ row.intro }}</h3>
        <figure class="sec__visual">
          <UiFrame v-if="row.src" :src="row.src" :title="row.title" :design="row.design" :css="row.css || ''" :ink="row.ink !== false" :bare="!!row.bare" :auto="!!row.auto" :build="row.build || null" :patch="row.patch || []" />
          <div v-else-if="row.grid" class="metrics">
            <div v-for="m in metricList" :key="m[0]" class="metric">
              <span class="mono">{{ m[0] }}</span>
              <strong :class="`t-${m[3]}`">{{ m[2] }}</strong>
              <small>{{ m[1] }}</small>
            </div>
          </div>
          <div v-else class="mc" role="img" aria-label="Monte Carlo: one real equity path among 300 simulated paths">
            <svg viewBox="0 0 800 420" preserveAspectRatio="none">
              <line v-for="n in 5" :key="n" x1="0" x2="800" :y1="n * 84 - 42" :y2="n * 84 - 42" class="mc__grid" vector-effect="non-scaling-stroke" />
              <line x1="0" x2="800" :y1="mc.baseline" :y2="mc.baseline" class="mc__base" vector-effect="non-scaling-stroke" />
              <polyline v-for="(path, k) in mc.paths" :key="k" :points="path.points" class="mc__path" :class="{ 'is-ruin': path.below }" vector-effect="non-scaling-stroke" />
              <polyline :points="mc.main" class="mc__main" vector-effect="non-scaling-stroke" />
            </svg>
            <dl v-if="!row.chartOnly" class="stats stats--row">
              <div><dt>Worst drawdown in 95% of paths</dt><dd>−{{ mc.stats.dd95 }}%</dd></div>
              <div><dt>Paths ending below the start</dt><dd>{{ mc.stats.below }}%</dd></div>
              <div><dt>Median result</dt><dd>+{{ mc.stats.median }}%</dd></div>
            </dl>
          </div>
          <figcaption v-if="row.cap" class="mono">{{ row.cap }}</figcaption>
        </figure>
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

    <!-- PRICING -->
    <section id="pricing" class="pricing" aria-labelledby="pricing-title">
      <div class="label"><h2 id="pricing-title" class="mono">Pricing</h2><span class="mono">Two plans</span></div>
      <div class="plans">
        <article class="plan">
          <header><span class="mono">Free</span><strong>$0</strong></header>
          <p>Build the review habit.</p>
          <ul><li v-for="item in plans.free" :key="item">{{ item }}</li></ul>
          <router-link to="/download" class="btn btn--line">Download free</router-link>
        </article>
        <article class="plan plan--full">
          <header><span class="mono">Full</span><strong>$9.99<small>/ month</small></strong></header>
          <p>Find, fix and prove. Less than the cost of one bad trade.</p>
          <ul><li v-for="item in plans.full" :key="item">{{ item }}</li></ul>
          <router-link to="/pricing" class="btn">Subscribe</router-link>
        </article>
      </div>
    </section>

    <!-- PRIVACY -->
    <section class="privacy" aria-labelledby="privacy-title">
      <div class="label mono"><span>Data</span><span>Privacy</span></div>
      <div class="privacy__body">
        <h2 id="privacy-title" class="privacy__title">Your journal and exchange API keys never leave your computer.</h2>
        <p>Google Sign-In is used only for your account: profile, license, forum and events. Your data is never sold or shared with advertisers. <router-link to="/privacy">Privacy Policy ↗</router-link></p>
      </div>
    </section>

    <!-- BACK COVER -->
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { downloads, refreshDownloads } from '../../shared/downloads.js'
import UiFrame from './UiFrame.vue'

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;800&family=JetBrains+Mono:wght@400;500&display=swap'
const year = new Date().getFullYear()
const pad = n => String(n).padStart(2, '0')

const rows = [
  {
    id: 'patterns', title: 'Patterns', tag: 'Best trades', plan: 'Full plan',
    text: ['The patterns in your trades that rank among the best: the conditions that keep showing up in your most profitable trades, ordered by rating.'],
    src: '/ui/7.html', design: [900, 560], css: 'main{width:100%!important;padding:24px 36px 0!important}', cap: 'Fig. 3 — Top patterns of profitable trades. Demo data.',
  },
  {
    id: 'strategy', title: 'Strategy', tag: 'Genesis Matrix', plan: 'Free plan',
    text: ['Write your strategy down as it really works: scenarios, entry and exit conditions. Every condition is a node with its frequency and profit factor, so you see which ones carry the result.', 'Every change is saved as a new version. Compare versions by win rate, profit factor, average result and execution quality.'],
    wide: true, dark: true, ink: false, bare: true, src: '/ui/5.html', design: [1400, 900],
    // Only the Bullish pullback scenario and its four conditions, shown up to three times larger than the page would fit them.
    patch: [
      ['var exit = addHub(trade.exit, lm.exitHubX, lm.exitHubY, lm)', 'var exit = { centerX: 0, centerY: 0 }'],
      [',\n      { x: lm.exitHubX, y: lm.exitHubY, w: lm.hubWidth, h: lm.hubHeight }', ''],
      [", ['exit', trade.exit, exit, EXIT_SLOTS]", ''],
      ['addLine(entry.centerX, entry.centerY, exit.centerX, exit.centerY, true)', ''],
      ['(window.innerHeight - 100) / (bottom - top), 1)', '(window.innerHeight - 100) / (bottom - top), 3)'],
    ], css: '.viewport{background:transparent!important}.links path{stroke:#000!important;stroke-opacity:.4!important}', cap: 'Fig. 4 — Node mapping: how often each condition occurs and its profit factor. Demo data.',
  },
  {
    id: 'risk', title: 'Risk', tag: 'Monte Carlo', wide: true,
    intro: 'Monte Carlo simulation',
    cap: 'Fig. 5 — The black line is one real history; the grey lines are 300 reshuffled alternatives. Illustrative simulation.',
  },
  {
    id: 'metrics', title: 'Metrics', tag: '31 metrics',
    text: ['Thirty-one metrics in five groups: matrix adherence, behaviour, execution and risk, strategy against execution, and in-trade analysis. Filter by group and read the one that matters.'],
    wide: true, grid: true, cap: 'Fig. 6 — Metrics of one trade. Demo data.',
  },
  {
    id: 'report', title: 'Report', tag: 'Trading report', plan: 'Free plan',
    text: ['Profit and loss, distribution, risk and execution, drawdowns, results by session and asset — one report instead of five spreadsheets. Every scenario and condition, broken down the way you\'d actually read it.'],
    wide: true, flow: true, tight: true, auto: true, bare: true, src: '/ui/9.html', design: [1500, 900], build: buildReportGrid,
    // Every section of the report is rendered, then only its charts and diagrams are pulled out into one grid.
    patch: [
      ['r=De(null),p=De(null),m=De(!1)', "r=De('profits-losses'),p=De(null),m=De(!1)"],
      ...['profits-losses', 'trade-distribution', 'risk-execution', 'drawdowns', 'robustness'].map(id => [`r.value==="${id}"?`, '!0?']),
      ['r.value==="scenarios-conditions"&&E("scenarios-conditions")', 'E("scenarios-conditions")'],
    ],
    css: '#app{position:static!important;inset:auto!important}#app>div,#app>div>div{height:auto!important;min-height:0!important;overflow:visible!important;max-width:none!important;padding:0!important}.genesis-report-surface{height:auto!important;margin:0!important;background:transparent!important}.genesis-report-surface>aside{display:none!important}.report-scroll-area{overflow:visible!important;height:auto!important;padding:0!important}.chart-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:30px 24px}.chart-cell{margin:0;min-width:0;align-self:start}.chart-cell>[class*=bg-white]{margin-top:0!important;background:transparent!important;padding:0!important}.chart-cell>[class*=bg-white]>:not(svg){display:none!important}.chart-cell svg{width:100%!important;height:auto!important;display:block}.chart-cap{font:500 11px/1.25 ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#fff;margin-bottom:8px}',
  },
]

/* The metrics of one trade, taken from the app's metric catalog (label, description, value, tone). */
const metricList = [["Net Profit", "Realized trade PnL", "+$240.00", "g"], ["Risk/Reward Ratio", "Setup R/R ratio", "2.40 R", "g"], ["Required Adherence", "Fulfilled Required Rules", "100%", "g"], ["Additional PnL", "Additional Conditions effect", "+$42.00", "g"], ["Conditional PnL Ratio", "Profit ratio per setup condition", "1.32", "g"], ["Cognitive Stability", "Neural Telemetry", "86%", "g"], ["Dominant Bias", "Primary Friction Marker", "DISCIPLINE", "w"], ["Emotional PnL Drag", "Psychological friction drag", "-$8.00", "w"], ["Friction Density", "Friction Markers Ratio", "0.12", "w"], ["Net Result Variance", "vs Strategy Average PnL", "+$18.00", "g"], ["Yield Efficiency", "Balance Before Trade", "2.40%", "g"], ["Profit Velocity", "PnL per holding hour", "$60.00/h", "g"], ["Planned vs Realized Risk", "Risk Audit", "0.96", "g"], ["Temporal Exposure", "Holding Duration", "4.00h", "n"], ["Stop Loss Distance", "Entry to Stop Loss in %", "0.50%", "n"], ["Take Profit Distance", "Entry to TP distance in %", "1.50%", "n"], ["SL Execution Drag", "Loss-trade slippage only", "0.08 R", "n"], ["Risk Budget Adherence", "Max Risk vs Budget", "96%", "g"], ["TP Capture Ratio", "Target Reward Captured", "80%", "w"], ["Planned RR / Baseline RR", "Planned Trade RR vs Baseline RR", "0.84", "b"], ["Unrealized Alpha Left", "Maximum profit − captured profit in $", "20%", "g"], ["Confirmed Loss Time", "Time in drawdown zone", "18m", "b"], ["Confirmed Profit Time", "Time in profit zone", "3h 42m", "g"], ["Max Meaningful Drawdown", "Peak adverse move (MAE)", "-0.28%", "b"], ["Max Favorable Excursion", "Peak favorable move (MFE)", "1.48%", "g"], ["Profit Capture Ratio", "Share of MFE captured", "81%", "g"], ["Price Path Shape", "Movement sequence relative to entry", "FAVORABLE FIRST", "g"], ["Initial Movement", "First classified candle", "PROFIT", "g"], ["Entry Heat", "Adverse Delay", "0.12%", "w"], ["Adverse Before Profit", "Drawdown before Profit", "YES", "b"], ["News During Trade", "Macro News Backdrop", "NO", "n"]]

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

/* Chart compare. The same page is rendered twice: bare candles underneath, the full trade on top, clipped at the slider. */
const cleanPatch = [
  ['orders.forEach(order => {', ';[].forEach(order => {'],
  ["{ index: entryIndex, below: true, color: '#ffffff' },", ''],
  ["{ index: exitIndex, below: false, color: '#fbbf24' }", ''],
  ['function drawConditions(g, yForPrice, barWidth) {\n    ctx.save()', 'function drawConditions(g, yForPrice, barWidth) {\n    return\n    ctx.save()'],
]
/* Report: pull every chart panel (with the small label that sits above it) out of the report page into one grid. */
function buildReportGrid({ shadow }) {
  const area = shadow.querySelector('.report-scroll-area')
  if (!area) return false
  if (area.querySelector('.chart-grid')) return true
  const marker = '[class*="bg-white/[0.025]"]'
  const isLabel = node => { const cls = String(node.className); return cls.includes('font-serif') && cls.includes('uppercase') && cls.includes('tracking') }
  const labelOf = (panel) => {
    for (let node = panel; node && node !== area; node = node.parentElement) {
      for (let prev = node.previousElementSibling; prev; prev = prev.previousElementSibling) {
        const label = isLabel(prev) ? prev : prev.querySelector('[class*="uppercase"][class*="tracking"]')
        if (label && isLabel(label)) return label.textContent.trim()
      }
    }
    return ''
  }
  // A chart is a panel holding a full-width svg, plus the heatmap (tiles, no svg).
  const charts = [...area.querySelectorAll(marker)]
    .filter(panel => !panel.querySelector(marker))
    .map(panel => ({ panel, label: labelOf(panel) }))
    .filter(({ panel, label }) => panel.querySelector('svg[class*="w-full"]') || /heatmap/i.test(label))
  if (charts.length < 5) return false
  // Only one of them is shown on the page.
  const keep = ['results by weekday']
  const picked = keep.map(name => charts.find(chart => chart.label.toLowerCase().includes(name))).filter(Boolean)
  const grid = document.createElement('div')
  grid.className = 'chart-grid'
  for (const { panel, label } of picked) {
    const cell = document.createElement('figure')
    cell.className = 'chart-cell'
    // Crop the chart to what it actually draws so it runs edge to edge and gets taller; the legend below is dropped.
    const svg = panel.querySelector('svg[class*="w-full"]')
    if (svg) {
      const box = svg.getBBox()
      svg.setAttribute('viewBox', `${box.x - 4} ${box.y - 4} ${box.width + 8} ${box.height + 8}`)
      svg.removeAttribute('height')
    }
    // The lines draw themselves in once the chart scrolls into view.
    if (svg && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const lines = [...svg.querySelectorAll('path')].filter(path => path.getAttribute('fill') === 'none' || getComputedStyle(path).fill === 'none')
      lines.forEach((line, index) => {
        line.setAttribute('pathLength', '1')
        line.style.strokeDasharray = '1'
        line.style.strokeDashoffset = '1'
        line.style.transition = `stroke-dashoffset 1.8s cubic-bezier(0.6, 0, 0.2, 1) ${index * 0.14}s`
      })
      // The line ends and the Mon/Tue/... labels sit after the lines in the svg: keep them hidden until the lines have been drawn.
      const children = [...svg.children]
      const ends = children.slice(children.indexOf(lines[lines.length - 1]) + 1)
      ends.forEach((end) => { end.style.opacity = '0'; end.style.transition = `opacity 0.5s ease ${1.8 + lines.length * 0.14}s` })
      const watcher = new IntersectionObserver((entries) => {
        if (!entries.some(entry => entry.isIntersecting)) return
        lines.forEach((line) => { line.style.strokeDashoffset = '0' })
        ends.forEach((end) => { end.style.opacity = '1' })
        watcher.disconnect()
      }, { threshold: 0.35 })
      watcher.observe(cell)
    }
    cell.append(panel)
    grid.append(cell)
  }
  for (const child of [...area.children]) child.style.display = 'none'
  area.prepend(grid)
  grid.style.display = 'grid'
  return true
}

const cmp = ref(null)
const split = ref(25)
let dragging = false
const setFrom = (event) => {
  const rect = cmp.value.getBoundingClientRect()
  split.value = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100))
}
const dragStart = (event) => { dragging = true; event.currentTarget.setPointerCapture(event.pointerId); setFrom(event) }
const dragMove = (event) => { if (dragging) setFrom(event) }
const dragEnd = () => { dragging = false }
const slideKey = (event) => {
  const step = event.shiftKey ? 10 : 2
  if (event.key === 'ArrowLeft') split.value = Math.max(0, split.value - step)
  else if (event.key === 'ArrowRight') split.value = Math.min(100, split.value + step)
  else return
  event.preventDefault()
}

/* Illustrative Monte Carlo: reshuffle one fixed sequence of trades. Deterministic. */
function makeMonteCarlo() {
  let s = 42
  const rand = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const steps = 90
  const returns = Array.from({ length: steps }, () => (rand() < 0.5 ? 0.4 + rand() * 2.0 : -(0.5 + rand() * 1.4)))
  const walk = list => list.reduce((acc, v) => { acc.push(acc[acc.length - 1] + v); return acc }, [0])
  const main = walk(returns)
  const paths = Array.from({ length: 300 }, () => walk(Array.from({ length: steps }, () => returns[Math.floor(rand() * steps)])))
  const all = [main, ...paths].flat()
  const min = Math.min(...all)
  const max = Math.max(...all)
  const y = v => 400 - ((v - min) / (max - min)) * 380
  const pts = path => path.map((v, i) => `${((i / steps) * 800).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const drawdown = (path) => { let peak = 100, worst = 0; for (const v of path) { peak = Math.max(peak, 100 + v); worst = Math.max(worst, (peak - 100 - v) / peak) } return worst * 100 }
  const dds = paths.map(drawdown).sort((a, b) => a - b)
  const ends = paths.map(p => p[p.length - 1]).sort((a, b) => a - b)
  return {
    main: pts(main),
    baseline: y(0),
    paths: paths.filter((_, i) => i % 5 === 0).map(p => ({ points: pts(p), below: p[p.length - 1] < 0 })),
    stats: { dd95: dds[Math.floor(dds.length * 0.95)].toFixed(1), below: Math.round((ends.filter(v => v < 0).length / ends.length) * 100), median: ends[Math.floor(ends.length / 2)].toFixed(0) },
  }
}
const mc = makeMonteCarlo()

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

const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const ledgerEl = ref(null)
const ledgerProgress = ref(reducedMotion ? 0.5 : 0)
const clamp = (value) => Math.min(1, Math.max(0, value))
const ledgerStage = computed(() => (ledgerProgress.value < 0.3 ? 0 : ledgerProgress.value < 0.66 ? 1 : 2))
const ruleFill = computed(() => Math.round(clamp((ledgerProgress.value - 0.66) / 0.3) * 30))
const ruleKept = computed(() => ruleFill.value - (ruleFill.value >= 19 ? 1 : 0) - (ruleFill.value >= 8 ? 1 : 0))
const ruleCellClass = (n) => {
  if (n > ruleFill.value) return ''
  return n === 8 || n === 19 ? 'is-broken' : 'is-kept'
}

// Scroll-driven, like /dev: the section is pinned and the scroll position plays the animation.
const sectionProgress = (el) => {
  if (!el) return 0
  const rect = el.getBoundingClientRect()
  const travel = rect.height - window.innerHeight + 46
  return travel > 0 ? clamp(-(rect.top - 46) / travel) : 0
}
let frame = 0
const onScroll = () => {
  if (frame || reducedMotion) return
  frame = requestAnimationFrame(() => { frame = 0; ledgerProgress.value = sectionProgress(ledgerEl.value) })
}

const equityCanvas = ref(null)
let cleanupEquity = null

function initEquityCurve() {
  const canvas = equityCanvas.value
  if (!canvas) return null
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const START = 10000
  const POINTS = 140
  const DURATION = 4500
  const COLOR = '#000000'

  let series = []
  let startTime = 0
  let frame = null

  function makeSeries() {
    const target = 38000 + Math.random() * 26000
    const out = []

    // 3 distinct realistic drawdown & recovery cycles
    const d1Start = 0.13 + (Math.random() - 0.5) * 0.03
    const d1End = 0.28 + (Math.random() - 0.5) * 0.03
    const d1Depth = 0.19 + Math.random() * 0.07

    const d2Start = 0.43 + (Math.random() - 0.5) * 0.04
    const d2End = 0.64 + (Math.random() - 0.5) * 0.04
    const d2Depth = 0.23 + Math.random() * 0.08

    const d3Start = 0.75 + (Math.random() - 0.5) * 0.03
    const d3End = 0.88 + (Math.random() - 0.5) * 0.03
    const d3Depth = 0.15 + Math.random() * 0.06

    let prevNoise = 0

    for (let i = 0; i < POINTS; i++) {
      const t = i / (POINTS - 1)
      let macro = START * Math.pow(target / START, Math.pow(t, 1.26))

      // First pullback after initial run-up
      if (t >= d1Start && t <= d1End) {
        const p = (t - d1Start) / (d1End - d1Start)
        macro *= (1 - Math.sin(p * Math.PI) * d1Depth)
      }

      // Second protracted drawdown with a choppy double-dip consolidation before breakout
      if (t >= d2Start && t <= d2End) {
        const p = (t - d2Start) / (d2End - d2Start)
        const doubleDip = Math.sin(p * Math.PI) * (1 + 0.28 * Math.sin(p * Math.PI * 3))
        macro *= (1 - Math.max(0, doubleDip) * d2Depth)
      }

      // Third late drawdown test before the final high-water push
      if (t >= d3Start && t <= d3End) {
        const p = (t - d3Start) / (d3End - d3Start)
        macro *= (1 - Math.sin(p * Math.PI) * d3Depth)
      }

      // Realistic trade-level sawtooth noise with clustering
      const trade = (Math.random() - 0.48) * 0.045
      prevNoise = prevNoise * 0.6 + trade
      if (i === 0 || i === POINTS - 1) prevNoise = 0

      out.push(Math.max(START * 0.8, macro * (1 + prevNoise)))
    }

    out[0] = START
    return out
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.clientWidth * dpr
    canvas.height = canvas.clientHeight * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function draw(progress) {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    ctx.clearRect(0, 0, w, h)
    const padX = w * 0.06
    const top = h * 0.24
    const bottom = h * 0.88
    const logMin = Math.log(Math.min(...series))
    const logMax = Math.log(Math.max(...series))
    const pt = i => ({
      x: padX + (i / (series.length - 1)) * (w - padX * 2),
      y: bottom - (Math.log(series[i]) - logMin) / (logMax - logMin || 1) * (bottom - top),
    })
    const pos = (series.length - 1) * progress
    const idx = Math.floor(pos)
    const frac = pos - idx
    const next = Math.min(series.length - 1, idx + 1)
    const a = pt(idx)
    const b = pt(next)
    const edge = { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac }

    ctx.lineWidth = 3
    ctx.strokeStyle = COLOR
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.shadowBlur = 12
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
    ctx.beginPath()
    const p0 = pt(0)
    ctx.moveTo(p0.x, p0.y)
    for (let i = 1; i <= idx; i++) {
      const p = pt(i)
      ctx.lineTo(p.x, p.y)
    }
    ctx.lineTo(edge.x, edge.y)
    ctx.stroke()

    ctx.fillStyle = COLOR
    ctx.shadowBlur = 18
    ctx.beginPath()
    ctx.arc(edge.x, edge.y, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  function step() {
    const progress = Math.min(1, (performance.now() - startTime) / DURATION)
    draw(1 - Math.pow(1 - progress, 2))
    frame = progress < 1 ? requestAnimationFrame(step) : null
  }

  function play() {
    if (frame) cancelAnimationFrame(frame)
    series = makeSeries()
    startTime = performance.now()
    frame = requestAnimationFrame(step)
  }

  const onResize = () => {
    resize()
    if (!frame) draw(1)
  }

  window.addEventListener('resize', onResize)
  resize()
  play()

  return () => {
    if (frame) cancelAnimationFrame(frame)
    window.removeEventListener('resize', onResize)
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
  cleanupEquity = initEquityCurve()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  onScroll()
})
onBeforeUnmount(() => {
  cleanupEquity?.()
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
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
  overflow-x: clip;
}
.d *, .d *::before, .d *::after { box-sizing: border-box; }
.d a { color: inherit; text-decoration: none; }
.d :focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
.mono { font-family: var(--mono); font-size: 12px; font-weight: 400; letter-spacing: 0.04em; text-transform: uppercase; line-height: 1.2; margin: 0; }

/* buttons: square, in the colours of the surface they sit on */
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

/* ── Hero ──────────────────────────────────────────── */
.hero { border-bottom: 2px solid #000; }
.hero__stage { position: relative; overflow: hidden; }
.hero__canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; pointer-events: none; }
.hero__word { position: relative; z-index: 1; margin: 0; padding: 0 var(--edge); font-weight: 800; font-size: clamp(110px, 39vw, 800px); line-height: 0.74; letter-spacing: -0.06em; margin-left: -0.02em; padding-top: 0.06em; padding-bottom: 0.04em; user-select: none; }
.spec { display: grid; grid-template-columns: 2.4fr 1fr; border-top: 2px solid #000; }
.spec__cell { padding: var(--edge); border-right: 2px solid #000; display: flex; flex-direction: column; gap: 10px; }
.spec__cell:last-child { border-right: 0; }
.spec__cell h1 .ul { text-decoration: underline; text-decoration-thickness: 0.07em; text-underline-offset: 0.1em; }
.spec__cell h1 { margin: 0; font-weight: 800; letter-spacing: -0.035em; line-height: 0.98; font-size: clamp(34px, 5vw, 88px); }
.spec__cell p { margin: 0; font-size: clamp(14px, 1.15vw, 18px); line-height: 1.2; letter-spacing: -0.01em; }
.spec__cell--dl .btn { width: 100%; }

/* ── Chart compare ─────────────────────────────────── */
.chart { border-bottom: 2px solid #000; }
.cmp { position: relative; user-select: none; touch-action: pan-y; }
.cmp__layer { display: block; pointer-events: none; }
.cmp__layer--top { position: absolute; inset: 0; clip-path: inset(0 0 0 var(--x)); }
.cmp__handle { position: absolute; top: 0; bottom: 0; left: var(--x); width: 44px; margin-left: -22px; cursor: ew-resize; display: flex; align-items: center; justify-content: center; touch-action: none; }
.cmp__handle::before { content: ''; position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; margin-left: -1px; background: #000; }
.cmp__grip { position: relative; background: #000; color: #fff; font-size: 12px; letter-spacing: 2px; padding: 12px 10px; white-space: nowrap; }
.cmp__handle:focus-visible { outline: none; }
.cmp__handle:focus-visible .cmp__grip { outline: 3px solid #000; outline-offset: 3px; }
.chart__text { margin: 0; padding: var(--edge); border-top: 2px solid #000; max-width: 70ch; font-size: clamp(15px, 1.25vw, 20px); line-height: 1.2; letter-spacing: -0.015em; }

/* ── Facts ─────────────────────────────────────────── */
.facts { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 2px solid #000; }
.facts > div { padding: var(--edge); border-right: 2px solid #000; display: flex; flex-direction: column; gap: 14px; min-height: 200px; justify-content: space-between; }
.facts > div:last-child { border-right: 0; }
.facts strong { font-weight: 800; letter-spacing: -0.06em; line-height: 0.85; font-size: clamp(56px, 7.4vw, 128px); }
.facts span { font-size: clamp(13px, 1.05vw, 16px); line-height: 1.2; max-width: 28ch; }

/* ── Labels ────────────────────────────────────────── */
.label { display: flex; justify-content: space-between; padding: 12px var(--edge) 11px; border-bottom: 2px solid #000; }

/* ── Sections ──────────────────────────────────────── */
.sec { border-bottom: 2px solid #000; }
.sec__head { display: grid; grid-template-columns: clamp(40px, 5vw, 80px) 1fr auto; align-items: baseline; padding: clamp(10px, 1.2vw, 18px) var(--edge) clamp(12px, 1.4vw, 20px); border-bottom: 2px solid #000; }
.sec__title { margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.88; font-size: clamp(44px, 9vw, 160px); }
.sec__body { display: grid; grid-template-columns: repeat(12, 1fr); column-gap: var(--gut); padding: var(--edge); align-items: start; }
.sec__text { grid-column: 1 / 5; display: flex; flex-direction: column; gap: 14px; position: sticky; top: 62px; }
.sec__visual { grid-column: 5 / 13; margin: 0; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
/* Only the title strip is black; the body of the section stays white. */
.sec--dark .sec__head { background: #000; color: #fff; }
.sec--wide.sec--flow .sec__text { position: static; width: auto; max-width: 70ch; margin: 22px 0 18px; }
.sec--wide .sec__body { position: relative; display: block; padding-top: 0; }
.sec--wide .sec__visual { width: 100%; }
.sec--tight .sec__body { padding-left: var(--edge); padding-right: var(--edge); }
.sec__intro { margin: 22px 0 18px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.9; font-size: clamp(36px, 6.4vw, 110px); }
/* The text lies over the empty top-right of the picture instead of sitting beside a framed box. */
.sec--wide .sec__text { position: absolute; top: calc(var(--edge) * 1.4); left: var(--edge); width: min(34%, 460px); z-index: 2; }
.sec--flip .sec__text { grid-column: 9 / 13; grid-row: 1; }
.sec--flip .sec__visual { grid-column: 1 / 9; grid-row: 1; }
.sec__text p { margin: 0; font-size: clamp(15px, 1.2vw, 19px); line-height: 1.2; letter-spacing: -0.015em; text-align: justify; hyphens: auto; }
.sec__plan { border: 1px solid #000; align-self: flex-start; padding: 4px 8px 3px; }
.sec__visual :deep(.frame:not(.frame--bare)) { box-shadow: 0 0 0 1px #000; }
.sec__visual figcaption { opacity: 0.7; }

/* Metrics grid across the whole section */
.metrics { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 2px solid #000; border-left: 2px solid #000; }
.metric { display: flex; flex-direction: column; gap: 10px; min-height: 170px; padding: 14px 16px 16px; border-right: 2px solid #000; border-bottom: 2px solid #000; }
.metric:last-child { grid-column: span 2; }
.metric .mono { opacity: 0.75; }
.metric strong { margin-top: auto; font-weight: 800; letter-spacing: -0.05em; line-height: 0.9; font-size: clamp(30px, 3.6vw, 62px); word-break: break-word; }
.metric small { font-size: 13px; line-height: 1.15; opacity: 0.75; }
.t-g { color: #047857; } .t-w { color: #b45309; } .t-b { color: #be123c; } .t-n { color: #000; }

.stats { margin: 6px 0 0; display: flex; flex-direction: column; gap: 14px; }
.stats > div { border-top: 2px solid #000; padding-top: 6px; }
.stats dt { font-size: 13px; }
.stats dd { margin: 4px 0 0; font-weight: 800; letter-spacing: -0.06em; line-height: 0.88; font-size: clamp(44px, 5vw, 84px); }
.stats--row { flex-direction: row; gap: var(--gut); margin-top: 18px; }
.stats--row > div { flex: 1; }

.mc svg { display: block; width: 100%; aspect-ratio: 2.3 / 1; border-top: 2px solid #000; border-bottom: 2px solid #000; }
.mc__grid { stroke: rgba(0, 0, 0, 0.12); stroke-width: 1; }
.mc__base { stroke: #000; stroke-width: 1; stroke-dasharray: 3 4; }
.mc__path { fill: none; stroke: rgba(0, 0, 0, 0.2); stroke-width: 1; }
.mc__path.is-ruin { stroke: rgba(0, 0, 0, 0.6); }
.mc__main { fill: none; stroke: #000; stroke-width: 3; }

/* ── Comparison ────────────────────────────────────── */
.compare { border-bottom: 2px solid #000; }
.compare__title { margin: 0; padding: clamp(28px, 4.5vw, 64px) var(--edge) clamp(24px, 3.5vw, 44px); font-weight: 800; letter-spacing: -0.035em; line-height: 1; font-size: clamp(28px, 4.2vw, 64px); max-width: 28ch; }
.compare__table { width: calc(100% - 2 * var(--edge)); margin: 0 var(--edge) clamp(36px, 5vw, 64px); border-collapse: collapse; font-size: clamp(14px, 1.2vw, 18px); }
.compare__table th, .compare__table td { border-top: 1px solid rgba(0, 0, 0, 0.15); padding: clamp(12px, 1.3vw, 16px) 0; text-align: left; font-weight: 500; }
.compare__table tbody tr:last-child > * { border-bottom: 1px solid rgba(0, 0, 0, 0.15); }
.compare__table thead th { font-family: var(--mono); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 14px 0; }
.compare__table td { width: 18%; font-family: var(--mono); font-size: 0.9em; }
.compare__table td.is-no { color: #be123c; font-weight: 600; }

/* ── Pricing ───────────────────────────────────────── */
.pricing { border-bottom: 2px solid #000; }
.plans { display: grid; grid-template-columns: 1fr 1fr; }
.plan { display: flex; flex-direction: column; gap: 14px; padding: var(--edge); min-height: 520px; }
.plan + .plan { border-left: 2px solid #000; }
.plan header { display: flex; justify-content: space-between; align-items: baseline; }
.plan strong { font-weight: 800; letter-spacing: -0.06em; line-height: 0.84; font-size: clamp(64px, 10vw, 170px); }
.plan small { font-size: 16px; font-weight: 500; letter-spacing: -0.01em; margin-left: 10px; }
.plan > p { margin: 0; font-size: clamp(16px, 1.4vw, 22px); font-weight: 500; letter-spacing: -0.02em; }
.plan ul { list-style: none; margin: 4px 0 18px; padding: 0; font-size: clamp(14px, 1.1vw, 17px); }
.plan li { padding: 7px 0 8px; border-top: 1px solid currentColor; }
.plan .btn { margin-top: auto; }
.plan--full { background: #000; color: #fff; }
.d .plan--full a.btn { background: #fff; color: #000; border-color: #fff; }
.d .plan--full a.btn:hover { background: #000; color: #fff; }

/* ── Privacy ───────────────────────────────────────── */
.privacy { border-bottom: 2px solid #000; }
.privacy__body { display: grid; grid-template-columns: 1fr minmax(320px, 52ch); gap: var(--gut); align-items: end; padding: clamp(28px, 5vw, 80px) var(--edge); }
.privacy__title { margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.9; font-size: clamp(34px, 6vw, 108px); max-width: 16ch; }
.privacy__body p { margin: 0; font-size: clamp(15px, 1.2vw, 19px); line-height: 1.2; letter-spacing: -0.015em; }
.privacy__body p a { text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 900px) { .privacy__body { grid-template-columns: 1fr; } }

/* ── Back cover ────────────────────────────────────── */
.end { background: #000; color: #fff; padding: var(--edge); display: flex; flex-direction: column; gap: clamp(20px, 3vw, 44px); min-height: 80vh; }
.end__title { margin: clamp(20px, 5vw, 80px) 0 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.82; font-size: clamp(54px, 13vw, 240px); margin-left: -0.02em; }
.end__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.end__foot { margin-top: auto; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding-top: 14px; border-top: 2px solid #fff; }
.end__foot a:hover { text-decoration: underline; text-underline-offset: 3px; }


/* ── Karl-Nikolai I: scroll scene (same behaviour as /dev, light palette) ── */
.kn-scroll { position: relative; height: 220vh; border-bottom: 2px solid #000; }
.kn-sticky { position: sticky; top: 46px; height: calc(100svh - 46px); display: flex; flex-direction: column; padding: 0 0 44px; overflow: hidden; background: #fff; }
.kn-running { display: grid; grid-template-columns: 1fr 1fr auto; padding: 12px var(--edge) 11px; border-bottom: 2px solid #000; font-family: var(--mono); font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
.kn-muted { opacity: 0.6; }
.kn-mono { font-family: var(--mono); }
.kn-ledger-layout { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(300px, 0.9fr) 1.4fr; gap: var(--gut); padding: 24px var(--edge) 0; }
.kn-ledger-copy { display: flex; flex-direction: column; gap: 20px; }
.kn-counter { margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 10px; }
.kn-counter .kn-mono { background: #be123c; color: #fff; font-size: 14px; padding: 3px 8px; }
.kn-headline { margin: 0; font-weight: 800; font-size: clamp(34px, 4.6vw, 80px); line-height: 0.94; letter-spacing: -0.045em; text-transform: uppercase; }
.kn-body { margin: 0; font-size: clamp(15px, 1.15vw, 18px); line-height: 1.25; letter-spacing: -0.01em; max-width: 44ch; }
.kn-finding, .kn-rule { border: 2px solid #000; padding: 14px; max-width: 440px; animation: kn-cut 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes kn-cut { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.kn-finding__head { display: flex; justify-content: space-between; gap: 12px; font-family: var(--mono); font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #000; padding-bottom: 10px; }
.kn-finding dl { display: grid; grid-template-columns: repeat(3, 1fr); margin: 14px 0; }
.kn-finding dt { font-size: 12px; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.04em; }
.kn-finding dd { margin: 4px 0 0; font-weight: 800; letter-spacing: -0.05em; font-size: clamp(28px, 3vw, 46px); }
.kn-finding p { margin: 0; font-size: 15px; }
.is-red { color: #be123c; }
.kn-rule__grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; margin-top: 14px; }
.kn-rule__grid i { transition: background 0.2s ease, border-color 0.2s ease; aspect-ratio: 1; border: 1px solid rgba(0, 0, 0, 0.25); }
.kn-rule__grid i.is-kept { background: #000; border-color: #000; }
.kn-rule__grid i.is-broken { background: #be123c; border-color: #be123c; }
.kn-ledger { min-height: 0; display: flex; flex-direction: column; font-family: var(--mono); font-size: 12px; border-top: 2px solid #000; }
.kn-ledger__head, .kn-ledger__row { display: grid; grid-template-columns: 1fr 0.8fr 1fr 0.9fr 0.8fr; padding: 3px 0; }
.kn-ledger__head { opacity: 0.65; text-transform: uppercase; border-bottom: 1px solid rgba(0, 0, 0, 0.3); padding: 6px 0; font-size: 11px; }
.kn-ledger__row span:last-child, .kn-ledger__head span:last-child { text-align: right; }
.kn-ledger__rows { flex: 1; min-height: 0; overflow: hidden; columns: 2; column-gap: var(--gut); column-rule: 1px solid rgba(0, 0, 0, 0.2); mask-image: linear-gradient(to bottom, #000 80%, transparent); }
.kn-ledger__row { break-inside: avoid; border-bottom: 1px solid rgba(0, 0, 0, 0.08); transition: color 0.35s ease, opacity 0.45s ease, background 0.35s ease, box-shadow 0.35s ease; }
.kn-ledger--stage-1 .kn-ledger__row, .kn-ledger--stage-2 .kn-ledger__row { opacity: 0.18; }
.kn-ledger--stage-1 .kn-ledger__row.is-pattern { opacity: 1; box-shadow: inset 0 0 0 1px #be123c; }
.kn-ledger--stage-1 .kn-ledger__row.is-pattern.is-loss { background: #be123c; color: #fff; }
.kn-ledger--stage-2 .kn-ledger__row.is-pattern { opacity: 0.5; text-decoration: line-through; text-decoration-color: #be123c; }
.kn-progress { position: absolute; left: var(--edge); right: var(--edge); bottom: 18px; height: 2px; background: rgba(0, 0, 0, 0.15); }
.kn-progress i { display: block; height: 100%; background: #000; transform-origin: left; }
@media (max-width: 900px) {
  .kn-running { grid-template-columns: 1fr auto; }
  .kn-running span:nth-child(2) { display: none; }
  .kn-ledger-layout { grid-template-columns: 1fr; grid-template-rows: auto 1fr; gap: 16px; padding-top: 14px; }
  .kn-ledger-copy { gap: 12px; }
  .kn-body { font-size: 13px; }
  .kn-headline { font-size: clamp(26px, 8vw, 42px); }
  .kn-ledger__rows { columns: 1; }
}
@media (max-width: 900px) and (max-height: 760px) { .kn-body { display: none; } }


/* ── Phone ─────────────────────────────────────────── */
@media (max-width: 900px) {
  .bar__nav a:not(:last-child) { display: none; }
  .spec { grid-template-columns: 1fr; }
  .spec__cell { border-right: 0; border-bottom: 2px solid #000; }
  .spec__cell:last-child { border-bottom: 0; }
  .facts { grid-template-columns: 1fr 1fr; }
  .facts > div { min-height: 150px; border-bottom: 2px solid #000; }
  .facts > div:nth-child(2n) { border-right: 0; }
  .facts > div:nth-last-child(-n+2) { border-bottom: 0; }
  .sec__head { grid-template-columns: 34px 1fr; }
  .sec__tag { display: none; }
  .sec__title { font-size: clamp(38px, 13vw, 80px); }
  .sec__body { display: flex; flex-direction: column; gap: 18px; }
  .sec__text { position: static; }
  .metrics { grid-template-columns: 1fr 1fr; }
  .metric:last-child { grid-column: auto; }
  .sec--wide .sec__body { display: flex; }
  .sec--wide .sec__text { position: static; width: auto; }
  .stats--row { flex-direction: column; }
  .plans { grid-template-columns: 1fr; }
  .plan { min-height: 0; }
  .plan + .plan { border-left: 0; border-top: 2px solid #000; }
}
</style>
