<template>
  <div class="announcement-page min-h-screen bg-black text-white/80">
    <div class="announcement-shell mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
      <SiteNav :always-dark="true" />

      <main class="announcement-main flex-1" aria-labelledby="announcement-title">
        <section class="announcement-content">
          <span class="announcement-eyebrow">{{ t('landing.announcement.eyebrow') }}</span>
          <h1 id="announcement-title">
            {{ t('landing.announcement.titleLine1') }}<br />{{ t('landing.announcement.titleLine2') }}
          </h1>
          <p>{{ t('landing.announcement.description') }}</p>
          <time class="announcement-date" datetime="2026-08-20">{{ t('landing.announcement.date') }}</time>

          <a href="https://t.me/gandr_trade" target="_blank" rel="noreferrer" class="announcement-telegram">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M21.4 3.4 2.8 10.6c-1.3.5-1.3 1.3-.2 1.6l4.7 1.5 1.8 5.6c.2.6.1.8.8.8.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.6.3 1.8-.8l3.1-14.6c.3-1.4-.5-2-1.7-1.5Z" fill="currentColor" />
            </svg>
            <span>{{ t('landing.announcement.follow') }}</span>
          </a>
          <span class="announcement-channel">{{ t('landing.announcement.channel') }}</span>
        </section>
      </main>

      <footer class="w-full border-t border-white/[0.08] py-8 text-center text-[9px] uppercase tracking-[0.2em] text-white/75" style="font-family: 'Cormorant Garamond', serif;">
        <div class="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-8 sm:flex-row sm:text-left">
          <span class="footer-nav-font order-2 self-start text-left text-[12px] tracking-[0.14em] sm:self-auto">{{ t('landing.footer.company') }}</span>
          <nav class="footer-nav-font order-1 flex w-full flex-col items-start justify-start gap-4 text-[11px] font-medium tracking-[0.14em] text-white/75 sm:w-auto sm:flex-row sm:items-center sm:gap-x-10 sm:gap-y-3 sm:justify-end" aria-label="Footer navigation">
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
import SiteNav from './SiteNav.vue'
import { useI18n } from '../shared/i18n/useI18n'

const { t } = useI18n()
</script>

<style scoped>
.announcement-page {
  font-family: 'Cormorant Garamond', serif;
}

.announcement-main {
  display: flex;
  width: min(100%, 1280px);
  margin: 0 auto;
  align-items: center;
  justify-content: center;
}

.announcement-content {
  display: flex;
  width: min(100%, 820px);
  padding: clamp(96px, 16vh, 190px) 0 clamp(100px, 16vh, 190px);
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.announcement-eyebrow,
.announcement-channel {
  color: rgba(255, 255, 255, 0.42);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.announcement-content h1 {
  max-width: 760px;
  margin-top: 28px;
  color: white;
  font-size: clamp(3rem, 8vw, 7.5rem);
  font-weight: 300;
  letter-spacing: 0.01em;
  line-height: 0.9;
}

.announcement-content p {
  max-width: 580px;
  margin-top: 32px;
  color: rgba(255, 255, 255, 0.62);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  line-height: 1.6;
}

.announcement-date {
  margin-top: 42px;
  color: white;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: clamp(1rem, 1.5vw, 1.25rem);
  letter-spacing: 0.18em;
}

.announcement-telegram {
  display: inline-flex;
  margin-top: 58px;
  align-items: center;
  gap: 14px;
  color: white;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  transition: opacity 180ms ease, transform 180ms ease;
}

.announcement-telegram:hover {
  opacity: 0.65;
  transform: translateY(-2px);
}

.announcement-telegram svg {
  width: 30px;
  height: 30px;
  color: #ffffff;
}

.announcement-channel {
  margin-top: 16px;
  color: rgba(255, 255, 255, 0.58);
}

@media (max-width: 767px) {
  .announcement-content {
    padding: 76px 0 88px;
  }

  .announcement-content h1 {
    max-width: 100%;
    font-size: clamp(2.8rem, 14vw, 4.4rem);
    line-height: 0.92;
    overflow-wrap: anywhere;
  }

  .announcement-content p {
    margin-top: 24px;
    font-size: 0.94rem;
    line-height: 1.55;
  }

  .announcement-date {
    margin-top: 32px;
    font-size: 0.85rem;
  }

  .announcement-telegram {
    margin-top: 44px;
    font-size: 0.64rem;
  }
}
</style>
