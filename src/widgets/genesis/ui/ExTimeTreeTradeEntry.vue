<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '~/shared/i18n/useI18n'

const props = defineProps<{
  isDark?: boolean
}>()

const { locale } = useI18n()
const activeEntryFormTab = ref<'main' | 'risk' | 'time'>('main')
const activeProjectionMode = ref<'core' | 'projection' | 'chart'>('core')

const tradeEntryThemeStyle = computed(() => props.isDark
  ? {
      '--theme-bg': '#000000',
      '--theme-bg-rgb': '0 0 0',
      '--theme-panel': 'rgba(5, 5, 5, 0.92)',
      '--theme-text': '#F9F6F0',
      '--theme-text-rgb': '249 246 240',
      '--theme-border': 'rgba(249, 246, 240, 0.12)',
      backgroundColor: '#000000'
    }
  : {
      backgroundColor: 'var(--theme-bg)'
    })
</script>

<template>
  <div
    class="trade-entry-shell flex h-full w-full flex-col items-center overflow-hidden bg-theme-bg transition-colors duration-500 nier-text-primary"
    :class="props.isDark ? 'dark is-dark theme-dark' : 'theme-light'"
    :style="tradeEntryThemeStyle"
  >
    <div class="w-full flex justify-center">
      <div class="w-full min-w-0 max-w-none pt-8 pb-12">
        <div class="flex flex-col space-y-12">
          <div class="contents">
            <div class="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
      <div class="relative z-10 mx-auto flex h-[clamp(600px,69.6vh,768px)] w-full max-w-[1560px] flex-col items-center justify-center border-transparent bg-transparent group">
        <div class="absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 items-center border border-black/10 bg-theme-bg shadow-[0_12px_30px_rgba(0,0,0,0.08)] dark:border-white/10">
          <button
            type="button"
            :aria-label="locale === 'ru' ? 'Основные данные сделки' : 'Trade details'"
            class="grid h-11 w-12 place-items-center border-r border-black/10 transition-colors dark:border-white/10"
            :class="activeProjectionMode === 'core' ? 'nier-bg-inverted nier-text-primary' : 'nier-text-primary opacity-45 hover:opacity-100'"
            @click="activeProjectionMode = 'core'"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" stroke-width="1.7" />
              <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" />
            </svg>
          </button>
          <button
            type="button"
            :aria-label="locale === 'ru' ? 'Проекция' : 'Projection'"
            class="grid h-11 w-12 place-items-center border-r border-black/10 transition-colors dark:border-white/10"
            :class="activeProjectionMode === 'projection' ? 'nier-bg-inverted nier-text-primary' : 'nier-text-primary opacity-45 hover:opacity-100'"
            @click="activeProjectionMode = 'projection'"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 17l4-5 4 3 5-8 3 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter" />
              <path d="M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" />
            </svg>
          </button>
          <button
            type="button"
            :aria-label="locale === 'ru' ? 'График' : 'Chart'"
            class="grid h-11 w-12 place-items-center transition-colors"
            :class="activeProjectionMode === 'chart' ? 'nier-bg-inverted nier-text-primary' : 'nier-text-primary opacity-45 hover:opacity-100'"
            @click="activeProjectionMode = 'chart'"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 4v16M17 4v16" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" />
              <path d="M5 8h4v7H5zM15 6h4v10h-4z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <div class="absolute inset-0 flex items-start justify-start overflow-y-auto overflow-x-hidden custom-scrollbar p-10 text-left text-white">
          <div class="w-full px-6 sm:px-10 md:px-12 xl:px-16 2xl:px-20">
            <div class="flex w-full max-w-4xl flex-col items-start gap-14">
              <div class="flex w-full items-center justify-start gap-2 border-b border-white/10 pb-3">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 border px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] transition-colors"
                  :class="activeEntryFormTab === 'main' ? 'border-white bg-white text-black' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'"
                  @click="activeEntryFormTab = 'main'"
                >
                  {{ locale === 'ru' ? 'ОСНОВНЫЕ' : 'MAIN' }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 border px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] transition-colors"
                  :class="activeEntryFormTab === 'risk' ? 'border-white bg-white text-black' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'"
                  @click="activeEntryFormTab = 'risk'"
                >
                  {{ locale === 'ru' ? 'РИСК-МЕНЕДЖМЕНТ' : 'RISK MANAGEMENT' }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 border px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] transition-colors"
                  :class="activeEntryFormTab === 'time' ? 'border-white bg-white text-black' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'"
                  @click="activeEntryFormTab = 'time'"
                >
                  {{ locale === 'ru' ? 'ВРЕМЯ' : 'TIME' }}
                </button>
              </div>

              <section class="min-h-[420px] w-full" :aria-label="activeEntryFormTab"></section>
            </div>
          </div>
        </div>

      </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trade-entry-shell {
  --theme-bg: #f5f3ee;
}

.trade-entry-shell.theme-dark {
  --theme-bg: #000000;
}

.trade-entry-shell.theme-light [class~="text-white"] {
  color: #111111 !important;
}

.trade-entry-shell.theme-light [class*="text-white/"] {
  color: rgb(17 17 17 / 0.58) !important;
}

.trade-entry-shell.theme-light [class*="border-white"] {
  border-color: rgb(17 17 17 / 0.18) !important;
}
</style>
