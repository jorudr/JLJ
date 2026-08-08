<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, isRef, watch } from 'vue'
import { useStrategyTradesStore } from '~/features/store/useStrategyTrades'
import ExEquityCurve2D from '~/widgets/genesis/ui/ExEquityCurve2D.vue'
import ExTradeAnalysisPanel from '~/widgets/genesis/ui/ExTradeAnalysisPanel.vue'
import ExTacticalNodeTooltip from '~/widgets/genesis/ui/ExTacticalNodeTooltip.vue'
import { useI18n } from '~/shared/i18n/useI18n'
import { useDomI18n } from '~/shared/i18n/useDomI18n'
import { useMatrixState } from '~/widgets/genesis/model/matrix/useMatrixState'
import { filterTradesBySelectedStrategyVersion } from '~/shared/utils/strategyVersionScope'
import { buildTradeProfitabilityScoreIndex, getTradePnlForScore } from '~/widgets/genesis/model/tradeProfitabilityScore'

const { t, locale } = useI18n()
const tr = (ru: string, en: string) => locale.value === 'ru' ? ru : en
const mapRoot = ref<HTMLElement | null>(null)
useDomI18n(mapRoot, 'genesis.dom')

const props = withDefaults(defineProps<{
  isOpen: boolean
  isDark?: boolean
  trade?: any
  emotionalRank?: number
  pickedEmotions?: any[]
  initialPage?: number
  initialExpandedNoteId?: string
  openAnalyticsOnMount?: boolean
  embedded?: boolean
}>(), {
  isDark: false,
  emotionalRank: 64,
  pickedEmotions: () => [
    { 
      name: 'FOCUS', 
      freq: '84.6%', freqTrend: 'up', 
      pf: '2.45', pfTrend: 'up',
      history: { 
        pf: [1.8, 1.9, 1.85, 2.0, 2.1, 2.05, 2.2, 2.15, 2.3, 2.2, 2.1, 2.25, 2.3, 2.4, 2.35, 2.2, 2.25, 2.3, 2.35, 2.45],
        freq: [70, 72, 75, 74, 76, 78, 80, 79, 81, 82, 80, 81, 83, 84, 82, 80, 81, 82, 83, 84.6]
      }
    },
    { 
      name: 'FOMO', 
      freq: '12.1%', freqTrend: 'down', 
      pf: '0.64', pfTrend: 'down',
      history: { 
        pf: [1.2, 0.9, 0.7, 1.1, 0.8, 0.6, 1.0, 0.9, 0.7, 0.5, 0.8, 0.9, 0.7, 0.6, 0.8, 1.0, 0.9, 0.8, 0.7, 0.64],
        freq: [20, 45, 10, 35, 15, 50, 12, 40, 18, 55, 14, 30, 16, 45, 20, 35, 18, 25, 15, 12.1]
      }
    },
    { 
      name: 'FATIGUE', 
      freq: '44.2%', freqTrend: 'up', 
      pf: '1.05', pfTrend: 'down',
      history: { 
        pf: [1.5, 1.45, 1.4, 1.35, 1.3, 1.28, 1.25, 1.22, 1.2, 1.18, 1.15, 1.12, 1.1, 1.08, 1.05, 1.03, 1.02, 1.05, 1.1, 1.05],
        freq: [30, 32, 33, 35, 36, 38, 40, 41, 42, 43, 44, 45, 46, 47, 48, 47, 46, 45, 44, 44.2]
      }
    }
  ]
})

const emit = defineEmits(['close'])

interface TacticalNode {
  id: string
  name: string
  x: number
  y: number
  freq: string
  freqTrend: 'up' | 'down'
  pf: string
  pfTrend: 'up' | 'down'
  history: {
    pf: number[]
    freq: number[]
  }
}

// TACTICAL COORDINATE BLUEPRINT (Fixed spatial registry for 20 slots per scenario)
const TACTICAL_BLUEPRINT: { ENTRY_SLOTS: { x: number, y: number }[], EXIT_SLOTS: { x: number, y: number }[] } = {
  ENTRY_SLOTS: [
    { x: 500, y: 100 }, { x: 550, y: 250 }, { x: 500, y: 400 }, { x: 200, y: 550 },
    { x: -100, y: 450 }, { x: -150, y: 200 }, { x: 100, y: 50 }, { x: 600, y: -50 },
    { x: 750, y: 170 }, { x: 800, y: 350 }, { x: 700, y: 550 }, { x: 450, y: 650 },
    { x: 150, y: 750 }, { x: -200, y: 600 }, { x: -350, y: 350 }, { x: -300, y: 100 },
    { x: 50, y: -150 }, { x: 350, y: -250 }, { x: 950, y: -100 }, { x: 1050, y: 150 }
  ],
  EXIT_SLOTS: [
    { x: 1300, y: 250 }, { x: 1280, y: 350 }, { x: 1300, y: 500 }, { x: 1600, y: 400 },
    { x: 1750, y: 550 }, { x: 1650, y: 150 }, { x: 1800, y: 800 }, { x: 1650, y: 950 },
    { x: 1350, y: 1150 }, { x: 1000, y: 1100 }, { x: 900, y: 1000 }, { x: 1100, y: 850 },
    { x: 1400, y: 600 }, { x: 1850, y: 250 }, { x: 2000, y: 450 }, { x: 2100, y: 700 },
    { x: 2050, y: 900 }, { x: 1700, y: 1100 }, { x: 1400, y: 1250 }, { x: 900, y: 1200 }
  ]
}

