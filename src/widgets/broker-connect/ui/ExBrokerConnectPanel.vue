<template>
  <div class="fixed inset-0 z-[2500] flex items-center justify-center bg-black/45 px-6 backdrop-blur-sm"
       @click.self="$emit('close')">
    <ExPanel no-padding class="w-[920px] max-w-[96vw] overflow-hidden !bg-white dark:!bg-[#0a0a0a]">
      <div class="flex min-h-[620px] text-black dark:text-white">
        <aside class="w-[280px] shrink-0 border-r border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
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
          <header class="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
            <div>
              <p class="font-mono text-[8px] font-black uppercase tracking-[0.32em] opacity-35">{{ selectedBroker.assetClass }}</p>
              <h3 class="mt-1 font-mono text-[20px] font-black uppercase tracking-wide">{{ selectedBroker.label }}</h3>
            </div>
            <button class="font-mono text-[9px] font-black uppercase tracking-[0.24em] opacity-35 transition-opacity hover:opacity-100"
                    @click="$emit('close')">
              Close
            </button>
          </header>

          <div class="grid flex-1 grid-cols-[1fr_260px] gap-0">
            <div class="p-6">
              <div class="mb-5 border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <p class="font-mono text-[9px] font-bold uppercase leading-relaxed tracking-[0.12em] opacity-55">
                  {{ selectedBroker.description }}
                </p>
              </div>

              <div v-if="selectedBroker.id === 'metatrader'" class="space-y-5">
                <div class="flex items-center justify-between gap-4 border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
                  <div>
                    <p class="font-mono text-[9px] font-black uppercase tracking-[0.2em]">Auto_Detected_Terminals</p>
                    <p class="mt-2 font-mono text-[8px] font-bold uppercase tracking-[0.14em] opacity-45">
                      Windows and mac versions scan common MetaTrader data folders automatically.
                    </p>
                  </div>
                  <button class="border border-black/10 px-3 py-2 font-mono text-[8px] font-black uppercase tracking-[0.18em] transition-colors hover:border-black hover:bg-black hover:text-white dark:border-white/10 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
                          :disabled="isMetaTraderScanning"
                          @click="scanMetaTraderSources">
                    {{ isMetaTraderScanning ? 'Scanning...' : 'Rescan' }}
                  </button>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <label class="flex flex-col gap-2">
                    <span class="font-mono text-[8px] font-black uppercase tracking-[0.22em] opacity-45">Platform</span>
                    <select v-model="metaTraderPlatform"
                            class="h-11 border border-black/10 bg-white px-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-black outline-none transition-colors focus:border-black/45 dark:border-white/10 dark:bg-[#050505] dark:text-white dark:focus:border-white/45">
                      <option value="MT5">MT5</option>
                      <option value="MT4">MT4</option>
                    </select>
                  </label>
                  <label class="flex flex-col gap-2">
                    <span class="font-mono text-[8px] font-black uppercase tracking-[0.22em] opacity-45">Currency</span>
                    <input v-model="metaTraderCurrency"
                           placeholder="USD"
                           class="h-11 border border-black/10 bg-white px-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-black outline-none transition-colors placeholder:text-black/25 focus:border-black/45 dark:border-white/10 dark:bg-[#050505] dark:text-white dark:placeholder:text-white/20 dark:focus:border-white/45" />
                  </label>
                </div>

                <div class="border border-black/10 dark:border-white/10">
                  <div v-if="metaTraderSources.length" class="max-h-[220px] overflow-y-auto">
                    <button v-for="source in metaTraderSources"
                            :key="source.id"
                            class="grid w-full grid-cols-[88px_1fr_110px] gap-3 border-b border-black/5 px-4 py-3 text-left transition-colors last:border-b-0 dark:border-white/5"
                            :class="metaTraderSourcePath === source.exportFilePath
                              ? 'bg-black text-white dark:bg-white dark:text-black'
                              : 'bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'"
                            @click="metaTraderSourcePath = source.exportFilePath">
                      <p class="font-mono text-[9px] font-black uppercase tracking-[0.16em]">{{ source.platform }}</p>
                      <div class="min-w-0">
                        <p class="truncate font-mono text-[10px] font-black uppercase tracking-[0.12em]">{{ source.terminalName }}</p>
                        <p class="mt-1 truncate font-mono text-[7px] font-bold uppercase tracking-[0.12em] opacity-45">{{ source.exportFileName }}</p>
                      </div>
                      <p class="text-right font-mono text-[7px] font-bold uppercase tracking-[0.12em] opacity-45">
                        {{ formatModifiedLabel(source.modifiedAtMs) }}
                      </p>
                    </button>
                  </div>
                  <div v-else class="p-5">
                    <p class="font-mono text-[10px] font-black uppercase tracking-[0.16em] opacity-45">No_Auto_Source_Detected</p>
                    <p class="mt-2 font-mono text-[8px] font-bold uppercase leading-relaxed tracking-[0.12em] opacity-35">
                      Place the bridge export in the terminal MQL files folder and this panel will pick it up automatically.
                    </p>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                  <div class="border border-black/10 p-3 dark:border-white/10">
                    <p class="font-mono text-[7px] font-black uppercase tracking-[0.2em] opacity-35">Parsed</p>
                    <p class="mt-2 font-mono text-[18px] font-black uppercase">{{ metaTraderPreview.length }}</p>
                  </div>
                  <div class="border border-black/10 p-3 dark:border-white/10">
                    <p class="font-mono text-[7px] font-black uppercase tracking-[0.2em] opacity-35">New</p>
                    <p class="mt-2 font-mono text-[18px] font-black uppercase text-emerald-500">{{ metaTraderNewCount }}</p>
                  </div>
                  <div class="border border-black/10 p-3 dark:border-white/10">
                    <p class="font-mono text-[7px] font-black uppercase tracking-[0.2em] opacity-35">Duplicates</p>
                    <p class="mt-2 font-mono text-[18px] font-black uppercase opacity-45">{{ metaTraderDuplicateCount }}</p>
                  </div>
                </div>

                <div v-if="metaTraderPreview.length" class="max-h-[190px] overflow-y-auto border border-black/10 dark:border-white/10">
                  <div v-for="trade in metaTraderPreview.slice(0, 8)"
                       :key="trade.externalId"
                       class="grid grid-cols-[1fr_80px_80px] gap-3 border-b border-black/5 px-3 py-2 last:border-b-0 dark:border-white/5">
                    <div class="min-w-0">
                      <p class="truncate font-mono text-[10px] font-black uppercase tracking-[0.12em]">{{ trade.diaryTrade.asset }}</p>
                      <p class="mt-1 font-mono text-[7px] font-bold uppercase tracking-[0.12em] opacity-35">{{ formatDateLabel(trade.diaryTrade.date) }}</p>
                    </div>
                    <p class="font-mono text-[9px] font-black uppercase tracking-[0.12em]" :class="trade.diaryTrade.side === 'Long' ? 'text-emerald-500' : 'text-rose-500'">
                      {{ trade.diaryTrade.side }}
                    </p>
                    <p class="text-right font-mono text-[9px] font-black uppercase tracking-[0.12em]" :class="Number(trade.diaryTrade.profitInCurrency || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                      {{ formatMoney(trade.diaryTrade.profitInCurrency) }}
                    </p>
                  </div>
                </div>
              </div>

              <div v-else class="grid grid-cols-1 gap-4">
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

              <div class="mt-6 grid grid-cols-2 gap-3">
                <button class="border border-black/10 px-4 py-3 font-mono text-[9px] font-black uppercase tracking-[0.22em] transition-colors hover:border-black hover:bg-black hover:text-white dark:border-white/10 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
                        @click="saveCurrentConnection">
                  {{ selectedBroker.id === 'metatrader' ? 'Save_Local_Sync' : 'Save_Local_Keys' }}
                </button>
                <button class="border px-4 py-3 font-mono text-[9px] font-black uppercase tracking-[0.22em] transition-colors"
                        :class="primaryActionEnabled
                          ? 'border-black bg-black text-white hover:bg-black/80 dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/80'
                          : 'cursor-not-allowed border-black/10 text-black/25 dark:border-white/10 dark:text-white/25'"
                        :disabled="!primaryActionEnabled || activationState === 'loading'"
                        @click="handlePrimaryAction">
                  {{ primaryActionLabel }}
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
                {{ selectedBroker.id === 'metatrader'
                  ? 'MetaTrader local sync imports closed trades from a local export file. No broker password is required.'
                  : 'Use read-only API keys. Local save stores credentials on this device for connector activation.' }}
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
import ExPanel from '~/shared/ui/ExPanel.vue'
import { loadFromDisk, saveToDisk } from '~/shared/diskStorage'
import { testBinanceConnection, type BinanceCredentials } from '~/utils/binance'
import {
  attachMetaTraderSource,
  dedupeMetaTraderTrades,
  parseMetaTraderExport,
  type MetaTraderImportedTrade,
  type MetaTraderPlatform
} from '~/utils/metatrader'
import { useStrategyTradesStore } from '~/features/store/useStrategyTrades'

