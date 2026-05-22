<template>
  <div class="flex flex-col space-y-6 text-black dark:text-white font-mono select-none">
    <!-- FILTER HEADER -->
    <div class="flex items-center justify-between pb-4 text-xs">
      <div class="flex items-center space-x-4">
        <span class="font-black uppercase tracking-widest">Filters</span>
        <span v-if="activeFilterCount > 0" class="opacity-40 text-[10px] uppercase">({{ activeFilterCount }} Active)</span>
        <button v-if="activeFilterCount > 0" @click="resetAllFilters" class="text-[10px] opacity-40 hover:opacity-100 uppercase transition-opacity">
          [Reset]
        </button>
      </div>
      <div class="flex items-center space-x-6">
        <div class="flex items-center space-x-3 pr-4 border-r border-black/10 dark:border-white/10">
          <button @click="colorMode = 'monochrome'" class="relative w-4 h-4 transition-all group" title="Monochrome">
            <div class="absolute top-0.5 left-0.5 w-1.5 h-1.5 border border-black dark:border-white transition-opacity" :class="colorMode === 'monochrome' ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'"></div>
            <div class="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-black dark:bg-white transition-opacity" :class="colorMode === 'monochrome' ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'"></div>
          </button>
          <button @click="colorMode = 'colorful'" class="relative w-4 h-4 transition-all group" title="Colorful">
            <div class="absolute top-0.5 left-0.5 w-1.5 h-1.5 border border-red-500 transition-opacity" :class="colorMode === 'colorful' ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'"></div>
            <div class="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-green-500 transition-opacity" :class="colorMode === 'colorful' ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'"></div>
          </button>
        </div>
        <button @click="isExtended = !isExtended" class="font-black uppercase tracking-widest hover:opacity-70 transition-opacity">
          {{ isExtended ? '[-] Collapse' : '[+] Expand' }}
        </button>
      </div>
    </div>

    <!-- ACTIVE FILTER CHIPS -->
    <div v-if="activeFilterChips.length > 0" class="flex flex-wrap gap-2 pb-4 border-b border-black/10 dark:border-white/10">
      <button 
        v-for="chip in activeFilterChips" 
        :key="chip.id"
        @click="removeFilterChip(chip.id)"
        class="flex items-center space-x-2 px-2 py-1 bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-[9px] uppercase group"
      >
        <span class="opacity-50">{{ chip.type }}:</span>
        <span class="font-bold">{{ chip.label }}</span>
        <span class="opacity-40 group-hover:opacity-100 group-hover:text-red-500 transition-colors ml-1">✕</span>
      </button>
    </div>

    <!-- COMMAND CENTER (EXTENDED FILTER PANEL) -->
    <div v-if="isExtended" class="flex flex-col space-y-8 pt-4 pb-8 animate-[fadeIn_0.3s_ease-out]">
      
      <!-- CATEGORY 1: TACTICAL METADATA -->
      <div class="flex flex-col space-y-4">
        <h3 class="text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-black/10 dark:border-white/10 pb-2">Tactical Metadata</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="flex flex-col space-y-2">
            <span class="text-[9px] opacity-60 uppercase">Scenario</span>
            <div class="flex flex-wrap gap-1.5">
              <button 
                v-for="item in scenariosList.filter(i => i.id !== 'ALL')" 
                :key="item.id"
                @click="selectedScenario = selectedScenario === item.id ? 'ALL' : item.id"
                class="px-2 py-1 text-[9px] uppercase border transition-colors"
                :class="selectedScenario === item.id ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold' : 'border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
          <div class="flex flex-col space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-[9px] opacity-60 uppercase">Condition</span>
              <button 
                v-if="selectedCondition.length > 0"
                @click="conditionMatchMode = conditionMatchMode === 'INCLUDED' ? 'EXACT' : 'INCLUDED'"
                class="px-2 py-0.5 text-[8px] uppercase border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center space-x-1 rounded"
                title="Toggle condition matching mode"
              >
                <span class="opacity-60">Mode:</span>
                <span class="font-bold">{{ conditionMatchMode === 'INCLUDED' ? 'INCLUDED' : 'ALONE' }}</span>
              </button>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button 
                v-for="item in conditionsList.filter(i => i.id !== 'ALL')" 
                :key="item.id"
                @click="if (selectedCondition.includes(item.id)) selectedCondition = selectedCondition.filter(x => x !== item.id); else selectedCondition.push(item.id)"
                class="px-2 py-1 text-[9px] uppercase border transition-colors"
                :class="selectedCondition.includes(item.id) ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold' : 'border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
          <div class="flex flex-col space-y-2">
            <span class="text-[9px] opacity-60 uppercase">Direction</span>
            <div class="flex flex-wrap gap-1.5">
              <button 
                v-for="item in directionList.filter(i => i.id !== 'ALL')" 
                :key="item.id"
                @click="selectedDirection = selectedDirection === item.id ? 'ALL' : item.id"
                class="px-2 py-1 text-[9px] uppercase border transition-colors"
                :class="selectedDirection === item.id ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold' : 'border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CATEGORY 2: ASSET & OUTCOME -->
      <div class="flex flex-col space-y-4">
        <h3 class="text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-black/10 dark:border-white/10 pb-2">Asset & Outcome</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="flex flex-col space-y-2">
            <span class="text-[9px] opacity-60 uppercase">Asset</span>
            <div class="flex flex-wrap gap-1.5">
              <button 
                v-for="item in assetsList.filter(i => i.id !== 'ALL')" 
                :key="item.id"
                @click="selectedAsset = selectedAsset === item.id ? 'ALL' : item.id"
                class="px-2 py-1 text-[9px] uppercase border transition-colors"
                :class="selectedAsset === item.id ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold' : 'border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
          <div class="flex flex-col space-y-2">
            <span class="text-[9px] opacity-60 uppercase">Status</span>
            <div class="flex flex-wrap gap-1.5">
              <button 
                v-for="item in statusList.filter(i => i.id !== 'ALL')" 
                :key="item.id"
                @click="selectedStatus = selectedStatus === item.id ? 'ALL' : item.id"
                class="px-2 py-1 text-[9px] uppercase border transition-colors"
                :class="selectedStatus === item.id ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold' : 'border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
          <div class="flex flex-col space-y-2">
            <span class="text-[9px] opacity-60 uppercase">Profit Tier</span>
            <div class="flex flex-wrap gap-1.5">
              <button 
                v-for="item in profitTierList.filter(i => i.id !== 'ALL')" 
                :key="item.id"
                @click="selectedProfitTier = selectedProfitTier === item.id ? 'ALL' : item.id"
                class="px-2 py-1 text-[9px] uppercase border transition-colors"
                :class="selectedProfitTier === item.id ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold' : 'border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'"
              >
                {{ item.label }}
              </button>
            </div>
            <div v-if="selectedProfitTier === 'CUSTOM'" class="flex items-center space-x-2 pt-1 animate-[fadeIn_0.2s_ease-out]">
              <input 
                v-model.number="customProfitMin" 
                type="number" 
                placeholder="Min %" 
                class="w-20 px-2 py-1 text-[9px] bg-transparent border border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span class="text-[9px] opacity-40">..</span>
              <input 
                v-model.number="customProfitMax" 
                type="number" 
                placeholder="Max %" 
                class="w-20 px-2 py-1 text-[9px] bg-transparent border border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white outline-none font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span class="text-[9px] opacity-40">%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- CATEGORY 3: TEMPORAL & DURATION -->
      <div class="flex flex-col space-y-4">
        <h3 class="text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-black/10 dark:border-white/10 pb-2">Temporal Control</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="flex flex-col space-y-2">
            <span class="text-[9px] opacity-60 uppercase">Year</span>
            <div class="flex flex-wrap gap-1.5">
              <button 
                v-for="item in yearList.filter(i => i.id !== 'ALL')" 
                :key="item.id"
                @click="selectedYear = selectedYear === item.id ? 'ALL' : item.id"
                class="px-2 py-1 text-[9px] uppercase border transition-colors"
                :class="selectedYear === item.id ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold' : 'border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
          <div class="flex flex-col space-y-2">
            <span class="text-[9px] opacity-60 uppercase">Date Interval</span>
            <div class="flex flex-wrap gap-1.5">
              <button 
                v-for="item in dateIntervalList.filter(i => i.id !== 'ALL')" 
                :key="item.id"
                @click="selectedDateInterval = selectedDateInterval === item.id ? 'ALL' : item.id"
                class="px-2 py-1 text-[9px] uppercase border transition-colors"
                :class="selectedDateInterval === item.id ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold' : 'border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100'"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- PRECISION SLIDERS -->
      <div class="flex flex-col space-y-4 pt-4 border-t border-black/10 dark:border-white/10">
        <h3 class="text-[10px] font-black uppercase tracking-widest opacity-40 pb-2">Precision Windows</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- 1. EXACT TIME SLIDER -->
          <div class="flex flex-col space-y-1 w-full px-4">
            <div class="flex items-center justify-between text-[9px]">
              <span class="opacity-60 uppercase">Time Window</span>
            </div>
            <div 
              ref="timeTrackRef"
              class="relative h-px bg-black/20 dark:bg-white/20 my-3 cursor-pointer"
              @click="onTimeTrackClick"
            >
              <div class="absolute h-px bg-black dark:bg-white" :style="{ left: `${timeMinPercent}%`, right: `${100 - timeMaxPercent}%` }"></div>
              <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-[#070707] border border-black dark:border-white rotate-45 cursor-ew-resize z-10" :style="{ left: `${timeMinPercent}%` }" @mousedown.stop="startTimeMinDrag"></div>
              <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-[#070707] border border-black dark:border-white rotate-45 cursor-ew-resize z-10" :style="{ left: `${timeMaxPercent}%` }" @mousedown.stop="startTimeMaxDrag"></div>
              
              <div class="absolute top-4 -translate-x-1/2 text-[9px] font-mono whitespace-nowrap opacity-60" :style="{ left: `${timeMinPercent}%` }">{{ minTimeDisplay }}</div>
              <div class="absolute top-4 -translate-x-1/2 text-[9px] font-mono whitespace-nowrap opacity-60" :style="{ left: `${timeMaxPercent}%` }">{{ maxTimeDisplay }}</div>
            </div>
          </div>

          <!-- 2. DURATION SLIDER -->
          <div class="flex flex-col space-y-1 w-full px-4">
            <div class="flex items-center justify-between text-[9px]">
              <span class="opacity-60 uppercase">Duration Window</span>
            </div>
            <div 
              ref="durationTrackRef"
              class="relative h-px bg-black/20 dark:bg-white/20 my-3 cursor-pointer"
              @click="onDurationTrackClick"
            >
              <div class="absolute h-px bg-black dark:bg-white" :style="{ left: `${durationMinPercent}%`, right: `${100 - durationMaxPercent}%` }"></div>
              <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-[#070707] border border-black dark:border-white rotate-45 cursor-ew-resize z-10" :style="{ left: `${durationMinPercent}%` }" @mousedown.stop="startDurationMinDrag"></div>
              <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-[#070707] border border-black dark:border-white rotate-45 cursor-ew-resize z-10" :style="{ left: `${durationMaxPercent}%` }" @mousedown.stop="startDurationMaxDrag"></div>
              
              <div class="absolute top-4 -translate-x-1/2 text-[9px] font-mono whitespace-nowrap opacity-60" :style="{ left: `${durationMinPercent}%` }">{{ minDurationDisplay }}</div>
              <div class="absolute top-4 -translate-x-1/2 text-[9px] font-mono whitespace-nowrap opacity-60" :style="{ left: `${durationMaxPercent}%` }">{{ maxDurationDisplay }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VERTICAL TRADE REGISTRY -->
    <div class="flex flex-col space-y-3 font-mono text-xs pt-2 select-none">
      <!-- TABLE CONTROLS & HEADER GRID -->
      <div class="flex items-center justify-between pb-1 text-[10px] opacity-60 uppercase tracking-widest px-2">
        <div class="flex items-center space-x-3">
          <button @click="toggleSelectAllTrades" class="hover:opacity-100 transition-opacity font-bold">
            {{ isAllSelected ? '[Deselect All]' : '[Select All]' }}
          </button>
          <span v-if="selectedTradeIds.length > 0" class="opacity-70">({{ selectedTradeIds.length }} Selected)</span>
          <button v-if="selectedTradeIds.length > 0" @click="removeSelectedTrades" class="hover:opacity-100 transition-opacity font-bold text-red-500">
            [Remove]
          </button>
        </div>
      </div>

      <div class="grid grid-cols-4 items-center pb-3 border-b border-black/10 dark:border-white/10 text-[10px] opacity-40 uppercase tracking-widest px-2">
        <div class="flex items-center space-x-3">
          <button @click.stop="toggleSelectAllTrades" class="w-3.5 h-3.5 border border-black dark:border-white flex items-center justify-center transition-all hover:opacity-100 shrink-0" :class="isAllSelected ? 'bg-black dark:bg-white text-white dark:text-black opacity-100' : 'opacity-40'">
            <span v-if="isAllSelected" class="text-[8px] font-bold">✓</span>
            <span v-else-if="selectedTradeIds.length > 0" class="text-[8px] font-bold">-</span>
          </button>
          <span>Direction</span>
        </div>
        <span>Asset</span>
        <span class="text-right">Duration</span>
        <span class="text-right">Result</span>
      </div>

      <div v-if="filteredTrades.length === 0" class="py-16 text-center opacity-40 text-xs uppercase tracking-widest">
        No Results
      </div>

      <!-- TRADE ROWS -->
      <div v-else class="flex flex-col space-y-3.5 pt-2">
        <div 
          v-for="trade in filteredTrades" 
          :key="trade.id"
          class="flex flex-col group transition-opacity duration-150 border-b border-black/5 dark:border-white/5 pb-2"
        >
          <!-- ROW GRID -->
          <div 
            class="grid grid-cols-4 items-center py-3 px-2 cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity" 
            @click="toggleTradeExpand(trade.id)"
          >
            <div class="flex items-center space-x-3 truncate">
              <button @click.stop="toggleSelectTrade(trade.id)" class="w-3.5 h-3.5 border border-black dark:border-white flex items-center justify-center transition-all hover:opacity-100 shrink-0" :class="selectedTradeIds.includes(trade.id) ? 'bg-black dark:bg-white text-white dark:text-black opacity-100' : 'opacity-30'">
                <span v-if="selectedTradeIds.includes(trade.id)" class="text-[8px] font-bold">✓</span>
              </button>
              <span class="w-1 h-1 rounded-full shrink-0" :class="colorMode === 'colorful' ? (trade.status === 'WIN' ? 'bg-green-500' : trade.status === 'LOSS' ? 'bg-red-500' : 'bg-yellow-500') : (trade.status === 'WIN' ? 'bg-black dark:bg-white' : trade.status === 'LOSS' ? 'bg-black/30 dark:bg-white/30' : 'bg-black/60 dark:bg-white/60')"></span>
              <span class="font-bold uppercase tracking-widest">{{ trade.direction }}</span>
            </div>
            
            <span class="opacity-60 uppercase tracking-wider truncate">{{ trade.asset }}</span>
            <span class="opacity-40 text-right tracking-wider truncate">{{ trade.duration }}</span>
            <span class="font-bold text-right tracking-wider" :class="colorMode === 'colorful' ? (trade.profitValue > 0 ? 'text-green-500' : trade.profitValue < 0 ? 'text-red-500' : 'text-yellow-500') : ''">{{ trade.profitValue > 0 ? '+' : '' }}{{ trade.profitValue }}%</span>
          </div>

          <!-- EXPANDED TELEMETRY -->
          <div v-if="expandedTradeId === trade.id" class="my-2 ml-2 pl-6 border-l border-black/20 dark:border-white/20 flex flex-col space-y-6 py-3 text-[11px] opacity-80 animate-[fadeIn_0.2s_ease-out]">
            <!-- TRADE EXECUTION DATA GRID -->
            <div class="flex flex-col space-y-2">
              <div class="flex items-center justify-between">
                <span class="block text-[9px] opacity-40 uppercase tracking-widest">// Execution Metrics</span>
                <button @click.stop="toggleTradeExpand(trade.id)" class="text-[9px] uppercase opacity-40 hover:opacity-100 font-bold tracking-widest transition-opacity">
                  [Close]
                </button>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 font-mono text-[10px]">
                <div class="flex flex-col">
                  <span class="opacity-40 text-[9px] uppercase tracking-wider">Entry Price</span>
                  <span class="font-bold mt-0.5 text-xs">{{ trade.entryPrice }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="opacity-40 text-[9px] uppercase tracking-wider">Exit Price</span>
                  <span class="font-bold mt-0.5 text-xs">{{ trade.exitPrice }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="opacity-40 text-[9px] uppercase tracking-wider">Position Size</span>
                  <span class="font-bold mt-0.5 text-xs">{{ trade.size }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="opacity-40 text-[9px] uppercase tracking-wider">Result</span>
                  <span class="font-bold mt-0.5 text-xs" :class="colorMode === 'colorful' ? (trade.profitInCurrency > 0 ? 'text-green-500' : trade.profitInCurrency < 0 ? 'text-red-500' : 'text-yellow-500') : ''">{{ trade.profitInCurrency > 0 ? '+' : '' }}${{ trade.profitInCurrency }} ({{ trade.profitValue > 0 ? '+' : '' }}{{ trade.profitValue }}%)</span>
                </div>
                <div class="flex flex-col">
                  <span class="opacity-40 text-[9px] uppercase tracking-wider">Duration</span>
                  <span class="font-bold mt-0.5">{{ trade.duration }}</span>
                </div>
                <div class="flex flex-col sm:col-span-1">
                  <span class="opacity-40 text-[9px] uppercase tracking-wider">Stop Loss</span>
                  <span class="font-bold mt-0.5">{{ trade.stopLoss || 'NONE' }}</span>
                </div>
                <div class="flex flex-col sm:col-span-1">
                  <span class="opacity-40 text-[9px] uppercase tracking-wider">Take Profit</span>
                  <span class="font-bold mt-0.5">{{ trade.takeProfit || 'NONE' }}</span>
                </div>
                <div class="flex flex-col sm:col-span-1">
                  <span class="opacity-40 text-[9px] uppercase tracking-wider">Date Entry</span>
                  <span class="font-bold mt-0.5 opacity-80">{{ trade.dateEntryStr }}</span>
                </div>
                <div class="flex flex-col sm:col-span-1">
                  <span class="opacity-40 text-[9px] uppercase tracking-wider">Date Exit</span>
                  <span class="font-bold mt-0.5 opacity-80">{{ trade.dateExitStr }}</span>
                </div>
              </div>
            </div>

            <!-- ATTACHED NOTES -->
            <div class="flex flex-col space-y-3">
              <span class="block text-[9px] opacity-40 uppercase tracking-widest">// Attached Notes ({{ trade.notes.length }})</span>
              <div class="flex flex-col space-y-1.5 pt-1">
                <div 
                  v-for="(note, nIdx) in trade.notes" 
                  :key="note.id" 
                  class="flex flex-col py-1.5 border-b border-black/10 dark:border-white/10 cursor-pointer group"
                  @click.stop="onNoteClick(trade.id, note.id)"
                >
                  <div class="flex items-center justify-between text-[10px] font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                    <div class="flex items-center space-x-2 truncate pr-2">
                      <span class="font-bold">[{{ note.author }}]</span>
                      <span class="truncate">{{ note.text ? note.text.slice(0, 40) + (note.text.length > 40 ? '...' : '') : `Note #${nIdx + 1}` }}</span>
                    </div>
                    <span class="shrink-0 text-[9px] opacity-40 group-hover:opacity-100">[OPEN]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  trades?: any[]
}>()

const emit = defineEmits<{
  (e: 'open-note', payload: { tradeId: string; noteId: string }): void
}>()

const isExtended = ref(false)
const expandedTradeId = ref<string | null>(null)
const colorMode = ref<'monochrome' | 'colorful'>('monochrome')

const toggleTradeExpand = (tradeId: string) => {
  expandedTradeId.value = expandedTradeId.value === tradeId ? null : tradeId
}

const onNoteClick = (tradeId: string, noteId: string) => {
  emit('open-note', { tradeId, noteId })
}

const activeFilterChips = computed(() => {
  const chips: { id: string, type: string, label: string }[] = []
  if (selectedScenario.value !== 'ALL') chips.push({ id: 'scenario', type: 'SCENARIO', label: scenariosList.value.find(x => x.id === selectedScenario.value)?.label || selectedScenario.value })
  if (selectedCondition.value.length > 0) {
    selectedCondition.value.forEach(condId => {
      chips.push({ id: `condition-${condId}`, type: 'CONDITION', label: conditionsList.value.find(x => x.id === condId)?.label || condId })
    })
  }
  if (selectedDirection.value !== 'ALL') chips.push({ id: 'direction', type: 'DIRECTION', label: directionList.find(x => x.id === selectedDirection.value)?.label || selectedDirection.value })
  if (selectedAsset.value !== 'ALL') chips.push({ id: 'asset', type: 'ASSET', label: assetsList.value.find(x => x.id === selectedAsset.value)?.label || selectedAsset.value })
  if (selectedStatus.value !== 'ALL') chips.push({ id: 'status', type: 'STATUS', label: statusList.find(x => x.id === selectedStatus.value)?.label || selectedStatus.value })
  if (selectedProfitTier.value !== 'ALL') {
    const label = selectedProfitTier.value === 'CUSTOM'
      ? `${customProfitMin.value !== null && customProfitMin.value !== '' as any ? customProfitMin.value : '-∞'}% .. ${customProfitMax.value !== null && customProfitMax.value !== '' as any ? customProfitMax.value : '+∞'}%`
      : profitTierList.find(x => x.id === selectedProfitTier.value)?.label || selectedProfitTier.value
    chips.push({ id: 'profitTier', type: 'PROFIT', label })
  }
  if (selectedYear.value !== 'ALL') chips.push({ id: 'year', type: 'YEAR', label: yearList.find(x => x.id === selectedYear.value)?.label || selectedYear.value })
  if (selectedDateInterval.value !== 'ALL') chips.push({ id: 'dateInterval', type: 'DATE', label: dateIntervalList.find(x => x.id === selectedDateInterval.value)?.label || selectedDateInterval.value })
  return chips
})

const removeFilterChip = (id: string) => {
  if (id === 'scenario') selectedScenario.value = 'ALL'
  if (id.startsWith('condition-')) {
    const condId = id.replace('condition-', '')
    selectedCondition.value = selectedCondition.value.filter(x => x !== condId)
  }
  if (id === 'direction') selectedDirection.value = 'ALL'
  if (id === 'asset') selectedAsset.value = 'ALL'
  if (id === 'status') selectedStatus.value = 'ALL'
  if (id === 'profitTier') {
    selectedProfitTier.value = 'ALL'
    customProfitMin.value = null
    customProfitMax.value = null
  }
  if (id === 'year') selectedYear.value = 'ALL'
  if (id === 'dateInterval') selectedDateInterval.value = 'ALL'
}



const ABS_MIN_TIME_MIN = 0
const ABS_MAX_TIME_MIN = 1440
const minTimeMinute = ref(ABS_MIN_TIME_MIN)
const maxTimeMinute = ref(ABS_MAX_TIME_MIN)

const timeMinPercent = computed(() => (minTimeMinute.value / 1440) * 100)
const timeMaxPercent = computed(() => (maxTimeMinute.value / 1440) * 100)

const formatTimeMinuteStr = (mins: number) => {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const hh = h < 10 ? '0' + h : h
  const mm = m < 10 ? '0' + m : m
  return `${hh}:${mm}`
}

const minTimeDisplay = computed(() => minTimeMinute.value === ABS_MIN_TIME_MIN && maxTimeMinute.value === ABS_MAX_TIME_MIN ? 'All Times' : formatTimeMinuteStr(minTimeMinute.value))
const maxTimeDisplay = computed(() => minTimeMinute.value === ABS_MIN_TIME_MIN && maxTimeMinute.value === ABS_MAX_TIME_MIN ? '' : formatTimeMinuteStr(maxTimeMinute.value))

const ABS_MIN_DURATION = 0
const ABS_MAX_DURATION = 720
const minDuration = ref(ABS_MIN_DURATION)
const maxDuration = ref(ABS_MAX_DURATION)
const durationMinPercent = computed(() => (minDuration.value / ABS_MAX_DURATION) * 100)
const durationMaxPercent = computed(() => (maxDuration.value / ABS_MAX_DURATION) * 100)
const minDurationDisplay = computed(() => minDuration.value === ABS_MIN_DURATION && maxDuration.value === ABS_MAX_DURATION ? 'All Durations' : `${minDuration.value}m`)
const maxDurationDisplay = computed(() => minDuration.value === ABS_MIN_DURATION && maxDuration.value === ABS_MAX_DURATION ? '' : maxDuration.value === ABS_MAX_DURATION ? 'Unlimited' : `${maxDuration.value}m`)

const selectedScenario = ref('ALL')
const selectedCondition = ref<string[]>([])
const conditionMatchMode = ref<'INCLUDED' | 'EXACT'>('INCLUDED')
const selectedAsset = ref('ALL')
const selectedStatus = ref('ALL')
const selectedDirection = ref('ALL')
const selectedYear = ref('ALL')

const statusList = [
  { id: 'ALL', label: 'ALL' },
  { id: 'WIN', label: 'WIN' },
  { id: 'LOSS', label: 'LOSS' },
  { id: 'SCRATCH', label: 'SCRATCH' }
]

const directionList = [
  { id: 'ALL', label: 'ALL' },
  { id: 'LONG', label: 'LONG' },
  { id: 'SHORT', label: 'SHORT' }
]

const yearList = [
  { id: 'ALL', label: 'ALL' },
  { id: '2026', label: '2026' },
  { id: '2025', label: '2025' },
  { id: '2024', label: '2024' },
  { id: '2023', label: '2023' },
  { id: '2022', label: '2022' },
  { id: '2021', label: '2021' },
  { id: '2020', label: '2020' },
  { id: '1800-2019', label: '1800-2019' }
]

const selectedProfitTier = ref('ALL')
const customProfitMin = ref<number | null>(null)
const customProfitMax = ref<number | null>(null)

const profitTierList = [
  { id: 'ALL', label: 'ALL' },
  { id: 'MEGA_GAIN', label: '> +2000%' },
  { id: 'SUPER_GAIN', label: '+1000% .. +2000%' },
  { id: 'HIGH_GAIN', label: '+500% .. +1000%' },
  { id: 'MODERATE_GAIN', label: '0% .. +500%' },
  { id: 'MODERATE_LOSS', label: '-500% .. 0%' },
  { id: 'HEAVY_LOSS', label: '< -500%' },
  { id: 'CUSTOM', label: 'CUSTOM RANGE' }
]

const selectedDateInterval = ref('ALL')
const dateIntervalList = [
  { id: 'ALL', label: 'ALL' },
  { id: 'FIRST_HALF', label: 'Days 01 .. 15' },
  { id: 'SECOND_HALF', label: 'Days 16 .. 31' },
  { id: 'EARLY_MONTH', label: 'Days 01 .. 10' },
  { id: 'MID_MONTH', label: 'Days 11 .. 20' },
  { id: 'LATE_MONTH', label: 'Days 21 .. 31' }
]

const mockTrades = ref([
  {
    id: 'TRD-01',
    scenario: 'Tactical_Entry_Alpha',
    condition: 'Market_Structure_Break',
    profitValue: 1250,
    timeValue: 12,
    dateTime: '10.05.2026',
    duration: '45m',
    durationMinutes: 45,
    status: 'WIN',
    asset: 'BTC/USD',
    session: 'NEW_YORK',
    direction: 'LONG',
    notes: [
      { id: 'n1-1', text: 'Clean impulse over VWAP. High relative volume detected.', timestamp: '10.05 // 23:05', author: 'SYSTEM_ALPHA' },
      { id: 'n1-2', text: 'Partial profit taken at 2R. Trailing stop activated.', timestamp: '10.05 // 23:30', author: 'TRADER' },
      { id: 'n1-3', text: 'Position closed at target. Reification complete.', timestamp: '10.05 // 23:49', author: 'TRADER' }
    ]
  },
  {
    id: 'TRD-02',
    scenario: 'Sniper_Pullback_Bravo',
    condition: 'VWAP_Reclamation',
    profitValue: -450,
    timeValue: 22,
    dateTime: '11.05.2026',
    duration: '15m',
    durationMinutes: 15,
    status: 'LOSS',
    asset: 'ETH/USD',
    session: 'LONDON',
    direction: 'SHORT',
    notes: [
      { id: 'n2-1', text: 'Entered on lower timeframe liquidity sweep.', timestamp: '11.05 // 18:16', author: 'TRADER' },
      { id: 'n2-2', text: 'Unexpected absorption at key support level. Stop loss triggered.', timestamp: '11.05 // 18:31', author: 'SYSTEM_BRAVO' }
    ]
  },
  {
    id: 'TRD-03',
    scenario: 'Breakout_Core_Gamma',
    condition: 'Delta_Divergence',
    profitValue: 3420,
    timeValue: 35,
    dateTime: '12.05.2026',
    duration: '2h 10m',
    durationMinutes: 130,
    status: 'WIN',
    asset: 'SOL/USD',
    session: 'NEW_YORK',
    direction: 'LONG',
    notes: [
      { id: 'n3-1', text: 'Massive cumulative delta divergence breakout identified.', timestamp: '12.05 // 19:23', author: 'SYSTEM_GAMMA' },
      { id: 'n3-2', text: 'Pyramiding added on first consolidation flag.', timestamp: '12.05 // 20:15', author: 'TRADER' },
      { id: 'n3-3', text: 'Full exit on climatic volume spike.', timestamp: '12.05 // 21:33', author: 'TRADER' }
    ]
  },
  {
    id: 'TRD-04',
    scenario: 'Liquidity_Grab_Delta',
    condition: 'Orderflow_Imbalance',
    profitValue: 890,
    timeValue: 48,
    dateTime: '13.05.2026',
    duration: '32m',
    durationMinutes: 32,
    status: 'WIN',
    asset: 'AVAX/USD',
    session: 'ASIA',
    direction: 'SHORT',
    notes: [
      { id: 'n4-1', text: 'Aggressive absorption at session low. Short entry executed.', timestamp: '13.05 // 20:06', author: 'TRADER' },
      { id: 'n4-2', text: 'Quick scalp exit achieved at previous day POC.', timestamp: '13.05 // 20:38', author: 'TRADER' }
    ]
  },
  {
    id: 'TRD-05',
    scenario: 'Tactical_Entry_Alpha',
    condition: 'VWAP_Reclamation',
    profitValue: -150,
    timeValue: 55,
    dateTime: '14.05.2026',
    duration: '12m',
    durationMinutes: 12,
    status: 'SCRATCH',
    asset: 'BTC/USD',
    session: 'LONDON',
    direction: 'LONG',
    notes: [
      { id: 'n5-1', text: 'Long entry on VWAP test.', timestamp: '14.05 // 09:31', author: 'TRADER' },
      { id: 'n5-2', text: 'Manual abort due to stalling momentum and orderflow divergence.', timestamp: '14.05 // 09:43', author: 'TRADER' }
    ]
  },
  {
    id: 'TRD-06',
    scenario: 'Breakout_Core_Gamma',
    condition: 'Volume_Profile_POC',
    profitValue: 5400,
    timeValue: 65,
    dateTime: '15.05.2026',
    duration: '4h 25m',
    durationMinutes: 265,
    status: 'WIN',
    asset: 'ETH/USD',
    session: 'NEW_YORK',
    direction: 'LONG',
    notes: [
      { id: 'n6-1', text: 'Perfect bounce off Point of Control. Core position established.', timestamp: '15.05 // 04:46', author: 'SYSTEM_GAMMA' },
      { id: 'n6-2', text: 'Holding through New York open volatility.', timestamp: '15.05 // 07:30', author: 'TRADER' },
      { id: 'n6-3', text: 'Final target hit. Exceptional risk-reward capture.', timestamp: '15.05 // 09:11', author: 'TRADER' }
    ]
  },
  {
    id: 'TRD-07',
    scenario: 'Sniper_Pullback_Bravo',
    condition: 'Market_Structure_Break',
    profitValue: 2100,
    timeValue: 72,
    dateTime: '15.05.2026',
    duration: '1h 05m',
    durationMinutes: 65,
    status: 'WIN',
    asset: 'SOL/USD',
    session: 'LONDON',
    direction: 'SHORT',
    notes: [
      { id: 'n7-1', text: 'Textbook lower timeframe market structure shift.', timestamp: '15.05 // 22:11', author: 'TRADER' },
      { id: 'n7-2', text: 'Target reached cleanly without drawdown.', timestamp: '15.05 // 23:16', author: 'SYSTEM_BRAVO' }
    ]
  },
  {
    id: 'TRD-08',
    scenario: 'Liquidity_Grab_Delta',
    condition: 'Delta_Divergence',
    profitValue: -620,
    timeValue: 80,
    dateTime: '16.05.2026',
    duration: '20m',
    durationMinutes: 20,
    status: 'LOSS',
    asset: 'BTC/USD',
    session: 'ASIA',
    direction: 'LONG',
    notes: [
      { id: 'n8-1', text: 'Attempted long on liquidity grab.', timestamp: '16.05 // 13:41', author: 'TRADER' },
      { id: 'n8-2', text: 'Failed breakdown. High slippage on stop execution.', timestamp: '16.05 // 14:01', author: 'SYSTEM_DELTA' }
    ]
  },
  {
    id: 'TRD-09',
    scenario: 'Tactical_Entry_Alpha',
    condition: 'Orderflow_Imbalance',
    profitValue: 1650,
    timeValue: 85,
    dateTime: '16.05.2026',
    duration: '50m',
    durationMinutes: 50,
    status: 'WIN',
    asset: 'AVAX/USD',
    session: 'NEW_YORK',
    direction: 'LONG',
    notes: [
      { id: 'n9-1', text: 'Stacked imbalance on the ask detected by scanner.', timestamp: '16.05 // 23:16', author: 'SYSTEM_ALPHA' },
      { id: 'n9-2', text: 'Clean continuation. Exit on momentum divergence.', timestamp: '16.05 // 00:06', author: 'TRADER' }
    ]
  },
  {
    id: 'TRD-10',
    scenario: 'Sniper_Pullback_Bravo',
    condition: 'Volume_Profile_POC',
    profitValue: 430,
    timeValue: 90,
    dateTime: '17.05.2026',
    duration: '18m',
    durationMinutes: 18,
    status: 'WIN',
    asset: 'ETH/USD',
    session: 'LONDON',
    direction: 'SHORT',
    notes: [
      { id: 'n10-1', text: 'Quick scalp off value area low.', timestamp: '17.05 // 08:31', author: 'TRADER' },
      { id: 'n10-2', text: 'Target filled instantly.', timestamp: '17.05 // 08:49', author: 'TRADER' }
    ]
  },
  {
    id: 'TRD-11',
    scenario: 'Breakout_Core_Gamma',
    condition: 'Market_Structure_Break',
    profitValue: -880,
    timeValue: 95,
    dateTime: '17.05.2026',
    duration: '35m',
    durationMinutes: 35,
    status: 'LOSS',
    asset: 'SOL/USD',
    session: 'NEW_YORK',
    direction: 'LONG',
    notes: [
      { id: 'n11-1', text: 'Breakout entry on high timeframe resistance break.', timestamp: '17.05 // 18:01', author: 'TRADER' },
      { id: 'n11-2', text: 'Fakeout trap. Heavy aggressive selling triggered stop loss.', timestamp: '17.05 // 18:36', author: 'SYSTEM_GAMMA' }
    ]
  },
  {
    id: 'TRD-12',
    scenario: 'Liquidity_Grab_Delta',
    condition: 'VWAP_Reclamation',
    profitValue: 3950,
    timeValue: 98,
    dateTime: '17.05.2026',
    duration: '1h 50m',
    durationMinutes: 110,
    status: 'WIN',
    asset: 'BTC/USD',
    session: 'ASIA',
    direction: 'LONG',
    notes: [
      { id: 'n12-1', text: 'Massive short squeeze reclamation setup.', timestamp: '17.05 // 23:46', author: 'SYSTEM_DELTA' },
      { id: 'n12-2', text: 'Pyramiding executed at VWAP retest.', timestamp: '18.05 // 00:30', author: 'TRADER' },
      { id: 'n12-3', text: 'Full liquidation at macro liquidity pool.', timestamp: '18.05 // 01:36', author: 'TRADER' }
    ]
  }
])

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedScenario.value !== 'ALL') count++
  if (selectedCondition.value.length > 0) count += selectedCondition.value.length
  if (selectedAsset.value !== 'ALL') count++
  if (selectedStatus.value !== 'ALL') count++
  if (selectedDirection.value !== 'ALL') count++
  if (selectedYear.value !== 'ALL') count++
  if (selectedProfitTier.value !== 'ALL') count++
  if (selectedDateInterval.value !== 'ALL') count++
  if (minTimeMinute.value > ABS_MIN_TIME_MIN || maxTimeMinute.value < ABS_MAX_TIME_MIN) count++
  if (minDuration.value > ABS_MIN_DURATION || maxDuration.value < ABS_MAX_DURATION) count++
  return count
})

const resetAllFilters = () => {
  selectedScenario.value = 'ALL'
  selectedCondition.value = []
  selectedAsset.value = 'ALL'
  selectedStatus.value = 'ALL'
  selectedDirection.value = 'ALL'
  selectedYear.value = 'ALL'
  selectedProfitTier.value = 'ALL'
  customProfitMin.value = null
  customProfitMax.value = null
  selectedDateInterval.value = 'ALL'
  minTimeMinute.value = ABS_MIN_TIME_MIN
  maxTimeMinute.value = ABS_MAX_TIME_MIN
  minDuration.value = ABS_MIN_DURATION
  maxDuration.value = ABS_MAX_DURATION
}

import { useStrategyTradesStore } from '~/features/store/useStrategyTrades'
import { loadFromDisk } from '~/shared/diskStorage'

const strategyStore = useStrategyTradesStore()

const activeTrades = computed(() => {
  if (props.trades) {
    const tradesByStrat: Record<string, any[]> = {}
    props.trades.forEach(t => {
      const sId = t.strategyId || strategyStore.selectedStrategyId
      if (!tradesByStrat[sId]) tradesByStrat[sId] = []
      tradesByStrat[sId].push(t)
    })

    const enrichedTradesMap: Record<string, any> = {}
    for (const sId of Object.keys(tradesByStrat)) {
      const stratTrades = [...(tradesByStrat[sId] || [])].sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0
        const timeB = b.date ? new Date(b.date).getTime() : 0
        return timeA - timeB
      })

      let runningCapital = strategyStore.getInitialDeposit(sId)
      for (const t of stratTrades) {
        const currencyProfit = t.profitInCurrency !== undefined ? t.profitInCurrency : (t.pnl !== undefined ? t.pnl : (t.result || 0))
        const capAtTrade = runningCapital > 0 ? runningCapital : 1000
        const calcPercent = Math.round((currencyProfit / capAtTrade) * 10000) / 100
        
        runningCapital += currencyProfit

        enrichedTradesMap[t.id || 'TRD-XX'] = { currencyProfit, calcPercent }
      }
    }

    return props.trades.map(t => {
      const enriched = enrichedTradesMap[t.id || 'TRD-XX'] || {
        currencyProfit: t.profitInCurrency !== undefined ? t.profitInCurrency : (t.pnl !== undefined ? t.pnl : (t.result || 0)),
        calcPercent: 0
      }
      const currencyProfit = enriched.currencyProfit
      const calcPercent = enriched.calcPercent

      const start = t.date ? new Date(t.date).getTime() : Date.now()
      const end = t.dateExit ? new Date(t.dateExit).getTime() : start + 45 * 60000
      const diffMins = Math.max(0, Math.floor((end - start) / 60000))
      const hours = Math.floor(diffMins / 60)
      const durStr = hours > 0 ? `${hours}h ${diffMins % 60}m` : `${diffMins}m`
      
      let notesArr: any[] = []
      if (Array.isArray(t.notesList) && t.notesList.length > 0) {
        notesArr = t.notesList.map((n: any, idx: number) => ({
          id: n.id || `note-${idx}`,
          text: n.content || n.text || '',
          timestamp: n.date ? new Date(n.date).toLocaleDateString() : new Date(start).toLocaleDateString(),
          author: n.title || 'TRADER'
        }))
      } else if (Array.isArray(t.notes)) {
        notesArr = t.notes.map((n: any, idx: number) => ({
          id: n.id || `note-${idx}`,
          text: typeof n === 'string' ? n : (n.text || n.content || ''),
          timestamp: n.timestamp || (n.date ? new Date(n.date).toLocaleDateString() : new Date(start).toLocaleDateString()),
          author: n.author || n.title || 'TRADER'
        }))
      } else if (t.notes && typeof t.notes === 'string') {
        notesArr = [{ id: 'n-1', text: t.notes, timestamp: new Date(start).toLocaleDateString(), author: 'TRADER' }]
      } else {
        notesArr = [{ id: 'n-1', text: 'Execution recorded via Genesis Log.', timestamp: new Date(start).toLocaleDateString(), author: 'SYSTEM' }]
      }

      return {
        id: t.id || 'TRD-XX',
        scenario: t.boardScenarioEntry?.info?.name || t.scenario || 'Tactical_Entry_Alpha',
        condition: t.boardScenarioEntry?.info?.conditions?.[0]?.info?.name || t.boardScenarioEntry?.info?.conditions?.[0]?.name || t.conditions?.[0]?.info?.name || t.conditions?.[0]?.name || t.boardConditions?.[0]?.info?.name || t.boardConditions?.[0]?.name || t.condition || 'Market_Structure_Break',
        boardScenarioEntry: t.boardScenarioEntry,
        boardScenarioExit: t.boardScenarioExit,
        conditions: t.conditions,
        boardConditions: t.boardConditions,
        entryPrice: t.entry !== undefined ? t.entry : (t.entryPrice || 0),
        exitPrice: t.exit !== undefined ? t.exit : (t.exitPrice || 0),
        size: t.size !== undefined ? t.size : (t.positionSize || 1),
        stopLoss: t.stopLoss !== undefined ? t.stopLoss : 0,
        takeProfit: t.takeProfit !== undefined ? t.takeProfit : 0,
        profitInCurrency: currencyProfit,
        dateEntryStr: t.date ? new Date(t.date).toLocaleString() : '10.05.2026, 14:30:00',
        dateExitStr: t.dateExit ? new Date(t.dateExit).toLocaleString() : '10.05.2026, 15:15:00',
        profitValue: calcPercent,
        timeValue: 50,
        dateTime: t.date ? new Date(t.date).toLocaleDateString() : '10.05.2026',
        dateObj: t.date ? new Date(t.date) : new Date(),
        duration: durStr,
        durationMinutes: diffMins,
        status: currencyProfit > 0 ? 'WIN' : currencyProfit < 0 ? 'LOSS' : 'SCRATCH',
        asset: t.asset || 'BTC/USD',
        direction: t.side ? t.side.toUpperCase() : 'LONG',
        notes: notesArr
      }
    })
  }
  return mockTrades.value.map(t => ({
    ...t,
    entryPrice: (t as any).entryPrice || 50000,
    exitPrice: (t as any).exitPrice || 51250,
    size: (t as any).size || 1,
    stopLoss: (t as any).stopLoss || 49500,
    takeProfit: (t as any).takeProfit || 52000,
    profitInCurrency: (t as any).profitInCurrency || t.profitValue,
    dateEntryStr: (t as any).dateEntryStr || '10.05.2026, 14:30:00',
    dateExitStr: (t as any).dateExitStr || '10.05.2026, 15:15:00',
    dateObj: new Date(2026, 4, parseInt((t.dateTime || '10.05.2026').split('.')[0] || '10', 10))
  }))
})
const matrixNodes = ref<any[]>([])
const matrixConnections = ref<any[]>([])
const matrixZones = ref<any[]>([])

onMounted(async () => {
  try {
    const saved = await loadFromDisk<any>('genesis_matrix_v2')
    if (saved) {
      if (saved.nodes) matrixNodes.value = saved.nodes
      if (saved.connections) matrixConnections.value = saved.connections
      if (saved.zones) matrixZones.value = saved.zones
    }
  } catch (err) {
    console.error('Failed to load matrix nodes:', err)
  }
})

const selectedStrategyId = computed(() => strategyStore.selectedStrategyId)

const selectedScenarioNode = computed(() => {
  if (selectedStrategyId.value === 'MAIN_DIARY') return null
  return matrixNodes.value.find(n => n.id === selectedStrategyId.value)
})

const getNodesForStrategy = (type: string, entryExit = 'ALL') => {
  let candidates: any[] = []
  if (selectedStrategyId.value === 'MAIN_DIARY') {
    candidates = matrixNodes.value.filter(n => n.type === type)
  } else {
    const parent = selectedScenarioNode.value
    if (!parent) return []
    
    const subGraphNodes = parent.subGraph?.nodes || []
    const connectedIds = matrixConnections.value
      .filter(c => c.fromId === parent.id)
      .map(c => c.toId)
    const connectedNodes = matrixNodes.value.filter(n => connectedIds.includes(n.id))
    
    candidates = [...subGraphNodes, ...connectedNodes].filter(n => n.type === type)
  }

  if (entryExit === 'ALL') return candidates

  return candidates.filter(node => {
    return matrixZones.value.some(zone => {
      const isMatch = zone.type.toUpperCase() === entryExit.toUpperCase()
      if (!isMatch) return false
      return (
        node.x >= zone.x &&
        node.x <= zone.x + zone.width &&
        node.y >= zone.y &&
        node.y <= zone.y + zone.height
      )
    })
  })
}

const strategyScenarios = computed(() => {
  return getNodesForStrategy('scenario', 'ALL')
})

const getScenarioConditions = (scenarioId: string) => {
  if (scenarioId.startsWith('default-')) {
    if (scenarioId === 'default-exit-system') {
      return [
        { id: 'cond-exit-tp', name: 'TAKE_PROFIT', description: 'STRATEGIC_PROFIT_CAPTURE_TARGET' },
        { id: 'cond-exit-sl', name: 'STOP_LOSS', description: 'CAPITAL_PRESERVATION_THRESHOLD' },
        { id: 'cond-exit-fl', name: 'FULL_LIQUIDATION', description: 'TOTAL_EXPOSURE_TERMINATION' }
      ]
    }
    return []
  }

  const scenario = matrixNodes.value.find(n => n.id === scenarioId)
  if (!scenario) return []

  const subNodes = scenario.subGraph?.nodes || []
  const subConns = scenario.subGraph?.connections || []

  const connectedIds = [
    ...matrixConnections.value.filter(c => c.fromId === scenarioId).map(c => c.toId),
    ...subConns.filter((c: any) => c.fromId === scenarioId).map((c: any) => c.toId)
  ]
  
  const allConditions = [
    ...matrixNodes.value.filter(n => connectedIds.includes(n.id) && n.type === 'condition'),
    ...subNodes.filter((n: any) => n.type === 'condition' && connectedIds.includes(n.id))
  ]

  const getIndicatorData = (nodeId: string, parentCond: any) => {
     const n = matrixNodes.value.find(node => node.id === nodeId) || 
               subNodes.find((node: any) => node.id === nodeId) ||
               (parentCond.subGraph?.nodes || []).find((node: any) => node.id === nodeId)
               
     if (!n || n.params?.needsConfig) return null
     
     return {
        id: n.id,
        label: (n.params?.customName || n.label).toUpperCase(),
        description: n.params?.description || n.params?.value || n.params?.info || '',
        direction: n.params?.direction,
        priority: parentCond.params?.priority || 'NONE'
     }
  }

  const tacticalUnits: any[] = []

  allConditions.forEach(cond => {
    const structure = cond.params?.logicalStructure || []
    const priority = cond.params?.priority || 'NONE'
    
    if (structure && structure.length > 0) {
      structure.forEach((unit: any) => {
        if (unit.type === 'bundle') {
          const items = unit.nodeIds.map((id: string) => getIndicatorData(id, cond)).filter(Boolean)
          if (items.length > 0) {
            tacticalUnits.push({
              id: `${cond.id}_${unit.logic}_${items[0].id}`,
              name: `${unit.logic}_PROTOCOL`,
              description: `Grouped tactical requirements from ${cond.params?.customName || cond.label}.`,
              priority,
              indicatorUnits: [{
                type: 'bundle',
                logic: unit.logic,
                items
              }]
            })
          }
        } else {
          const item = getIndicatorData(unit.id, cond)
          if (item) {
            tacticalUnits.push({
              id: item.id,
              name: item.label,
              description: item.description,
              direction: item.direction,
              priority,
              indicatorUnits: [{ type: 'single', item }]
            })
          }
        }
      })
    } else {
      const indicatorIds = [
        ...matrixConnections.value.filter(c => c.fromId === cond.id).map(c => c.toId),
        ...subConns.filter((c: any) => c.fromId === cond.id).map((c: any) => c.toId)
      ]
      const indicators = [
        ...matrixNodes.value.filter(n => indicatorIds.includes(n.id) && !n.params?.needsConfig),
        ...subNodes.filter((n: any) => indicatorIds.includes(n.id) && !n.params?.needsConfig),
        ...(cond.subGraph?.nodes || []).filter((n: any) => !n.params?.needsConfig)
      ]
      
      indicators.forEach(i => {
        const item = {
          id: i.id,
          label: (i.params?.customName || i.label).toUpperCase(),
          description: i.params?.description || i.params?.value || i.params?.info || '',
          direction: i.params?.direction,
          priority
        }
        tacticalUnits.push({
          id: i.id,
          name: item.label,
          description: item.description,
          direction: item.direction,
          priority,
          indicatorUnits: [{ type: 'single', item }]
        })
      })
    }
  })

  return tacticalUnits
}

const scenariosList = computed(() => {
  const items = new Map<string, string>()
  if (props.trades && props.trades.length > 0) {
    props.trades.forEach(t => { 
      const s = t.boardScenarioEntry?.info?.name || t.scenario
      if (s) items.set(s, s) 
    })
  } else {
    mockTrades.value.forEach((t: any) => { 
      const s = t.boardScenarioEntry?.info?.name || t.scenario
      if (s) items.set(s, s) 
    })
  }

  strategyScenarios.value.forEach(s => {
    const name = (s.params?.customName || s.label || '').toUpperCase()
    if (name) items.set(name, name)
  })

  // Exit scenarios requested by user
  items.set('TAKE_PROFIT', 'TAKE_PROFIT')
  items.set('STOP_LOSS', 'STOP_LOSS')
  items.set('FULL_LIQUIDATION', 'FULL_LIQUIDATION')

  const list = Array.from(items.values()).sort().map(s => ({ id: s, label: s }))
  return [{ id: 'ALL', label: 'ALL' }, ...list]
})

const conditionsList = computed(() => {
  const items = new Map<string, string>()
  const sourceTrades = (props.trades && props.trades.length > 0) ? props.trades : mockTrades.value
  sourceTrades.forEach((t: any) => {
    if (t.boardScenarioEntry?.info?.conditions && Array.isArray(t.boardScenarioEntry.info.conditions)) {
      t.boardScenarioEntry.info.conditions.forEach((c: any) => {
        const name = c.info?.name || c.name || c.label
        if (name) items.set(name, name)
      })
    }
    if (t.conditions && Array.isArray(t.conditions)) {
      t.conditions.forEach((c: any) => {
        const name = c.info?.name || c.name || c.label || (typeof c === 'string' ? c : '')
        if (name) items.set(name, name)
      })
    }
    if (t.boardConditions && Array.isArray(t.boardConditions)) {
      t.boardConditions.forEach((c: any) => {
        const name = c.info?.name || c.name || c.label || (typeof c === 'string' ? c : '')
        if (name) items.set(name, name)
      })
    }
    if (t.condition && typeof t.condition === 'string') {
      items.set(t.condition, t.condition)
    }
  })

  strategyScenarios.value.forEach(scen => {
    getScenarioConditions(scen.id).forEach(c => {
      const name = c.info?.name || c.name
      if (name) items.set(name, name)
    })
  })

  const list = Array.from(items.values()).sort().map(s => ({ id: s, label: s }))
  return [{ id: 'ALL', label: 'ALL' }, ...list]
})

const assetsList = computed(() => {
  const items = new Map<string, string>()
  if (props.trades && props.trades.length > 0) {
    props.trades.forEach(t => { if (t.asset) items.set(t.asset, t.asset) })
  } else {
    mockTrades.value.forEach(t => { if (t.asset) items.set(t.asset, t.asset) })
  }

  matrixNodes.value.filter(n => n.type === 'asset' || n.type === 'data').forEach(n => {
    const name = (n.params?.customName || n.label || '').toUpperCase()
    if (name) items.set(name, name)
  })

  const list = Array.from(items.values()).sort().map(s => ({ id: s, label: s }))
  return [{ id: 'ALL', label: 'ALL' }, ...list]
})

const getTradeYear = (trade: any) => {
  if (trade.dateObj) return trade.dateObj.getFullYear()
  if (trade.dateTime && trade.dateTime.includes('.')) {
    const parts = trade.dateTime.split('.')
    if (parts.length === 3) return parseInt(parts[2], 10)
  }
  return 2026
}

const getTradeDay = (trade: any) => {
  if (trade.dateObj) return trade.dateObj.getDate()
  if (trade.dateTime && trade.dateTime.includes('.')) {
    const parts = trade.dateTime.split('.')
    return parseInt(parts[0], 10)
  }
  return 10
}

const getTradeTimeMinutes = (trade: any) => {
  if (trade.dateObj) return trade.dateObj.getHours() * 60 + trade.dateObj.getMinutes()
  return 12 * 60
}

const filteredTrades = computed(() => {
  return activeTrades.value.filter((trade: any) => {
    if (selectedScenario.value !== 'ALL') {
      const isExitScen = ['TAKE_PROFIT', 'STOP_LOSS', 'FULL_LIQUIDATION'].includes(selectedScenario.value)
      if (isExitScen) {
        const exitName = trade.boardScenarioExit?.info?.name || trade.condition
        if (exitName !== selectedScenario.value) return false
      } else {
        if (trade.scenario !== selectedScenario.value) return false
      }
    }
    if (selectedCondition.value.length > 0) {
      let tradeConds: string[] = []
      if (trade.boardScenarioEntry?.info?.conditions && Array.isArray(trade.boardScenarioEntry.info.conditions)) {
        tradeConds.push(...trade.boardScenarioEntry.info.conditions.map((c: any) => c.info?.name || c.name || c.label || '').filter(Boolean))
      }
      if (trade.conditions && Array.isArray(trade.conditions)) {
        tradeConds.push(...trade.conditions.map((c: any) => c.info?.name || c.name || c.label || (typeof c === 'string' ? c : '')).filter(Boolean))
      }
      if (trade.boardConditions && Array.isArray(trade.boardConditions)) {
        tradeConds.push(...trade.boardConditions.map((c: any) => c.info?.name || c.name || c.label || (typeof c === 'string' ? c : '')).filter(Boolean))
      }
      if (tradeConds.length === 0 && trade.condition) {
        tradeConds.push(typeof trade.condition === 'string' ? trade.condition : (trade.condition.info?.name || trade.condition.name || ''))
      }
      
      tradeConds = Array.from(new Set(tradeConds.filter(Boolean)))
      
      if (conditionMatchMode.value === 'EXACT') {
        if (tradeConds.length !== selectedCondition.value.length) return false
        if (!selectedCondition.value.every(c => tradeConds.includes(c))) return false
      } else {
        if (!selectedCondition.value.every(c => tradeConds.includes(c))) return false
      }
    }
    if (selectedAsset.value !== 'ALL' && trade.asset !== selectedAsset.value) return false
    if (selectedStatus.value !== 'ALL' && trade.status !== selectedStatus.value) return false
    if (selectedDirection.value !== 'ALL' && trade.direction !== selectedDirection.value) return false
    
    if (selectedYear.value !== 'ALL') {
      const y = getTradeYear(trade)
      if (selectedYear.value === '1800-2019') {
        if (y > 2019) return false
      } else {
        if (y.toString() !== selectedYear.value) return false
      }
    }

    if (selectedProfitTier.value !== 'ALL') {
      const p = trade.profitValue
      if (selectedProfitTier.value === 'CUSTOM') {
        if (customProfitMin.value !== null && customProfitMin.value !== undefined && customProfitMin.value !== '' as any) {
          if (p < customProfitMin.value) return false
        }
        if (customProfitMax.value !== null && customProfitMax.value !== undefined && customProfitMax.value !== '' as any) {
          if (p > customProfitMax.value) return false
        }
      } else {
        if (selectedProfitTier.value === 'MEGA_GAIN' && p <= 2000) return false
        if (selectedProfitTier.value === 'SUPER_GAIN' && (p < 1000 || p > 2000)) return false
        if (selectedProfitTier.value === 'HIGH_GAIN' && (p < 500 || p > 1000)) return false
        if (selectedProfitTier.value === 'MODERATE_GAIN' && (p < 0 || p > 500)) return false
        if (selectedProfitTier.value === 'MODERATE_LOSS' && (p < -500 || p > 0)) return false
        if (selectedProfitTier.value === 'HEAVY_LOSS' && p >= -500) return false
      }
    }

    if (selectedDateInterval.value !== 'ALL') {
      const d = getTradeDay(trade)
      if (selectedDateInterval.value === 'FIRST_HALF' && d > 15) return false
      if (selectedDateInterval.value === 'SECOND_HALF' && d <= 15) return false
      if (selectedDateInterval.value === 'EARLY_MONTH' && d > 10) return false
      if (selectedDateInterval.value === 'MID_MONTH' && (d < 11 || d > 20)) return false
      if (selectedDateInterval.value === 'LATE_MONTH' && d < 21) return false
    }

    const tm = getTradeTimeMinutes(trade)
    if (minTimeMinute.value > ABS_MIN_TIME_MIN && tm < minTimeMinute.value) return false
    if (maxTimeMinute.value < ABS_MAX_TIME_MIN && tm > maxTimeMinute.value) return false

    if (minDuration.value > ABS_MIN_DURATION && trade.durationMinutes < minDuration.value) return false
    if (maxDuration.value < ABS_MAX_DURATION && trade.durationMinutes > maxDuration.value) return false

    return true
  })
})

const selectedTradeIds = ref<string[]>([])

const isAllSelected = computed(() => {
  if (filteredTrades.value.length === 0) return false
  return filteredTrades.value.every(t => selectedTradeIds.value.includes(t.id))
})

const toggleSelectAllTrades = () => {
  if (isAllSelected.value) {
    selectedTradeIds.value = []
  } else {
    selectedTradeIds.value = filteredTrades.value.map(t => t.id)
  }
}

const toggleSelectTrade = (id: string) => {
  if (selectedTradeIds.value.includes(id)) {
    selectedTradeIds.value = selectedTradeIds.value.filter(x => x !== id)
  } else {
    selectedTradeIds.value.push(id)
  }
}

const removeSelectedTrades = async () => {
  if (props.trades && props.trades.length > 0) {
    for (const tId of selectedTradeIds.value) {
      const tradeObj = props.trades.find(t => t.id === tId)
      if (tradeObj) {
        const sId = tradeObj.strategyId || strategyStore.selectedStrategyId
        await strategyStore.removeTrade(sId, tId)
      }
    }
  } else {
    mockTrades.value = mockTrades.value.filter(t => !selectedTradeIds.value.includes(t.id))
  }
  selectedTradeIds.value = []
}



// Dragging logic for Exact Time
const timeTrackRef = ref<HTMLElement | null>(null)
const isDraggingTimeMin = ref(false)
const isDraggingTimeMax = ref(false)

const startTimeMinDrag = (e: MouseEvent) => {
  isDraggingTimeMin.value = true
  window.addEventListener('mousemove', onTimeMinMove)
  window.addEventListener('mouseup', stopTimeDrag)
}

const startTimeMaxDrag = (e: MouseEvent) => {
  isDraggingTimeMax.value = true
  window.addEventListener('mousemove', onTimeMaxMove)
  window.addEventListener('mouseup', stopTimeDrag)
}

const stopTimeDrag = () => {
  isDraggingTimeMin.value = false
  isDraggingTimeMax.value = false
  window.removeEventListener('mousemove', onTimeMinMove)
  window.removeEventListener('mousemove', onTimeMaxMove)
  window.removeEventListener('mouseup', stopTimeDrag)
}

const onTimeMinMove = (e: MouseEvent) => {
  if (!timeTrackRef.value) return
  const rect = timeTrackRef.value.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const val = Math.round(percent * ABS_MAX_TIME_MIN)
  if (val <= maxTimeMinute.value - 15) minTimeMinute.value = val
  else minTimeMinute.value = maxTimeMinute.value - 15
}

const onTimeMaxMove = (e: MouseEvent) => {
  if (!timeTrackRef.value) return
  const rect = timeTrackRef.value.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const val = Math.round(percent * ABS_MAX_TIME_MIN)
  if (val >= minTimeMinute.value + 15) maxTimeMinute.value = val
  else maxTimeMinute.value = minTimeMinute.value + 15
}

const onTimeTrackClick = (e: MouseEvent) => {
  if (!timeTrackRef.value) return
  const rect = timeTrackRef.value.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const val = Math.round(percent * ABS_MAX_TIME_MIN)
  const distMin = Math.abs(val - minTimeMinute.value)
  const distMax = Math.abs(val - maxTimeMinute.value)
  if (distMin < distMax) {
    if (val <= maxTimeMinute.value - 15) minTimeMinute.value = val
  } else {
    if (val >= minTimeMinute.value + 15) maxTimeMinute.value = val
  }
}

// Dragging logic for Duration
const durationTrackRef = ref<HTMLElement | null>(null)
const isDraggingDurationMin = ref(false)
const isDraggingDurationMax = ref(false)

const startDurationMinDrag = (e: MouseEvent) => {
  isDraggingDurationMin.value = true
  window.addEventListener('mousemove', onDurationMinMove)
  window.addEventListener('mouseup', stopDurationDrag)
}

const startDurationMaxDrag = (e: MouseEvent) => {
  isDraggingDurationMax.value = true
  window.addEventListener('mousemove', onDurationMaxMove)
  window.addEventListener('mouseup', stopDurationDrag)
}

const stopDurationDrag = () => {
  isDraggingDurationMin.value = false
  isDraggingDurationMax.value = false
  window.removeEventListener('mousemove', onDurationMinMove)
  window.removeEventListener('mousemove', onDurationMaxMove)
  window.removeEventListener('mouseup', stopDurationDrag)
}

const onDurationMinMove = (e: MouseEvent) => {
  if (!durationTrackRef.value) return
  const rect = durationTrackRef.value.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const val = Math.round(percent * ABS_MAX_DURATION)
  if (val <= maxDuration.value - 15) minDuration.value = val
  else minDuration.value = maxDuration.value - 15
}

const onDurationMaxMove = (e: MouseEvent) => {
  if (!durationTrackRef.value) return
  const rect = durationTrackRef.value.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const val = Math.round(percent * ABS_MAX_DURATION)
  if (val >= minDuration.value + 15) maxDuration.value = val
  else maxDuration.value = minDuration.value + 15
}

const onDurationTrackClick = (e: MouseEvent) => {
  if (!durationTrackRef.value) return
  const rect = durationTrackRef.value.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const val = Math.round(percent * ABS_MAX_DURATION)
  const distMin = Math.abs(val - minDuration.value)
  const distMax = Math.abs(val - maxDuration.value)
  if (distMin < distMax) {
    if (val <= maxDuration.value - 15) minDuration.value = val
  } else {
    if (val >= minDuration.value + 15) maxDuration.value = val
  }
}
</script>
