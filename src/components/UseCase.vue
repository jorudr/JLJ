<template>
  <div class="use-case-page min-h-screen bg-[#070708] text-white/80">
    <div class="use-case-shell mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
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

        <MobileMenu />
      </header>

      <main class="use-case-main flex-1" aria-label="Use cases">
        <div class="use-case-stage">
          <Transition name="use-case-fade" mode="out-in">
            <section v-if="activeCasePage" :id="activeCasePage.id" :key="activeCasePage.id" class="use-case-content" :aria-labelledby="`use-case-title-${activeCasePage.id}`">
              <div class="use-case-intro">
                <h1 :id="`use-case-title-${activeCasePage.id}`">{{ activeCasePage.content.title }}</h1>
                <p>{{ activeCasePage.content.subtitle }}</p>
              </div>

              <div class="use-case-stepper" :style="stepperStyle" role="tablist" :aria-label="`${activeCasePage.content.title} steps`">
                <button
                  v-for="(step, index) in activeCasePage.content.steps"
                  :key="step.title"
                  type="button"
                  role="tab"
                  :aria-selected="activeStep === index"
                  :aria-controls="`use-case-step-${activeCasePage.id}-${index + 1}`"
                  :tabindex="activeStep === index ? 0 : -1"
                  :class="{ 'is-active': activeStep >= index }"
                  @click="activeStep = index"
                >
                  {{ index + 1 }}
                </button>
              </div>

              <Transition name="use-case-fade" mode="out-in">
                <article :id="`use-case-step-${activeCasePage.id}-${activeStep + 1}`" :key="`${activeCasePage.id}-${activeStep}`" class="use-case-step-content" role="tabpanel">
                  <span class="use-case-step-content__index">0{{ activeStep + 1 }}</span>
                  <h2>{{ activeStepContent.title }}</h2>
                  <p>{{ activeStepContent.description }}</p>
                </article>
              </Transition>
            </section>
          </Transition>

          <aside v-if="otherCaseLinks.length" class="use-case-more">
            <h2>{{ t('landing.useCasePages.more') }}</h2>
            <nav class="use-case-more__list" aria-label="More use cases">
              <router-link v-for="item in otherCaseLinks" :key="item.id" :to="item.to">
                {{ item.label }}
              </router-link>
            </nav>
          </aside>
        </div>
      </main>

      <footer class="w-full border-t border-white/[0.08] py-8 text-center text-[9px] uppercase tracking-[0.2em] text-white/90" style="font-family: 'Cormorant Garamond', serif;">
        <div class="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-8 sm:flex-row sm:text-left">
          <div class="flex self-start items-center gap-0 whitespace-nowrap text-left sm:self-auto sm:items-start sm:text-left">
            <span class="text-[12px] tracking-[0.14em]">{{ t('landing.footer.company') }}</span>
          </div>
          <nav class="flex w-full flex-col items-start justify-start gap-4 text-[11px] font-medium tracking-[0.14em] text-white/90 sm:w-auto sm:flex-row sm:items-center sm:gap-x-10 sm:gap-y-3 sm:justify-end" aria-label="Footer navigation">
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
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MobileMenu from './MobileMenu.vue'
import { useI18n } from '../shared/i18n/useI18n'

const { t, tm, locale, setLocale } = useI18n()
const route = useRoute()
const activeStep = ref(0)
const casePages = computed(() => [
  { id: 'improve-trading-results', content: tm('landing.useCasePages.improveTradingResults') },
  { id: 'create-trading-system', content: tm('landing.useCasePages.createTradingSystem') },
  { id: 'content-creator', content: tm('landing.useCasePages.contentCreator') }
])

const caseLinks = computed(() => [
  {
    id: 'improve-trading-results',
    label: casePages.value[0].content.title,
    to: '/use-cases?case=improve-trading-results'
  },
  {
    id: 'create-trading-system',
    label: casePages.value[1].content.title,
    to: '/use-cases?case=create-trading-system'
  },
  {
    id: 'content-creator',
    label: t('landing.useCasePages.contentCreatorTitle'),
    to: '/use-cases?case=content-creator'
  }
])

const activeCaseIndex = computed(() => {
  const requestedCase = typeof route.query.case === 'string' ? route.query.case : ''
  const index = casePages.value.findIndex((page) => page.id === requestedCase)
  return index >= 0 ? index : 0
})

