<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '~/shared/i18n/useI18n'
import ExTradeAnalysisPanel from './ExTradeAnalysisPanel.vue'

const props = defineProps<{
  isDark?: boolean
  trade?: Record<string, any> | null
}>()

const { locale } = useI18n()
const activeEntryFormTab = ref<'main' | 'advanced' | 'metrics' | 'notes' | 'images'>('main')
const activeProjectionMode = ref<'core' | 'projection' | 'chart'>('core')

const isMainDiaryTrade = computed(() => {
  const trade = props.trade
  return trade?.tradingStyle === 'Main Diary' || trade?.strategyId === 'MAIN_DIARY'
})

const analysisTrade = computed(() => {
  const trade = props.trade || {}

  return {
    ...trade,
    id: trade.id || 'time-tree-trade',
    entryTime: trade.entryTime || trade.date || '',
    exitTime: trade.exitTime || trade.dateExit || '',
    pnl: Number.isFinite(Number(trade.pnl)) ? Number(trade.pnl) : 0,
    scenarios: Array.isArray(trade.scenarios) ? trade.scenarios : [],
    emotions: Array.isArray(trade.emotions) ? trade.emotions : []
  }
})

const displayValue = (value: unknown) => value === null || value === undefined || value === '' ? '--' : String(value)

const formatPrice = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '--'
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString(locale.value === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: 8 }) : String(value)
}

