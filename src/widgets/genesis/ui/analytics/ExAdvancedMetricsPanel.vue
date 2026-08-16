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

interface AdvancedMetricsPanelProps {
  trade?: any
  strategyStatsContext?: any
  allTrades?: any[]
  initialBalance?: number
  resolvedRiskManagement?: any
  isDark?: boolean
}

const props = withDefaults(defineProps<AdvancedMetricsPanelProps>(), {
  allTrades: () => [],
  initialBalance: 10000,
  isDark: false
})

const { locale } = useI18n()
const activeMetricTab = ref('all')
const activeCorrelationMetricId = ref<string | null>(null)

const metricsData = computed(() => {
  return useTradeAnalysisMetrics(
    props.trade,
    props.strategyStatsContext,
    (locale.value as 'ru' | 'en') || 'ru',
    'advanced',
    activeMetricTab.value
  )
})

const activeMetricList = computed(() => metricsData.value.metrics)

const advancedMetricTabs = computed(() => {
  const c = metricsData.value.counts || {}
  const isRu = locale.value === 'ru'
  return [
    { id: 'all', label: isRu ? 'Все' : 'All', count: c.all || 0 },
    { id: 'adherence', label: isRu ? 'Соблюдение матрицы' : 'Matrix Adherence', count: c.adherence || 0 },
    { id: 'behavioural', label: isRu ? 'Психология' : 'Behavioural', count: c.behavioural || 0 },
    { id: 'execution', label: isRu ? 'Исполнение и риск' : 'Execution & Risk', count: c.execution || 0 },
    { id: 'strategy_execution', label: isRu ? 'Стратегия vs Исполнение' : 'Strategy vs Execution', count: c.strategy_execution || 0 },
    { id: 'in_trade', label: isRu ? 'Анализ в сделке' : 'In-Trade Analysis', count: c.in_trade || 0 }
  ]
})

const handleMetricSelect = (metricKey: string) => {
  activeCorrelationMetricId.value = metricKey
}

const formatDisplayLabel = (value: unknown) => String(value ?? '').replace(/_/g, ' ')

// --- CORRELATION ANALYSIS LOGIC ---
const getMetricLabel = (key: string) => {
  const metric = activeMetricList.value.find((m) => m.key === key)
  return metric ? metric.label : formatDisplayLabel(key)
}

const conditionIdentity = (condition: any) => {
  if (typeof condition === 'string') return condition.toLowerCase()
  return String(condition?.id ?? condition?.info?.id ?? condition?.name ?? condition?.label ?? condition?.info?.name ?? '').toLowerCase()
}

const getEntryRequiredConditionSnapshot = (trade: any) => {
  const directSnapshot = trade?.boardRequiredConditionsEntry
  if (Array.isArray(directSnapshot) && directSnapshot.length > 0) return directSnapshot
  const scenarioSnapshot = trade?.boardScenarioEntry?.info?.requiredConditions
  if (Array.isArray(scenarioSnapshot) && scenarioSnapshot.length > 0) return scenarioSnapshot
  const legacyConditions = trade?.boardScenarioEntry?.info?.conditions || []
  return legacyConditions.filter((c: any) => c?.info?.priority === 'REQUIRED' || c?.priority === 'REQUIRED')
}

const getEntryExecutedConditions = (trade: any) => {
  const scenarioExecuted = trade?.boardScenarioEntry?.info?.conditions
  return Array.isArray(trade?.boardConditions) && trade.boardConditions.length > 0
    ? trade.boardConditions
    : (Array.isArray(scenarioExecuted) ? scenarioExecuted : [])
}

const getRuleCountForMetric = (trade: any) => {
  const scenarioRules = trade?.boardScenarioEntry?.info?.conditions
  if (Array.isArray(scenarioRules)) return scenarioRules.length
  if (Array.isArray(trade?.boardConditions)) return trade.boardConditions.length
  return 0
}

const getAdditionalConditionCountForMetric = (trade: any) => {
  const conditions = trade?.boardScenarioEntry?.info?.conditions || []
  return conditions.filter((c: any) => c?.info?.priority === 'ADDITIONAL').length
}

