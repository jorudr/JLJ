<template>
  <div class="not-found-page min-h-screen bg-[#070708] text-white/80">
    <div class="not-found-shell mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
      <header class="relative mx-auto flex w-full max-w-[1280px] items-center justify-between text-[10px] tracking-[0.3em]">
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

        <nav class="absolute left-1/2 hidden -translate-x-1/2 items-center space-x-8 whitespace-nowrap text-[16px] tracking-[0.15rem] md:flex" aria-label="Primary navigation" style="font-family: 'Cormorant Garamond', serif;">
          <router-link to="/" class="text-white/80 transition-colors hover:opacity-50">{{ t('landing.nav.products') }}</router-link>
          <router-link to="/use-cases" class="text-white/80 transition-colors hover:opacity-50">{{ t('landing.nav.useCases') }}</router-link>
          <router-link to="/pricing" class="text-white/80 transition-colors hover:opacity-50">{{ t('landing.nav.pricing') }}</router-link>
          <router-link to="/" class="text-white/80 transition-colors hover:opacity-50">{{ t('landing.nav.philosophy') }}</router-link>
        </nav>

        <div class="flex items-center space-x-4">
          <button @click="setLocale('en')" class="transition-colors hover:text-white/50" :class="locale === 'en' ? 'font-bold text-white' : 'text-white/50'">EN</button>
          <span class="text-white/30">/</span>
          <button @click="setLocale('ru')" class="transition-colors hover:text-white/50" :class="locale === 'ru' ? 'font-bold text-white' : 'text-white/50'">RU</button>
        </div>
      </header>

      <main class="not-found-main flex flex-1 items-center justify-center">
        <section class="not-found-content" aria-labelledby="not-found-title">
          <span class="not-found-code">404</span>
          <h1 id="not-found-title">{{ t('landing.notFound.title') }}</h1>
          <p>{{ t('landing.notFound.subtitle') }}</p>
          <router-link to="/" class="not-found-action">
            {{ t('landing.notFound.backHome') }} <span aria-hidden="true">↗</span>
          </router-link>
        </section>
      </main>

      <footer class="w-full border-t border-white/[0.08] py-8 text-center text-[9px] uppercase tracking-[0.2em] text-white/75" style="font-family: 'Cormorant Garamond', serif;">
        <div class="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-8 sm:flex-row sm:text-left">
          <span class="text-[12px] tracking-[0.14em]">{{ t('landing.footer.company') }}</span>
          <nav class="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[11px] font-medium tracking-[0.14em] text-white/75 sm:justify-end" aria-label="Footer navigation">
            <router-link to="/" class="transition-colors hover:text-white">{{ t('landing.nav.products') }}</router-link>
            <router-link to="/use-cases" class="transition-colors hover:text-white">{{ t('landing.nav.useCases') }}</router-link>
            <router-link to="/pricing" class="transition-colors hover:text-white">{{ t('landing.nav.pricing') }}</router-link>
            <router-link to="/" class="transition-colors hover:text-white">{{ t('landing.nav.philosophy') }}</router-link>
          </nav>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '../shared/i18n/useI18n'

const { t, locale, setLocale } = useI18n()
</script>

<style scoped>
.not-found-page {
  font-family: 'Cormorant Garamond', serif;
}

.not-found-main {
  width: min(100%, 1280px);
  margin: 0 auto;
}

.not-found-content {
  width: min(100%, 760px);
  padding: clamp(80px, 16vh, 180px) 0;
  text-align: center;
}

.not-found-code {
  color: rgba(255, 255, 255, 0.35);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.25em;
}

.not-found-content h1 {
  margin-top: 28px;
  color: white;
  font-size: clamp(3.5rem, 9vw, 8rem);
  font-weight: 300;
  letter-spacing: 0.01em;
  line-height: 0.9;
}

.not-found-content p {
  max-width: 440px;
  margin: 26px auto 0;
  color: rgba(255, 255, 255, 0.58);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(0.95rem, 1.4vw, 1.15rem);
  line-height: 1.6;
}

.not-found-action {
  display: inline-flex;
  margin-top: 40px;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.55);
  padding-bottom: 8px;
  color: white;
  font-size: 0.85rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  transition: opacity 180ms ease;
}

.not-found-action:hover {
  opacity: 0.55;
}
</style>