// VIEW STATE (Zoom & Pan)
const viewState = ref({
  panX: 100, // Initial offset
  panY: 100,
  scale: 1.0,
  isPanning: false
})

const tradeStore = useStrategyTradesStore()
const { strategyVersions, selectedStrategyVersionId } = useMatrixState()
const equityModalOpen = ref(false)
const analyticsModalOpen = ref(props.openAnalyticsOnMount || false)
const activeAnalyticsPage = ref(props.initialPage || 3)

watch(() => props.initialPage, (newVal) => {
  if (newVal) activeAnalyticsPage.value = newVal
}, { immediate: true })

watch(() => props.openAnalyticsOnMount, (newVal) => {
  if (newVal) {
    if (props.initialPage) activeAnalyticsPage.value = props.initialPage
    analyticsModalOpen.value = true
  }
}, { immediate: true })
const allTrades = computed(() => {
  if (!props.trade?.strategyId) return []
  const trades = tradeStore.getTradesForStrategy(props.trade.strategyId)
  if (props.trade.strategyId === 'MAIN_DIARY') return trades

  return filterTradesBySelectedStrategyVersion(
    trades,
    strategyVersions.value || [],
    selectedStrategyVersionId.value
  )
})

const equityTrades = computed(() => {
  if (!props.trade) return []
  const historyTrades = allTrades.value

  const currentTradeTime = new Date(props.trade.dateExit || props.trade.date || Date.now()).getTime()
  
  // Combine and ensure current trade is marked as projection for the curve to show it as "impact"
  const exists = historyTrades.some(t => t.id === props.trade.id)
  const combined = (exists ? [...historyTrades] : [...historyTrades, props.trade]).map(t => ({
    ...t,
    // We mark the current trade we are analyzing as the projection target
    isProjection: t.id === props.trade.id
  }))
  
  const sorted = combined.sort((a, b) => {
    const dA = new Date(a.dateExit || a.date || 0).getTime()
    const dB = new Date(b.dateExit || b.date || 0).getTime()
    return dA - dB
  })
  
  // Filter: only show history up to this specific trade's exit
  return sorted.filter(t => {
    const tTime = new Date(t.dateExit || t.date || 0).getTime()
    return tTime <= currentTradeTime
  })
})

const currentInitialDeposit = computed(() => {
  if (!props.trade) return 1000
  return tradeStore.getInitialDeposit(props.trade.strategyId || 'MAIN_DIARY')
})

const getNormalizedPnl = (tr: any) => {
  return getTradePnlForScore(tr, currentInitialDeposit.value)
}

const getEmotionName = (emotion: any) => {
  if (!emotion) return ''
  if (typeof emotion === 'string') return emotion
  if (typeof emotion === 'object' && emotion.name) return String(emotion.name)
  if (typeof emotion === 'object' && emotion.id) return String(emotion.id)
  return String(emotion)
}

const scoreSourceTrades = computed(() => {
  const list = [...allTrades.value]
  const idx = list.findIndex(t => t.id === props.trade?.id)
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...props.trade }
  } else if (props.trade?.id) {
    list.push(props.trade)
  }
  return list
})

const tradeProfitabilityScoreIndex = computed(() => {
  return buildTradeProfitabilityScoreIndex(scoreSourceTrades.value, currentInitialDeposit.value)
})

const percentileRank = computed(() => {
  const trade = props.trade as any
  if (!trade) return 0
  const score = tradeProfitabilityScoreIndex.value.get(String(trade.id || '')) ?? tradeProfitabilityScoreIndex.value.get(trade)
  return score?.score ?? 0
})

const contentTransform = computed(() => ({
  transform: `translate(${viewState.value.panX}px, ${viewState.value.panY}px) scale(${viewState.value.scale})`,
  transformOrigin: '0 0'
}))