const formatDateValue = (value: unknown) => {
  if (!value) return '--'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return displayValue(value)
  return date.toLocaleString(locale.value === 'ru' ? 'ru-RU' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = () => {
  if (props.trade?.tradeDuration) return String(props.trade.tradeDuration)
  const start = new Date(String(props.trade?.date || '')).getTime()
  const end = new Date(String(props.trade?.dateExit || '')).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return '--'
  const minutes = Math.round((end - start) / 60000)
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return locale.value === 'ru'
    ? `${hours ? `${hours} ч ` : ''}${remainder} мин`
    : `${hours ? `${hours}h ` : ''}${remainder}m`
}

const formatRiskReward = () => {
  if (props.trade?.riskReward !== undefined && props.trade?.riskReward !== null && props.trade?.riskReward !== '') {
    return formatPrice(props.trade.riskReward)
  }
  const entry = Number(props.trade?.entry)
  const stopLoss = Number(props.trade?.stopLoss)
  const takeProfit = Number(props.trade?.takeProfit)
  if (![entry, stopLoss, takeProfit].every(Number.isFinite) || entry === stopLoss) return '--'
  return Math.abs((takeProfit - entry) / (entry - stopLoss)).toFixed(2)
}

const formatRiskPerTrade = () => {
  const value = props.trade?.riskPerTrade ?? props.trade?.riskPerTradeValue ?? props.trade?.riskPercent
  if (value === undefined || value === null || value === '') return '--'
  return `${formatPrice(value)}${props.trade?.riskPerTradeUnit === '%' || props.trade?.riskPercent !== undefined ? '%' : ''}`
}

const tradeAsset = () => String(props.trade?.asset || props.trade?.symbol || props.trade?.ticker || '--').toUpperCase()
const tradeDirection = () => String(props.trade?.side || props.trade?.direction || '--').toUpperCase()
const tradeAssetIcon = () => props.trade?.assetIcon || props.trade?.icon || ''

const tradeNotes = computed(() => {
  const notesList = Array.isArray(props.trade?.notesList)
    ? props.trade.notesList.filter((note: any) => note?.content || note?.title)
    : []
  if (notesList.length > 0) return notesList

  const note = String(props.trade?.notes || '').trim()
  return note ? [{ id: 'trade-note', content: note, title: '' }] : []
})

const tradeImages = computed(() => {
  if (!Array.isArray(props.trade?.images)) return []
  return props.trade.images.filter((image: any) => image?.url)
})

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

        <div class="absolute inset-0 flex flex-col overflow-hidden text-left text-white">
          <div class="h-full min-h-0 w-full flex flex-col overflow-hidden">
            <div class="shrink-0 px-10 pt-10">
              <div class="w-full px-6 sm:px-10 md:px-12 xl:px-16 2xl:px-20">
                <div class="flex w-full max-w-4xl flex-col items-start">
                  <div class="z-20 flex w-full shrink-0 items-center justify-start gap-2 border-b border-white/10 bg-black/60 pb-3 pt-1 backdrop-blur-md">
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
                  :class="activeEntryFormTab === 'advanced' ? 'border-white bg-white text-black' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'"
                  @click="activeEntryFormTab = 'advanced'"
                >
                  {{ locale === 'ru' ? 'ПРОДВИНУТЫЕ' : 'ADVANCED' }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 border px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] transition-colors"
                  :class="activeEntryFormTab === 'metrics' ? 'border-white bg-white text-black' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'"
                  @click="activeEntryFormTab = 'metrics'"
                >
                  {{ locale === 'ru' ? 'МЕТРИКИ' : 'METRICS' }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 border px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] transition-colors"
                  :class="activeEntryFormTab === 'notes' ? 'border-white bg-white text-black' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'"
                  @click="activeEntryFormTab = 'notes'"
                >
                  {{ locale === 'ru' ? 'ЗАМЕТКИ' : 'NOTES' }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 border px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] transition-colors"
                  :class="activeEntryFormTab === 'images' ? 'border-white bg-white text-black' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'"
                  @click="activeEntryFormTab = 'images'"
                >
                  {{ locale === 'ru' ? 'ИЗОБРАЖЕНИЯ' : 'IMAGES' }}
                </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="min-h-0 flex-1 w-full overflow-y-auto overflow-x-hidden custom-scrollbar [scrollbar-gutter:stable]">
              <div class="px-10 pb-10 pt-10">
                <div class="w-full px-6 sm:px-10 md:px-12 xl:px-16 2xl:px-20">
                  <div class="flex w-full max-w-4xl flex-col items-start gap-14">

              <section v-if="activeEntryFormTab === 'main'" class="flex w-full flex-col items-start gap-8">
                <div class="text-[10px] font-mono font-black uppercase tracking-[0.6em] text-white/45">I.</div>
                <h2 class="text-2xl font-mono font-black uppercase tracking-[0.22em] text-white md:text-3xl">
                  {{ locale === 'ru' ? 'РЕЗЮМЕ' : 'SUMMARY' }}
                </h2>

                <div class="grid w-full grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                  <div class="min-w-0 pr-6">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">{{ locale === 'ru' ? 'АКТИВ' : 'ASSET' }}</span>
                    <div class="mt-2 flex items-center gap-3 text-xl font-mono font-black uppercase tracking-[0.16em] text-white">
                      <span class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden border border-white/20 bg-white p-1">
                        <img v-if="tradeAssetIcon()" :src="tradeAssetIcon()" :alt="tradeAsset()" class="h-full w-full object-contain" />
                        <span v-else class="text-[10px]">{{ tradeAsset().slice(0, 1) }}</span>
                      </span>
                      <span class="break-words whitespace-normal">{{ tradeAsset() }}</span>
                    </div>
                  </div>
                  <div class="min-w-0 pr-6">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">{{ locale === 'ru' ? 'НАПРАВЛЕНИЕ' : 'DIRECTION' }}</span>
                    <span
                      class="mt-2 block text-xl font-mono font-black uppercase tracking-[0.16em]"
                      :class="tradeDirection() === 'SHORT' || tradeDirection() === 'SELL' ? 'text-rose-400' : 'text-emerald-400'"
                    >
                      {{ tradeDirection() }}
                    </span>
                  </div>

                  <div class="min-w-0 pr-6">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">{{ locale === 'ru' ? 'ТОЧКА ВХОДА' : 'ENTRY PRICE' }}</span>
                    <span class="mt-2 block break-words whitespace-normal text-xl font-mono font-black tracking-[0.12em] text-white">{{ formatPrice(props.trade?.entry) }}</span>
                  </div>
                  <div class="min-w-0 pr-6">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">{{ locale === 'ru' ? 'ТОЧКА ВЫХОДА' : 'EXIT PRICE' }}</span>
                    <span class="mt-2 block break-words whitespace-normal text-xl font-mono font-black tracking-[0.12em] text-white">{{ formatPrice(props.trade?.exit) }}</span>
                  </div>
                  <div class="min-w-0 pr-6">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">{{ locale === 'ru' ? 'ВРЕМЯ ВХОДА' : 'ENTRY TIME' }}</span>
                    <span class="mt-2 block break-words whitespace-normal text-xl font-mono font-black tracking-[0.12em] text-white">{{ formatDateValue(props.trade?.date) }}</span>
                  </div>
                  <div class="min-w-0 pr-6">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">{{ locale === 'ru' ? 'ВРЕМЯ ВЫХОДА' : 'EXIT TIME' }}</span>
                    <span class="mt-2 block break-words whitespace-normal text-xl font-mono font-black tracking-[0.12em] text-white">{{ formatDateValue(props.trade?.dateExit) }}</span>
                  </div>
                  <div class="min-w-0 pr-6">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">{{ locale === 'ru' ? 'ДЛИТЕЛЬНОСТЬ' : 'DURATION' }}</span>
                    <span class="mt-2 block break-words whitespace-normal text-xl font-mono font-black tracking-[0.12em] text-white">{{ formatDuration() }}</span>
                  </div>
                  <div class="min-w-0 pr-6">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">STOP LOSS</span>
                    <span class="mt-2 block break-words whitespace-normal text-xl font-mono font-black tracking-[0.12em] text-white">{{ formatPrice(props.trade?.stopLoss) }}</span>
                  </div>
                  <div class="min-w-0 pr-6">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">TAKE PROFIT</span>
                    <span class="mt-2 block break-words whitespace-normal text-xl font-mono font-black tracking-[0.12em] text-white">{{ formatPrice(props.trade?.takeProfit) }}</span>
                  </div>
                  <div class="min-w-0 pr-6">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">RISK / REWARD</span>
                    <span class="mt-2 block break-words whitespace-normal text-xl font-mono font-black tracking-[0.12em] text-white">{{ formatRiskReward() }}</span>
                  </div>
                  <div class="min-w-0 pr-6">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">{{ locale === 'ru' ? 'РИСК НА СДЕЛКУ' : 'RISK PER TRADE' }}</span>
                    <span class="mt-2 block break-words whitespace-normal text-xl font-mono font-black tracking-[0.12em] text-white">{{ formatRiskPerTrade() }}</span>
                  </div>
                </div>
              </section>

              <section v-else-if="activeEntryFormTab === 'advanced'" class="flex w-full flex-col items-start gap-8">
                <div class="text-[10px] font-mono font-black uppercase tracking-[0.6em] text-white/45">II.</div>
                <h2 class="text-2xl font-mono font-black uppercase tracking-[0.22em] text-white md:text-3xl">
                  {{ locale === 'ru' ? 'ПРОДВИНУТЫЕ МЕТРИКИ' : 'ADVANCED METRICS' }}
                </h2>

                <p v-if="isMainDiaryTrade" class="max-w-2xl text-sm font-mono uppercase leading-relaxed tracking-[0.16em] text-white/60">
                  {{ locale === 'ru' ? 'Для Main Diary продвинутый анализ недоступен.' : 'Advanced analysis is unavailable for Main Diary.' }}
                </p>

                <ExTradeAnalysisPanel
                  v-else
                  class="w-full min-h-[620px]"
                  :trade="analysisTrade"
                  :initial-page="3"
                  embedded
                  :embedded-brief="true"
                />
              </section>

              <section v-else-if="activeEntryFormTab === 'metrics'" class="flex w-full flex-col items-start gap-8">
                <div class="text-[10px] font-mono font-black uppercase tracking-[0.6em] text-white/45">III.</div>
                <h2 class="text-2xl font-mono font-black uppercase tracking-[0.22em] text-white md:text-3xl">
                  {{ locale === 'ru' ? 'МЕТРИКИ' : 'METRICS' }}
                </h2>

                <ExTradeAnalysisPanel
                  v-if="!isMainDiaryTrade"
                  class="w-full min-h-[620px]"
                  :trade="analysisTrade"
                  :initial-page="3"
                  embedded
                  embedded-brief
                  metrics-only
                />
                <p v-else class="max-w-2xl text-sm font-mono uppercase leading-relaxed tracking-[0.16em] text-white/60">
                  {{ locale === 'ru' ? 'Для Main Diary метрики недоступны.' : 'Metrics are unavailable for Main Diary.' }}
                </p>
              </section>

              <section v-else-if="activeEntryFormTab === 'notes'" class="flex w-full flex-col items-start gap-8">
                <div class="text-[10px] font-mono font-black uppercase tracking-[0.6em] text-white/45">IV.</div>
                <h2 class="text-2xl font-mono font-black uppercase tracking-[0.22em] text-white md:text-3xl">
                  {{ locale === 'ru' ? 'ЗАМЕТКИ' : 'NOTES' }}
                </h2>

                <div v-if="tradeNotes.length" class="flex w-full flex-col gap-4">
                  <article
                    v-for="(note, index) in tradeNotes"
                    :key="note.id || `trade-note-${index}`"
                    class="w-full border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div v-if="note.title" class="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-white/55">
                      {{ note.title }}
                    </div>
                    <p class="whitespace-pre-wrap font-mono text-sm leading-relaxed text-white/80">
                      {{ note.content || '--' }}
                    </p>
                  </article>
                </div>
                <div v-else class="w-full border border-white/10 px-5 py-8 text-center font-mono text-[10px] font-black uppercase tracking-[0.28em] text-white/40">
                  {{ locale === 'ru' ? 'НЕТ ЗАМЕТОК' : 'NO NOTES' }}
                </div>
              </section>

              <section v-else-if="activeEntryFormTab === 'images'" class="flex w-full flex-col items-start gap-8">
                <div class="text-[10px] font-mono font-black uppercase tracking-[0.6em] text-white/45">V.</div>
                <h2 class="text-2xl font-mono font-black uppercase tracking-[0.22em] text-white md:text-3xl">
                  {{ locale === 'ru' ? 'ИЗОБРАЖЕНИЯ' : 'IMAGES' }}
                </h2>

                <div v-if="tradeImages.length" class="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
                  <figure
                    v-for="(image, index) in tradeImages"
                    :key="image.url || `trade-image-${index}`"
                    class="overflow-hidden border border-white/10 bg-white/[0.03]"
                  >
                    <img :src="image.url" :alt="image.name || `Trade image ${index + 1}`" class="block h-auto max-h-[420px] w-full object-contain" />
                    <figcaption v-if="image.name || image.context" class="border-t border-white/10 px-4 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/55">
                      {{ image.name || image.context }}
                    </figcaption>
                  </figure>
                </div>
                <div v-else class="w-full border border-white/10 px-5 py-8 text-center font-mono text-[10px] font-black uppercase tracking-[0.28em] text-white/40">
                  {{ locale === 'ru' ? 'НЕТ ИЗОБРАЖЕНИЙ' : 'NO IMAGES' }}
                </div>
              </section>

              <section v-else class="min-h-[420px] w-full" :aria-label="activeEntryFormTab"></section>
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

.trade-entry-shell :deep(image[href*="gothic_corners"]) {
  display: none !important;
}

.trade-entry-shell :deep([class*="overflow-visible"][class*="z-50"]) {
  display: none !important;
}

</style>
