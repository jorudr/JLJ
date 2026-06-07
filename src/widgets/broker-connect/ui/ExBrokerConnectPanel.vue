<template>
  <div class="fixed inset-0 z-[2500] flex items-center justify-center bg-black/45 px-6 backdrop-blur-sm"
       @click.self="$emit('close')">
    <ExPanel no-padding class="w-[920px] max-w-[96vw] overflow-hidden !bg-white dark:!bg-[#0a0a0a]">
      <div class="flex h-[620px] max-h-[90vh] text-black dark:text-white">
        <aside class="w-[280px] shrink-0 overflow-y-auto border-r border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
          <div class="mb-5 border-b border-black/10 pb-4 dark:border-white/10">
            <p class="font-mono text-[9px] font-black uppercase tracking-[0.32em] opacity-40">Broker_Link</p>
            <h2 class="mt-2 font-mono text-[18px] font-black uppercase tracking-wide">Connect_Source</h2>
          </div>

          <div class="flex flex-col gap-2">
            <button v-for="broker in brokers"
                    :key="broker.id"
                    class="group relative border px-4 py-3 text-left transition-all"
                    :class="selectedBrokerId === broker.id
                      ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                      : 'border-black/10 bg-white/40 text-black/55 hover:border-black/35 hover:text-black dark:border-white/10 dark:bg-white/[0.02] dark:text-white/45 dark:hover:border-white/35 dark:hover:text-white'"
                    @click="selectedBrokerId = broker.id">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="font-mono text-[11px] font-black uppercase tracking-[0.18em]">{{ broker.label }}</p>
                  <p class="mt-1 font-mono text-[7px] font-bold uppercase tracking-[0.18em] opacity-45">{{ broker.assetClass }}</p>
                </div>
                <span class="h-2 w-2 rotate-45"
                      :class="connectionMap[broker.id]?.active
                        ? 'bg-emerald-400'
                        : selectedBrokerId === broker.id
                          ? 'bg-white dark:bg-black'
                          : 'bg-black/20 dark:bg-white/20'"></span>
              </div>
              <div class="absolute left-1 top-1 h-1.5 w-1.5 border-l border-t"
                   :class="selectedBrokerId === broker.id ? 'border-white dark:border-black' : 'border-black/20 dark:border-white/20'"></div>
            </button>
          </div>
        </aside>

        <section class="flex min-w-0 flex-1 flex-col">
          <header class="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10 shrink-0">
            <div>
              <p class="font-mono text-[8px] font-black uppercase tracking-[0.32em] opacity-35">{{ selectedBroker.assetClass }}</p>
              <h3 class="mt-1 font-mono text-[20px] font-black uppercase tracking-wide">{{ selectedBroker.label }}</h3>
            </div>
            <button class="font-mono text-[9px] font-black uppercase tracking-[0.24em] opacity-35 transition-opacity hover:opacity-100"
                    @click="$emit('close')">
              Close
            </button>
          </header>

          <div class="grid flex-1 grid-cols-[1fr_260px] gap-0 overflow-y-auto relative">
            <div class="p-6">
              <div class="mb-5 border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <p class="font-mono text-[9px] font-bold uppercase leading-relaxed tracking-[0.12em] opacity-55">
                  {{ selectedBroker.description }}
                </p>
              </div>

              <div class="grid grid-cols-1 gap-4">
                <label v-for="field in selectedBroker.fields"
                       :key="field.key"
                       class="flex flex-col gap-2">
                  <span class="font-mono text-[8px] font-black uppercase tracking-[0.22em] opacity-45">{{ field.label }}</span>
                  <input v-model="formState[field.key]"
                         :type="field.secret ? 'password' : 'text'"
                         :placeholder="field.placeholder"
                         class="h-11 border border-black/10 bg-white px-3 font-mono text-[11px] font-bold tracking-[0.08em] text-black outline-none transition-colors placeholder:text-black/25 focus:border-black/45 dark:border-white/10 dark:bg-[#050505] dark:text-white dark:placeholder:text-white/20 dark:focus:border-white/45" />
                </label>
              </div>

              <div class="mt-6 grid gap-3" :class="isSelectedBrokerActive ? 'grid-cols-3' : 'grid-cols-2'">
                <button class="border border-black/10 px-4 py-3 font-mono text-[9px] font-black uppercase tracking-[0.22em] transition-colors hover:border-black hover:bg-black hover:text-white dark:border-white/10 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
                        @click="saveCurrentConnection">
                  Save_Local_Keys
                </button>
                <button class="border px-4 py-3 font-mono text-[9px] font-black uppercase tracking-[0.22em] transition-colors"
                        :class="primaryActionEnabled
                          ? 'border-black bg-black text-white hover:bg-black/80 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/80'
                          : 'cursor-not-allowed border-black/10 text-black/25 dark:border-white/10 dark:text-white/25'"
                        :disabled="!primaryActionEnabled || activationState === 'loading'"
                        @click="handlePrimaryAction">
                  {{ primaryActionLabel }}
                </button>
                <button v-if="isSelectedBrokerActive"
                        class="border border-black/10 bg-black/[0.02] px-4 py-3 font-mono text-[9px] font-black uppercase tracking-[0.22em] text-emerald-600 transition-colors hover:border-emerald-500 hover:bg-emerald-500 hover:text-white dark:border-white/10 dark:bg-white/[0.02] dark:text-emerald-400 dark:hover:border-emerald-500 dark:hover:bg-emerald-500 dark:hover:text-black"
                        :disabled="activationState === 'loading'"
                        @click="handleManualSync">
                  {{ activationState === 'loading' ? 'Syncing...' : 'Sync_Trades' }}
                </button>
              </div>

              <div v-if="statusMessage"
                   class="mt-5 border px-4 py-3 font-mono text-[9px] font-bold uppercase leading-relaxed tracking-[0.14em]"
                   :class="statusTone === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500'
                    : statusTone === 'error'
                      ? 'border-rose-500/30 bg-rose-500/5 text-rose-500'
                      : 'border-black/10 bg-black/[0.02] text-black/45 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/45'">
                {{ statusMessage }}
              </div>

              <div v-if="showStrategyBinding"
                   class="mt-5 border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p class="font-mono text-[8px] font-black uppercase tracking-[0.24em] opacity-45">Import_Target_Strategy</p>
                    <p class="mt-2 font-mono text-[8px] font-bold uppercase tracking-[0.12em] opacity-55">
                      Choose where this connector should load trading history in the diary.
                    </p>
                  </div>
                  <p class="font-mono text-[9px] font-black uppercase opacity-40">
                    {{ selectedImportStrategyName }}
                  </p>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-2">
                  <button v-for="strategy in tradeStore.strategies"
                          :key="strategy.id"
                          class="border px-3 py-3 text-left transition-colors"
                          :class="importTargetStrategyId === strategy.id
                            ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                            : 'border-black/10 bg-white/50 text-black/65 hover:border-black/35 hover:text-black dark:border-white/10 dark:bg-white/[0.02] dark:text-white/60 dark:hover:border-white/35 dark:hover:text-white'"
                          @click="setImportTargetStrategy(strategy.id)">
                    <p class="font-mono text-[10px] font-black uppercase tracking-[0.14em]">{{ strategy.name }}</p>
                    <p class="mt-1 font-mono text-[7px] font-bold uppercase tracking-[0.14em] opacity-40">{{ strategy.id }}</p>
                  </button>
                </div>
              </div>
            </div>

            <aside class="border-l border-black/10 p-5 dark:border-white/10">
              <p class="font-mono text-[8px] font-black uppercase tracking-[0.28em] opacity-35">Connection_Status</p>
              <div class="mt-4 space-y-3">
                <div class="border border-black/10 p-3 dark:border-white/10">
                  <p class="font-mono text-[7px] font-black uppercase tracking-[0.2em] opacity-35">Saved</p>
                  <p class="mt-2 font-mono text-[13px] font-black uppercase"
                     :class="savedCurrentConnection ? 'text-emerald-500' : 'opacity-35'">
                    {{ savedCurrentConnection ? 'Yes' : 'No' }}
                  </p>
                </div>
                <div class="border border-black/10 p-3 dark:border-white/10">
                  <p class="font-mono text-[7px] font-black uppercase tracking-[0.2em] opacity-35">Active</p>
                  <p class="mt-2 font-mono text-[13px] font-black uppercase"
                     :class="connectionMap[selectedBroker.id]?.active ? 'text-emerald-500' : 'opacity-35'">
                    {{ connectionMap[selectedBroker.id]?.active ? 'Enabled' : 'Inactive' }}
                  </p>
                </div>
                <div class="border border-black/10 p-3 dark:border-white/10">
                  <p class="font-mono text-[7px] font-black uppercase tracking-[0.2em] opacity-35">Mode</p>
                  <p class="mt-2 font-mono text-[11px] font-black uppercase opacity-60">{{ selectedBroker.mode }}</p>
                </div>
                <div v-if="showStrategyBinding" class="border border-black/10 p-3 dark:border-white/10">
                  <p class="font-mono text-[7px] font-black uppercase tracking-[0.2em] opacity-35">Target</p>
                  <p class="mt-2 font-mono text-[11px] font-black uppercase opacity-60">{{ selectedImportStrategyName }}</p>
                </div>
              </div>

              <p class="mt-5 border-t border-black/10 pt-4 font-mono text-[8px] font-bold uppercase leading-relaxed tracking-[0.12em] opacity-40 dark:border-white/10">
                Use read-only API keys. Local save stores credentials on this device for connector activation.
              </p>
            </aside>
          </div>
        </section>
      </div>
    </ExPanel>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import ExPanel from '~/shared/ui/ExPanel.vue'
