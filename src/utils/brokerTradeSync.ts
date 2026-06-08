import type { DiaryEntry } from '~/entities/diary/model/diary.types'
import {
  getBybitClosedTrades,
  getBybitOrderHistory,
  type BybitClosedPnl,
  type BybitHistoricOrder
} from '~/utils/bybit'
import {
  getKrakenFuturesFills,
  getKrakenTradesHistory,
  type KrakenFuturesFill,
  type KrakenTrade
} from '~/utils/kraken'
import { resolveImportedAsset } from '~/utils/assetResolver'

export interface StoredBrokerConnection {
  brokerId: string
  credentials: Record<string, string>
  active: boolean
  updatedAt: string
  activatedAt?: string
}

export interface BrokerTradeStorePort {
  init: () => Promise<void>
  getAllTradesForStrategy: (strategyId: string) => DiaryEntry[]
  addTrade: (strategyId: string, trade: DiaryEntry) => Promise<void>
  updateTrade?: (strategyId: string, tradeId: string, updates: Partial<DiaryEntry>) => Promise<void>
}

export interface BrokerSyncResult {
  importedCount: number
  duplicateCount: number
  checkedCount: number
  sourceLabel: string
}

type ImportedTrade = DiaryEntry & { sourceExternalId: string; sourcePlatform: string }

export const isSyncableBrokerConnection = (connection?: StoredBrokerConnection | null) => {
  return Boolean(connection?.active && ['bybit', 'kraken'].includes(connection.brokerId))
}

export const syncBrokerConnectionTrades = async (
  connection: StoredBrokerConnection,
  strategyId: string,
  tradeStore: BrokerTradeStorePort
): Promise<BrokerSyncResult> => {
  if (connection.brokerId === 'bybit') {
    return syncBybit(connection, strategyId, tradeStore)
  }

  if (connection.brokerId === 'kraken') {
    return connection.credentials.market === 'futures'
      ? syncKrakenFutures(connection, strategyId, tradeStore)
      : syncKrakenSpot(connection, strategyId, tradeStore)
  }

  throw new Error('This connector does not support direct trade sync yet.')
}

const syncBybit = async (
  connection: StoredBrokerConnection,
  strategyId: string,
  tradeStore: BrokerTradeStorePort
): Promise<BrokerSyncResult> => {
  const credentials = {
    apiKey: connection.credentials.apiKey || '',
    apiSecret: connection.credentials.apiSecret || ''
  }
  const [spotResponse, linearResponse, inverseResponse] = await Promise.allSettled([
    getBybitOrderHistory(credentials, { category: 'spot', limit: 50 }),
    getBybitClosedTrades(credentials, { category: 'linear', limit: 100 }),
    getBybitClosedTrades(credentials, { category: 'inverse', limit: 100 })
  ])

  const spotTrades = spotResponse.status === 'fulfilled' ? (spotResponse.value.list || []) : []
  const linearTrades = linearResponse.status === 'fulfilled' ? (linearResponse.value.list || []) : []
  const inverseTrades = inverseResponse.status === 'fulfilled' ? (inverseResponse.value.list || []) : []

  if (![spotResponse, linearResponse, inverseResponse].some(item => item.status === 'fulfilled')) {
    const firstError = [spotResponse, linearResponse, inverseResponse].find(item => item.status === 'rejected') as PromiseRejectedResult | undefined
    throw new Error(firstError?.reason?.message || 'Bybit trade sync failed.')
  }

  const importedTrades = [
    ...buildBybitSpotRoundTrips(spotTrades),
    ...buildBybitDerivativeTrades([
      ...linearTrades.map(trade => ({ ...trade, market: 'linear' as const })),
      ...inverseTrades.map(trade => ({ ...trade, market: 'inverse' as const }))
    ])
  ]
  const result = await importDedupedTrades(importedTrades, strategyId, tradeStore)

  return {
    ...result,
    checkedCount: spotTrades.length + linearTrades.length + inverseTrades.length,
    sourceLabel: 'Bybit'
  }
}

