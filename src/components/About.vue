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

    <main id="about-main">
      <!-- 01 — PHILOSOPHY / ABOUT -->
      <section class="sec" aria-labelledby="about-title">
        <div class="sec__head">
          <span class="mono sec__n">01</span>
          <h1 id="about-title" class="sec__title">{{ t('landing.about.title') }}</h1>
          <span class="mono sec__tag">{{ isRu ? 'ФИЛОСОФИЯ' : 'PHILOSOPHY' }}</span>
        </div>
        <div class="spec">
          <div class="spec__cell spec__cell--lead">
            <p class="about-lead">{{ t('landing.about.intro') }}</p>
          </div>
          <div class="spec__cell spec__cell--side">
            <span class="mono">{{ t('landing.about.eyebrow') }}</span>
            <span class="mono">{{ isRu ? 'ДНЕВНИК ТРЕЙДЕРА' : 'TRADING JOURNAL' }}</span>
            <span class="mono">JORU</span>
          </div>
        </div>
      </section>

      <!-- 02 — NAME DIAGRAM -->
      <section class="sec" aria-labelledby="brand-name">
        <div class="sec__head">
          <span class="mono sec__n">02</span>
          <h2 class="sec__title">{{ isRu ? 'ИМЯ' : 'NAME' }}</h2>
          <span class="mono sec__tag">J. L. JÖRMUNGANDR</span>
        </div>
        <div class="name-stage">
          <div class="name-diagram">
            <h2 id="brand-name" class="name-diagram__title" aria-label="J.L.JÖRMUNGANDR">
              <span>J.</span><span>L.</span><span>JÖRMUNGANDR</span>
            </h2>
            <div class="name-diagram__connectors" aria-hidden="true">
              <svg viewBox="0 0 1000 180" preserveAspectRatio="none">
                <defs>
                  <marker id="about-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M 1 1 L 8 5 L 1 9" fill="none" stroke="currentColor" stroke-width="2" />
                  </marker>
                </defs>
                <path d="M 80 0 V 110 H 250 V 172" />
                <path d="M 580 0 V 75 H 750 V 172" />
              </svg>
              <button
                type="button"
                class="name-diagram__number"
                style="--position: 8%"
                aria-label="1: Jesse Livermore"
                @mouseenter="activeNameDetail = 0"
                @mouseleave="activeNameDetail = null"
                @focus="activeNameDetail = 0"
                @blur="activeNameDetail = null"
              >1</button>
              <button
                type="button"
                class="name-diagram__number"
                style="--position: 58%"
                aria-label="2: Jörmungandr"
                @mouseenter="activeNameDetail = 1"
                @mouseleave="activeNameDetail = null"
                @focus="activeNameDetail = 1"
                @blur="activeNameDetail = null"
              >2</button>
            </div>
          </div>
        </div>
        <div class="name-grid">
          <article
            class="name-card"
            :class="{ 'is-muted': activeNameDetail !== null && activeNameDetail !== 0 }"
            @mouseenter="activeNameDetail = 0"
            @mouseleave="activeNameDetail = null"
          >
            <header class="name-card__head">
              <span class="mono">01</span>
              <span class="mono">JESSE LAURISTON LIVERMORE</span>
            </header>
            <p><span class="sr-only">J.L. — </span>{{ t('landing.about.livermoreDescription') }}</p>
          </article>
          <article
            class="name-card"
            :class="{ 'is-muted': activeNameDetail !== null && activeNameDetail !== 1 }"
            @mouseenter="activeNameDetail = 1"
            @mouseleave="activeNameDetail = null"
          >
            <header class="name-card__head">
              <span class="mono">02</span>
              <span class="mono">JÖRMUNGANDR</span>
            </header>
            <p>{{ t('landing.about.jormungandrDescription') }}</p>
          </article>
        </div>
      </section>

      <!-- 03 — EMBLEM DIAGRAM -->
      <section ref="herbDiagram" class="sec sec--herb" aria-label="J.L.JÖRMUNGANDR emblem">
        <div class="sec__head">
          <span class="mono sec__n">03</span>
          <h2 class="sec__title">{{ isRu ? 'ГЕРБ' : 'EMBLEM' }}</h2>
          <span class="mono sec__tag">{{ isRu ? 'СИМВОЛИКА' : 'HERALDRY' }}</span>
        </div>

        <div class="herb-stage">
          <svg class="herb-diagram__arrows" aria-hidden="true">
            <path v-for="(path, index) in herbArrowPaths" :key="index" :d="path" />
          </svg>
          <div class="herb-diagram__visual">
            <img src="/assets/herb-blue.svg" alt="J.L.JÖRMUNGANDR coat of arms" @load="updateHerbArrows" />
            <button
              v-for="(detail, index) in herbDetails"
              :key="detail.name"
              type="button"
              class="name-diagram__number herb-diagram__number"
              title=""
              :style="{ '--position': detail.x, '--top': detail.y }"
              :aria-label="detail.labelKey ? t(detail.labelKey) : detail.name"
              :aria-describedby="`herb-detail-${index}`"
              @mouseenter="activeHerbDetail = index"
              @mouseleave="activeHerbDetail = null"
              @focus="activeHerbDetail = index"
              @blur="activeHerbDetail = null"
            >{{ index + 1 }}</button>
          </div>
        </div>

        <div class="herb-grid">
          <article
            v-for="(detail, index) in herbDetails"
            :id="`herb-detail-${index}`"
            :key="detail.name"
            class="herb-card"
            :class="{ 'is-muted': activeHerbDetail !== null && activeHerbDetail !== index }"
            @mouseenter="activeHerbDetail = index"
            @mouseleave="activeHerbDetail = null"
          >
            <header class="herb-card__head">
              <span class="mono">0{{ index + 1 }}</span>
              <span class="mono">{{ detail.labelKey ? t(detail.labelKey) : detail.name }}</span>
            </header>
            <p>{{ detail.descriptionKey ? t(detail.descriptionKey) : detail.description }}</p>
          </article>
        </div>
      </section>
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../shared/i18n/useI18n'
import { landingCopy } from '../shared/i18n/landingCopy.js'
import { downloads, refreshDownloads } from '../shared/downloads.js'
import LangDropdown from './LangDropdown.vue'

