<template>
  <div class="absolute inset-0 z-50 overflow-hidden pointer-events-auto">
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
      <svg class="overflow-visible" width="2" height="2">
        <template v-for="node in strategyNodePositions" :key="'line-group-'+node.id">
          <line x1="1" y1="1"
                :x2="node.x" :y2="node.y"
                stroke="rgba(255, 255, 255, 0.5)"
                stroke-width="1.5" />
          <line v-for="sc in node.scenarios" :key="'line-sc-'+sc.id"
                :x1="node.x" :y1="node.y"
                :x2="sc.globalX" :y2="sc.globalY"
                stroke="rgba(255, 255, 255, 0.2)"
                stroke-dasharray="2 2"
                stroke-width="1" />
        </template>
      </svg>
    </div>

    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <ExNTtooltip>
        <template #trigger>
          <div class="relative w-16 h-16 border flex items-center justify-center cursor-pointer transition-all duration-500 group/node bg-zinc-100 dark:bg-[#0a0a0a] border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white shadow-[0_0_40px_rgba(0,0,0,0.05)] backdrop-blur-md">
            <div class="absolute top-1 left-1 w-1 h-1 border-t border-l border-black/20 dark:border-white/20 transition-colors duration-500 group-hover/node:border-black dark:group-hover/node:border-white"></div>

            <div class="absolute top-1 right-1 px-1 py-[0.5px] text-[5px] font-mono font-bold tracking-tighter uppercase border border-blue-500/50 text-blue-500 bg-blue-500/10">
              USR
            </div>

            <span class="text-[16px] font-mono font-black tracking-tighter uppercase transition-colors text-black/40 dark:text-white/40 group-hover/node:text-black dark:group-hover/node:text-white">
              USR
            </span>
          </div>
        </template>
        <div class="flex flex-col gap-1 min-w-[120px] p-1">
          <div class="flex flex-col space-y-1 font-mono leading-relaxed uppercase text-black dark:text-white">
            <span class="font-black text-[14px] tracking-widest pb-0.5">{{ authStore.user?.displayName || authStore.user?.email || 'Operator_0x4F' }}</span>
            <div class="w-full h-[1px] bg-black/10 dark:bg-white/10 mb-1"></div>
            <span class="text-[9px] opacity-60">ID. {{ authStore.user?.uid?.slice(0, 10) || 'UNKNOWN' }}</span>
            <span class="text-[9px] opacity-60">TYPE. {{ authStore.user?.type || 'COMMON' }}</span>
            <span class="text-[9px] opacity-60">EST. {{ formatCreationDate(authStore.user?.joinedAt) }}</span>
          </div>
        </div>
      </ExNTtooltip>
    </div>

    <template v-for="node in strategyNodePositions" :key="'strat-'+node.id">
      <div class="absolute top-1/2 left-1/2 transition-all duration-1000 z-[5]"
           :style="{ transform: `translate(calc(-50% + ${node.x}px), calc(-50% + ${node.y}px))` }">
        <ExNTtooltip>
          <template #trigger>
            <div @click="handleStrategyClick(node.id)"
                 class="relative w-12 h-12 border flex items-center justify-center cursor-pointer transition-all duration-500 group/node backdrop-blur-md bg-zinc-100 dark:bg-[#0a0a0a] border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white"
                 :class="[
                   selectedStrategyId === node.id
                     ? 'shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.05)] border-black/30 dark:border-white/30'
                     : ''
                 ]">
              <div class="absolute top-1 left-1 w-1 h-1 border-t border-l transition-colors duration-500"
                   :class="selectedStrategyId === node.id ? 'border-black/40 dark:border-white/40' : 'border-black/10 dark:border-white/10 group-hover/node:border-black dark:group-hover/node:border-white'"></div>

              <div class="absolute top-1 right-1 px-1 py-[0.5px] text-[4px] font-mono font-bold tracking-tighter uppercase border border-emerald-500/50 text-emerald-500 bg-emerald-500/10">
                PRT
              </div>

              <span class="text-[12px] font-mono font-black tracking-tighter uppercase transition-colors"
                    :class="selectedStrategyId === node.id ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40 group-hover/node:text-black dark:group-hover/node:text-white'">
                {{ (node.name || '').slice(0, 3) }}
              </span>

              <div v-if="selectedStrategyId === node.id"
                   class="absolute -bottom-1 -right-1 w-2.5 h-2.5 rotate-45 border-2 border-white dark:border-black shadow-sm transition-colors duration-500 bg-emerald-500"></div>
            </div>
          </template>
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-[8px] font-mono opacity-40 uppercase">Protocol_Metadata</span>
            </div>
            <p class="text-[10px] font-mono font-bold leading-relaxed uppercase">{{ node.name }}</p>
          </div>
        </ExNTtooltip>
      </div>

      <div v-for="sc in node.scenarios" :key="'sc-'+sc.id"
           class="absolute top-1/2 left-1/2 transition-all duration-1000 z-[4]"
           :style="{ transform: `translate(calc(-50% + ${sc.globalX}px), calc(-50% + ${sc.globalY}px))` }">
        <ExNTtooltip>
          <template #trigger>
            <div class="relative w-12 h-12 border flex items-center justify-center cursor-pointer transition-all duration-500 group/node backdrop-blur-md bg-zinc-100 dark:bg-[#0a0a0a] border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white">
              <div class="absolute top-1 left-1 w-1 h-1 border-t border-l transition-colors duration-500 border-black/10 dark:border-white/10 group-hover/node:border-black dark:group-hover/node:border-white"></div>
              <div class="absolute top-1 right-1 px-1 py-[0.5px] text-[4px] font-mono font-bold tracking-tighter uppercase border border-blue-500/50 text-blue-500 bg-blue-500/10">
                NODE
              </div>
              <span class="px-1 text-[10px] font-mono font-black tracking-[0.16em] uppercase leading-tight text-center transition-colors text-black/45 dark:text-white/45 group-hover/node:text-black dark:group-hover/node:text-white break-words">
                {{ sc.shortName || sc.displayName || sc.label || sc.name || 'SCN' }}
              </span>
            </div>
          </template>
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-[8px] font-mono opacity-40 uppercase">Scenario_Metadata</span>
            </div>
            <p class="text-[10px] font-mono font-bold leading-relaxed uppercase">{{ sc.displayName || sc.label || sc.name || 'Scenario' }}</p>
          </div>
        </ExNTtooltip>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import ExNTtooltip from '~/shared/ui/ExNTtooltip.vue'
import { useGenesisTree } from '../model/useGenesisTree'

const emit = defineEmits<{
  (e: 'switch-view', value: 'cube'): void
}>()

const {
  authStore,
  formatCreationDate,
  selectedStrategyId,
  strategyNodePositions,
  selectStrategy
} = useGenesisTree()

const handleStrategyClick = (id: string) => {
  selectStrategy(id)
  emit('switch-view', 'cube')
}
</script>
