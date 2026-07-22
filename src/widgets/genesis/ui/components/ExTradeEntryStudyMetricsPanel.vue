<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from '~/shared/i18n/useI18n'
import ExPanel from '~/shared/ui/ExPanel.vue'

const { locale } = useI18n()

const {
  side,
  asset,
  isDark,
  currentAssetData,
  isForex,
  showTradeStudyMetrics,
  tradeStudyMetrics,
  resetTradeStudyMetrics,
  commitState
} = inject('tradeState')

const copy = {
  en: {
    title: 'TRADE_STUDY_METRICS',
    subtitle: 'Manual post-trade dataset',
    reset: 'RESET',
    pageMarket: 'MARKET_DATA',
    pageManual: 'MANUAL_METRICS',
    generate: 'GENERATE DATA',
    generating: 'GENERATING...',
    noAsset: 'Select an asset in the commit footer first',
    selectedAsset: 'Selected asset',
    generatedSource: 'Resolved API symbol',
    noCandles: 'No generated candle data yet',
    chartHint: 'Wheel to zoom. Drag to pan.',
    apiError: 'Unable to resolve or load public OHLC data for this asset.',
    warning: 'Generated data may differ slightly from the data you used while trading. It will be automatically adjusted to your entered values for a more precise analysis.',
    ohlc: {
      open: 'O',
      high: 'H',
      low: 'L',
      close: 'C'
    },
    boolOn: 'YES',
    boolOff: 'NO',
    directionUp: 'ROSE',
    directionDown: 'FELL',
    groups: {
      pricePath: 'PRICE_PATH',
      news: 'NEWS_CONTEXT'
    },
    fields: {
      maxPriceDuringTrade: 'Max price during trade',
      minPriceDuringTrade: 'Min price during trade',
      priceDroppedBelowEntryLong: 'Price dropped below entry point for long vector',
      priceRoseAboveEntryShort: 'Price rose above entry point for short vector',
      hadNews: 'News during trade',
      priceDirectionBeforeNews: 'Price direction before the news',
      priceDirectionBeforeNewsChangePercent: 'How much price changed before the news, %',
      priceDirectionAfterNews: 'Price direction after the news',
      priceDirectionAfterNewsChangePercent: 'How much price changed after the news, %'
    },
    placeholders: {
      maxPriceDuringTrade: 'ex. 4312.50',
      minPriceDuringTrade: 'ex. 4268.25',
      forexMaxPriceDuringTrade: 'ex. 1.00542',
      forexMinPriceDuringTrade: 'ex. 1.00180',
      durationDays: 'ex. 0',
      durationHours: 'ex. 1',
      durationMinutes: 'ex. 25',
      durationSeconds: 'ex. 30',
      percentMove: 'ex. 1.2'
    },
    duration: {
      belowLong: 'How long price stayed below entry',
      aboveShort: 'How long price stayed above entry',
      days: 'Days',
      hours: 'Hours',
      minutes: 'Minutes',
      seconds: 'Seconds'
    },
    units: {
      money: '$',
      forex: 'POINTS'
    }
  },
  ru: {
    title: 'МЕТРИКИ_ИЗУЧЕНИЯ_СДЕЛКИ',
    subtitle: 'Ручной набор данных после сделки',
    reset: 'СБРОС',
    pageMarket: 'РЫНОЧНЫЕ_ДАННЫЕ',
    pageManual: 'РУЧНЫЕ_МЕТРИКИ',
    generate: 'СГЕНЕРИРОВАТЬ ДАННЫЕ',
    generating: 'ГЕНЕРАЦИЯ...',
    noAsset: 'Сначала выберите актив в нижнем footer с commit',
    selectedAsset: 'Выбранный актив',
    generatedSource: 'Символ API',
    noCandles: 'Сгенерированных свечей пока нет',
    chartHint: 'Колесо - zoom. Перетаскивание - pan.',
    apiError: 'Не удалось найти или загрузить публичные OHLC данные для этого актива.',
    warning: 'Полученные данные могут немного отличаться от тех, что вы использовали для торговли. Они будут подстроены автоматически под введенные вами значения для более точного анализа.',
    ohlc: {
      open: 'O',
      high: 'H',
      low: 'L',
      close: 'C'
    },
    boolOn: 'ДА',
    boolOff: 'НЕТ',
    directionUp: 'ВЫРОСЛА',
    directionDown: 'УПАЛА',
    groups: {
      pricePath: 'ПУТЬ_ЦЕНЫ',
      news: 'НОВОСТИ_И_КОНТЕКСТ'
    },
    fields: {
      maxPriceDuringTrade: 'Макс. цена во время сделки',
      minPriceDuringTrade: 'Мин. цена во время сделки',
      priceDroppedBelowEntryLong: 'Цена упала ниже точки входа для вектора long',
      priceRoseAboveEntryShort: 'Цена выросла выше точки входа для вектора short',
      hadNews: 'Были новости',
      priceDirectionBeforeNews: 'Цена перед новостью',
      priceDirectionBeforeNewsChangePercent: 'На сколько изменилась цена перед новостью, %',
      priceDirectionAfterNews: 'Цена после новости',
      priceDirectionAfterNewsChangePercent: 'На сколько изменилась цена после новости, %'
    },
    placeholders: {
      maxPriceDuringTrade: 'напр. 4312.50',
      minPriceDuringTrade: 'напр. 4268.25',
      forexMaxPriceDuringTrade: 'напр. 1.00542',
      forexMinPriceDuringTrade: 'напр. 1.00180',
      durationDays: 'напр. 0',
      durationHours: 'напр. 1',
      durationMinutes: 'напр. 25',
      durationSeconds: 'напр. 30',
      percentMove: 'напр. 1.2'
    },
    duration: {
      belowLong: 'Как долго цена была ниже входа',
      aboveShort: 'Как долго цена была выше входа',
      days: 'Дни',
      hours: 'Часы',
      minutes: 'Минуты',
      seconds: 'Секунды'
    },
    units: {
      money: '$',
      forex: 'ПУНКТЫ'
    }
  }
}

const ui = () => copy[locale.value] || copy.en

const studyPages = [
  { id: 'market', number: 1 },
  { id: 'manual', number: 2 }
]

const timeframeOptions = [
  { id: '4h', label: '4HOURS', limit: 18 },
  { id: '1h', label: '1HOUR', limit: 72 },
  { id: '30m', label: '30MINS', limit: 144 }
]

const activeStudyPage = ref('market')
const activeGeneratedTimeframe = ref('4h')
const generatedMarketData = ref({})
const resolvedMarketSymbol = ref('')
const resolvedMarketProvider = ref('')
const generatedSourceAsset = ref('')
const generationState = ref('idle')
const generationError = ref('')
const hoveredCandle = ref(null)
const chartCrosshair = ref(null)
const chartCanvas = ref(null)
const chartViewport = ref({ start: 0, end: 0 })
const isChartDragging = ref(false)
const lastChartPointerX = ref(0)