// MOCK DATA WITH SPATIAL COORDINATES
const entryConditions = computed(() => {
  const s = props.trade?.scenarios?.find((s: any) => s.type === 'entry')
  if (!s || !s.conditions) return []
  
  const filteredConditions = s.conditions.filter((c: any) => {
    const systemNames = ['TAKE_PROFIT', 'STOP_LOSS', 'FULL_LIQUIDATION']
    if (systemNames.includes(s.name?.toUpperCase()) && c.name?.toUpperCase() === s.name?.toUpperCase()) {
      return false
    }
    return true
  })

  return filteredConditions.map((c: any, i: number) => {
    const pfHistory = c.history?.pf || Array.from({ length: 21 }, () => 1.0)
    const freqHistory = c.history?.freq || Array.from({ length: 21 }, () => 100)
    
    const lastFreq = freqHistory[freqHistory.length - 1]
    const prevFreq = freqHistory[freqHistory.length - 2] || lastFreq
    const lastPf = pfHistory[pfHistory.length - 1]
    const prevPf = pfHistory[pfHistory.length - 2] || lastPf

    return {
      id: c.id,
      name: c.name,
      x: TACTICAL_BLUEPRINT.ENTRY_SLOTS[i]?.x || 0,
      y: TACTICAL_BLUEPRINT.ENTRY_SLOTS[i]?.y || 0,
      freq: lastFreq.toFixed(1) + '%',
      freqTrend: lastFreq >= prevFreq ? 'up' : 'down' as const,
      pf: lastPf.toFixed(2),
      pfTrend: lastPf >= prevPf ? 'up' : 'down' as const,
      history: { pf: pfHistory, freq: freqHistory }
    }
  })
})

const exitConditions = computed(() => {
  const s = props.trade?.scenarios?.find((s: any) => s.type === 'exit')
  if (!s || !s.conditions) return []
  
  const filteredConditions = s.conditions.filter((c: any) => {
    const systemNames = ['TAKE_PROFIT', 'STOP_LOSS', 'FULL_LIQUIDATION']
    if (systemNames.includes(s.name?.toUpperCase()) && c.name?.toUpperCase() === s.name?.toUpperCase()) {
      return false
    }
    return true
  })

  return filteredConditions.map((c: any, i: number) => {
    const pfHistory = c.history?.pf || Array.from({ length: 21 }, () => 1.0)
    const freqHistory = c.history?.freq || Array.from({ length: 21 }, () => 100)

    const lastFreq = freqHistory[freqHistory.length - 1]
    const prevFreq = freqHistory[freqHistory.length - 2] || lastFreq
    const lastPf = pfHistory[pfHistory.length - 1]
    const prevPf = pfHistory[pfHistory.length - 2] || lastPf

    return {
      id: c.id,
      name: c.name,
      x: TACTICAL_BLUEPRINT.EXIT_SLOTS[i]?.x || 0,
      y: TACTICAL_BLUEPRINT.EXIT_SLOTS[i]?.y || 0,
      freq: lastFreq.toFixed(1) + '%',
      freqTrend: lastFreq >= prevFreq ? 'up' : 'down' as const,
      pf: lastPf.toFixed(2),
      pfTrend: lastPf >= prevPf ? 'up' : 'down' as const,
      history: { pf: pfHistory, freq: freqHistory }
    }
  })
})

const entryHubData = computed(() => {
  const s = props.trade?.scenarios?.find((s: any) => s.type === 'entry')
  if (!s) return null
  
  const pfHistory = s.history?.pf || Array.from({ length: 21 }, () => 1.0)
  const freqHistory = s.history?.freq || Array.from({ length: 21 }, () => 100)
  
  const lastFreq = freqHistory[freqHistory.length - 1]
  const prevFreq = freqHistory[freqHistory.length - 2] || lastFreq
  const lastPf = pfHistory[pfHistory.length - 1]
  const prevPf = pfHistory[pfHistory.length - 2] || lastPf
  
  return {
    id: s.id,
    name: s.name || tr('Сценарий входа', 'Entry Scenario'),
    freq: lastFreq.toFixed(1) + '%',
    freqTrend: lastFreq >= prevFreq ? 'up' : 'down' as const,
    pf: lastPf.toFixed(2),
    pfTrend: lastPf >= prevPf ? 'up' : 'down' as const,
    history: { pf: pfHistory, freq: freqHistory }
  }
})

const exitHubData = computed(() => {
  const s = props.trade?.scenarios?.find((s: any) => s.type === 'exit')
  if (!s) return null
  
  const pfHistory = s.history?.pf || Array.from({ length: 21 }, () => 1.0)
  const freqHistory = s.history?.freq || Array.from({ length: 21 }, () => 100)

  const lastFreq = freqHistory[freqHistory.length - 1]
  const prevFreq = freqHistory[freqHistory.length - 2] || lastFreq
  const lastPf = pfHistory[pfHistory.length - 1]
  const prevPf = pfHistory[pfHistory.length - 2] || lastPf

  return {
    id: s.id,
    name: s.name || tr('Сценарий выхода', 'Exit Scenario'),
    freq: lastFreq.toFixed(1) + '%',
    freqTrend: lastFreq >= prevFreq ? 'up' : 'down' as const,
    pf: lastPf.toFixed(2),
    pfTrend: lastPf >= prevPf ? 'up' : 'down' as const,
    history: { pf: pfHistory, freq: freqHistory }
  }
})

