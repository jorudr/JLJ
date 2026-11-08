<template>
  <div class="d">
    <!-- BAR -->
    <BarHeader />

    <!-- HERO from /dev -->
    <section ref="coverEl" class="bx-hero" aria-labelledby="hero-title">
      <p class="bx-hero__eyebrow">
        <span>{{ isRu ? 'Для ручной и системной торговли' : 'For discretionary and systematic traders' }}</span>
      </p>
      <h1 id="hero-title" class="bx-hero__title">
        <span class="bx-wide">{{ isRu ? 'Дневник трейдера' : 'Trading journal' }}</span>
        <span class="bx-hero__sub">{{ isRu ? 'который находит привычки, отнимающие ваши деньги.' : 'that finds the habits costing you money.' }}</span>
      </h1>
      <div class="bx-hero__grid">
        <div class="bx-hero__copy">
          <p class="bx-hero__lead">
            {{ isRu ? 'Фиксируйте каждую сделку в контексте рынка. JORU анализирует историю, показывает, какие условия отнимают деньги, и следит, чтобы вы перестали их повторять.' : 'Record every trade with its context. JORU analyses your history, shows which conditions lose you money, and checks that you stop repeating them.' }}
          </p>
          <div class="bx-hero__actions">
            <router-link :to="isRu ? '/ru/download' : '/download'" class="btn">{{ isRu ? 'Скачать бесплатно ↓' : 'Download free ↓' }}</router-link>
            <a href="#chart" class="btn btn--line" @click="handleSeeHowItWorks">{{ isRu ? 'Как это работает ↓' : 'See how it works ↓' }}</a>
          </div>
          <ul class="bx-hero__facts">
            <li><strong>$0</strong> <span>{{ isRu ? 'Бесплатный дневник без ограничения по времени' : 'Free journal, no time limit' }}</span></li>
            <li><strong>100%</strong> <span>{{ isRu ? 'Сделки и API-ключи остаются только на вашем компьютере' : 'Trades and API keys stay on your computer' }}</span></li>
          </ul>
        </div>
        <figure class="bx-hero__shot" :class="{ 'is-in': isHeroRevealed }" :style="{ '--tilt': coverProgress, '--rot': `${Math.max(0, 14 - coverProgress * 50)}deg` }">
          <img src="/dev/log.png" alt="JORU trading journal: trades, P/L, win rate and the list of trades" width="1440" height="900" fetchpriority="high" />
          <figcaption>{{ isRu ? 'Рис. 0 — Журнал: сделки, P/L и винрейт с первого взгляда.' : 'Fig. 0 — The journal: trades, P/L and win rate at a glance.' }}</figcaption>
        </figure>
      </div>
    </section>

    <!-- FACTS -->
    <section class="facts" aria-label="Key facts">
      <div v-for="fact in copy.dev1.facts" :key="fact[0]"><strong>{{ fact[0] }}</strong><span>{{ fact[1] }}</span></div>
    </section>

    <!-- THE CHART: left half is the bare price chart, right half the same trade with everything the journal adds -->
    <section id="chart" class="chart" aria-labelledby="chart-title">
      <div class="chart__head">
        <h2 id="chart-title" class="chart__title">{{ copy.dev1.chart.title }}</h2>
      </div>
      <div ref="cmp" class="cmp" :class="{ 'is-hinting': isHinting }" :style="{ '--x': `${split}%` }">
        <div class="cmp__layer"><UiFrame src="/ui/6.html" title="Price chart, candles only" :design="[1440, 560]" ink :patch="cleanPatch" css="main{inset:2% 3% 24px!important}.condition-layer{visibility:hidden}.condition-label{color:rgba(255,255,255,.85)!important}" /></div>
        <div class="cmp__layer cmp__layer--top" aria-hidden="true"><UiFrame src="/ui/6.html" title="" :design="[1440, 560]" ink css="main{inset:2% 3% 24px!important}.condition-label{color:rgba(255,255,255,.85)!important}" /></div>
        <div
          class="cmp__handle" role="slider" tabindex="0" aria-label="Compare the bare chart with the annotated trade"
          aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(split)"
          @pointerdown="dragStart" @pointermove="dragMove" @pointerup="dragEnd" @pointercancel="dragEnd" @keydown="slideKey"
        ><span class="cmp__grip" aria-hidden="true">◀ ▶</span></div>
      </div>
      <p class="chart__text">{{ copy.dev1.chart.text }}</p>
    </section>

    <!-- KARL-NIKOLAI I: scroll-driven investigation (problem → pattern → rule) -->
    <section id="karl-nikolai" ref="ledgerEl" class="kn-scroll kn-scroll--ledger" aria-labelledby="ledger-title">
      <div class="kn-sticky">
        <div class="kn-running kn-running--wide">
          <span>{{ copy.dev1.kn.running[0] }}</span>
          <span>{{ copy.dev1.kn.running[1] }}</span>
          <span class="kn-muted">{{ copy.dev1.kn.running[2] }}</span>
        </div>
        <div class="kn-ledger-layout">
          <div class="kn-ledger-copy">
            <p class="kn-counter"><span class="kn-mono">{{ ['512', '01', '01'][ledgerStage] }}</span> {{ copy.dev1.kn.counters[ledgerStage] }}</p>
            <h2 id="ledger-title" class="kn-headline">{{ copy.dev1.kn.headlines[ledgerStage] }}</h2>
            <p class="kn-body">{{ copy.dev1.kn.bodies[ledgerStage] }}</p>

            <div v-if="ledgerStage === 1" class="kn-finding">
              <div class="kn-finding__head"><span>{{ copy.dev1.kn.findingHead[0] }}</span><span>{{ copy.dev1.kn.findingHead[1] }}</span></div>
              <dl>
                <div><dt>{{ copy.dev1.kn.findingStats[0] }}</dt><dd class="is-red">31%</dd></div>
                <div><dt>{{ copy.dev1.kn.findingStats[1] }}</dt><dd>54%</dd></div>
                <div><dt>{{ copy.dev1.kn.findingStats[2] }}</dt><dd class="is-red">6</dd></div>
              </dl>
              <p>{{ copy.dev1.kn.findingEffect }}</p>
            </div>

            <div v-if="ledgerStage === 2" class="kn-rule">
              <div class="kn-finding__head"><span>{{ copy.dev1.kn.ruleHead }}</span><span>{{ ruleKept }} / 30 {{ copy.dev1.kn.ruleKept }}</span></div>
              <div class="kn-rule__grid">
                <i v-for="n in 30" :key="n" :class="ruleCellClass(n)"></i>
              </div>
            </div>
          </div>

          <div class="kn-ledger" :class="`kn-ledger--stage-${ledgerStage}`" aria-hidden="true">
            <div class="kn-ledger__head"><span v-for="col in copy.dev1.kn.ledgerHead" :key="col">{{ col }}</span></div>
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
          <UiFrame v-if="row.src" :src="row.src" :title="row.title" :design="getRowDesign(row)" :css="getRowCss(row)" :ink="row.ink !== false" :bare="!!row.bare" :auto="!!row.auto" :build="row.build || null" :patch="row.patch || []" />
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
              <div><dt>{{ isRu ? 'Худшая просадка в 95% траекторий' : 'Worst drawdown in 95% of paths' }}</dt><dd>−{{ mc.stats.dd95 }}%</dd></div>
              <div><dt>{{ isRu ? 'Траектории ниже старта' : 'Paths ending below the start' }}</dt><dd>{{ mc.stats.below }}%</dd></div>
              <div><dt>{{ isRu ? 'Медианный результат' : 'Median result' }}</dt><dd>+{{ mc.stats.median }}%</dd></div>
            </dl>
          </div>
          <figcaption v-if="row.cap" class="mono">{{ row.cap }}</figcaption>
        </figure>
      </div>
    </section>

    <!-- COMPARISON -->
    <section class="compare" aria-labelledby="compare-title">
      <div class="label mono"><span>{{ copy.dev1.comparison.label[0] }}</span><span>{{ copy.dev1.comparison.label[1] }}</span></div>
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

    <!-- PRICING -->
    <section id="pricing" class="pricing" aria-labelledby="pricing-title">
      <div class="label"><h2 id="pricing-title" class="mono">{{ copy.dev1.pricing.label[0] }}</h2><span class="mono">{{ copy.dev1.pricing.label[1] }}</span></div>
      <div class="plans">
        <article class="plan">
          <header><span class="mono">{{ copy.dev1.pricing.freeTitle }}</span><strong>{{ copy.dev1.pricing.freePrice }}</strong></header>
          <p>{{ copy.dev1.pricing.freeDesc }}</p>
          <ul><li v-for="item in copy.dev1.pricing.freeFeatures" :key="item">{{ item }}</li></ul>
          <router-link :to="isRu ? '/ru/download' : '/download'" class="btn btn--line">{{ copy.dev1.pricing.freeCta }}</router-link>
        </article>
        <article class="plan plan--full">
          <header><span class="mono">{{ copy.dev1.pricing.fullTitle }}</span><strong>{{ copy.dev1.pricing.fullPrice }}<small>{{ copy.dev1.pricing.fullPeriod }}</small></strong></header>
          <p>{{ copy.dev1.pricing.fullDesc }}</p>
          <ul><li v-for="item in copy.dev1.pricing.fullFeatures" :key="item">{{ item }}</li></ul>
          <router-link :to="isRu ? '/ru/pricing' : '/pricing'" class="btn">{{ copy.dev1.pricing.fullCta }}</router-link>
        </article>
      </div>
    </section>

    <!-- §06 IMPORT -->
    <section id="import" ref="importEl" class="import-sec" aria-labelledby="import-title">
      <h2 id="import-title" class="import-sec__sr">{{ copy.dev1.importSec.title }}</h2>
      <ul class="import-sec__list">
        <li
          v-for="(name, index) in platforms"
          :key="name"
          class="import-sec__item"
          :class="{ 'is-in': importRevealed }"
          :style="{ '--i': index }"
        >
          <span class="import-sec__name">{{ name }}</span>
          <span class="import-sec__arrow">→ {{ copy.dev1.importSec.journal }}</span>
        </li>
      </ul>
    </section>

    <!-- PRIVACY -->
    <section class="privacy" aria-labelledby="privacy-title">
      <div class="label mono"><span>{{ copy.dev1.privacy.label[0] }}</span><span>{{ copy.dev1.privacy.label[1] }}</span></div>
      <div class="privacy__body">
        <h2 id="privacy-title" class="privacy__title">{{ copy.dev1.privacy.title }}</h2>
        <p>{{ copy.dev1.privacy.text }} <router-link :to="isRu ? '/ru/privacy' : '/privacy'">{{ copy.dev1.privacy.link }}</router-link></p>
      </div>
    </section>
  </div>

  <!-- BACK COVER -->
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../shared/i18n/useI18n'
import { landingCopy } from '../shared/i18n/landingCopy.js'
import { downloads, refreshDownloads } from '../shared/downloads.js'
import UiFrame from './UiFrame.vue'
import LangDropdown from './LangDropdown.vue'
import BarHeader from './BarHeader.vue'