import type { DiaryEntry } from '~/entities/diary/model/diary.types'
import { loadFromDisk, saveToDisk } from '~/shared/diskStorage'
import { testBinanceConnection, type BinanceCredentials } from '~/utils/binance'
import {
  testBybitConnection,
  getBybitClosedTrades,
  getBybitOrderHistory,
  type BybitCredentials,
  type BybitClosedPnl,
  type BybitHistoricOrder
} from '~/utils/bybit'
import { resolveImportedAsset } from '~/utils/assetResolver'
import { useStrategyTradesStore } from '~/features/store/useStrategyTrades'

type BrokerId = 'binance' | 'bybit' | 'kraken' | 'interactive-brokers' | 'oanda'

interface BrokerField {
  key: string
  label: string
  placeholder: string
  secret?: boolean
}

interface BrokerDefinition {
  id: BrokerId
  label: string
  assetClass: string
  description: string
  mode: string
  fields: BrokerField[]
  canActivate: boolean
}

interface SavedConnection {
  brokerId: BrokerId
  credentials: Record<string, string>
  active: boolean
  updatedAt: string
  activatedAt?: string
}

interface MetaTraderDetectedSource {
  id: string
  platform: string
  terminalName: string
  dataDir: string
  exportFilePath: string
  exportFileName: string
  modifiedAtMs?: number
}