const syncKrakenSpot = async (
  connection: StoredBrokerConnection,
  strategyId: string,
  tradeStore: BrokerTradeStorePort
): Promise<BrokerSyncResult> => {
  const response = await getKrakenTradesHistory({
    apiKey: connection.credentials.apiKey || '',
    apiSecret: connection.credentials.apiSecret || ''
  }, { type: 'all', trades: false })
  const fills = Object.entries(response.trades || {}).map(([tradeId, trade]) => ({ ...trade, tradeId }))
  console.log('[BrokerSync][Kraken][Spot] Raw response:', response)
  console.log('[BrokerSync][Kraken][Spot] Parsed fills:', fills)
  const result = await importDedupedTrades(buildKrakenSpotRoundTrips(fills), strategyId, tradeStore)
  console.log('[BrokerSync][Kraken][Spot] Imported round trips:', result)

  return {
    ...result,
    checkedCount: fills.length,
    sourceLabel: 'Kraken Spot'
  }
}

const syncKrakenFutures = async (
  connection: StoredBrokerConnection,
  strategyId: string,
  tradeStore: BrokerTradeStorePort
): Promise<BrokerSyncResult> => {
  const response = await getKrakenFuturesFills({
    apiKey: connection.credentials.apiKey || '',
    apiSecret: connection.credentials.apiSecret || ''
  })
  const fills = response.fills || []
  console.log('[BrokerSync][Kraken][Futures] Raw response:', response)
  console.log('[BrokerSync][Kraken][Futures] Parsed fills:', fills)
  const roundTrips = buildKrakenFuturesRoundTrips(fills)
  console.log('[BrokerSync][Kraken][Futures] Prepared round trips:', roundTrips.map(trade => ({
    id: trade.id,
    sourceExternalId: trade.sourceExternalId,
    date: trade.date instanceof Date ? trade.date.toISOString() : trade.date,
    dateExit: trade.dateExit instanceof Date ? trade.dateExit.toISOString() : trade.dateExit,
    localDateExit: trade.dateExit instanceof Date ? trade.dateExit.toLocaleString() : String(trade.dateExit)
  })))
  const result = await importDedupedTrades(roundTrips, strategyId, tradeStore)
  console.log('[BrokerSync][Kraken][Futures] Imported round trips:', result)

  return {
    ...result,
    checkedCount: fills.length,
    sourceLabel: 'Kraken Futures'
  }
}

const importDedupedTrades = async (
  trades: ImportedTrade[],
  strategyId: string,
  tradeStore: BrokerTradeStorePort
) => {
  await tradeStore.init()
  const existingTrades = tradeStore.getAllTradesForStrategy(strategyId)
  const existingBySourceId = new Map(existingTrades
    .map(trade => [((trade as DiaryEntry & { sourceExternalId?: string }).sourceExternalId || ''), trade] as const)
    .filter(([sourceId]) => Boolean(sourceId)))

  let importedCount = 0
  let duplicateCount = 0

  for (const trade of trades) {
    const existingTrade = existingBySourceId.get(trade.sourceExternalId)
    if (existingTrade) {
      if (existingTrade.id && tradeStore.updateTrade) {
        await tradeStore.updateTrade(strategyId, existingTrade.id, trade)
      }
      duplicateCount++
      continue
    }

    await tradeStore.addTrade(strategyId, trade)
    existingBySourceId.set(trade.sourceExternalId, trade)
    importedCount++
  }

  return { importedCount, duplicateCount }
}

const buildBybitDerivativeTrades = (trades: Array<BybitClosedPnl & { market: 'linear' | 'inverse' }>) => {
  return trades
    .filter(trade => trade.orderId)
    .map((trade) => {
      const side = trade.side === 'Sell' ? 'Long' : 'Short'
      const resolvedAsset = resolveImportedAsset(trade.symbol, 'crypto-broker')
      const profit = Number(trade.closedPnl) || 0

      return {
        id: `bybit-${trade.market}-${trade.orderId}`,
        date: new Date(Number(trade.createdTime)),
        dateExit: new Date(Number(trade.updatedTime || trade.createdTime)),
        asset: resolvedAsset.symbol,
        side,
        entry: Number(trade.avgEntryPrice),
        exit: Number(trade.avgExitPrice),
        size: Number(trade.closedSize),
        entryFee: Number(trade.openFee || 0) || 0,
        exitFee: Number(trade.closeFee || 0) || 0,
        feeType: 'Fixed',
        currency: 'USDT',
        assetType: resolvedAsset.assetType,
        assetIcon: resolvedAsset.assetIcon,
        profitInCurrency: profit,
        result: profit,
        notes: `Imported from Bybit ${trade.market} closed pnl.\nOrderId: ${trade.orderId}\nLeverage: ${trade.leverage}\nFillCount: ${trade.fillCount}\nAssetMatch: ${resolvedAsset.matchSource || 'none'}`,
        source: 'bybit',
        sourceExternalId: `${trade.market}:${trade.orderId}`,
        sourcePlatform: 'Bybit V5'
      } as ImportedTrade
    })
}

