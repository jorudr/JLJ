<template>
  <div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#050505] to-[#1e1e1e] dark:from-[#0a0a0a] dark:to-[#0f0f0f] p-3 shadow-sm border border-white/5 dark:border-white/10 group h-full flex items-center">
    
    <!-- Background Gradient Accent -->
    <div class="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-2xl group-hover:bg-blue-500/20 transition duration-700 pointer-events-none"></div>

    <div class="relative z-10 flex items-center justify-between w-full gap-6">
      
      <div class="flex items-center gap-4">
        <!-- Feature Icon/Graphic -->
        <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
        </div>

        <div class="flex flex-col">
          <h2 class="text-xs font-serif tracking-wide text-white flex items-center gap-2 m-0 shrink-0 mb-0.5">
            Discover the Board
            <span class="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-[0.15em] bg-blue-500/20 text-blue-300 border border-blue-500/30">
              New Feature
            </span>
          </h2>
          <p class="text-[9px] text-[#888] tracking-wide leading-tight hidden xl:block">
            Map your thesis connections and visualize research.
          </p>
        </div>
      </div>

      <NuxtLink
        to="/board"
        class="relative overflow-hidden shrink-0 px-4 py-1.5 rounded-full bg-white dark:bg-[#e0e0e0] text-[#050505] text-[9px] uppercase tracking-[0.15em] font-bold transition-all hover:scale-105 shadow-lg active:scale-95"
      >
        Explore
        <!-- Subtle Shine -->
        <div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shine_1.5s_ease-in-out]"></div>
      </NuxtLink>

    </div>
  </div>
</template>

<script setup lang="ts">
// Static banner promoting the board feature
</script>

<style scoped>
@keyframes shine {
  100% {
    transform: translateX(100%);
  }
}
</style>