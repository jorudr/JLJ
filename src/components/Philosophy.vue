<template>
  <div class="philosophy-page min-h-screen bg-white text-[#2c2c2a]/80">
    <div class="philosophy-shell mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
      <header class="relative mx-auto flex w-full max-w-[1280px] items-center justify-between text-[10px] tracking-[0.3em]">
        <router-link to="/" class="flex items-center space-x-6" aria-label="J.L.JÖRMUNGANDR home">
          <div class="relative flex h-5 w-5 shrink-0 items-center justify-center sm:h-6 sm:w-6">
            <div class="absolute inset-0 animate-[spin_10s_linear_infinite] border border-black/40"></div>
            <div class="absolute inset-1 animate-[spin_6s_linear_infinite_reverse] border border-black/60"></div>
            <div class="h-1 w-1 rotate-45 animate-pulse bg-[#2c2c2a]"></div>
            <div class="absolute -left-0.5 -top-0.5 h-1.5 w-1.5 border-l border-t border-[#2c2c2a]"></div>
            <div class="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 border-b border-r border-[#2c2c2a]"></div>
          </div>
          <span class="text-[12px] font-light uppercase tracking-[0.5em] text-[#2c2c2a] sm:text-[14px]" style="font-family: 'Cormorant Garamond', serif;">J.L.JÖRMUNGANDR</span>
        </router-link>

        <nav class="absolute left-1/2 hidden -translate-x-1/2 items-center space-x-8 whitespace-nowrap text-[16px] tracking-[0.15rem] md:flex" aria-label="Primary navigation" style="font-family: 'Cormorant Garamond', serif;">
          <router-link to="/" class="flex items-center text-[#2c2c2a]/80 transition-colors hover:opacity-50">
            {{ t('landing.nav.products') }}
            <svg class="ml-1.5 h-3.5 w-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </router-link>
          <router-link to="/use-cases" class="flex items-center text-[#2c2c2a]/80 transition-colors hover:opacity-50">
            {{ t('landing.nav.useCases') }}
            <svg class="ml-1.5 h-3.5 w-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
          </router-link>
          <router-link to="/pricing" class="text-[#2c2c2a]/80 transition-colors hover:opacity-50">{{ t('landing.nav.pricing') }}</router-link>
          <router-link to="/philosophy" class="text-[#2c2c2a] transition-colors hover:opacity-50">{{ t('landing.nav.philosophy') }}</router-link>
        </nav>

        <div class="flex items-center space-x-4">
          <button @click="setLocale('en')" class="cursor-pointer transition-colors hover:text-[#2c2c2a]/50" :class="locale === 'en' ? 'font-bold text-[#2c2c2a]' : 'text-[#2c2c2a]/50'">EN</button>
          <span class="text-[#2c2c2a]/30">/</span>
          <button @click="setLocale('ru')" class="cursor-pointer transition-colors hover:text-[#2c2c2a]/50" :class="locale === 'ru' ? 'font-bold text-[#2c2c2a]' : 'text-[#2c2c2a]/50'">RU</button>
        </div>
      </header>

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
            </div>
            <p class="philosophy-statement">“{{ t('landing.aboutStatement') }}”</p>
          </div>
        </section>
      </main>

      <footer class="w-full border-t border-black/[0.1] py-8 text-center text-[9px] uppercase tracking-[0.2em] text-[#2c2c2a]/75" style="font-family: 'Cormorant Garamond', serif;">
        <div class="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-8 sm:flex-row sm:text-left">
          <span class="text-[12px] tracking-[0.14em]">{{ t('landing.footer.company') }}</span>
          <nav class="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[11px] font-medium tracking-[0.14em] text-[#2c2c2a]/75 sm:justify-end" aria-label="Footer navigation">
            <router-link to="/" class="transition-colors hover:text-[#2c2c2a]">{{ t('landing.nav.products') }}</router-link>
            <router-link to="/use-cases" class="transition-colors hover:text-[#2c2c2a]">{{ t('landing.nav.useCases') }}</router-link>
            <router-link to="/pricing" class="transition-colors hover:text-[#2c2c2a]">{{ t('landing.nav.pricing') }}</router-link>
            <router-link to="/philosophy" class="transition-colors hover:text-[#2c2c2a]">{{ t('landing.nav.philosophy') }}</router-link>
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
    padding-top: 82px;
    padding-bottom: 80px;
  }

  .philosophy-intro h1 {
    font-size: clamp(3.8rem, 19vw, 6rem);
  }

  .philosophy-principles {
    margin-top: 72px;
  }

  .philosophy-principle {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px 0 28px;
  }

  .philosophy-principle__labels {
    flex-wrap: wrap;
    gap: 8px 14px;
  }

  .philosophy-closing {
    display: flex;
    flex-direction: column;
    gap: 56px;
    margin-top: 92px;
    align-items: stretch;
  }

  .philosophy-closing__visual img {
    width: min(100%, 360px);
  }
}
</style>