const props = defineProps<{
  strategyId?: string
}>()

defineEmits<{
  close: []
}>()

const STORAGE_KEY = 'broker_connections_v1'
const tradeStore = useStrategyTradesStore()

const brokers: BrokerDefinition[] = [
  {
    id: 'binance',
    label: 'Binance',
    assetClass: 'Crypto Spot / Futures',
    description: 'Read-only Binance connector. Uses signed USER_DATA endpoints for account validation and trade history helpers.',
    mode: 'Live Activation',
    canActivate: true,
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'X-MBX-APIKEY' },
      { key: 'apiSecret', label: 'API Secret', placeholder: 'HMAC SHA256 secret', secret: true }
    ]
  },
  {
    id: 'bybit',
    label: 'Bybit',
    assetClass: 'Crypto Derivatives',
    description: 'Connect Bybit read-only API to load execution history.',
    mode: 'Live Activation',
    canActivate: true,
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Bybit API key' },
      { key: 'apiSecret', label: 'API Secret', placeholder: 'Bybit API secret', secret: true }
    ]
  },
  {
    id: 'kraken',
    label: 'Kraken',
    assetClass: 'Crypto Spot',
    description: 'Prepared connector slot for Kraken closed orders and ledgers.',
    mode: 'Prepared',
    canActivate: false,
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Kraken API key' },
      { key: 'privateKey', label: 'Private Key', placeholder: 'Kraken private key', secret: true }
    ]
  },
  {
    id: 'interactive-brokers',
    label: 'Interactive Brokers',
    assetClass: 'Stocks / Options / Forex',
    description: 'Prepared connector slot for IBKR Client Portal or Flex Query trade history.',
    mode: 'Prepared',
    canActivate: false,
    fields: [
      { key: 'host', label: 'Gateway URL', placeholder: 'https://localhost:5000' },
      { key: 'token', label: 'Session / Flex Token', placeholder: 'IBKR token', secret: true }
    ]
  },
  {
    id: 'oanda',
    label: 'OANDA',
    assetClass: 'Forex / CFD',
    description: 'Prepared connector slot for OANDA v20 transactions and account trade history.',
    mode: 'Prepared',
    canActivate: false,
    fields: [
      { key: 'accountId', label: 'Account ID', placeholder: 'OANDA account id' },
      { key: 'apiToken', label: 'API Token', placeholder: 'OANDA token', secret: true },
      { key: 'environment', label: 'Environment', placeholder: 'practice / live' }
    ]
  }
]