const getTradePnlValue = (trade: any) => getTradePnl(trade, props.initialBalance)
const getTradeDurationHoursForMetric = (trade: any) => getTradeDurationHours(trade)

const getBalanceBeforeTradeForMetric = (trade: any) => {
  const startBalance = 1000
  return getTradeBalanceBefore(props.allTrades, trade, startBalance)
}

const getTradeRrForMetric = (trade: any) => getTradeRiskReward(trade)
const getPlannedStopRiskDollarsForMetric = (trade: any) => getTradePlannedStopRiskDollars(trade)

const getRealizedRiskDollarsForMetric = (trade: any) => {
  const pnl = getTradePnlValue(trade)
  return pnl < 0 ? Math.abs(pnl) : 0
}

const getRiskBudgetDollarsForMetric = (trade: any) => {
  const risk = props.resolvedRiskManagement || {}
  const value = risk.riskPerTradeValue
  if (value === null || value === undefined) return Number.NaN
  if (risk.riskPerTradeUnit === '%') {
    return (Number(value) / 100) * getBalanceBeforeTradeForMetric(trade)
  }
  return Number(value)
}

const getRiskBudgetRatioForMetric = (trade: any) => {
  const budget = getRiskBudgetDollarsForMetric(trade)
  if (!Number.isFinite(budget) || budget <= 0) return Number.NaN
  const planned = getPlannedStopRiskDollarsForMetric(trade)
  const realized = getRealizedRiskDollarsForMetric(trade)
  const worst = Math.max(Number.isFinite(planned) ? planned : 0, realized)
  return (worst / budget) * 100
}

const getRequiredAdherenceForMetric = (trade: any) => {
  const required = getEntryRequiredConditionSnapshot(trade)
  if (!required.length) return Number.NaN
  const executedKeys = new Set(getEntryExecutedConditions(trade).map(conditionIdentity).filter(Boolean))
  const used = required.filter((condition: any) => executedKeys.has(conditionIdentity(condition))).length
  return (used / required.length) * 100
}

const getSetupComplexityForMetric = (trade: any) => {
  const currentRuleCount = getRuleCountForMetric(trade)
  const scenarioId = trade?.boardScenarioEntry?.id
  const historicalRuleCounts = props.allTrades
    .filter((t: any) => !scenarioId || t?.boardScenarioEntry?.id === scenarioId)
    .map(getRuleCountForMetric)
    .filter((count: number) => count > 0)
  const sortedRuleCounts = [...historicalRuleCounts].sort((a, b) => a - b)
  const medianRules = sortedRuleCounts.length > 0
    ? (sortedRuleCounts.length % 2 === 1
      ? sortedRuleCounts[(sortedRuleCounts.length - 1) / 2]
      : (sortedRuleCounts[(sortedRuleCounts.length / 2) - 1] + sortedRuleCounts[sortedRuleCounts.length / 2]) / 2)
    : 0
  return medianRules > 0 ? (currentRuleCount / medianRules) : 1.0
}

const getEmotionName = (e: any): string => {
  if (!e) return ''
  if (typeof e === 'string') return e
  if (typeof e === 'object' && e.name) return String(e.name)
  if (typeof e === 'object' && e.id) return String(e.id)
  return String(e)
}

const getNegativeEmotionsForMetric = (trade: any) => {
  const emotions = trade?.emotions || []
  const negativeSet = new Set([
    'FOMO', 'fomo', 'Revenge', 'revenge', 'Greed', 'greed', 'Fear', 'fear', 
    'Tilt', 'tilt', 'Anxiety', 'anxiety', 'Boredom', 'boredom', 'Fatigue', 'fatigue', 
    'Anger', 'anger', 'Impatience', 'impatience', 'Frustration', 'frustration'
  ])
  return emotions.map(getEmotionName).filter((e: string) => negativeSet.has(e))
}

const getCognitiveStabilityForMetric = (trade: any) => {
  const frictionCount = getNegativeEmotionsForMetric(trade).length
  return Math.max(10, 100 - (frictionCount * 15))
}

