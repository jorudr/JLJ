<template>
  <header class="site-nav" :class="{ 'site-nav--scrolled': isScrolled, 'site-nav--always-dark': alwaysDark }">
    <div class="site-nav__inner">
      <router-link to="/" class="site-nav__logo" aria-label="J.L.JÖRMUNGANDR home">
        <div class="relative flex h-5 w-5 shrink-0 items-center justify-center sm:h-6 sm:w-6">
          <div class="absolute inset-0 border border-black/40 animate-[spin_10s_linear_infinite]"></div>
          <div class="absolute inset-1 border border-black/60 animate-[spin_6s_linear_infinite_reverse]"></div>
          <div class="h-1 w-1 rotate-45 bg-black animate-pulse"></div>
          <div class="absolute -left-0.5 -top-0.5 h-1.5 w-1.5 border-l border-t border-black"></div>
          <div class="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 border-b border-r border-black"></div>
        </div>
      </router-link>

      <nav class="site-nav__links" aria-label="Primary navigation">
        <router-link to="/" class="site-nav__link">
          {{ t('landing.nav.products') }}
          <svg class="ml-1.5 h-3.5 w-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </router-link>
        <router-link to="/use-cases" class="site-nav__link">
          {{ t('landing.nav.useCases') }}
          <svg class="ml-1.5 h-3.5 w-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </router-link>
        <router-link to="/pricing" class="site-nav__link">{{ t('landing.nav.pricing') }}</router-link>
        <router-link to="/philosophy" class="site-nav__link">{{ t('landing.nav.philosophy') }}</router-link>
      </nav>

      <router-link to="/announcement" class="site-nav__action">
        <span>Попробовать</span>
        <svg class="ml-2 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 19L19 5M8 5h11v11" />
        </svg>
      </router-link>

      <MobileMenu class="site-nav__mobile" />
    </div>
  </header>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from '../shared/i18n/useI18n'
import MobileMenu from './MobileMenu.vue'

defineProps({
  alwaysDark: {
    type: Boolean,
    default: false
  }
})

const { t } = useI18n()
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 8
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.site-nav {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 2147483647;
  width: 100%;
  padding: 8px 0;
  background: transparent;
  color: #050505;
  transition: background-color 200ms ease;
}

.site-nav__inner {
  display: flex;
  width: 100%;
  max-width: none;
  min-height: 28px;
  margin: 0 auto;
  align-items: center;
}

.site-nav__logo {
  display: inline-flex;
  align-items: center;
  filter: none;
}

.site-nav__links {
  display: none;
  margin-left: 40px;
  align-items: center;
  gap: 32px;
  white-space: nowrap;
}

.site-nav__link,
.site-nav__action {
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  letter-spacing: -0.01em;
  transition: opacity 180ms ease, color 200ms ease, background-color 200ms ease;
}

.site-nav__link {
  display: flex;
  align-items: center;
  color: #050505;
}

.site-nav__link:hover {
  opacity: 0.5;
}

.site-nav__action {
  display: flex;
  margin-left: auto;
  align-items: center;
  justify-content: center;
  border-radius: 25px;
  background: #000;
  padding: 6px 20px;
  color: #fff;
}

.site-nav__action:hover {
  background: #171717;
}

.site-nav :deep(.mobile-menu__desktop-locale) {
  display: none !important;
}

.site-nav:hover,
.site-nav--scrolled {
  background: #000 !important;
  isolation: isolate;
  z-index: 2147483647;
}

.site-nav:hover .site-nav__link,
.site-nav--scrolled .site-nav__link {
  color: #f5f5f0;
}

.site-nav:hover .site-nav__logo,
.site-nav--scrolled .site-nav__logo {
  filter: invert(1);
}

.site-nav:hover .site-nav__action,
.site-nav--scrolled .site-nav__action {
  background: #fff;
  color: #000;
}

.site-nav--always-dark {
  background: #000;
  color: #f5f5f0;
  transition: none;
}

.site-nav--always-dark .site-nav__link {
  color: #f5f5f0;
}

.site-nav--always-dark .site-nav__link:hover {
  opacity: 1;
}

.site-nav--always-dark .site-nav__logo {
  filter: invert(1);
}

.site-nav--always-dark .site-nav__action,
.site-nav--always-dark .site-nav__action:hover {
  background: #fff;
  color: #000;
  transition: none;
}

@media (min-width: 768px) {
  .site-nav__links {
    display: flex;
  }
}

@media (min-width: 640px) {
  .site-nav {
    padding-top: 16px;
    padding-bottom: 16px;
  }
}

@media (min-width: 1280px) {
  .site-nav {
    padding-right: 32px;
    padding-left: 32px;
  }
}

@media (min-width: 1536px) {
  .site-nav__inner {
    max-width: 1280px;
  }
}
</style>
