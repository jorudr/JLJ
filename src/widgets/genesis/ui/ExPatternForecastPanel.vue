<template>
  <div class="flex h-[38rem] max-h-[70vh] flex-col overflow-hidden border border-black/10 bg-white/90 shadow-[0_24px_80px_rgba(0,0,0,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-[#070707]/90">
    <div class="flex shrink-0 items-center justify-between border-b border-black/10 px-5 py-3 dark:border-white/10">
      <div class="flex items-center gap-3">
        <div class="h-1.5 w-1.5 rotate-45 bg-black dark:bg-white"></div>
        <span class="font-mono text-[8px] font-black uppercase tracking-[0.45em] text-black/60 dark:text-white/60">
          {{ locale === 'ru' ? 'Structural Pattern Forecast' : 'Structural Pattern Forecast' }}
        </span>
      </div>
      <span class="font-mono text-[8px] font-black uppercase tracking-[0.3em]" :class="confidenceClass">
        {{ confidenceLabel }}
      </span>
    </div>

    <div v-if="loading" class="shrink-0 border-b border-black/10 px-5 py-3 dark:border-white/10">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="h-2 w-2 animate-pulse rotate-45 bg-amber-500 dark:bg-amber-300"></div>
          <span class="font-mono text-[9px] font-black uppercase tracking-[0.28em] text-amber-700 dark:text-amber-200">
            {{ locale === 'ru' ? 'Ищу совместимые стили и паттерны в исторических файлах' : 'Matching style-compatible historical patterns' }}
          </span>
        </div>
        <span class="font-mono text-[8px] uppercase tracking-[0.25em] text-black/45 dark:text-white/45">
          {{ locale === 'ru' ? 'загрузка' : 'loading' }}
        </span>
      </div>
      <div class="mt-3 h-[3px] overflow-hidden bg-black/8 dark:bg-white/10">
        <div class="forecast-loading-bar h-full bg-gradient-to-r from-amber-500 via-black to-amber-500 dark:from-amber-300 dark:via-white dark:to-amber-300"></div>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
      <div class="grid grid-cols-1 gap-0 md:grid-cols-2">
        <div class="border-b border-black/10 px-5 py-4 dark:border-white/10 md:border-b-0 md:border-r">
          <div class="flex items-center justify-between gap-3">
            <span class="font-mono text-[8px] font-black uppercase tracking-[0.35em] text-black/45 dark:text-white/45">
              {{ locale === 'ru' ? 'Стиль пользователя' : 'User style' }}
            </span>
            <span class="font-mono text-[8px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
              {{ forecast.styleProfile.styleLabel }}
            </span>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-3">
            <div class="border border-black/10 px-3 py-3 dark:border-white/10">
              <div class="font-mono text-[7px] uppercase tracking-[0.3em] text-black/35 dark:text-white/35">
                {{ locale === 'ru' ? 'Средний duration' : 'Avg duration' }}
              </div>
              <div class="mt-2 font-mono text-sm font-black text-black dark:text-white">
                {{ formatHours(forecast.styleProfile.averageDurationHours) }}
              </div>
            </div>
            <div class="border border-black/10 px-3 py-3 dark:border-white/10">
              <div class="font-mono text-[7px] uppercase tracking-[0.3em] text-black/35 dark:text-white/35">
                {{ locale === 'ru' ? 'Median abs / trade' : 'Median abs / trade' }}
              </div>
              <div class="mt-2 font-mono text-sm font-black text-black dark:text-white">
                {{ formatPercent(forecast.styleProfile.medianAbsReturnPct, false) }}
              </div>
            </div>
            <div class="border border-black/10 px-3 py-3 dark:border-white/10">
              <div class="font-mono text-[7px] uppercase tracking-[0.3em] text-black/35 dark:text-white/35">
                {{ locale === 'ru' ? 'Сделок в неделю' : 'Trades / week' }}
              </div>
              <div class="mt-2 font-mono text-sm font-black text-black dark:text-white">
                {{ formatNumber(forecast.styleProfile.tradeFrequencyPerWeek, 1) }}
              </div>
            </div>
            <div class="border border-black/10 px-3 py-3 dark:border-white/10">
              <div class="font-mono text-[7px] uppercase tracking-[0.3em] text-black/35 dark:text-white/35">
                {{ locale === 'ru' ? 'Текущий капитал' : 'Current capital' }}
              </div>
              <div class="mt-2 font-mono text-sm font-black text-black dark:text-white">
                {{ formatMoney(forecast.currentCapital) }}
              </div>
            </div>
          </div>
        </div>

        <div class="px-5 py-4">
          <div class="flex items-center justify-between gap-3">
            <span class="font-mono text-[8px] font-black uppercase tracking-[0.35em] text-black/45 dark:text-white/45">
              {{ locale === 'ru' ? 'Текущий структурный паттерн' : 'Current structural pattern' }}
            </span>
            <span class="font-mono text-[8px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
              {{ forecast.currentPattern.sequenceLabel }}
            </span>
          </div>
          <div class="mt-3 grid grid-cols-1 gap-3">
            <div
              v-for="(block, index) in forecast.currentPattern.blocks"
              :key="`${block.phase}-${index}`"
              class="border border-black/10 px-3 py-3 dark:border-white/10"
            >
              <div class="flex items-center justify-between gap-3">
                <span class="font-mono text-[8px] font-black uppercase tracking-[0.25em] text-black dark:text-white">
                  {{ phaseLabel(block.phase) }}
                </span>
                <span class="font-mono text-[8px] uppercase tracking-[0.22em] text-black/40 dark:text-white/40">
                  {{ block.tradeCount }}T
                </span>
              </div>
              <div class="mt-2 grid grid-cols-3 gap-2">
                <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
                  {{ formatPercent(block.returnPct) }}
                </div>
                <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
                  {{ formatHours(block.averageDurationHours) }}
                </div>
                <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
                  WR {{ formatPercent(block.winRate, false) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-black/10 px-5 py-4 dark:border-white/10">
        <div class="flex items-center justify-between gap-3">
          <span class="font-mono text-[8px] font-black uppercase tracking-[0.35em] text-black/45 dark:text-white/45">
            {{ locale === 'ru' ? 'Тактическое продолжение после похожих фаз' : 'Tactical continuation after similar phases' }}
          </span>
          <span class="font-mono text-[8px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            {{ `${forecast.tactical.matchesCount} matches / ${forecast.tactical.sourceFilesCount} files` }}
          </span>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div
            v-for="horizon in forecast.tactical.horizons"
            :key="horizon.horizonTrades"
            class="border border-black/10 px-4 py-4 dark:border-white/10"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="font-mono text-[8px] font-black uppercase tracking-[0.25em] text-black dark:text-white">
                {{ horizon.horizonTrades }}T
              </span>
              <span class="font-mono text-[8px] uppercase tracking-[0.22em] text-black/40 dark:text-white/40">
                {{ locale === 'ru' ? 'медиана matched continuation' : 'matched median continuation' }}
              </span>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div class="font-mono text-[7px] uppercase tracking-[0.25em] text-black/35 dark:text-white/35">P50</div>
                <div class="mt-1 font-mono text-lg font-black text-black dark:text-white">
                  {{ formatPercent(horizon.p50) }}
                </div>
              </div>
              <div>
                <div class="font-mono text-[7px] uppercase tracking-[0.25em] text-black/35 dark:text-white/35">
                  {{ locale === 'ru' ? 'Шанс плюса' : 'Positive odds' }}
                </div>
                <div class="mt-1 font-mono text-lg font-black text-black dark:text-white">
                  {{ formatPercent(horizon.probabilityPositive, false) }}
                </div>
              </div>
            </div>
            <div class="mt-3 grid grid-cols-1 gap-1">
              <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
                P25 / P75: {{ formatPercent(horizon.p25) }} ... {{ formatPercent(horizon.p75) }}
              </div>
              <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
                {{ locale === 'ru' ? 'Линейно от пользователя' : 'User linear estimate' }}:
                {{ formatPercent(horizon.userLinearEstimatePct) }}
              </div>
              <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
                {{ locale === 'ru' ? 'Медианный пик' : 'Median peak' }}:
                {{ formatPercent(horizon.medianPeakPct) }}
              </div>
              <div class="font-mono text-[10px] text-red-600 dark:text-red-300">
                {{ locale === 'ru' ? 'Медианный минимум' : 'Median trough' }}:
                {{ formatPercent(horizon.medianTroughPct) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-black/10 px-5 py-4 dark:border-white/10">
        <div class="flex items-center justify-between gap-3">
          <span class="font-mono text-[8px] font-black uppercase tracking-[0.35em] text-black/45 dark:text-white/45">
            {{ locale === 'ru' ? 'Итоговая близость по финальным исходам' : 'Terminal outcome affinity' }}
          </span>
          <span class="font-mono text-[8px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            {{ locale === 'ru' ? 'от текущего паттерна до конца файла' : 'from current pattern to file end' }}
          </span>
        </div>

        <div class="mt-4 border border-black/10 px-4 py-4 dark:border-white/10">
          <div class="font-mono text-[8px] uppercase tracking-[0.28em] text-black/35 dark:text-white/35">
            {{ locale === 'ru' ? 'Ключевой вывод' : 'Key takeaway' }}
          </div>
          <div class="mt-2 font-mono text-sm font-black text-black dark:text-white">
            {{ lifecycleSummary }}
          </div>
          <div class="mt-2 grid grid-cols-1 gap-1 md:grid-cols-3">
            <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
              {{ locale === 'ru' ? 'Близость к 30%+' : 'Affinity to 30%+' }}:
              {{ formatPercent(forecast.lifecycle.affinityAbove30, false) }}
            </div>
            <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
              {{ locale === 'ru' ? 'Близость к профиту' : 'Affinity to profit' }}:
              {{ formatPercent(forecast.lifecycle.affinityPositive, false) }}
            </div>
            <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
              {{ locale === 'ru' ? 'Медианный остаток пути' : 'Median remaining path' }}:
              {{ formatPercent(forecast.lifecycle.medianContinuationToEndPct) }}
            </div>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <div
            v-for="group in forecast.lifecycle.groups"
            :key="group.key"
            class="border border-black/10 px-3 py-3 dark:border-white/10"
          >
            <div class="font-mono text-[8px] font-black uppercase tracking-[0.22em] text-black dark:text-white">
              {{ group.label }}
            </div>
            <div class="mt-2 font-mono text-base font-black text-black dark:text-white">
              {{ formatPercent(group.affinityScore, false) }}
            </div>
            <div class="mt-1 font-mono text-[10px] text-black/40 dark:text-white/40">
              {{ group.matchesCount }} matches
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-black/10 px-5 py-4 dark:border-white/10">
        <div class="flex items-center justify-between gap-3">
          <span class="font-mono text-[8px] font-black uppercase tracking-[0.35em] text-black/45 dark:text-white/45">
            {{ locale === 'ru' ? 'Лучшие исторические совпадения' : 'Best historical matches' }}
          </span>
          <span class="font-mono text-[8px] uppercase tracking-[0.25em] text-black/40 dark:text-white/40">
            {{ locale === 'ru' ? 'style + pattern' : 'style + pattern' }}
          </span>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          v-for="(match, index) in forecast.topMatches"
          :key="`${match.sourceFile}-${index}`"
          class="border border-black/10 px-4 py-4 dark:border-white/10"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="font-mono text-[8px] font-black uppercase tracking-[0.22em] text-black dark:text-white">
              {{ match.fileLabel }}
            </span>
            <span class="font-mono text-[8px] uppercase tracking-[0.22em] text-black/40 dark:text-white/40">
              {{ match.matchedPhaseLabel }}
            </span>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
              Style: {{ formatPercent(match.styleScore, false) }}
            </div>
            <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
              Pattern: {{ formatPercent(match.patternScore, false) }}
            </div>
            <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
              +10T: {{ formatPercent(match.continuation10Pct) }}
            </div>
            <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
              +20T: {{ formatPercent(match.continuation20Pct) }}
            </div>
            <div class="font-mono text-[10px] text-black dark:text-white">
              End: {{ formatPercent(match.continuationToEndPct) }}
            </div>
            <div class="font-mono text-[10px] text-black/45 dark:text-white/45">
              File total: {{ formatPercent(match.totalFileReturnPct) }}
            </div>
          </div>
        </div>
        </div>
      </div>

      <div
        v-if="forecast.status === 'insufficient-data'"
        class="border-t border-black/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-amber-600 dark:border-white/10 dark:text-amber-300"
      >
        {{ forecast.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { loadFromDisk, saveToDisk } from '~/shared/diskStorage'
import { useI18n } from '~/shared/i18n/useI18n'
import {
  calculatePatternForecast,
  createEmptyPatternForecast
} from '~/widgets/genesis/model/patternForecast'
import type { PatternForecastResult } from '~/widgets/genesis/model/patternForecast'
import type { DiaryEntry } from '~/entities/diary/model/diary.types'

const props = defineProps<{
  visible: boolean
  trades: DiaryEntry[]
  initialCapital: number
  strategyId: string
  strategyName: string
}>()

const emit = defineEmits<{
  (e: 'loading-change', value: boolean): void
}>()

const { locale } = useI18n()

const loading = ref(false)
const forecast = ref<PatternForecastResult>(createEmptyPatternForecast())
let requestId = 0

const persistPatternForecastSnapshot = async (result: PatternForecastResult) => {
  const savedAt = new Date().toISOString()
  const fileName = `pattern_forecast_${sanitizeFileSegment(props.strategyId)}_${Date.now()}`
  const snapshot = {
    savedAt,
    strategyId: props.strategyId,
    strategyName: props.strategyName,
    tradeCount: props.trades.length,
    initialCapital: props.initialCapital,
    forecast: result
  }

  await saveToDisk(fileName, snapshot)

  const existingIndex = await loadFromDisk<any[]>('pattern_forecast_index_v1')
  const index = Array.isArray(existingIndex) ? existingIndex : []
  index.push({
    savedAt,
    fileName,
    strategyId: props.strategyId,
    strategyName: props.strategyName,
    tradeCount: props.trades.length,
    confidence: result.confidence,
    strongestGroup: result.lifecycle.strongestGroupLabel,
    strongestGroupAffinity: result.lifecycle.strongestGroupAffinity
  })
  await saveToDisk('pattern_forecast_index_v1', index.slice(-250))
}

const refreshForecast = async () => {
  if (!props.visible) return

  const nextRequestId = requestId + 1
  requestId = nextRequestId

  loading.value = true
  emit('loading-change', true)
  forecast.value = createEmptyPatternForecast({
    message: locale.value === 'ru'
      ? 'Собираю новый pattern forecast по myfxbook/mql4/mql5.'
      : 'Building structural pattern forecast from myfxbook/mql4/mql5.'
  })

  try {
    const result = await calculatePatternForecast({
      trades: props.trades,
      initialCapital: props.initialCapital
    })

    if (requestId === nextRequestId) {
      forecast.value = result
      if (result.status === 'ready') {
        await persistPatternForecastSnapshot(result)
      }
    }
  } catch (error) {
    if (requestId === nextRequestId) {
      forecast.value = createEmptyPatternForecast({
        message: locale.value === 'ru'
          ? 'Не удалось собрать structural pattern forecast.'
          : 'Unable to build the structural pattern forecast.'
      })
    }
  } finally {
    if (requestId === nextRequestId) {
      loading.value = false
      emit('loading-change', false)
    }
  }
}

watch(
  () => [props.visible, props.strategyId, props.initialCapital, props.trades, locale.value],
  () => {
    if (props.visible) {
      void refreshForecast()
    } else {
      emit('loading-change', false)
    }
  },
  { deep: true, immediate: true }
)

onUnmounted(() => {
  emit('loading-change', false)
})

const confidenceLabel = computed(() => {
  if (locale.value === 'ru') {
    if (forecast.value.confidence === 'high') return 'Высокая уверенность'
    if (forecast.value.confidence === 'medium') return 'Средняя уверенность'
    return 'Низкая уверенность'
  }

  if (forecast.value.confidence === 'high') return 'High confidence'
  if (forecast.value.confidence === 'medium') return 'Medium confidence'
  return 'Low confidence'
})

const confidenceClass = computed(() => {
  if (forecast.value.confidence === 'high') return 'text-emerald-600 dark:text-emerald-300'
  if (forecast.value.confidence === 'medium') return 'text-amber-600 dark:text-amber-300'
  return 'text-red-600 dark:text-red-300'
})

const lifecycleSummary = computed(() => {
  if (locale.value === 'ru') {
    return `Текущий профиль ближе всего к фазам, которые в итоге заканчивались в группе ${forecast.value.lifecycle.strongestGroupLabel} со сходством ${formatPercent(forecast.value.lifecycle.strongestGroupAffinity, false)}.`
  }
  return `The current profile is closest to phases that eventually finished in the ${forecast.value.lifecycle.strongestGroupLabel} group with ${formatPercent(forecast.value.lifecycle.strongestGroupAffinity, false)} affinity.`
})

const formatNumber = (value: number, digits = 1) => {
  if (!Number.isFinite(value)) return '0'
  return new Intl.NumberFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value)
}

const formatPercent = (value: number, signed = true) => {
  const sign = signed && value > 0 ? '+' : ''
  return `${sign}${formatNumber(value, 1)}%`
}

const formatMoney = (value: number) => {
  const sign = value < 0 ? '-$' : '$'
  return `${sign}${formatNumber(Math.abs(value), 0)}`
}

const formatHours = (hours: number) => {
  if (!Number.isFinite(hours) || hours <= 0) return '0H'
  if (hours >= 24) {
    return `${formatNumber(hours / 24, 1)}D`
  }
  return `${formatNumber(hours, 1)}H`
}

const phaseLabel = (phase: string) => {
  if (locale.value === 'ru') {
    if (phase === 'impulse-up') return 'Импульс роста'
    if (phase === 'drawdown') return 'Просадка'
    if (phase === 'recovery') return 'Восстановление'
    return 'Диапазон'
  }

  if (phase === 'impulse-up') return 'Impulse up'
  if (phase === 'drawdown') return 'Drawdown'
  if (phase === 'recovery') return 'Recovery'
  return 'Range'
}

function sanitizeFileSegment(value: string) {
  return String(value || 'strategy').replace(/[^a-zA-Z0-9_-]+/g, '_')
}
</script>