const route = useRoute()
const { locale } = useI18n()
const isRu = computed(() => locale.value === 'ru' || route.path.startsWith('/ru'))
const copy = computed(() => landingCopy[isRu.value ? 'ru' : 'en'])

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Archivo:wght@800;900&family=Inter+Tight:wght@400;500;600;800&family=JetBrains+Mono:wght@400;500;700&display=swap'
const year = new Date().getFullYear()
const pad = n => String(n).padStart(2, '0')

/* Chart compare. The same page is rendered twice: bare candles underneath, the full trade on top, clipped at the slider. */
const cleanPatch = [
  ['orders.forEach(order => {', ';[].forEach(order => {'],
  ["{ index: entryIndex, below: true, color: '#ffffff' },", ''],
  ["{ index: exitIndex, below: false, color: '#fbbf24' }", ''],
  ['function drawConditions(g, yForPrice, barWidth) {\n    ctx.save()', 'function drawConditions(g, yForPrice, barWidth) {\n    return\n    ctx.save()'],
]

const cmp = ref(null)
const split = ref(35)
const isHinting = ref(false)
let dragging = false
let hasInteracted = false
let hintTimeouts = []
let chartObserver = null

const stopBounceHint = () => {
  hasInteracted = true
  isHinting.value = false
  hintTimeouts.forEach(clearTimeout)
  hintTimeouts = []
}

