import type { DiaryEntry } from './diary.types'

export const mockStrategies = [
    { id: 's1', name: 'SMC_LIQUIDITY_SWEEP', description: 'Institutional liquidity grabs at H4/D1 demand zones.' },
    { id: 's2', name: 'MEAN_REVERSION_V2', description: 'Overextended RSI moves with Fibonacci retracement confluence.' },
    { id: 's3', name: 'SCALPING_ALPHA', description: 'High-frequency M1 execution during London/NY crossover.' },
    { id: 's4', name: 'MACRO_POSITIONAL', description: 'Long-term bias based on DXY and interest rate parity.' }
]

export const mockTrades: DiaryEntry[] = [
    { id: 't1', strategyId: 's1', asset: 'EURUSD', side: 'Long', result: 2.5, date: new Date('2026-04-01T08:30:00'), profitInCurrency: 450, assetType: 'Forex' },
    { id: 't2', strategyId: 's1', asset: 'GBPUSD', side: 'Long', result: 1.8, date: new Date('2026-04-02T14:15:00'), profitInCurrency: 320, assetType: 'Forex' },
    { id: 't3', strategyId: 's2', asset: 'XAUUSD', side: 'Short', result: 4.5, date: new Date('2026-04-03T20:00:00'), profitInCurrency: 1200, assetType: 'Metals' },
    { id: 't4', strategyId: 's1', asset: 'AUDUSD', side: 'Short', result: -1.0, date: new Date('2026-04-04T02:00:00'), profitInCurrency: -200, assetType: 'Forex' },
    { id: 't5', strategyId: 's3', asset: 'NAS100', side: 'Long', result: 1.1, date: new Date('2026-04-05T15:35:00'), profitInCurrency: 300, assetType: 'Stocks' },
    { id: 't6', strategyId: 's2', asset: 'BTCUSD', side: 'Long', result: -2.0, date: new Date('2026-04-07T11:00:00'), profitInCurrency: -800, assetType: 'Crypto' },
    { id: 't7', strategyId: 's1', asset: 'EURUSD', side: 'Long', result: 3.2, date: new Date('2026-04-08T09:45:00'), profitInCurrency: 600, assetType: 'Forex' },
    { id: 't8', strategyId: 's3', asset: 'US30', side: 'Short', result: -0.5, date: new Date('2026-04-10T16:10:00'), profitInCurrency: -150, assetType: 'Stocks' },
    { id: 't9', strategyId: 's1', asset: 'EURUSD', side: 'Short', result: 5.5, date: new Date('2026-04-12T12:00:00'), profitInCurrency: 2500, assetType: 'Forex' },
    { id: 't10', strategyId: 's2', asset: 'ETHUSD', side: 'Long', result: 1.5, date: new Date('2026-04-14T18:30:00'), profitInCurrency: 500, assetType: 'Crypto' },
    { id: 't11', strategyId: 's1', asset: 'USDJPY', side: 'Long', result: 3.8, date: new Date('2026-04-15T08:00:00'), profitInCurrency: 1800, assetType: 'Forex' },
    { id: 't12', strategyId: 's3', asset: 'GER40', side: 'Short', result: 1.4, date: new Date('2026-04-18T08:15:00'), profitInCurrency: 420, assetType: 'Stocks' },
    { id: 't13', strategyId: 's2', asset: 'SOLUSD', side: 'Long', result: 6.5, date: new Date('2026-04-20T19:20:00'), profitInCurrency: 2200, assetType: 'Crypto' },
    { id: 't14', strategyId: 's1', asset: 'GBPUSD', side: 'Short', result: -1.5, date: new Date('2026-04-21T10:00:00'), profitInCurrency: -700, assetType: 'Forex' },
    { id: 't15', strategyId: 's2', asset: 'XAUUSD', side: 'Short', result: 4.8, date: new Date('2026-04-22T14:45:00'), profitInCurrency: 1450, assetType: 'Metals' }
]
