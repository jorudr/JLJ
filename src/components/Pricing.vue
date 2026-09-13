<template>
  <div class="pricing-page min-h-screen bg-black text-white/80">
    <div class="pricing-shell mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
      <SiteNav :always-dark="true" />

      <main class="pricing-main flex-1" aria-labelledby="pricing-title">
        <header class="pricing-intro">
          <h1 id="pricing-title">{{ t('landing.pricing.title') }}</h1>
          <p>{{ t('landing.pricing.subtitle') }}</p>
        </header>

        <section class="pricing-grid" :aria-label="t('landing.pricing.title')">
          <article class="pricing-card">
            <div class="pricing-card__topline">
              <span>{{ t('landing.pricing.free.eyebrow') }}</span>
            </div>
            <h2>{{ t('landing.pricing.free.name') }}</h2>
            <p class="pricing-card__description">{{ t('landing.pricing.free.description') }}</p>
            <div class="pricing-card__price">
              <strong>{{ t('landing.pricing.free.price') }}</strong>
              <span>{{ t('landing.pricing.free.period') }}</span>
            </div>
            <a href="https://www.patreon.com/checkout/jlgandr?rid=28845623" target="_blank" rel="noreferrer" class="pricing-card__action">
              {{ t('landing.pricing.free.cta') }} <span aria-hidden="true">↗</span>
            </a>
            <div class="pricing-card__divider"></div>
            <p class="pricing-card__includes">{{ t('landing.pricing.free.includes') }}</p>
            <ul class="pricing-card__features">
              <li v-for="feature in freeFeatures" :key="feature.title">
                <span class="pricing-card__check" aria-hidden="true">✓</span>
                <div>
                  <strong>{{ feature.title }}</strong>
                  <small>{{ feature.desc }}</small>
                </div>
              </li>
            </ul>
          </article>

          <article class="pricing-card pricing-card--featured">
            <div class="pricing-card__topline">
              <span>{{ t('landing.pricing.full.eyebrow') }}</span>
            </div>
            <h2>{{ t('landing.pricing.full.name') }}</h2>
            <p class="pricing-card__description">{{ t('landing.pricing.full.description') }}</p>
            <div class="pricing-card__price">
              <strong>{{ t('landing.pricing.full.price') }}</strong>
              <span>{{ t('landing.pricing.full.period') }}</span>
            </div>
            <a href="https://www.patreon.com/checkout/jlgandr?rid=28845652" target="_blank" rel="noreferrer" class="pricing-card__action">
              {{ t('landing.pricing.full.cta') }} <span aria-hidden="true">↗</span>
            </a>
            <div class="pricing-card__divider"></div>
            <p class="pricing-card__includes">{{ t('landing.pricing.full.includes') }}</p>
            <ul class="pricing-card__features">
              <li v-for="feature in fullFeatures" :key="feature.title">
                <span class="pricing-card__check" aria-hidden="true">✓</span>
                <div>
                  <strong>{{ feature.title }}</strong>
                  <small>{{ feature.desc }}</small>
                </div>
              </li>
            </ul>
          </article>
        </section>

        <p class="pricing-note">{{ t('landing.pricing.note') }}</p>
      </main>

      <AppFooter hide-hero />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SiteNav from './SiteNav.vue'
import AppFooter from './AppFooter.vue'
import { useI18n } from '../shared/i18n/useI18n'

const { t, tm } = useI18n()
const freeFeatures = computed(() => tm('landing.pricing.free.features'))
const fullFeatures = computed(() => tm('landing.pricing.full.features'))
</script>

<style scoped>
.pricing-page {
  font-family: 'Cormorant Garamond', serif;
}

.pricing-main {
  width: min(100%, 1280px);
  margin: 0 auto;
  padding: clamp(72px, 9vw, 112px) clamp(0px, 1.4vw, 18px) clamp(72px, 9vw, 112px);
}

