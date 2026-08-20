<template>
  <footer class="app-footer" aria-labelledby="app-footer-title">
    <div class="app-footer__inner">
      <section v-if="!hideHero" class="app-footer__hero">
        <div>
          <h2 id="app-footer-title">{{ t('landing.footer.title') }}</h2>
          <p>{{ t('landing.footer.description') }}</p>
        </div>

        <div class="app-footer__actions" aria-label="Footer actions">
          <router-link to="/" class="app-footer__button app-footer__button--primary">
            <span>{{ t('landing.footer.contactCta') }}</span>
            <span aria-hidden="true">↗</span>
          </router-link>
          <a href="https://t.me/gandr_trade" target="_blank" rel="noreferrer" class="app-footer__button">
            <span>{{ t('landing.footer.telegramCta') }}</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <div class="app-footer__grid">
        <section class="app-footer__brand" aria-label="Company">
          <router-link to="/" class="app-footer__mark" aria-label="J.L.JÖRMUNGANDR home">
            <span></span>
          </router-link>
          <div>
            <strong>J.L.JÖRMUNGANDR</strong>
            <p>{{ t('landing.footer.productLine') }}</p>
          </div>
        </section>

        <nav class="app-footer__column" :aria-label="t('landing.footer.platformTitle')">
          <h3>{{ t('landing.footer.platformTitle') }}</h3>
          <router-link to="/">{{ t('landing.nav.products') }}</router-link>
          <router-link to="/use-cases">{{ t('landing.nav.useCases') }}</router-link>
          <router-link to="/pricing">{{ t('landing.nav.pricing') }}</router-link>
          <router-link to="/philosophy">{{ t('landing.nav.philosophy') }}</router-link>
        </nav>

        <nav class="app-footer__column" :aria-label="t('landing.footer.accessTitle')">
          <h3>{{ t('landing.footer.accessTitle') }}</h3>
          <a href="https://t.me/gandr_trade" target="_blank" rel="noreferrer">{{ t('landing.footer.telegramCta') }}</a>
          <a href="mailto:plasticcwc@gmail.com">{{ t('landing.footer.contact') }}</a>
        </nav>

        <section class="app-footer__column app-footer__language" :aria-label="t('landing.footer.languageTitle')">
          <h3>{{ t('landing.footer.languageTitle') }}</h3>
          <div class="app-footer__language-menu" :class="{ 'is-open': isLanguageMenuOpen }">
            <button
              type="button"
              class="app-footer__language-trigger"
              :aria-expanded="isLanguageMenuOpen"
              aria-haspopup="listbox"
              @click="isLanguageMenuOpen = !isLanguageMenuOpen"
            >
              <span>{{ activeFooterLocale.label }}</span>
              <span aria-hidden="true">⌄</span>
            </button>

            <div v-if="isLanguageMenuOpen" class="app-footer__language-options" role="listbox">
              <button
                v-for="item in footerLocales"
                :key="item.code"
                type="button"
                role="option"
                :aria-selected="locale === item.code"
                :class="{ 'is-active': locale === item.code }"
                @click="selectFooterLocale(item.code)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="app-footer__bottom">
        <span>{{ t('landing.footer.company') }}</span>
        <span>{{ t('landing.footer.rights') }}</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '../shared/i18n/useI18n'

defineProps({
  hideHero: {
    type: Boolean,
    default: false,
  },
})

const footerLocales = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
]

const { t, locale, setLocale } = useI18n()
const isLanguageMenuOpen = ref(false)
const activeFooterLocale = computed(() => footerLocales.find(item => item.code === locale.value) || footerLocales[0])

const selectFooterLocale = (code) => {
  setLocale(code)
  isLanguageMenuOpen.value = false
}
</script>

<style scoped>
.app-footer {
  position: relative;
  z-index: 10;
  width: auto;
  margin-right: calc(50% - 50vw);
  margin-left: calc(50% - 50vw);
  overflow: hidden;
  background: #000000;
  color: rgba(245, 245, 240, 0.76);
  font-family: "Cormorant Garamond", serif;
}

.app-footer__inner {
  position: relative;
  width: min(100%, 1280px);
  margin: 0 auto;
  padding: clamp(56px, 8vw, 96px) 24px 28px;
}

.app-footer__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 40px;
  align-items: end;
  padding-bottom: clamp(40px, 6vw, 72px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.app-footer__column h3,
.app-footer__bottom {
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  letter-spacing: -0.01em;
}

.app-footer__hero h2 {
  max-width: 760px;
  color: #f5f5f0;
  font-size: clamp(2.6rem, 8vw, 7.2rem);
  font-weight: 300;
  letter-spacing: 0;
  line-height: 0.88;
  overflow-wrap: break-word;
}

.app-footer__hero p {
  max-width: 620px;
  margin-top: clamp(32px, 5vw, 64px);
  color: rgba(245, 245, 240, 0.62);
  font-size: clamp(1.05rem, 1.5vw, 1.35rem);
  line-height: 1.45;
}

.app-footer__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: clamp(36px, 5vw, 72px);
  width: min(100%, 280px);
}

