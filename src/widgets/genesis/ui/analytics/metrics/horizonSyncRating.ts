import type { MetricEngine } from '~/entities/metric'

export const horizonSyncRatingMetric: MetricEngine = {
  key: 'horizon_sync_rating',
  category: 'strategy_execution',
  i18n: {
    ru: {
      label: 'Синхронизация горизонта',
      sub: 'Позиция в временном диапазоне',
      desc: 'Показывает положение длительности сделки внутри исторического диапазона данного сценария от минимума до максимума.',
      formula: '(Длительность сделки - Минимум сценария) / (Максимум сценария - Минимум сценария) * 100',
      benchmark: '0% - 100% (В рамках горизонта)',
      evaluation: 'Соответствие временному сценарию удержания.'
    },
    en: {
      label: 'Horizon Sync Rating',
      sub: 'Duration Position in Scenario Range',
      desc: 'Shows trade duration position inside historical scenario range, from minimum to maximum.',
      formula: '(Trade Duration - Scenario Min) / (Scenario Max - Scenario Min) * 100',
      benchmark: '0% - 100% (In Range)',
      evaluation: 'Synchronization with expected time horizon.'
    }
  },
  calculate(trade: any, context?: any, locale: 'ru' | 'en' = 'ru') {
    const isRu = locale === 'ru'
    const duration = Number(context?.durationMinutes || trade?.durationMinutes || 120)
    const minDur = Number(context?.scenarioMinDur || 30)
    const maxDur = Number(context?.scenarioMaxDur || 300)

    const rating = Math.min(100, Math.max(0, ((duration - minDur) / (maxDur - minDur)) * 100))
    const evalText = rating <= 50 ? (isRu ? 'Норма' : 'Scenario Mid') : (isRu ? 'Длительное' : 'Scenario Max')

    return {
      rawValue: rating,
      formattedValue: `${rating.toFixed(2)}%`,
      status: 'stable',
      evaluationText: evalText,
      evalClass: 'text-emerald-500',
      benchmarkText: isRu ? '0% - 100% — Нормальный диапазон' : '0% - 100% — Normal Range',
      benchmarks: [
        { label: '0%', eval: isRu ? 'Сценарий Мин' : 'Scenario Min', class: 'text-emerald-500 font-bold' },
        { label: '50%', eval: isRu ? 'Сценарий Средний' : 'Scenario Mid', class: 'text-slate-500 font-bold' },
        { label: '100%', eval: isRu ? 'Сценарий Макс' : 'Scenario Max', class: 'text-emerald-500 font-bold' }
      ],
      progress: rating,
      colorVal: '#34d399'
    }
  }
}