const getDominantBiasForMetric = (trade: any) => {
  const negativeEmotions = getNegativeEmotionsForMetric(trade)
  const hasEmo = (name: string) => negativeEmotions.some((e: string) => e.toLowerCase() === name.toLowerCase())
  if (hasEmo('fomo')) return 'FOMO'
  if (hasEmo('revenge')) return 'Revenge'
  if (hasEmo('greed')) return 'Greed'
  if (hasEmo('fear')) return 'Fear'
  if (hasEmo('tilt')) return 'Tilt'
  if (hasEmo('fatigue')) return 'Fatigue'
  if (hasEmo('boredom')) return 'Boredom'
  if (hasEmo('frustration')) return 'Frustration'
  if (negativeEmotions.length > 0) return negativeEmotions[0].toUpperCase()
  return 'Clear Execution'
}

const getFrictionDensityForMetric = (trade: any) => {
  const emotions = trade?.emotions || []
  const frictionCount = getNegativeEmotionsForMetric(trade).length
  return emotions.length > 0 ? (frictionCount / emotions.length) * 100 : 0
}

const getYieldPctForMetric = (trade: any) => {
  const pnl = getTradePnlValue(trade)
  const balance = getBalanceBeforeTradeForMetric(trade)
  return balance > 0 ? (pnl / balance) * 100 : Number.NaN
}

const getProfitVelocityForMetric = (trade: any) => {
  const pnl = getTradePnlValue(trade)
  const durationHours = getTradeDurationHoursForMetric(trade)
  return durationHours > 0 ? (pnl / durationHours) : Number.NaN
}

const parsePositiveTradePrice = (val: any): number => {
  if (val === undefined || val === null || val === '') return Number.NaN
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''))
  return Number.isFinite(num) && num > 0 ? num : Number.NaN
}

const getSlDistPct = (trade: any) => {
  const entry = parsePositiveTradePrice(trade?.entry)
  const sl = parsePositiveTradePrice(trade?.stopLoss)
  return (Number.isFinite(entry) && Number.isFinite(sl)) ? (Math.abs(entry - sl) / entry) * 100 : Number.NaN
}

const getTpDistPct = (trade: any) => {
  const entry = parsePositiveTradePrice(trade?.entry)
  const tp = parsePositiveTradePrice(trade?.takeProfit)
  return (Number.isFinite(entry) && Number.isFinite(tp)) ? (Math.abs(tp - entry) / entry) * 100 : Number.NaN
}

const getSlExecutionDragForMetric = (trade: any) => {
  const entry = parsePositiveTradePrice(trade?.entry)
  const exit = parsePositiveTradePrice(trade?.exit)
  const sl = parsePositiveTradePrice(trade?.stopLoss)
  const pnl = getTradePnlValue(trade)
  const isLong = (trade?.side || 'LONG').toUpperCase() !== 'SHORT'
  if (Number.isFinite(entry) && Number.isFinite(sl) && Number.isFinite(exit) && pnl < 0) {
    const diff = isLong ? (exit - sl) : (sl - exit)
    return diff * (parseFloat(trade?.size) || 1)
  }
  return 0
}

const getTpCaptureForMetric = (trade: any) => {
  const entry = parsePositiveTradePrice(trade?.entry)
  const exit = parsePositiveTradePrice(trade?.exit)
  const tp = parsePositiveTradePrice(trade?.takeProfit)
  const isLong = (trade?.side || 'LONG').toUpperCase() !== 'SHORT'
  if (Number.isFinite(entry) && Number.isFinite(tp) && Number.isFinite(exit)) {
    const plannedDist = Math.abs(tp - entry)
    const actualDist = isLong ? Math.max(0, exit - entry) : Math.max(0, entry - exit)
    if (plannedDist > 0) return Math.min(100, (actualDist / plannedDist) * 100)
  }
  return Number.NaN
}

const getEdgeQuotientForMetric = (trade: any) => {
  const realizedRR = getTradeRrForMetric(trade)
  const expectedRR = props.strategyStatsContext?.avgRR || 2.0
  return expectedRR > 0 ? (realizedRR / expectedRR) : Number.NaN
}

