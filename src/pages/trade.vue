<script setup>
import { ref, computed, onMounted } from 'vue'
import allAssets from '~/shared/data/global_assets.json'

const emit = defineEmits(['addTrade'])

// Asset Selection state
const showAssetMenu = ref(false)
const assetSearch = ref('')
const filteredAssets = computed(() => {
  const q = asset.value.toUpperCase()
  if (!q) return allAssets.slice(0, 10)
  return allAssets.filter(a => 
    a.symbol.toUpperCase().includes(q) || 
    a.name.toUpperCase().includes(q)
  ).slice(0, 20)
})

const selectAsset = (a) => {
  asset.value = a.symbol
  showAssetMenu.value = false
}

const failedIcons = ref(new Set())
const handleIconError = (symbol) => {
  failedIcons.value.add(symbol)
}

const currentAssetData = computed(() => {
  return allAssets.find(a => a.symbol === asset.value)
})

const closeAssetMenu = (e) => {
  if (!e.target.closest('.asset-select-container')) {
    showAssetMenu.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', closeAssetMenu)
})

// Sector Navigation
const activeSector = ref('core')
const sectors = [
  { id: 'core', label: 'Core_Logic' },
  { id: 'risk', label: 'Risk_Param' },
  { id: 'time', label: 'Temporal' }
]

// Core Data
const side = ref('long')
const asset = ref('')
const entry = ref('')
const exit = ref('')
const size = ref('')

// Risk Data
const stopLoss = ref('')
const takeProfit = ref('')

// Time Data
const openDate = ref(new Date())
const exitDate = ref(new Date())

const adjustDate = (target, unit, delta) => {
  const d = new Date(target === 'open' ? openDate.value : exitDate.value)
  if (unit === 'year') {
    d.setFullYear(d.getFullYear() + delta)
  }
  if (unit === 'month') {
    let m = d.getMonth() + delta
    if (m > 11) m = 0
    if (m < 0) m = 11
    // Handle days overflow (e.g. 31st to Feb)
    const currentDay = d.getDate()
    d.setDate(1)
    d.setMonth(m)
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    d.setDate(Math.min(currentDay, lastDay))
  }
  if (unit === 'day') {
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    let day = d.getDate() + delta
    if (day > lastDay) day = 1
    if (day < 1) day = lastDay
    d.setDate(day)
  }
  if (unit === 'hour') {
    let h = d.getHours() + delta
    if (h > 23) h = 0
    if (h < 0) h = 23
    d.setHours(h)
  }
  if (unit === 'minute') {
    let m = d.getMinutes() + delta
    if (m > 59) m = 0
    if (m < 0) m = 59
    d.setMinutes(m)
  }
  
  if (target === 'open') openDate.value = new Date(d)
  else exitDate.value = new Date(d)
}

const formatPart = (date, unit) => {
  const d = new Date(date)
  if (unit === 'year') return d.getFullYear()
  if (unit === 'month') return (d.getMonth() + 1).toString().padStart(2, '0')
  if (unit === 'day') return d.getDate().toString().padStart(2, '0')
  if (unit === 'hour') return d.getHours().toString().padStart(2, '0')
  if (unit === 'minute') return d.getMinutes().toString().padStart(2, '0')
}

const handleManualDate = (target, unit, val) => {
  const d = new Date(target === 'open' ? openDate.value : exitDate.value)
  let v = parseInt(val)
  if (isNaN(v)) return

  if (unit === 'year') {
    d.setFullYear(v)
  }
  if (unit === 'month') {
    // Allow '0' or '1' as transient first digits
    if (val === '0' || val === '00') return 
    if (v > 12) v = 12
    if (val.length === 2 && v < 1) v = 1
    
    const currentDay = d.getDate()
    d.setDate(1)
    d.setMonth(v - 1)
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    d.setDate(Math.min(currentDay, lastDay))
  }
  if (unit === 'day') {
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    if (v > lastDay) v = lastDay
    if (val.length === 2 && v < 1) v = 1
    d.setDate(v)
  }
  if (unit === 'hour') {
    if (v > 23) v = 23
    d.setHours(v)
  }
  if (unit === 'minute') {
    if (v > 59) v = 59
    d.setMinutes(v)
  }

  if (target === 'open') openDate.value = new Date(d)
  else exitDate.value = new Date(d)

  syncTempParts()
}

