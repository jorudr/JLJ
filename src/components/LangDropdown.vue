<template>
  <div ref="rootEl" class="lang-dropdown">
    <button
      type="button"
      class="lang-dropdown__btn"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      aria-label="Select language"
      @click="toggle"
    >
      <span class="lang-dropdown__globe" aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </span>
      <span class="lang-dropdown__label">{{ currentLang.native }}</span>
      <span class="lang-dropdown__badge mono">{{ currentLang.flag }}</span>
      <span class="lang-dropdown__arrow" :class="{ 'is-open': isOpen }" aria-hidden="true">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <polygon points="1,3 9,3 5,8" />
        </svg>
      </span>
    </button>

    <transition name="lang-fade">
      <div v-if="isOpen" class="lang-dropdown__panel" role="listbox">
        <div class="lang-dropdown__header mono">
          <span>Language / Язык</span>
        </div>
        <router-link
          v-for="lang in LANGUAGES"
          :key="lang.code"
          :to="resolvePath(lang.code)"
          class="lang-dropdown__item"
          :class="{ 'is-active': lang.code === currentLang.code }"
          role="option"
          :aria-selected="lang.code === currentLang.code"
          @click="isOpen = false"
        >
          <span class="lang-dropdown__item-check" aria-hidden="true">
            {{ lang.code === currentLang.code ? '✓' : '' }}
          </span>
          <span class="lang-dropdown__item-native">{{ lang.native }}</span>
          <span class="lang-dropdown__item-en mono">{{ lang.label }}</span>
          <span class="lang-dropdown__item-code mono">[{{ lang.flag }}]</span>
        </router-link>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { LANGUAGES } from '../shared/i18n/languages.js'

const route = useRoute()
const rootEl = ref(null)
const isOpen = ref(false)

const toggle = () => {
  isOpen.value = !isOpen.value
}

const currentLang = computed(() => {
  const p = route.path
  if (p === '/ru' || p.startsWith('/ru/')) {
    return LANGUAGES.find(l => l.code === 'ru') || LANGUAGES[0]
  }
  for (const l of LANGUAGES) {
    if (l.code !== 'en' && (p === `/${l.code}` || p.startsWith(`/${l.code}/`))) {
      return l
    }
  }
  return LANGUAGES[0] // default to 'en'
})

const resolvePath = (targetCode) => {
  let clean = route.path
  // Strip known prefix
  if (clean === '/ru' || clean === '/ru/') {
    clean = '/'
  } else if (clean.startsWith('/ru/')) {
    clean = clean.slice(3)
  }
  for (const l of LANGUAGES) {
    if (l.code === 'en' || l.code === 'ru') continue
    if (clean === `/${l.code}` || clean === `/${l.code}/`) {
      clean = '/'
      break
    } else if (clean.startsWith(`/${l.code}/`)) {
      clean = clean.slice(l.code.length + 1)
      break
    }
  }

  if (targetCode === 'en') {
    return clean || '/'
  }
  return clean === '/' ? `/${targetCode}/` : `/${targetCode}${clean}`
}

watch(() => route.path, () => {
  isOpen.value = false
})

const onDocClick = (e) => {
  if (rootEl.value && !rootEl.value.contains(e.target)) {
    isOpen.value = false
  }
}

const onKeyDown = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<style scoped>
.lang-dropdown {
  position: relative;
  display: inline-block;
  user-select: none;
}

.lang-dropdown__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  color: #fff;
  padding: 6px 14px 6px 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.lang-dropdown__btn:hover,
.lang-dropdown__btn[aria-expanded="true"] {
  background: #fff;
  color: #000;
  border-color: #fff;
}

.lang-dropdown__globe {
  display: inline-flex;
  align-items: center;
  opacity: 0.85;
}

.lang-dropdown__btn:hover .lang-dropdown__globe,
.lang-dropdown__btn[aria-expanded="true"] .lang-dropdown__globe {
  opacity: 1;
}

.lang-dropdown__label {
  font-weight: 700;
  letter-spacing: -0.01em;
}

.lang-dropdown__badge {
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.18);
  color: inherit;
  border: 1px solid currentColor;
  opacity: 0.85;
  letter-spacing: 0.06em;
}

.lang-dropdown__btn:hover .lang-dropdown__badge,
.lang-dropdown__btn[aria-expanded="true"] .lang-dropdown__badge {
  background: rgba(0, 0, 0, 0.1);
  opacity: 1;
}

.lang-dropdown__arrow {
  display: inline-flex;
  align-items: center;
  margin-left: 2px;
  transition: transform 0.2s ease;
}

.lang-dropdown__arrow.is-open {
  transform: rotate(180deg);
}

/* ── Panel pops UPWARD above the footer ── */
.lang-dropdown__panel {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  min-width: 230px;
  background: #000;
  border: 2px solid #fff;
  box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.7);
  z-index: 60;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lang-dropdown__header {
  padding: 6px 10px 4px;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2px;
}

.lang-dropdown__item {
  display: grid;
  grid-template-columns: 16px 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  text-decoration: none !important;
  transition: background 0.1s ease, color 0.1s ease;
}

.lang-dropdown__item:hover {
  background: #fff;
  color: #000;
}

.lang-dropdown__item.is-active {
  background: rgba(255, 255, 255, 0.14);
}

.lang-dropdown__item.is-active:hover {
  background: #fff;
  color: #000;
}

.lang-dropdown__item-check {
  font-weight: 800;
  color: currentColor;
}

.lang-dropdown__item-native {
  font-weight: 700;
}

.lang-dropdown__item-en {
  font-size: 11px;
  opacity: 0.6;
  text-transform: none;
}

.lang-dropdown__item:hover .lang-dropdown__item-en {
  opacity: 0.85;
}

.lang-dropdown__item-code {
  font-size: 11px;
  opacity: 0.65;
  letter-spacing: 0.05em;
}

/* Animations */
.lang-fade-enter-active,
.lang-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.lang-fade-enter-from,
.lang-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (max-width: 600px) {
  .lang-dropdown__panel {
    right: auto;
    left: 0;
  }
}
</style>
