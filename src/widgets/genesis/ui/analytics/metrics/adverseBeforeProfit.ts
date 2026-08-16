import type { MetricEngine } from '~/entities/metric'

export const adverseBeforeProfitMetric: MetricEngine = {
  key: 'adverseBeforeProfit',
  category: 'in_trade',
  i18n: {
    ru: {
      label: 'Просадка до плюса',
      sub: 'Просадка перед первым профитом',
      desc: 'Показывает, была ли значимая просадка до выхода сделки в первый значимый плюс.',
      formula: 'Просадка появилась до прибыли',
      benchmark: 'Нет (Плюс без просадки)',
      evaluation: 'Чистота движения позиции к первичному профиту.'
    },
    en: {
      label: 'Adverse Before Profit',
      sub: 'Drawdown before Profit',
      desc: 'Shows whether meaningful adverse movement appeared before first meaningful profit.',
      formula: 'Adverse Move Occurred Before Profit',
      benchmark: 'No (Direct Profit)',
      evaluation: 'Presence of initial adverse drawdown before profit.'
    }
  },
  calculate(trade: any, context?: any, locale: 'ru' | 'en' = 'ru') {
    const isRu = locale === 'ru'
    const hadAdverse = Boolean(context?.adverseBeforeProfit ?? trade?.adverseBeforeProfit ?? false)

    const isClear = !hadAdverse
    const evalClass = isClear ? 'text-emerald-500' : 'text-amber-500'
    const formattedValue = isClear ? (isRu ? 'Нет' : 'No') : (isRu ? 'Да' : 'Yes')

    return {
      rawValue: isClear ? 0 : 1,
      formattedValue,
      status: isClear ? 'optimal' : 'warning',
      evaluationText: isClear ? (isRu ? 'Прямой вход' : 'Direct Profit') : (isRu ? 'Просадка на старте' : 'Initial Drawdown'),
      evalClass,
      benchmarkText: isRu ? 'No — Прямой доход без просадки' : 'No — Direct Profit',
      benchmarks: [
        { label: 'No', eval: isRu ? 'Без просадки' : 'Direct Profit', class: 'text-emerald-500 font-bold' },
        { label: isRu ? 'Да' : 'Yes', eval: isRu ? 'Просадка до плюса' : 'Initial Drawdown', class: 'text-amber-500 font-bold' }
      ],
      progress: isClear ? 100 : 30,
      colorVal: isClear ? '#34d399' : '#fbbf24'
    }
  }
}