const selectedBrokerId = ref<BrokerId>('binance')
const connectionMap = ref<Record<string, SavedConnection>>({})
const formState = reactive<Record<string, string>>({})
const activationState = ref<'idle' | 'loading'>('idle')
const statusMessage = ref('')
const statusTone = ref<'neutral' | 'success' | 'error'>('neutral')
const importTargetStrategyId = ref('MAIN_DIARY')


const selectedBroker = computed(() => {
  return (brokers.find(broker => broker.id === selectedBrokerId.value) || brokers[0]) as BrokerDefinition
})

const selectedImportStrategyName = computed(() => {
  return tradeStore.strategies.find(strategy => strategy.id === importTargetStrategyId.value)?.name || 'Main Diary'
})



const savedCurrentConnection = computed(() => {
  return Boolean(connectionMap.value[selectedBroker.value.id])
})

const isSelectedBrokerActive = computed(() => {
  return Boolean(connectionMap.value[selectedBroker.value.id]?.active)
})

const showStrategyBinding = computed(() => {
  return Boolean(connectionMap.value[selectedBroker.value.id]?.active)
})

const canActivateSelected = computed(() => {
  return selectedBroker.value.canActivate && selectedBroker.value.fields.every(field => String(formState[field.key] || '').trim())
})

const primaryActionEnabled = computed(() => {
  if (isSelectedBrokerActive.value) return true
  return canActivateSelected.value
})

const primaryActionLabel = computed(() => {
  if (activationState.value === 'loading') {
    return isSelectedBrokerActive.value ? 'Deactivating...' : 'Activating...'
  }
  if (isSelectedBrokerActive.value) return 'Deactivate'
  return 'Activate'
})

const resetFormForBroker = () => {
  Object.keys(formState).forEach((key) => {
    delete formState[key]
  })

  const saved = connectionMap.value[selectedBroker.value.id]
  selectedBroker.value.fields.forEach((field) => {
    formState[field.key] = saved?.credentials?.[field.key] || ''
  })



  importTargetStrategyId.value = saved?.credentials?.targetStrategyId || props.strategyId || tradeStore.selectedStrategyId || 'MAIN_DIARY'
}

const loadConnections = async () => {
  const saved = await loadFromDisk<Record<string, SavedConnection>>(STORAGE_KEY)
  connectionMap.value = saved || {}
  resetFormForBroker()
}

const persistConnections = async () => {
  await saveToDisk(STORAGE_KEY, connectionMap.value)
}

const saveCurrentConnection = async () => {
  const credentials = {
    ...Object.fromEntries(selectedBroker.value.fields.map(field => [field.key, String(formState[field.key] || '').trim()])),
    targetStrategyId: importTargetStrategyId.value
  } as Record<string, string>

  connectionMap.value[selectedBroker.value.id] = {
    brokerId: selectedBroker.value.id,
    credentials,
    active: connectionMap.value[selectedBroker.value.id]?.active || false,
    updatedAt: new Date().toISOString(),
    activatedAt: connectionMap.value[selectedBroker.value.id]?.activatedAt
  }
  await persistConnections()
  statusTone.value = 'success'
  statusMessage.value = `${selectedBroker.value.label} keys saved locally.`
}

const handlePrimaryAction = async () => {


  if (isSelectedBrokerActive.value) {
    await deactivateCurrentConnection()
    return
  }

  await activateCurrentConnection()
}

