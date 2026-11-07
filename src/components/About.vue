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

    <!-- MAIN CONTENT -->
    <main class="about-main" aria-labelledby="about-title">
      <div class="about-content">
        <!-- INTRO -->
        <section class="about-intro">
          <span class="mono about-eyebrow">{{ t('landing.about.eyebrow') }}</span>
          <h1 id="about-title">{{ t('landing.about.title') }}</h1>
          <p>{{ t('landing.about.intro') }}</p>
        </section>

        <!-- NAME DIAGRAM -->
        <section class="name-diagram" aria-labelledby="brand-name">
          <h2 id="brand-name" class="name-diagram__title" aria-label="J.L.JÖRMUNGANDR">
            <span>J.</span><span>L.</span><span>JÖRMUNGANDR</span>
          </h2>
          <div class="name-diagram__connectors" aria-hidden="true">
            <svg viewBox="0 0 1000 180" preserveAspectRatio="none">
              <defs>
                <marker id="about-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 1 1 L 8 5 L 1 9" fill="none" stroke="currentColor" />
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
          <ol class="name-diagram__descriptions">
            <li :class="{ 'is-muted': activeNameDetail !== null && activeNameDetail !== 0 }">
              <span class="sr-only">J.L. — </span>{{ t('landing.about.livermoreDescription') }}
            </li>
            <li :class="{ 'is-muted': activeNameDetail !== null && activeNameDetail !== 1 }">
              {{ t('landing.about.jormungandrDescription') }}
            </li>
          </ol>
        </section>

        <hr class="herb-divider" />

        <!-- HERB / COAT OF ARMS DIAGRAM -->
        <section ref="herbDiagram" class="herb-diagram" aria-label="J.L.JÖRMUNGANDR emblem">
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
          <ol class="name-diagram__descriptions herb-diagram__descriptions">
            <li
              v-for="(detail, index) in herbDetails"
              :id="`herb-detail-${index}`"
              :key="detail.name"
              :class="{ 'is-muted': activeHerbDetail !== null && activeHerbDetail !== index }"
            >
              <span class="herb-diagram__label">{{ index + 1 }} / {{ detail.labelKey ? t(detail.labelKey) : detail.name }}</span>
              {{ detail.descriptionKey ? t(detail.descriptionKey) : detail.description }}
            </li>
          </ol>
        </section>
      </div>
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
  const descriptions = diagram.querySelectorAll('.herb-diagram__descriptions li')
  if (!circles.length || !descriptions.length) return
  herbArrowPaths.value = Array.from(circles, (circle, index) => {
    if (!descriptions[index]) return ''
    const start = circle.getBoundingClientRect()
    const end = descriptions[index].getBoundingClientRect()
    const x = start.left + start.width / 2 - bounds.left
    const y = start.top + start.height / 2 - bounds.top
    const targetX = end.left + end.width / 2 - bounds.left
    const targetY = end.top - bounds.top - 12
    // Outer lanes keep the long vertical runs clear of the descriptions.
    const laneX = index < 2 ? 4 + index * 12 : bounds.width - 4 - (index - 2) * 12
    return `M ${x} ${y} V ${y + 28} H ${laneX} V ${targetY - 18} H ${targetX} V ${targetY}`
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
    herbDiagram.value.querySelectorAll('img, li').forEach(element => herbResizeObserver.observe(element))
    updateHerbArrows()
  }
})

onBeforeUnmount(() => {
  fontLink?.remove()
  herbResizeObserver?.disconnect()
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

/* ── About Main & Content ──────────────────────────── */
.about-main {
  flex: 1;
  width: 100%;
  border-bottom: 2px solid #000;
}

.about-content {
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(56px, 8vh, 120px) var(--edge) clamp(72px, 10vh, 140px);
}

.about-intro {
  max-width: 820px;
}

.about-eyebrow {
  display: inline-block;
  color: rgba(0, 0, 0, 0.55);
}

.about-intro h1 {
  margin: 20px 0 0;
  color: #000;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(3.8rem, 9.5vw, 8.5rem);
  font-weight: 300;
  letter-spacing: 0.01em;
  line-height: 0.86;
}

.about-intro p {
  max-width: 980px;
  margin: 30px 0 0;
  color: rgba(0, 0, 0, 0.78);
  font-family: var(--sans);
  font-size: clamp(1rem, 1.35vw, 1.2rem);
  line-height: 1.5;
  letter-spacing: -0.01em;
}

/* ── Name Diagram ──────────────────────────────────── */
.name-diagram {
  container-type: inline-size;
  margin-top: clamp(80px, 12vh, 150px);
}

.name-diagram__title {
  display: grid;
  grid-template-columns: 8% 8% 84%;
  margin: 0;
  color: #000;
  font-family: 'Cormorant Garamond', serif;
  font-size: 10cqw;
  font-weight: 400;
  letter-spacing: -0.055em;
  line-height: 1.1;
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
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
  marker-end: url(#about-arrow);
}

.name-diagram__number {
  position: absolute;
  top: 0;
  left: var(--position);
  display: grid;
  width: clamp(24px, 3.4vw, 38px);
  aspect-ratio: 1;
  transform: translate(-50%, -65%);
  place-items: center;
  border: 1.5px solid #000;
  border-radius: 50%;
  background: #fff;
  color: #000;
  font-family: var(--mono);
  font-size: clamp(11px, 1.3vw, 15px);
  font-weight: 600;
  cursor: pointer;
  pointer-events: auto;
  transition: background-color 180ms ease, color 180ms ease;
  padding: 0;
}

.name-diagram__number:hover,
.name-diagram__number:focus-visible {
  background-color: #000;
  color: #fff;
}

.name-diagram__descriptions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(16px, 4vw, 48px);
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  text-align: center;
  color: rgba(0, 0, 0, 0.78);
  font-family: var(--sans);
  font-size: clamp(0.85rem, 1.15vw, 1rem);
  line-height: 1.55;
}

.name-diagram__descriptions li {
  transition: opacity 180ms ease;
}

.name-diagram__descriptions .is-muted {
  opacity: 0.25;
}

/* ── Herb Diagram ──────────────────────────────────── */
.herb-divider {
  margin: clamp(48px, 8vw, 84px) 0 clamp(32px, 5vw, 60px);
  border: 0;
  border-top: 2px solid #000;
}

.herb-diagram {
  position: relative;
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
  width: min(75%, 510px);
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

.herb-diagram__descriptions {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 72px;
  padding: 0 16px;
}

.herb-diagram__label {
  display: block;
  margin-bottom: 10px;
  color: #000;
  font-family: var(--mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 500;
}

.herb-diagram__descriptions .is-muted {
  opacity: 0.25;
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
  .name-diagram__descriptions li {
    transition: none;
  }
}

@media (max-width: 768px) {
  .herb-diagram__descriptions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 48px 20px;
    margin-top: 48px;
    padding: 0;
  }

  .about-content {
    padding-top: 48px;
    padding-bottom: 64px;
  }

  .about-intro h1 {
    font-size: clamp(2.6rem, 12vw, 4.4rem);
    line-height: 0.92;
  }

  .about-intro p {
    margin-top: 20px;
    font-size: 0.95rem;
  }

  .name-diagram {
    margin-top: 60px;
  }

  .bar__nav a:not(:last-child) {
    display: none;
  }
}
</style>
