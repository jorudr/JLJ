<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from '~/shared/i18n/useI18n'
import ExTradeAnalysisPanel from './ExTradeAnalysisPanel.vue'
import { useStrategyTradesStore } from '~/features/store/useStrategyTrades'

const props = defineProps<{
  isDark?: boolean
  trade?: Record<string, any> | null
}>()

const { locale } = useI18n()
const tradeStore = useStrategyTradesStore()
const activeEntryFormTab = ref<'main' | 'advanced' | 'metrics' | 'notes' | 'images'>('main')
const activeProjectionMode = ref<'core' | 'projection' | 'chart'>('core')
const isCreatingTradeNote = ref(false)
const tradeNoteDraft = ref('')
const tradeNoteEditor = ref<HTMLElement | null>(null)
const savedTradeNoteSelection = ref<Range | null>(null)
const activeTradeNoteColor = ref('currentColor')
const isPersistingArchive = ref(false)

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
  return props.trade.images
    .map((image: any) => typeof image === 'string' ? { url: image } : image)
    .filter((image: any) => image && (image.url || image.name || image.createdAt || image.timestamp || image.date))
})

const canEditTradeArchive = computed(() => Boolean(props.trade?.strategyId && props.trade?.id))

const getCurrentTradeNotes = () => {
  if (Array.isArray(props.trade?.notesList)) return [...props.trade.notesList]
  const legacyNote = String(props.trade?.notes || '').trim()
  return legacyNote
    ? [{ id: 'legacy-trade-note', content: legacyNote, date: new Date().toISOString(), title: '' }]
    : []
}

const getCurrentTradeImages = () => {
  if (!Array.isArray(props.trade?.images)) return []
  return props.trade.images.map((image: any) => typeof image === 'string' ? { url: image } : { ...image })
}

const persistTradeArchiveUpdate = async (updates: Record<string, any>) => {
  if (!canEditTradeArchive.value || !props.trade?.strategyId || !props.trade?.id) return false

  isPersistingArchive.value = true
  try {
    await tradeStore.updateTrade(props.trade.strategyId, props.trade.id, updates)
    Object.entries(updates).forEach(([key, value]) => {
      if (props.trade) (props.trade as any)[key] = value
    })
    return true
  } finally {
    isPersistingArchive.value = false
  }
}

const saveTradeNote = async () => {
  const html = tradeNoteDraft.value.trim()
  const content = getTradeNotePlainText(html).trim()
  if (!content) return

  const notes = getCurrentTradeNotes()
  const saved = await persistTradeArchiveUpdate({
    notesList: [
      ...notes,
      {
        id: `note_${Date.now()}`,
        content,
        html,
        date: new Date().toISOString(),
        title: `SESSION_LOG_${notes.length + 1}`
      }
    ]
  })

  if (saved) {
    tradeNoteDraft.value = ''
    isCreatingTradeNote.value = false
  }
}

const cancelTradeNote = () => {
  tradeNoteDraft.value = ''
  savedTradeNoteSelection.value = null
  isCreatingTradeNote.value = false
}

