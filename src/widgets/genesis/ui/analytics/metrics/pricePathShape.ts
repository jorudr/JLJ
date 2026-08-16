import type { MetricEngine } from '~/entities/metric'

export const pricePathShapeMetric: MetricEngine = {
  key: 'pricePathShape',
  category: 'in_trade',
  i18n: {
    ru: {
      label: 'Форма движения',
      sub: 'Классификация траектории',
      desc: 'Классификация геометрической траектории движения цены от момента входа до момента закрытия.',
      formula: 'Паттерн сгенерированных свечей',
      benchmark: 'Чистый тренд (Чистый тренд)',
      evaluation: 'Качественный паттерн движения внутри сделки.'
    },
    en: {
      label: 'Price Path Shape',
      sub: 'Trajectory Classification',
      desc: 'Path pattern classification generated from price candles during trade duration.',
      formula: 'Generated Candle Path Pattern',
      benchmark: 'Clean Trend (Smooth Capture)',
      evaluation: 'Price path trajectory classification.'
    }
  },
  calculate(trade: any, context?: any, locale: 'ru' | 'en' = 'ru') {
    const isRu = locale === 'ru'
    const shape = String(context?.pricePathShape || trade?.pathShape || 'CLEAN_TREND_CAPTURE')

    let labelText = isRu ? 'Чистый тренд' : 'Clean Trend'
    let isGood = true

    if (shape.includes('CHOPPY') || shape.includes('NOISE')) {
      labelText = isRu ? 'Рваное движение' : 'Choppy Path'
      isGood = false
    } else if (shape.includes('ADVERSE')) {
      labelText = isRu ? 'Просадка затем отскок' : 'Adverse then Recovery'
      isGood = false
    }

    const evalClass = isGood ? 'text-emerald-500' : 'text-amber-500'

    return {
      rawValue: isGood ? 1 : 0,
      formattedValue: labelText,
      status: isGood ? 'optimal' : 'warning',
      evaluationText: isGood ? (isRu ? 'Идеально' : 'Clean Trend') : (isRu ? 'Рваное движение' : 'Choppy'),
      evalClass,
      benchmarkText: isRu ? 'Чистый тренд — плавный захват' : 'Clean Trend — Smooth Capture',
      benchmarks: [
        { label: isRu ? 'Чистый тренд' : 'Clean Trend', eval: isRu ? 'Чистый тренд' : 'Clean Trend', class: 'text-emerald-500 font-bold' },
        { label: isRu ? 'Рваная траектория' : 'Choppy Path', eval: isRu ? 'Шумовое движение' : 'Choppy Path', class: 'text-amber-500 font-bold' }
      ],
      progress: isGood ? 100 : 40,
      colorVal: isGood ? '#34d399' : '#fbbf24'
    }
  }
}
