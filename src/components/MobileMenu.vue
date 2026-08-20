<template>
  <div class="mobile-menu-root">
    <button
      type="button"
      class="mobile-menu__trigger z-[2147483647] cursor-pointer md:hidden"
      :class="{ 'is-open': isOpen }"
      aria-label="Open navigation"
      :aria-expanded="isOpen"
      @click="toggleMenu"
    >
      <span></span>
      <span></span>
    </button>

    <div v-if="isOpen" class="mobile-menu md:hidden" :class="isLight ? 'mobile-menu--light' : ''" @click.self="closeMenu" @touchmove.self.prevent>
      <div class="mobile-menu__panel">
        <div class="mobile-menu__topline">
          <span>J.L.JÖRMUNGANDR</span>
          <button type="button" class="mobile-menu__close cursor-pointer" aria-label="Close navigation" @click="closeMenu">×</button>
        </div>

        <nav class="mobile-menu__nav" aria-label="Mobile navigation">
          <div class="mobile-menu__group">
            <button type="button" class="mobile-menu__parent cursor-pointer" @click="toggleSection('products')">
              <span>{{ t('landing.nav.products') }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" :class="{ 'is-expanded': section === 'products' }" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>
            </button>
            <div v-if="section === 'products'" class="mobile-menu__children">
              <router-link to="/announcement" @click="closeMenu">
                <span>J.L.JÖRMUNGANDR</span>
                <small>{{ t('landing.productsMenu.fullVersion') }}</small>
              </router-link>
              <a href="/announcement" @click="closeMenu">
                <span>J.L.JÖRMUNGANDR DEMO</span>
                <small>{{ t('landing.productsMenu.freeDemo') }}</small>
              </a>
            </div>
          </div>

          <div class="mobile-menu__group">
            <button type="button" class="mobile-menu__parent cursor-pointer" @click="toggleSection('useCases')">
              <span>{{ t('landing.nav.useCases') }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" :class="{ 'is-expanded': section === 'useCases' }" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>
            </button>
            <div v-if="section === 'useCases'" class="mobile-menu__children">
              <router-link to="/use-cases?case=improve-trading-results" @click="closeMenu">{{ t('landing.useCasesMenu.improveTradingResults') }}</router-link>
              <router-link to="/use-cases?case=create-trading-system" @click="closeMenu">{{ t('landing.useCasesMenu.createTradingSystem') }}</router-link>
              <router-link to="/use-cases?case=content-creator" @click="closeMenu">{{ t('landing.useCasesMenu.contentCreator') }}</router-link>
            </div>
          </div>

          <router-link to="/pricing" class="mobile-menu__link" @click="closeMenu">{{ t('landing.nav.pricing') }}</router-link>
          <router-link to="/philosophy" class="mobile-menu__link" @click="closeMenu">{{ t('landing.nav.philosophy') }}</router-link>
        </nav>

        <div class="mobile-menu__language">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { useI18n } from '../shared/i18n/useI18n'

defineProps({
  isLight: {
    type: Boolean,
    default: false
  }
})

const footerLocales = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
]

const { t, locale, setLocale } = useI18n()
const isOpen = ref(false)
const section = ref(null)
const isLanguageMenuOpen = ref(false)

const activeFooterLocale = computed(() => footerLocales.find(item => item.code === locale.value) || footerLocales[0])

const selectFooterLocale = (code) => {
  setLocale(code)
  isLanguageMenuOpen.value = false
}

const toggleMenu = () => {
  isOpen.value = !isOpen.value
  if (!isOpen.value) {
    section.value = null
    isLanguageMenuOpen.value = false
  }
}

const closeMenu = () => {
  isOpen.value = false
  section.value = null
  isLanguageMenuOpen.value = false
}

const toggleSection = (name) => {
  section.value = section.value === name ? null : name
}

watch(isOpen, (val) => {
  if (typeof document !== 'undefined') {
    if (val) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }
}, { immediate: true })

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
  }
})
</script>

<style scoped>
.mobile-menu__trigger {
  display: flex;
  width: 28px;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}

@media (min-width: 768px) {
  .mobile-menu__trigger {
    display: none;
  }
}

.mobile-menu__trigger span {
  display: block;
  width: 100%;
  height: 1px;
  background-color: #050505;
  transition: background-color 200ms ease;
}

.mobile-menu__trigger.is-open span {
  background-color: #ffffff !important;
}

.mobile-menu {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: #000000 !important;
  color: #ffffff;
}

.mobile-menu--light {
  background: #ffffff;
  color: #2c2c2a;
}

.mobile-menu__panel {
  display: flex;
  width: min(100%, 560px);
  min-height: 100%;
  margin: 0 auto;
  padding: 24px;
  flex-direction: column;
}

.mobile-menu__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.7rem;
  letter-spacing: 0.22em;
}

.mobile-menu--light .mobile-menu__topline {
  color: rgba(44, 44, 42, 0.65);
}

.mobile-menu__close {
  color: #ffffff;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 2rem;
  font-weight: 200;
  line-height: 1;
}

.mobile-menu--light .mobile-menu__close {
  color: #2c2c2a;
}

.mobile-menu__nav {
  display: flex;
  margin-top: 64px;
  flex-direction: column;
}

.mobile-menu__group,
.mobile-menu__link {
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.mobile-menu--light .mobile-menu__group,
.mobile-menu--light .mobile-menu__link {
  border-bottom-color: rgba(44, 44, 42, 0.16);
}

.mobile-menu__parent,
.mobile-menu__link {
  display: flex;
  width: 100%;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  color: #ffffff;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.55rem;
  font-weight: 300;
  letter-spacing: 0.03em;
  text-align: left;
}

.mobile-menu--light .mobile-menu__parent,
.mobile-menu--light .mobile-menu__link {
  color: #2c2c2a;
}

.mobile-menu__parent svg {
  width: 18px;
  height: 18px;
  opacity: 0.52;
  transition: transform 180ms ease;
}

.mobile-menu__parent svg.is-expanded {
  transform: rotate(180deg);
}

.mobile-menu__children {
  display: flex;
  padding: 0 0 18px 18px;
  flex-direction: column;
  gap: 18px;
}

.mobile-menu__children a {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: rgba(255, 255, 255, 0.85);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  line-height: 1.35;
  opacity: 0.85;
}

.mobile-menu--light .mobile-menu__children a {
  color: #2c2c2a;
}

.mobile-menu__children small {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  opacity: 0.5;
  text-transform: uppercase;
}

.mobile-menu__language {
  margin-top: auto;
  padding-top: 48px;
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
</style>
