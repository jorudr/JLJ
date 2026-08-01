<template>
  <div class="mobile-menu-root">
    <div class="mobile-menu__desktop-locale hidden items-center space-x-4 md:flex" :class="isLight ? 'text-[#2c2c2a]' : 'text-white'">
      <button type="button" class="cursor-pointer transition-colors" :class="locale === 'en' ? 'font-bold opacity-100' : 'opacity-50'" @click="setLocale('en')">EN</button>
      <span class="opacity-30">/</span>
      <button type="button" class="cursor-pointer transition-colors" :class="locale === 'ru' ? 'font-bold opacity-100' : 'opacity-50'" @click="setLocale('ru')">RU</button>
    </div>

    <button
      type="button"
      class="mobile-menu__trigger z-50 cursor-pointer md:hidden"
      :class="isLight ? 'text-[#2c2c2a]' : 'text-white'"
      aria-label="Open navigation"
      :aria-expanded="isOpen"
      @click="toggleMenu"
    >
      <span></span>
      <span></span>
    </button>

    <div v-if="isOpen" class="mobile-menu md:hidden" :class="isLight ? 'mobile-menu--light' : ''" @click.self="closeMenu">
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
              <router-link to="/download?full" @click="closeMenu">
                <span>J.L.JÖRMUNGANDR</span>
                <small>{{ t('landing.productsMenu.fullVersion') }}</small>
              </router-link>
              <a :href="getDemoDownloadUrl()" download @click="closeMenu">
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

        <div class="mobile-menu__locale">
          <button type="button" class="cursor-pointer" :class="locale === 'en' ? 'is-active' : ''" @click="setLocale('en')">EN</button>
          <span>/</span>
          <button type="button" class="cursor-pointer" :class="locale === 'ru' ? 'is-active' : ''" @click="setLocale('ru')">RU</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '../shared/i18n/useI18n'
import { getDemoDownloadUrl } from '../shared/downloads'

defineProps({
  isLight: {
    type: Boolean,
    default: false
  }
})

const { t, locale, setLocale } = useI18n()
const isOpen = ref(false)
const section = ref(null)

const toggleMenu = () => {
  isOpen.value = !isOpen.value
  if (!isOpen.value) section.value = null
}

const closeMenu = () => {
  isOpen.value = false
  section.value = null
}

const toggleSection = (name) => {
  section.value = section.value === name ? null : name
}
</script>

<style scoped>
.mobile-menu__desktop-locale {
  z-index: 50;
}

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
  background: currentColor;
}

.mobile-menu {
  position: fixed;
  inset: 0;
  z-index: 100;
  overflow-y: auto;
  background: #070708;
  color: white;
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
  color: currentColor;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 2rem;
  font-weight: 200;
  line-height: 1;
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
  color: currentColor;
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.55rem;
  font-weight: 300;
  letter-spacing: 0.03em;
  text-align: left;
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
  color: currentColor;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  line-height: 1.35;
  opacity: 0.72;
}

.mobile-menu__children small {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  opacity: 0.5;
  text-transform: uppercase;
}

.mobile-menu__locale {
  display: flex;
  margin-top: auto;
  padding-top: 48px;
  align-items: center;
  gap: 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  opacity: 0.45;
}

.mobile-menu__locale button.is-active {
  font-weight: 700;
  opacity: 1;
}
</style>