const activeCasePage = computed(() => casePages.value[activeCaseIndex.value])
const otherCaseLinks = computed(() => caseLinks.value.filter((item) => item.id !== activeCasePage.value.id))
const activeStepContent = computed(() => activeCasePage.value.content.steps[activeStep.value] || activeCasePage.value.content.steps[0])

const stepperStyle = computed(() => {
  const stepCount = activeCasePage.value.content.steps.length
  return {
    '--step-count': stepCount,
    '--step-line-inset': `${50 / stepCount}%`
  }
})

watch(() => activeCaseIndex.value, () => {
  activeStep.value = 0
})
</script>

<style scoped>
.use-case-page {
  font-family: 'Cormorant Garamond', serif;
}

.use-case-main {
  width: min(100%, 1280px);
  margin: 0 auto;
}

.use-case-stage {
  position: relative;
}

.use-case-more {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 clamp(0px, 1.4vw, 18px) clamp(72px, 10vh, 132px);
}

.use-case-more h2 {
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.5);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.use-case-more__list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  margin-top: 24px;
}

.use-case-more__list a {
  color: rgba(255, 255, 255, 0.62);
  font-size: clamp(1.2rem, 2.2vw, 1.8rem);
  font-weight: 300;
  letter-spacing: 0.01em;
  line-height: 1.2;
  transition: color 180ms ease, transform 180ms ease;
}

.use-case-more__list a:hover {
  color: white;
  transform: translateX(8px);
}

.use-case-content {
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(76px, 11vh, 144px) clamp(0px, 1.4vw, 18px) clamp(72px, 10vh, 132px);
}

.use-case-intro {
  max-width: 780px;
}

.use-case-intro h1 {
  max-width: 760px;
  color: white;
  font-size: clamp(2.8rem, 6.2vw, 6.5rem);
  font-weight: 300;
  letter-spacing: 0.015em;
  line-height: 0.94;
}

.use-case-intro p {
  max-width: 620px;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.62);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(0.95rem, 1.4vw, 1.2rem);
  line-height: 1.55;
}

.use-case-stepper {
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--step-count), minmax(0, 1fr));
  gap: 0;
  margin-top: clamp(64px, 9vh, 116px);
  transform: translateX(clamp(-64px, -5vw, -36px));
}

.use-case-stepper::before {
  position: absolute;
  top: 50%;
  right: var(--step-line-inset);
  left: var(--step-line-inset);
  height: 1px;
  background: rgba(255, 255, 255, 0.25);
  content: '';
}

.use-case-stepper button {
  position: relative;
  z-index: 1;
  display: flex;
  width: clamp(42px, 4.5vw, 58px);
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  justify-self: center;
  background: #070708;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 999px;
  box-shadow: 0 0 0 4px #070708;
  color: white;
  cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: clamp(0.95rem, 1.3vw, 1.15rem);
  font-weight: 400;
  transition: background 180ms ease, color 180ms ease, transform 180ms ease;
}

.use-case-stepper button:hover {
  transform: translateY(-2px);
}

.use-case-stepper button.is-active {
  background: white;
  box-shadow: 0 0 0 4px #070708;
  color: #070708;
}

.use-case-step-content {
  max-width: 760px;
  margin-top: clamp(56px, 8vh, 104px);
  padding-top: 26px;
}

.use-case-step-content__index {
  color: rgba(255, 255, 255, 0.38);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
}

.use-case-step-content h2 {
  margin-top: 22px;
  color: white;
  font-size: clamp(2rem, 3.8vw, 3.6rem);
  font-weight: 300;
  letter-spacing: 0.01em;
  line-height: 1;
}

.use-case-step-content p {
  max-width: 650px;
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.68);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(1rem, 1.5vw, 1.25rem);
  line-height: 1.6;
}

.use-case-fade-enter-active,
.use-case-fade-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.use-case-fade-enter-from,
.use-case-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 640px) {
  .use-case-content {
    padding-top: 64px;
    padding-bottom: 72px;
  }

  .use-case-more {
    padding-bottom: 72px;
  }

  .use-case-intro h1 {
    font-size: clamp(2.5rem, 13vw, 4rem);
  }

  .use-case-stepper {
    gap: 0;
    margin-top: 58px;
    transform: none;
  }

  .use-case-stepper button {
    width: clamp(38px, 12vw, 48px);
  }
}
</style>
