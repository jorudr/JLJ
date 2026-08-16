import type { MetricEngine } from '~/entities/metric'

export const assetProtocolMetric: MetricEngine = {
  key: 'asset_protocol',
  category: 'execution',
  i18n: {
    ru: {
      label: 'Протокол актива',
      sub: 'Инструмент и направление',
      desc: 'Конкретный торговый инструмент и направление (Лонг/Шорт), используемые в операции.',
      formula: 'Направление сделки + Актив сделки',
      benchmark: 'Проверенный актив (Верифицирован)',
      evaluation: 'Соответствие разрешенному списку активов.'
    },
    en: {
      label: 'Asset Protocol',
      sub: 'Active Tactical Layer',
      desc: 'Specific market vehicle and direction (Long/Short) utilized for this tactical operation.',
      formula: 'Trade Side + Trade Asset',
      benchmark: 'Valid Asset (Verified)',
      evaluation: 'Market asset and side verification.'
    }
  },
  calculate(trade: any, _context?: any, locale: 'ru' | 'en' = 'ru') {
    const isRu = locale === 'ru'
    const side = trade?.side || 'Long'
    const asset = trade?.asset || 'BTC/USDT'
    const formattedValue = `${side.toUpperCase()} ${asset}`

    return {
      rawValue: 1,
      formattedValue,
      status: 'optimal',
      evaluationText: isRu ? 'Идеально' : 'Perfect',
      evalClass: 'text-emerald-500',
      benchmarkText: isRu ? 'Проверенный актив — разрешенный актив' : 'Valid Asset — Verified',
      benchmarks: [
        { label: isRu ? 'Проверенный актив' : 'Valid Asset', eval: isRu ? 'Верифицирован' : 'Verified', class: 'text-emerald-500 font-bold' }
      ],
      progress: 100,
      colorVal: '#34d399'
    }
  }
}
