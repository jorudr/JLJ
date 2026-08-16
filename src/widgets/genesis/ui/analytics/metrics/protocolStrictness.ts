import type { MetricEngine } from '~/entities/metric'

export const protocolStrictnessMetric: MetricEngine = {
  key: 'protocol_strictness',
  category: 'adherence',
  i18n: {
    ru: {
      label: 'Строгость протокола',
      sub: 'Взвешенный рейтинг правил',
      desc: 'Взвешенная алгоритмическая оценка строгости соблюдения правил матрицы.',
      formula: '(Required Rules * 2.5) + (Additional Rules * 1.5)',
      benchmark: '>= 8.0 / 10 (Высокий самоконтроль)',
      evaluation: 'Алгоритмическая дисциплина исполнения.'
    },
    en: {
      label: 'Protocol Strictness',
      sub: 'Weighted Rating',
      desc: 'A weighted algorithmic score combining required and additional criteria to measure execution strictness.',
      formula: '(Required Rules * 2.5) + (Additional Rules * 1.5)',
      benchmark: '>= 8.0 / 10 (Good)',
      evaluation: 'Execution discipline and rule strictness.'
    }
  },
  calculate(trade: any, _context?: any, locale: 'ru' | 'en' = 'ru') {
    const isRu = locale === 'ru'
    const scenarios = Array.isArray(trade?.scenarios) ? trade.scenarios : []
    const reqCount = scenarios.length || 3
    const addCount = Array.isArray(trade?.conditions) ? trade.conditions.length : 1
    const strictness = Math.min(10, (reqCount * 2.2) + (addCount * 0.8))

    const isGood = strictness >= 8.0
    const evalClass = isGood ? 'text-emerald-500' : 'text-amber-500'

    return {
      rawValue: strictness,
      formattedValue: `${strictness.toFixed(2)} / 10`,
      status: isGood ? 'optimal' : 'warning',
      evaluationText: isGood ? (isRu ? 'Хорошо' : 'Good') : (isRu ? 'Субоптимально' : 'Sub-Optimal'),
      evalClass,
      benchmarkText: isRu ? '>= 8.0 — Высокая строгость' : '>= 8.0 — Good Strictness',
      benchmarks: [
        { label: '>= 8.0', eval: isRu ? 'Хорошо' : 'Good', class: 'text-emerald-500 font-bold' },
        { label: '< 8.0', eval: isRu ? 'Субоптимально' : 'Sub-Optimal', class: 'text-amber-500 font-bold' }
      ],
      progress: strictness * 10,
      colorVal: isGood ? '#34d399' : '#fbbf24'
    }
  }
}
