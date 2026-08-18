<template>
  <div class="not-found-page min-h-screen bg-black text-white/80">
    <div class="not-found-shell mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
      <SiteNav :always-dark="true" />

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

      <AppFooter />
    </div>
  </div>
</template>

<script setup>
import SiteNav from './SiteNav.vue'
import AppFooter from './AppFooter.vue'
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
