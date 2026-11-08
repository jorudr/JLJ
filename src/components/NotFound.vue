<template>
  <div class="d" :lang="isRu ? 'ru' : 'en'">
    <!-- BAR -->
    <BarHeader />

    <!-- 404 HERO -->
    <section class="nf-hero" aria-labelledby="nf-title">
      <div class="label mono">
        <span>00 // {{ isRu ? 'ОШИБКА' : 'ERROR' }}</span>
        <span>{{ isRu ? 'СТРАНИЦА НЕ НАЙДЕНА' : 'PAGE NOT FOUND' }}</span>
      </div>

      <div class="nf-hero__body">
        <span class="nf-hero__code">404</span>
        <h1 id="nf-title" class="nf-hero__title">
          {{ isRu ? 'СТРАНИЦА НЕ НАЙДЕНА.' : 'PAGE NOT FOUND.' }}
        </h1>
        <p class="nf-hero__sub">
          {{ isRu ? 'Запрошенный адрес не существует, был перемещён или удалён. Вернитесь на главную или воспользуйтесь разделами ниже.' : 'The route you requested does not exist, has been removed or relocated. Return home or explore the sections below.' }}
        </p>

        <div class="nf-hero__actions">
          <router-link :to="isRu ? '/ru/' : '/'" class="btn">
            <span>{{ isRu ? 'На главную' : 'Return home' }}</span>
            <span aria-hidden="true">→</span>
          </router-link>
          <router-link :to="isRu ? '/ru/download' : '/download'" class="btn btn--line">
            <span>{{ isRu ? 'Скачать дневник' : 'Download free' }}</span>
            <span aria-hidden="true">↓</span>
          </router-link>
          <router-link :to="isRu ? '/ru/pricing' : '/pricing'" class="btn btn--line">
            <span>{{ isRu ? 'Тарифы' : 'Pricing' }}</span>
            <span aria-hidden="true">↗</span>
          </router-link>
        </div>
      </div>
    </section>

    <!-- DIRECTORY GRID -->
    <section class="nf-grid" aria-label="Suggested sections">
      <router-link :to="isRu ? '/ru/' : '/'" class="nf-card">
        <div class="nf-card__top">
          <span class="mono">01 // {{ isRu ? 'ОБЗОР' : 'OVERVIEW' }}</span>
          <span class="mono">JORU</span>
        </div>
        <div class="nf-card__body">
          <h2 class="nf-card__title">{{ isRu ? 'Главная' : 'Home' }}</h2>
          <p class="nf-card__desc">{{ isRu ? 'Обзор журнала сделок, поиск убыточных паттернов Karl-Nikolai, матрица стратегий.' : 'Trade journal overview, Karl-Nikolai habit detection, Genesis Matrix.' }}</p>
        </div>
        <div class="nf-card__footer">
          <span>{{ isRu ? 'Перейти' : 'Explore' }}</span>
          <span aria-hidden="true">↗</span>
        </div>
      </router-link>

      <router-link :to="isRu ? '/ru/download' : '/download'" class="nf-card">
        <div class="nf-card__top">
          <span class="mono">02 // {{ isRu ? 'УСТАНОВКА' : 'INSTALL' }}</span>
          <span class="mono">DESKTOP</span>
        </div>
        <div class="nf-card__body">
          <h2 class="nf-card__title">{{ isRu ? 'Скачать' : 'Download' }}</h2>
          <p class="nf-card__desc">{{ isRu ? 'Бесплатные установщики для Windows 10/11 и macOS (Apple Silicon и Intel).' : 'Free desktop installers for Windows 10/11 and macOS (Apple Silicon & Intel).' }}</p>
        </div>
        <div class="nf-card__footer">
          <span>{{ isRu ? 'Установить' : 'Get app' }}</span>
          <span aria-hidden="true">↓</span>
        </div>
      </router-link>

      <router-link :to="isRu ? '/ru/pricing' : '/pricing'" class="nf-card">
        <div class="nf-card__top">
          <span class="mono">03 // {{ isRu ? 'ТАРИФЫ' : 'PLANS' }}</span>
          <span class="mono">$0 / FULL</span>
        </div>
        <div class="nf-card__body">
          <h2 class="nf-card__title">{{ isRu ? 'Тарифы' : 'Pricing' }}</h2>
          <p class="nf-card__desc">{{ isRu ? 'Бесплатный дневник без лимита по времени и расширенная аналитика Full.' : 'Free trading journal forever ($0) and advanced Full analytics.' }}</p>
        </div>
        <div class="nf-card__footer">
          <span>{{ isRu ? 'Сравнить' : 'Compare' }}</span>
          <span aria-hidden="true">↗</span>
        </div>
      </router-link>
    </section>
  </div>

  <!-- BACK COVER / FOOTER -->
  <footer class="end-wrap">
    <div class="d end">
      <h2 class="end__title" v-html="copy.footer.title"></h2>
      <div class="end__actions">
        <a v-for="item in downloads" :key="item.id" :href="item.url" class="btn btn--paper">{{ copy.footer.downloadFor }} {{ item.name }} <span aria-hidden="true">↓</span></a>
      </div>
      <div class="end__foot">
        <span class="end__foot-copy">Jörmungandr © {{ year }}</span>
        <div class="end__foot-aside">
          <div class="end__foot-links">
            <router-link :to="isRu ? '/ru/terms' : '/terms'">{{ copy.footer.terms }}</router-link>
            <span class="end__foot-sep" aria-hidden="true">·</span>
            <router-link :to="isRu ? '/ru/privacy' : '/privacy'">{{ copy.footer.privacy }}</router-link>
            <span class="end__foot-sep" aria-hidden="true">·</span>
            <a href="https://t.me/gandr_trade" target="_blank" rel="noopener">Telegram</a>
          </div>
          <div class="end__foot-lang">
            <LangDropdown />
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../shared/i18n/useI18n'
import { landingCopy } from '../shared/i18n/landingCopy.js'
import { downloads, refreshDownloads } from '../shared/downloads.js'
import LangDropdown from './LangDropdown.vue'
import BarHeader from './BarHeader.vue'

