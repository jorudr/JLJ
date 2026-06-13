<template>
  <Transition name="fade">
    <div v-if="isInitializing" class="absolute inset-0 z-[1000] bg-nier-white dark:bg-nier-black flex flex-col items-center justify-center space-y-8 pointer-events-auto transition-colors duration-1000">
       <div class="flex flex-col items-center space-y-3">
          <div class="w-16 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-20"></div>
          <span class="text-[10px] font-mono tracking-[0.8em] uppercase font-black animate-pulse text-nier-text-light dark:text-nier-text-dark">Establishing_Neural_Link</span>
          <div class="w-16 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-20"></div>
       </div>

       <div class="w-64 h-px bg-nier-text-light/10 dark:bg-nier-text-dark/10 relative overflow-hidden">
          <div class="absolute inset-y-0 left-0 bg-nier-text-light dark:bg-nier-text-dark transition-all duration-300" :style="{ width: `${bootProgress}%` }"></div>
          <!-- Glitch element -->
          <div class="absolute h-full w-4 bg-white/40 blur-sm animate-scan"></div>
       </div>

       <div class="flex flex-col items-center space-y-1 opacity-40 text-nier-text-light dark:text-nier-text-dark">
          <span class="text-[7px] font-mono tracking-widest uppercase">System_Code: 0x44_REIFY</span>
          <span class="text-[7px] font-mono tracking-widest uppercase">Matrix_Stability: {{ Math.min(100, Math.round(bootProgress)) }}%</span>
       </div>
       
       <!-- Scanline effect for boot -->
       <div class="absolute inset-0 pointer-events-none opacity-5 animate-scan bg-gradient-to-b from-transparent via-nier-text-light dark:via-nier-text-dark to-transparent h-[2px]"></div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  isInitializing: boolean
  bootProgress: number
}>()
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@keyframes scan {
  from { transform: translateY(-100%); }
  to { transform: translateY(200%); }
}

.animate-scan {
  animation: scan 4s linear infinite;
}
</style>