const getTradeNotePlainText = (html: string) => String(html)
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>|<\/div>|<\/h[1-6]>|<\/blockquote>|<\/li>/gi, '\n')
  .replace(/<[^>]*>/g, '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/\n{3,}/g, '\n\n')

const syncTradeNoteEditor = () => {
  const editor = tradeNoteEditor.value
  if (!editor) return
  tradeNoteDraft.value = editor.innerHTML
}

const syncTradeNoteEditorFromDraft = () => {
  const editor = tradeNoteEditor.value
  if (!editor || editor.innerHTML === tradeNoteDraft.value) return
  editor.innerHTML = tradeNoteDraft.value
}

const saveTradeNoteSelection = () => {
  const selection = window.getSelection()
  const editor = tradeNoteEditor.value
  if (!selection?.rangeCount || !editor) return
  const range = selection.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return
  savedTradeNoteSelection.value = range.cloneRange()
}

const restoreTradeNoteSelection = () => {
  const editor = tradeNoteEditor.value
  if (!editor) return
  editor.focus()
  const selection = window.getSelection()
  if (!selection) return
  selection.removeAllRanges()
  if (savedTradeNoteSelection.value) selection.addRange(savedTradeNoteSelection.value)
}

const applyTradeNoteCommand = (command: string, value?: string) => {
  if (!tradeNoteEditor.value) return
  restoreTradeNoteSelection()
  document.execCommand('styleWithCSS', false, 'true')
  document.execCommand(command, false, value)
  syncTradeNoteEditor()
  saveTradeNoteSelection()
}

const applyTradeNoteBlock = (block: 'h1' | 'h2' | 'h3' | 'p' | 'blockquote') => {
  applyTradeNoteCommand('formatBlock', block)
}

const applyTradeNoteColor = (color: string) => {
  activeTradeNoteColor.value = color
  applyTradeNoteCommand('foreColor', color)
}

const handleTradeNoteBeforeInput = (event: InputEvent) => {
  if (event.inputType !== 'insertText' || !event.data || event.isComposing) return
  if (activeTradeNoteColor.value === 'currentColor') return

  const editor = tradeNoteEditor.value
  const selection = window.getSelection()
  if (!editor || !selection?.rangeCount) return
  const range = selection.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) return

  event.preventDefault()
  range.deleteContents()

  const span = document.createElement('span')
  span.style.color = activeTradeNoteColor.value
  span.appendChild(document.createTextNode(event.data))
  range.insertNode(span)

  const nextRange = document.createRange()
  nextRange.setStartAfter(span)
  nextRange.collapse(true)
  selection.removeAllRanges()
  selection.addRange(nextRange)
  syncTradeNoteEditor()
  saveTradeNoteSelection()
}

const startTradeNoteCreation = async () => {
  isCreatingTradeNote.value = true
  tradeNoteDraft.value = ''
  savedTradeNoteSelection.value = null
  activeTradeNoteColor.value = 'currentColor'
  await nextTick()
  syncTradeNoteEditorFromDraft()
  tradeNoteEditor.value?.focus()
}

const addTradeImageSlot = async () => {
  await persistTradeArchiveUpdate({
    images: [
      ...getCurrentTradeImages(),
      { url: '', context: '', name: '', tags: [], createdAt: new Date().toISOString() }
    ]
  })
}

const triggerTradeImageUpload = (index: number) => {
  document.getElementById(`time-tree-image-upload-${index}`)?.click()
}

const handleTradeImageUpload = (index: number, event: Event) => {
  const file = (event.target as HTMLInputElement)?.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async () => {
    const images = getCurrentTradeImages()
    if (!images[index]) return
    images[index] = {
      ...images[index],
      url: String(reader.result || ''),
      createdAt: images[index].createdAt || new Date().toISOString()
    }
    await persistTradeArchiveUpdate({ images })
  }
  reader.readAsDataURL(file)
}

const updateTradeImageName = async (index: number, event: Event) => {
  const name = (event.target as HTMLInputElement)?.value || ''
  const images = getCurrentTradeImages()
  if (!images[index]) return
  images[index] = { ...images[index], name }
  await persistTradeArchiveUpdate({ images })
}

