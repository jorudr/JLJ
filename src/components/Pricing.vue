<template>
  <div class="pricing-page min-h-screen bg-black text-white/80">
    <div class="pricing-shell mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
      <SiteNav :always-dark="true" />

      <main class="pricing-main flex-1">
        <section class="pricing-list" aria-label="Pricing plans">
          <article class="pricing-plan">
            <div class="pricing-plan__identity">
              <span class="pricing-plan__index">01</span>
              <div>
                <h2>{{ t('landing.pricing.demo.name') }}</h2>
                <p>{{ t('landing.pricing.demo.description') }}</p>
              </div>
            </div>

            <div class="pricing-plan__price">
              <span>{{ t('landing.pricing.demo.cadence') }}</span>
            </div>

            <ul class="pricing-plan__features">
              <li v-for="feature in demoFeatures" :key="feature.title">
                <span>{{ feature.title }}</span>
                <small>{{ feature.desc }}</small>
              </li>
            </ul>

            <router-link to="/announcement" class="pricing-plan__action pricing-plan__action--quiet hidden sm:inline-flex">
              {{ t('landing.pricing.demo.cta') }} <span aria-hidden="true">↗</span>
            </router-link>
            <div class="pricing-plan__action pricing-plan__action--quiet sm:hidden pointer-events-none opacity-70 text-center justify-center">
              {{ t('landing.openOnComputer') }}
            </div>
          </article>

          <article class="pricing-plan pricing-plan--featured">
            <div class="pricing-plan__identity">
              <span class="pricing-plan__index">02</span>
              <div>
                <h2>{{ t('landing.pricing.full.name') }}</h2>
                <p>{{ t('landing.pricing.full.description') }}</p>
              </div>
            </div>

            <div class="pricing-plan__price">
              <span>{{ t('landing.pricing.full.cadence') }}</span>
            </div>

            <ul class="pricing-plan__features">
              <li v-for="feature in fullFeatures" :key="feature.title">
                <span>{{ feature.title }}</span>
                <small>{{ feature.desc }}</small>
              </li>
            </ul>

            <a href="https://patreon.com/jlgandr" target="_blank" rel="noreferrer" class="pricing-plan__action pricing-plan__action--bright">
              {{ t('landing.pricing.full.cta') }} <span aria-hidden="true">↗</span>
            </a>
          </article>
        </section>
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

const { t, tm, locale, setLocale } = useI18n()

const demoFeatures = computed(() => tm('landing.pricing.demo.features'))
const fullFeatures = computed(() => tm('landing.pricing.full.features'))
</script>

<style scoped>
.pricing-page {
  font-family: 'Cormorant Garamond', serif;
}

.pricing-main {
  --pricing-top-space: clamp(52px, 8vh, 96px);
  --pricing-list-offset: clamp(32px, 5vh, 56px);
  --pricing-bottom-space: clamp(28px, 4vh, 44px);
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: min(100%, 1280px);
  margin: 0 auto;
  padding: var(--pricing-top-space) clamp(0px, 1.4vw, 18px) var(--pricing-bottom-space);
}

.pricing-list {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  margin-top: var(--pricing-list-offset);
  border-top: 1px solid rgba(255, 255, 255, 0.22);
}

.pricing-plan {
  flex: 1 1 0;
  display: grid;
  grid-template-columns: minmax(190px, 1fr) minmax(120px, 0.62fr) minmax(340px, 2.05fr) clamp(120px, 12vw, 150px);
  gap: clamp(20px, 2.8vw, 38px);
  align-items: start;
  padding: clamp(38px, 5vh, 72px) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.pricing-plan--featured {
  border-bottom-color: rgba(255, 255, 255, 0.32);
}

.pricing-plan__identity {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 13px;
}

.pricing-plan__index {
  padding-top: 7px;
  color: rgba(255, 255, 255, 0.3);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
  letter-spacing: 0.08em;
}

.pricing-plan h2 {
  color: white;
  font-size: clamp(2rem, 3.2vw, 3.25rem);
  font-weight: 300;
  letter-spacing: 0.02em;
  line-height: 0.95;
}

.pricing-plan__identity p {
  max-width: 260px;
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.5);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 11px;
  line-height: 1.45;
}

.pricing-plan__price {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.pricing-plan__price strong {
  color: white;
  font-size: clamp(1.8rem, 2.8vw, 2.8rem);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1;
}

.pricing-plan__price span {
  max-width: 180px;
  color: rgba(255, 255, 255, 0.42);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
  letter-spacing: 0.04em;
  line-height: 1.45;
}

.pricing-plan__features {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px 34px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pricing-plan__features li {
  min-width: 0;
  padding-left: 18px;
  border-left: 1px solid rgba(255, 255, 255, 0.25);
}

.pricing-plan__features span,
.pricing-plan__features small {
  display: block;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.pricing-plan__features span {
  color: rgba(255, 255, 255, 0.9);
  font-size: clamp(13px, 1.1vw, 15px);
  font-weight: 500;
  line-height: 1.28;
}

.pricing-plan__features small {
  margin-top: 7px;
  color: rgba(255, 255, 255, 0.43);
  font-size: clamp(11px, 0.95vw, 13px);
  line-height: 1.48;
}

.pricing-plan__action {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 11px 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  transition: background 180ms ease, color 180ms ease;
}

.pricing-plan__action span {
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 17px;
  line-height: 0.7;
}

.pricing-plan__action--quiet {
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: white;
}

.pricing-plan__action--quiet:hover {
  background: rgba(255, 255, 255, 0.08);
}

.pricing-plan__action--bright {
  background: white;
  color: #000;
}

.pricing-plan__action--bright:hover {
  background: #d8d8d8;
}

@media (max-width: 980px) {
  .pricing-plan {
    grid-template-columns: minmax(210px, 1fr) minmax(140px, 0.65fr) 145px;
  }

  .pricing-plan__features {
    grid-column: 1 / -1;
    grid-row: 2;
    max-width: 820px;
  }

  .pricing-plan__action {
    grid-column: 3;
    grid-row: 1;
  }
}

@media (max-width: 640px) {
  .pricing-main {
    --pricing-top-space: 48px;
    --pricing-list-offset: 32px;
    --pricing-bottom-space: 28px;
    padding-top: var(--pricing-top-space);
    padding-bottom: var(--pricing-bottom-space);
  }

  .pricing-list {
    margin-top: var(--pricing-list-offset);
  }

  .pricing-plan {
    display: flex;
    flex-direction: column;
    gap: 22px;
    padding: 30px 0 34px;
  }

  .pricing-plan__price {
    margin-left: 37px;
  }

  .pricing-plan__features {
    width: 100%;
    grid-template-columns: 1fr;
    gap: 12px;
    padding-left: 37px;
  }

  .pricing-plan__action {
    width: calc(100% - 37px);
    margin-left: 37px;
  }
}
</style>
