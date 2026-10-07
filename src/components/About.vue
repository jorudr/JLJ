<template>
  <div ref="aboutRoot" class="philosophy-page min-h-screen bg-white text-[#2c2c2a]">
    <div class="philosophy-shell mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
      <SiteNav />

      <main class="philosophy-main flex-1" aria-labelledby="about-title">
        <section class="philosophy-content">
          <div class="philosophy-intro">
            <span class="philosophy-eyebrow">{{ t('landing.about.eyebrow') }}</span>
            <h1 id="about-title">{{ t('landing.about.title') }}</h1>
            <p>{{ t('landing.about.intro') }}</p>
          </div>

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
              <span class="name-diagram__number" title="" style="--position: 8%">1</span>
              <span class="name-diagram__number" title="" style="--position: 58%">2</span>
            </div>
            <ol class="name-diagram__descriptions">
              <li><span class="sr-only">J.L. — </span>{{ t('landing.about.livermoreDescription') }}</li>
              <li>{{ t('landing.about.jormungandrDescription') }}</li>
            </ol>
          </section>

          <hr class="herb-divider" />

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
        </section>
      </main>

      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import SiteNav from './SiteNav.vue'
import AppFooter from './AppFooter.vue'
import { useI18n } from '../shared/i18n/useI18n'
import { useImperialReveal } from '../shared/imperialReveal'

const { t } = useI18n()
const aboutRoot = ref(null)
useImperialReveal(aboutRoot)
const activeHerbDetail = ref(null)
const herbDiagram = ref(null)
const herbArrowPaths = ref([])
let herbResizeObserver

function updateHerbArrows() {
  const diagram = herbDiagram.value
  if (!diagram) return
  const bounds = diagram.getBoundingClientRect()
  const circles = diagram.querySelectorAll('.herb-diagram__number')
  const descriptions = diagram.querySelectorAll('.herb-diagram__descriptions li')
  herbArrowPaths.value = Array.from(circles, (circle, index) => {
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
  herbResizeObserver = new ResizeObserver(updateHerbArrows)
  herbResizeObserver.observe(herbDiagram.value)
  herbDiagram.value.querySelectorAll('img, li').forEach(element => herbResizeObserver.observe(element))
  updateHerbArrows()
})

onBeforeUnmount(() => herbResizeObserver?.disconnect())
const herbDetails = [
  { name: 'Tree', x: '50%', y: '32%', labelKey: 'landing.about.treeLabel', descriptionKey: 'landing.about.treeDescription' },
  { name: 'Key', x: '48%', y: '63%', labelKey: 'landing.about.keyLabel', descriptionKey: 'landing.about.keyDescription' },
  { name: 'Papers', x: '43%', y: '75%', labelKey: 'landing.about.papersLabel', descriptionKey: 'landing.about.papersDescription' },
  { name: 'Serpent', x: '50%', y: '11%', labelKey: 'landing.about.serpentLabel', descriptionKey: 'landing.about.serpentDescription' },
]
</script>

<style scoped>
.philosophy-page {
  font-family: 'Cormorant Garamond', serif;
  background: #ffffff;
  color: #2c2c2a;
}

.philosophy-main {
  width: min(100%, 1280px);
  margin: 0 auto;
}

.philosophy-content {
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(88px, 15vh, 180px) clamp(0px, 1.4vw, 18px) clamp(88px, 13vh, 160px);
}

.philosophy-intro {
  max-width: 820px;
}

.philosophy-eyebrow {
  color: rgba(44, 44, 42, 0.5);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.philosophy-intro h1 {
  margin-top: 26px;
  color: #2c2c2a;
  font-size: clamp(4rem, 10vw, 9.5rem);
  font-weight: 300;
  letter-spacing: 0.015em;
  line-height: 0.84;
}

.philosophy-intro p {
  max-width: 980px;
  margin-top: 34px;
  color: rgba(44, 44, 42, 0.72);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(0.95rem, 1.35vw, 1.18rem);
  line-height: 1.48;
}

.name-diagram {
  container-type: inline-size;
  margin-top: clamp(100px, 15vh, 180px);
}

.name-diagram__title {
  display: grid;
  grid-template-columns: 8% 8% 84%;
  margin: 0;
  color: #171715;
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
  color: #2c2c2a;
}

.name-diagram__connectors > svg > path,
.herb-diagram__arrows > path {
  fill: none;
  stroke: currentColor;
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  marker-end: url(#about-arrow);
}

.name-diagram__number {
  position: absolute;
  top: 0;
  left: var(--position);
  display: grid;
  width: clamp(22px, 3.4vw, 38px);
  aspect-ratio: 1;
  transform: translate(-50%, -65%);
  place-items: center;
  border: 1px solid #222;
  border-radius: 50%;
  background: #fff;
  color: #000;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(11px, 1.3vw, 15px);
}

.name-diagram__descriptions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(12px, 4vw, 48px);
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
  text-align: center;
  color: rgba(44, 44, 42, 0.72);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(0.75rem, 1.3vw, 1rem);
  line-height: 1.6;
}

.name-diagram__number {
  cursor: pointer;
  pointer-events: auto;
  transition: background-color 180ms ease, color 180ms ease;
}

.name-diagram__number:hover,
.name-diagram__number:focus-visible {
  background-color: #000;
  color: #fff;
}

.name-diagram__descriptions li {
  transition: opacity 180ms ease;
}

.name-diagram:has(.name-diagram__number:nth-of-type(1):hover) .name-diagram__descriptions li:not(:nth-child(1)),
.name-diagram:has(.name-diagram__number:nth-of-type(2):hover) .name-diagram__descriptions li:not(:nth-child(2)) {
  opacity: 0.25;
}

.herb-divider {
  margin: clamp(32px, 5vw, 60px) 0 24px;
  border: 0;
  border-top: 1px solid rgba(44, 44, 42, 0.2);
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
  color: #2c2c2a;
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
  outline: 2px solid #222;
  outline-offset: 4px;
}

.herb-diagram__descriptions {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 72px;
  padding: 0 32px;
}

.herb-diagram__label {
  display: block;
  margin-bottom: 12px;
  color: #171715;
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.herb-diagram__descriptions .is-muted {
  opacity: 0.25;
}

@media (prefers-reduced-motion: reduce) {
  .name-diagram__number,
  .name-diagram__descriptions li {
    transition: none;
  }
}

@media (max-width: 700px) {
  .herb-diagram__descriptions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 64px 20px;
    margin-top: 56px;
  }

  .philosophy-content {
    padding-top: 64px;
    padding-bottom: 72px;
  }

  .philosophy-intro h1 {
    margin-top: 20px;
    max-width: 100%;
    font-size: clamp(2.4rem, 12vw, 4.2rem);
    letter-spacing: 0;
    line-height: 0.9;
    overflow-wrap: anywhere;
  }

  .philosophy-intro p {
    margin-top: 24px;
    font-size: 0.92rem;
    line-height: 1.55;
  }

  .name-diagram {
    margin-top: 80px;
  }
}
</style>
