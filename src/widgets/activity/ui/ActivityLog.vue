<template>
  <div class="flex-grow flex flex-col min-w-0">
    <div class="px-12 py-8 border-b border-current/5 flex items-center justify-between">
      <div>
        <h2 class="text-base tracking-[0.4em] opacity-80 dark:opacity-100 uppercase font-bold text-current drop-shadow-sm leading-relaxed">
          Log of <br /> Temporal Existence
        </h2>
        <p class="text-sm italic opacity-50 dark:opacity-80 text-current mt-1 lowercase-serif tracking-widest drop-shadow-sm">Session Consistency & Focus Registry</p>
      </div>
      <div class="flex items-center space-x-12">
         <div class="text-right">
            <span class="block text-[10px] uppercase tracking-widest opacity-80 dark:opacity-100 text-current font-bold mb-1 drop-shadow-sm">Streak</span>
            <div class="flex items-center justify-end space-x-2">
              <span class="text-2xl font-serif italic text-current leading-none drop-shadow-sm dark:opacity-100">{{ currentStreak }}</span>
              <div class="w-4 h-4 text-current opacity-60 dark:opacity-90">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.41-1.09-2.12-1.61.12-.07.26-.14.37-.24.58-.51.85-1.29.58-2.03-.1-.31-.24-.59-.47-.83-.84-.9-2.28-1-3.37-.36-.4.23-.74.55-.99.94C10.15 7.42 10.02 8.7 10.3 9.6c.03.11.05.21.05.33 0 .22-.19.43-.45.43-.13 0-.27-.06-.34-.14-.23-.27-.33-.63-.44-.98-.18-.58-.3-1.15-.36-1.74 0-.17-.02-.34-.14-.46-.07-.07-.12-.13-.19-.13-.08 0-.15.06-.21.12-.47.45-.8 1.01-1.01 1.62-.25.7-.35 1.5-.08 2.22.06.18.15.36.26.52.27.42.59.81.95 1.14.73.66 1.57 1.2 2.3 1.89.7.67 1.34 1.45 1.57 2.4.08.33.12.68.12 1.02 0 .61-.13 1.23-.41 1.77-.32.61-.83 1.1-1.4 1.44-.09.05-.18.1-.25.17-.14.12-.11.23-.05.33.26.43.68.74 1.14.88.59.18 1.23.16 1.83.02.6-.14 1.18-.46 1.62-.91.49-.49.88-1.06 1.13-1.7.27-.68.32-1.44.25-2.18-.04-.61-.19-1.22-.49-1.76-.3-.54-.69-1.02-1.12-1.46-.37-.4-.78-.77-1.18-1.14-.14-.14-.26-.29-.41-.42-.07-.07-.1-.13-.05-.22.12-.22.42-.25.56-.05.81.82 1.65 1.62 2.29 2.58.11.17.38.2.53.07.13-.1.17-.25.16-.4-.05-.44-.31-.83-.54-1.21z" /></svg>
              </div>
            </div>
         </div>
      </div>
    </div>

    <div class="flex-grow scroll-minimal overflow-y-auto p-12 space-y-12">
      <!-- Temporal Matrix (Heatmap) -->
      <div>
        <div class="flex justify-between items-center mb-6 border-b border-current/5 pb-2">
          <span class="text-sm uppercase tracking-[0.2em] font-bold opacity-60 dark:opacity-90 text-current drop-shadow-sm">Historical Consistency Matrix</span>
        </div>
        
        <div ref="heatmapContainer" class="overflow-x-auto pb-6 scrollbar-hide">
          <div class="grid grid-flow-col grid-rows-7 gap-1.5 min-w-max">
            <div 
              v-for="cell in heatmapCells" 
              :key="cell.date"
              class="w-4 h-4 rounded-[1px] transition-all duration-1000 relative group/cell hover:z-50"
              :class="[
                cell.active 
                  ? 'bg-zinc-800 dark:bg-white/50 shadow-[0_0_12px_rgba(var(--text-primary-rgb),0.2)]' 
                  : 'bg-zinc-800/10 dark:bg-white/10 border border-zinc-800/5 dark:border-white/5 hover:bg-zinc-800/20 dark:hover:bg-white/20',
                cell.isFuture ? 'opacity-[0.02]' : ''
              ]"
              @mouseenter="e => handleMouseEnter(e, cell)"
              @mouseleave="handleMouseLeave"
            >
            </div>
          </div>
        </div>
      </div>

      <!-- Journal of Intent (Action) -->
      <div class="pt-8 border-t border-current/5 flex items-start space-x-12">
        <div class="flex-grow">
          <textarea
            v-model="todaysNote"
            rows="2"
            placeholder="scribe today's objective into the void..."
            class="w-full bg-transparent border-b border-zinc-800/10 dark:border-zinc-300/10 py-2 text-lg text-current placeholder:opacity-40 focus:outline-none focus:border-zinc-800/30 dark:focus:border-zinc-300/30 transition-colors resize-none italic font-serif"
          ></textarea>
          <div class="mt-4 flex items-center space-x-3 opacity-40 dark:opacity-70">
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm11 13H4v-8h16v8zm-8-5a2 2 0 100 4 2 2 0 000-4z"/></svg>
            <span class="text-xs uppercase tracking-[0.4em] font-bold">REIFICATION_LOG // ENCRYPTION: ACTIVE</span>
          </div>
        </div>

        <div class="shrink-0 pt-2 h-full flex items-center">
          <button 
            @click="handleCheckIn"
            :disabled="isSubmittingActivity || checkInUsedToday"
            class="existence-button relative group/btn overflow-hidden h-14 min-w-[200px] rounded-none transition-all duration-700 transform active:scale-[0.98] disabled:opacity-30 border border-zinc-800/10 dark:border-white/20"
            :class="[
              checkInUsedToday 
                ? 'is-active bg-zinc-800 dark:bg-white/50 text-white dark:text-black shadow-[0_0_20px_rgba(var(--text-primary-rgb),0.1)]' 
                : 'bg-transparent hover:border-zinc-800 dark:hover:border-white/50'
            ]"
          >
            <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800/40 dark:border-white/50 transition-all duration-500 group-hover/btn:w-4 group-hover/btn:h-4"></div>
            <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-800/40 dark:border-white/50 transition-all duration-500 group-hover/btn:w-4 group-hover/btn:h-4"></div>
            <div class="absolute top-1 right-2 text-[6px] font-mono opacity-20 dark:opacity-60 tracking-widest uppercase transition-opacity group-hover/btn:opacity-60">SEQ_0x4A</div>
            <div class="relative z-10 flex items-center justify-center space-x-4">
              <span v-if="isSubmittingActivity" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              <template v-else>
                <span class="text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-700 group-hover/btn:tracking-[0.5em]" :class="checkInUsedToday ? 'text-white dark:text-black' : 'text-zinc-800 dark:text-white/50'">
                  {{ checkInUsedToday ? 'Sequence Active' : 'Initiate Session' }}
                </span>
              </template>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Tooltip -->
    <Teleport to="body">
      <div 
        v-if="tooltipState.show"
        class="sacred-tooltip fixed px-3 py-2 bg-black dark:bg-white/50 text-white dark:text-black text-[9px] italic font-serif rounded-sm pointer-events-none whitespace-nowrap uppercase tracking-[0.2em] shadow-2xl transition-all duration-300 z-[9999]"
        :style="{ 
          left: `${tooltipState.x}px`, 
          top: `${tooltipState.y}px`,
          transform: 'translate(-50%, -100%) translateY(-15px)'
        }"
      >
        {{ tooltipState.content }}
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useActivity } from '../model/useActivity'

const {
    auth,
    activeUserId,
    isSubmittingActivity,
    todaysNote,
    heatmapContainer,
    tooltipState,
    checkInUsedToday,
    currentStreak,
    heatmapCells,
    handleCheckIn,
    initializeArchive,
    handleMouseEnter,
    handleMouseLeave
} = useActivity()

onMounted(() => {
    initializeArchive()
})

watch(activeUserId, (newVal) => {
    if (newVal) initializeArchive()
})
</script>

<style scoped>
.existence-button.is-active {
  cursor: default;
}

.sacred-tooltip {
    backdrop-filter: blur(8px);
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