const displayEmotions = computed(() => {
  if (props.trade?.emotions) {
    return props.trade.emotions.map((e: any) => {
      const name = getEmotionName(e)
      const pfHistory = e.history?.pf || Array.from({ length: 21 }, () => 1.0)
      const freqHistory = e.history?.freq || Array.from({ length: 21 }, () => 100)
      
      const lastFreq = freqHistory[freqHistory.length - 1]
      const prevFreq = freqHistory[freqHistory.length - 2] || lastFreq
      const lastPf = pfHistory[pfHistory.length - 1]
      const prevPf = pfHistory[pfHistory.length - 2] || lastPf

      return { 
        id: name,
        name,
        freq: lastFreq.toFixed(1) + '%', 
        freqTrend: lastFreq >= prevFreq ? 'up' : 'down' as const, 
        pf: lastPf.toFixed(2), 
        pfTrend: lastPf >= prevPf ? 'up' : 'down' as const,
        history: { pf: pfHistory, freq: freqHistory }
      }
    })
  }
  return (props.pickedEmotions || []).map((emotion: any) => {
    const name = getEmotionName(emotion)
    return {
      ...emotion,
      id: emotion.id || name,
      name
    }
  })
})

// CHART VIEW STATE (TradingView-style interaction)
const chartView = ref({
  zoomX: 1,
  zoomY: 1,
  offsetX: 0,
  offsetY: 0,
  isPanning: false,
  startX: 0,
  startY: 0,
  startOffsetX: 0,
  startOffsetY: 0
})

