import type { MetricEngine } from '~/entities/metric'

export const tpCaptureRatioMetric: MetricEngine = {
  key: 'tp_capture_ratio',
  category: 'strategy_execution',
  i18n: {
    ru: {
      label: 'Захват цели тейк-профит',
      sub: 'Доля взятого тейка',
      desc: 'Измеряет, какая часть плановой прибыли до тейк-профита была реализована при закрытии сделки.',
      formula: '(Движение к тейк-профит / Целевая прибыль) * 100',
      benchmark: '100% (Полный захват цели)',
      evaluation: 'Полнота взятия тейк-профита.'
    },
    en: {
      label: 'TP Capture Ratio',
      sub: 'Target Reward Captured',
      desc: 'Measures how much of planned reward toward take profit was realized before exit.',
      formula: '(Reward Toward TP / Target Reward) * 100',
      benchmark: '100% (Full Capture)',
      evaluation: 'Completeness of target capture.'
    }
  },
  calculate(trade: any, _context?: any, locale: 'ru' | 'en' = 'ru') {
    const isRu = locale === 'ru'
    const capture = Math.min(100, Math.max(0, Number(trade?.tpCapture || 85)))

    const isFull = capture === 100
    const evalClass = isFull ? 'text-emerald-500' : 'text-amber-500'

    return {
      rawValue: capture,
      formattedValue: `${capture.toFixed(2)}%`,
      status: isFull ? 'optimal' : 'warning',
      evaluationText: isFull ? (isRu ? 'Идеально' : 'Perfect') : (isRu ? 'Частичный забор' : 'Sub-Optimal'),
      evalClass,
      benchmarkText: isRu ? '100% — Полный забор цели' : '100% — Full Capture',
      benchmarks: [
        { label: '100%', eval: isRu ? 'Полный захват' : 'Full Capture', class: 'text-emerald-500 font-bold' },
        { label: '< 100%', eval: isRu ? 'Частичный захват' : 'Partial Capture', class: 'text-amber-500 font-bold' }
      ],
      progress: capture,
      colorVal: isFull ? '#34d399' : '#fbbf24'
    }
  }
}