const isTemporalOpen = ref(false)
const activeTemporalTarget = ref('open')

const tempDateParts = ref({
  day: '01',
  month: '01',
  year: '2024',
  hour: '00',
  minute: '00'
})

const syncTempParts = () => {
  const d = activeTemporalTarget.value === 'open' ? openDate.value : exitDate.value
  const parts = {
    day: formatPart(d, 'day'),
    month: formatPart(d, 'month'),
    year: formatPart(d, 'year').toString(),
    hour: formatPart(d, 'hour'),
    minute: formatPart(d, 'minute')
  }
  // Selective update to avoid stripping leading zeros while typing
  Object.keys(parts).forEach(k => {
    if (parseInt(tempDateParts.value[k]) !== parseInt(parts[k])) {
      tempDateParts.value[k] = parts[k]
    }
  })
}

const openTemporal = (target) => {
  activeTemporalTarget.value = target
  syncTempParts()
  isTemporalOpen.value = true
}

// Watch for target changes while open to re-sync
import { watch } from 'vue'
watch(activeTemporalTarget, () => {
  if (isTemporalOpen.value) syncTempParts()
})

const pnl = computed(() => {
  const e = Number(entry.value)
  const x = Number(exit.value)
  const s = Number(size.value)

  if (!e || !x || !s) return 0

  return side.value === 'long'
    ? (x - e) * s
    : (e - x) * s
})

const submit = () => {
  if (!entry.value || !exit.value || !size.value) return

  emit('addTrade', {
    id: Date.now(),
    asset: asset.value || 'UNTITLED',
    side: side.value,
    entry: +entry.value,
    exit: +exit.value,
    size: +size.value,
    stopLoss: +stopLoss.value,
    takeProfit: +takeProfit.value,
    openDate: openDate.value,
    exitDate: exitDate.value,
    pnl: pnl.value,
    timestamp: new Date()
  })

  entry.value = ''
  exit.value = ''
  size.value = ''
}
</script>