const runBounceHint = () => {
  if (hasInteracted || reducedMotion) return
  isHinting.value = true

  // Step 1: glide right to 52%
  hintTimeouts.push(setTimeout(() => {
    if (hasInteracted) return
    split.value = 52

    // Step 2: glide left to 24%
    hintTimeouts.push(setTimeout(() => {
      if (hasInteracted) return
      split.value = 24

      // Step 3: glide back to center at 35%
      hintTimeouts.push(setTimeout(() => {
        if (hasInteracted) return
        split.value = 35

        // Settle & release transition
        hintTimeouts.push(setTimeout(() => {
          isHinting.value = false
          hasInteracted = true
        }, 550))
      }, 550))
    }, 550))
  }, 350))
}

const setFrom = (event) => {
  if (!cmp.value) return
  const rect = cmp.value.getBoundingClientRect()
  split.value = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100))
}
const dragStart = (event) => {
  stopBounceHint()
  dragging = true
  event.currentTarget.setPointerCapture(event.pointerId)
  setFrom(event)
}
const dragMove = (event) => { if (dragging) setFrom(event) }
const dragEnd = () => { dragging = false }
const slideKey = (event) => {
  stopBounceHint()
  const step = event.shiftKey ? 10 : 2
  if (event.key === 'ArrowLeft') split.value = Math.max(0, split.value - step)
  else if (event.key === 'ArrowRight') split.value = Math.min(100, split.value + step)
  else return
  event.preventDefault()
}

const handleSeeHowItWorks = (e) => {
  e.preventDefault()
  const chartEl = document.getElementById('chart')
  const target = (chartEl && getComputedStyle(chartEl).display !== 'none')
    ? chartEl
    : document.getElementById('karl-nikolai')
  if (target) {
    const headerOffset = 46
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset
    window.scrollTo({ top, behavior: 'smooth' })
    if (window.history.pushState) {
      window.history.pushState(null, '', '#chart')
    }
  }
}

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

const rows = computed(() => {
  const r = copy.value.dev1.rows
  return [
    { ...r[0] },
    {
      ...r[1],
      wide: true, dark: true, ink: false, bare: true, src: '/ui/5.html', design: [1400, 900],
      patch: [
        ['var exit = addHub(trade.exit, lm.exitHubX, lm.exitHubY, lm)', 'var exit = { centerX: 0, centerY: 0 }'],
        [',\n      { x: lm.exitHubX, y: lm.exitHubY, w: lm.hubWidth, h: lm.hubHeight }', ''],
        [", ['exit', trade.exit, exit, EXIT_SLOTS]", ''],
        ['addLine(entry.centerX, entry.centerY, exit.centerX, exit.centerY, true)', ''],
        ['(window.innerHeight - 100) / (bottom - top), 1)', '(window.innerHeight - 100) / (bottom - top), 3)'],
      ],
      css: '.viewport{background:transparent!important}.links path{stroke:#000!important;stroke-opacity:.4!important}',
    },
    { ...r[2] },
    { ...r[3] },
    {
      ...r[4],
      wide: true, flow: true, tight: true, auto: true, bare: true, src: '/ui/9.html', design: [1500, 900], build: buildReportGrid,
      patch: [
        ['r=De(null),p=De(null),m=De(!1)', "r=De('profits-losses'),p=De(null),m=De(!1)"],
        ...['profits-losses', 'trade-distribution', 'risk-execution', 'drawdowns', 'robustness'].map(id => [`r.value==="${id}"?`, '!0?']),
        ['r.value==="scenarios-conditions"&&E("scenarios-conditions")', 'E("scenarios-conditions")'],
      ],
      css: '#app{position:static!important;inset:auto!important}#app>div,#app>div>div{height:auto!important;min-height:0!important;overflow:visible!important;max-width:none!important;padding:0!important}.genesis-report-surface{height:auto!important;margin:0!important;background:transparent!important}.genesis-report-surface>aside{display:none!important}.report-scroll-area{overflow:visible!important;height:auto!important;padding:0!important}.chart-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:30px 24px}.chart-cell{margin:0;min-width:0;align-self:start}.chart-cell>[class*=bg-white]{margin-top:0!important;background:transparent!important;padding:0!important}.chart-cell>[class*=bg-white]>:not(svg){display:none!important}.chart-cell svg{width:100%!important;height:auto!important;display:block}.chart-cap{font:500 11px/1.25 ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#fff;margin-bottom:8px}',
    },
  ]
})

const comparison = computed(() => copy.value.dev1.comparison.rows)

const platforms = ['MetaTrader 5', 'Bybit', 'Binance', 'Kraken', 'Interactive Brokers']
const importEl = ref(null)
const importRevealed = ref(false)
let importObserver = null