function startChartPan(e: MouseEvent) {
  chartView.value.isPanning = true
  chartView.value.startX = e.clientX
  chartView.value.startY = e.clientY
  chartView.value.startOffsetX = chartView.value.offsetX
  chartView.value.startOffsetY = chartView.value.offsetY
  
  const onMove = (me: MouseEvent) => {
    if (!chartView.value.isPanning) return
    const dx = me.clientX - chartView.value.startX
    const dy = me.clientY - chartView.value.startY
    chartView.value.offsetX = chartView.value.startOffsetX - (dx / chartView.value.zoomX)
    chartView.value.offsetY = chartView.value.startOffsetY + (dy / chartView.value.zoomY)
  }
  
  const onUp = () => {
    chartView.value.isPanning = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function handleChartZoom(e: WheelEvent) {
  const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
  
  if (e.shiftKey) {
    // Zoom Y (Price/Value Scale)
    chartView.value.zoomY = Math.max(0.2, Math.min(20, chartView.value.zoomY * zoomFactor))
  } else {
    // Zoom X (Time Scale)
    chartView.value.zoomX = Math.max(0.2, Math.min(20, chartView.value.zoomX * zoomFactor))
  }
}

function resetChartView() {
  chartView.value.zoomX = 1
  chartView.value.zoomY = 1
  chartView.value.offsetX = 0
  chartView.value.offsetY = 0
}

const showFrequency = ref(true)
const showPF = ref(true)



const hoveredNode = ref<any>(null)
const tooltipPos = ref({ x: 0, y: 0 })

function handleNodeHover(e: MouseEvent, node: any) {
  const newNode = isRef(node) ? node.value : node
  hoveredNode.value = newNode
  tooltipPos.value = { x: e.clientX, y: e.clientY }
}

function handleNodeMove(e: MouseEvent) {
  if (!hoveredNode.value) return
  tooltipPos.value = { x: e.clientX, y: e.clientY }
}

function handleNodeLeave() {
  hoveredNode.value = null
}

// INTERACTION HANDLERS
function startPan(e: MouseEvent) {
  // Don't pan if clicking on a node or if a modal is open
  if ((e.target as HTMLElement).closest('.node-element')) return
  if (equityModalOpen.value || analyticsModalOpen.value) return
  
  viewState.value.isPanning = true
  const startX = e.clientX
  const startY = e.clientY
  const initialPanX = viewState.value.panX
  const initialPanY = viewState.value.panY
  
  const onMouseMove = (mE: MouseEvent) => {
    if (!viewState.value.isPanning) return
    viewState.value.panX = initialPanX + (mE.clientX - startX)
    viewState.value.panY = initialPanY + (mE.clientY - startY)
  }
  
  const onMouseUp = () => {
    viewState.value.isPanning = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }
  
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const windowSize = ref({ width: window.innerWidth, height: window.innerHeight })
const updateWindowSize = () => {
  windowSize.value = { width: window.innerWidth, height: window.innerHeight }
}

const getIndicatorState = (worldX: number, worldY: number, hubWidth = 256, hubHeight = 96) => {
  const screenX = worldX + viewState.value.panX
  const screenY = worldY + viewState.value.panY
  const padding = 60

  const isOffScreen = 
    screenX + hubWidth < 0 || 
    screenX > windowSize.value.width || 
    screenY + hubHeight < 0 || 
    screenY > windowSize.value.height

  if (!isOffScreen) return null

  // Calculate clamped edge position
  const clampedX = Math.max(padding, Math.min(windowSize.value.width - padding, screenX + hubWidth / 2))
  const clampedY = Math.max(padding, Math.min(windowSize.value.height - padding, screenY + hubHeight / 2))

  // Calculate distance and angle
  const dx = screenX + hubWidth / 2 - clampedX
  const dy = screenY + hubHeight / 2 - clampedY
  const dist = Math.round(Math.sqrt(dx * dx + dy * dy))
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  return { x: clampedX, y: clampedY, dist, angle }
}

const entryIndicator = computed(() => getIndicatorState(150, 300))
const exitIndicator = computed(() => getIndicatorState(1200, 700))

function getLinePath(x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1
  const midX = x1 + dx / 2
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
}

const connectionColor = computed(() => props.isDark ? '#ffffff' : '#000000')
const connectionOpacity = computed(() => props.isDark ? '0.1' : '0.1')
const mainLinkOpacity = computed(() => props.isDark ? '0.1' : '0.1')

onMounted(() => {
  window.addEventListener('resize', updateWindowSize)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && props.isOpen) {
      emit('close')
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowSize)
})

const EMOTION_WEIGHTS: Record<string, number> = {
  // Positive
  'CALMNESS': 15,
  'DISCIPLINE': 25,
  'FOCUS': 20,
  'PATIENCE': 15,
  'CONFIDENCE': 15,
  // Neutral
  'HOPE': -10,
  'BOREDOM': -10,
  'FATIGUE': -15,
  // Negative
  'FOMO': -20,
  'REVENGE': -30,
  'GREED': -20,
  'FEAR': -20,
  'TILT': -40,
  'ANXIETY': -15
}

const calculatedStabilityIndex = computed(() => {
  const emotions = displayEmotions.value
  if (!emotions || emotions.length === 0) {
    return props.emotionalRank ?? 60
  }
  
  let score = 60 // Baseline stability
  emotions.forEach((e: any) => {
    const key = (e.name || '').toUpperCase()
    const weight = EMOTION_WEIGHTS[key] || 0
    score += weight
  })
  
  return Math.min(Math.max(Math.round(score), 0), 100)
})

</script>

<template>
  <div v-if="isOpen" ref="mapRoot"
       class="ethereal-void overflow-hidden flex flex-col select-none"
       :class="embedded ? 'absolute inset-0 z-10' : 'fixed inset-0 z-[10000]'"
       @mousedown="startPan">
    <!-- HUD Overlay (Fixed) -->
    <div class="absolute inset-0 pointer-events-none z-[100]">
      <!-- Top Center Percentile Rank Label -->
      <div class="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-[200]">
        <div class="px-6 py-2 transition-all duration-500"
             :class="isDark ? 'text-white/40 hover:text-white/70' : 'text-black/40 hover:text-black/70'">
          <span class="text-base font-serif tracking-widest">
            {{ t('tacticalNodeMap.betterThan') }} <span class="font-bold nier-text-primary">{{ percentileRank }}%</span> {{ t('tacticalNodeMap.ofYourTrades') }}
          </span>
        </div>
      </div>

      <!-- Off-Screen Indicators -->
      <div v-if="entryIndicator" 
           class="absolute pointer-events-auto flex flex-col items-center transition-all duration-300"
           :style="{ left: entryIndicator.x + 'px', top: entryIndicator.y + 'px', transform: 'translate(-50%, -50%)' }">
        <div class="w-10 h-10 flex items-center justify-center transition-transform duration-100"
             :style="{ transform: `rotate(${entryIndicator.angle}deg)` }">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" :class="isDark ? 'text-white' : 'text-black'">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="flex flex-col items-center mt-1">
          <span class="text-[8px] font-mono font-bold tracking-widest" :class="isDark ? 'text-white' : 'text-black'">{{ t('tacticalNodeMap.entryHub') }}</span>
          <span class="text-[7px] font-mono opacity-60 font-bold" :class="isDark ? 'text-white' : 'text-black'">{{ entryIndicator.dist }}px</span>
        </div>
      </div>

      <div v-if="exitIndicator" 
           class="absolute pointer-events-auto flex flex-col items-center transition-all duration-300"
           :style="{ left: exitIndicator.x + 'px', top: exitIndicator.y + 'px', transform: 'translate(-50%, -50%)' }">
        <div class="w-10 h-10 flex items-center justify-center transition-transform duration-100"
             :style="{ transform: `rotate(${exitIndicator.angle}deg)` }">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" :class="isDark ? 'text-white' : 'text-black'">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="flex flex-col items-center mt-1">
          <span class="text-[8px] font-mono font-bold tracking-widest" :class="isDark ? 'text-white' : 'text-black'">{{ t('tacticalNodeMap.exitHub') }}</span>
          <span class="text-[7px] font-mono opacity-60 font-bold" :class="isDark ? 'text-white' : 'text-black'">{{ exitIndicator.dist }}px</span>
        </div>
      </div>
    </div>

    <!-- Infinite Map Canvas -->
    <div class="flex-grow relative w-full h-full" :class="{ 'cursor-grabbing': viewState.isPanning, 'cursor-grab': !viewState.isPanning }">
      <div class="absolute inset-0" :style="contentTransform">
        
        <!-- SVG Connections Layer -->
        <svg class="absolute inset-0 pointer-events-none overflow-visible" 
             style="width: 5000px; height: 5000px;">
          
          <!-- Connections to Entry Conditions -->
          <template v-if="entryHubData">
            <g v-for="cond in entryConditions" :key="'e-line-' + cond.id">
              <path 
                :d="getLinePath(310, 364, cond.x, cond.y + 30)" 
                fill="none" 
                :stroke="connectionColor" 
                :stroke-opacity="connectionOpacity"
                stroke-width="1"
              />
            </g>
          </template>

          <!-- Connections to Exit Conditions -->
          <template v-if="exitHubData">
            <g v-for="cond in exitConditions" :key="'ex-line-' + cond.id">
              <path 
                :d="getLinePath(1360, 764, cond.x + 280, cond.y + 30)" 
                fill="none" 
                :stroke="connectionColor" 
                :stroke-opacity="connectionOpacity"
                stroke-width="1"
              />
            </g>
          </template>

          <!-- Main Hub Neural Link -->
          <path v-if="entryHubData && exitHubData"
            :d="getLinePath(310, 364, 1360, 764)" 
            fill="none" 
            :stroke="connectionColor" 
            :stroke-opacity="mainLinkOpacity"
            stroke-width="0.8" 
          />
        </svg>

        <!-- Scenario Hub: Entry -->
        <div v-if="entryHubData" class="absolute node-element group cursor-pointer" style="left: 150px; top: 300px;" 
             @mouseenter="handleNodeHover($event, entryHubData)"
             @mousemove="handleNodeMove"
             @mouseleave="handleNodeLeave">
          <div class="relative w-[320px] h-32 flex flex-col justify-center p-6 transition-all duration-700 border-2"
               :class="isDark ? 'border-nier-border-dark group-hover:border-nier-text-dark' : 'border-nier-border-light group-hover:border-nier-text-light'">
            <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 opacity-60" :class="isDark ? 'border-nier-text-dark' : 'border-black'"></div>
            <div class="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 opacity-60" :class="isDark ? 'border-nier-text-dark' : 'border-black'"></div>
            <div class="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 opacity-60" :class="isDark ? 'border-nier-text-dark' : 'border-black'"></div>
            <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 opacity-60" :class="isDark ? 'border-nier-text-dark' : 'border-black'"></div>
            
            <div class="mb-4 text-center w-full px-2">
              <div class="text-xl font-black uppercase tracking-widest truncate" :class="isDark ? 'text-white' : 'text-black'">{{ entryHubData.name }}</div>
            </div>

            <div class="flex items-center justify-around w-full border-t nier-border-primary pt-4">
              <div class="flex flex-col items-center">
                <span class="text-[8px] font-mono opacity-40 uppercase mb-1" :class="isDark ? 'text-white' : 'text-black'">{{ t('tacticalNodeMap.frequency') }}</span>
                <div class="flex items-center space-x-1">
                  <span class="text-xs font-mono font-bold" :class="isDark ? 'text-white' : 'text-black'">{{ entryHubData.freq }}</span>
                  <svg v-if="entryHubData.freqTrend === 'up'" width="10" height="10" viewBox="0 0 24 24" fill="none" class="text-green-500"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" class="text-red-500"><path d="M7 7L17 17M17 17V7M17 17H7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
              </div>
              <div class="flex flex-col items-center">
                <span class="text-[8px] font-mono opacity-40 uppercase mb-1" :class="isDark ? 'text-white' : 'text-black'">{{ t('tacticalNodeMap.pfRatio') }}</span>
                <div class="flex items-center space-x-1">
                  <span class="text-xs font-mono font-bold" :class="isDark ? 'text-white' : 'text-black'">{{ entryHubData.pf }}</span>
                  <svg v-if="entryHubData.pfTrend === 'up'" width="10" height="10" viewBox="0 0 24 24" fill="none" class="text-green-500"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" class="text-red-500"><path d="M7 7L17 17M17 17V7M17 17H7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scenario Hub: Exit -->
        <div v-if="exitHubData" class="absolute node-element group cursor-pointer" style="left: 1200px; top: 700px;" 
             @mouseenter="handleNodeHover($event, exitHubData)"
             @mousemove="handleNodeMove"
             @mouseleave="handleNodeLeave">
          <div class="relative w-[320px] h-32 flex flex-col justify-center p-6 transition-all duration-700 border-2"
               :class="isDark ? 'border-nier-border-dark group-hover:border-nier-text-dark' : 'border-nier-border-light group-hover:border-nier-text-light'">
            <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 opacity-60" :class="isDark ? 'border-nier-text-dark' : 'border-black'"></div>
            <div class="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 opacity-60" :class="isDark ? 'border-nier-text-dark' : 'border-black'"></div>
            <div class="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 opacity-60" :class="isDark ? 'border-nier-text-dark' : 'border-black'"></div>
            <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 opacity-60" :class="isDark ? 'border-nier-text-dark' : 'border-black'"></div>
            
            <div class="mb-4 text-center w-full px-2">
              <div class="text-xl font-black uppercase tracking-widest truncate" :class="isDark ? 'text-white' : 'text-black'">{{ exitHubData.name }}</div>
            </div>

            <div class="flex items-center justify-around w-full border-t nier-border-primary pt-4">
              <div class="flex flex-col items-center">
                <span class="text-[8px] font-mono opacity-40 uppercase mb-1" :class="isDark ? 'text-white' : 'text-black'">{{ t('tacticalNodeMap.frequency') }}</span>
                <div class="flex items-center space-x-1">
                  <span class="text-xs font-mono font-bold" :class="isDark ? 'text-white' : 'text-black'">{{ exitHubData.freq }}</span>
                  <svg v-if="exitHubData.freqTrend === 'up'" width="10" height="10" viewBox="0 0 24 24" fill="none" class="text-green-500"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" class="text-red-500"><path d="M7 7L17 17M17 17V7M17 17H7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
              </div>
              <div class="flex flex-col items-center">
                <span class="text-[8px] font-mono opacity-40 uppercase mb-1" :class="isDark ? 'text-white' : 'text-black'">{{ t('tacticalNodeMap.pfRatio') }}</span>
                <div class="flex items-center space-x-1">
                  <span class="text-xs font-mono font-bold" :class="isDark ? 'text-white' : 'text-black'">{{ exitHubData.pf }}</span>
                  <svg v-if="exitHubData.pfTrend === 'up'" width="10" height="10" viewBox="0 0 24 24" fill="none" class="text-green-500"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" class="text-red-500"><path d="M7 7L17 17M17 17V7M17 17H7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Distributed Condition Nodes: Entry -->
        <div v-for="cond in entryConditions" :key="cond.id"
             class="absolute node-element min-w-[280px] border p-4 flex items-center justify-between group cursor-pointer transition-all duration-500"
             :class="isDark ? 'border-white/10 hover:border-white' : 'border-black/10 hover:border-black'"
             :style="{ left: cond.x + 'px', top: cond.y + 'px' }"
             @mouseenter="handleNodeHover($event, cond)"
             @mousemove="handleNodeMove"
             @mouseleave="handleNodeLeave">
          <div class="flex flex-col mr-8">
            <span class="text-[11px] font-mono uppercase tracking-widest font-black" :class="isDark ? 'text-white' : 'text-black'">{{ cond.name }}</span>
          </div>

          <div class="flex flex-col space-y-1">
            <div class="flex items-center justify-end space-x-2">
              <span class="text-[7px] font-mono opacity-30" :class="isDark ? 'text-white' : 'text-black'">{{ t('tacticalNodeMap.freqShort') }}</span>
              <div class="flex items-center space-x-0.5">
                <span class="text-[9px] font-mono font-bold" :class="isDark ? 'text-white' : 'text-black'">{{ cond.freq }}</span>
                <svg v-if="cond.freqTrend === 'up'" width="8" height="8" viewBox="0 0 24 24" fill="none" class="text-green-500"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg v-else width="8" height="8" viewBox="0 0 24 24" fill="none" class="text-red-500"><path d="M7 7L17 17M17 17V7M17 17H7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
            </div>
            <div class="flex items-center justify-end space-x-2">
              <span class="text-[7px] font-mono opacity-30" :class="isDark ? 'text-white' : 'text-black'">{{ t('tacticalNodeMap.pfShort') }}</span>
              <div class="flex items-center space-x-0.5">
                <span class="text-[9px] font-mono font-bold" :class="isDark ? 'text-white' : 'text-black'">{{ cond.pf }}</span>
                <svg v-if="cond.pfTrend === 'up'" width="8" height="8" viewBox="0 0 24 24" fill="none" class="text-green-500"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg v-else width="8" height="8" viewBox="0 0 24 24" fill="none" class="text-red-500"><path d="M7 7L17 17M17 17V7M17 17H7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Distributed Condition Nodes: Exit -->
        <div v-for="cond in exitConditions" :key="cond.id"
             class="absolute node-element min-w-[280px] border p-4 flex items-center justify-between group cursor-pointer transition-all duration-500"
             :class="isDark ? 'border-white/10 hover:border-white' : 'border-black/10 hover:border-black'"
             :style="{ left: cond.x + 'px', top: cond.y + 'px' }"
             @mouseenter="handleNodeHover($event, cond)"
             @mousemove="handleNodeMove"
             @mouseleave="handleNodeLeave">
          
          <div class="flex flex-col space-y-1">
            <div class="flex items-center justify-start space-x-2">
              <div class="flex items-center space-x-0.5">
                <svg v-if="cond.freqTrend === 'up'" width="8" height="8" viewBox="0 0 24 24" fill="none" class="text-green-500"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg v-else width="8" height="8" viewBox="0 0 24 24" fill="none" class="text-red-500"><path d="M7 7L17 17M17 17V7M17 17H7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span class="text-[9px] font-mono font-bold" :class="isDark ? 'text-white' : 'text-black'">{{ cond.freq }}</span>
              </div>
              <span class="text-[7px] font-mono opacity-30" :class="isDark ? 'text-white' : 'text-black'">{{ t('tacticalNodeMap.freqShort') }}</span>
            </div>
            <div class="flex items-center justify-start space-x-2">
              <div class="flex items-center space-x-0.5">
                <svg v-if="cond.pfTrend === 'up'" width="8" height="8" viewBox="0 0 24 24" fill="none" class="text-green-500"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <svg v-else width="8" height="8" viewBox="0 0 24 24" fill="none" class="text-red-500"><path d="M7 7L17 17M17 17V7M17 17H7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span class="text-[9px] font-mono font-bold" :class="isDark ? 'text-white' : 'text-black'">{{ cond.pf }}</span>
              </div>
              <span class="text-[7px] font-mono opacity-30" :class="isDark ? 'text-white' : 'text-black'">{{ t('tacticalNodeMap.pfShort') }}</span>
            </div>
          </div>

          <div class="flex flex-col items-end ml-8">
            <span class="text-[11px] font-mono uppercase tracking-widest font-black" :class="isDark ? 'text-white' : 'text-black'">{{ cond.name }}</span>
          </div>
        </div>

      </div>
    </div>

    <!-- Equity Impact Modal -->
    <div v-if="equityModalOpen" 
         class="absolute inset-0 z-[20000] flex items-center justify-center pointer-events-auto"
         @mousedown.stop
         @click="equityModalOpen = false">
      <div class="relative w-[1100px] h-[600px] border nier-border-primary p-8 overflow-visible nier-text-primary" @click.stop>
        <!-- Tactical Corners -->
        <div class="absolute -top-1 -left-1 w-6 h-6 border-t border-l opacity-60 z-50 border-black/30 dark:border-white/30"></div>
        <div class="absolute -top-1 -right-1 w-6 h-6 border-t border-r opacity-60 z-50 border-black/30 dark:border-white/30"></div>
        <div class="absolute -bottom-1 -left-1 w-6 h-6 border-b border-l opacity-60 z-50 border-black/30 dark:border-white/30"></div>
        <div class="absolute -bottom-1 -right-1 w-6 h-6 border-b border-r opacity-60 z-50 border-black/30 dark:border-white/30"></div>
        
        <!-- Close Button -->
        <button @click="equityModalOpen = false" class="absolute top-4 right-4 z-50 w-8 h-8 flex items-center justify-center border border-dashed nier-border-primary transition-all nier-text-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <ExEquityCurve2D :trades="equityTrades" :initialBalance="currentInitialDeposit" />
      </div>
    </div>

    <!-- Trade Analytics Reified Modal -->
    <div v-if="analyticsModalOpen" 
         class="absolute inset-0 z-[20000] flex items-center justify-center pointer-events-auto"
         @mousedown.stop
         @click="analyticsModalOpen = false">
      <div class="w-[1100px] h-[85vh]" @click.stop>
        <ExTradeAnalysisPanel 
          :trade="props.trade" 
          :global-stability="calculatedStabilityIndex" 
          :initial-page="activeAnalyticsPage" 
          :initial-expanded-note-id="props.initialExpandedNoteId" 
          @close="analyticsModalOpen = false" 
        />
      </div>
    </div>

    <ExTacticalNodeTooltip
      :node="hoveredNode"
      :position="tooltipPos"
      :is-dark="isDark"
    />

  </div>
</template>

<style scoped>
.node-element {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.node-element:hover {
  transform: translateY(-2px);
}

.ethereal-void { background: none !important; }

.fade-tooltip-enter-active, .fade-tooltip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-tooltip-enter-from, .fade-tooltip-leave-to {
  opacity: 0;
  transform: translate(10px, -50%) scale(0.95) !important;
}

</style>
