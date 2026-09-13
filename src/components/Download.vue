<template>
  <div class="download-page min-h-screen bg-black text-white/80">
    <div class="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
      <SiteNav :always-dark="true" />
      <main class="download-main" aria-labelledby="download-title" :lang="locale">
        <header class="download-intro">
          <h1 id="download-title">{{ t('landing.downloadPage.title') }}</h1>
          <p>{{ t('landing.downloadPage.subtitle') }}</p>
        </header>
        <section class="download-card" :aria-label="t('landing.downloadPage.title')">
          <p class="download-description">{{ t('landing.downloadPage.appDescription') }}</p>
          <div class="download-actions">
            <a v-for="platform in downloads" :key="platform.id" :href="platform.url" download class="download-button">
              <div class="download-button__label">
                <svg v-if="platform.id === 'windows'" class="platform-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M0 0h11v11H0zM13 0h11v11H13zM0 13h11v11H0zM13 13h11v11H13z"/>
                </svg>
                <svg v-else-if="platform.id === 'macos'" class="platform-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.84.94-2.91-.91.04-2.03.61-2.68 1.38-.58.67-1.09 1.76-.95 2.81 1.02.08 2.06-.51 2.69-1.28z"/>
                </svg>
                <span>{{ t(platform.label) }}</span>
              </div>
              <span class="download-arrow" aria-hidden="true">↓</span>
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
.download-intro { text-align: start; margin-bottom: clamp(40px, 6vw, 64px); }
.download-intro h1 { font-size: clamp(2.7rem, 6vw, 5.4rem); font-weight: 300; line-height: 1; }
.download-intro p { max-width: 620px; margin: 24px 0 0; color: rgba(255,255,255,.6); }
.download-intro p, .download-description, .download-help p { font-family: ui-sans-serif, system-ui, sans-serif; font-size: .95rem; line-height: 1.6; }
.download-card { width: 100%; margin: 0; padding: clamp(28px, 4vw, 48px); border: 1px solid #f5f5f0; background: #f5f5f0; color: #000; display: flex; flex-direction: column; min-width: 0; }
.download-description { margin: 0 0 28px; font-size: 1.05rem; opacity: .75; max-width: 720px; }
.download-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.download-button { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 18px 22px; border: 1px solid #000; background: #000; color: #f5f5f0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .84rem; letter-spacing: .04em; transition: background 180ms ease, color 180ms ease; }
.download-button__label { display: flex; align-items: center; gap: 12px; }
.platform-icon { flex-shrink: 0; opacity: .9; }
.download-arrow { font-size: .95rem; opacity: .7; }
.download-button:hover { background: #242424; }
.download-button:focus-visible { outline-color: #000; }
.download-link { display: inline-block; margin-top: 28px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: .88rem; text-decoration: underline; text-underline-offset: 4px; }
a:focus-visible { outline: 2px solid currentColor; outline-offset: 5px; }
.download-help { width: 100%; margin: 56px 0 0; padding-top: 36px; border-top: 1px solid rgba(255,255,255,.18); }
.download-help h2 { font-size: clamp(1.8rem, 3.5vw, 2.4rem); font-weight: 300; }
.download-help p { color: rgba(255,255,255,.6); margin: 12px 0 20px; max-width: 680px; }
.download-help a { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .85rem; text-decoration: underline; text-underline-offset: 4px; }
.download-help a:hover { opacity: .8; }

@media (max-width: 640px) {
  .download-actions { grid-template-columns: 1fr; }
  .download-card { padding: 24px 20px; }
}
</style>