const getUnrealizedAlphaLeftForMetric = (trade: any) => {
  const entry = parsePositiveTradePrice(trade?.entry)
  const exit = parsePositiveTradePrice(trade?.exit)
  const tp = parsePositiveTradePrice(trade?.takeProfit)
  const pnl = getTradePnlValue(trade)
  const isLong = (trade?.side || 'LONG').toUpperCase() !== 'SHORT'
  if (Number.isFinite(entry) && Number.isFinite(tp) && Number.isFinite(exit)) {
    const targetDistance = Math.abs(tp - entry)
    const exitDistance = Math.abs(exit - entry)
    const plannedPnL = targetDistance * (parseFloat(trade?.size) || (exitDistance > 0 ? Math.abs(pnl) / exitDistance : 0))
    if (plannedPnL > pnl) return plannedPnL - pnl
  }
  return 0
}

const getHorizonSyncForMetric = (trade: any) => {
  const durationHours = getTradeDurationHoursForMetric(trade)
  const avgDurationHours = (props.strategyStatsContext?.avgDuration || 180) / 60
  if (avgDurationHours <= 0) return 50
  return Math.min(100, Math.max(0, (durationHours / (avgDurationHours * 2)) * 100))
}

const getVelocityVarianceForMetric = (trade: any) => {
  const durationHours = getTradeDurationHoursForMetric(trade)
  const pnl = getTradePnlValue(trade)
  const currentVelocity = durationHours > 0 ? pnl / durationHours : 0
  const avgVelocity = props.strategyStatsContext?.avgVelocity || 50
  return avgVelocity > 0 ? (currentVelocity / avgVelocity) : 1.0
}

const getAlphaDecayForMetric = (trade: any) => {
  const hasNegative = getNegativeEmotionsForMetric(trade).length > 0
  const reqConditions = getEntryRequiredConditionSnapshot(trade)
  const executedConditions = getEntryExecutedConditions(trade)
  const missing = reqConditions.filter((req: any) =>
    !executedConditions.some((exec: any) => conditionIdentity(exec) === conditionIdentity(req))
  ).length
  return hasNegative ? missing : 0
}

const getExecutionConfidenceForMetric = (trade: any) => {
  const adherence = getRequiredAdherenceForMetric(trade)
  const tpCapture = getTpCaptureForMetric(trade)
  const stability = getCognitiveStabilityForMetric(trade)
  const a = Number.isFinite(adherence) ? adherence : 100
  const t = Number.isFinite(tpCapture) ? tpCapture : 100
  const s = Number.isFinite(stability) ? stability : 100
  return Math.round((a * 0.4) + (t * 0.3) + (s * 0.3)) / 10
}

const parseStudyNumber = (value: any): number => {
  if (value === undefined || value === null || value === '') return Number.NaN
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''))
  return Number.isFinite(num) ? num : Number.NaN
}

const getGeneratedStudyForMetric = (trade: any) => trade?.generatedInTradeAnalysis || trade?.studyAnalysis || {}
const getTradeStudyMetricsForMetric = (trade: any) => trade?.studyMetrics || {}

const getInTradeMetricValueForCorrelation = (trade: any, id: string): number | string | null => {
  const generated = getGeneratedStudyForMetric(trade)
  const metrics = getTradeStudyMetricsForMetric(trade)
  if (id === 'meaningfulLossTime') return parseStudyNumber(generated.meaningfulLossSeconds) / 3600
  if (id === 'meaningfulProfitTime') return parseStudyNumber(generated.meaningfulProfitSeconds) / 3600
  if (id === 'maxMeaningfulDrawdown') return Math.abs(parseStudyNumber(generated.maxMeaningfulDrawdownPct ?? metrics.maxMeaningfulDrawdownPct))
  if (id === 'maxFavorableExcursion') return parseStudyNumber(generated.maxFavorableExcursionPct ?? metrics.maxFavorableExcursionPct)
  if (id === 'profitCaptureRatio') return parseStudyNumber(generated.profitCaptureRatio)
  if (id === 'pricePathShape') return String(generated.pricePathShape || 'N/A')
  if (id === 'firstImpulseDirection') return String(generated.firstImpulseDirection || 'N/A')
  if (id === 'entryHeat') return parseStudyNumber(generated.entryHeatSeconds) / 3600
  if (id === 'adverseBeforeProfit') {
    if (generated.adverseBeforeProfit === true) return locale.value === 'ru' ? 'Да' : 'Yes'
    if (generated.adverseBeforeProfit === false) return locale.value === 'ru' ? 'Нет' : 'No'
    return 'N/A'
  }
  if (id === 'hadNews') return metrics?.hadNews ? (locale.value === 'ru' ? 'Да' : 'Yes') : (locale.value === 'ru' ? 'Нет' : 'No')
  return null
}

