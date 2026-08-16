import type { MetricEngine } from '~/entities/metric'

export const velocityVarianceIndexMetric: MetricEngine = {
  key: 'velocity_variance_index',
  category: 'strategy_execution',
  i18n: {
    ru: {
      label: 'Вариация скорости PnL',
      sub: 'Скорость к базом PnL/h',
      desc: 'Сравнивает фактически реализованную скорость прибыли со средней базовой скоростью стратегии в долларах в час.',
      formula: 'Realized Velocity / Baseline Velocity',
      benchmark: '>= 1.0x (Оптимальный темп)',
      evaluation: 'Темп роста профита за час удержания.'
    },
    en: {
      label: 'Velocity Variance Index',
      sub: 'Realized vs Baseline $/h',
      desc: 'Compares realized profit velocity against strategy historical baseline velocity in dollars per hour.',
      formula: 'Realized Velocity / Baseline Velocity',
      benchmark: '>= 1.0x (Optimal Pacing)',
      evaluation: 'Execution pacing efficiency.'
    }
  },
  calculate(trade: any, context?: any, locale: 'ru' | 'en' = 'ru') {
    const isRu = locale === 'ru'
    const velocity = Number(trade?.velocity || 65)
    const baseVelocity = Number(context?.avgVelocity || 50)
    const indexVal = velocity / baseVelocity

    const isGood = indexVal >= 1.0
    const evalClass = isGood ? 'text-emerald-500' : 'text-amber-500'

    return {
      rawValue: indexVal,
      formattedValue: `${indexVal.toFixed(2)}x`,
      status: isGood ? 'optimal' : 'warning',
      evaluationText: isGood ? (isRu ? 'Хорошо' : 'Good') : (isRu ? 'Субоптимально' : 'Sub-Optimal'),
      evalClass,
      benchmarkText: isRu ? '>= 1.0x — Высокий темп' : '>= 1.0x — Optimal Pacing',
      benchmarks: [
        { label: '>= 1.0x', eval: isRu ? 'Оптимальный темп' : 'Optimal Pacing', class: 'text-emerald-500 font-bold' },
        { label: '< 1.0x', eval: isRu ? 'Замедление темпа' : 'Lagging Velocity', class: 'text-amber-500 font-bold' }
      ],
      progress: Math.min(100, indexVal * 50),
      colorVal: isGood ? '#34d399' : '#fbbf24'
    }
  }
}
