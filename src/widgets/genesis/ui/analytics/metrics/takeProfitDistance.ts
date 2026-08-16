import type { MetricEngine } from '~/entities/metric'

export const takeProfitDistanceMetric: MetricEngine = {
  key: 'take_profit_distance',
  category: 'execution',
  i18n: {
    ru: {
      label: 'Дистанция тейк-профита',
      sub: 'Дистанция от входа до TP в %',
      desc: 'Расстояние от точки входа до целевого уровня тейк-профита в процентах.',
      formula: 'abs(Take Profit - Entry) / Entry * 100',
      benchmark: '2.0% - 5.0% (Оптимальная цель)',
      evaluation: 'Соотношение дистанции цели и рыночной волатильности.'
    },
    en: {
      label: 'Take Profit Distance',
      sub: 'Entry to TP distance in %',
      desc: 'Percent distance from entry level to target take-profit level.',
      formula: 'abs(Take Profit - Entry) / Entry * 100',
      benchmark: '2.0% - 5.0% (Target Sweetspot)',
      evaluation: 'Target distance adequacy relative to volatility.'
    }
  },
  calculate(trade: any, _context?: any, locale: 'ru' | 'en' = 'ru') {
    const entry = parseFloat(trade?.entry || 0)
    const tp = parseFloat(trade?.takeProfit || trade?.tp || 0)
    let distPct = 0
    if (entry > 0 && tp > 0) {
      distPct = (Math.abs(tp - entry) / entry) * 100
    }

    const isRu = locale === 'ru'
    let status: 'optimal' | 'stable' | 'neutral' | 'warning' | 'critical' = 'neutral'
    let evalText = isRu ? 'Умеренная' : 'Moderate'
    let evalClass = 'text-amber-400'
    let colorVal = '#fbbf24'

    if (distPct >= 2 && distPct <= 8) {
      status = 'optimal'
      evalText = isRu ? 'Оптимальная цель' : 'Optimal Target'
      evalClass = 'text-emerald-400 font-bold'
      colorVal = '#34d399'
    } else if (distPct > 8) {
      status = 'warning'
      evalText = isRu ? 'Агрессивная цель' : 'Aggressive Target'
      evalClass = 'text-amber-300'
      colorVal = '#fcd34d'
    } else if (distPct > 0) {
      status = 'stable'
      evalText = isRu ? 'Близкая цель' : 'Conservative Target'
      evalClass = 'text-sky-400'
      colorVal = '#38bdf8'
    } else {
      status = 'neutral'
      evalText = isRu ? 'Без TP' : 'No TP Set'
      evalClass = 'text-gray-400'
      colorVal = '#9ca3af'
    }

    return {
      rawValue: distPct,
      formattedValue: `${distPct.toFixed(2)}%`,
      status,
      evaluationText: evalText,
      evalClass,
      benchmarkText: isRu ? '2.0% - 8.0% — Сбалансированная цель' : '2.0% - 8.0% — Balanced Target',
      benchmarks: [
        { label: '2.0% - 8.0%', eval: isRu ? 'Оптимально' : 'Optimal', class: 'text-emerald-400 font-bold' },
        { label: '> 8.0%', eval: isRu ? 'Высокий риск' : 'Aggressive', class: 'text-amber-400' },
        { label: '< 2.0%', eval: isRu ? 'Короткий тейк' : 'Short Target', class: 'text-sky-400' }
      ],
      progress: Math.min(100, Math.max(0, distPct * 10)),
      colorVal
    }
  }
}
