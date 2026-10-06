<template>
  <div class="philosophy-page min-h-screen bg-white text-[#2c2c2a]">
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
              <li><span class="sr-only">J.L. — </span>A quiet moment brings a new idea into focus.</li>
              <li><span class="sr-only">JÖRMUNGANDR — </span>The next chapter begins with a single deliberate step.</li>
            </ol>
          </section>
        </section>
      </main>

      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import SiteNav from './SiteNav.vue'
import AppFooter from './AppFooter.vue'
import { useI18n } from '../shared/i18n/useI18n'

const { t } = useI18n()
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

.name-diagram__connectors > svg > path {
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

.name-diagram__number:hover {
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

@media (prefers-reduced-motion: reduce) {
  .name-diagram__number,
  .name-diagram__descriptions li {
    transition: none;
  }
}

@media (max-width: 700px) {
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