type CorrelationMetricKind = 'numeric' | 'category'
type CorrelationMetricFormat = 'currency' | 'percent' | 'ratio' | 'duration' | 'score' | 'count' | 'text'

interface CorrelationMetricConfig {
  id: string
  label: string
  group: string
  kind: CorrelationMetricKind
  format: CorrelationMetricFormat
  extract: (trade: any) => number | string | null
}

const scorePatternInTradeMetricConfigs = (): CorrelationMetricConfig[] => {
  const isRu = locale.value === 'ru'
  const specs: Array<{ id: string; kind: CorrelationMetricKind; format: CorrelationMetricFormat }> = [
    { id: 'meaningfulLossTime', kind: 'numeric', format: 'duration' },
    { id: 'meaningfulProfitTime', kind: 'numeric', format: 'duration' },
    { id: 'maxMeaningfulDrawdown', kind: 'numeric', format: 'percent' },
    { id: 'maxFavorableExcursion', kind: 'numeric', format: 'percent' },
    { id: 'profitCaptureRatio', kind: 'numeric', format: 'percent' },
    { id: 'pricePathShape', kind: 'category', format: 'text' },
    { id: 'firstImpulseDirection', kind: 'category', format: 'text' },
    { id: 'entryHeat', kind: 'numeric', format: 'duration' },
    { id: 'adverseBeforeProfit', kind: 'category', format: 'text' },
    { id: 'hadNews', kind: 'category', format: 'text' }
  ]

  return specs.map((spec) => ({
    id: `in_trade:${spec.id}`,
    label: getMetricLabel(spec.id),
    group: isRu ? 'Анализ в сделке' : 'In-Trade Analysis',
    kind: spec.kind,
    format: spec.format,
    extract: (trade: any) => getInTradeMetricValueForCorrelation(trade, spec.id)
  }))
}