const handleManualSync = async () => {
  if (!isSelectedBrokerActive.value) return
  activationState.value = 'loading'
  try {
    const creds = connectionMap.value[selectedBroker.value.id]?.credentials
    if (selectedBroker.value.id === 'bybit' && creds) {
      await importBybitTrades({ apiKey: creds.apiKey || '', apiSecret: creds.apiSecret || '' })
    } else {
      statusMessage.value = 'Manual sync is not supported for this connector yet.'
      statusTone.value = 'neutral'
    }
  } catch (err: any) {
    statusTone.value = 'error'
    statusMessage.value = err?.message || 'Manual sync failed.'
  } finally {
    activationState.value = 'idle'
  }
}

const setImportTargetStrategy = async (strategyId: string) => {
  importTargetStrategyId.value = strategyId

  const existing = connectionMap.value[selectedBroker.value.id]
  if (!existing) return

  connectionMap.value[selectedBroker.value.id] = {
    ...existing,
    credentials: {
      ...existing.credentials,
      targetStrategyId: strategyId
    },
    updatedAt: new Date().toISOString()
  }
  await persistConnections()
  statusTone.value = 'success'
  statusMessage.value = `${selectedBroker.value.label} import target set to ${selectedImportStrategyName.value}.`
}

const activateCurrentConnection = async () => {
  if (!canActivateSelected.value) return

  activationState.value = 'loading'
  statusTone.value = 'neutral'
  statusMessage.value = 'Activating connector...'

  try {
    if (selectedBroker.value.id === 'binance') {
      const credentials: BinanceCredentials = {
        apiKey: formState.apiKey || '',
        apiSecret: formState.apiSecret || ''
      }
      await testBinanceConnection(credentials)
    } else if (selectedBroker.value.id === 'bybit') {
      const credentials: BybitCredentials = {
        apiKey: formState.apiKey || '',
        apiSecret: formState.apiSecret || ''
      }
      await testBybitConnection(credentials)
      await importBybitTrades(credentials)
    }

    connectionMap.value[selectedBroker.value.id] = {
      brokerId: selectedBroker.value.id,
      credentials: {
        ...Object.fromEntries(selectedBroker.value.fields.map(field => [field.key, String(formState[field.key] || '').trim()])),
        targetStrategyId: importTargetStrategyId.value
      },
      active: true,
      updatedAt: new Date().toISOString(),
      activatedAt: new Date().toISOString()
    }
    await persistConnections()
    statusTone.value = 'success'
    statusMessage.value = `${selectedBroker.value.label} connector activated. Choose a diary strategy below for trade history import.`
  } catch (error: any) {
    statusTone.value = 'error'
    statusMessage.value = error?.message || 'Connector activation failed.'
  } finally {
    activationState.value = 'idle'
  }
}