.pricing-intro {
  display: flex;
  min-height: 240px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.pricing-intro::before {
  content: none;
}

.pricing-intro h1 {
  max-width: 740px;
  color: #f5f5f0;
  font-size: clamp(3rem, 5.6vw, 5.4rem);
  font-weight: 300;
  letter-spacing: 0;
  line-height: 0.92;
}

.pricing-intro p {
  max-width: 590px;
  margin-top: 22px;
  color: rgba(255, 255, 255, 0.5);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(0.94rem, 1.2vw, 1.08rem);
  line-height: 1.55;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: min(100%, 1060px);
  gap: 18px;
  margin: clamp(52px, 7vw, 82px) auto 0;
}

.pricing-card {
  display: flex;
  padding: clamp(30px, 3.2vw, 42px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  flex-direction: column;
  background: #000000;
  color: #f5f5f0;
}

.pricing-card--featured {
  border-color: #f5f5f0;
  background: #f5f5f0;
  color: #000000;
}

.pricing-card__topline {
  display: block;
  width: max-content;
  padding: 0;
  border: 0;
  background: transparent;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.61rem;
  font-weight: 400;
  letter-spacing: 0.14em;
  opacity: 0.42;
  text-transform: uppercase;
}

.pricing-card h2 {
  margin-top: 27px;
  font-size: clamp(2.5rem, 4vw, 4rem);
  font-weight: 300;
  letter-spacing: 0.01em;
  line-height: 0.95;
}

.pricing-card__description {
  max-width: 450px;
  min-height: 72px;
  margin-top: 15px;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.92rem;
  line-height: 1.55;
  opacity: 0.62;
}

.pricing-card__price {
  display: flex;
  min-height: 48px;
  margin-top: 22px;
  align-items: baseline;
  gap: 7px;
}

.pricing-card__price strong {
  font-size: clamp(2.35rem, 3.4vw, 3.2rem);
  font-weight: 400;
  letter-spacing: -0.03em;
  line-height: 1;
}

.pricing-card__price span {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.84rem;
  opacity: 0.52;
}

.pricing-card__action {
  display: flex;
  width: max-content;
  min-height: 42px;
  margin-top: 24px;
  padding: 0 18px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  align-items: center;
  gap: 16px;
  background: transparent;
  color: #f5f5f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: background 180ms ease, color 180ms ease;
}

.pricing-card__action:hover {
  background: rgba(255, 255, 255, 0.08);
}

.pricing-card--featured .pricing-card__action {
  border-color: #000000;
  background: #000000;
  color: #f5f5f0;
}

.pricing-card--featured .pricing-card__action:hover {
  background: #242424;
}

.pricing-card__action span {
  font-size: 0.95rem;
}

.pricing-card__divider {
  margin: 31px 0 24px;
  border-top: 1px solid currentColor;
  opacity: 0.18;
}

.pricing-card__includes {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  opacity: 0.44;
  text-transform: uppercase;
}

.pricing-card__features {
  display: grid;
  gap: 17px;
  margin: 22px 0 0;
  padding: 0;
  list-style: none;
}

.pricing-card__features li {
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 12px;
  align-items: start;
}

.pricing-card__check {
  padding-top: 2px;
  font-size: 0.75rem;
  opacity: 0.48;
}

.pricing-card__features strong,
.pricing-card__features small {
  display: block;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.pricing-card__features strong {
  font-size: 0.88rem;
  font-weight: 550;
  line-height: 1.3;
}

.pricing-card__features small {
  margin-top: 4px;
  font-size: 0.76rem;
  line-height: 1.45;
  opacity: 0.5;
}

.pricing-note {
  margin: 20px auto 0;
  color: rgba(255, 255, 255, 0.36);
  width: min(100%, 1060px);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}

@media (max-width: 800px) {
  .pricing-grid {
    grid-template-columns: 1fr;
  }

  .pricing-card {
    min-height: auto;
  }
}

@media (max-width: 640px) {
  .pricing-main {
    padding-top: 56px;
    padding-bottom: 72px;
  }

  .pricing-intro {
    min-height: 250px;
  }

  .pricing-intro h1 {
    font-size: clamp(2.7rem, 12vw, 4.2rem);
    line-height: 0.98;
  }

  .pricing-grid {
    margin-top: 42px;
  }

  .pricing-card {
    padding: 28px 24px 34px;
  }

  .pricing-card__description {
    min-height: auto;
  }
}
</style>