const removeTradeImage = async (index: number) => {
  const images = getCurrentTradeImages()
  images.splice(index, 1)
  await persistTradeArchiveUpdate({ images })
}

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
                  <div class="flex w-full flex-col items-start gap-14">

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
                <div class="flex w-full items-center justify-end gap-4">
                  <button
                    type="button"
                    :disabled="!canEditTradeArchive || isPersistingArchive"
                    class="group grid h-9 w-9 shrink-0 place-items-center border border-white/20 transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
                    :aria-label="locale === 'ru' ? 'Добавить заметку' : 'Add note'"
                    :title="locale === 'ru' ? 'Добавить заметку' : 'Add note'"
                    @click="startTradeNoteCreation"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" />
                    </svg>
                  </button>
                </div>

                <div v-if="isCreatingTradeNote" class="flex w-full flex-col gap-4 border border-white/10 bg-white/[0.03] p-5">
                  <div class="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
                    <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyTradeNoteBlock('h1')">H1</button>
                    <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyTradeNoteBlock('h2')">H2</button>
                    <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyTradeNoteBlock('h3')">H3</button>
                    <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] font-bold transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyTradeNoteCommand('bold')">B</button>
                    <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] italic transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyTradeNoteCommand('italic')">I</button>
                    <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] underline transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyTradeNoteCommand('underline')">U</button>
                    <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyTradeNoteCommand('insertUnorderedList')">LIST</button>
                    <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyTradeNoteBlock('blockquote')">QUOTE</button>
                    <button type="button" class="h-7 w-7 bg-emerald-500" aria-label="Green text" @mousedown.stop.prevent="applyTradeNoteColor('#10b981')"></button>
                    <button type="button" class="h-7 w-7 bg-rose-500" aria-label="Red text" @mousedown.stop.prevent="applyTradeNoteColor('#ef4444')"></button>
                    <button type="button" class="h-7 w-7 bg-blue-500" aria-label="Blue text" @mousedown.stop.prevent="applyTradeNoteColor('#3b82f6')"></button>
                  </div>
                  <div
                    ref="tradeNoteEditor"
                    contenteditable="true"
                    data-text-editable="true"
                    data-placeholder="WRITE_YOUR_TRADE_NOTE..."
                    autofocus
                    :placeholder="locale === 'ru' ? 'ЗАПИШИТЕ МЫСЛИ ПО СДЕЛКЕ...' : 'WRITE YOUR TRADE NOTE...'"
                    class="trade-note-rich min-h-[320px] w-full resize-y overflow-y-auto border border-white/10 bg-transparent p-4 font-mono text-sm leading-relaxed text-white outline-none focus:border-white/35"
                    @beforeinput="handleTradeNoteBeforeInput"
                    @input="syncTradeNoteEditor"
                    @mouseup="saveTradeNoteSelection"
                    @keyup="saveTradeNoteSelection"
                    @focus="saveTradeNoteSelection"
                  ></div>
                  <div class="flex items-center justify-end gap-3">
                    <button type="button" class="border border-white/15 px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-white/50 transition-colors hover:border-white/40 hover:text-white" @click="cancelTradeNote">
                      {{ locale === 'ru' ? 'ОТМЕНА' : 'CANCEL' }}
                    </button>
                    <button type="button" :disabled="!getTradeNotePlainText(tradeNoteDraft).trim() || isPersistingArchive" class="border border-white bg-white px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-35" @click="saveTradeNote">
                      {{ locale === 'ru' ? 'СОХРАНИТЬ' : 'SAVE' }}
                    </button>
                  </div>
                </div>

                <div v-if="tradeNotes.length" class="flex w-full flex-col gap-4">
                  <article
                    v-for="(note, index) in tradeNotes"
                    :key="note.id || `trade-note-${index}`"
                    class="w-full border border-white/10 bg-white/[0.03] p-5"
                  >
                    <div v-if="note.title" class="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.24em] text-white/55">
                      {{ note.title }}
                    </div>
                    <div
                      v-if="note.html"
                      class="trade-note-rich font-mono text-sm leading-relaxed text-white/80"
                      v-html="note.html"
                    ></div>
                    <p v-else class="whitespace-pre-wrap font-mono text-sm leading-relaxed text-white/80">
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
                <div class="flex w-full items-center justify-between gap-4">
                  <h2 class="text-2xl font-mono font-black uppercase tracking-[0.22em] text-white md:text-3xl">
                    {{ locale === 'ru' ? 'ИЗОБРАЖЕНИЯ' : 'IMAGES' }}
                  </h2>
                  <button
                    type="button"
                    :disabled="!canEditTradeArchive || isPersistingArchive"
                    class="group grid h-9 w-9 shrink-0 place-items-center border border-white/20 transition-colors hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
                    :aria-label="locale === 'ru' ? 'Добавить изображение' : 'Add image'"
                    :title="locale === 'ru' ? 'Добавить изображение' : 'Add image'"
                    @click="addTradeImageSlot"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" />
                    </svg>
                  </button>
                </div>

                <div v-if="tradeImages.length" class="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
                  <figure
                    v-for="(image, index) in tradeImages"
                    :key="image.url || image.createdAt || `trade-image-${index}`"
                    class="group relative overflow-hidden border border-white/10 bg-white/[0.03]"
                  >
                    <button
                      type="button"
                      class="absolute right-0 top-0 z-10 grid h-8 w-8 place-items-center border-b border-l border-white/10 bg-black/45 font-mono text-xs text-white/60 opacity-0 transition-opacity hover:bg-rose-500 hover:text-white group-hover:opacity-100"
                      :aria-label="locale === 'ru' ? 'Удалить изображение' : 'Remove image'"
                      @click="removeTradeImage(index)"
                    >
                      ×
                    </button>
                    <input :id="`time-tree-image-upload-${index}`" type="file" accept="image/*" class="hidden" @change="handleTradeImageUpload(index, $event)" />
                    <button type="button" class="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-black/10" @click="triggerTradeImageUpload(index)">
                      <img v-if="image.url" :src="image.url" :alt="image.name || `Trade image ${index + 1}`" class="h-full w-full object-contain" />
                      <span v-else class="font-mono text-[9px] font-black uppercase tracking-[0.28em] text-white/35 transition-colors group-hover:text-white/75">
                        {{ locale === 'ru' ? 'ЗАГРУЗИТЬ' : 'UPLOAD' }}
                      </span>
                    </button>
                    <div class="border-t border-white/10 p-3">
                      <input :value="image.name || ''" type="text" :placeholder="locale === 'ru' ? 'НАЗВАНИЕ' : 'NAME'" class="w-full border border-white/10 bg-transparent px-3 py-2 font-mono text-[9px] font-black uppercase tracking-[0.16em] text-white outline-none placeholder:text-white/20 focus:border-white/35" @change="updateTradeImageName(index, $event)" />
                    </div>
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