let binanceSymbolsPromise = null
let resizeObserver = null

const groups = [
  {
    id: 'pricePath',
    fields: [
      { key: 'maxPriceDuringTrade', type: 'number', unit: 'price' },
      { key: 'minPriceDuringTrade', type: 'number', unit: 'price' },
      { key: 'priceDroppedBelowEntryLong', type: 'boolean' },
      { key: 'priceRoseAboveEntryShort', type: 'boolean' }
    ]
  },
  {
    id: 'news',
    fields: [
      { key: 'hadNews', type: 'boolean' },
      { key: 'priceDirectionBeforeNews', type: 'direction' },
      { key: 'priceDirectionBeforeNewsChangePercent', type: 'directionPercent', directionKey: 'priceDirectionBeforeNews' },
      { key: 'priceDirectionAfterNews', type: 'direction' },
      { key: 'priceDirectionAfterNewsChangePercent', type: 'directionPercent', directionKey: 'priceDirectionAfterNews' }
    ]
  }
]

const durationFieldGroups = {
  priceDroppedBelowEntryLong: {
    titleKey: 'belowLong',
    fields: [
      { key: 'priceBelowEntryLongDurationDays', unitKey: 'days', placeholderKey: 'durationDays' },
      { key: 'priceBelowEntryLongDurationHours', unitKey: 'hours', placeholderKey: 'durationHours' },
      { key: 'priceBelowEntryLongDurationMinutes', unitKey: 'minutes', placeholderKey: 'durationMinutes' },
      { key: 'priceBelowEntryLongDurationSeconds', unitKey: 'seconds', placeholderKey: 'durationSeconds' }
    ]
  },
  priceRoseAboveEntryShort: {
    titleKey: 'aboveShort',
    fields: [
      { key: 'priceAboveEntryShortDurationDays', unitKey: 'days', placeholderKey: 'durationDays' },
      { key: 'priceAboveEntryShortDurationHours', unitKey: 'hours', placeholderKey: 'durationHours' },
      { key: 'priceAboveEntryShortDurationMinutes', unitKey: 'minutes', placeholderKey: 'durationMinutes' },
      { key: 'priceAboveEntryShortDurationSeconds', unitKey: 'seconds', placeholderKey: 'durationSeconds' }
    ]
  }
}

const splitFields = (fields) => {
  const midpoint = Math.ceil(fields.length / 2)
  return [fields.slice(0, midpoint), fields.slice(midpoint)]
}

const usesForexPriceFormat = computed(() => {
  return Boolean(isForex?.value || currentAssetData?.value?.type === 'Forex')
})

const selectedTradeAsset = computed(() => String(asset?.value || '').trim())

const canGenerateMarketData = computed(() => {
  return Boolean(selectedTradeAsset.value) && commitState?.value !== 'loading' && generationState.value !== 'loading'
})

const generatedChartCandles = computed(() => {
  return generatedMarketData.value?.[activeGeneratedTimeframe.value] || []
})

const activeTimeframeMeta = computed(() => {
  return timeframeOptions.find(timeframe => timeframe.id === activeGeneratedTimeframe.value) || timeframeOptions[0]
})

const resolvedMarketLabel = computed(() => {
  if (!resolvedMarketSymbol.value) return ''
  return resolvedMarketProvider.value
    ? `${resolvedMarketProvider.value}: ${resolvedMarketSymbol.value}`
    : resolvedMarketSymbol.value
})

const normalizeApiSymbol = (value) => {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

const normalizeYahooSymbol = (value) => {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '')
}

const getAssetType = () => String(currentAssetData?.value?.type || '').trim().toLowerCase()

const getAssetName = () => String(currentAssetData?.value?.name || '').trim()

const isLikelyCryptoAsset = computed(() => {
  const type = getAssetType()
  const name = getAssetName().toLowerCase()
  return type === 'crypto' && !name.includes('tokenized stock')
})

const isLikelyXStockAsset = computed(() => {
  const type = getAssetType()
  const name = getAssetName().toLowerCase()
  const symbol = normalizeApiSymbol(selectedTradeAsset.value)
  return type === 'xstocks' || name.includes('tokenized stock') || (type === 'crypto' && symbol.endsWith('X'))
})

const pushCandidate = (set, value) => {
  const symbol = normalizeApiSymbol(value)
  if (symbol) set.add(symbol)
}

const stripKnownQuote = (symbol) => {
  const normalized = normalizeApiSymbol(symbol)
  const quotes = ['USDT', 'USDC', 'FDUSD', 'BUSD', 'USD', 'PERP']
  for (const quote of quotes) {
    if (normalized.endsWith(quote) && normalized.length > quote.length) {
      return normalized.slice(0, -quote.length)
    }
  }
  return normalized
}

const buildBinanceSymbolCandidates = () => {
  const candidates = new Set()
  const rawAsset = selectedTradeAsset.value
  const assetData = currentAssetData?.value || {}
  const rawParts = String(rawAsset).split(/[\/:_-]/).filter(Boolean)
  const directValues = [rawAsset, assetData.symbol, assetData.ticker]

  directValues.forEach(value => pushCandidate(candidates, value))
  if (rawParts.length >= 2) {
    pushCandidate(candidates, `${rawParts[0]}${rawParts[1]}`)
    pushCandidate(candidates, `${rawParts[0]}USDT`)
    pushCandidate(candidates, `${rawParts[0]}USDC`)
  }

  const bases = new Set()
  directValues.forEach(value => {
    const base = stripKnownQuote(value)
    if (base) bases.add(base)
  })
  if (rawParts[0]) bases.add(stripKnownQuote(rawParts[0]))

  const aliasMap = {
    XBT: 'BTC',
    BTCUSD: 'BTC',
    ETHUSD: 'ETH',
    SOLUSD: 'SOL',
    XRPUSD: 'XRP',
    BNBUSD: 'BNB',
    GOLD: 'PAXG',
    XAU: 'PAXG',
    XAUUSD: 'PAXG'
  }

  Array.from(bases).forEach(base => {
    const mappedBase = aliasMap[base] || base
    ;['USDT', 'USDC', 'FDUSD', 'BTC', 'ETH'].forEach(quote => {
      pushCandidate(candidates, `${mappedBase}${quote}`)
    })
    if (mappedBase.endsWith('X') && mappedBase.length > 2) {
      ;['USDT', 'USDC'].forEach(quote => pushCandidate(candidates, `${mappedBase.slice(0, -1)}${quote}`))
    }
  })

  return Array.from(candidates)
}

const getTokenizedStockBase = (symbol) => {
  const normalized = stripKnownQuote(symbol)
  return normalized.endsWith('X') && normalized.length > 1 ? normalized.slice(0, -1) : normalized
}

