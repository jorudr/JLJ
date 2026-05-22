<template>
  
    <div v-if="entriesList" class="flex flex-col space-y-4">
        <h3 class="block text-xs uppercase tracking-widest text-[#777] mb-4">Include trades</h3>
        
        <div class="relative group">
            <input 
                type="text" 
                v-model="search" 
                placeholder="Search by date, asset, or side..." 
                class="w-full text-black focus:outline-none dark:text-white border bg-transparent font-serif px-6 border-black/5 dark:border-white/5 rounded-xl py-3 mb-6 transition-all duration-300 focus:border-black/20 dark:focus:border-white/20"
            >
            <div class="absolute right-6 top-3.5 opacity-20 group-focus-within:opacity-40 transition-opacity">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
        </div>

        <div v-if="filteredItems.length > 0" class="max-h-[400px] overflow-y-auto custom-scrollbar border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden">
            <!-- Grid Header -->
            <div class="grid grid-cols-[1.5fr,1.2fr,1fr,1.8fr,40px] items-center px-6 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/5 text-[9px] uppercase tracking-[0.2em] font-bold text-[#777]">
                <div>Date</div>
                <div class="text-center">Asset</div>
                <div class="text-center">Side</div>
                <div class="text-right pr-4">Range</div>
                <div></div>
            </div>

            <!-- Grid Rows -->
            <div 
                v-for="item in filteredItems" 
                :key="item.id"
                class="grid grid-cols-[1.5fr,1.2fr,1fr,1.8fr,40px] items-center px-6 py-4 border-b last:border-0 border-black/5 dark:border-white/5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors group"
                :class="{ 'bg-emerald-500/[0.02] dark:bg-emerald-400/[0.02]': selectedTrades.some(t => t.id === item.id) }"
            >
                <div class="text-[10px] text-[#666] dark:text-[#aaa] font-mono">
                    {{ formatDate(item.date) }}
                </div>

                <div class="text-[11px] font-serif font-bold text-center tracking-wide text-[#050505] dark:text-white">
                    {{ item.asset }}
                </div>

                <div class="text-center">
                    <span 
                        :class="item.side === 'Long' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
                        class="text-[9px] uppercase tracking-[0.15em] font-bold px-2 py-1 rounded-md bg-opacity-10"
                    >
                        {{ item.side }}
                    </span>
                </div>

                <div class="text-right text-[10px] pr-4 font-mono text-[#777] dark:text-[#888]">
                    {{ item.entry }} <span class="opacity-30 mx-1">→</span> {{ item.exit }}
                </div>

                <div class="flex justify-center">
                    <button 
                        type="button"
                        @click="toggleSelect(item)"
                        class="w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                        :class="isSelected(item) 
                            ? 'bg-black dark:bg-white border-black dark:border-white shadow-lg' 
                            : 'bg-transparent border-black/20 dark:border-white/20 hover:border-black/40 dark:hover:border-white/40'"
                    >
                        <transition name="scale-fade">
                            <svg v-if="isSelected(item)" class="w-2.5 h-2.5" :class="isSelected(item) ? 'text-white dark:text-black' : ''" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M5 13l4 4L19 7" />
                            </svg>
                        </transition>
                    </button>
                </div>
            </div>
        </div>

        <div v-else-if="search" class="py-12 text-center border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
            <p class="text-[11px] uppercase tracking-[0.2em] text-[#aaa]">No matching trades found</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '~/entities/user/auth.store';
import { useForumStore } from '~/features/store/useForum';
import { selectedTrades } from '../model/useCreation';
import { loadDiaryFromDisk } from '@/widgets/diary/model/useDiary';
import { normalizeDate } from '~/composables/normalizeDate';

function formatDate(date) {
  if (!date) return '—';
  const d = normalizeDate(date);
  return d.toLocaleString("ru-RU", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const auth = useAuthStore();
const forum = useForumStore();
watch(
  () => auth.user?.uid,
  async (uid) => {
    if (uid) {
      await forum.fetchUser(uid);
      await loadDiaryFromDisk(uid);
    }
  },
  { immediate: true }
);



const entriesList = computed(() => {
    const uid = auth.user?.uid;

    if (typeof uid !== 'string') return [];


    return forum.users.get(uid)?.diary || [];
});

const isOpen = ref(false);
const search = ref("");



const filteredItems = computed(() => {
    if (!search.value) return entriesList.value;
    
    const s = search.value.toLowerCase();
    return (entriesList.value || []).filter(item => {
        const dateStr = formatDate(item.date).toLowerCase();
        const assetStr = (item.asset || '').toLowerCase();
        const sideStr = (item.side || '').toLowerCase();
        const notesStr = (item.notes || '').toLowerCase();
        
        return dateStr.includes(s) || 
               assetStr.includes(s) || 
               sideStr.includes(s) || 
               notesStr.includes(s);
    });
});


function selectItem(item){
    selectedTrades.value.push(item);
    isOpen.value = false;
    search.value = "";
}

function isSelected(item) {
    return selectedTrades.value.some(t => t.id === (item.id || item.date));
}

function toggleSelect(item) {
    const idx = selectedTrades.value.findIndex(t => t.id === (item.id || item.date));
    if (idx !== -1) {
        selectedTrades.value.splice(idx, 1);
    } else {
        selectedTrades.value.push(item);
    }
}

</script>
<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
}
:deep(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
}
:deep(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
}

.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.scale-fade-enter-from,
.scale-fade-leave-to {
  transform: scale(0.5);
  opacity: 0;
}
</style>
