<template>
  <div class="philosophy-page min-h-screen bg-black text-white/80">
    <div class="philosophy-shell mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
      <SiteNav :always-dark="true" />

      <main class="philosophy-main flex-1" aria-labelledby="philosophy-title">
        <section class="philosophy-content">
          <div class="philosophy-intro">
            <span class="philosophy-eyebrow">{{ t('landing.philosophy.eyebrow') }}</span>
            <h1 id="philosophy-title">{{ t('landing.philosophy.title') }}</h1>
            <p>{{ t('landing.philosophy.intro') }}</p>
          </div>

          <div class="philosophy-principles">
            <article v-for="principle in principles" :key="principle.index" class="philosophy-principle">
              <span class="philosophy-principle__index">{{ principle.index }}</span>
              <div>
                <h2>{{ principle.title }}</h2>
                <div class="philosophy-principle__labels">
                  <span class="philosophy-principle__archetype">{{ principle.archetype }}</span>
                  <span class="philosophy-principle__module">{{ principle.module }}</span>
                </div>
              </div>
              <p>{{ principle.description }}</p>
            </article>
          </div>

          <h2 class="philosophy-principles-label">{{ t('landing.philosophy.principlesLabel') }}</h2>

          <div class="philosophy-closing">
            <div class="philosophy-closing__visual">
              <img src="/assets/eves.svg" alt="J.L.JORMUNGANDR Concept" />
              <div class="philosophy-closing__caption">
                <span>J.L.JÖRMUNGANDR</span>
                <small>// plastic moth</small>
              </div>
              <a class="philosophy-closing__contact" href="mailto:plasticcwc@gmail.com">
                <span class="philosophy-closing__contact-label">{{ t('landing.philosophy.contactLabel') }}</span>
                <strong class="philosophy-closing__contact-email">PLASTICCWC@GMAIL.COM</strong>
                <span class="philosophy-closing__contact-arrow" aria-hidden="true">↗</span>
              </a>
            </div>
            <p class="philosophy-statement">“{{ t('landing.aboutStatement') }}”</p>
          </div>
        </section>
      </main>

      <footer class="w-full border-t border-white/[0.1] py-8 text-center text-[9px] uppercase tracking-[0.2em] text-white/75" style="font-family: 'Cormorant Garamond', serif;">
        <div class="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-8 sm:flex-row sm:text-left">
          <span class="footer-nav-font order-2 self-start text-left text-[12px] tracking-[0.14em] sm:self-auto sm:text-left">{{ t('landing.footer.company') }}</span>
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
import { computed } from 'vue'
import SiteNav from './SiteNav.vue'
import { useI18n } from '../shared/i18n/useI18n'

const { t, tm, locale, setLocale } = useI18n()
const principles = computed(() => tm('landing.philosophy.principles'))
</script>

<style scoped>
.philosophy-page {
  font-family: 'Cormorant Garamond', serif;
  background: #ffffff;
  color: #2c2c2a;
}

.philosophy-main {
  width: min(100%, 1280px);
  margin: 0 auto;
}

.philosophy-content {
  max-width: 1120px;
  margin: 0 auto;
  padding: clamp(88px, 15vh, 180px) clamp(0px, 1.4vw, 18px) clamp(88px, 13vh, 160px);
}

.philosophy-intro {
  max-width: 820px;
}

.philosophy-eyebrow,
.philosophy-principle__index {
  color: rgba(44, 44, 42, 0.5);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.philosophy-intro h1 {
  margin-top: 26px;
  color: #2c2c2a;
  font-size: clamp(4rem, 10vw, 9.5rem);
  font-weight: 300;
  letter-spacing: 0.015em;
  line-height: 0.84;
}

.philosophy-intro p {
  max-width: 980px;
  margin-top: 34px;
  color: rgba(44, 44, 42, 0.72);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(0.95rem, 1.35vw, 1.18rem);
  line-height: 1.48;
}

.philosophy-principles {
  margin-top: clamp(44px, 6vh, 72px);
  border-top: 1px solid rgba(44, 44, 42, 0.2);
}

.philosophy-principles-label {
  margin-top: clamp(96px, 14vh, 170px);
  color: rgba(44, 44, 42, 0.82);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: clamp(0.9rem, 1.35vw, 1.15rem);
  font-weight: 700;
  letter-spacing: 0.2em;
  line-height: 1.2;
  text-align: center;
  text-transform: uppercase;
}

.philosophy-principle {
  display: grid;
  grid-template-columns: 96px minmax(220px, 0.8fr) minmax(280px, 1.2fr);
  gap: clamp(24px, 5vw, 80px);
  padding: 28px 0 34px;
  border-bottom: 1px solid rgba(44, 44, 42, 0.16);
}

.philosophy-principle h2 {
  color: #2c2c2a;
  font-size: clamp(1.65rem, 3vw, 2.8rem);
  font-weight: 300;
  letter-spacing: 0.02em;
  line-height: 1;
}

.philosophy-principle__module {
  color: rgba(44, 44, 42, 0.48);
}

.philosophy-principle__labels {
  display: flex;
  margin-top: 12px;
  align-items: baseline;
  gap: 18px;
  color: rgba(44, 44, 42, 0.48);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  line-height: 1.3;
}

.philosophy-principle__archetype {
  color: rgba(44, 44, 42, 0.72);
}

.philosophy-principle__module {
  color: rgba(44, 44, 42, 0.48);
}

.philosophy-principle p {
  max-width: 540px;
  color: rgba(44, 44, 42, 0.68);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(0.95rem, 1.25vw, 1.1rem);
  line-height: 1.65;
}

.philosophy-closing {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1.1fr);
  gap: clamp(48px, 9vw, 140px);
  margin-top: clamp(100px, 15vh, 180px);
  align-items: center;
}