const metricListEn = [["Net Profit", "Realized trade PnL", "+$240.00", "g"], ["Risk/Reward Ratio", "Setup R/R ratio", "2.40", "g"], ["Required Adherence", "Fulfilled Required Rules", "100%", "g"], ["Additional PnL", "Additional Conditions effect", "+$42.00", "g"], ["Conditional PnL Ratio", "Profit ratio per setup condition", "1.32", "g"], ["Cognitive Stability", "Neural Telemetry", "86%", "g"], ["Dominant Bias", "Primary Friction Marker", "DISCIPLINE", "w"], ["Emotional PnL Drag", "Psychological friction drag", "-$8.00", "w"], ["Friction Density", "Friction Markers Ratio", "0.12", "w"], ["Net Result Variance", "vs Strategy Average PnL", "+$18.00", "g"], ["Yield Efficiency", "Balance Before Trade", "2.40%", "g"], ["Profit Velocity", "PnL per holding hour", "$60.00/h", "g"], ["Planned vs Realized Risk", "Risk Audit", "0.96", "g"], ["Temporal Exposure", "Holding Duration", "4.00h", "n"], ["Stop Loss Distance", "Entry to Stop Loss in %", "0.50%", "n"], ["Take Profit Distance", "Entry to TP distance in %", "1.50%", "n"], ["SL Execution Drag", "Loss-trade slippage only", "0.08 R", "n"], ["Risk Budget Adherence", "Max Risk vs Budget", "96%", "g"], ["TP Capture Ratio", "Target Reward Captured", "80%", "w"], ["Planned RR / Baseline RR", "Planned Trade RR vs Baseline RR", "0.84", "b"], ["Unrealized Alpha Left", "Maximum profit − captured profit in $", "20%", "g"], ["Confirmed Loss Time", "Time in drawdown zone", "18m", "b"], ["Confirmed Profit Time", "Time in profit zone", "3h 42m", "g"], ["Max Meaningful Drawdown", "Peak adverse move (MAE)", "-0.28%", "b"], ["Max Favorable Excursion", "Peak favorable move (MFE)", "1.48%", "g"], ["Profit Capture Ratio", "Share of MFE captured", "81%", "g"], ["Price Path Shape", "Movement sequence relative to entry", "FAVORABLE FIRST", "g"], ["Initial Movement", "First classified candle", "PROFIT", "g"], ["Entry Heat", "Adverse Delay", "0.12%", "w"], ["Adverse Before Profit", "Drawdown before Profit", "YES", "b"], ["News During Trade", "Macro News Backdrop", "NO", "n"]]

const metricListRu = [["Чистая прибыль", "Фактический PnL сделки", "+$240.00", "g"], ["Risk/Reward", "Коэффициент R/R сетапа", "2.40", "g"], ["Соблюдение правил", "Выполненные обязательные правила", "100%", "g"], ["Дополнительный PnL", "Эффект дополнительных условий", "+$42.00", "g"], ["Коэф. условий PnL", "Отношение прибыли по условиям", "1.32", "g"], ["Стабильность мышления", "Телеметрия эмоционального фона", "86%", "g"], ["Преобладающее смещение", "Основной маркер трения", "DISCIPLINE", "w"], ["Эмоциональный убыток", "Убыток из-за психологического трения", "-$8.00", "w"], ["Плотность трения", "Доля маркеров трения", "0.12", "w"], ["Дисперсия результата", "Отклонение от среднего PnL", "+$18.00", "g"], ["Эффективность доходности", "Баланс до начала сделки", "2.40%", "g"], ["Скорость прибыли", "PnL за каждый час удержания", "$60.00/ч", "g"], ["План vs Факт Риск", "Аудит соблюдения риска", "0.96", "g"], ["Время в позиции", "Длительность удержания", "4.00ч", "n"], ["Дистанция Stop Loss", "От входа до Stop Loss в %", "0.50%", "n"], ["Дистанция Take Profit", "От входа до Take Profit в %", "1.50%", "n"], ["Проскальзывание SL", "Проскальзывание в убытках", "0.08 R", "n"], ["Лимит риска бюджета", "Макс. риск относительно бюджета", "96%", "g"], ["Захват Take Profit", "Доля взятой цели движения", "80%", "w"], ["План RR / База RR", "Плановый RR к базовому RR", "0.84", "b"], ["Оставленная альфа", "Макс. прибыль минус взятая", "20%", "g"], ["Время в просадке", "Время в зоне просадки", "18м", "b"], ["Время в прибыли", "Время в зоне профита", "3ч 42м", "g"], ["Макс. просадка MAE", "Пиковое неблагоприятное движение", "-0.28%", "b"], ["Макс. движение MFE", "Пиковое благоприятное движение", "1.48%", "g"], ["Захват движения", "Доля взятого движения MFE", "81%", "g"], ["Форма движения", "Последовательность от входа", "СНАЧАЛА ПРИБЫЛЬ", "g"], ["Первая свеча", "Классификация первой свечи", "ПРИБЫЛЬ", "g"], ["Нагрев входа", "Задержка до движения", "0.12%", "w"], ["Просадка до прибыли", "Просадка перед профитом", "ДА", "b"], ["Новости в сделке", "Макроэкономический фон", "НЕТ", "n"]]

const metricList = computed(() => isRu.value ? metricListRu : metricListEn)

