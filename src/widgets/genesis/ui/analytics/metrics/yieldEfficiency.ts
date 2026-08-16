import type { MetricEngine } from '~/entities/metric'

export const yieldEfficiencyMetric: MetricEngine = {
  key: 'yield_efficiency',
  category: 'execution',
  i18n: {
    ru: {
      label: 'Эффективность доходности',
      sub: 'К балансу до сделки',
      desc: 'Измеряет чистый прирост депозита от сделки относительно баланса счёта перед входом.',
      formula: '(PnL / Баланс до сделки) * 100',
      benchmark: '> 0% (Положительный прирост)',
      evaluation: 'Процентное изменение депозита от сделки.'
    },
    en: {
      label: 'Yield Efficiency',
      sub: 'Balance Before Trade',
      desc: 'Measures net impact of this trade relative to account balance immediately before entry.',
      formula: '(PnL / Balance Before Trade) * 100',
      benchmark: '> 0% (Positive Impact)',
      evaluation: 'Percentage return relative to account balance.'
    }
  },
  calculate(trade: any, context?: any, locale: 'ru' | 'en' = 'ru') {
    const isRu = locale === 'ru'
    const pnl = Number(trade?.pnl || trade?.profit || 0)
    const initialBalance = Number(context?.initialBalance || 10000)
    const yieldPct = (pnl / initialBalance) * 100

    const isPositive = yieldPct >= 0
    const evalClass = isPositive ? 'text-emerald-500' : 'text-rose-500'

    return {
      rawValue: yieldPct,
      formattedValue: `${yieldPct.toFixed(2)}%`,
      status: isPositive ? 'optimal' : 'critical',
      evaluationText: isPositive ? (isRu ? 'Положительно' : 'Positive') : (isRu ? 'Отрицательно' : 'Negative'),
      evalClass,
      benchmarkText: isRu ? '> 0% — Прирост депозита' : '> 0% — Positive Impact',
      benchmarks: [
        { label: '> 0%', eval: isRu ? 'Положительно' : 'Positive Impact', class: 'text-emerald-500 font-bold' },
        { label: '< 0%', eval: isRu ? 'Просадка' : 'Drawdown', class: 'text-rose-500 font-bold' }
      ],
      progress: Math.min(100, Math.max(0, 50 + (yieldPct * 10))),
      colorVal: isPositive ? '#34d399' : '#f87171'
    }
  }
}