const buildBybitSpotRoundTrips = (orders: BybitHistoricOrder[]) => {
  const fills = orders
    .filter(order => /Filled|PartiallyFilledCancelled/i.test(String(order.orderStatus || '')))
    .map(order => {
      const qty = Number(order.cumExecQty || 0)
      const value = Number(order.cumExecValue || 0)
      const avgPrice = Number(order.avgPrice || 0) || (qty > 0 ? value / qty : 0)
      return {
        id: order.orderId,
        symbol: String(order.symbol || '').toUpperCase(),
        side: order.side.toLowerCase() as 'buy' | 'sell',
        qty,
        price: avgPrice,
        fee: readBybitSpotFee(order),
        timestamp: Number(order.updatedTime || order.createdTime || 0),
        rawLabel: order.orderId
      }
    })
    .filter(fill => fill.symbol && fill.qty > 0 && fill.price > 0 && Number.isFinite(fill.timestamp))

  return buildLongSpotRoundTrips(fills, 'Bybit V5 Spot', 'bybit', 'spot-close')
}

const buildKrakenSpotRoundTrips = (fills: Array<KrakenTrade & { tradeId: string }>) => {
  const normalized = fills
    .map(fill => {
      const qty = Number(fill.vol || 0)
      const cost = Number(fill.cost || 0)
      const price = Number(fill.price || 0) || (qty > 0 ? cost / qty : 0)
      return {
        id: fill.tradeId,
        symbol: normalizeKrakenPair(fill.pair),
        side: fill.type,
        qty,
        price,
        fee: Number(fill.fee || 0) || 0,
        timestamp: parseKrakenSpotTimestamp(fill.time),
        rawLabel: fill.tradeId
      }
    })
    .filter(fill => fill.symbol && fill.qty > 0 && fill.price > 0)

  return buildLongSpotRoundTrips(normalized, 'Kraken Spot', 'kraken', 'spot-close')
}

const buildLongSpotRoundTrips = (
  fills: Array<{ id: string | number; symbol: string; side: 'buy' | 'sell'; qty: number; price: number; fee: number; timestamp: number; rawLabel: string | number }>,
  platform: string,
  source: string,
  externalPrefix: string
) => {
  type OpenLot = { id: string | number; date: Date; remainingQty: number; price: number; fee: number }
  const epsilon = 1e-10
  const openLotsBySymbol = new Map<string, OpenLot[]>()
  const roundTrips: ImportedTrade[] = []

  fills.sort((left, right) => left.timestamp - right.timestamp).forEach((fill) => {
    const lots = openLotsBySymbol.get(fill.symbol) || []
    if (fill.side === 'buy') {
      lots.push({ id: fill.id, date: new Date(fill.timestamp), remainingQty: fill.qty, price: fill.price, fee: fill.fee })
      openLotsBySymbol.set(fill.symbol, lots)
      return
    }

    let remainingSellQty = fill.qty
    let consumedQty = 0
    let entryCost = 0
    let allocatedEntryFee = 0
    let firstEntryDate: Date | null = null
    const consumedIds: Array<string | number> = []

    while (remainingSellQty > epsilon && lots.length) {
      const currentLot = lots[0]!
      const matchedQty = Math.min(currentLot.remainingQty, remainingSellQty)
      const lotShare = matchedQty / currentLot.remainingQty
      firstEntryDate ||= currentLot.date
      consumedQty += matchedQty
      entryCost += matchedQty * currentLot.price
      allocatedEntryFee += currentLot.fee * lotShare
      consumedIds.push(currentLot.id)
      currentLot.remainingQty -= matchedQty
      currentLot.fee -= currentLot.fee * lotShare
      remainingSellQty -= matchedQty
      if (currentLot.remainingQty <= epsilon) lots.shift()
    }

    if (consumedQty <= epsilon || !firstEntryDate) {
      openLotsBySymbol.set(fill.symbol, lots)
      return
    }

    const exitFee = fill.fee * (consumedQty / fill.qty)
    const profit = (consumedQty * fill.price) - entryCost - allocatedEntryFee - exitFee
    const resolvedAsset = resolveImportedAsset(fill.symbol, 'crypto-broker')
    roundTrips.push({
      id: `${source}-${externalPrefix}-${fill.id}`,
      date: firstEntryDate,
      dateExit: new Date(fill.timestamp),
      asset: resolvedAsset.symbol,
      side: 'Long',
      entry: entryCost / consumedQty,
      exit: fill.price,
      size: consumedQty,
      entryFee: allocatedEntryFee,
      exitFee,
      feeType: 'Fixed',
      currency: inferQuoteCurrency(fill.symbol),
      assetType: resolvedAsset.assetType,
      assetIcon: resolvedAsset.assetIcon,
      profitInCurrency: profit,
      result: profit,
      notes: `Imported from ${platform} round trip.\nOpenFills: ${consumedIds.join(', ')}\nCloseFill: ${fill.rawLabel}\nAssetMatch: ${resolvedAsset.matchSource || 'none'}`,
      source,
      sourceExternalId: `${externalPrefix}:${fill.id}`,
      sourcePlatform: platform
    } as ImportedTrade)

    openLotsBySymbol.set(fill.symbol, lots)
  })

  return roundTrips
}