const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
const onWindowResize = () => { isMobile.value = window.innerWidth <= 768 }
const getRowDesign = (row) => {
  if (row.id === 'patterns' && isMobile.value) return [500, 390]
  return row.design
}
const getRowCss = (row) => {
  if (row.id === 'patterns' && isMobile.value) {
    return 'main{width:100%!important;padding:12px 18px 44px!important}.list{padding-bottom:12px!important}'
  }
  return row.css || ''
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
    // Ensure early rows (index 1 and 4) guarantee visible pattern loss rows on mobile
    const forced = i === 1 || i === 4 || rand() < 0.16
    const hour = forced ? 8 + Math.floor(rand() * 2) : 7 + Math.floor(rand() * 11)
    const minute = Math.floor(rand() * 60)
    const side = forced || rand() < 0.45 ? 'SHORT' : 'LONG'
    const pattern = side === 'SHORT' && hour < 10
    const win = (i === 1 || i === 4) ? false : rand() < (pattern ? 0.31 : 0.56)
    const r = win ? 0.4 + rand() * 2.1 : -(0.6 + rand() * (pattern ? 1.4 : 0.8))
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
const coverEl = ref(null)
const coverProgress = ref(0)
const isHeroRevealed = ref(false)

let frame = 0
const onScroll = () => {
  if (frame || reducedMotion) return
  frame = requestAnimationFrame(() => {
    frame = 0
    ledgerProgress.value = sectionProgress(ledgerEl.value)
    if (coverEl.value) {
      const rect = coverEl.value.getBoundingClientRect()
      const offset = 46
      const scrolled = -(rect.top - offset)
      coverProgress.value = Math.min(1, Math.max(0, scrolled / (rect.height || 1)))
    }
  })
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
  const triggerHeroReveal = () => {
    isHeroRevealed.value = true
  }

  const loader = typeof document !== 'undefined' ? document.getElementById('app-loader') : null
  if (loader && !reducedMotion) {
    const checkLoader = () => {
      if (!document.getElementById('app-loader') || loader.classList.contains('loader-fade-out')) {
        setTimeout(triggerHeroReveal, 120)
      } else {
        requestAnimationFrame(checkLoader)
      }
    }
    requestAnimationFrame(checkLoader)
  } else {
    setTimeout(triggerHeroReveal, 80)
  }

  if (importEl.value) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      importRevealed.value = true
    } else {
      importObserver = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) {
          importRevealed.value = true
          importObserver?.disconnect()
        }
      }, { threshold: 0.15 })
      importObserver.observe(importEl.value)
    }
  }

  if (cmp.value && !reducedMotion) {
    chartObserver = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        runBounceHint()
        chartObserver?.disconnect()
        chartObserver = null
      }
    }, { threshold: 0.35 })
    chartObserver.observe(cmp.value)
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  window.addEventListener('resize', onWindowResize)
  onWindowResize()
  onScroll()
})
onBeforeUnmount(() => {
  stopBounceHint()
  chartObserver?.disconnect()
  importObserver?.disconnect()
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  window.removeEventListener('resize', onWindowResize)
  fontLink?.remove()
})
</script>

