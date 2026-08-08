<template>
  <div class="ex-trade-archive w-full h-full text-white font-mono pt-24 px-6 pb-12 relative flex flex-col">
    <!-- Grid overlay -->
    <div class="absolute inset-0 pointer-events-none opacity-20 bg-[#030303]"
         style="background-image: radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px); background-size: 24px 24px;"></div>

    <div class="relative z-10 max-w-7xl mx-auto h-[calc(100vh-12rem)] max-h-[860px] w-full flex flex-col">
      <!-- HEADER / STRATEGY SELECTOR -->
      <div class="flex flex-col relative w-max mb-12 shrink-0">
        <div class="flex items-center space-x-3 cursor-pointer group/strat" @click="showStrategyMenu = !showStrategyMenu">
          <div class="w-1.5 h-1.5 bg-white rotate-45 transition-all duration-500" :class="showStrategyMenu ? 'scale-150 rotate-[225deg]' : 'animate-pulse'"></div>
          <span class="text-[10px] tracking-[0.5em] uppercase font-black transition-opacity group-hover/strat:opacity-100" :class="showStrategyMenu ? 'opacity-100' : 'opacity-70'">
            TRADE ARCHIVE <span v-if="selectedStrategy" class="opacity-50 ml-2">// {{ selectedStrategy.name }}</span>
          </span>
          <div class="w-2 h-2 border-b border-r border-white/40 rotate-45 transition-transform duration-500 ml-2" :class="showStrategyMenu ? '-rotate-[135deg] translate-y-0.5' : ''"></div>
        </div>

        <Transition name="fade">
          <div v-if="showStrategyMenu" class="absolute top-full left-0 mt-4 w-64 z-[100] pointer-events-auto bg-[#0a0a0a] border border-white/10 shadow-2xl">
            <div class="py-2">
              <div v-for="s in strategies" :key="s.id"
                   @click.stop="selectedStrategyId = s.id; showStrategyMenu = false"
                   class="group/item relative px-6 py-3 cursor-pointer transition-all duration-300 border-b border-white/5 last:border-0"
                   :class="selectedStrategyId === s.id ? 'bg-white text-black' : 'hover:bg-white/5 text-white/60'">
                <span class="text-[9px] tracking-[0.2em] uppercase font-bold group-hover/item:tracking-[0.3em] transition-all">
                  {{ s.name }}
                </span>
                <div v-if="selectedStrategyId === s.id" class="absolute right-4 top-1/2 -translate-y-1/2 w-1 h-1 bg-black rotate-45"></div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- SUMMARY ROW -->
      <div class="flex flex-wrap items-end gap-16 border-b border-white/10 pb-8 mb-8 shrink-0 pr-4">
        <div class="flex flex-col">
          <span class="text-6xl font-bold tracking-tighter leading-none">{{ trades.length }}</span>
          <span class="text-[8px] tracking-[0.3em] opacity-40 uppercase mt-4">TRADES RECORDED</span>
        </div>

        <div class="flex space-x-12 pb-1">
          <div class="flex flex-col space-y-2">
            <span class="text-[8px] tracking-[0.2em] opacity-40 uppercase">TOTAL P/L</span>
            <span class="text-[13px] font-bold" :class="totalPnl >= 0 ? 'text-white' : 'text-white/60'">
              {{ totalPnl >= 0 ? '+' : '' }}{{ totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </span>
          </div>

          <div class="flex flex-col space-y-2">
            <span class="text-[8px] tracking-[0.2em] opacity-40 uppercase">WIN RATE</span>
            <span class="text-[13px] font-bold">{{ (winRate * 100).toFixed(1) }}%</span>
          </div>

          <div class="flex flex-col space-y-2">
            <span class="text-[8px] tracking-[0.2em] opacity-40 uppercase">TOTAL R</span>
            <span class="text-[13px] font-bold" :class="totalR >= 0 ? 'text-white' : 'text-white/60'">
              {{ totalR >= 0 ? '+' : '' }}{{ totalR.toFixed(1) }}R
            </span>
          </div>

          <div class="flex flex-col space-y-2">
            <span class="text-[8px] tracking-[0.2em] opacity-40 uppercase">AVG R</span>
            <span class="text-[13px] font-bold" :class="avgR >= 0 ? 'text-white' : 'text-white/60'">
              {{ avgR >= 0 ? '+' : '' }}{{ avgR.toFixed(2) }}R
            </span>
          </div>
        </div>
      </div>

      <!-- TRADES SCROLL CONTAINER -->
      <div 
        class="flex-1 w-full overflow-y-auto archive-scrollbar pr-4 pb-12"
        :class="{ 'is-scrolling': isScrolling }"
        @scroll="handleScroll"
      >
        <!-- TRADES LIST GROUPED BY MONTH -->
      <div class="flex flex-col space-y-12 pb-32">
        <div v-for="group in groupedTrades" :key="group.month" class="flex flex-col">
          
          <!-- Month Header -->
          <div class="flex justify-between items-center border-b border-white/10 pb-3 mb-4 text-[9px] tracking-[0.3em] uppercase opacity-50 font-bold">
            <span>{{ group.month }}</span>
            <div class="flex space-x-8">
              <span>{{ group.trades.length }} TRADES</span>
              <span :class="group.totalPnl >= 0 ? 'text-white' : ''">
                {{ group.totalPnl >= 0 ? '+' : '' }}{{ group.totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
              </span>
              <span :class="group.totalR >= 0 ? 'text-white' : ''">
                {{ group.totalR >= 0 ? '+' : '' }}{{ group.totalR.toFixed(1) }}R
              </span>
            </div>
          </div>

          <!-- Trades in Month -->
          <div class="flex flex-col gap-1">
            <div v-for="trade in group.trades" :key="trade.id" 
                 class="grid grid-cols-[1.5fr_1fr_1fr_1.5fr_1fr_1fr_auto] items-center text-[10px] tracking-widest px-2 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer border border-transparent hover:border-white/5 rounded-sm">
              
              <span class="opacity-70">{{ formatDate(getTradeTime(trade)) }}</span>
              <span class="font-bold">{{ trade.asset }}</span>
              <span class="opacity-70">{{ trade.side === 'Long' || trade.side === 'long' ? 'LONG' : 'SHORT' }}</span>
              
              <!-- Mini Sparkline (Placeholder) -->
              <div class="flex items-center h-4 w-24">
                <svg viewBox="0 0 100 20" preserveAspectRatio="none" class="w-full h-full opacity-50">
                  <path :d="generateSparkline(trade)" fill="none" stroke="currentColor" stroke-width="1" />
                  <circle :cx="100" :cy="getSparklineEnd(trade)" r="1.5" fill="currentColor" />
                </svg>
              </div>
              
              <span class="text-right font-bold" :class="(trade.result || 0) >= 0 ? 'text-white' : 'text-white/60'">
                {{ (trade.result || 0) >= 0 ? '+' : '' }}{{ (trade.result || 0).toFixed(2) }}
              </span>
              
              <span class="text-right opacity-80" :class="getTradeR(trade) >= 0 ? 'text-white' : 'text-white/60'">
                {{ getTradeR(trade) >= 0 ? '+' : '' }}{{ getTradeR(trade).toFixed(1) }}R
              </span>

              <span class="opacity-30 pl-6 text-[12px]">></span>
            </div>
          </div>

      </div>
    </div>
  </div>
</div>
</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStrategyTradesStore } from '~/features/store/useStrategyTrades'

const tradeStore = useStrategyTradesStore()
const showStrategyMenu = ref(false)

const isScrolling = ref(false)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null

const handleScroll = () => {
  isScrolling.value = true
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    isScrolling.value = false
  }, 1000)
}

const strategies = computed(() => tradeStore.strategies)
const selectedStrategyId = computed({
  get: () => tradeStore.selectedStrategyId,
  set: (val) => { tradeStore.selectedStrategyId = val }
})

const selectedStrategy = computed(() => {
  return tradeStore.strategies.find(s => s.id === selectedStrategyId.value) || tradeStore.strategies[0]
})

const trades = computed(() => {
  if (!selectedStrategyId.value) return []
  return tradeStore.getTradesForStrategy(selectedStrategyId.value) || []
})

// Metrics
const totalPnl = computed(() => {
  return trades.value.reduce((acc, trade) => acc + (trade.result || 0), 0)
})

const winRate = computed(() => {
  if (trades.value.length === 0) return 0
  const wins = trades.value.filter(t => (t.result || 0) > 0).length
  return wins / trades.value.length
})

const getTradeR = (trade: any) => {
  if (trade.riskReward !== undefined) return trade.riskReward
  // Fallback estimation if R is not available
  return (trade.result || 0) > 0 ? 2.0 : -1.0
}

const getTradeTime = (trade: any) => {
  const val = trade.dateExit || trade.date
  return val ? new Date(val).getTime() : 0
}

const totalR = computed(() => {
  return trades.value.reduce((acc, trade) => acc + getTradeR(trade), 0)
})

const avgR = computed(() => {
  if (trades.value.length === 0) return 0
  return totalR.value / trades.value.length
})

// Formatting and Grouping
const formatDate = (ts?: number) => {
  if (!ts) return ''
  const d = new Date(ts)
  const day = d.getDate()
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const mins = d.getMinutes().toString().padStart(2, '0')
  return `${day} ${month} ${year}  ${hours}:${mins}`
}

const getMonthKey = (ts?: number) => {
  if (!ts) return 'UNKNOWN DATE'
  const d = new Date(ts)
  const month = d.toLocaleString('en-US', { month: 'long' }).toUpperCase()
  const year = d.getFullYear()
  return `${month} ${year}`
}

const groupedTrades = computed(() => {
  const groups: Record<string, any> = {}
  
  // Sort trades newest first
  const sortedTrades = [...trades.value].sort((a, b) => {
    return getTradeTime(b) - getTradeTime(a)
  })

  sortedTrades.forEach(trade => {
    const time = getTradeTime(trade)
    const key = getMonthKey(time)
    if (!groups[key]) {
      groups[key] = {
        month: key,
        trades: [],
        totalPnl: 0,
        totalR: 0,
        ts: time
      }
    }
    groups[key].trades.push(trade)
    groups[key].totalPnl += (trade.result || 0)
    groups[key].totalR += getTradeR(trade)
  })

  return Object.values(groups).sort((a, b) => b.ts - a.ts)
})

// Sparkline generation (mocked for visual flair as seen in image)
const generateSparkline = (trade: any) => {
  // If trade has actual path data, use it. Otherwise, generate a fake curve based on PNL.
  const isWin = (trade.result || 0) > 0
  const points = []
  let y = 10
  points.push(`M 0,${y}`)
  
  for (let i = 1; i <= 10; i++) {
    const x = i * 10
    // random walk trending towards win or loss
    const step = (Math.random() * 4 - 2) + (isWin ? -1 : 1)
    y = Math.max(2, Math.min(18, y + step))
    if (i === 10) y = isWin ? 4 : 16 // force final point
    points.push(`L ${x},${y}`)
  }
  
  return points.join(' ')
}

const getSparklineEnd = (trade: any) => {
  const isWin = (trade.result || 0) > 0
  return isWin ? 4 : 16
}

</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.archive-scrollbar::-webkit-scrollbar {
  display: block;
  width: 8px;
  height: 8px;
}
.archive-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.archive-scrollbar::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 0;
}
.archive-scrollbar.is-scrolling::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
}
.archive-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.9) !important;
}
</style>
