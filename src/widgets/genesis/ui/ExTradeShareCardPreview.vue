<template>
  <div class="overflow-x-auto pb-8 custom-scrollbar">
    <div class="relative w-[1200px] h-[675px] bg-[#0a0a0a] border border-theme-border shadow-2xl overflow-hidden group mx-auto shrink-0">
      <!-- Decorative Mesh Pattern -->
      <div class="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style="background-image: linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px); background-size: 40px 40px;"></div>
      
      <!-- Gradient Overlay -->
      <div class="absolute inset-0 bg-gradient-to-tr from-black to-transparent opacity-60"></div>

      <!-- Top-Left Header with App Logo & Identity -->
      <div class="absolute top-[5%] left-[5%] flex items-center space-x-6">
        <!-- Core Icon -->
        <div class="relative w-14 h-14 flex items-center justify-center shrink-0">
          <div class="absolute inset-0 border-2 animate-[spin_10s_linear_infinite] border-white/40"></div>
          <div class="absolute inset-2 border animate-[spin_6s_linear_infinite_reverse] border-white/60"></div>
          <div class="w-2.5 h-2.5 rotate-45 animate-pulse bg-white"></div>
          <div class="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-white"></div>
          <div class="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-white"></div>
        </div>
        
        <!-- Identity -->
        <div class="flex flex-col text-left" style="font-family: 'Cormorant Garamond', serif;">
          <h1 class="text-2xl tracking-[0.4em] uppercase font-light text-white leading-none">J.L.Jörmungandr</h1>
          <p class="text-[8px] font-mono tracking-[0.5em] uppercase text-white/30 mt-1">Universal_Analytical_Platform</p>
        </div>
      </div>

      <!-- Primary Metric: Center Aligned -->
      <div class="absolute inset-0 flex flex-col items-center justify-center -translate-y-[8%]">
        <span class="text-[14px] md:text-[18px] font-mono font-black uppercase tracking-[0.4em] text-white opacity-60 mb-2 md:mb-4">{{ asset }}</span>
        <span class="text-[120px] md:text-[200px] font-serif italic text-white leading-none drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">{{ efficiency }}%</span>
        <div class="flex flex-col items-center mt-2 md:mt-4">
          <span class="text-[10px] md:text-[14px] font-mono uppercase tracking-wider text-white opacity-40">
            The trade is better than {{ efficiency }}% of the trades
          </span>
          <div class="h-px w-24 bg-white/20 mt-4"></div>
        </div>
      </div>

      <!-- User Registry Info & Secure Code Block: Top-Right -->
      <div class="absolute top-[5%] right-[5%] flex flex-col items-end space-y-1 text-right">
        <div class="grid grid-cols-4 gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity duration-1000 mb-2">
          <div v-for="n in 16" :key="n" 
               class="w-2 md:w-3 h-2 md:h-3" 
               :class="(n * 7) % 5 > 2 ? 'bg-white' : 'bg-white/5'"></div>
        </div>
        <span class="text-[10px] font-mono font-black uppercase tracking-widest text-white">{{ username }}</span>
        <span class="text-[8px] font-mono uppercase tracking-[0.3em] opacity-40 text-white">{{ accountType }}_Operator</span>
      </div>

      <!-- Bottom Telemetry Grid -->
      <div class="absolute top-[71%] left-[5%] right-[5%]">
        <div class="h-px w-full bg-white/10 mb-6 md:mb-10"></div>
        <div class="grid grid-cols-6 gap-4 md:gap-8">
          <div v-for="metric in metrics" :key="metric.label" class="flex flex-col space-y-1 md:space-y-3">
            <span class="text-[7px] md:text-[9px] font-mono font-black uppercase tracking-widest text-white/30">{{ metric.label }}</span>
            <span class="text-[10px] md:text-[20px] font-mono font-black text-white uppercase truncate">{{ metric.value }}</span>
          </div>
        </div>
      </div>

      <!-- HUD Corner Bracket -->
      <div class="absolute bottom-[5%] right-[5%] w-8 md:w-12 h-8 md:h-12 border-r border-b border-white/20"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  efficiency?: number | string
  efficiencyLabel?: string
  protocol?: string
  duration?: string
  entryPrice?: string | number
  exitPrice?: string | number
  emotionalState?: string
  netResult?: string
  username?: string
  accountType?: string
  asset?: string
}

const props = withDefaults(defineProps<Props>(), {
  efficiency: 78,
  efficiencyLabel: 'Percentile_Efficiency',
  protocol: 'Day Trading',
  duration: '56.5 Hours',
  entryPrice: '$150.00',
  exitPrice: '$162.50',
  emotionalState: 'Optimal',
  netResult: '+1,250.00',
  username: 'Operator_0x4F',
  accountType: 'Premium',
  asset: 'BTC/USD'
})

const metrics = computed(() => [
  { label: 'Protocol', value: props.protocol },
  { label: 'Duration', value: props.duration },
  { label: 'Entry_Price', value: props.entryPrice },
  { label: 'Exit_Price', value: props.exitPrice },
  { label: 'Emotional_State', value: props.emotionalState },
  { label: 'Net_Result', value: props.netResult }
])
</script>