const importBybitTrades = async (credentials: BybitCredentials) => {
  statusMessage.value = 'Fetching closed trades from Bybit...'
  const [spotResponse, linearResponse, inverseResponse] = await Promise.allSettled([
    getBybitOrderHistory(credentials, { category: 'spot', limit: 50 }),
    getBybitClosedTrades(credentials, { category: 'linear', limit: 100 }),
    getBybitClosedTrades(credentials, { category: 'inverse', limit: 100 })
  ])

  const spotTrades = spotResponse.status === 'fulfilled' ? (spotResponse.value.list || []) : []
  const linearTrades = linearResponse.status === 'fulfilled' ? (linearResponse.value.list || []) : []
  const inverseTrades = inverseResponse.status === 'fulfilled' ? (inverseResponse.value.list || []) : []

  const hasAnySuccessfulSource = [spotResponse, linearResponse, inverseResponse].some(item => item.status === 'fulfilled')
  if (!hasAnySuccessfulSource) {
    const firstError = [spotResponse, linearResponse, inverseResponse].find(item => item.status === 'rejected') as PromiseRejectedResult | undefined
    throw new Error(firstError?.reason?.message || 'Bybit trade sync failed.')
  }

  let importedCount = 0
  let duplicateCount = 0

  await tradeStore.init()
  const existingTrades = tradeStore.getAllTradesForStrategy(importTargetStrategyId.value)
  const existingIds = new Set(existingTrades.map(t => {
    const anyTrade = t as DiaryEntry & { sourceExternalId?: string }
    return anyTrade.sourceExternalId || ''
  }).filter(Boolean))

  const importTrade = async (trade: DiaryEntry & { sourceExternalId: string; sourcePlatform: string }) => {
    if (existingIds.has(trade.sourceExternalId)) {
      duplicateCount++
      return
    }

    await tradeStore.addTrade(importTargetStrategyId.value, trade as DiaryEntry)
    importedCount++
    existingIds.add(trade.sourceExternalId)
  }

  const spotRoundTrips = buildBybitSpotRoundTrips(spotTrades)
  for (const trade of spotRoundTrips) {
    await importTrade(trade)
  }

  const derivativeTrades: Array<BybitClosedPnl & { market: 'linear' | 'inverse' }> = [
    ...linearTrades.map(trade => ({ ...trade, market: 'linear' as const })),
    ...inverseTrades.map(trade => ({ ...trade, market: 'inverse' as const }))
  ]

  for (const trade of derivativeTrades) {
    const execId = trade.orderId
    if (!execId) continue

    // closed-pnl side is the closing order side:
    // Sell closes a Long, Buy closes a Short
    const side = trade.side === 'Sell' ? 'Long' : 'Short'
    const profit = Number(trade.closedPnl) || 0
    const entryFee = Number(trade.openFee || 0) || 0
    const exitFee = Number(trade.closeFee || 0) || 0
    const resolvedAsset = resolveImportedAsset(trade.symbol, 'crypto-broker')

    const attached = {
      id: `bybit-${trade.market}-${execId}`,
      date: new Date(Number(trade.createdTime)),
      dateExit: new Date(Number(trade.updatedTime || trade.createdTime)),
      asset: resolvedAsset.symbol,
      side,
      entry: Number(trade.avgEntryPrice),
      exit: Number(trade.avgExitPrice),
      size: Number(trade.closedSize),
      entryFee,
      exitFee,
      feeType: 'Fixed',
      currency: 'USDT',
      assetType: resolvedAsset.assetType,
      assetIcon: resolvedAsset.assetIcon,
      profitInCurrency: profit,
      result: profit,
      notes: `Imported from Bybit ${trade.market} closed pnl.\nOrderId: ${execId}\nLeverage: ${trade.leverage}\nFillCount: ${trade.fillCount}\nAssetMatch: ${resolvedAsset.matchSource || 'none'}`,
      source: 'bybit',
      sourceExternalId: `${trade.market}:${execId}`,
      sourcePlatform: 'Bybit V5'
    } as DiaryEntry & { sourceExternalId: string; sourcePlatform: string }

    await importTrade(attached)
  }

  statusTone.value = importedCount > 0 ? 'success' : 'neutral'
  statusMessage.value = importedCount > 0
    ? `${importedCount} Bybit trades imported. ${duplicateCount} duplicates skipped.`
    : `No importable Bybit trades found. Spot orders checked: ${spotTrades.length}, spot round trips: ${spotRoundTrips.length}, linear checked: ${linearTrades.length}, inverse checked: ${inverseTrades.length}.`
}

