import type { MetricEngine } from '~/entities/metric'

export const actualVsTargetRrMetric: MetricEngine = {
  key: 'actual_vs_target_rr',
  category: 'execution',
  i18n: {
    ru: {
      label: 'Фактический vs Целевой R/R',
      sub: 'Соотношение риска и награды',
      desc: 'Сравнивает фактически реализованный Risk/Reward с целевым показателем матрицы.',
      formula: 'Realized Reward / Realized Risk',
      benchmark: '>= Целевого RR (Цель достигнута)',
      evaluation: 'Соответствие реального R/R плановому ориентиру.'
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
    const actualRr = Number(trade?.rr || trade?.realizedRr || 2.2)
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
        { label: '>= Target RR', eval: isRu ? 'Цель выполнена' : 'Target Met', class: 'text-emerald-500 font-bold' },
        { label: '< Target RR', eval: isRu ? 'Субоптимально' : 'Sub-Optimal', class: 'text-amber-500 font-bold' }
      ],
      progress: Math.min(100, (actualRr / 4) * 100),
      colorVal: isMet ? '#34d399' : '#fbbf24'
    }
  }
}
