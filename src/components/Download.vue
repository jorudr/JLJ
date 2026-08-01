<template>
  <div class="download-page min-h-screen bg-[#070708] text-white/80">
    <div class="download-shell mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
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

      <main class="download-main flex-1" aria-labelledby="download-title">
        <section class="download-content">
          <div class="download-intro">
            <span class="download-eyebrow">{{ isFullDownload ? t('landing.downloadPage.fullEyebrow') : t('landing.downloadPage.demoEyebrow') }}</span>
            <h1 id="download-title">{{ isFullDownload ? t('landing.downloadPage.fullTitle') : t('landing.downloadPage.demoTitle') }}</h1>
            <p>{{ isFullDownload ? t('landing.downloadPage.fullSubtitle') : t('landing.downloadPage.demoSubtitle') }}</p>
          </div>

          <div class="download-platforms">
            <section class="download-platform" aria-labelledby="download-windows-title">
              <div class="download-platform__heading">
                <span>01</span>
                <h2 id="download-windows-title">{{ t('landing.downloadPage.windows') }}</h2>
              </div>
              <div class="download-version-list">
                <div class="download-version">
                  <div>
                    <strong>v1.0.5</strong>
                    <small>{{ t('landing.downloadPage.latestVersion') }}</small>
                  </div>
                  <a href="https://github.com/jorudr/JLJ/releases/download/v1.0.5/JLJ_1.0.5_x64-setup.exe" download class="download-install-button">
                    <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden="true"><path d="M0 93.6l183.6-25.3v177.4H0V93.6zm203.6-28L448 32v213.6H203.6V65.6zM0 274.5h183.6V443L0 417.6V274.5zm203.6 0H448v213.6L203.6 448V274.5z"></path></svg>
                    <span>{{ t('landing.downloadPage.downloadWindows') }}</span>
                  </a>
                </div>
              </div>
            </section>

            <section class="download-platform" aria-labelledby="download-macos-title">
              <div class="download-platform__heading">
                <span>02</span>
                <h2 id="download-macos-title">{{ t('landing.downloadPage.macos') }}</h2>
              </div>
              <div class="download-version-list">
                <div class="download-version">
                  <div>
                    <strong>v1.0.5</strong>
                    <small>{{ t('landing.downloadPage.latestVersion') }}</small>
                  </div>
                  <a href="https://github.com/jorudr/JLJ/releases/download/v1.0.5/JLJ_1.0.5_universal.dmg" download class="download-install-button">
                    <svg viewBox="0 0 384 512" fill="currentColor" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path></svg>
                    <span>{{ t('landing.downloadPage.downloadMacos') }}</span>
                  </a>
                </div>
              </div>
            </section>
          </div>
        </section>
      </main>

      <footer class="w-full border-t border-white/[0.08] py-8 text-center text-[9px] uppercase tracking-[0.2em] text-white/75" style="font-family: 'Cormorant Garamond', serif;">
        <div class="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-8 sm:flex-row sm:text-left">
          <span class="text-[12px] tracking-[0.14em]">{{ t('landing.footer.company') }}</span>
          <nav class="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[11px] font-medium tracking-[0.14em] text-white/75 sm:justify-end" aria-label="Footer navigation">
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
import { useRoute } from 'vue-router'
import MobileMenu from './MobileMenu.vue'
import { useI18n } from '../shared/i18n/useI18n'

const { t, locale, setLocale } = useI18n()
const route = useRoute()
const isFullDownload = computed(() => route.query.full !== undefined)
</script>

<style scoped>
.download-page {
  font-family: 'Cormorant Garamond', serif;
}

.download-main {
  width: min(100%, 1280px);
  margin: 0 auto;
}

.download-content {
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(76px, 12vh, 150px) clamp(0px, 1.4vw, 18px) clamp(80px, 11vh, 140px);
}

.download-intro {
  max-width: 760px;
}

.download-eyebrow {
  color: rgba(255, 255, 255, 0.4);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.download-intro h1 {
  margin-top: 24px;
  color: white;
  font-size: clamp(3.2rem, 7vw, 7rem);
  font-weight: 300;
  letter-spacing: 0.01em;
  line-height: 0.9;
}

.download-intro p {
  max-width: 620px;
  margin-top: 28px;
  color: rgba(255, 255, 255, 0.62);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(0.95rem, 1.35vw, 1.15rem);
  line-height: 1.6;
}

.download-platforms {
  margin-top: clamp(84px, 13vh, 160px);
}

.download-platform + .download-platform {
  margin-top: 72px;
}

.download-platform__heading {
  display: flex;
  align-items: baseline;
  gap: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
}

.download-platform__heading span {
  color: rgba(255, 255, 255, 0.38);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.14em;
}

.download-platform__heading h2 {
  color: white;
  font-size: clamp(1.8rem, 3.4vw, 3.2rem);
  font-weight: 300;
  letter-spacing: 0.02em;
  line-height: 1;
}

.download-version-list {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.download-version {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: 24px 0;
}

.download-version strong,
.download-version small {
  display: block;
}

.download-version strong {
  color: white;
  font-size: 1.35rem;
  font-weight: 400;
  letter-spacing: 0.04em;
}

.download-version small {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.45);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.65rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.download-install-button {
  display: flex;
  min-width: 230px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
  color: #070708;
  cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  transition: transform 180ms ease, background 180ms ease;
}

.download-install-button:hover {
  background: #f1f1f1;
  transform: translateY(-2px);
}

.download-install-button svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 640px) {
  .download-content {
    padding-top: 68px;
  }

  .download-version {
    flex-direction: column;
    align-items: flex-start;
  }

  .download-install-button {
    width: 100%;
  }
}
</style>
