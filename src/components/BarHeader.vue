<template>
  <!-- BAR -->
  <header class="bar">
    <router-link :to="isRu ? '/ru/' : '/'" class="bar__brand" aria-label="JÖRMUNGANDR home" @click="closeMobileMenu">
      <img src="/assets/herb.svg" alt="" width="18" height="16" />
      <span>JÖRMUNGANDR</span>
    </router-link>

    <nav class="bar__nav" aria-label="Main">
      <router-link :to="isRu ? '/ru/#chart' : '/#chart'" @click="handleWhatItDoes">{{ copy.nav.whatItDoes }}</router-link>
      <router-link :to="isRu ? '/ru/about' : '/about'">{{ copy.nav.about }}</router-link>
      <router-link :to="isRu ? '/ru/pricing' : '/pricing'">{{ copy.nav.pricing }}</router-link>
      <router-link :to="isRu ? '/ru/download' : '/download'">{{ copy.nav.download }}</router-link>
    </nav>

    <button
      type="button"
      class="bar__burger"
      :class="{ 'is-open': isMobileMenuOpen }"
      :aria-expanded="isMobileMenuOpen"
      :aria-label="isMobileMenuOpen ? (isRu ? 'Закрыть меню' : 'Close navigation') : (isRu ? 'Открыть меню' : 'Open navigation')"
      @click="toggleMobileMenu"
    >
      <span class="bar__burger-line"></span>
      <span class="bar__burger-line"></span>
    </button>
  </header>

  <!-- MOBILE DRAWER -->
  <transition name="drawer">
    <div
      v-if="isMobileMenuOpen"
      class="mobile-drawer"
      role="dialog"
      aria-modal="true"
      :aria-label="isRu ? 'Мобильное меню' : 'Mobile navigation'"
    >
      <div class="mobile-drawer__panel">
        <nav class="mobile-drawer__nav" aria-label="Mobile Navigation">
          <router-link
            :to="isRu ? '/ru/#chart' : '/#chart'"
            class="mobile-drawer__link"
            @click="handleWhatItDoes"
          >
            <span>{{ copy.nav.whatItDoes }}</span>
            <span class="mono mobile-drawer__link-arrow" aria-hidden="true">→</span>
          </router-link>
          <router-link
            :to="isRu ? '/ru/about' : '/about'"
            class="mobile-drawer__link"
            @click="closeMobileMenu"
          >
            <span>{{ copy.nav.about }}</span>
            <span class="mono mobile-drawer__link-arrow" aria-hidden="true">→</span>
          </router-link>
          <router-link
            :to="isRu ? '/ru/pricing' : '/pricing'"
            class="mobile-drawer__link"
            @click="closeMobileMenu"
          >
            <span>{{ copy.nav.pricing }}</span>
            <span class="mono mobile-drawer__link-arrow" aria-hidden="true">→</span>
          </router-link>
          <router-link
            :to="isRu ? '/ru/download' : '/download'"
            class="mobile-drawer__link"
            @click="closeMobileMenu"
          >
            <span>{{ copy.nav.download }}</span>
            <span class="mono mobile-drawer__link-arrow" aria-hidden="true">→</span>
          </router-link>
        </nav>

        <div class="mobile-drawer__footer">
          <div class="mobile-drawer__lang">
            <span class="mono mobile-drawer__lang-label">{{ isRu ? 'ЯЗЫК' : 'LANGUAGE' }}</span>
            <LangDropdown />
          </div>
          <div class="mobile-drawer__cta">
            <router-link
              :to="isRu ? '/ru/download' : '/download'"
              class="btn mobile-drawer__btn"
              @click="closeMobileMenu"
            >
              <span>{{ isRu ? 'Скачать приложение' : 'Download application' }}</span>
              <span aria-hidden="true">↓</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../shared/i18n/useI18n'
import { landingCopy } from '../shared/i18n/landingCopy.js'
import LangDropdown from './LangDropdown.vue'

const route = useRoute()
const { locale } = useI18n()
const isRu = computed(() => locale.value === 'ru' || route.path.startsWith('/ru'))
const copy = computed(() => landingCopy[isRu.value ? 'ru' : 'en'])

const isMobileMenuOpen = ref(false)
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleWhatItDoes = (e) => {
  const isHomePage = route.path === '/' || route.path === '/ru' || route.path === '/ru/' || route.path === '/dev1'
  if (isHomePage) {
    e.preventDefault()
    closeMobileMenu()
    const chartEl = document.getElementById('chart')
    const target = (chartEl && getComputedStyle(chartEl).display !== 'none')
      ? chartEl
      : document.getElementById('karl-nikolai')
    if (target) {
      const headerOffset = 46
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset
      window.scrollTo({ top, behavior: 'smooth' })
      if (window.history.pushState) {
        window.history.pushState(null, '', isRu.value ? '/ru/#chart' : '/#chart')
      }
    }
  } else {
    closeMobileMenu()
  }
}

watch(isMobileMenuOpen, (open) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = open ? 'hidden' : ''
  }
})

watch(() => route.fullPath, () => {
  closeMobileMenu()
})

