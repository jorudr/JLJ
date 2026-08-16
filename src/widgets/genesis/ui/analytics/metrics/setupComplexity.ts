import type { MetricEngine } from '~/entities/metric'

export const setupComplexityMetric: MetricEngine = {
  key: 'setup_complexity',
  category: 'adherence',
  i18n: {
    ru: {
      label: 'Сложность сетапа',
      sub: 'Относительно медианы правил',
      desc: 'Оценивает общее количество сработавших правил по сравнению с медианным количеством правил для этого сценария.',
      formula: 'Active Rules / Scenario Median',
      benchmark: '<= 1.5x (Сбалансированный сетап)',
      evaluation: 'Сложность и лаконичность торгового сценария.'
    },
    en: {
      label: 'Setup Complexity',
      sub: 'vs Scenario Median',
      desc: 'Evaluates total count of active rules versus historical median rule count for the entry scenario.',
      formula: 'Active Rules / Scenario Median',
      benchmark: '<= 1.5x (Good)',
      evaluation: 'Complexity relative to scenario benchmark.'
    }
  },
  calculate(trade: any, _context?: any, locale: 'ru' | 'en' = 'ru') {
    const isRu = locale === 'ru'
    const activeRules = Array.isArray(trade?.conditions) ? trade.conditions.length : 3
    const medianRules = 3
    const ratio = activeRules / medianRules

    const isGood = ratio <= 1.5
    const evalClass = isGood ? 'text-emerald-500' : 'text-amber-500'

    return {
      rawValue: ratio,
      formattedValue: `${ratio.toFixed(2)}x`,
      status: isGood ? 'optimal' : 'warning',
      evaluationText: isGood ? (isRu ? 'Хорошо' : 'Good') : (isRu ? 'Переусложнен' : 'Over-Complicated'),
      evalClass,
      benchmarkText: isRu ? '<= 1.5x — Лаконичный сетап' : '<= 1.5x — Good Complexity',
      benchmarks: [
        { label: '<= 1.5x', eval: isRu ? 'Хорошо' : 'Good', class: 'text-emerald-500 font-bold' },
        { label: '> 1.5x', eval: isRu ? 'Переусложнен' : 'Over-Complicated', class: 'text-amber-500 font-bold' }
      ],
      progress: Math.min(100, ratio * 50),
      colorVal: isGood ? '#34d399' : '#fbbf24'
    }
  }
}