<template>
  <div class="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] font-sans">
    
    <!-- NIER SECTOR TABS -->
    <div class="flex ml-2">
      <div class="flex gap-0.5 bg-black p-1 border-t border-l border-r border-white/30">
        <button 
          v-for="sector in sectors" 
          :key="sector.id"
          @click="activeSector = sector.id"
          class="px-5 py-1.5 transition-all duration-300 relative group"
          :class="activeSector === sector.id ? 'bg-white text-black' : 'bg-[#111] text-white/70 hover:bg-[#222] hover:text-white'"
        >
          <span class="text-[8px] uppercase tracking-[0.4em] font-black relative z-10">{{ sector.label }}</span>
        </button>
      </div>
    </div>

    <!-- MAIN CHASSIS -->
    <div class="relative flex items-center bg-black border border-white/30 px-8 h-16 w-[950px] transition-all duration-500 shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
      
      <div class="absolute inset-0 pointer-events-none opacity-[0.08] overflow-hidden">
        <div class="w-full h-px bg-white animate-scan"></div>
      </div>

      <div class="flex items-center gap-10 flex-1 relative z-10">
        
        <!-- BLOCK: ID -->
        <div class="flex items-center gap-6 pr-8 border-r border-white/10 w-[240px] shrink-0">
          <div class="flex flex-col gap-0.5 text-left relative asset-select-container">
            <span class="text-[7px] uppercase tracking-[0.4em] font-bold text-white/40">System_ID</span>
            <div class="flex items-center gap-2">
              <div v-if="asset && currentAssetData" class="w-5 h-5 rounded-full overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center shrink-0">
                <img v-if="currentAssetData.icon && !failedIcons.has(currentAssetData.symbol)" 
                     :src="currentAssetData.icon" 
                     @error="handleIconError(currentAssetData.symbol)"
                     class="w-full h-full object-contain" />
                <span v-else class="text-[10px] font-bold text-white uppercase">{{ currentAssetData.symbol[0] }}</span>
              </div>
              <input v-model="asset" 
                     @focus="showAssetMenu = true"
                     @keydown.esc="showAssetMenu = false"
                     placeholder="UNTITLED" 
                     class="nier-input w-full uppercase truncate"/>
            </div>

            <!-- Asset Dropdown Menu -->
            <Transition name="nier-fade">
              <div v-if="showAssetMenu" class="absolute bottom-full mb-4 left-0 w-64 bg-black border border-white/30 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-[200]">
                <div class="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                  <span class="text-[8px] uppercase tracking-widest text-white/40">Registry_Archive</span>
                  <span class="text-[8px] text-white/20">{{ filteredAssets.length }}_Results</span>
                </div>
                <div class="max-h-60 overflow-y-auto custom-scrollbar">
                  <div v-for="a in filteredAssets" :key="a.symbol"
                       @click="selectAsset(a)"
                       class="group/asset flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-white/5 last:border-0 hover:bg-white transition-all">
                    <div class="w-7 h-7 rounded-full overflow-hidden border border-white/10 bg-white/5 group-hover/asset:border-black flex items-center justify-center shrink-0">
                      <img v-if="a.icon && !failedIcons.has(a.symbol)" 
                           :src="a.icon" 
                           @error="handleIconError(a.symbol)"
                           class="w-full h-full object-contain" />
                      <span v-else class="text-[12px] font-black text-white group-hover/asset:text-black uppercase">{{ a.symbol[0] }}</span>
                    </div>
                    <div class="flex flex-col flex-1 min-w-0">
                      <span class="text-[10px] font-bold tracking-widest text-white group-hover/asset:text-black">{{ a.symbol }}</span>
                      <span class="text-[8px] text-white/40 truncate group-hover/asset:text-black/60 uppercase tracking-tighter">{{ a.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <div class="flex flex-col gap-0.5 text-left">
            <span class="text-[7px] uppercase tracking-[0.4em] font-bold text-white/40">Vector</span>
            <button @click="side = side === 'long' ? 'short' : 'long'"
                    class="text-[11px] font-bold tracking-widest uppercase transition-colors"
                    :class="side === 'long' ? 'text-emerald-400' : 'text-rose-400'">
              {{ side }}
            </button>
          </div>
        </div>

        <!-- BLOCK: DYNAMIC DATA STREAM -->
        <div class="flex-1">
          <Transition name="sector-swap" mode="out-in">
            <div v-if="activeSector === 'core'" :key="'core'" class="flex items-center gap-10">
              <div class="flex flex-col gap-0.5 text-left">
                <span class="text-[7px] uppercase tracking-[0.4em] font-bold text-white/40">Entry_Lvl</span>
                <input v-model="entry" type="number" placeholder="0.00" class="nier-input w-20 font-mono"/>
              </div>
              <div class="flex flex-col gap-0.5 text-left">
                <span class="text-[7px] uppercase tracking-[0.4em] font-bold text-white/40">Exit_Lvl</span>
                <input v-model="exit" type="number" placeholder="0.00" class="nier-input w-20 font-mono"/>
              </div>
              <div class="flex flex-col gap-0.5 text-left">
                <span class="text-[7px] uppercase tracking-[0.4em] font-bold text-white/40">Unit_Qty</span>
                <input v-model="size" type="number" placeholder="1.0" class="nier-input w-16 font-mono"/>
              </div>
            </div>

            <div v-else-if="activeSector === 'risk'" :key="'risk'" class="flex items-center gap-10">
              <div class="flex flex-col gap-0.5 text-left">
                <span class="text-[7px] uppercase tracking-[0.4em] font-bold text-rose-500/60">Stop_Loss</span>
                <input v-model="stopLoss" type="number" placeholder="0.00" class="nier-input w-24 font-mono text-rose-400"/>
              </div>
              <div class="flex flex-col gap-0.5 text-left">
                <span class="text-[7px] uppercase tracking-[0.4em] font-bold text-emerald-500/60">Take_Profit</span>
                <input v-model="takeProfit" type="number" placeholder="0.00" class="nier-input w-24 font-mono text-emerald-400"/>
              </div>
            </div>

            <div v-else-if="activeSector === 'time'" :key="'time'" class="flex items-center gap-12">
              <div v-for="t in ['open', 'exit']" :key="t" 
                   @click="openTemporal(t)"
                   class="flex flex-col gap-1 cursor-pointer group/time hover:translate-y-[-2px] transition-all">
                <span class="text-[7px] uppercase tracking-[0.3em] font-bold text-white/30 group-hover/time:text-white/60 transition-colors">{{ t }}_SYNC</span>
                <div class="flex items-center gap-3 font-mono text-[11px] text-white/80 group-hover/time:text-white">
                  <span>{{ formatPart(t === 'open' ? openDate : exitDate, 'year') }}.{{ formatPart(t === 'open' ? openDate : exitDate, 'month') }}.{{ formatPart(t === 'open' ? openDate : exitDate, 'day') }}</span>
                  <span class="opacity-20">/</span>
                  <span class="tracking-widest">{{ formatPart(t === 'open' ? openDate : exitDate, 'hour') }}:{{ formatPart(t === 'open' ? openDate : exitDate, 'minute') }}</span>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- BLOCK: OUTPUT -->
        <div class="flex items-center gap-10 pl-8 border-l border-white/10 w-[240px] shrink-0 justify-end">
          <div class="flex flex-col items-end gap-0.5">
            <span class="text-[7px] uppercase tracking-[0.4em] font-bold text-white/40">Yield_Est</span>
            <div class="text-sm font-mono font-bold tabular-nums tracking-tighter"
                 :class="pnl >= 0 ? 'text-white' : 'text-rose-400'">
              {{ pnl > 0 ? '+' : '' }}{{ pnl.toFixed(2) }}
            </div>
          </div>

          <button @click="submit" class="group relative h-9 px-6 bg-white/10 border border-white/30 hover:bg-white transition-all duration-300">
            <span class="relative z-10 text-[9px] uppercase tracking-[0.5em] font-black text-white group-hover:text-black">Commit</span>
          </button>
        </div>

      </div>

      <!-- DECOR -->
      <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/40"></div>
      <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/40"></div>
      <div class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rotate-45 border border-black"></div>

    </div>

    <!-- TEMPORAL MATRIX WIDGET (Teleported for absolute centering) -->
    <Teleport to="body">
      <Transition name="nier-fade">
        <div v-if="isTemporalOpen" 
             class="fixed inset-0 z-[1000] flex items-center justify-center p-20 bg-black/60 backdrop-blur-md">
          <div class="relative w-full max-w-4xl bg-black border border-white/40 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
            
            <!-- Header -->
            <div class="flex items-center justify-between px-10 py-6 border-b border-white/10">
              <div class="flex items-center gap-4">
                <div class="w-2 h-2 bg-white rotate-45"></div>
                <span class="text-xs uppercase tracking-[0.8em] font-black text-white">Temporal_Matrix_Protocol</span>
              </div>
              <button @click="isTemporalOpen = false" class="text-[10px] uppercase tracking-widest text-white/40 hover:text-white">Exit_Module</button>
            </div>

            <!-- Body -->
            <div class="grid grid-cols-2 divide-x divide-white/5 h-[450px]">
              <!-- Target Selection -->
              <div class="flex flex-col p-10 gap-8">
                <div class="flex flex-col gap-2">
                  <span class="text-[9px] uppercase tracking-widest text-white/20">Active_Target</span>
                  <div class="flex gap-2">
                    <button v-for="t in ['open', 'exit']" :key="t"
                            @click="activeTemporalTarget = t"
                            class="flex-1 py-3 border border-white/20 text-[10px] uppercase tracking-[0.4em] transition-all"
                            :class="activeTemporalTarget === t ? 'bg-white text-black' : 'bg-transparent text-white/40 hover:bg-white/5'">
                      {{ t }}_ARCHIVE
                    </button>
                  </div>
                </div>

                <!-- Quick Actions -->
                <div class="flex flex-col gap-4 pt-4 border-t border-white/5">
                  <button @click="activeTemporalTarget === 'open' ? openDate = new Date() : exitDate = new Date()" 
                          class="w-full py-2 border border-white/10 text-[8px] uppercase tracking-widest text-white/60 hover:bg-white/10">
                    Sync_to_Current_System_Time
                  </button>
                  <button @click="exitDate = new Date(openDate)" 
                          class="w-full py-2 border border-white/10 text-[8px] uppercase tracking-widest text-white/60 hover:bg-white/10">
                    Clone_Open_Protocol_to_Exit
                  </button>
                </div>
              </div>

              <!-- Dial Interface -->
              <div class="flex flex-col p-10 justify-center">
                <div class="flex flex-col items-center gap-10">
                  <div class="flex items-center gap-4">
                    <div v-for="unit in ['day', 'month', 'year']" :key="unit" class="flex flex-col items-center gap-2">
                      <button @click="adjustDate(activeTemporalTarget, unit, 1); syncTempParts()" class="p-2 opacity-20 hover:opacity-100 transition-opacity"><div class="w-4 h-px bg-white"></div></button>
                      <input v-model="tempDateParts[unit]"
                             :maxlength="unit === 'year' ? 4 : 2"
                             @input="e => handleManualDate(activeTemporalTarget, unit, e.target.value)"
                             class="w-20 bg-transparent text-center outline-none text-4xl font-mono font-bold tracking-tighter text-white" />
                      <button @click="adjustDate(activeTemporalTarget, unit, -1); syncTempParts()" class="p-2 opacity-20 hover:opacity-100 transition-opacity"><div class="w-4 h-px bg-white"></div></button>
                      <span class="text-[7px] uppercase tracking-widest text-white/20">{{ unit }}</span>
                    </div>
                  </div>

                  <div class="w-20 h-px bg-white/10"></div>

                  <div class="flex items-center gap-6">
                    <div v-for="unit in ['hour', 'minute']" :key="unit" class="flex flex-col items-center gap-2">
                      <button @click="adjustDate(activeTemporalTarget, unit, 1); syncTempParts()" class="p-2 opacity-20 hover:opacity-100 transition-opacity"><div class="w-4 h-px bg-white"></div></button>
                      <input v-model="tempDateParts[unit]"
                             maxlength="2"
                             @input="e => handleManualDate(activeTemporalTarget, unit, e.target.value)"
                             class="w-20 bg-transparent text-center outline-none text-5xl font-mono font-bold tracking-widest text-white" />
                      <button @click="adjustDate(activeTemporalTarget, unit, -1); syncTempParts()" class="p-2 opacity-20 hover:opacity-100 transition-opacity"><div class="w-4 h-px bg-white"></div></button>
                      <span class="text-[7px] uppercase tracking-widest text-white/20">{{ unit }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Decor -->
            <div class="absolute bottom-4 left-10 flex gap-4 opacity-10">
              <div v-for="i in 5" :key="i" class="w-1 h-4 bg-white"></div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.nier-input {
  background: transparent;
  border: none;
  padding: 0;
  color: white;
  font-size: 13px;
  outline: none;
}

.nier-input::placeholder {
  color: white;
  opacity: 0.1;
}

.sector-swap-enter-active, .sector-swap-leave-active {
  transition: all 0.3s ease-out;
}
.sector-swap-enter-from { opacity: 0; transform: translateX(10px); }
.sector-swap-leave-to { opacity: 0; transform: translateX(-10px); }

.nier-fade-enter-active, .nier-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.nier-fade-enter-from, .nier-fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
  filter: blur(10px);
}

@keyframes scan {
  0% { transform: translateY(-20px); opacity: 0; }
  50% { opacity: 0.5; }
  100% { transform: translateY(80px); opacity: 0; }
}
.animate-scan {
  animation: scan 4s linear infinite;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}
</style>
