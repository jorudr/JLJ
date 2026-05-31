import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadFromDisk, saveToDisk } from '~/shared/diskStorage'
import type { DiaryEntry } from '~/entities/diary/model/diary.types'

export interface StrategyProfile {
  id: string
  name: string
  createdAt: string
}

export interface StrategyTradesData {
  strategies: StrategyProfile[]
  tradesByStrategy: Record<string, DiaryEntry[]>
  initialDepositsByStrategy?: Record<string, number>
}

export const useStrategyTradesStore = defineStore('strategyTrades', () => {
  const strategies = ref<StrategyProfile[]>([
    { id: 'MAIN_DIARY', name: 'Main Diary', createdAt: new Date().toISOString() }
  ])
  const tradesByStrategy = ref<Record<string, DiaryEntry[]>>({
    'MAIN_DIARY': []
  })
  const initialDepositsByStrategy = ref<Record<string, number>>({
    'MAIN_DIARY': 1000
  })
  const selectedStrategyId = ref('MAIN_DIARY')
  const isLoading = ref(true)
  const isInitialized = ref(false)

  async function init(force = false) {
    if (isInitialized.value && !force) return
    isLoading.value = true
    try {
      // Try Main first
      let data = await loadFromDisk<StrategyTradesData>('strategy_trades_v1')
      
      // If main is empty or null, try loading from backup
      if (!data || !data.tradesByStrategy || Object.values(data.tradesByStrategy).every(t => t.length === 0)) {
        console.log('StrategyTradesStore: Main diary empty, checking backup registry...')
        const backup = await loadFromDisk<StrategyTradesData>('strategy_trades_v1_backup')
        if (backup && backup.tradesByStrategy && Object.values(backup.tradesByStrategy).some(t => t.length > 0)) {
          data = backup
          console.log('StrategyTradesStore: Successfully restored from backup registry.')
        } else {
          // Final legacy fallback
          const legacy = await loadFromDisk<any>('genesis_diary_v2')
          if (legacy && (legacy.trades || legacy.tradesByStrategy)) {
            console.log('StrategyTradesStore: Found legacy data in genesis_diary_v2. Mapping...')
            data = {
              strategies: legacy.strategies || [],
              tradesByStrategy: legacy.tradesByStrategy || { 'MAIN_DIARY': legacy.trades || [] },
              initialDepositsByStrategy: legacy.initialDepositsByStrategy || { 'MAIN_DIARY': 1000 }
            }
          }
        }
      }

      if (data) {
        if (data.strategies) strategies.value = data.strategies
        if (data.tradesByStrategy) tradesByStrategy.value = data.tradesByStrategy
        if (data.initialDepositsByStrategy) initialDepositsByStrategy.value = data.initialDepositsByStrategy
        
        // Ensure MAIN_DIARY always exists
        if (!strategies.value.find(s => s.id === 'MAIN_DIARY')) {
          strategies.value.unshift({ id: 'MAIN_DIARY', name: 'Main Diary', createdAt: new Date().toISOString() })
        }
        if (!tradesByStrategy.value['MAIN_DIARY']) {
          tradesByStrategy.value['MAIN_DIARY'] = []
        }
      }

      // Main diary trades are loaded exclusively from disk storage
    } finally {
      isInitialized.value = true
      isLoading.value = false
    }
  }

  async function save() {
    const data: StrategyTradesData = {
      strategies: strategies.value,
      tradesByStrategy: tradesByStrategy.value,
      initialDepositsByStrategy: initialDepositsByStrategy.value
    }
    // Save to both Main and Backup for safety
    await saveToDisk('strategy_trades_v1', data)
    await saveToDisk('strategy_trades_v1_backup', data)
  }

  function getTradesForStrategy(strategyId: string) {
    return tradesByStrategy.value[strategyId] || []
  }

  async function addTrade(strategyId: string, trade: DiaryEntry) {
    if (!tradesByStrategy.value[strategyId]) {
      tradesByStrategy.value[strategyId] = []
    }
    tradesByStrategy.value[strategyId].push({
      ...trade,
      strategyId // Ensure it's tagged
    })
    await save()
  }

  function getInitialDeposit(strategyId: string) {
    return initialDepositsByStrategy.value[strategyId] ?? 1000
  }

  async function setInitialDeposit(strategyId: string, amount: number) {
    initialDepositsByStrategy.value[strategyId] = amount
    await save()
  }

  async function clearTrades(strategyId: string) {
    tradesByStrategy.value[strategyId] = []
    await save()
  }

  async function syncStrategies(matrixStrategies: { id: string; name: string }[]) {
    let changed = false
    matrixStrategies.forEach(ms => {
      const existing = strategies.value.find(s => s.id === ms.id)
      if (!existing) {
        strategies.value.push({
          id: ms.id,
          name: ms.name,
          createdAt: new Date().toISOString()
        })
        tradesByStrategy.value[ms.id] = []
        changed = true
      } else if (existing.name !== ms.name) {
        existing.name = ms.name
        changed = true
      }
    })
    if (changed) await save()
  }

  async function removeTrade(strategyId: string, tradeId: string) {
    if (!tradesByStrategy.value[strategyId]) return
    tradesByStrategy.value[strategyId] = tradesByStrategy.value[strategyId].filter(t => t.id !== tradeId)
    await save()
  }

  async function purgeAllStrategies() {
    const mainDiaryTrades = tradesByStrategy.value['MAIN_DIARY'] || []
    
    // Move all trades from all other strategies to MAIN_DIARY
    Object.entries(tradesByStrategy.value).forEach(([strategyId, trades]) => {
      if (strategyId !== 'MAIN_DIARY') {
        const updatedTrades = trades.map(t => ({ ...t, strategyId: 'MAIN_DIARY', tradingStyle: 'Main Diary' }))
        mainDiaryTrades.push(...updatedTrades)
      }
    })
    
    // Reset state to only have MAIN_DIARY
    strategies.value = [
      { id: 'MAIN_DIARY', name: 'Main Diary', createdAt: new Date().toISOString() }
    ]
    tradesByStrategy.value = {
      'MAIN_DIARY': mainDiaryTrades
    }
    
    await save()
  }

  async function updateTrade(strategyId: string, tradeId: string, updates: Partial<DiaryEntry>) {
    if (!tradesByStrategy.value[strategyId]) return
    const index = tradesByStrategy.value[strategyId].findIndex(t => t.id === tradeId)
    if (index !== -1) {
      tradesByStrategy.value[strategyId][index] = {
        ...tradesByStrategy.value[strategyId][index],
        ...updates
      } as DiaryEntry
      await save()
    }
  }

  return {
    strategies,
    tradesByStrategy,
    isLoading,
    init,
    save,
    getTradesForStrategy,
    addTrade,
    updateTrade,
    removeTrade,
    syncStrategies,
    getInitialDeposit,
    setInitialDeposit,
    clearTrades,
    selectedStrategyId,
    purgeAllStrategies
  }
})
