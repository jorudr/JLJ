<script setup lang="ts">
import { computed, ref } from 'vue'
import ExMetricCard from '~/entities/metric/ui/ExMetricCard.vue'
import { useTradeAnalysisMetrics } from './metrics'
import { useI18n } from '~/shared/i18n/useI18n'
import {
  getTradeBalanceBefore,
  getTradeDurationHours,
  getTradePnl,
  getTradeRiskReward
} from '~/widgets/genesis/model/metrics'
import { getTradePlannedStopRiskDollars } from '~/widgets/genesis/model/tradeRisk'
import { isClosedTradeForMetrics } from '~/widgets/genesis/model/tradePnl'

interface TradeMetricsPanelProps {
  trade?: any
  strategyStatsContext?: any
  allTrades?: any[]
  initialBalance?: number
  isDark?: boolean
}

const props = withDefaults(defineProps<TradeMetricsPanelProps>(), {
  allTrades: () => [],
  initialBalance: 1000,
  isDark: true
})

const { locale } = useI18n()
const activeMetricTab = ref('all')

const parsePositiveNumber = (value: unknown): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

const closedTrades = computed(() => {
  const list = Array.isArray(props.allTrades) ? [...props.allTrades] : []
  if (props.trade && isClosedTradeForMetrics(props.trade) && !list.some((trade) => trade?.id === props.trade?.id)) {
    list.push(props.trade)
  }
  return list.filter(isClosedTradeForMetrics)
})

const balanceBeforeTrade = computed(() => {
  if (!props.trade) return props.initialBalance
  return getTradeBalanceBefore(closedTrades.value, props.trade, props.initialBalance)
})

const riskBudgetDollars = computed(() => {
  const trade = props.trade || {}
  const rawRisk = parsePositiveNumber(trade.riskPerTrade ?? trade.riskPerTradeValue ?? trade.riskPercent)
  if (rawRisk === null) return null

  const isPercent = trade.riskPerTradeUnit === '%' || trade.riskPercent !== undefined
  return isPercent ? (rawRisk / 100) * balanceBeforeTrade.value : rawRisk
})

const derivedStatsContext = computed(() => {
  const pnls = closedTrades.value.map((trade) => getTradePnl(trade, props.initialBalance))
  const wins = pnls.filter((pnl) => pnl > 0)
  const losses = pnls.filter((pnl) => pnl < 0)
  const grossProfit = wins.reduce((sum, pnl) => sum + pnl, 0)
  const grossLoss = Math.abs(losses.reduce((sum, pnl) => sum + pnl, 0))
  const avgPnl = pnls.length > 0 ? pnls.reduce((sum, pnl) => sum + pnl, 0) / pnls.length : 0
  const durationHours = getTradeDurationHours(props.trade)
  const plannedStopRisk = getTradePlannedStopRiskDollars(props.trade)
  const riskBudget = riskBudgetDollars.value ?? (Number.isFinite(plannedStopRisk) ? plannedStopRisk : 0)
  const rr = getTradeRiskReward(props.trade)

  return {
    initialBalance: balanceBeforeTrade.value,
    balanceBeforeTrade: balanceBeforeTrade.value,
    allTrades: closedTrades.value,
    avgPnl,
    winRate: pnls.length > 0 ? (wins.length / pnls.length) * 100 : undefined,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : undefined),
    riskBudget: riskBudget > 0 ? riskBudget : undefined,
    plannedStopRiskDollars: Number.isFinite(plannedStopRisk) ? plannedStopRisk : undefined,
    rr: Number.isFinite(rr) ? rr : undefined,
    targetRr: parsePositiveNumber(props.trade?.riskRewardRatio ?? props.trade?.plannedRiskReward ?? props.trade?.targetRR) ?? undefined,
    baselineRr: parsePositiveNumber(props.trade?.baselineRr ?? props.trade?.targetRR) ?? undefined,
    durationHours: Number.isFinite(durationHours) ? durationHours : undefined,
    durationMinutes: Number.isFinite(durationHours) ? durationHours * 60 : undefined
  }
})

const metricsData = computed(() => {
  return useTradeAnalysisMetrics(
    props.trade,
    {
      ...derivedStatsContext.value,
      ...(props.strategyStatsContext || {})
    },
    (locale.value as 'ru' | 'en') || 'ru',
    'advanced',
    activeMetricTab.value
  )
})

const activeMetricList = computed(() => metricsData.value.metrics)

const metricTabs = computed(() => {
  const counts = metricsData.value.counts || {}
  const isRu = locale.value === 'ru'

  return [
    { id: 'all', label: isRu ? 'Все' : 'All', count: counts.all || 0 },
    { id: 'adherence', label: isRu ? 'Соблюдение матрицы' : 'Matrix Adherence', count: counts.adherence || 0 },
    { id: 'behavioural', label: isRu ? 'Психология' : 'Behavioural', count: counts.behavioural || 0 },
    { id: 'execution', label: isRu ? 'Исполнение и риск' : 'Execution & Risk', count: counts.execution || 0 },
    { id: 'strategy_execution', label: isRu ? 'Стратегия и исполнение' : 'Strategy vs Execution', count: counts.strategy_execution || 0 },
    { id: 'in_trade', label: isRu ? 'Анализ в сделке' : 'In-Trade Analysis', count: counts.in_trade || 0 }
  ]
})
</script>

<template>
  <div class="flex flex-col space-y-4">
    <div class="flex flex-wrap items-center gap-2 border-b nier-border-primary pb-3 mb-4">
      <button
        v-for="tab in metricTabs"
        :key="tab.id"
        type="button"
        @click="activeMetricTab = tab.id"
        class="relative flex items-center space-x-2 px-4 py-2 border transition-all duration-300 cursor-pointer"
        :class="activeMetricTab === tab.id
          ? 'border-black dark:border-white bg-black/5 dark:bg-white/5 nier-text-primary font-bold shadow-sm'
          : 'nier-border-primary text-black/50 dark:text-white/50 hover:border-black/30 dark:hover:border-white/30'"
      >
        <div v-if="activeMetricTab === tab.id" class="w-1.5 h-1.5 nier-bg-inverted rotate-45 animate-pulse"></div>
        <span class="text-[10px] font-mono tracking-wider uppercase">{{ tab.label }}</span>
        <span class="text-[8px] font-mono px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded-full opacity-60">{{ tab.count }}</span>
      </button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
      <ExMetricCard
        v-for="metric in activeMetricList"
        :key="metric.key"
        :metric="metric"
        :is-dark="isDark"
      />
    </div>
  </div>
</template>