<style scoped>
.d {
  --edge: clamp(14px, 1.6cqw, 24px);
  --gut: clamp(14px, 1.5cqw, 22px);
  --sans: 'Inter Tight', 'Helvetica Neue', Arial, sans-serif;
  --wide: 'Archivo', 'Arial Black', sans-serif;
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

/* buttons: square, in the colours of the surface they sit on */
.d a.btn { display: inline-flex; justify-content: space-between; gap: 12px; align-items: center; padding: 16px 18px 15px; background: #000; color: #fff; border: 2px solid #000; font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em; font-size: 16px; transition: background 0.1s, color 0.1s; }
.d a.btn:hover { background: #fff; color: #000; }
.d a.btn--line { background: transparent; color: #000; }
.d a.btn--line:hover { background: #000; color: #fff; }
.d a.btn--paper { background: #fff; color: #000; border-color: #fff; }
.d a.btn--paper:hover { background: #000; color: #fff; }

/* ── Hero from /dev (light theme for /) ── */
.bx-hero {
  position: relative;
  min-height: calc(100svh - 60px);
  padding: clamp(32px, 5vh, 56px) var(--edge) clamp(40px, 6vh, 64px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-bottom: 2px solid #000;
  background: #fff;
  color: #000;
}
.bx-hero__eyebrow {
  display: flex;
  justify-content: space-between;
  margin: 0 0 clamp(16px, 2.4vh, 24px);
  font-size: 13px;
  font-family: var(--mono);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.55);
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  padding-bottom: 12px;
}
.bx-hero__eyebrow span:first-child {
  color: #000;
  font-weight: 600;
}
.bx-hero__title {
  margin: 0;
}
.bx-hero__title .bx-wide {
  display: block;
  font-family: var(--wide, var(--sans));
  font-weight: 900;
  text-transform: uppercase;
  font-size: clamp(54px, 9.4cqw, 138px);
  line-height: 0.86;
  letter-spacing: -0.04em;
  white-space: nowrap;
  margin-left: -0.04em;
  color: #000;
}
.bx-hero__sub {
  display: block;
  margin-top: 0.32em;
  font-weight: 400;
  font-size: clamp(24px, 3.4vw, 54px);
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: rgba(0, 0, 0, 0.72);
}
.bx-hero__grid {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(300px, 0.85fr) 1.5fr;
  gap: clamp(24px, 3.6vw, 56px);
  margin-top: clamp(28px, 4vh, 48px);
  align-items: start;
}
.bx-hero__copy {
  display: flex;
  flex-direction: column;
  gap: 26px;
}
.bx-hero__lead {
  margin: 0;
  font-size: clamp(16px, 1.25vw, 20px);
  line-height: 1.45;
  color: rgba(0, 0, 0, 0.78);
  max-width: 36ch;
}
.bx-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.bx-hero__facts {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.15);
}
.bx-hero__facts li {
  display: grid;
  grid-template-columns: 76px 1fr;
  align-items: baseline;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.15);
  font-size: 14px;
  color: rgba(0, 0, 0, 0.75);
  line-height: 1.35;
}
.bx-hero__facts strong {
  font-family: var(--mono);
  font-weight: 700;
  font-size: 17px;
  color: #000;
}
.bx-hero__shot {
  margin: 0;
  perspective: 1600px;
  position: relative;
}
.bx-hero__shot img {
  display: block;
  width: 100%;
  height: auto;
  border: 2px solid #000;
  transform-origin: 50% 0;
  transform: rotateX(var(--rot, max(0deg, calc(14deg - var(--tilt) * 50deg))));
  box-shadow: 0 35px 70px -25px rgba(0, 0, 0, 0.22), 0 10px 20px -10px rgba(0, 0, 0, 0.1);
  background: #000;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.9s cubic-bezier(0.7, 0, 0.2, 1);
  will-change: transform, clip-path;
}
.bx-hero__shot.is-in img {
  clip-path: inset(0 0 0 0);
}
.bx-hero__shot figcaption {
  margin-top: 12px;
  font-family: var(--mono);
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
}

/* ── Chart compare ─────────────────────────────────── */
.chart { scroll-margin-top: 50px; border-bottom: 2px solid #000; }
.chart__head {
  padding: clamp(24px, 3.6cqw, 48px) var(--edge) clamp(20px, 2.8cqw, 36px);
  border-bottom: 2px solid #000;
}
.chart__title {
  margin: 0;
  font-family: var(--sans);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  font-size: clamp(30px, 4.4cqw, 64px);
  color: #000;
  max-width: 28ch;
}
.cmp { position: relative; user-select: none; touch-action: pan-y; }
.cmp.is-hinting .cmp__layer--top,
.cmp.is-hinting .cmp__handle {
  transition: clip-path 0.55s cubic-bezier(0.22, 1, 0.36, 1), left 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}
.cmp__layer { display: block; pointer-events: none; }
.cmp__layer--top { position: absolute; inset: 0; clip-path: inset(0 0 0 var(--x)); }
.cmp__handle { position: absolute; top: 0; bottom: 0; left: var(--x); width: 44px; margin-left: -22px; cursor: ew-resize; display: flex; align-items: center; justify-content: center; touch-action: none; }
.cmp__handle::before { content: ''; position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; margin-left: -1px; background: #000; }
.cmp__grip { position: relative; background: #000; color: #fff; font-size: 12px; letter-spacing: 2px; padding: 12px 10px; white-space: nowrap; }
.cmp__handle:focus-visible { outline: none; }
.cmp__handle:focus-visible .cmp__grip { outline: 3px solid #000; outline-offset: 3px; }
.chart__text { margin: 0; padding: var(--edge); border-top: 2px solid #000; max-width: 70ch; font-size: clamp(15px, 1.25cqw, 20px); line-height: 1.2; letter-spacing: -0.015em; }

/* ── Facts ─────────────────────────────────────────── */
.facts { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 2px solid #000; }
.facts > div { padding: var(--edge); border-right: 2px solid #000; display: flex; flex-direction: column; gap: 14px; min-height: 200px; justify-content: space-between; }
.facts > div:last-child { border-right: 0; }
.facts strong { font-weight: 800; letter-spacing: -0.06em; line-height: 0.85; font-size: clamp(56px, 7.4cqw, 128px); }
.facts span { font-size: clamp(13px, 1.05cqw, 16px); line-height: 1.2; max-width: 28ch; }

/* ── Labels ────────────────────────────────────────── */
.label { display: flex; justify-content: space-between; padding: 12px var(--edge) 11px; border-bottom: 2px solid #000; }

/* ── Sections ──────────────────────────────────────── */
.sec { border-bottom: 2px solid #000; }
.sec__head { display: grid; grid-template-columns: clamp(40px, 5cqw, 80px) 1fr auto; align-items: baseline; padding: clamp(10px, 1.2cqw, 18px) var(--edge) clamp(12px, 1.4cqw, 20px); border-bottom: 2px solid #000; }
.sec__title { margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.88; font-size: clamp(44px, 9cqw, 160px); }
.sec__body { display: grid; grid-template-columns: repeat(12, 1fr); column-gap: var(--gut); padding: var(--edge); align-items: start; }
.sec__text { grid-column: 1 / 5; display: flex; flex-direction: column; gap: 14px; position: sticky; top: 62px; }
.sec__visual { grid-column: 5 / 13; margin: 0; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
/* Only the title strip is black; the body of the section stays white. */
.sec--dark .sec__head { background: #000; color: #fff; }
.sec--wide.sec--flow .sec__text { position: static; width: auto; max-width: 70ch; margin: 22px 0 18px; }
.sec--wide .sec__body { position: relative; display: block; padding-top: 0; }
.sec--wide .sec__visual { width: 100%; }
.sec--tight .sec__body { padding-left: var(--edge); padding-right: var(--edge); }
.sec__intro { margin: 22px 0 18px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.9; font-size: clamp(36px, 6.4cqw, 110px); }
/* The text lies over the empty top-right of the picture instead of sitting beside a framed box. */
.sec--wide .sec__text { position: absolute; top: calc(var(--edge) * 1.4); left: var(--edge); width: min(34%, 460px); z-index: 2; }
.sec--flip .sec__text { grid-column: 9 / 13; grid-row: 1; }
.sec--flip .sec__visual { grid-column: 1 / 9; grid-row: 1; }
.sec__text p { margin: 0; font-size: clamp(15px, 1.2cqw, 19px); line-height: 1.2; letter-spacing: -0.015em; text-align: justify; hyphens: auto; }
.sec__plan { border: 1px solid #000; align-self: flex-start; padding: 4px 8px 3px; }
.sec__visual :deep(.frame:not(.frame--bare)) { box-shadow: 0 0 0 1px #000; }
.sec__visual figcaption { opacity: 0.7; }

/* Metrics grid across the whole section */
.metrics { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 2px solid #000; border-left: 2px solid #000; }
.metric { display: flex; flex-direction: column; gap: 10px; min-height: 170px; padding: 14px 16px 16px; border-right: 2px solid #000; border-bottom: 2px solid #000; }
.metric:last-child { grid-column: span 2; }
.metric .mono { opacity: 0.75; }
.metric strong { margin-top: auto; font-weight: 800; letter-spacing: -0.05em; line-height: 0.9; font-size: clamp(30px, 3.6cqw, 62px); word-break: break-word; }
.metric small { font-size: 13px; line-height: 1.15; opacity: 0.75; }
.t-g { color: #047857; } .t-w { color: #b45309; } .t-b { color: #be123c; } .t-n { color: #000; }

.stats { margin: 6px 0 0; display: flex; flex-direction: column; gap: 14px; }
.stats > div { border-top: 2px solid #000; padding-top: 6px; }
.stats dt { font-size: 13px; }
.stats dd { margin: 4px 0 0; font-weight: 800; letter-spacing: -0.06em; line-height: 0.88; font-size: clamp(44px, 5cqw, 84px); }
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
.compare__title { margin: 0; padding: clamp(28px, 4.5cqw, 64px) var(--edge) clamp(24px, 3.5cqw, 44px); font-weight: 800; letter-spacing: -0.035em; line-height: 1; font-size: clamp(28px, 4.2cqw, 64px); max-width: 28ch; }
.compare__table { width: calc(100% - 2 * var(--edge)); margin: 0 var(--edge) clamp(36px, 5cqw, 64px); border-collapse: collapse; font-size: clamp(14px, 1.2cqw, 18px); }
.compare__table th, .compare__table td { border-top: 1px solid rgba(0, 0, 0, 0.15); padding: clamp(12px, 1.3cqw, 16px) 14px; text-align: left; font-weight: 500; }
.compare__table tbody tr:last-child > * { border-bottom: 1px solid rgba(0, 0, 0, 0.15); }
.compare__table thead th { font-family: var(--mono); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 14px; }
.compare__table thead th:nth-child(1),
.compare__table tbody th { padding-left: 0; padding-right: 18px; }
.compare__table thead th:nth-child(2),
.compare__table td:nth-child(2) { text-align: center; }
.compare__table thead th:nth-child(3),
.compare__table td:nth-child(3) { text-align: center; padding-right: 0; }
.compare__table td { width: 18%; font-family: var(--mono); font-size: 0.9em; }
.compare__table td.is-no { color: #be123c; font-weight: 600; }

/* ── Pricing ───────────────────────────────────────── */
.pricing { border-bottom: 2px solid #000; }
.plans { display: grid; grid-template-columns: 1fr 1fr; }
.plan { display: flex; flex-direction: column; gap: 14px; padding: var(--edge); min-height: 520px; }
.plan + .plan { border-left: 2px solid #000; }
.plan header { display: flex; justify-content: space-between; align-items: baseline; }
.plan strong { font-weight: 800; letter-spacing: -0.06em; line-height: 0.84; font-size: clamp(64px, 10cqw, 170px); }
.plan small { font-size: 16px; font-weight: 500; letter-spacing: -0.01em; margin-left: 10px; }
.plan > p { margin: 0; font-size: clamp(16px, 1.4cqw, 22px); font-weight: 500; letter-spacing: -0.02em; }
.plan ul { list-style: none; margin: 4px 0 18px; padding: 0; font-size: clamp(14px, 1.1cqw, 17px); }
.plan li { padding: 7px 0 8px; border-top: 1px solid currentColor; }
.plan .btn { margin-top: auto; }
.plan--full { background: #000; color: #fff; }
.d .plan--full a.btn { background: #fff; color: #000; border-color: #fff; }
.d .plan--full a.btn:hover { background: #000; color: #fff; }

/* ── §06 Import ─────────────────────────────────────── */
.import-sec { border-bottom: 2px solid #000; background: #fff; color: #000; }
.import-sec__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.import-sec__list { list-style: none; margin: 0; padding: 0; }
.import-sec__item { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; padding: clamp(10px, 1.4cqw, 18px) var(--edge) clamp(8px, 1cqw, 14px); border-bottom: 2px solid #000; transform: translateX(-8%); opacity: 0; transition: transform 0.6s cubic-bezier(0.7, 0, 0.2, 1) calc(var(--i) * 70ms), opacity 0.3s calc(var(--i) * 70ms), color 0.15s ease; user-select: none; }
.import-sec__item:last-child { border-bottom: 0; }
.import-sec__item.is-in { transform: none; opacity: 1; }
.import-sec__name { font-weight: 800; text-transform: uppercase; letter-spacing: -0.05em; line-height: 0.86; font-size: clamp(34px, 7.4cqw, 140px); transition: color 0.15s ease; }
.import-sec__arrow { font-family: var(--mono); font-size: clamp(13px, 1.05cqw, 15px); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; padding-bottom: 0.5em; transition: color 0.15s ease; }
.import-sec__item:hover .import-sec__name { color: #e10600; }
.import-sec__item:hover .import-sec__arrow { color: #e10600; }
@media (prefers-reduced-motion: reduce) {
  .import-sec__item { transform: none !important; opacity: 1 !important; transition: none !important; }
  .bx-hero__shot img { transform: none !important; clip-path: none !important; transition: none !important; }
}
@media (max-width: 900px) {
  .import-sec__arrow { display: none; }
}

/* ── Privacy ───────────────────────────────────────── */
.privacy { border-bottom: 2px solid #000; }
.privacy__body { display: grid; grid-template-columns: 1fr minmax(320px, 52ch); gap: var(--gut); align-items: end; padding: clamp(28px, 5cqw, 80px) var(--edge); }
.privacy__title { margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.9; font-size: clamp(34px, 6cqw, 108px); max-width: 16ch; }
.privacy__body p { margin: 0; font-size: clamp(15px, 1.2cqw, 19px); line-height: 1.2; letter-spacing: -0.015em; }
.privacy__body p a { text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 900px) { .privacy__body { grid-template-columns: 1fr; } }

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
.kn-headline { margin: 0; font-weight: 800; font-size: clamp(34px, 4.6cqw, 80px); line-height: 0.94; letter-spacing: -0.045em; text-transform: uppercase; }
.kn-body { margin: 0; font-size: clamp(15px, 1.15cqw, 18px); line-height: 1.25; letter-spacing: -0.01em; max-width: 44ch; }
.kn-finding, .kn-rule { border: 2px solid #000; padding: 14px; max-width: 440px; animation: kn-cut 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }
@keyframes kn-cut { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.kn-finding__head { display: flex; justify-content: space-between; gap: 12px; font-family: var(--mono); font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #000; padding-bottom: 10px; }
.kn-finding dl { display: grid; grid-template-columns: repeat(3, 1fr); margin: 14px 0; }
.kn-finding dt { font-size: 12px; opacity: 0.65; text-transform: uppercase; letter-spacing: 0.04em; }
.kn-finding dd { margin: 4px 0 0; font-weight: 800; letter-spacing: -0.05em; font-size: clamp(28px, 3cqw, 46px); }
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
  .kn-scroll { height: 260vh; }
  .kn-sticky { padding: 0 0 22px; }
  .kn-running { grid-template-columns: 1fr auto; padding: 8px var(--edge); font-size: 11px; }
  .kn-running span:nth-child(2) { display: none; }
  .kn-ledger-layout {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px var(--edge) 0;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .kn-ledger-copy { gap: 8px; flex-shrink: 0; }
  .kn-counter { font-size: 11px; gap: 8px; }
  .kn-counter .kn-mono { font-size: 11px; padding: 2px 6px; }
  .kn-headline { font-size: clamp(20px, 5.5cqw, 28px); line-height: 1.05; }
  .kn-body { display: none; }
  .kn-finding, .kn-rule { padding: 8px 10px; max-width: none; margin: 0; }
  .kn-finding__head { padding-bottom: 6px; font-size: 10px; }
  .kn-finding dl { margin: 6px 0; }
  .kn-finding dt { font-size: 10px; }
  .kn-finding dd { font-size: 22px; margin: 2px 0 0; }
  .kn-finding p { font-size: 12px; line-height: 1.25; }
  .kn-rule__grid { margin-top: 6px; gap: 3px; }
  .kn-rule__grid i { border-width: 1px; }
  .kn-ledger {
    flex: 1;
    min-height: 140px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-top: 2px solid #000;
  }
  .kn-ledger__head { padding: 4px 0; font-size: 10px; opacity: 0.6; }
  .kn-ledger__rows {
    columns: 1;
    flex: 1;
    overflow: hidden;
    mask-image: linear-gradient(to bottom, #000 75%, transparent);
  }
  .kn-ledger__row { padding: 3px 0; font-size: 11px; line-height: 1.2; }
  .kn-progress { bottom: 6px; }
}


/* ── Phone ─────────────────────────────────────────── */
@media (max-width: 900px) {
  .chart {
    display: none !important;
  }
  .bx-hero {
    padding-top: 24px;
    padding-bottom: 32px;
    min-height: auto;
  }
  .bx-hero__eyebrow {
    font-size: 11px;
    margin-bottom: 14px;
    padding-bottom: 8px;
  }
  .bx-hero__title .bx-wide {
    font-size: clamp(42px, 14vw, 76px);
    white-space: normal;
    line-height: 0.9;
  }
  .bx-hero__sub {
    font-size: clamp(20px, 5.8vw, 28px);
    line-height: 1.15;
    margin-top: 0.3em;
  }
  .bx-hero__grid {
    grid-template-columns: 1fr;
    gap: 28px;
    margin-top: 24px;
  }
  .bx-hero__shot {
    order: -1;
    perspective: 1200px;
  }
  .bx-hero__actions {
    flex-direction: column;
  }
  .bx-hero__actions .btn {
    width: 100%;
  }
  .facts { grid-template-columns: 1fr 1fr; }
  .facts > div { min-height: 150px; border-bottom: 2px solid #000; }
  .facts > div:nth-child(2) { border-right: 0; }
  .facts > div:last-child { grid-column: 1 / -1; border-right: 0; border-bottom: 0; }
  .sec__head { grid-template-columns: 34px 1fr; }
  .sec__tag { display: none; }
  .sec__title { font-size: clamp(38px, 13cqw, 80px); }
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
  .compare__title {
    padding: clamp(20px, 4cqw, 36px) var(--edge) clamp(16px, 3cqw, 24px);
    font-size: clamp(22px, 5.5cqw, 38px);
    line-height: 1.05;
    max-width: none;
  }
  .compare__table {
    table-layout: fixed;
    margin-bottom: clamp(28px, 4.5cqw, 48px);
  }
  .compare__table thead th {
    font-size: 11px;
    letter-spacing: 0.03em;
    padding-top: 10px;
    padding-bottom: 10px;
  }
  .compare__table thead th:nth-child(1),
  .compare__table tbody th {
    width: auto;
    padding-right: 14px;
    padding-left: 0;
  }
  .compare__table thead th:nth-child(2),
  .compare__table td:nth-child(2) {
    width: 90px;
    padding-left: 4px;
    padding-right: 4px;
    text-align: center;
  }
  .compare__table thead th:nth-child(3),
  .compare__table td:nth-child(3) {
    width: 58px;
    padding-left: 4px;
    padding-right: 0;
    text-align: center;
  }
  .compare__table tbody th {
    padding-top: 12px;
    padding-bottom: 12px;
    font-size: clamp(12.5px, 3.2cqw, 14px);
    line-height: 1.3;
    font-weight: 500;
    word-break: break-word;
    -webkit-hyphens: auto;
    hyphens: auto;
  }
  .compare__table td {
    padding-top: 12px;
    padding-bottom: 12px;
    font-size: 12px;
  }
  @media (max-width: 380px) {
    .compare__table thead th {
      font-size: 10px;
      letter-spacing: 0.02em;
    }
    .compare__table thead th:nth-child(2),
    .compare__table td:nth-child(2) {
      width: 78px;
    }
    .compare__table thead th:nth-child(3),
    .compare__table td:nth-child(3) {
      width: 50px;
    }
    .compare__table thead th:nth-child(1),
    .compare__table tbody th {
      padding-right: 10px;
      font-size: 12px;
    }
    .compare__table td {
      font-size: 11px;
    }
  }
  #strategy .sec__body {
    padding-top: clamp(24px, 5.5cqw, 40px);
  }
  #strategy .sec__text {
    margin-top: 6px;
  }
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
