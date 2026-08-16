import type { MetricEngine } from '~/entities/metric'

export const conditionalAlphaDecayMetric: MetricEngine = {
  key: 'conditional_alpha_decay',
  category: 'strategy_execution',
  i18n: {
    ru: {
      label: 'Угасание условий',
      sub: 'Пропущенные правила',
      desc: 'Коррелирует негативные эмоциональные маркеры с отсутствующими обязательными правилами в наборе условий.',
      formula: 'Missing Required Rules * Emotion Penalty',
      benchmark: '0 Rules (Без распада альфы)',
      evaluation: 'Потеря системного преимущества из-за отсутствия правил.'
    },
    en: {
      label: 'Conditional Alpha Decay',
      sub: 'Missing Rules Penalty',
      desc: 'Correlates negative emotional markers with required rules missing from executed condition set.',
      formula: 'Missing Required Rules * Emotion Penalty',
      benchmark: '0 Rules (Zero Decay)',
      evaluation: 'Systematic alpha loss due to omitted rules.'
    }
  },
  calculate(trade: any, _context?: any, locale: 'ru' | 'en' = 'ru') {
    const isRu = locale === 'ru'
    const emotions = Array.isArray(trade?.emotions) ? trade.emotions : []
    const missingCount = emotions.length > 2 ? 1 : 0

    const isZero = missingCount === 0
    const evalClass = isZero ? 'text-emerald-500' : 'text-rose-500'

    return {
      rawValue: missingCount,
      formattedValue: `-${missingCount} ${isRu ? 'Правил' : 'Rules'}`,
      status: isZero ? 'optimal' : 'critical',
      evaluationText: isZero ? (isRu ? 'Идеально' : 'Perfect') : (isRu ? 'Предупреждение распада' : 'Decay Warning'),
      evalClass,
      benchmarkText: isRu ? '0 Правил — Без потерь' : '0 Rules — Zero Decay',
      benchmarks: [
        { label: '0 Rules', eval: isRu ? 'Без распада' : 'Zero Decay', class: 'text-emerald-500 font-bold' },
        { label: '> 0 Rules', eval: isRu ? 'Распад альфы' : 'Alpha Decay', class: 'text-rose-500 font-bold' }
      ],
      progress: isZero ? 100 : 30,
      colorVal: isZero ? '#34d399' : '#f87171'
    }
  }
}