type BrokerId = 'binance' | 'bybit' | 'kraken' | 'interactive-brokers' | 'oanda' | 'metatrader'

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
    description: 'Prepared connector slot for Bybit execution history. Activation will be added after Binance normalization.',
    mode: 'Prepared',
    canActivate: false,
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
  },
  {
    id: 'metatrader',
    label: 'MetaTrader',
    assetClass: 'Forex / CFD',
    description: 'Local MT4/MT5 sync. Import closed trades from terminal bridge exports without broker passwords or cloud keys.',
    mode: 'Local Sync',
    canActivate: false,
    fields: [
      { key: 'platform', label: 'Platform', placeholder: 'MT4 / MT5' },
      { key: 'currency', label: 'Currency', placeholder: 'USD' },
      { key: 'fileName', label: 'Last File', placeholder: 'history.csv' }
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
const metaTraderPlatform = ref<MetaTraderPlatform>('MT5')
const metaTraderCurrency = ref('USD')
const metaTraderSourcePath = ref('')
const metaTraderPreview = ref<MetaTraderImportedTrade[]>([])
const metaTraderNewCount = ref(0)
const metaTraderDuplicateCount = ref(0)
const metaTraderSources = ref<MetaTraderDetectedSource[]>([])
const isMetaTraderScanning = ref(false)

const selectedBroker = computed(() => {
  return brokers.find(broker => broker.id === selectedBrokerId.value) || brokers[0]
})

const selectedImportStrategyName = computed(() => {
  return tradeStore.strategies.find(strategy => strategy.id === importTargetStrategyId.value)?.name || 'Main Diary'
})

const selectedMetaTraderSource = computed(() => {
  return metaTraderSources.value.find(source => source.exportFilePath === metaTraderSourcePath.value) || null
})

const savedCurrentConnection = computed(() => {
  return Boolean(connectionMap.value[selectedBroker.value.id])
})

const isSelectedBrokerActive = computed(() => {
  return Boolean(connectionMap.value[selectedBroker.value.id]?.active)
})

const showStrategyBinding = computed(() => {
  return Boolean(connectionMap.value[selectedBroker.value.id]?.active || selectedBroker.value.id === 'metatrader')
})

const canActivateSelected = computed(() => {
  return selectedBroker.value.canActivate && selectedBroker.value.fields.every(field => String(formState[field.key] || '').trim())
})

const primaryActionEnabled = computed(() => {
  if (selectedBroker.value.id === 'metatrader') return metaTraderNewCount.value > 0
  if (isSelectedBrokerActive.value) return true
  return canActivateSelected.value
})

const primaryActionLabel = computed(() => {
  if (activationState.value === 'loading') {
    if (selectedBroker.value.id === 'metatrader') return 'Importing...'
    return isSelectedBrokerActive.value ? 'Deactivating...' : 'Activating...'
  }
  if (selectedBroker.value.id === 'metatrader') return 'Import_New_Trades'
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

  if (selectedBroker.value.id === 'metatrader') {
    metaTraderPlatform.value = (saved?.credentials?.platform as MetaTraderPlatform) || 'MT5'
    metaTraderCurrency.value = saved?.credentials?.currency || 'USD'
    metaTraderSourcePath.value = saved?.credentials?.sourcePath || ''
  }

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
  const credentials = selectedBroker.value.id === 'metatrader'
    ? {
        platform: metaTraderPlatform.value,
        currency: metaTraderCurrency.value.trim() || 'USD',
        sourcePath: metaTraderSourcePath.value,
        sourceLabel: selectedMetaTraderSource.value?.terminalName || '',
        targetStrategyId: importTargetStrategyId.value
      }
    : {
        ...Object.fromEntries(selectedBroker.value.fields.map(field => [field.key, String(formState[field.key] || '').trim()])),
        targetStrategyId: importTargetStrategyId.value
      }

  connectionMap.value[selectedBroker.value.id] = {
    brokerId: selectedBroker.value.id,
    credentials,
    active: connectionMap.value[selectedBroker.value.id]?.active || false,
    updatedAt: new Date().toISOString(),
    activatedAt: connectionMap.value[selectedBroker.value.id]?.activatedAt
  }
  await persistConnections()
  statusTone.value = 'success'
  statusMessage.value = selectedBroker.value.id === 'metatrader'
    ? 'MetaTrader local sync settings saved.'
    : `${selectedBroker.value.label} keys saved locally.`
}

const handlePrimaryAction = async () => {
  if (selectedBroker.value.id === 'metatrader') {
    await importMetaTraderTrades()
    return
  }

  if (isSelectedBrokerActive.value) {
    await deactivateCurrentConnection()
    return
  }

  await activateCurrentConnection()
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
        apiKey: formState.apiKey,
        apiSecret: formState.apiSecret
      }
      await testBinanceConnection(credentials)
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

const scanMetaTraderSources = async () => {
  isMetaTraderScanning.value = true

  try {
    const previousSourcePath = metaTraderSourcePath.value
    const sources = await invoke<MetaTraderDetectedSource[]>('detect_metatrader_sources')
    metaTraderSources.value = sources || []

    if (!metaTraderSourcePath.value || !metaTraderSources.value.some(source => source.exportFilePath === metaTraderSourcePath.value)) {
      metaTraderSourcePath.value = metaTraderSources.value[0]?.exportFilePath || ''
    }

    if (metaTraderSourcePath.value) {
      if (metaTraderSourcePath.value === previousSourcePath || !metaTraderPreview.value.length) {
        await loadMetaTraderPreview()
      }
    } else {
      metaTraderPreview.value = []
      metaTraderNewCount.value = 0
      metaTraderDuplicateCount.value = 0
      statusTone.value = 'neutral'
      statusMessage.value = 'No MetaTrader bridge export was detected automatically.'
    }
  } catch (error: any) {
    metaTraderSources.value = []
    metaTraderPreview.value = []
    metaTraderNewCount.value = 0
    metaTraderDuplicateCount.value = 0
    statusTone.value = 'error'
    statusMessage.value = error?.message || 'MetaTrader source scan failed.'
  } finally {
    isMetaTraderScanning.value = false
  }
}

const loadMetaTraderPreview = async () => {
  if (!metaTraderSourcePath.value) {
    metaTraderPreview.value = []
    refreshMetaTraderDedup()
    return
  }

  statusTone.value = 'neutral'
  statusMessage.value = 'Reading detected MetaTrader export...'

  try {
    const content = await invoke<string>('read_metatrader_export', {
      exportFilePath: metaTraderSourcePath.value
    })
    const source = selectedMetaTraderSource.value
    const result = parseMetaTraderExport(content, {
      fileName: source?.exportFileName || metaTraderSourcePath.value.split('/').pop() || 'export.csv',
      platform: (source?.platform as MetaTraderPlatform) || metaTraderPlatform.value,
      currency: metaTraderCurrency.value || 'USD'
    })
    metaTraderPlatform.value = ((source?.platform as MetaTraderPlatform) || metaTraderPlatform.value)
    metaTraderPreview.value = result.imported
    refreshMetaTraderDedup()

    statusTone.value = result.imported.length ? 'success' : 'error'
    statusMessage.value = result.imported.length
      ? `${result.imported.length} closed trades parsed from detected ${result.format.toUpperCase()} export.`
      : `No closed trades found. Skipped rows: ${result.skippedRows}.`
  } catch (error: any) {
    metaTraderPreview.value = []
    refreshMetaTraderDedup()
    statusTone.value = 'error'
    statusMessage.value = error?.message || 'MetaTrader export parsing failed.'
  }
}

const refreshMetaTraderDedup = () => {
  const existingTrades = tradeStore.getAllTradesForStrategy(importTargetStrategyId.value)
  const result = dedupeMetaTraderTrades(metaTraderPreview.value, existingTrades)
  metaTraderNewCount.value = result.newTrades.length
  metaTraderDuplicateCount.value = result.duplicates.length
}

const importMetaTraderTrades = async () => {
  if (!metaTraderPreview.value.length) return

  activationState.value = 'loading'
  statusTone.value = 'neutral'
  statusMessage.value = 'Importing MetaTrader trades...'

  try {
    await tradeStore.init()
    const deduped = dedupeMetaTraderTrades(
      metaTraderPreview.value,
      tradeStore.getAllTradesForStrategy(importTargetStrategyId.value)
    )

    for (const imported of deduped.newTrades) {
      await tradeStore.addTrade(
        importTargetStrategyId.value,
        attachMetaTraderSource(imported.diaryTrade, imported.externalId, metaTraderPlatform.value, imported.raw)
      )
    }

    connectionMap.value.metatrader = {
      brokerId: 'metatrader',
      credentials: {
        platform: metaTraderPlatform.value,
        currency: metaTraderCurrency.value.trim() || 'USD',
        sourcePath: metaTraderSourcePath.value,
        sourceLabel: selectedMetaTraderSource.value?.terminalName || '',
        targetStrategyId: importTargetStrategyId.value
      },
      active: true,
      updatedAt: new Date().toISOString(),
      activatedAt: new Date().toISOString()
    }
    await persistConnections()

    refreshMetaTraderDedup()
    statusTone.value = 'success'
    statusMessage.value = `${deduped.newTrades.length} MetaTrader trades imported. ${deduped.duplicates.length} duplicates skipped.`
  } catch (error: any) {
    statusTone.value = 'error'
    statusMessage.value = error?.message || 'MetaTrader import failed.'
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

const formatModifiedLabel = (value?: number) => {
  if (!value) return 'NO_DATE'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'NO_DATE' : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
}

watch(selectedBrokerId, () => {
  statusMessage.value = ''
  statusTone.value = 'neutral'
  metaTraderPreview.value = []
  metaTraderNewCount.value = 0
  metaTraderDuplicateCount.value = 0
  resetFormForBroker()

  if (selectedBroker.value.id === 'metatrader') {
    scanMetaTraderSources()
  }
})

watch([metaTraderPlatform, metaTraderCurrency], () => {
  if (selectedBroker.value.id === 'metatrader' && metaTraderPreview.value.length) {
    refreshMetaTraderDedup()
  }
})

watch(metaTraderSourcePath, () => {
  if (selectedBroker.value.id === 'metatrader' && metaTraderSourcePath.value) {
    loadMetaTraderPreview()
  }
})

onMounted(async () => {
  await tradeStore.init()
  await loadConnections()
  if (selectedBroker.value.id === 'metatrader') {
    await scanMetaTraderSources()
  }
})
</script>
