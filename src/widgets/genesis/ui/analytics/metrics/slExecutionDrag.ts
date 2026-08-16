import type { MetricEngine } from '~/entities/metric'

export const slExecutionDragMetric: MetricEngine = {
  key: 'sl_execution_drag',
  category: 'strategy_execution',
  i18n: {
    ru: {
      label: 'Проскальзывание стоп-лосс',
      sub: 'Отклонение цены выхода от стоп-лосс',
      desc: 'Сравнивает плановый стоп-лосс с фактической ценой выхода для измерения проскальзывания или преждевременного закрытия.',
      formula: 'Фактический выход - Плановый стоп-лосс',
      benchmark: '>= $0.00 (Без проскальзывания)',
      evaluation: 'Точность исполнения стоп-приказа.'
    },
    en: {
      label: 'SL Execution Drag',
      sub: 'Slippage vs Planned SL',
      desc: 'Compares planned stop loss against actual exit price to measure execution slippage or premature cutting.',
      formula: 'Actual Exit - Planned Stop Loss',
      benchmark: '>= $0.00 (Zero Drag)',
      evaluation: 'Precision of stop loss execution.'
    }
  },
  calculate(trade: any, _context?: any, locale: 'ru' | 'en' = 'ru') {
    const isRu = locale === 'ru'
    const drag = Number(trade?.slDrag || 0)

    const isGood = drag >= 0
    const evalClass = isGood ? 'text-emerald-500' : 'text-rose-500'

    return {
      rawValue: drag,
      formattedValue: `${isGood ? '+' : ''}$${drag.toFixed(2)}`,
      status: isGood ? 'optimal' : 'critical',
      evaluationText: isGood ? (isRu ? 'Хорошо' : 'Good') : (isRu ? 'Субоптимально' : 'Sub-Optimal'),
      evalClass,
      benchmarkText: isRu ? '>= $0.00 — Без лишних потерь' : '>= $0.00 — Zero Drag',
      benchmarks: [
        { label: '>= $0', eval: isRu ? 'Без проскальзывания' : 'Zero Drag', class: 'text-emerald-500 font-bold' },
        { label: '< $0', eval: isRu ? 'Проскальзывание' : 'Slippage', class: 'text-rose-500 font-bold' }
      ],
      progress: isGood ? 100 : Math.max(0, 100 + (drag * 2)),
      colorVal: isGood ? '#34d399' : '#f87171'
    }
  }
}