const route = useRoute()
const { t, locale } = useI18n()
const isRu = computed(() => locale.value === 'ru' || route.path.startsWith('/ru'))
const copy = computed(() => landingCopy[isRu.value ? 'ru' : 'en'])

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;800&family=JetBrains+Mono:wght@400;500&display=swap'
const year = new Date().getFullYear()

const activeNameDetail = ref(null)
const activeHerbDetail = ref(null)
const herbDiagram = ref(null)
const herbArrowPaths = ref([])
let herbResizeObserver
let fontLink = null

function updateHerbArrows() {
  const diagram = herbDiagram.value
  if (!diagram) return
  const bounds = diagram.getBoundingClientRect()
  const circles = diagram.querySelectorAll('.herb-diagram__number')
  const cards = diagram.querySelectorAll('.herb-grid .herb-card')
  if (!circles.length || !cards.length) return
  herbArrowPaths.value = Array.from(circles, (circle, index) => {
    if (!cards[index]) return ''
    const start = circle.getBoundingClientRect()
    const end = cards[index].getBoundingClientRect()
    const x = start.left + start.width / 2 - bounds.left
    const y = start.top + start.height / 2 - bounds.top
    const targetX = end.left + end.width / 2 - bounds.left
    const targetY = end.top - bounds.top
    const laneX = index < 2 ? 24 + index * 24 : bounds.width - 24 - (index - 2) * 24
    return `M ${x} ${y} V ${y + 24} H ${laneX} V ${targetY - 14} H ${targetX} V ${targetY}`
  })
}

onMounted(() => {
  if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
    fontLink = document.createElement('link')
    fontLink.rel = 'stylesheet'
    fontLink.href = FONT_HREF
    document.head.appendChild(fontLink)
  }
  refreshDownloads()

  herbResizeObserver = new ResizeObserver(updateHerbArrows)
  if (herbDiagram.value) {
    herbResizeObserver.observe(herbDiagram.value)
    herbDiagram.value.querySelectorAll('img, article').forEach(element => herbResizeObserver.observe(element))
    updateHerbArrows()
  }
  window.addEventListener('resize', updateHerbArrows)
})