const route = useRoute()
const { locale } = useI18n()
const isRu = computed(() => locale.value === 'ru' || route.path.startsWith('/ru'))
const copy = computed(() => landingCopy[isRu.value ? 'ru' : 'en'])
const year = new Date().getFullYear()

const FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700;800;900&family=JetBrains+Mono:wght@400;500&display=swap'

let fontLink = null
onMounted(() => {
  if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
    fontLink = document.createElement('link')
    fontLink.rel = 'stylesheet'
    fontLink.href = FONT_HREF
    document.head.appendChild(fontLink)
  }
  refreshDownloads()
})

onBeforeUnmount(() => {
  fontLink?.remove()
})
</script>

<style scoped>
.d {
  --edge: clamp(14px, 1.6cqw, 24px);
  --gut: clamp(14px, 1.5cqw, 22px);
  --sans: 'Inter Tight', 'Helvetica Neue', Arial, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  background: #fff;
  color: #000;
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.15;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  max-width: 1440px;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  container-type: inline-size;
  overflow-x: clip;
}
.d *, .d *::before, .d *::after { box-sizing: border-box; }
.d a { color: inherit; text-decoration: none; }
.d :focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
.mono { font-family: var(--mono); font-size: 12px; font-weight: 400; letter-spacing: 0.04em; text-transform: uppercase; line-height: 1.2; margin: 0; }

