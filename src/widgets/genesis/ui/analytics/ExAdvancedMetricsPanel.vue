<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '~/shared/i18n/useI18n'
import {
  getTradeBalanceBefore,
  getTradePnl,
  getTradeRiskReward
} from '~/widgets/genesis/model/metrics'
import { getTradePlannedStopRiskDollars } from '~/widgets/genesis/model/tradeRisk'
import { isClosedTradeForMetrics } from '~/widgets/genesis/model/tradePnl'

interface AdvancedMetricsPanelProps {
  trade?: any
  allTrades?: any[]
  initialBalance?: number
}

const props = withDefaults(defineProps<AdvancedMetricsPanelProps>(), {
  allTrades: () => [],
  initialBalance: 10000
})

const { locale } = useI18n()
const isTradeScoreExpanded = ref(false)
const isRequiredConditionsExpanded = ref(false)

const formatDisplayLabel = (value: unknown) => String(value ?? '').replace(/_/g, ' ')

const parseNumber = (value: any): number => {
  if (value === undefined || value === null || value === '') return Number.NaN
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const getNormalizedPnl = (trade: any) => getTradePnl(trade, props.initialBalance)

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

const tradeScoreBreakdown = computed(() => {
  const trade = props.trade
  if (!trade) {
    return { percentile: 0, rawScore: 0, patterns: [] as Array<{ label: string; value: string; metricId: string }> }
  }

  const currentPnl = getNormalizedPnl(trade)
  const values = closedTrades.value
    .map((item) => getNormalizedPnl(item))
    .filter(Number.isFinite)

  const lowerTrades = values.filter((value) => value < currentPnl).length
  const percentile = values.length > 0
    ? Math.round((lowerTrades / values.length) * 100)
    : Math.max(0, Math.min(100, Number(trade.percentileRank) || (currentPnl > 0 ? 70 : 30)))

  return {
    percentile,
    rawScore: currentPnl,
    patterns: [
      {
        label: locale.value === 'ru' ? 'Результат' : 'Result',
        value: formatCurrency(currentPnl),
        metricId: 'pnl'
      },
      {
        label: 'Risk/Reward',
        value: formatRatio(actualRR.value),
        metricId: 'rr'
      },
      {
        label: locale.value === 'ru' ? 'Обязательные условия' : 'Required Conditions',
        value: requiredConditionStats.value.total > 0
          ? `${requiredConditionStats.value.used}/${requiredConditionStats.value.total}`
          : 'N/A',
        metricId: 'required'
      }
    ]
  }
})

const conditionIdentity = (condition: any) => {
  if (typeof condition === 'string') return condition.toLowerCase()
  return String(condition?.id ?? condition?.info?.id ?? condition?.name ?? condition?.label ?? condition?.info?.name ?? '').toLowerCase()
}

const conditionProtocolId = (condition: any) => {
  if (typeof condition === 'string') return condition
  return String(condition?.id ?? condition?.info?.id ?? condition?.name ?? condition?.label ?? condition?.info?.name ?? '')
}

const conditionDisplayName = (condition: any) => {
  if (typeof condition === 'string') return condition
  return String(condition?.info?.customName ?? condition?.info?.name ?? condition?.name ?? condition?.label ?? condition?.id ?? 'REQUIRED')
}

const conditionDescription = (condition: any) => {
  if (typeof condition === 'string') return ''
  return String(condition?.info?.description ?? condition?.description ?? condition?.info?.logic ?? '')
}

const getEntryRequiredConditionSnapshot = (trade: any) => {
  const directSnapshot = trade?.boardRequiredConditionsEntry
  if (Array.isArray(directSnapshot) && directSnapshot.length > 0) return directSnapshot

  const scenarioSnapshot = trade?.boardScenarioEntry?.info?.requiredConditions
  if (Array.isArray(scenarioSnapshot) && scenarioSnapshot.length > 0) return scenarioSnapshot

  const legacyConditions = trade?.boardScenarioEntry?.info?.conditions || []
  return legacyConditions.filter((condition: any) => condition?.info?.priority === 'REQUIRED' || condition?.priority === 'REQUIRED')
}

const getEntryExecutedConditions = (trade: any) => {
  const scenarioExecuted = trade?.boardScenarioEntry?.info?.conditions
  return Array.isArray(trade?.boardConditions) && trade.boardConditions.length > 0
    ? trade.boardConditions
    : (Array.isArray(scenarioExecuted) ? scenarioExecuted : [])
}

const requiredConditionRows = computed(() => {
  const required = getEntryRequiredConditionSnapshot(props.trade)
  const executedKeys = new Set(getEntryExecutedConditions(props.trade).map(conditionIdentity).filter(Boolean))

  return required
    .map((condition: any, index: number) => {
      const id = conditionProtocolId(condition)
      const identity = conditionIdentity(condition)
      if (!id && !identity) return null

      const selected = executedKeys.has(identity)
      return {
        id: id || identity || `required-${index}`,
        name: conditionDisplayName(condition),
        description: conditionDescription(condition),
        selected,
        statusLabel: selected
          ? (locale.value === 'ru' ? 'выбрано' : 'selected')
          : (locale.value === 'ru' ? 'пропущено' : 'missing')
      }
    })
    .filter(Boolean)
})

const requiredConditionStats = computed(() => {
  const required = getEntryRequiredConditionSnapshot(props.trade)
  const executed = getEntryExecutedConditions(props.trade)

  if (required.length === 0) return { used: 0, total: 0 }

  const executedKeys = new Set(executed.map(conditionIdentity).filter(Boolean))
  const used = required.filter((condition: any) => executedKeys.has(conditionIdentity(condition))).length
  return { used, total: required.length }
})

const plannedStopRiskDollars = computed(() => getTradePlannedStopRiskDollars(props.trade))

const realizedRiskDollars = computed(() => {
  if (!props.trade) return 0
  const pnl = getNormalizedPnl(props.trade)
  return pnl < 0 ? Math.abs(pnl) : 0
})

const riskLimit = computed(() => {
  const trade = props.trade || {}
  const raw = trade.riskPerTrade ?? trade.riskPerTradeValue ?? trade.riskPercent
  const value = parseNumber(raw)
  if (!Number.isFinite(value)) return null

  return {
    value,
    unit: trade.riskPerTradeUnit === '%' || trade.riskPercent !== undefined ? '%' : '$'
  }
})

const riskBudgetDollars = computed(() => {
  if (!riskLimit.value) return null
  if (riskLimit.value.unit === '%') return (riskLimit.value.value / 100) * balanceBeforeTrade.value
  return riskLimit.value.value
})

const plannedStopRiskPct = computed(() => {
  if (!Number.isFinite(plannedStopRiskDollars.value) || balanceBeforeTrade.value <= 0) return Number.NaN
  return (plannedStopRiskDollars.value / balanceBeforeTrade.value) * 100
})

const realizedRiskPct = computed(() => {
  if (balanceBeforeTrade.value <= 0) return 0
  return (realizedRiskDollars.value / balanceBeforeTrade.value) * 100
})

const tradeRiskAudit = computed(() => {
  const budget = riskBudgetDollars.value
  const planned = plannedStopRiskDollars.value
  const realized = realizedRiskDollars.value
  const hasPlannedRisk = Number.isFinite(planned)
  const plannedOk = hasPlannedRisk && (budget === null || planned <= budget)
  const realizedOk = budget === null || realized <= budget
  const isRu = locale.value === 'ru'

  let hint = isRu
    ? 'Риск по stop loss и фактический убыток находятся в пределах Risk Per Trade.'
    : 'Stop-loss risk and realized loss are within the Risk Per Trade budget.'

  if (!hasPlannedRisk && !realizedOk) {
    hint = isRu
      ? 'Stop loss не установлен, а фактический убыток превысил Risk Per Trade.'
      : 'Stop loss is not set and realized loss exceeded Risk Per Trade.'
  } else if (!hasPlannedRisk) {
    hint = isRu
      ? 'Planned risk невозможно посчитать без установленного stop loss.'
      : 'Planned risk cannot be calculated without a stop loss.'
  } else if (!plannedOk && !realizedOk) {
    hint = isRu
      ? 'И стоп был выставлен за пределами лимита, и фактический убыток превысил Risk Per Trade.'
      : 'Both stop placement and realized loss exceeded the Risk Per Trade budget.'
  } else if (!plannedOk) {
    hint = isRu
      ? 'Расстояние от entry до stop loss с учетом размера позиции превышает Risk Per Trade.'
      : 'The entry-to-stop distance, adjusted by position size, exceeds Risk Per Trade.'
  } else if (!realizedOk) {
    hint = isRu
      ? 'Стоп был в лимите, но реализованный убыток превысил Risk Per Trade.'
      : 'Stop risk was within budget, but realized loss exceeded Risk Per Trade.'
  } else if (hasPlannedRisk && realized > planned && planned > 0) {
    hint = isRu
      ? 'Фактический убыток больше риска по stop loss, даже если общий лимит не превышен.'
      : 'Realized loss is larger than the stop-loss risk, even though the total budget was not breached.'
  }

  return {
    planned,
    realized,
    plannedOk,
    realizedOk,
    ok: plannedOk && realizedOk && !(hasPlannedRisk && realized > planned && planned > 0),
    hint
  }
})

const actualRR = computed(() => {
  const direct = parseNumber(props.trade?.rr ?? props.trade?.riskReward)
  if (Number.isFinite(direct) && direct > 0) return direct
  return getTradeRiskReward(props.trade)
})

const targetRR = computed(() => {
  const direct = parseNumber(props.trade?.riskRewardRatio ?? props.trade?.plannedRiskReward)
  return Number.isFinite(direct) && direct > 0 ? direct : 0
})

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return 'N/A'
  const safe = Number.isFinite(value) ? value : 0
  return `${safe < 0 ? '-' : ''}$${Math.abs(safe).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatRiskPercent = (value: number) => Number.isFinite(value) ? `${value.toFixed(2)}%` : 'N/A'

const formatRatio = (value: number) => {
  const safe = Number.isFinite(value) && value > 0 ? value : 0
  return `1:${safe.toFixed(2)}`
}

const simpleMetricInsights = computed(() => {
  const trade = props.trade
  const isRu = locale.value === 'ru'
  if (!trade) return []

  const currentPnl = getNormalizedPnl(trade)
  const baselineTrades = closedTrades.value.filter((item) => item?.id !== trade.id)
  const normalizedPnls = baselineTrades
    .map((item) => getNormalizedPnl(item))
    .filter(Number.isFinite)
  const winningPnls = normalizedPnls.filter((value) => value > 0)
  const losingPnls = normalizedPnls.filter((value) => value < 0)
  const avgWin = winningPnls.length ? winningPnls.reduce((sum, value) => sum + value, 0) / winningPnls.length : 0
  const avgLoss = losingPnls.length ? losingPnls.reduce((sum, value) => sum + value, 0) / losingPnls.length : 0
  const requiredStats = requiredConditionStats.value
  const riskAudit = tradeRiskAudit.value

  let riskValue = formatCurrency(riskAudit.planned)
  let riskSuffix = isRu ? 'риск по stop loss от entry' : 'stop-loss risk from entry'
  let riskBenchmarkValue = formatCurrency(riskAudit.realized)

  if (riskLimit.value?.unit === '%') {
    riskValue = formatRiskPercent(plannedStopRiskPct.value)
    riskSuffix = isRu ? 'по stop loss от капитала' : 'stop risk of capital'
    riskBenchmarkValue = `${realizedRiskPct.value.toFixed(2)}% / ${riskLimit.value.value.toFixed(2)}%`
  } else if (riskLimit.value) {
    riskValue = formatCurrency(riskAudit.planned)
    riskSuffix = isRu ? 'по stop loss на сделку' : 'stop risk on this trade'
    riskBenchmarkValue = `${formatCurrency(riskAudit.realized)} / ${formatCurrency(riskLimit.value.value)}`
  }

  const rrHint = targetRR.value > 0 && actualRR.value > 0 && actualRR.value < targetRR.value
    ? (isRu
      ? 'Увеличьте R/R через более точное смещение stop loss и take profit.'
      : 'Improve R/R by adjusting stop loss and take profit placement.')
    : ''
  const scoreBreakdown = tradeScoreBreakdown.value

  return [
    {
      id: 'score',
      label: isRu ? 'Общий score сделки' : 'Trade Score',
      prefix: isRu ? 'Лучше чем' : 'Better than',
      value: `${scoreBreakdown.percentile}%`,
      suffix: isRu ? 'сделок' : 'of trades',
      benchmarkLabel: 'raw score',
      benchmarkValue: formatCurrency(scoreBreakdown.rawScore),
      hint: '',
      tone: scoreBreakdown.percentile >= 70 ? 'positive' : (scoreBreakdown.percentile >= 40 ? 'warning' : 'negative')
    },
    {
      id: 'pnl',
      label: isRu ? 'Результат сделки' : 'Trade Result',
      prefix: currentPnl >= 0 ? (isRu ? 'Прибыль' : 'Profit') : (isRu ? 'Убыток' : 'Loss'),
      value: formatCurrency(currentPnl),
      suffix: isRu ? 'по текущей сделке' : 'on the current trade',
      benchmarkLabel: currentPnl >= 0 ? (isRu ? 'средняя прибыльная' : 'avg win') : (isRu ? 'средняя убыточная' : 'avg loss'),
      benchmarkValue: currentPnl >= 0 ? formatCurrency(avgWin) : formatCurrency(avgLoss),
      hint: '',
      tone: currentPnl >= 0 ? 'positive' : 'negative'
    },
    {
      id: 'required',
      label: isRu ? 'Обязательные условия' : 'Required Conditions',
      prefix: requiredStats.total > 0 ? (isRu ? 'Использовано' : 'Used') : (isRu ? 'Список' : 'List'),
      value: requiredStats.total > 0 ? `${requiredStats.used}/${requiredStats.total}` : 'N/A',
      suffix: requiredStats.total > 0 ? (isRu ? 'required условий' : 'required conditions') : (isRu ? 'required условий не найден' : 'required conditions not found'),
      benchmarkLabel: isRu ? 'статус' : 'status',
      benchmarkValue: requiredStats.total > 0 && requiredStats.used < requiredStats.total
        ? (isRu ? 'пропуск' : 'missing')
        : (isRu ? 'полно' : 'complete'),
      hint: requiredStats.total > 0 && requiredStats.used < requiredStats.total
        ? (isRu ? 'Проверьте, какие required условия были пропущены перед следующим входом.' : 'Review which required conditions were skipped before next entry.')
        : '',
      tone: requiredStats.total > 0 && requiredStats.used < requiredStats.total ? 'warning' : 'positive'
    },
    {
      id: 'risk',
      label: isRu ? 'Риск сделки' : 'Trade Risk',
      prefix: isRu ? 'Риск' : 'Risk',
      value: riskValue,
      suffix: riskSuffix,
      benchmarkLabel: isRu ? 'факт' : 'realized',
      benchmarkValue: riskBenchmarkValue,
      hint: riskAudit.hint,
      benchmarkTone: riskAudit.realizedOk ? 'positive' : 'negative',
      tone: riskAudit.ok ? 'positive' : 'negative'
    },
    {
      id: 'rr',
      label: 'Risk/Reward',
      prefix: 'Risk/Reward',
      value: formatRatio(actualRR.value),
      suffix: isRu ? 'фактическое соотношение' : 'realized ratio',
      benchmarkLabel: isRu ? 'цель' : 'target',
      benchmarkValue: targetRR.value > 0 ? formatRatio(targetRR.value) : 'N/A',
      hint: rrHint,
      tone: targetRR.value > 0 && actualRR.value < targetRR.value ? 'warning' : 'positive'
    }
  ]
})

const scorePatternDescription = (metricId: string) => {
  const isRu = locale.value === 'ru'
  if (metricId === 'pnl') return isRu ? 'Фактический финансовый результат сделки.' : 'Actual financial result of the trade.'
  if (metricId === 'rr') return isRu ? 'Фактическое соотношение риска к прибыли.' : 'Realized risk/reward ratio.'
  return isRu ? 'Покрытие обязательных условий входа.' : 'Coverage of required entry conditions.'
}
</script>

<template>
  <div class="pb-6">
    <div
      v-for="(item, index) in simpleMetricInsights"
      :key="item.id"
      class="group relative grid grid-cols-[34px_minmax(0,1fr)] gap-4 border-b nier-border-primary px-4 py-4 transition-all duration-300 first:border-t hover:bg-black/[0.025] dark:hover:bg-white/[0.025] md:grid-cols-[42px_minmax(0,1fr)_minmax(148px,auto)] md:px-5"
    >
      <div
        class="absolute left-0 top-1/2 h-6 w-px -translate-y-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        :class="item.tone === 'positive' ? 'bg-emerald-500' : (item.tone === 'negative' ? 'bg-rose-500' : 'bg-amber-500')"
      ></div>

      <div class="flex items-center justify-center">
        <div class="relative flex h-7 w-7 items-center justify-center text-[9px] font-mono font-black opacity-45 transition-all duration-300 group-hover:opacity-100">
          <span class="relative">{{ index + 1 }}</span>
        </div>
      </div>

      <div class="min-w-0">
        <div class="mb-2 flex items-center gap-3">
          <span class="text-[8px] font-mono font-black uppercase tracking-[0.32em] opacity-35 transition-opacity group-hover:opacity-60">
            {{ formatDisplayLabel(item.label) }}
          </span>
          <span class="h-px min-w-8 flex-1 bg-current opacity-10"></span>
        </div>
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span class="text-[11px] font-mono uppercase tracking-[0.2em] opacity-45">{{ item.prefix }}</span>
          <span
            class="text-2xl font-mono font-black tracking-normal md:text-3xl"
            :class="item.tone === 'positive' ? 'text-emerald-500 dark:text-emerald-400' : (item.tone === 'negative' ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400')"
          >
            {{ item.value }}
          </span>
          <span class="text-[12px] font-mono uppercase tracking-[0.12em] opacity-70">{{ item.suffix }}</span>
        </div>
        <p v-if="item.hint" class="mt-2 max-w-3xl text-[10px] font-mono uppercase leading-relaxed tracking-[0.16em] opacity-50">
          {{ item.hint }}
        </p>

        <div v-if="item.id === 'score'" class="mt-4">
          <button
            type="button"
            class="inline-flex items-center gap-3 border nier-border-primary px-3 py-2 text-[8px] font-mono font-black uppercase tracking-[0.24em] opacity-70 transition-all duration-300 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
            @click.stop="isTradeScoreExpanded = !isTradeScoreExpanded"
          >
            <span class="relative h-3 w-3">
              <span class="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-current"></span>
              <span
                class="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-300"
                :class="isTradeScoreExpanded ? 'scale-y-0' : 'scale-y-100'"
              ></span>
            </span>
            <span>
              {{ isTradeScoreExpanded ? (locale === 'ru' ? 'Скрыть состав' : 'Hide score') : (locale === 'ru' ? 'Показать состав' : 'Show score') }}
            </span>
          </button>

          <div v-if="isTradeScoreExpanded" class="mt-3 flex max-h-[360px] flex-col overflow-y-auto border-t nier-border-primary pr-1">
            <div
              v-for="pattern in tradeScoreBreakdown.patterns"
              :key="`${pattern.label}-${pattern.value}`"
              class="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-3 border-b nier-border-primary px-2 py-3 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.035]"
              :title="scorePatternDescription(pattern.metricId)"
            >
              <span class="truncate text-[9px] font-mono uppercase tracking-[0.2em] opacity-45">{{ formatDisplayLabel(pattern.label) }}</span>
              <span class="max-w-[220px] truncate text-right text-[10px] font-mono font-black nier-text-primary">
                {{ pattern.value }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="item.id === 'required' && requiredConditionRows.length > 0" class="mt-4">
          <button
            type="button"
            class="inline-flex items-center gap-3 border nier-border-primary px-3 py-2 text-[8px] font-mono font-black uppercase tracking-[0.24em] opacity-70 transition-all duration-300 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
            @click.stop="isRequiredConditionsExpanded = !isRequiredConditionsExpanded"
          >
            <span class="relative h-3 w-3">
              <span class="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-current"></span>
              <span
                class="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-300"
                :class="isRequiredConditionsExpanded ? 'scale-y-0' : 'scale-y-100'"
              ></span>
            </span>
            <span>
              {{ isRequiredConditionsExpanded ? (locale === 'ru' ? 'Скрыть условия' : 'Hide conditions') : (locale === 'ru' ? 'Показать условия' : 'Show conditions') }}
            </span>
          </button>

          <div v-if="isRequiredConditionsExpanded" class="mt-3 flex flex-col border-t nier-border-primary">
            <div
              v-for="condition in requiredConditionRows"
              :key="condition.id"
              class="relative grid grid-cols-[18px_minmax(0,1fr)_auto] items-start gap-3 border-b nier-border-primary px-2 py-3 transition-all duration-300"
              :class="condition.selected
                ? 'bg-black/[0.06] text-black dark:bg-white/[0.08] dark:text-white'
                : 'text-black/35 dark:text-white/35'"
            >
              <span
                class="mt-1 h-2.5 w-2.5 rotate-45 border transition-all duration-300"
                :class="condition.selected
                  ? 'border-black bg-black shadow-[0_0_14px_rgba(0,0,0,0.25)] dark:border-white dark:bg-white dark:shadow-[0_0_16px_rgba(255,255,255,0.35)]'
                  : 'border-current bg-transparent opacity-45'"
              ></span>
              <span class="min-w-0">
                <span class="block truncate text-[10px] font-mono font-black uppercase tracking-[0.22em]">
                  {{ formatDisplayLabel(condition.name) }}
                </span>
                <span
                  v-if="condition.description"
                  class="mt-1 block truncate text-[8px] font-mono uppercase tracking-[0.16em] opacity-45"
                >
                  {{ condition.description }}
                </span>
              </span>
              <span
                class="shrink-0 text-[8px] font-mono font-black uppercase tracking-[0.2em]"
                :class="condition.selected ? 'opacity-90' : 'opacity-40'"
              >
                {{ condition.statusLabel }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="col-start-2 flex items-center md:col-start-auto md:justify-end">
        <div class="inline-flex items-center gap-2 border nier-border-primary px-3 py-2 text-[9px] font-mono uppercase tracking-[0.18em] opacity-70 transition-all duration-300 group-hover:opacity-100">
          <span class="opacity-45">{{ item.benchmarkLabel }}</span>
          <span
            class="font-black"
            :class="(item.benchmarkTone || item.tone) === 'positive' ? 'text-emerald-500 dark:text-emerald-400' : ((item.benchmarkTone || item.tone) === 'negative' ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400')"
          >
            {{ item.benchmarkValue }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