const buildBybitSymbolCandidates = () => {
  const candidates = new Set()
  const rawAsset = selectedTradeAsset.value
  const assetData = currentAssetData?.value || {}
  const rawParts = String(rawAsset).split(/[\/:_-]/).filter(Boolean)
  const directValues = [rawAsset, assetData.symbol, assetData.ticker]
  const aliasMap = { XBT: 'BTC' }

  directValues.forEach(value => pushCandidate(candidates, value))
  if (rawParts.length >= 2) pushCandidate(candidates, `${rawParts[0]}${rawParts[1]}`)

  const bases = new Set()
  directValues.forEach(value => {
    const base = isLikelyXStockAsset.value ? getTokenizedStockBase(value) : stripKnownQuote(value)
    if (base) bases.add(aliasMap[base] || base)
  })
  if (rawParts[0]) {
    const rawBase = isLikelyXStockAsset.value ? getTokenizedStockBase(rawParts[0]) : stripKnownQuote(rawParts[0])
    if (rawBase) bases.add(aliasMap[rawBase] || rawBase)
  }

  Array.from(bases).forEach(base => {
    ;['USDT', 'USDC'].forEach(quote => {
      pushCandidate(candidates, `${base}${quote}`)
      if (isLikelyXStockAsset.value) pushCandidate(candidates, `${base}X${quote}`)
    })
  })

  return Array.from(candidates)
}

const pushYahooCandidate = (set, value) => {
  const symbol = normalizeYahooSymbol(value)
  if (symbol) set.add(symbol)
}

const getBaseAssetSymbol = () => {
  const rawAsset = selectedTradeAsset.value
  const rawParts = String(rawAsset).split(/[\/:_-]/).filter(Boolean)
  return stripKnownQuote(rawParts[0] || rawAsset)
}

const buildYahooSymbolCandidates = () => {
  const candidates = new Set()
  const rawAsset = selectedTradeAsset.value
  const assetData = currentAssetData?.value || {}
  const assetType = getAssetType()
  const assetName = getAssetName()
  const rawSymbol = normalizeYahooSymbol(rawAsset)
  const base = getBaseAssetSymbol()
  const rawParts = String(rawAsset).split(/[\/:_-]/).filter(Boolean).map(normalizeYahooSymbol)

  const directValues = [rawAsset, assetData.symbol, assetData.ticker]
  directValues.forEach(value => pushYahooCandidate(candidates, value))

  const commodityMap = {
    XAU: 'GC=F',
    XAUUSD: 'GC=F',
    GOLD: 'GC=F',
    GC: 'GC=F',
    XAG: 'SI=F',
    XAGUSD: 'SI=F',
    SILVER: 'SI=F',
    SI: 'SI=F',
    XPT: 'PL=F',
    XPTUSD: 'PL=F',
    PLATINUM: 'PL=F',
    XPD: 'PA=F',
    XPDUSD: 'PA=F',
    PALLADIUM: 'PA=F',
    OIL: 'CL=F',
    WTI: 'CL=F',
    USOIL: 'CL=F',
    CL: 'CL=F',
    BRENT: 'BZ=F',
    UKOIL: 'BZ=F',
    NATGAS: 'NG=F',
    NG: 'NG=F',
    COPPER: 'HG=F',
    HG: 'HG=F'
  }

  const indexMap = {
    SPX: '^GSPC',
    SP500: '^GSPC',
    US500: '^GSPC',
    NASDAQ: '^IXIC',
    NDX: '^NDX',
    US100: '^NDX',
    DJI: '^DJI',
    DOW: '^DJI',
    US30: '^DJI',
    RUT: '^RUT'
  }

  const mapped = commodityMap[rawSymbol] || commodityMap[base] || indexMap[rawSymbol] || indexMap[base]
  if (mapped) pushYahooCandidate(candidates, mapped)

  if (assetType === 'forex' || rawParts.length >= 2) {
    const left = rawParts[0] || base
    const right = rawParts[1] || (rawSymbol.endsWith('USD') ? 'USD' : '')
    if (left && right) pushYahooCandidate(candidates, `${left}${right}=X`)
    if (rawSymbol.length === 6) pushYahooCandidate(candidates, `${rawSymbol}=X`)
  }

  if (isLikelyCryptoAsset.value) {
    const cryptoBase = base === 'XBT' ? 'BTC' : base
    ;['USD', 'USDC'].forEach(quote => pushYahooCandidate(candidates, `${cryptoBase}-${quote}`))
  }

  const isTokenizedStock = assetName.toLowerCase().includes('tokenized stock') || assetType === 'xstocks'
  if (isTokenizedStock || (assetType === 'crypto' && rawSymbol.endsWith('X'))) {
    if (rawSymbol.endsWith('X') && rawSymbol.length > 1) pushYahooCandidate(candidates, rawSymbol.slice(0, -1))
    if (base.endsWith('X') && base.length > 1) pushYahooCandidate(candidates, base.slice(0, -1))
  }

  pushYahooCandidate(candidates, base)
  if (base.includes('.')) pushYahooCandidate(candidates, base.replace('.', '-'))

  return Array.from(candidates)
}