/* buttons */
.d a.btn { display: inline-flex; justify-content: space-between; gap: 12px; align-items: center; padding: 16px 18px 15px; background: #000; color: #fff; border: 2px solid #000; font-weight: 800; text-transform: uppercase; letter-spacing: -0.01em; font-size: 16px; transition: background 0.1s, color 0.1s; }
.d a.btn:hover { background: #fff; color: #000; }
.d a.btn--line { background: transparent; color: #000; }
.d a.btn--line:hover { background: #000; color: #fff; }
.d a.btn--paper { background: #fff; color: #000; border-color: #fff; }
.d a.btn--paper:hover { background: #000; color: #fff; }

/* ── Labels ────────────────────────────────────────── */
.label { display: flex; justify-content: space-between; padding: 12px var(--edge) 11px; border-bottom: 2px solid #000; }

/* ── Hero ──────────────────────────────────────────── */
.nf-hero { border-bottom: 2px solid #000; }
.nf-hero__body { padding: clamp(40px, 6.5cqw, 96px) var(--edge) clamp(36px, 5.5cqw, 72px); }
.nf-hero__code {
  font-family: 'Inter Tight', var(--wide, var(--sans));
  font-weight: 900;
  font-size: clamp(84px, 15cqw, 220px);
  line-height: 0.82;
  letter-spacing: -0.06em;
  color: #000;
  display: block;
  margin-bottom: clamp(14px, 2cqw, 24px);
  margin-left: -0.03em;
}
.nf-hero__title {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 0.94;
  font-size: clamp(32px, 5.2cqw, 76px);
  max-width: 24ch;
  text-transform: uppercase;
}
.nf-hero__sub {
  margin: clamp(16px, 2cqw, 28px) 0 0;
  font-size: clamp(16px, 1.3cqw, 22px);
  line-height: 1.3;
  letter-spacing: -0.01em;
  max-width: 54ch;
  color: #4a4a4a;
}
.nf-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: clamp(28px, 3.6cqw, 48px);
}

/* ── Grid ──────────────────────────────────────────── */
.nf-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 2px solid #000;
}
.nf-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 2px solid #000;
  min-height: 260px;
  text-decoration: none !important;
  color: #000;
  background: #fff;
  transition: background 0.12s ease, color 0.12s ease;
}
.nf-card:last-child {
  border-right: 0;
}
.nf-card:hover {
  background: #000;
  color: #fff;
}
.nf-card:hover .nf-card__desc {
  color: rgba(255, 255, 255, 0.75);
}
.nf-card:hover .nf-card__top,
.nf-card:hover .nf-card__footer {
  border-color: rgba(255, 255, 255, 0.25);
}
.nf-card__top {
  display: flex;
  justify-content: space-between;
  padding: 12px var(--edge);
  border-bottom: 2px solid #000;
  transition: border-color 0.12s ease;
}
.nf-card__body {
  padding: var(--edge);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.nf-card__title {
  margin: 0;
  font-weight: 800;
  font-size: clamp(28px, 3.4cqw, 46px);
  letter-spacing: -0.03em;
  line-height: 1;
  text-transform: uppercase;
}
.nf-card__desc {
  margin: 0;
  font-size: clamp(13px, 1.05cqw, 15px);
  line-height: 1.35;
  color: #4a4a4a;
  max-width: 34ch;
  transition: color 0.12s ease;
}
.nf-card__footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px var(--edge);
  border-top: 2px solid #000;
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  transition: border-color 0.12s ease;
}

/* ── Back cover ────────────────────────────────────── */
.d.end,
.end {
  background: #000;
  color: #fff;
  padding: clamp(32px, 4cqw, 56px) var(--edge) clamp(20px, 2.5cqw, 36px);
  display: flex;
  flex-direction: column;
  gap: clamp(24px, 4cqw, 56px);
  min-height: 85vh;
  box-sizing: border-box;
}
.end__title {
  margin: clamp(32px, 6cqw, 100px) 0 0;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.04em;
  line-height: 0.82;
  font-size: clamp(54px, 13cqw, 240px);
  margin-left: -0.02em;
}
.end__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.end__foot {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  padding-top: 28px;
  border-top: 2px solid #fff;
  font-family: var(--sans);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.end__foot a {
  text-decoration: none;
  transition: opacity 0.1s;
}
.end__foot a:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 2px;
}
.end__foot-copy {
  font-weight: 700;
  letter-spacing: -0.01em;
  padding-top: 2px;
}
.end__foot-aside {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.end__foot-links {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.end__foot-sep {
  opacity: 0.35;
}
.end__foot-lang {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .nf-grid {
    grid-template-columns: 1fr;
  }
  .nf-card {
    border-right: 0;
    border-bottom: 2px solid #000;
    min-height: auto;
  }
  .nf-card:last-child {
    border-bottom: 0;
  }
  .d.end,
  .end {
    min-height: auto;
    padding-top: clamp(24px, 5cqw, 36px);
    padding-bottom: clamp(16px, 3cqw, 24px);
    gap: clamp(18px, 4cqw, 28px);
  }
  .end__title {
    margin-top: clamp(8px, 2cqw, 16px);
    font-size: clamp(38px, 11cqw, 64px);
    line-height: 0.88;
  }
  .end__foot {
    margin-top: 24px;
    padding-top: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .end__foot-aside {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .end__foot-lang {
    margin-left: auto;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