const buildBybitSpotRoundTrips = (orders: BybitHistoricOrder[]) => {
  type OpenLot = {
    orderId: string
    symbol: string
    date: Date
    remainingQty: number
    price: number
    fee: number
  }

  const epsilon = 1e-10
  const openLotsBySymbol = new Map<string, OpenLot[]>()
  const roundTrips: Array<DiaryEntry & { sourceExternalId: string; sourcePlatform: string }> = []

  const normalizedOrders = [...orders]
    .filter(order => /Filled|PartiallyFilledCancelled/i.test(String(order.orderStatus || '')))
    .map(order => {
      const qty = Number(order.cumExecQty || 0)
      const avgPriceRaw = Number(order.avgPrice || 0)
      const value = Number(order.cumExecValue || 0)
      const avgPrice = avgPriceRaw || (qty > 0 ? value / qty : 0)

      return {
        ...order,
        qty,
        value,
        avgPrice,
        fee: readBybitSpotFee(order),
        timestamp: Number(order.updatedTime || order.createdTime || 0)
      }
    })
    .filter(order => order.qty > epsilon && order.avgPrice > epsilon)
    .sort((left, right) => left.timestamp - right.timestamp)

  normalizedOrders.forEach((order) => {
    const symbol = String(order.symbol || '').toUpperCase()
    if (!symbol) return

    const lots = openLotsBySymbol.get(symbol) || []

    if (order.side === 'Buy') {
      lots.push({
        orderId: order.orderId,
        symbol,
        date: new Date(order.timestamp),
        remainingQty: order.qty,
        price: order.avgPrice,
        fee: order.fee
      })
      openLotsBySymbol.set(symbol, lots)
      return
    }

    let remainingSellQty = order.qty
    let consumedQty = 0
    let entryCost = 0
    let allocatedEntryFee = 0
    let firstEntryDate: Date | null = null
    const consumedOrderIds: string[] = []

    while (remainingSellQty > epsilon && lots.length) {
      const currentLot = lots[0]!
      const matchedQty = Math.min(currentLot.remainingQty, remainingSellQty)
      const lotShare = matchedQty / currentLot.remainingQty

      if (!firstEntryDate) {
        firstEntryDate = currentLot.date
      }

      consumedQty += matchedQty
      entryCost += matchedQty * currentLot.price
      allocatedEntryFee += currentLot.fee * lotShare
      if (!consumedOrderIds.includes(currentLot.orderId)) {
        consumedOrderIds.push(currentLot.orderId)
      }

      currentLot.remainingQty -= matchedQty
      currentLot.fee -= currentLot.fee * lotShare
      remainingSellQty -= matchedQty

      if (currentLot.remainingQty <= epsilon) {
        lots.shift()
      }
    }

    if (consumedQty <= epsilon || !firstEntryDate) {
      openLotsBySymbol.set(symbol, lots)
      return
    }

    const proceeds = consumedQty * order.avgPrice
    const exitFee = order.fee * (consumedQty / order.qty)
    const profit = proceeds - entryCost - allocatedEntryFee - exitFee
    const resolvedAsset = resolveImportedAsset(symbol, 'crypto-broker')

    roundTrips.push({
      id: `bybit-spot-close-${order.orderId}`,
      date: firstEntryDate,
      dateExit: new Date(order.timestamp),
      asset: resolvedAsset.symbol,
      side: 'Long',
      entry: entryCost / consumedQty,
      exit: order.avgPrice,
      size: consumedQty,
      entryFee: allocatedEntryFee,
      exitFee,
      feeType: 'Fixed',
      currency: 'USDT',
      assetType: resolvedAsset.assetType,
      assetIcon: resolvedAsset.assetIcon,
      profitInCurrency: profit,
      result: profit,
      notes: `Imported from Bybit spot round trip.\nOpenOrders: ${consumedOrderIds.join(', ')}\nCloseOrder: ${order.orderId}\nOrderType: ${order.orderType}\nAssetMatch: ${resolvedAsset.matchSource || 'none'}`,
      source: 'bybit',
      sourceExternalId: `spot-close:${order.orderId}`,
      sourcePlatform: 'Bybit V5 Spot'
    } as DiaryEntry & { sourceExternalId: string; sourcePlatform: string })

    openLotsBySymbol.set(symbol, lots)
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

const deactivateCurrentConnection = async () => {
  const existing = connectionMap.value[selectedBroker.value.id]
  if (!existing) return

  activationState.value = 'loading'
  statusTone.value = 'neutral'
  statusMessage.value = 'Deactivating connector...'

  try {
    connectionMap.value[selectedBroker.value.id] = {
      ...existing,
      active: false,
      updatedAt: new Date().toISOString()
    }
    await persistConnections()
    statusTone.value = 'success'
    statusMessage.value = `${selectedBroker.value.label} connector deactivated.`
  } catch (error: any) {
    statusTone.value = 'error'
    statusMessage.value = error?.message || 'Connector deactivation failed.'
  } finally {
    activationState.value = 'idle'
  }
}



const formatMoney = (value: unknown) => {
  const number = Number(value || 0)
  return `${number >= 0 ? '+' : ''}${number.toFixed(2)}`
}

const formatDateLabel = (value: unknown) => {
  const date = value instanceof Date ? value : new Date(String(value || ''))
  return Number.isNaN(date.getTime()) ? 'NO_DATE' : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
}



watch(selectedBrokerId, () => {
  statusMessage.value = ''
  statusTone.value = 'neutral'
  resetFormForBroker()
})

onMounted(async () => {
  await tradeStore.init()
  await loadConnections()
})
</script>