const buildKrakenFuturesRoundTrips = (fills: KrakenFuturesFill[]) => {
  type OpenLot = { fillId: string; side: 'Long' | 'Short'; date: Date; remainingQty: number; price: number; fee: number }
  const epsilon = 1e-10
  const openLotsBySymbol = new Map<string, OpenLot[]>()
  const roundTrips: ImportedTrade[] = []

  fills
    .map(fill => ({
      ...fill,
      symbol: normalizeKrakenFuturesSymbol(fill.symbol),
      qty: Number(fill.size || 0),
      priceNum: Number(fill.price || 0),
      feeNum: Number(fill.fee ?? fill.feePaid ?? 0) || 0,
      timestamp: parseKrakenFuturesTimestamp(readKrakenFuturesFillTimestamp(fill))
    }))
    .filter(fill => fill.symbol && fill.qty > epsilon && fill.priceNum > epsilon && Number.isFinite(fill.timestamp))
    .sort((left, right) => left.timestamp - right.timestamp)
    .forEach((fill) => {
      const lots = openLotsBySymbol.get(fill.symbol) || []
      const closingSide = fill.side === 'buy' ? 'Short' : 'Long'
      const openingSide = fill.side === 'buy' ? 'Long' : 'Short'
      let remainingQty = fill.qty
      let consumedQty = 0
      let entryCost = 0
      let allocatedEntryFee = 0
      let firstEntryDate: Date | null = null
      const consumedFillIds: string[] = []

      while (remainingQty > epsilon && lots.length && lots[0]?.side === closingSide) {
        const currentLot = lots[0]!
        const matchedQty = Math.min(currentLot.remainingQty, remainingQty)
        const lotShare = matchedQty / currentLot.remainingQty
        firstEntryDate ||= currentLot.date
        consumedQty += matchedQty
        entryCost += matchedQty * currentLot.price
        allocatedEntryFee += currentLot.fee * lotShare
        consumedFillIds.push(currentLot.fillId)
        currentLot.remainingQty -= matchedQty
        currentLot.fee -= currentLot.fee * lotShare
        remainingQty -= matchedQty
        if (currentLot.remainingQty <= epsilon) lots.shift()
      }

      if (consumedQty > epsilon && firstEntryDate) {
        const exitFee = fill.feeNum * (consumedQty / fill.qty)
        const profit = closingSide === 'Long'
          ? (fill.priceNum * consumedQty) - entryCost - allocatedEntryFee - exitFee
          : entryCost - (fill.priceNum * consumedQty) - allocatedEntryFee - exitFee
        const resolvedAsset = resolveImportedAsset(fill.symbol, 'crypto-broker')
        roundTrips.push({
          id: `kraken-futures-close-${fill.fill_id}`,
          date: firstEntryDate,
          dateExit: new Date(fill.timestamp),
          asset: resolvedAsset.symbol,
          side: closingSide,
          entry: entryCost / consumedQty,
          exit: fill.priceNum,
          size: consumedQty,
          entryFee: allocatedEntryFee,
          exitFee,
          feeType: 'Fixed',
          currency: inferQuoteCurrency(fill.symbol),
          assetType: resolvedAsset.assetType,
          assetIcon: resolvedAsset.assetIcon,
          profitInCurrency: profit,
          result: profit,
          notes: `Imported from Kraken Futures.\nOpenFills: ${consumedFillIds.join(', ')}\nCloseFill: ${fill.fill_id}\nOrderId: ${fill.order_id}\nSymbol: ${fill.symbol}\nCloseTimeRaw: ${readKrakenFuturesFillTimestamp(fill) || 'unknown'}\nFillType: ${fill.fillType || 'unknown'}\nAssetMatch: ${resolvedAsset.matchSource || 'none'}`,
          source: 'kraken-futures',
          sourceExternalId: `futures-close:${fill.fill_id}`,
          sourcePlatform: 'Kraken Futures'
        } as ImportedTrade)
      }

      if (remainingQty > epsilon) {
        lots.push({
          fillId: fill.fill_id,
          side: openingSide,
          date: new Date(fill.timestamp),
          remainingQty,
          price: fill.priceNum,
          fee: fill.feeNum * (remainingQty / fill.qty)
        })
      }

      openLotsBySymbol.set(fill.symbol, lots)
    })

  return roundTrips
}