const onKeydown = (e) => {
  if (e.key === 'Escape' && isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

const onResize = () => {
  if (typeof window !== 'undefined' && window.innerWidth > 900 && isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onResize)
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.bar {
  --edge: clamp(14px, 1.6cqw, 24px);
  --sans: 'Inter Tight', 'Helvetica Neue', Arial, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  height: 46px;
  padding: 0 var(--edge);
  background: #fff;
  border-bottom: 2px solid #000;
  box-sizing: border-box;
  font-family: var(--sans);
  color: #000;
}
.bar *, .bar *::before, .bar *::after { box-sizing: border-box; }
.bar a { color: inherit; text-decoration: none; }
.bar :focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }

.bar__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: -0.01em;
  white-space: nowrap;
}
.bar__brand img {
  filter: brightness(0);
  display: block;
}
.bar__nav {
  display: flex;
  gap: clamp(14px, 2.4cqw, 36px);
  font-weight: 600;
}
.bar__nav a:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-thickness: 2px;
}

/* ── Burger Button ─────────────────────────────────── */
.bar__burger {
  display: none;
  background: transparent;
  border: 0;
  padding: 8px;
  margin-right: -6px;
  cursor: pointer;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  color: #000;
}
.bar__burger-line {
  display: block;
  width: 20px;
  height: 2px;
  background: #000;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: center;
}
.bar__burger.is-open .bar__burger-line:first-child {
  transform: translateY(3.5px) rotate(45deg);
}
.bar__burger.is-open .bar__burger-line:last-child {
  transform: translateY(-3.5px) rotate(-45deg);
}

/* ── Mobile Drawer ─────────────────────────────────── */
.mobile-drawer {
  --edge: clamp(14px, 1.6cqw, 24px);
  --sans: 'Inter Tight', 'Helvetica Neue', Arial, sans-serif;
  --mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  position: fixed;
  top: 46px;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(100vh - 46px);
  height: calc(100dvh - 46px);
  z-index: 90;
  background: #fff;
  display: flex;
  flex-direction: column;
  font-family: var(--sans);
  color: #000;
  box-sizing: border-box;
}
.mobile-drawer *, .mobile-drawer *::before, .mobile-drawer *::after { box-sizing: border-box; }
.mobile-drawer a { color: inherit; text-decoration: none; }
.mobile-drawer :focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }

.mobile-drawer__panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.mobile-drawer__nav {
  display: flex;
  flex-direction: column;
}
.mobile-drawer__link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px var(--edge);
  font-size: clamp(22px, 6.5cqw, 30px);
  font-weight: 800;
  letter-spacing: -0.03em;
  border-bottom: 2px solid #000;
  color: #000;
  text-decoration: none;
  transition: background 0.12s ease, color 0.12s ease;
}
.mobile-drawer__link:hover,
.mobile-drawer__link:active {
  background: #000;
  color: #fff;
}
.mobile-drawer__link-arrow {
  font-size: 18px;
}
.mono {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1.2;
}
.mobile-drawer__footer {
  margin-top: auto;
  border-top: 2px solid #000;
  padding: var(--edge);
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fafafa;
}
.mobile-drawer__lang {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.mobile-drawer__lang-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  color: #555;
}
.mobile-drawer :deep(.lang-dropdown__btn) {
  background: transparent;
  border: 2px solid #000;
  color: #000;
  padding: 6px 12px;
}
.mobile-drawer :deep(.lang-dropdown__btn:hover),
.mobile-drawer :deep(.lang-dropdown__btn[aria-expanded="true"]) {
  background: #000;
  color: #fff;
  border-color: #000;
}
.mobile-drawer :deep(.lang-dropdown__badge) {
  background: rgba(0, 0, 0, 0.08);
  border: 1px solid #000;
  color: inherit;
}
.mobile-drawer :deep(.lang-dropdown__btn:hover .lang-dropdown__badge),
.mobile-drawer :deep(.lang-dropdown__btn[aria-expanded="true"] .lang-dropdown__badge) {
  background: rgba(255, 255, 255, 0.2);
  border-color: #fff;
  color: #fff;
}
.mobile-drawer :deep(.lang-dropdown__panel) {
  border: 2px solid #000;
  box-shadow: 4px 4px 0 #000;
  right: 0;
  left: auto;
  background: #000;
  color: #fff;
  z-index: 100;
}
.mobile-drawer a.btn,
.mobile-drawer__btn {
  display: inline-flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 16px 18px 15px;
  background: #000;
  color: #fff;
  border: 2px solid #000;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: -0.01em;
  font-size: 16px;
  transition: background 0.1s, color 0.1s;
  width: 100%;
}
.mobile-drawer a.btn:hover,
.mobile-drawer__btn:hover {
  background: #fff;
  color: #000;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.16s ease, transform 0.16s cubic-bezier(0.16, 1, 0.3, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (min-width: 901px) {
  .bar__burger,
  .mobile-drawer {
    display: none !important;
  }
}

@media (max-width: 900px) {
  .bar__nav {
    display: none !important;
  }
  .bar__burger {
    display: flex !important;
  }
}
</style>