.philosophy-closing__visual {
  opacity: 0.78;
  transition: opacity 180ms ease;
}

.philosophy-closing__visual:hover {
  opacity: 1;
}

.philosophy-closing__visual img {
  display: block;
  width: min(100%, 430px);
  height: auto;
  margin: 0 auto;
}

.philosophy-closing__caption {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid rgba(44, 44, 42, 0.2);
  color: rgba(44, 44, 42, 0.85);
  align-items: center;
  font-size: clamp(0.95rem, 1.2vw, 1.1rem);
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.philosophy-closing__caption small {
  color: rgba(44, 44, 42, 0.45);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: clamp(0.72rem, 0.9vw, 0.85rem);
  letter-spacing: 0.12em;
}

.philosophy-closing__contact {
  display: flex;
  margin-top: 18px;
  padding: 14px 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid rgba(44, 44, 42, 0.14);
  border-bottom: 1px solid rgba(44, 44, 42, 0.14);
  color: rgba(44, 44, 42, 0.58);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  transition: color 180ms ease;
}

.philosophy-closing__contact:hover {
  color: #2c2c2a;
}

.philosophy-closing__contact-label {
  color: rgba(44, 44, 42, 0.45);
  font-size: 0.58rem;
  letter-spacing: 0.12em;
}

.philosophy-closing__contact-email {
  color: #2c2c2a;
  font-size: 0.72rem;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.philosophy-closing__contact-arrow {
  color: rgba(44, 44, 42, 0.45);
  font-size: 1rem;
}

.philosophy-statement {
  max-width: 680px;
  color: rgba(44, 44, 42, 0.78);
  font-size: clamp(1.8rem, 3.6vw, 3.5rem);
  font-style: italic;
  font-weight: 300;
  letter-spacing: 0.01em;
  line-height: 1.25;
}

@media (max-width: 700px) {
  .philosophy-content {
    padding-top: 64px;
    padding-bottom: 72px;
  }

  .philosophy-intro h1 {
    margin-top: 20px;
    max-width: 100%;
    font-size: clamp(2.4rem, 12vw, 4.2rem);
    letter-spacing: 0;
    line-height: 0.9;
    overflow-wrap: anywhere;
  }

  .philosophy-intro p {
    margin-top: 24px;
    font-size: 0.92rem;
    line-height: 1.55;
  }

  .philosophy-principles {
    margin-top: 48px;
  }

  .philosophy-principle {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px 0 24px;
  }

  .philosophy-principle h2 {
    font-size: clamp(1.6rem, 8vw, 2.2rem);
    line-height: 1.05;
  }

  .philosophy-principle__labels {
    flex-wrap: wrap;
    gap: 8px 14px;
    font-size: 0.58rem;
  }

  .philosophy-principle p {
    max-width: none;
    font-size: 0.92rem;
    line-height: 1.55;
  }

  .philosophy-principles-label {
    margin-top: 72px;
    font-size: 0.78rem;
    letter-spacing: 0.14em;
  }

  .philosophy-closing {
    display: flex;
    flex-direction: column;
    gap: 40px;
    margin-top: 64px;
    align-items: stretch;
  }

  .philosophy-closing__visual img {
    width: min(100%, 360px);
  }

  .philosophy-closing__caption {
    gap: 8px;
    margin-top: 20px;
    padding-top: 14px;
    font-size: 0.82rem;
    letter-spacing: 0.1em;
  }

  .philosophy-closing__caption small {
    font-size: 0.62rem;
  }

  .philosophy-closing__contact {
    flex-wrap: wrap;
    width: 100%;
    gap: 8px 12px;
  }

  .philosophy-closing__contact-label {
    width: 100%;
  }

  .philosophy-closing__contact-email {
    font-size: 0.64rem;
    letter-spacing: 0.06em;
  }

  .philosophy-statement {
    max-width: none;
    font-size: clamp(1.7rem, 8.5vw, 2.7rem);
    line-height: 1.2;
  }
}
</style>