const fetchJsonWithFallback = async (path) => {
  const hosts = ['https://api.binance.com', 'https://api1.binance.com', 'https://api2.binance.com']
  let lastError = null
  for (const host of hosts) {
    try {
      const response = await fetch(`${host}${path}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error('Public API request failed')
}

const getBinanceTradableSymbols = async () => {
  if (!binanceSymbolsPromise) {
    binanceSymbolsPromise = fetchJsonWithFallback('/api/v3/exchangeInfo').then(payload => {
      const symbols = Array.isArray(payload?.symbols) ? payload.symbols : []
      return new Set(
        symbols
          .filter(item => item?.status === 'TRADING' && item?.isSpotTradingAllowed !== false)
          .map(item => item.symbol)
      )
    })
  }
  return binanceSymbolsPromise
}

const resolveBinanceSymbol = async () => {
  const tradableSymbols = await getBinanceTradableSymbols()
  const candidates = buildBinanceSymbolCandidates()
  return candidates.find(candidate => tradableSymbols.has(candidate)) || ''
}

const parseKlineCandles = (rows) => {
  return (Array.isArray(rows) ? rows : [])
    .map(row => ({
      time: Number(row[0]),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5])
    }))
    .filter(candle => [candle.time, candle.open, candle.high, candle.low, candle.close].every(Number.isFinite))
}

const parseBybitKlineCandles = (payload) => {
  if (payload?.retCode !== 0) throw new Error(payload?.retMsg || 'Bybit kline error')
  const rows = Array.isArray(payload?.result?.list) ? payload.result.list : []
  return rows
    .map(row => ({
      time: Number(row[0]),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5] || 0)
    }))
    .filter(candle => [candle.time, candle.open, candle.high, candle.low, candle.close].every(Number.isFinite))
    .sort((a, b) => a.time - b.time)
}

const filterToLastThreeDays = (candles) => {
  const cutoff = Date.now() - (3 * 24 * 60 * 60 * 1000)
  return candles.filter(candle => candle.time >= cutoff)
}

const parseYahooChartCandles = (payload) => {
  const result = payload?.chart?.result?.[0]
  const timestamps = Array.isArray(result?.timestamp) ? result.timestamp : []
  const quote = result?.indicators?.quote?.[0] || {}
  const opens = quote.open || []
  const highs = quote.high || []
  const lows = quote.low || []
  const closes = quote.close || []
  const volumes = quote.volume || []

  return timestamps
    .map((timestamp, index) => ({
      time: Number(timestamp) * 1000,
      open: Number(opens[index]),
      high: Number(highs[index]),
      low: Number(lows[index]),
      close: Number(closes[index]),
      volume: Number(volumes[index] || 0)
    }))
    .filter(candle => [candle.time, candle.open, candle.high, candle.low, candle.close].every(Number.isFinite))
}

const aggregateCandles = (candles, bucketMs) => {
  const buckets = new Map()
  candles.forEach(candle => {
    const bucketTime = Math.floor(candle.time / bucketMs) * bucketMs
    const bucket = buckets.get(bucketTime)
    if (!bucket) {
      buckets.set(bucketTime, { ...candle, time: bucketTime })
      return
    }
    bucket.high = Math.max(bucket.high, candle.high)
    bucket.low = Math.min(bucket.low, candle.low)
    bucket.close = candle.close
    bucket.volume += candle.volume || 0
  })
  return Array.from(buckets.values()).sort((a, b) => a.time - b.time)
}

const fetchYahooChart = async (symbol, interval) => {
  const encodedSymbol = encodeURIComponent(symbol)
  const params = new URLSearchParams({
    range: '5d',
    interval,
    includePrePost: 'true',
    events: 'div,splits'
  })
  const hosts = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com']
  let lastError = null
  for (const host of hosts) {
    try {
      const response = await fetch(`${host}/v8/finance/chart/${encodedSymbol}?${params.toString()}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = await response.json()
      const apiError = payload?.chart?.error
      if (apiError) throw new Error(apiError.description || apiError.code || 'Yahoo chart error')
      return payload
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error('Yahoo chart request failed')
}

const loadYahooMarketData = async () => {
  const candidates = buildYahooSymbolCandidates()
  let lastError = null

  for (const symbol of candidates) {
    try {
      const hourly = filterToLastThreeDays(parseYahooChartCandles(await fetchYahooChart(symbol, '60m')))
      if (!hourly.length) throw new Error(`No Yahoo 60m data for ${symbol}`)

      let thirtyMinute = []
      try {
        thirtyMinute = filterToLastThreeDays(parseYahooChartCandles(await fetchYahooChart(symbol, '30m')))
      } catch (error) {
        thirtyMinute = hourly
      }

      const marketData = {
        '30m': adjustCandlesToStudyMetrics(thirtyMinute),
        '1h': adjustCandlesToStudyMetrics(hourly),
        '4h': adjustCandlesToStudyMetrics(aggregateCandles(hourly, 4 * 60 * 60 * 1000))
      }

      if (marketData['1h'].length) {
        return {
          provider: 'YAHOO',
          symbol,
          candlesByTimeframe: marketData
        }
      }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('No Yahoo market data candidates matched')
}

const loadBinanceMarketData = async () => {
  const symbol = await resolveBinanceSymbol()
  if (!symbol) throw new Error(`No Binance market for ${selectedTradeAsset.value}`)

  const timeframeEntries = await Promise.all(timeframeOptions.map(async timeframe => {
    const params = new URLSearchParams({
      symbol,
      interval: timeframe.id,
      limit: String(timeframe.limit)
    })
    const rows = await fetchJsonWithFallback(`/api/v3/klines?${params.toString()}`)
    return [timeframe.id, adjustCandlesToStudyMetrics(parseKlineCandles(rows))]
  }))

  return {
    provider: 'BINANCE',
    symbol,
    candlesByTimeframe: Object.fromEntries(timeframeEntries)
  }
}

const fetchBybitKlines = async ({ category, symbol, timeframe }) => {
  const intervalMap = {
    '30m': '30',
    '1h': '60',
    '4h': '240'
  }
  const params = new URLSearchParams({
    category,
    symbol,
    interval: intervalMap[timeframe.id],
    start: String(Date.now() - (3 * 24 * 60 * 60 * 1000)),
    end: String(Date.now()),
    limit: String(timeframe.limit)
  })
  const response = await fetch(`https://api.bybit.com/v5/market/kline?${params.toString()}`)
  if (!response.ok) throw new Error(`Bybit HTTP ${response.status}`)
  return parseBybitKlineCandles(await response.json())
}

const loadBybitMarketData = async () => {
  const candidates = buildBybitSymbolCandidates()
  const categories = isLikelyXStockAsset.value ? ['spot'] : ['spot', 'linear']
  let lastError = null

  for (const category of categories) {
    for (const symbol of candidates) {
      try {
        const timeframeEntries = await Promise.all(timeframeOptions.map(async timeframe => {
          const candles = await fetchBybitKlines({ category, symbol, timeframe })
          return [timeframe.id, adjustCandlesToStudyMetrics(candles)]
        }))
        const candlesByTimeframe = Object.fromEntries(timeframeEntries)
        if (candlesByTimeframe['1h']?.length || candlesByTimeframe[activeGeneratedTimeframe.value]?.length) {
          return {
            provider: `BYBIT_${category.toUpperCase()}`,
            symbol,
            candlesByTimeframe
          }
        }
      } catch (error) {
        lastError = error
      }
    }
  }

  throw lastError || new Error('No Bybit market data candidates matched')
}

const loadPublicMarketData = async () => {
  const loaders = (isLikelyCryptoAsset.value || isLikelyXStockAsset.value)
    ? [loadBybitMarketData, loadYahooMarketData]
    : [loadYahooMarketData, loadBinanceMarketData]

  let lastError = null
  for (const loader of loaders) {
    try {
      const result = await loader()
      if (result?.candlesByTimeframe?.[activeGeneratedTimeframe.value]?.length || result?.candlesByTimeframe?.['1h']?.length) {
        return result
      }
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error('No public market data provider matched')
}

const parsePositiveMetric = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : Number.NaN
}

const adjustCandlesToStudyMetrics = (candles) => {
  const manualMax = parsePositiveMetric(tradeStudyMetrics.value.maxPriceDuringTrade)
  const manualMin = parsePositiveMetric(tradeStudyMetrics.value.minPriceDuringTrade)
  if (!candles.length || (!Number.isFinite(manualMax) && !Number.isFinite(manualMin))) return candles

  const sourceHigh = Math.max(...candles.map(candle => candle.high))
  const sourceLow = Math.min(...candles.map(candle => candle.low))
  let mapPrice = null

  if (
    Number.isFinite(manualMax) &&
    Number.isFinite(manualMin) &&
    manualMax > manualMin &&
    sourceHigh > sourceLow
  ) {
    const scale = (manualMax - manualMin) / (sourceHigh - sourceLow)
    mapPrice = price => manualMin + ((price - sourceLow) * scale)
  } else if (Number.isFinite(manualMax) && sourceHigh > 0) {
    const scale = manualMax / sourceHigh
    mapPrice = price => price * scale
  } else if (Number.isFinite(manualMin) && sourceLow > 0) {
    const scale = manualMin / sourceLow
    mapPrice = price => price * scale
  }

  if (!mapPrice) return candles

  return candles.map(candle => {
    const open = mapPrice(candle.open)
    const high = mapPrice(candle.high)
    const low = mapPrice(candle.low)
    const close = mapPrice(candle.close)
    return {
      ...candle,
      open,
      high: Math.max(open, high, low, close),
      low: Math.min(open, high, low, close),
      close
    }
  })
}

const generateMarketData = async () => {
  if (!canGenerateMarketData.value) return

  generationState.value = 'loading'
  generationError.value = ''
  hoveredCandle.value = null
  chartCrosshair.value = null

  try {
    const result = await loadPublicMarketData()
    generatedMarketData.value = result.candlesByTimeframe
    resolvedMarketSymbol.value = result.symbol
    resolvedMarketProvider.value = result.provider
    generatedSourceAsset.value = selectedTradeAsset.value
    generationState.value = 'success'
    resetChartViewport()
  } catch (error) {
    console.error('[TradeStudyMetrics] Market data generation failed:', error)
    generationError.value = error?.message || ui().apiError
    generationState.value = 'error'
  } finally {
    await nextTick()
    drawChart()
  }
}

const formatPrice = (value) => {
  if (!Number.isFinite(value)) return 'N/A'
  if (value >= 1000) return value.toFixed(2)
  if (value >= 1) return value.toFixed(4)
  return value.toFixed(6)
}

const formatCandleTime = (time) => {
  if (!Number.isFinite(time)) return '--'
  return new Intl.DateTimeFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(time))
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const resetChartViewport = () => {
  const candles = generatedChartCandles.value
  chartViewport.value = { start: 0, end: candles.length }
}

const getChartGeometry = (canvas) => {
  const rect = canvas.getBoundingClientRect()
  return {
    rect,
    left: 14,
    right: Math.max(120, rect.width - 84),
    top: 24,
    bottom: Math.max(120, rect.height - 32)
  }
}

const getVisibleCandles = () => {
  const candles = generatedChartCandles.value
  if (!candles.length) return []
  const start = clamp(Math.floor(chartViewport.value.start), 0, Math.max(0, candles.length - 1))
  const end = clamp(Math.ceil(chartViewport.value.end || candles.length), start + 1, candles.length)
  return candles.slice(start, end).map((candle, index) => ({ ...candle, absoluteIndex: start + index }))
}

const drawChart = () => {
  const canvas = chartCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const rect = canvas.getBoundingClientRect()
  if (!ctx || rect.width <= 0 || rect.height <= 0) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(rect.width * dpr)
  canvas.height = Math.round(rect.height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, rect.width, rect.height)

  const visible = getVisibleCandles()
  const geometry = getChartGeometry(canvas)
  const plotWidth = geometry.right - geometry.left
  const plotHeight = geometry.bottom - geometry.top
  const dark = true
  const axisColor = dark ? 'rgba(255,255,255,0.34)' : 'rgba(0,0,0,0.36)'
  const gridColor = dark ? 'rgba(255,255,255,0.075)' : 'rgba(0,0,0,0.075)'
  const textColor = dark ? 'rgba(255,255,255,0.58)' : 'rgba(0,0,0,0.54)'
  const upColor = '#ffffff'
  const downColor = dark ? 'rgba(251,113,133,0.88)' : 'rgba(190,18,60,0.82)'

  ctx.strokeStyle = gridColor
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i += 1) {
    const y = geometry.top + (plotHeight * i / 4)
    ctx.beginPath()
    ctx.moveTo(geometry.left, y)
    ctx.lineTo(geometry.right, y)
    ctx.stroke()
  }

  ctx.strokeStyle = axisColor
  ctx.beginPath()
  ctx.moveTo(geometry.left, geometry.top)
  ctx.lineTo(geometry.left, geometry.bottom)
  ctx.lineTo(geometry.right, geometry.bottom)
  ctx.stroke()

  if (!visible.length) return

  const minLow = Math.min(...visible.map(candle => candle.low))
  const maxHigh = Math.max(...visible.map(candle => candle.high))
  const padding = Math.max((maxHigh - minLow) * 0.08, maxHigh * 0.0001)
  const minPrice = minLow - padding
  const maxPrice = maxHigh + padding
  const priceRange = maxPrice - minPrice || 1
  const yForPrice = price => geometry.top + ((maxPrice - price) / priceRange) * plotHeight
  const barWidth = plotWidth / visible.length
  const bodyWidth = clamp(barWidth * 0.9, 4, Math.max(4, barWidth - 1))

  ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  ctx.fillStyle = textColor
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  for (let i = 0; i <= 4; i += 1) {
    const price = maxPrice - (priceRange * i / 4)
    const y = geometry.top + (plotHeight * i / 4)
    ctx.fillText(formatPrice(price), geometry.right + 10, y)
  }

  visible.forEach((candle, index) => {
    const x = geometry.left + (barWidth * index) + (barWidth / 2)
    const openY = yForPrice(candle.open)
    const closeY = yForPrice(candle.close)
    const highY = yForPrice(candle.high)
    const lowY = yForPrice(candle.low)
    const positive = candle.close >= candle.open
    ctx.strokeStyle = positive ? upColor : downColor
    ctx.fillStyle = positive ? upColor : downColor
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, highY)
    ctx.lineTo(x, lowY)
    ctx.stroke()
    const bodyTop = Math.min(openY, closeY)
    const bodyHeight = Math.max(Math.abs(closeY - openY), 1.2)
    ctx.fillRect(x - (bodyWidth / 2), bodyTop, bodyWidth, bodyHeight)
    if (positive && !dark) {
      ctx.strokeStyle = 'rgba(0,0,0,0.42)'
      ctx.strokeRect(x - (bodyWidth / 2), bodyTop, bodyWidth, bodyHeight)
    }
  })

  const labelStep = Math.max(1, Math.ceil(visible.length / 4))
  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  visible.forEach((candle, index) => {
    if (index % labelStep !== 0 && index !== visible.length - 1) return
    const x = geometry.left + (barWidth * index) + (barWidth / 2)
    ctx.fillText(formatCandleTime(candle.time), x, geometry.bottom + 12)
  })

  if (chartCrosshair.value && hoveredCandle.value) {
    ctx.save()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.34)'
    ctx.beginPath()
    ctx.moveTo(chartCrosshair.value.x, geometry.top)
    ctx.lineTo(chartCrosshair.value.x, geometry.bottom)
    ctx.moveTo(geometry.left, chartCrosshair.value.y)
    ctx.lineTo(geometry.right, chartCrosshair.value.y)
    ctx.stroke()
    ctx.restore()
  }
}

const syncHoveredCandle = (event) => {
  const canvas = chartCanvas.value
  const visible = getVisibleCandles()
  if (!canvas || !visible.length) {
    hoveredCandle.value = null
    chartCrosshair.value = null
    return
  }

  const geometry = getChartGeometry(canvas)
  const x = event.clientX - geometry.rect.left
  const y = event.clientY - geometry.rect.top
  const plotWidth = geometry.right - geometry.left
  const insidePlot = x >= geometry.left && x <= geometry.right && y >= geometry.top && y <= geometry.bottom

  if (!insidePlot) {
    hoveredCandle.value = null
    chartCrosshair.value = null
    drawChart()
    return
  }

  const index = clamp(Math.floor(((x - geometry.left) / plotWidth) * visible.length), 0, visible.length - 1)
  hoveredCandle.value = visible[index]
  chartCrosshair.value = { x, y }
  drawChart()
}

const handleChartPointerDown = (event) => {
  if (!generatedChartCandles.value.length) return
  isChartDragging.value = true
  lastChartPointerX.value = event.clientX
  event.currentTarget?.setPointerCapture?.(event.pointerId)
}

const handleChartPointerMove = (event) => {
  const canvas = chartCanvas.value
  const candles = generatedChartCandles.value
  if (isChartDragging.value && canvas && candles.length) {
    const geometry = getChartGeometry(canvas)
    const visibleCount = chartViewport.value.end - chartViewport.value.start
    const candleShift = ((lastChartPointerX.value - event.clientX) / Math.max(1, geometry.right - geometry.left)) * visibleCount
    const maxStart = Math.max(0, candles.length - visibleCount)
    const nextStart = clamp(chartViewport.value.start + candleShift, 0, maxStart)
    chartViewport.value = { start: nextStart, end: nextStart + visibleCount }
    lastChartPointerX.value = event.clientX
  }
  syncHoveredCandle(event)
}

const handleChartPointerUp = (event) => {
  isChartDragging.value = false
  event.currentTarget?.releasePointerCapture?.(event.pointerId)
}

const handleChartPointerLeave = () => {
  isChartDragging.value = false
  hoveredCandle.value = null
  chartCrosshair.value = null
  drawChart()
}

const handleChartWheel = (event) => {
  const canvas = chartCanvas.value
  const candles = generatedChartCandles.value
  if (!canvas || candles.length < 2) return

  const geometry = getChartGeometry(canvas)
  const pointerRatio = clamp((event.clientX - geometry.rect.left - geometry.left) / Math.max(1, geometry.right - geometry.left), 0, 1)
  const currentStart = chartViewport.value.start
  const currentEnd = chartViewport.value.end || candles.length
  const visibleCount = currentEnd - currentStart
  const zoomFactor = event.deltaY > 0 ? 1.18 : 0.82
  const nextVisible = clamp(visibleCount * zoomFactor, 8, candles.length)
  const anchor = currentStart + (visibleCount * pointerRatio)
  const nextStart = clamp(anchor - (nextVisible * pointerRatio), 0, Math.max(0, candles.length - nextVisible))
  chartViewport.value = { start: nextStart, end: nextStart + nextVisible }
  drawChart()
}

const getFieldPlaceholder = (field) => {
  if (field.unit === 'price' && usesForexPriceFormat.value) {
    return ui().placeholders[`forex${field.key.charAt(0).toUpperCase()}${field.key.slice(1)}`]
  }
  return ui().placeholders[field.key]
}

const getFieldUnit = (field) => {
  if (field.unit !== 'price') return ''
  return usesForexPriceFormat.value ? ui().units.forex : ui().units.money
}

const directionPercentKeys = {
  priceDirectionBeforeNews: 'priceDirectionBeforeNewsChangePercent',
  priceDirectionAfterNews: 'priceDirectionAfterNewsChangePercent'
}

const normalizeDirectionPercent = (field, rawValue = tradeStudyMetrics.value[field.key]) => {
  const direction = tradeStudyMetrics.value[field.directionKey]
  if (!direction) {
    tradeStudyMetrics.value[field.key] = ''
    return
  }

  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    tradeStudyMetrics.value[field.key] = ''
    return
  }

  const numericValue = Number(rawValue)
  if (!Number.isFinite(numericValue)) return

  const signedValue = direction === 'up' ? Math.abs(numericValue) : -Math.abs(numericValue)
  tradeStudyMetrics.value[field.key] = String(signedValue)
}

const toggleDirection = (key, value) => {
  if (!tradeStudyMetrics.value.hadNews) return
  tradeStudyMetrics.value[key] = tradeStudyMetrics.value[key] === value ? '' : value
  const percentKey = directionPercentKeys[key]
  if (!percentKey) return

  if (!tradeStudyMetrics.value[key]) {
    tradeStudyMetrics.value[percentKey] = ''
  } else {
    normalizeDirectionPercent({ key: percentKey, directionKey: key })
  }
}

const isVectorLocked = (field) => {
  if (field.key === 'priceDroppedBelowEntryLong') return side.value !== 'long'
  if (field.key === 'priceRoseAboveEntryShort') return side.value !== 'short'
  return false
}

const clearDurationGroup = (group) => {
  group?.fields.forEach(field => {
    tradeStudyMetrics.value[field.key] = ''
  })
}

const toggleBoolean = (field) => {
  if (isVectorLocked(field)) return
  tradeStudyMetrics.value[field.key] = !tradeStudyMetrics.value[field.key]
  if (!tradeStudyMetrics.value[field.key]) clearDurationGroup(durationFieldGroups[field.key])
  if (field.key === 'hadNews' && !tradeStudyMetrics.value.hadNews) {
    tradeStudyMetrics.value.priceDirectionBeforeNews = ''
    tradeStudyMetrics.value.priceDirectionBeforeNewsChangePercent = ''
    tradeStudyMetrics.value.priceDirectionAfterNews = ''
    tradeStudyMetrics.value.priceDirectionAfterNewsChangePercent = ''
  }
}

const shouldShowDuration = (field) => {
  return Boolean(durationFieldGroups[field.key] && tradeStudyMetrics.value[field.key] && !isVectorLocked(field))
}

const shouldShowDirectionPercent = (field) => {
  return Boolean(field.type === 'directionPercent' && tradeStudyMetrics.value.hadNews && tradeStudyMetrics.value[field.directionKey])
}

const visibleFields = (fields) => {
  return fields.filter(field => field.type !== 'directionPercent' || shouldShowDirectionPercent(field))
}

watch(side, (vector) => {
  if (vector === 'long') {
    tradeStudyMetrics.value.priceRoseAboveEntryShort = false
    clearDurationGroup(durationFieldGroups.priceRoseAboveEntryShort)
  } else {
    tradeStudyMetrics.value.priceDroppedBelowEntryLong = false
    clearDurationGroup(durationFieldGroups.priceDroppedBelowEntryLong)
  }
}, { immediate: true })

watch([generatedChartCandles, activeGeneratedTimeframe], async () => {
  resetChartViewport()
  await nextTick()
  drawChart()
})

watch(showTradeStudyMetrics, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  if (resizeObserver && chartCanvas.value) resizeObserver.observe(chartCanvas.value)
  drawChart()
})

watch([() => isDark?.value, locale], () => drawChart())

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => drawChart())
    if (chartCanvas.value) resizeObserver.observe(chartCanvas.value)
  }
  window.addEventListener('resize', drawChart)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect?.()
  window.removeEventListener('resize', drawChart)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="nier-fade">
      <div
        v-if="showTradeStudyMetrics"
        class="fixed inset-0 z-[10006] flex items-center justify-center bg-black/20 p-6 backdrop-blur-md"
        @click.self="showTradeStudyMetrics = false"
      >
        <ExPanel
          variant="light"
          :show-corners="true"
          :no-padding="true"
          :no-shadow="true"
          class="max-h-[84vh] w-full max-w-6xl !border-black/20 dark:!border-white/20"
        >
          <div class="flex items-center justify-between border-b border-black/10 bg-white/10 px-6 py-4 dark:border-white/10 dark:bg-black/20">
            <div class="flex min-w-0 flex-col gap-1">
              <span class="text-[10px] font-black uppercase tracking-[0.5em] nier-text-primary">{{ ui().title }}</span>
              <span class="text-[8px] font-mono uppercase tracking-[0.28em] text-black/40 dark:text-white/35">{{ ui().subtitle }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="border border-black/15 px-4 py-2 text-[8px] font-black uppercase tracking-[0.35em] nier-text-primary transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:hover:bg-white dark:hover:text-black"
                :disabled="commitState === 'loading'"
                @click="resetTradeStudyMetrics"
              >
                {{ ui().reset }}
              </button>
            </div>
          </div>

          <div class="max-h-[calc(84vh-128px)] overflow-y-auto custom-scrollbar p-7">
            <section v-if="activeStudyPage === 'market'" class="min-h-[520px]">
              <div v-if="!generatedChartCandles.length" class="flex min-h-[500px] flex-col items-center justify-center px-4 text-center">
                <p class="mb-5 max-w-xl text-[8px] font-mono font-bold uppercase leading-loose tracking-[0.22em] text-black/35 dark:text-white/35">
                  {{ generationError ? `${ui().apiError} ${generationError}` : ui().warning }}
                </p>
                <button
                  type="button"
                  class="h-14 border border-black/25 px-8 text-[10px] font-mono font-black uppercase tracking-[0.28em] nier-text-primary transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/25 dark:hover:bg-white dark:hover:text-black"
                  :disabled="!canGenerateMarketData"
                  @click="generateMarketData"
                >
                  {{ generationState === 'loading' ? ui().generating : (locale === 'ru' ? 'СГЕНЕРИРОВАТЬ ГРАФИК' : 'GENERATE CHART') }}
                </button>
              </div>

              <div v-else class="border border-black/10 bg-black/[0.92] dark:border-white/10">
                <div class="flex items-center justify-end border-b border-white/10 px-4 py-3">
                  <div class="grid grid-cols-3 gap-1.5">
                    <button
                      v-for="timeframe in timeframeOptions"
                      :key="timeframe.id"
                      type="button"
                      class="h-8 border px-2.5 text-[7px] font-mono font-black uppercase tracking-[0.14em] transition-colors"
                      :class="activeGeneratedTimeframe === timeframe.id
                        ? 'border-white bg-white text-black'
                        : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'"
                      @click="activeGeneratedTimeframe = timeframe.id"
                    >
                      {{ timeframe.label }}
                    </button>
                  </div>
                </div>

                <div class="relative h-[500px] min-h-[380px]">
                  <canvas
                    ref="chartCanvas"
                    class="h-full w-full cursor-crosshair touch-none"
                    @pointerdown="handleChartPointerDown"
                    @pointermove="handleChartPointerMove"
                    @pointerup="handleChartPointerUp"
                    @pointercancel="handleChartPointerUp"
                    @pointerleave="handleChartPointerLeave"
                    @wheel.prevent="handleChartWheel"
                  ></canvas>

                  <div
                    v-if="hoveredCandle"
                    class="pointer-events-none absolute right-4 top-4 w-44 border border-white/10 bg-black/85 p-3 shadow-sm backdrop-blur"
                  >
                    <span class="block truncate text-[8px] font-mono font-black uppercase tracking-[0.24em] text-white/35">
                      {{ formatCandleTime(hoveredCandle.time) }}
                    </span>
                    <div class="mt-3 grid grid-cols-2 gap-2 text-[9px] font-mono uppercase tracking-[0.14em]">
                      <span class="text-white/35">{{ ui().ohlc.open }}</span>
                      <span class="text-right font-black text-white">{{ formatPrice(hoveredCandle.open) }}</span>
                      <span class="text-white/35">{{ ui().ohlc.high }}</span>
                      <span class="text-right font-black text-white">{{ formatPrice(hoveredCandle.high) }}</span>
                      <span class="text-white/35">{{ ui().ohlc.low }}</span>
                      <span class="text-right font-black text-white">{{ formatPrice(hoveredCandle.low) }}</span>
                      <span class="text-white/35">{{ ui().ohlc.close }}</span>
                      <span class="text-right font-black text-white">{{ formatPrice(hoveredCandle.close) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div v-else class="grid grid-cols-1 gap-6">
              <section
                v-for="group in groups"
                :key="group.id"
                class="border border-black/10 bg-white/[0.03] p-5 dark:border-white/10 dark:bg-black/[0.08]"
              >
                <div class="mb-5 flex items-center gap-3">
                  <div class="h-1.5 w-1.5 rotate-45 nier-bg-inverted"></div>
                  <span class="text-[8px] font-black uppercase tracking-[0.42em] nier-text-primary">{{ ui().groups[group.id] }}</span>
                </div>

                <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div
                    v-for="(fieldColumn, columnIndex) in splitFields(group.fields)"
                    :key="`${group.id}-${columnIndex}`"
                    class="flex min-w-0 flex-col gap-4 border-black/10 dark:border-white/10"
                    :class="columnIndex === 1 ? 'lg:border-l lg:pl-5' : ''"
                  >
                    <label
                      v-for="field in visibleFields(fieldColumn)"
                      :key="field.key"
                      class="relative flex min-w-0 flex-col gap-2"
                    >
                      <span class="min-h-[20px] text-[8px] font-bold uppercase leading-relaxed tracking-[0.18em] text-black/50 dark:text-white/40">{{ ui().fields[field.key] }}</span>

                      <button
                        v-if="field.type === 'boolean'"
                        type="button"
                        class="flex h-14 items-center justify-between border px-4 text-[11px] font-mono font-black uppercase tracking-[0.25em] transition-colors"
                        :class="[
                          isVectorLocked(field)
                            ? 'cursor-not-allowed border-black/5 bg-black/[0.02] text-black/20 dark:border-white/5 dark:text-white/15'
                            : 'border-black/15 bg-transparent nier-text-primary hover:border-black/40 dark:border-white/15 dark:hover:border-white/40'
                        ]"
                        :disabled="isVectorLocked(field)"
                        @click="toggleBoolean(field)"
                      >
                        <span>{{ tradeStudyMetrics[field.key] ? ui().boolOn : ui().boolOff }}</span>
                        <span class="grid h-4 w-4 place-items-center border border-black/30 dark:border-white/35">
                          <span v-if="tradeStudyMetrics[field.key]" class="h-2 w-1 rotate-45 border-b-2 border-r-2 border-current"></span>
                        </span>
                      </button>

                      <div v-if="shouldShowDuration(field)" class="border border-black/10 p-3 dark:border-white/10">
                        <span class="mb-3 block text-[7px] font-black uppercase tracking-[0.22em] text-black/35 dark:text-white/30">{{ ui().duration[durationFieldGroups[field.key].titleKey] }}</span>
                        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <label
                            v-for="durationField in durationFieldGroups[field.key].fields"
                            :key="durationField.key"
                            class="flex min-w-0 flex-col gap-1"
                          >
                            <span class="text-[7px] font-bold uppercase tracking-[0.16em] text-black/35 dark:text-white/30">{{ ui().duration[durationField.unitKey] }}</span>
                            <input
                              v-model="tradeStudyMetrics[durationField.key]"
                              type="number"
                              min="0"
                              step="1"
                              :placeholder="ui().placeholders[durationField.placeholderKey]"
                              class="h-10 min-w-0 border border-black/15 bg-transparent px-3 text-[12px] font-mono outline-none transition-colors placeholder:text-[9px] placeholder:tracking-[0.14em] placeholder:text-black/25 focus:border-black dark:border-white/15 dark:placeholder:text-white/20 dark:focus:border-white"
                            />
                          </label>
                        </div>
                      </div>

                      <div v-else-if="field.type === 'direction'" class="grid grid-cols-2 gap-2">
                        <button
                          v-for="option in ['up', 'down']"
                          :key="`${field.key}-${option}`"
                          type="button"
                          class="flex h-14 items-center justify-center border px-3 text-[10px] font-mono font-black uppercase tracking-[0.2em] transition-colors"
                          :class="[
                            !tradeStudyMetrics.hadNews
                              ? 'cursor-not-allowed border-black/5 bg-black/[0.02] text-black/20 dark:border-white/5 dark:text-white/15'
                              : tradeStudyMetrics[field.key] === option
                                ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                : 'border-black/15 bg-transparent nier-text-primary hover:border-black/40 dark:border-white/15 dark:hover:border-white/40'
                          ]"
                          :disabled="!tradeStudyMetrics.hadNews"
                          @click="toggleDirection(field.key, option)"
                        >
                          {{ option === 'up' ? ui().directionUp : ui().directionDown }}
                        </button>
                      </div>

                      <input
                        v-else-if="shouldShowDirectionPercent(field)"
                        v-model="tradeStudyMetrics[field.key]"
                        type="number"
                        step="any"
                        :min="tradeStudyMetrics[field.directionKey] === 'up' ? 0 : undefined"
                        :max="tradeStudyMetrics[field.directionKey] === 'down' ? 0 : undefined"
                        :placeholder="ui().placeholders.percentMove"
                        @input="normalizeDirectionPercent(field, $event.target.value)"
                        @blur="normalizeDirectionPercent(field)"
                        class="h-14 min-w-0 border border-black/15 bg-transparent px-4 text-[13px] font-mono outline-none transition-colors placeholder:text-[10px] placeholder:tracking-[0.16em] placeholder:text-black/25 focus:border-black dark:border-white/15 dark:placeholder:text-white/20 dark:focus:border-white"
                      />

                      <input
                        v-else-if="field.type === 'number'"
                        v-model="tradeStudyMetrics[field.key]"
                        type="number"
                        step="any"
                        :placeholder="getFieldPlaceholder(field)"
                        class="h-14 min-w-0 border border-black/15 bg-transparent px-4 text-[13px] font-mono outline-none transition-colors placeholder:text-[10px] placeholder:tracking-[0.16em] placeholder:text-black/25 focus:border-black dark:border-white/15 dark:placeholder:text-white/20 dark:focus:border-white"
                        :class="field.unit === 'price' ? 'pr-24' : ''"
                      />
                      <span
                        v-if="getFieldUnit(field)"
                        class="pointer-events-none absolute bottom-0 right-3 flex h-14 items-center text-[8px] font-black uppercase tracking-[0.22em] text-black/35 dark:text-white/30"
                      >
                        {{ getFieldUnit(field) }}
                      </span>
                    </label>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div class="flex items-center justify-center border-t border-black/10 bg-white/10 px-6 py-4 dark:border-white/10 dark:bg-black/20">
            <div class="flex items-center gap-2">
              <button
                v-for="page in studyPages"
                :key="page.id"
                type="button"
                class="flex h-10 min-w-10 items-center justify-center border px-4 text-[9px] font-mono font-black uppercase tracking-[0.22em] transition-colors"
                :class="activeStudyPage === page.id
                  ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                  : 'border-black/15 nier-text-primary hover:border-black/40 dark:border-white/15 dark:hover:border-white/40'"
                @click="activeStudyPage = page.id"
              >
                {{ page.number }}
                <span class="ml-3 hidden sm:inline">{{ page.id === 'market' ? ui().pageMarket : ui().pageManual }}</span>
              </button>
            </div>
          </div>
        </ExPanel>
      </div>
    </Transition>
  </Teleport>
</template>