.app-footer__button {
  display: flex;
  min-height: 44px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 25px;
  padding: 10px 16px 10px 18px;
  color: #f5f5f0;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  font-size: 0.9rem;
  text-decoration: none;
  transition: border-color 180ms ease, background 180ms ease, color 180ms ease;
}

.app-footer__button:hover {
  border-color: rgba(255, 255, 255, 0.36);
  background: rgba(255, 255, 255, 0.08);
}

.app-footer__button--primary {
  border-color: #f5f5f0;
  background: #f5f5f0;
  color: #000;
}

.app-footer__button--primary:hover {
  background: #d8d8d2;
  color: #000;
}

.app-footer__grid {
  display: grid;
  grid-template-columns: minmax(260px, 1.5fr) minmax(150px, 0.7fr) minmax(190px, 0.8fr) minmax(160px, 0.7fr);
  gap: clamp(28px, 5vw, 72px);
  padding: clamp(36px, 6vw, 64px) 0;
}

.app-footer__brand {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.app-footer__mark {
  position: relative;
  display: grid;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgba(245, 245, 240, 0.34);
  color: #f5f5f0;
}

.app-footer__mark::before,
.app-footer__mark::after {
  position: absolute;
  content: "";
  border: 1px solid rgba(245, 245, 240, 0.18);
}

.app-footer__mark::before {
  inset: 6px;
  transform: rotate(45deg);
}

.app-footer__mark::after {
  inset: 13px;
  background: #f5f5f0;
  transform: rotate(45deg);
}

.app-footer__brand strong {
  display: block;
  color: #f5f5f0;
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.28em;
}

.app-footer__brand p {
  max-width: 320px;
  margin-top: 12px;
  color: rgba(245, 245, 240, 0.52);
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  font-size: 0.94rem;
  line-height: 1.5;
}

.app-footer__column {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}

.app-footer__column h3 {
  margin-bottom: 16px;
  color: rgba(245, 245, 240, 0.42);
}

.app-footer__column a {
  padding: 5px 0;
  color: rgba(245, 245, 240, 0.78);
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  font-size: 0.95rem;
  line-height: 1.35;
  text-decoration: none;
  transition: color 160ms ease, transform 160ms ease;
}

.app-footer__column a:hover {
  color: #f5f5f0;
  transform: translateX(2px);
}

.app-footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 22px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(245, 245, 240, 0.38);
}

.app-footer__language-menu {
  position: relative;
  width: min(100%, 180px);
}

.app-footer__language-trigger,
.app-footer__language-options button {
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  font-size: 0.95rem;
}

.app-footer__language-trigger {
  display: flex;
  width: 100%;
  min-height: 38px;
  cursor: pointer;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid rgba(245, 245, 240, 0.18);
  border-radius: 25px;
  padding: 8px 13px 8px 15px;
  background: rgba(255, 255, 255, 0.02);
  color: rgba(245, 245, 240, 0.82);
  text-align: left;
  transition: border-color 160ms ease, background 160ms ease;
}

.app-footer__language-trigger:hover,
.app-footer__language-menu.is-open .app-footer__language-trigger {
  border-color: rgba(245, 245, 240, 0.4);
  background: rgba(255, 255, 255, 0.06);
}

.app-footer__language-options {
  position: absolute;
  z-index: 20;
  right: 0;
  bottom: calc(100% + 8px);
  display: grid;
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(245, 245, 240, 0.18);
  border-radius: 14px;
  background: #050505;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.42);
}

.app-footer__language-options button {
  cursor: pointer;
  border: 0;
  padding: 10px 13px;
  background: transparent;
  color: rgba(245, 245, 240, 0.68);
  text-align: left;
  transition: background 160ms ease, color 160ms ease;
}

.app-footer__language-options button:hover,
.app-footer__language-options button.is-active {
  background: rgba(255, 255, 255, 0.08);
  color: #f5f5f0;
}

@media (max-width: 900px) {
  .app-footer__hero,
  .app-footer__grid {
    grid-template-columns: 1fr;
  }

  .app-footer__actions {
    width: min(100%, 360px);
  }
}

@media (max-width: 640px) {
  .app-footer__inner {
    padding-right: 20px;
    padding-left: 20px;
  }

  .app-footer__hero h2 {
    font-size: clamp(1.75rem, 8.5vw, 2.6rem);
    line-height: 1.08;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .app-footer__hero p {
    margin-top: 20px;
    font-size: 0.95rem;
    line-height: 1.5;
  }

  .app-footer__brand {
    flex-direction: column;
  }

  .app-footer__brand strong {
    letter-spacing: 0.16em;
  }

  .app-footer__bottom {
    flex-direction: column;
  }
}
</style>