onBeforeUnmount(() => {
  fontLink?.remove()
  herbResizeObserver?.disconnect()
  window.removeEventListener('resize', updateHerbArrows)
})

const herbDetails = [
  { name: 'Tree', x: '50%', y: '32%', labelKey: 'landing.about.treeLabel', descriptionKey: 'landing.about.treeDescription' },
  { name: 'Key', x: '48%', y: '63%', labelKey: 'landing.about.keyLabel', descriptionKey: 'landing.about.keyDescription' },
  { name: 'Papers', x: '43%', y: '75%', labelKey: 'landing.about.papersLabel', descriptionKey: 'landing.about.papersDescription' },
  { name: 'Serpent', x: '50%', y: '11%', labelKey: 'landing.about.serpentLabel', descriptionKey: 'landing.about.serpentDescription' },
]
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
  display: flex;
  flex-direction: column;
  overflow-x: clip;
}
.d *, .d *::before, .d *::after { box-sizing: border-box; }
.d a { color: inherit; text-decoration: none; }
.d :focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
.mono { font-family: var(--mono); font-size: 12px; font-weight: 400; letter-spacing: 0.04em; text-transform: uppercase; line-height: 1.2; margin: 0; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* buttons */
.d a.btn { display: inline-flex; justify-content: space-between; gap: 12px; align-items: center; padding: 16px 18px 15px; background: #000; color: #fff; border: 2px solid #000; font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em; font-size: 16px; transition: background 0.1s, color 0.1s; }
.d a.btn:hover { background: #fff; color: #000; }
.d a.btn--paper { background: #fff; color: #000; border-color: #fff; }
.d a.btn--paper:hover { background: #000; color: #fff; }

/* ── Bar ───────────────────────────────────────────── */
.bar { position: sticky; top: 0; z-index: 20; display: flex; justify-content: space-between; align-items: center; gap: 16px; height: 46px; padding: 0 var(--edge); background: #fff; border-bottom: 2px solid #000; }
.bar__brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 14px; letter-spacing: -0.01em; white-space: nowrap; }
.bar__brand img { filter: brightness(0); display: block; }
.bar__nav { display: flex; gap: clamp(14px, 2.4vw, 36px); font-weight: 600; }
.bar__nav a:hover { text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 2px; }

/* ── Section Headings & Specs (Identical to '/') ───── */
.sec { border-bottom: 2px solid #000; }
.sec__head { display: grid; grid-template-columns: clamp(40px, 5vw, 80px) 1fr auto; align-items: baseline; padding: clamp(10px, 1.2vw, 18px) var(--edge) clamp(12px, 1.4vw, 20px); border-bottom: 2px solid #000; }
.sec__title { margin: 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.04em; line-height: 0.88; font-size: clamp(44px, 9vw, 160px); }

.spec { display: grid; grid-template-columns: 2.4fr 1fr; }
.spec__cell { padding: clamp(24px, 4vw, 56px) var(--edge); border-right: 2px solid #000; display: flex; flex-direction: column; gap: 14px; }
.spec__cell:last-child { border-right: 0; }
.spec__cell--side { justify-content: space-between; background: #fafafa; }

.about-lead {
  margin: 0;
  font-weight: 700;
  font-size: clamp(20px, 2.4vw, 38px);
  line-height: 1.2;
  letter-spacing: -0.03em;
  max-width: 44ch;
}

/* ── Name Diagram ──────────────────────────────────── */
.name-stage {
  padding: clamp(48px, 8vw, 100px) var(--edge) clamp(24px, 4vw, 48px);
  overflow: hidden;
  container-type: inline-size;
}

.name-diagram {
  max-width: 1200px;
  margin: 0 auto;
}

.name-diagram__title {
  display: grid;
  grid-template-columns: 8% 8% 84%;
  margin: 0;
  color: #000;
  font-family: var(--sans);
  font-size: 10cqw;
  font-weight: 800;
  letter-spacing: -0.05em;
  text-transform: uppercase;
  line-height: 0.95;
  white-space: nowrap;
  text-align: center;
}

.name-diagram__connectors {
  position: relative;
  height: clamp(120px, 18vw, 180px);
}

.name-diagram__connectors svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  color: #000;
}

.name-diagram__connectors > svg > path,
.herb-diagram__arrows > path {
  fill: none;
  stroke: #000;
  stroke-width: 2;
  vector-effect: non-scaling-stroke;
  marker-end: url(#about-arrow);
}

.name-diagram__number {
  position: absolute;
  top: 0;
  left: var(--position);
  display: grid;
  width: clamp(26px, 3.2vw, 38px);
  aspect-ratio: 1;
  transform: translate(-50%, -65%);
  place-items: center;
  border: 2px solid #000;
  border-radius: 50%;
  background: #fff;
  color: #000;
  font-family: var(--mono);
  font-size: clamp(12px, 1.2vw, 15px);
  font-weight: 700;
  cursor: pointer;
  pointer-events: auto;
  transition: background-color 0.15s ease, color 0.15s ease;
  padding: 0;
}

.name-diagram__number:hover,
.name-diagram__number:focus-visible {
  background-color: #000;
  color: #fff;
}

.name-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 2px solid #000;
}

.name-card {
  padding: clamp(24px, 3.5vw, 48px) var(--edge);
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-right: 2px solid #000;
  transition: opacity 0.15s ease;
}

.name-card:last-child {
  border-right: 0;
}

.name-card__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 2px solid #000;
  padding-bottom: 12px;
}

.name-card p {
  margin: 0;
  font-size: clamp(15px, 1.25vw, 19px);
  line-height: 1.35;
  letter-spacing: -0.015em;
  opacity: 0.9;
}

.name-card.is-muted,
.herb-card.is-muted {
  opacity: 0.25;
}

/* ── Herb Diagram ──────────────────────────────────── */
.sec--herb {
  position: relative;
}

.herb-stage {
  position: relative;
  padding: clamp(48px, 7vw, 96px) var(--edge) clamp(36px, 5vw, 64px);
}

.herb-diagram__arrows {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
  z-index: 1;
  color: #000;
}

.herb-diagram__visual {
  position: relative;
  width: min(75%, 440px);
  margin: 0 auto;
}

.herb-diagram__visual img {
  display: block;
  width: 100%;
  height: auto;
}

.herb-diagram__number {
  z-index: 2;
  top: var(--top);
  transform: translate(-50%, -50%);
  padding: 0;
}

.herb-diagram__number:focus-visible {
  outline: 2px solid #000;
  outline-offset: 3px;
}

.herb-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 2px solid #000;
}

.herb-card {
  padding: clamp(20px, 2.5vw, 36px) var(--edge);
  border-right: 2px solid #000;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: opacity 0.15s ease;
}

.herb-card:last-child {
  border-right: 0;
}

.herb-card__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
}

.herb-card p {
  margin: 0;
  font-size: clamp(14px, 1.05vw, 16px);
  line-height: 1.35;
  letter-spacing: -0.01em;
  opacity: 0.88;
}

/* ── Footer ────────────────────────────────────────── */
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

@media (prefers-reduced-motion: reduce) {
  .name-diagram__number,
  .name-card,
  .herb-card {
    transition: none;
  }
}

@media (max-width: 900px) {
  .spec {
    grid-template-columns: 1fr;
  }
  .spec__cell {
    border-right: 0;
    border-bottom: 2px solid #000;
  }
  .spec__cell:last-child {
    border-bottom: 0;
  }
  .herb-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .herb-card:nth-child(2) {
    border-right: 0;
  }
  .herb-card:nth-child(1),
  .herb-card:nth-child(2) {
    border-bottom: 2px solid #000;
  }
}

@media (max-width: 768px) {
  .bar__nav a:not(:last-child) {
    display: none;
  }
  .herb-diagram__arrows {
    display: none;
  }
  .name-grid {
    grid-template-columns: 1fr;
  }
  .name-card {
    border-right: 0;
    border-bottom: 2px solid #000;
  }
  .name-card:last-child {
    border-bottom: 0;
  }
  .herb-grid {
    grid-template-columns: 1fr;
  }
  .herb-card {
    border-right: 0;
    border-bottom: 2px solid #000;
  }
  .herb-card:last-child {
    border-bottom: 0;
  }
}
</style>