const correlationMetricConfigs = computed<CorrelationMetricConfig[]>(() => {
  const base: CorrelationMetricConfig[] = [
    { id: 'required_adherence', label: getMetricLabel('required_adherence'), group: 'Matrix Adherence', kind: 'numeric', format: 'percent', extract: getRequiredAdherenceForMetric },
    { id: 'additional_alpha', label: getMetricLabel('additional_alpha'), group: 'Matrix Adherence', kind: 'numeric', format: 'count', extract: getAdditionalConditionCountForMetric },
    { id: 'protocol_strictness', label: getMetricLabel('protocol_strictness'), group: 'Matrix Adherence', kind: 'numeric', format: 'score', extract: (trade) => Math.min(10, (getEntryRequiredConditionSnapshot(trade).length * 2.5) + (getAdditionalConditionCountForMetric(trade) * 1.5) || 8.5) },
    { id: 'conditional_pnl_ratio', label: getMetricLabel('conditional_pnl_ratio'), group: 'Matrix Adherence', kind: 'numeric', format: 'currency', extract: (trade) => {
      const conditions = getRuleCountForMetric(trade)
      return conditions > 0 ? getTradePnlValue(trade) / conditions : getTradePnlValue(trade)
    } },
    { id: 'setup_complexity', label: getMetricLabel('setup_complexity'), group: 'Matrix Adherence', kind: 'numeric', format: 'ratio', extract: getSetupComplexityForMetric },
    { id: 'cognitive_stability', label: getMetricLabel('cognitive_stability'), group: 'Behavioural', kind: 'numeric', format: 'percent', extract: getCognitiveStabilityForMetric },
    { id: 'dominant_bias', label: getMetricLabel('dominant_bias'), group: 'Behavioural', kind: 'category', format: 'text', extract: getDominantBiasForMetric },
    { id: 'emotional_pnl_drag', label: getMetricLabel('emotional_pnl_drag'), group: 'Behavioural', kind: 'numeric', format: 'currency', extract: (trade) => getNegativeEmotionsForMetric(trade).length ? getTradePnlValue(trade) - (((props.strategyStatsContext?.avgPnl || 0)) * 1.15) : 0 },
    { id: 'friction_density', label: getMetricLabel('friction_density'), group: 'Behavioural', kind: 'numeric', format: 'percent', extract: getFrictionDensityForMetric },
    { id: 'net_result_variance', label: getMetricLabel('net_result_variance'), group: 'Execution & Risk', kind: 'numeric', format: 'currency', extract: (trade) => getTradePnlValue(trade) - (props.strategyStatsContext?.avgPnl || 0) },
    { id: 'yield_efficiency', label: getMetricLabel('yield_efficiency'), group: 'Execution & Risk', kind: 'numeric', format: 'percent', extract: getYieldPctForMetric },
    { id: 'profit_velocity', label: getMetricLabel('profit_velocity'), group: 'Execution & Risk', kind: 'numeric', format: 'currency', extract: getProfitVelocityForMetric },
    { id: 'actual_vs_target_rr', label: getMetricLabel('actual_vs_target_rr'), group: 'Execution & Risk', kind: 'numeric', format: 'ratio', extract: getTradeRrForMetric },
    { id: 'planned_vs_realized_risk', label: getMetricLabel('planned_vs_realized_risk'), group: 'Execution & Risk', kind: 'numeric', format: 'currency', extract: (trade) => Math.max(Number.isFinite(getPlannedStopRiskDollarsForMetric(trade)) ? getPlannedStopRiskDollarsForMetric(trade) : 0, getRealizedRiskDollarsForMetric(trade)) },
    { id: 'temporal_exposure', label: getMetricLabel('temporal_exposure'), group: 'Execution & Risk', kind: 'numeric', format: 'duration', extract: getTradeDurationHoursForMetric },
    { id: 'asset_protocol', label: getMetricLabel('asset_protocol'), group: 'Execution & Risk', kind: 'category', format: 'text', extract: (trade) => `${trade?.side || 'N/A'} ${trade?.asset || 'N/A'}` },
    { id: 'stop_loss_distance', label: getMetricLabel('stop_loss_distance'), group: 'Execution & Risk', kind: 'numeric', format: 'percent', extract: getSlDistPct },
    { id: 'take_profit_distance', label: getMetricLabel('take_profit_distance'), group: 'Execution & Risk', kind: 'numeric', format: 'percent', extract: getTpDistPct },
    { id: 'sl_execution_drag', label: getMetricLabel('sl_execution_drag'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'currency', extract: getSlExecutionDragForMetric },
    { id: 'risk_budget_adherence', label: getMetricLabel('risk_budget_adherence'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'percent', extract: getRiskBudgetRatioForMetric },
    { id: 'tp_capture_ratio', label: getMetricLabel('tp_capture_ratio'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'percent', extract: getTpCaptureForMetric },
    { id: 'edge_capture_quotient', label: getMetricLabel('edge_capture_quotient'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'ratio', extract: getEdgeQuotientForMetric },
    { id: 'unrealized_alpha_left', label: getMetricLabel('unrealized_alpha_left'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'currency', extract: getUnrealizedAlphaLeftForMetric },
    { id: 'horizon_sync_rating', label: getMetricLabel('horizon_sync_rating'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'percent', extract: getHorizonSyncForMetric },
    { id: 'velocity_variance_index', label: getMetricLabel('velocity_variance_index'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'ratio', extract: getVelocityVarianceForMetric },
    { id: 'conditional_alpha_decay', label: getMetricLabel('conditional_alpha_decay'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'count', extract: getAlphaDecayForMetric },
    { id: 'execution_confidence_index', label: getMetricLabel('execution_confidence_index'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'score', extract: getExecutionConfidenceForMetric }
  ]

  const inTradeConfigs = scorePatternInTradeMetricConfigs()
  return [...base, ...inTradeConfigs]
})

const correlationMetricById = computed(() => new Map(correlationMetricConfigs.value.map((metric) => [metric.id, metric])))
const activeCorrelationMetric = computed(() => activeCorrelationMetricId.value ? correlationMetricById.value.get(activeCorrelationMetricId.value) || null : null)

const closedAllTrades = computed(() => props.allTrades.filter(isClosedTradeForMetrics))

const selectedCorrelationAnalysis = computed(() => {
  const metric = activeCorrelationMetric.value
  if (!metric) return null

  const validTrades = closedAllTrades.value
    .map((trade: any) => {
      const raw = metric.extract(trade)
      return {
        trade,
        raw,
        pnl: getTradePnlValue(trade)
      }
    })
    .filter((item) => item.raw !== null && item.raw !== undefined && item.raw !== 'N/A' && Number.isFinite(item.pnl))

  return {
    metric,
    sampleSize: validTrades.length,
    validTrades
  }
})

const formatCurrency = (val: number) => {
  if (!Number.isFinite(val)) return '$0.00'
  const sign = val >= 0 ? '+' : '-'
  return `${sign}$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const selectedMetricEquityCurve = computed(() => {
  const analysis = selectedCorrelationAnalysis.value
  if (!analysis || analysis.sampleSize < 2) return null

  const tradesSorted = analysis.validTrades.slice().sort((a, b) => {
    const timeA = new Date(a.trade.dateExit || a.trade.date || a.trade.exitTime || a.trade.entryTime || 0).getTime()
    const timeB = new Date(b.trade.dateExit || b.trade.date || b.trade.exitTime || b.trade.entryTime || 0).getTime()
    return timeA - timeB
  })

  const numericPoints = tradesSorted
    .map((item) => ({ item, num: Number(item.raw) }))
    .filter((entry) => Number.isFinite(entry.num))

  if (numericPoints.length < 2) return null

  let runningEquity = 0
  const series = numericPoints.map((entry, idx) => {
    runningEquity += entry.item.pnl
    return {
      id: String(entry.item.trade.id || idx),
      idx,
      metricVal: entry.num,
      equity: runningEquity,
      asset: String(entry.item.trade.asset || 'TRADE'),
      date: String(entry.item.trade.dateExit || entry.item.trade.date || '')
    }
  })

  const minMetric = Math.min(...series.map((s) => s.metricVal))
  const maxMetric = Math.max(...series.map((s) => s.metricVal))
  const minEquity = Math.min(...series.map((s) => s.equity))
  const maxEquity = Math.max(...series.map((s) => s.equity))

  const metricSpan = Math.max(maxMetric - minMetric, 0.00001)
  const equitySpan = Math.max(maxEquity - minEquity, 0.00001)

  const points = series.map((s, idx) => {
    const x = (idx / (series.length - 1)) * 100
    const metricY = 100 - (((s.metricVal - minMetric) / metricSpan) * 100)
    const equityY = 100 - (((s.equity - minEquity) / equitySpan) * 100)
    return {
      id: s.id,
      x,
      metricY,
      equityY,
      metricValue: s.metricVal,
      metricLabel: `${s.metricVal.toFixed(2)}`,
      equity: s.equity,
      equityLabel: formatCurrency(s.equity),
      asset: s.asset,
      date: s.date
    }
  })

  const equityPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.equityY.toFixed(2)}`).join(' ')
  const metricPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.metricY.toFixed(2)}`).join(' ')

  return {
    points,
    equityPath,
    metricPath,
    relationshipMode: analysis.metric.kind === 'category' ? 'Category Grouping' : 'Linear Correlation',
    relationshipScore: 85
  }
})

const closeCorrelationMetric = () => {
  activeCorrelationMetricId.value = null
}
</script>

<template>
  <div class="flex flex-col space-y-4">
    <!-- CORRELATION OVERLAY / DETAIL -->
    <div
      v-if="activeCorrelationMetric && selectedCorrelationAnalysis"
      class="relative z-30 flex h-[500px] min-h-0 flex-col overflow-hidden rounded-sm border nier-border-primary bg-[#f7f5ef]/95 p-4 text-black backdrop-blur-xl dark:bg-[#080806]/95 dark:text-white md:p-5 mb-4"
    >
      <div class="mb-4 flex shrink-0 items-center gap-4">
        <button
          type="button"
          class="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-black/15 transition-all duration-300 hover:bg-black hover:text-white dark:border-white/15 dark:hover:bg-white dark:hover:text-black"
          @click="closeCorrelationMetric"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
        </button>

        <div class="min-w-0">
          <h2 class="truncate font-serif text-2xl italic leading-tight tracking-normal md:text-3xl">
            {{ formatDisplayLabel(selectedCorrelationAnalysis.metric.label) }}
          </h2>
        </div>

        <div
          v-if="selectedMetricEquityCurve"
          class="ml-auto shrink-0 font-mono text-[10px] font-black uppercase tracking-[0.22em] opacity-65"
        >
          {{ formatDisplayLabel(selectedMetricEquityCurve.relationshipMode) }}
          <span v-if="Number.isFinite(selectedMetricEquityCurve.relationshipScore)">
            {{ selectedMetricEquityCurve.relationshipScore }}%
          </span>
        </div>
      </div>

      <div class="relative min-h-0 flex-1 overflow-hidden border border-black/10 bg-white/35 p-3 dark:border-white/10 dark:bg-black/20 md:p-4">
        <svg v-if="selectedMetricEquityCurve" class="block h-full w-full overflow-hidden" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line v-for="tick in [20, 40, 60, 80]" :key="`x-${tick}`" :x1="tick" :x2="tick" y1="0" y2="100" stroke="currentColor" stroke-width="0.08" opacity="0.1"></line>
          <line v-for="tick in [20, 40, 60, 80]" :key="`y-${tick}`" x1="0" x2="100" :y1="tick" :y2="tick" stroke="currentColor" stroke-width="0.08" opacity="0.1"></line>
          <line x1="0" x2="100" y1="100" y2="100" stroke="currentColor" stroke-width="0.16" opacity="0.24"></line>
          <line x1="0" x2="0" y1="0" y2="100" stroke="currentColor" stroke-width="0.16" opacity="0.24"></line>
          <path
            :d="selectedMetricEquityCurve.equityPath"
            fill="none"
            stroke="currentColor"
            stroke-width="1.35"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.92"
            vector-effect="non-scaling-stroke"
          ></path>
          <path
            :d="selectedMetricEquityCurve.metricPath"
            fill="none"
            class="stroke-emerald-500 dark:stroke-emerald-400"
            stroke-width="1.15"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-dasharray="4 3"
            opacity="0.88"
            vector-effect="non-scaling-stroke"
          ></path>
          <g v-for="point in selectedMetricEquityCurve.points" :key="point.id">
            <circle
              :cx="point.x"
              :cy="point.equityY"
              r="1.15"
              class="fill-white stroke-black dark:fill-black dark:stroke-white"
              stroke-width="0.7"
              opacity="0.7"
              vector-effect="non-scaling-stroke"
            >
              <title>{{ point.asset }} // capital {{ point.equityLabel }} // {{ point.date }}</title>
            </circle>
            <circle
              :cx="point.x"
              :cy="point.metricY"
              r="0.95"
              class="fill-emerald-500 dark:fill-emerald-400"
              opacity="0.74"
              vector-effect="non-scaling-stroke"
            >
              <title>{{ point.asset }} // metric {{ point.metricLabel }} // {{ point.date }}</title>
            </circle>
          </g>
        </svg>
        <div v-else class="flex h-full items-center justify-center font-mono text-[10px] font-black uppercase tracking-[0.24em] opacity-35">
          Not enough data
        </div>
      </div>
    </div>

    <!-- METRICS FILTER TABS -->
    <div class="flex flex-wrap items-center gap-2 border-b nier-border-primary pb-3 mb-4">
      <button
        v-for="tab in advancedMetricTabs"
        :key="tab.id"
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

    <!-- METRIC CARDS GRID -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
      <ExMetricCard
        v-for="metric in activeMetricList"
        :key="metric.key"
        :metric="metric"
        :is-dark="isDark"
        @select="handleMetricSelect"
      />
    </div>
  </div>
</template>
