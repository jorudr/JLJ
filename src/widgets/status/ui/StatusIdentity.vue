<template>
  <div class="flex flex-col h-full justify-between">
    <div class="space-y-12">
      <!-- Identity Core -->
      <div class="space-y-6">
        <div class="flex items-center space-x-3">
          <div class="w-2 h-2 rounded-full bg-current animate-pulse shadow-[0_0_8px_rgba(var(--text-primary-rgb),0.5)]"></div>
          <span class="text-[9px] text-current/60 font-mono tracking-[0.4em] uppercase">Status: Reified</span>
        </div>
        
        <div class="space-y-1">
          <span class="text-[8px] text-current/20 font-bold tracking-[0.6em] uppercase">Auth_Session // ID</span>
          <h2 class="text-xl font-serif italic text-current opacity-90 tracking-wide">{{ user?.displayName || 'Unknown_Subject' }}</h2>
        </div>

        <div class="w-12 h-[1px] bg-current opacity-10"></div>
      </div>

      <!-- Temporal & System Flux -->
      <div class="space-y-8">
        <div class="flex flex-col space-y-2">
          <span class="text-[7px] text-current/30 font-mono tracking-[0.4em] uppercase">Temporal_Flux</span>
          <span class="text-xs font-mono text-current opacity-70 tracking-widest">{{ currentTimeReadout }}</span>
        </div>

        <div class="flex flex-col space-y-2">
          <span class="text-[7px] text-current/30 font-mono tracking-[0.4em] uppercase">Module_Layer</span>
          <div class="flex items-center space-x-4">
            <div class="w-4 h-4 border border-current/20 flex items-center justify-center">
              <div class="w-1 h-1 bg-current animate-spin-slow"></div>
            </div>
            <span class="text-xl font-serif lowercase italic text-current opacity-90">{{ activeTab }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Consistency Pulse (Kinetic Telemetry) -->
    <div class="space-y-6">
      <div class="flex flex-col space-y-4">
        <span class="text-[7px] text-current/30 font-mono tracking-[0.4em] uppercase">Consistency_Pulse</span>
        <div class="flex items-end space-x-1 h-8">
          <div v-for="i in 12" :key="i" 
               class="flex-grow bg-current/20" 
               :style="{ height: (20 + Math.random() * 80) + '%' }">
          </div>
        </div>
      </div>
      <div class="flex items-center justify-between text-[8px] font-mono tracking-widest opacity-30">
        <span>RES_0.00ms</span>
        <span>SYNC_ACTIVE</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStatus } from '../model/useStatus'

defineProps<{
  activeTab: string
}>()

const { user, currentTimeReadout } = useStatus()
</script>
