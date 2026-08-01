<template>
  <div class="pricing-page min-h-screen bg-[#070708] text-white/80">
    <div class="pricing-shell mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
      <header class="relative mx-auto flex w-full max-w-[1280px] items-center justify-between text-[10px] tracking-[0.3em]">
        <div class="flex items-center">
          <router-link to="/" class="flex items-center space-x-6" aria-label="J.L.JÖRMUNGANDR home">
            <div class="relative flex h-5 w-5 shrink-0 items-center justify-center sm:h-6 sm:w-6">
              <div class="absolute inset-0 animate-[spin_10s_linear_infinite] border border-white/40"></div>
              <div class="absolute inset-1 animate-[spin_6s_linear_infinite_reverse] border border-white/60"></div>
              <div class="h-1 w-1 rotate-45 animate-pulse bg-white"></div>
              <div class="absolute -left-0.5 -top-0.5 h-1.5 w-1.5 border-l border-t border-white"></div>
              <div class="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 border-b border-r border-white"></div>
            </div>
            <span class="text-[12px] font-light uppercase tracking-[0.5em] text-white sm:text-[14px]" style="font-family: 'Cormorant Garamond', serif;">J.L.JÖRMUNGANDR</span>
          </router-link>

        </div>

        <nav class="absolute left-1/2 hidden -translate-x-1/2 items-center space-x-8 whitespace-nowrap font-serif text-[16px] tracking-[0.15rem] md:flex" aria-label="Primary navigation" style="font-family: 'Cormorant Garamond', serif;">
          <router-link to="/" class="flex items-center text-white/80 transition-colors hover:opacity-50">
            {{ t('landing.nav.products') }}
            <svg class="ml-1.5 h-3.5 w-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </router-link>
          <router-link to="/use-cases" class="flex items-center text-white/80 transition-colors hover:opacity-50">
            {{ t('landing.nav.useCases') }}
            <svg class="ml-1.5 h-3.5 w-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </router-link>
          <router-link to="/pricing" class="text-white/80 transition-colors hover:opacity-50">{{ t('landing.nav.pricing') }}</router-link>
          <router-link to="/philosophy" class="text-white/80 transition-colors hover:opacity-50">{{ t('landing.nav.philosophy') }}</router-link>
        </nav>

        <div class="flex items-center space-x-4">
          <button @click="setLocale('en')" class="transition-colors hover:text-white/50" :class="locale === 'en' ? 'font-bold text-white' : 'text-white/50'">EN</button>
          <span class="text-white/30">/</span>
          <button @click="setLocale('ru')" class="transition-colors hover:text-white/50" :class="locale === 'ru' ? 'font-bold text-white' : 'text-white/50'">RU</button>
        </div>
      </header>

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

            <a href="https://github.com/jorudr/JLJ/releases" target="_blank" rel="noreferrer" class="pricing-plan__action pricing-plan__action--quiet">
              {{ t('landing.pricing.demo.cta') }} <span aria-hidden="true">↗</span>
            </a>
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

      <footer class="w-full border-t border-white/[0.08] py-8 text-center text-[9px] uppercase tracking-[0.2em] text-white/90" style="font-family: 'Cormorant Garamond', serif;">
        <div class="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-8 sm:flex-row sm:text-left">
          <div class="flex items-center gap-0 whitespace-nowrap sm:items-start">
            <span class="text-[12px] tracking-[0.14em]">{{ t('landing.footer.company') }}</span>
          </div>
          <nav class="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[11px] font-medium tracking-[0.14em] text-white/90 sm:justify-end" aria-label="Footer navigation">
            <router-link to="/" class="transition-colors hover:text-white">{{ t('landing.nav.products') }}</router-link>
            <router-link to="/use-cases" class="transition-colors hover:text-white">{{ t('landing.nav.useCases') }}</router-link>
            <router-link to="/pricing" class="transition-colors hover:text-white">{{ t('landing.nav.pricing') }}</router-link>
            <router-link to="/philosophy" class="transition-colors hover:text-white">{{ t('landing.nav.philosophy') }}</router-link>
          </nav>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
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
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  width: min(100%, 1280px);
  margin: 0 auto;
  padding: var(--pricing-top-space) clamp(0px, 1.4vw, 18px) calc(var(--pricing-top-space) + var(--pricing-list-offset));
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
  grid-template-columns: minmax(190px, 1.1fr) minmax(120px, 0.7fr) minmax(250px, 1.55fr) clamp(120px, 12vw, 150px);
  gap: clamp(18px, 2.7vw, 34px);
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
  gap: 10px 24px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pricing-plan__features li {
  min-width: 0;
  padding-left: 13px;
  border-left: 1px solid rgba(255, 255, 255, 0.25);
}

.pricing-plan__features span,
.pricing-plan__features small {
  display: block;
  font-family: ui-sans-serif, system-ui, sans-serif;
}

.pricing-plan__features span {
  color: rgba(255, 255, 255, 0.9);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.25;
}

.pricing-plan__features small {
  margin-top: 3px;
  color: rgba(255, 255, 255, 0.43);
  font-size: 9px;
  line-height: 1.35;
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
  color: #070708;
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
    max-width: 680px;
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
    padding-top: var(--pricing-top-space);
    padding-bottom: calc(var(--pricing-top-space) + var(--pricing-list-offset));
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
