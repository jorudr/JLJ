import { invoke } from '@tauri-apps/api/core'

export type BybitEnvironment = 'real' | 'demo'

export const BYBIT_DEMO_BASE_URL = 'https://api-demo.bybit.com'

export interface BybitCredentials {
  apiKey: string
  apiSecret: string
  baseUrl?: string
}

export const withBybitEnvironment = (
  credentials: BybitCredentials,
  environment: BybitEnvironment = 'real'
): BybitCredentials => {
  if (environment !== 'demo') return credentials

  return {
    ...credentials,
    baseUrl: BYBIT_DEMO_BASE_URL
  }
}

export interface BybitSignedRequestOptions {
  credentials: BybitCredentials
  method?: 'GET' | 'POST' | 'DELETE'
  path: string
  params?: Record<string, string | number | boolean | undefined | null>
}

export const bybitSignedRequest = async <T>({
  credentials,
  method = 'GET',
  path,
  params = {}
}: BybitSignedRequestOptions): Promise<T> => {
  try {
    const response = await invoke<{ status: number; payload: { result: T, retMsg: string, retCode: number } }>('bybit_signed_request', {
      input: {
        credentials,
        method,
        path,
        params
      }
    })

    return response.payload.result || response.payload as unknown as T
  } catch (error: any) {
    throw new Error(normalizeBybitError(error))
  }
}

const normalizeBybitError = (error: unknown) => {
  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : String(error || 'Bybit request failed.')

  if (/timestamp|recv_window/i.test(message)) {
    return 'Bybit rejected the timestamp. Check system clock synchronization and try again.'
  }

  if (/signature|sign/i.test(message)) {
    return 'Bybit signature is invalid. Check that the API Secret matches this API Key.'
  }

  if (/api_key|apikey|permission|ip/i.test(message)) {
    return 'Bybit API key is invalid, missing permissions, or restricted by IP.'
  }

  return message
}

export const testBybitConnection = async (credentials: BybitCredentials) => {
  return bybitSignedRequest<any>({
    credentials,
    method: 'GET',
    path: '/v5/user/query-api'
  })
}

export interface BybitClosedPnl {
  symbol: string
  orderId: string
  side: 'Buy' | 'Sell'
  qty: string
  orderPrice: string
  orderType: string
  execType: string
  closedSize: string
  cumEntryValue: string
  avgEntryPrice: string
  cumExitValue: string
  avgExitPrice: string
  closedPnl: string
  fillCount: string
  leverage: string
  openFee?: string
  closeFee?: string
  createdTime: string
  updatedTime: string
}

export interface BybitHistoricOrder {
  orderId: string
  symbol: string
  side: 'Buy' | 'Sell'
  orderStatus: string
  avgPrice: string
  cumExecQty: string
  cumExecValue: string
  cumExecFee?: string
  cumFeeDetail?: Record<string, string> | string
  orderType: string
  createdTime: string
  updatedTime: string
}

export const getBybitClosedTrades = async (
  credentials: BybitCredentials,
  params: {
    category: 'spot' | 'linear' | 'inverse' | 'option'
    symbol?: string
    startTime?: number
    endTime?: number
    limit?: number
    cursor?: string
  }
) => {
  return bybitSignedRequest<{ list: BybitClosedPnl[], nextPageCursor?: string }>({
    credentials,
    method: 'GET',
    path: '/v5/position/closed-pnl',
    params: {
      ...params,
      limit: params.limit || 100
    }
  })
}

export const getBybitOrderHistory = async (
  credentials: BybitCredentials,
  params: {
    category: 'spot' | 'linear' | 'inverse' | 'option'
    symbol?: string
    startTime?: number
    endTime?: number
    limit?: number
    cursor?: string
  }
) => {
  return bybitSignedRequest<{ list: BybitHistoricOrder[], nextPageCursor?: string }>({
    credentials,
    method: 'GET',
    path: '/v5/order/history',
    params: {
      ...params,
      limit: params.limit || 50
    }
  })
}
