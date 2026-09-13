<template>
  <div class="download-page min-h-screen bg-black text-white/80">
    <div class="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
      <SiteNav :always-dark="true" />
      <main class="download-main" aria-labelledby="download-title" :lang="locale">
        <header class="download-intro">
          <h1 id="download-title">{{ t('landing.downloadPage.title') }}</h1>
          <p>{{ t('landing.downloadPage.subtitle') }}</p>
        </header>
          <section class="download-card" aria-labelledby="download-app-title">
            <h2 id="download-app-title">J.L.JÖRMUNGANDR</h2>
            <p class="download-description">{{ t('landing.downloadPage.appDescription') }}</p>
            <div class="download-actions">
              <a v-for="platform in downloads" :key="platform.id" :href="platform.url" download class="download-button">
                <span>{{ t(platform.label) }}</span><span aria-hidden="true">↓</span>
              </a>
            </div>
            <router-link to="/pricing" class="download-link">{{ t('landing.downloadPage.compare') }} ↗</router-link>
          </section>
        <section class="download-help" aria-labelledby="download-help-title">
          <h2 id="download-help-title">{{ t('landing.downloadPage.helpTitle') }}</h2>
          <p>{{ t('landing.downloadPage.helpText') }}</p>
          <a href="https://t.me/gandr_trade" target="_blank" rel="noreferrer">Telegram ↗</a>
        </section>
      </main>
      <AppFooter hide-hero />
    </div>
  </div>
</template>

<script setup>
import SiteNav from './SiteNav.vue'
import AppFooter from './AppFooter.vue'
import { useI18n } from '../shared/i18n/useI18n'
import { downloads } from '../shared/downloads'

const { t, locale } = useI18n()
</script>

<style scoped>
.download-page { font-family: 'Cormorant Garamond', serif; }
.download-main { width: min(100%, 1060px); margin: 0 auto; padding: clamp(88px, 10vw, 140px) 0 72px; flex: 1; }
.download-intro { text-align: start; margin-bottom: clamp(40px, 6vw, 72px); }
.download-intro h1 { font-size: clamp(2.7rem, 6vw, 5.4rem); font-weight: 300; line-height: 1; }
.download-intro p { max-width: 580px; margin: 24px 0 0; color: rgba(255,255,255,.6); }
.download-intro p, .download-description, .download-help p { font-family: ui-sans-serif, system-ui, sans-serif; font-size: .95rem; line-height: 1.6; }
.download-card { width: min(100%, 620px); margin: 0; padding: clamp(24px, 3.2vw, 42px); border: 1px solid #f5f5f0; background: #f5f5f0; color: #000; display: flex; flex-direction: column; min-width: 0; }
.download-card h2 { font-size: clamp(1.65rem, 5vw, 3rem); font-weight: 300; line-height: 1; }
.download-description { margin: 18px 0 30px; opacity: .65; }
.download-actions { display: grid; gap: 12px; }
.download-button { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px; border: 1px solid #000; background: #000; color: #f5f5f0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .8rem; }
.download-button:hover { background: #242424; }
.download-button:focus-visible { outline-color: #000; }
.download-link { display: inline-block; margin-top: 24px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: .85rem; text-decoration: underline; text-underline-offset: 4px; }
a:focus-visible { outline: 2px solid currentColor; outline-offset: 5px; }
.download-help { width: min(100%, 620px); margin: 48px 0 0; padding-top: 32px; border-top: 1px solid rgba(255,255,255,.18); }
.download-help h2 { font-size: 2rem; font-weight: 300; }
.download-help p { color: rgba(255,255,255,.6); margin: 12px 0 18px; max-width: 620px; }
.download-help a { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .85rem; }
</style>
