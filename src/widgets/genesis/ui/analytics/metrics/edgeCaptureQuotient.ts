import type { MetricEngine } from '~/entities/metric'

export const edgeCaptureQuotientMetric: MetricEngine = {
  key: 'edge_capture_quotient',
  category: 'strategy_execution',
  i18n: {
    ru: {
      label: 'Сохранение преимущества',
      sub: 'Фактический RR / Базовый RR',
      desc: 'Сравнивает фактически реализованное соотношение Risk/Reward с базовым ожидаемым R/R стратегии.',
      formula: 'Realized RR / Baseline RR',
      benchmark: '>= 1.0x (Преимущество сохранено)',
      evaluation: 'Сохранение математического преимущества.'
    },
    en: {
      label: 'Edge Capture Quotient',
      sub: 'Realized RR vs Baseline RR',
      desc: 'Compares realized Risk/Reward ratio against strategy expected baseline R/R.',
      formula: 'Realized RR / Baseline RR',
      benchmark: '>= 1.0x (Edge Maintained)',
      evaluation: 'Retention of mathematical edge.'
    }
  },
  calculate(trade: any, context?: any, locale: 'ru' | 'en' = 'ru') {
    const isRu = locale === 'ru'
    const realizedRr = Number(trade?.rr || 2.2)
    const baselineRr = Number(context?.baselineRr || 2.0)
    const quotient = realizedRr / baselineRr

    const isGood = quotient >= 1.0
    const evalClass = isGood ? 'text-emerald-500' : 'text-rose-500'

    return {
      rawValue: quotient,
      formattedValue: `${quotient.toFixed(2)}x`,
      status: isGood ? 'optimal' : 'critical',
      evaluationText: isGood ? (isRu ? 'Хорошо' : 'Good') : (isRu ? 'Субоптимально' : 'Sub-Optimal'),
      evalClass,
      benchmarkText: isRu ? '>= 1.0x — Преимущество сохранено' : '>= 1.0x — Edge Maintained',
      benchmarks: [
        { label: '>= 1.0x', eval: isRu ? 'Преимущество сохранено' : 'Edge Maintained', class: 'text-emerald-500 font-bold' },
        { label: '< 1.0x', eval: isRu ? 'Размытие преимущества' : 'Edge Diluted', class: 'text-rose-500 font-bold' }
      ],
      progress: Math.min(100, quotient * 50),
      colorVal: isGood ? '#34d399' : '#f87171'
    }
  }
}