.trade-note-rich {
  line-height: 1.5;
  text-transform: none;
  user-select: text;
  cursor: text;
  white-space: normal;
}

.trade-note-rich:empty::before {
  content: attr(data-placeholder);
  opacity: 0.25;
}

.trade-note-rich :deep(h1) {
  margin: 0.4em 0 0.7em;
  font-size: 1.8em;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: 0.08em;
}

.trade-note-rich :deep(h2) {
  margin: 0.35em 0 0.6em;
  border-bottom: 1px solid rgb(255 255 255 / 0.2);
  padding-bottom: 0.25em;
  font-size: 1.45em;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0.08em;
}

.trade-note-rich :deep(h3) {
  margin: 0.3em 0 0.5em;
  font-size: 1.15em;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: 0.06em;
}

.trade-note-rich :deep(p) {
  margin: 0 0 0.55em;
}

.trade-note-rich :deep(blockquote) {
  margin: 0.45em 0;
  border-left: 2px solid currentColor;
  padding-left: 0.8em;
  opacity: 0.78;
}

.trade-note-rich :deep(ul),
.trade-note-rich :deep(ol) {
  margin: 0.35em 0;
  padding-left: 1.5em;
}

.trade-note-rich :deep(ul) {
  list-style-type: disc;
}

.trade-note-rich :deep(ol) {
  list-style-type: decimal;
}

.trade-note-rich :deep(li) {
  margin: 0.18em 0;
}

</style>
