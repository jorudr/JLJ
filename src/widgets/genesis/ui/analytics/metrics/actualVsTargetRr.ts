import type { MetricEngine } from '~/entities/metric'

export const actualVsTargetRrMetric: MetricEngine = {
  key: 'actual_vs_target_rr',
  category: 'execution',
  i18n: {
    ru: {
      label: 'Фактический и Целевой риск/прибыль',
      sub: 'Соотношение риска и награды',
      desc: 'Сравнивает фактически реализованный Риск/Прибыль с целевым показателем матрицы.',
      formula: 'Реализованная прибыль / Реализованный риск',
      benchmark: '>= Целевого риск/прибыль (Цель достигнута)',
      evaluation: 'Соответствие реального риск/прибыль плановому ориентиру.'
    },
    en: {
      label: 'Actual vs Target R/R',
      sub: 'Realized vs Planned Risk/Reward',
      desc: 'Compares realized Risk/Reward ratio against matrix target protocol.',
      formula: 'Realized Reward / Realized Risk',
      benchmark: '>= Target RR (Target Met)',
      evaluation: 'Realized R/R efficiency against setup goal.'
    }
  },
  calculate(trade: any, context?: any, locale: 'ru' | 'en' = 'ru') {
    const isRu = locale === 'ru'
    const actualRr = Number(context?.rr ?? trade?.rr ?? trade?.riskReward ?? trade?.realizedRr ?? 0)
    const targetRr = Number(context?.targetRr || 2.0)

    const isMet = actualRr >= targetRr
    const evalClass = isMet ? 'text-emerald-500' : 'text-amber-500'

    return {
      rawValue: actualRr,
      formattedValue: `1:${actualRr.toFixed(2)}`,
      status: isMet ? 'optimal' : 'warning',
      evaluationText: isMet ? (isRu ? 'Хорошо' : 'Good') : (isRu ? 'Субоптимально' : 'Sub-Optimal'),
      evalClass,
      benchmarkText: isRu ? '>= Целевой RR — Цель выполнена' : '>= Target RR — Target Met',
      benchmarks: [
        { label: isRu ? '>= Целевой RR' : '>= Target RR', eval: isRu ? 'Цель выполнена' : 'Target Met', class: 'text-emerald-500 font-bold' },
        { label: isRu ? '< Целевой RR' : '< Target RR', eval: isRu ? 'Субоптимально' : 'Sub-Optimal', class: 'text-amber-500 font-bold' }
      ],
      progress: Math.min(100, (actualRr / 4) * 100),
      colorVal: isMet ? '#34d399' : '#fbbf24'
    }
  }
}
