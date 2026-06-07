import { invoke } from '@tauri-apps/api/core'

export type BinanceMarketScope = 'spot' | 'usdm-futures'

export interface BinanceCredentials {
  apiKey: string
  apiSecret: string
  baseUrl?: string
  futuresBaseUrl?: string
}

export interface BinanceSignedRequestOptions {
  credentials: BinanceCredentials
  market?: BinanceMarketScope
  method?: 'GET' | 'POST' | 'DELETE'
  path: string
  params?: Record<string, string | number | boolean | undefined | null>
}

export interface BinanceSpotTrade {
  id: number
  orderId: number
  symbol: string
  price: string
  qty: string
  quoteQty: string
  commission: string
  commissionAsset: string
  time: number
  isBuyer: boolean
  isMaker: boolean
  isBestMatch: boolean
}

export interface BinanceFuturesTrade {
  id: number
  orderId: number
  symbol: string
  side: 'BUY' | 'SELL'
  price: string
  qty: string
  realizedPnl: string
  marginAsset: string
  quoteQty: string
  commission: string
  commissionAsset: string
  time: number
  positionSide?: string
  maker?: boolean
  buyer?: boolean
}

export const binanceSignedRequest = async <T>({
  credentials,
  market = 'spot',
  method = 'GET',
  path,
  params = {}
}: BinanceSignedRequestOptions): Promise<T> => {
  try {
    const response = await invoke<{ status: number; payload: T }>('binance_signed_request', {
      input: {
        credentials,
        market,
        method,
        path,
        params
      }
    })

    return response.payload
  } catch (error: any) {
    throw new Error(normalizeBinanceError(error))
  }
}

const normalizeBinanceError = (error: unknown) => {
  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : String(error || 'Binance request failed.')

  if (/restricted location|451/i.test(message)) {
    return 'Binance is unavailable from this IP/location. Try Binance.US or another supported connector for this region.'
  }

  if (/timestamp|recvWindow/i.test(message)) {
    return 'Binance rejected the timestamp. Check system clock synchronization and try again.'
  }

  if (/signature/i.test(message)) {
    return 'Binance signature is invalid. Check that the API Secret matches this API Key.'
  }

  if (/api-key|apikey|permission|permissions/i.test(message)) {
    return 'Binance API key is invalid or missing read permissions.'
  }

  return message
}

export const testBinanceConnection = async (credentials: BinanceCredentials) => {
  return binanceSignedRequest<any>({
    credentials,
    market: 'spot',
    path: '/api/v3/account'
  })
}

export const getBinanceSpotTrades = async (
  credentials: BinanceCredentials,
  params: {
    symbol: string
    orderId?: number
    startTime?: number
    endTime?: number
    fromId?: number
    limit?: number
  }
) => {
  return binanceSignedRequest<BinanceSpotTrade[]>({
    credentials,
    market: 'spot',
    path: '/api/v3/myTrades',
    params: {
      ...params,
      limit: params.limit || 1000
    }
  })
}

export const getBinanceUsdMFuturesTrades = async (
  credentials: BinanceCredentials,
  params: {
    symbol?: string
    orderId?: number
    startTime?: number
    endTime?: number
    fromId?: number
    limit?: number
  } = {}
) => {
  return binanceSignedRequest<BinanceFuturesTrade[]>({
    credentials,
    market: 'usdm-futures',
    path: '/fapi/v1/userTrades',
    params: {
      ...params,
      limit: params.limit || 1000
    }
  })
}
