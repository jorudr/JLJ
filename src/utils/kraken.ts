import { invoke } from '@tauri-apps/api/core'

export interface KrakenCredentials {
  apiKey: string
  apiSecret: string
  baseUrl?: string
}

export interface KrakenSignedRequestOptions {
  credentials: KrakenCredentials
  path: string
  params?: Record<string, string | number | boolean | undefined | null>
}

export interface KrakenTrade {
  ordertxid: string
  postxid?: string
  pair: string
  time: number
  type: 'buy' | 'sell'
  ordertype: string
  price: string
  cost: string
  fee: string
  vol: string
  margin?: string
  misc?: string
  ledgers?: string
}

export interface KrakenFuturesFill {
  fill_id: string
  symbol: string
  side: 'buy' | 'sell'
  order_id: string
  size: number | string
  price: number | string
  fillTime?: string
  fill_time?: string
  time?: number | string
  timestamp?: number | string
  lastUpdateTimestamp?: string
  fillType?: string
  fee?: number | string
  feePaid?: number | string
  feeCurrency?: string
  pnl?: number | string
}

export interface KrakenTradesHistoryResult {
  trades: Record<string, KrakenTrade>
  count: number
}

export const krakenSignedRequest = async <T>({
  credentials,
  path,
  params = {}
}: KrakenSignedRequestOptions): Promise<T> => {
  try {
    const response = await invoke<{ status: number; payload: { result: T } }>('kraken_signed_request', {
      input: {
        credentials,
        path,
        params
      }
    })

    return response.payload.result
  } catch (error: any) {
    throw new Error(normalizeKrakenError(error))
  }
}

export const krakenFuturesSignedRequest = async <T>({
  credentials,
  path,
  params = {}
}: KrakenSignedRequestOptions): Promise<T> => {
  try {
    const response = await invoke<{ status: number; payload: T }>('kraken_futures_signed_request', {
      input: {
        credentials,
        path,
        params
      }
    })

    return response.payload
  } catch (error: any) {
    throw new Error(normalizeKrakenError(error))
  }
}

const normalizeKrakenError = (error: unknown) => {
  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : String(error || 'Kraken request failed.')

  if (/nonce/i.test(message)) {
    return 'Kraken rejected the nonce. Check system clock synchronization and try again.'
  }

  if (/authentication|authent|api_key|apikey|unauthorized/i.test(message)) {
    return 'Kraken rejected authentication. Check that this is the correct Kraken Spot/Futures key type and that the private key was pasted exactly.'
  }

  if (/signature|base64|secret/i.test(message)) {
    return 'Kraken signature is invalid. Check that the API Secret is the private key from Kraken.'
  }

  if (/key|permission|EAPI/i.test(message)) {
    return 'Kraken rejected the API key. Check the key type, read access, and IP restrictions.'
  }

  return message
}

export const testKrakenConnection = async (credentials: KrakenCredentials) => {
  return krakenSignedRequest<Record<string, string>>({
    credentials,
    path: '/0/private/Balance'
  })
}

export const testKrakenFuturesConnection = async (credentials: KrakenCredentials) => {
  return getKrakenFuturesFills(credentials)
}

export const getKrakenFuturesFills = async (
  credentials: KrakenCredentials,
  params: {
    lastFillTime?: string
  } = {}
) => {
  return krakenFuturesSignedRequest<{ result: 'success'; fills: KrakenFuturesFill[] }>({
    credentials,
    path: '/derivatives/api/v3/fills',
    params: {
      ...(params.lastFillTime ? { lastFillTime: params.lastFillTime } : {})
    }
  })
}

export const getKrakenTradesHistory = async (
  credentials: KrakenCredentials,
  params: {
    type?: 'all' | 'any position' | 'closed position' | 'closing position' | 'no position'
    start?: number
    end?: number
    ofs?: number
    trades?: boolean
  } = {}
) => {
  return krakenSignedRequest<KrakenTradesHistoryResult>({
    credentials,
    path: '/0/private/TradesHistory',
    params: {
      type: params.type || 'all',
      ofs: params.ofs || 0,
      ...(params.trades ? { trades: true } : {}),
      ...(params.start ? { start: params.start } : {}),
      ...(params.end ? { end: params.end } : {})
    }
  })
}