const readBybitSpotFee = (order: BybitHistoricOrder) => {
  const detail = order.cumFeeDetail
  if (detail && typeof detail === 'object') {
    return Object.values(detail)
      .map(value => Number(value || 0))
      .filter(Number.isFinite)
      .reduce((sum, value) => sum + value, 0)
  }

  return Number(order.cumExecFee || 0) || 0
}

const normalizeKrakenPair = (pair: string) => {
  return String(pair || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^XXBT/, 'BTC')
    .replace(/^XBT/, 'BTC')
    .replace(/^XETH/, 'ETH')
    .replace(/^X(?=[A-Z0-9]{3,})/, '')
    .replace(/^Z(?=[A-Z0-9]{3,})/, '')
    .replace(/XXBT$/, 'BTC')
    .replace(/XBT$/, 'BTC')
    .replace(/ZUSD$/, 'USD')
    .replace(/ZEUR$/, 'EUR')
    .replace(/ZGBP$/, 'GBP')
}

const parseKrakenSpotTimestamp = (value: number | string) => {
  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric) || numeric <= 0) return Number.NaN
  return numeric > 1_000_000_000_000 ? numeric : numeric * 1000
}

const readKrakenFuturesFillTimestamp = (fill: KrakenFuturesFill) => {
  const candidates = [fill.fillTime, fill.fill_time, fill.time, fill.timestamp, fill.lastUpdateTimestamp]
    .filter(value => value !== undefined && value !== null && value !== '') as Array<string | number>

  return candidates.find(hasIntradayTimestampPrecision) ?? candidates[0] ?? ''
}

const parseKrakenFuturesTimestamp = (value: string | number) => {
  let str = String(value || '').trim()
  // Append 'Z' to ISO strings missing timezone offset to prevent WebKit parse errors
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    str += 'Z'
  }
  const parsed = Date.parse(str)
  if (Number.isFinite(parsed) && !isNaN(parsed)) return parsed

  const numeric = Number(value || 0)
  if (!Number.isFinite(numeric) || numeric <= 0) return Number.NaN
  return numeric > 1_000_000_000_000 ? numeric : numeric * 1000
}

const hasIntradayTimestampPrecision = (value: string | number) => {
  const numeric = Number(value)
  if (Number.isFinite(numeric) && numeric > 0) return true

  let str = String(value || '').trim()
  // Append 'Z' to ISO strings missing timezone offset to prevent WebKit parse errors
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(str)) {
    str += 'Z'
  }
  
  const parsed = Date.parse(str)
  if (!Number.isFinite(parsed) || isNaN(parsed)) return false

  const date = new Date(parsed)
  return date.getUTCHours() !== 0 || date.getUTCMinutes() !== 0 || date.getUTCSeconds() !== 0 || date.getUTCMilliseconds() !== 0
}

const normalizeKrakenFuturesSymbol = (symbol: string) => {
  const normalized = String(symbol || '').toUpperCase().replace(/[^A-Z0-9_]/g, '')
  return normalized
    .replace(/^PF_/, '')
    .replace(/^FI_/, '')
    .replace(/_[0-9]{6,8}$/, '')
    .replace(/^XBT/, 'BTC')
    .replace(/XBT/, 'BTC')
}

const inferQuoteCurrency = (symbol: string) => {
  const quotes = ['USDT', 'USDC', 'USD', 'EUR', 'GBP', 'BTC', 'ETH']
  return quotes.find(quote => symbol.endsWith(quote)) || 'USD'
}
