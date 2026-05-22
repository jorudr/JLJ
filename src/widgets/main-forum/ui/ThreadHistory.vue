<template>
  <div class="w-full flex flex-col pt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div v-if="!props.isCompact" class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-4">
      <div class="flex-1">
        <h2 class="text-[10px] font-serif uppercase tracking-[0.5em] mb-4 text-gray-400">
          Personal Archive
        </h2>
        <h3 class="text-3xl font-serif tracking-tight mb-8">
          Recently Viewed
        </h3>

        <!-- Search Bar -->
        <div class="relative max-w-md group border-b border-black/10 dark:border-white/10 pb-3 focus-within:border-black dark:focus-within:border-white transition-all duration-500">
          <svg class="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaa] group-focus-within:text-black dark:group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            v-model="historyStore.searchQuery"
            type="text"
            placeholder="Search your history..."
            class="w-full bg-transparent pl-8 text-sm focus:outline-none"
          />
        </div>
      </div>

      <!-- Filter Controls Group -->
      <div class="flex flex-col items-end gap-4">
        <!-- Time Filter Tab Group -->
        <div class="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl w-fit">
          <button 
            v-for="f in filters" 
            :key="f.id"
            @click="historyStore.timeFilter = f.id"
            class="px-4 py-2 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all duration-300"
            :class="historyStore.timeFilter === f.id ? 'bg-white dark:bg-[#0a0a0a] shadow-sm text-black dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'"
          >
            {{ f.label }}
          </button>
        </div>

        <!-- Category Filters -->
        <div v-if="historyStore.availableCategories.length > 0" class="flex flex-wrap justify-end gap-2 max-w-md">
            <button 
              @click="historyStore.categoryFilter = 'all'"
              class="px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold rounded-full border transition-all duration-300"
              :class="historyStore.categoryFilter === 'all' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-black/10 dark:border-white/10 text-gray-400 hover:text-black dark:hover:text-white'"
            >
              All Categories
            </button>
            <button 
              v-for="cat in historyStore.availableCategories" 
              :key="cat"
              @click="historyStore.categoryFilter = cat"
              class="px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold rounded-full border transition-all duration-300"
              :class="historyStore.categoryFilter === cat ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-black/10 dark:border-white/10 text-gray-400 hover:text-black dark:hover:text-white'"
            >
              {{ capitalize(cat) }}
            </button>
        </div>
      </div>
    </div>

    <!-- History List -->
    <div v-if="historyStore.groupedHistory.length > 0" class="space-y-16">
      <div v-for="[groupName, items] in historyStore.groupedHistory" :key="groupName" class="px-4">
        <h4 class="text-[9px] uppercase tracking-[0.3em] font-medium text-gray-400 mb-8 flex items-center gap-4">
          {{ groupName }}
          <div class="flex-1 h-px bg-black/5 dark:bg-white/5"></div>
        </h4>
        
        <div class="grid gap-4">
          <NuxtLink 
            v-for="item in items" 
            :key="item.id" 
            :to="`/forum/thread/${item.id}`"
            class="group p-6 rounded-2xl border border-black/5 dark:border-white/5 bg-[#fafafa] dark:bg-[#1f1f1f] hover:bg-white dark:hover:bg-[#252525] transition-all duration-500 flex items-center justify-between shadow-sm hover:shadow-xl hover:scale-[1.01]"
          >
            <div>
              <div class="flex items-center gap-4 mb-2">
                <span class="text-[8px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-gray-500">
                  {{ item.subcategory || item.category }}
                </span>
                <div class="flex items-center gap-3 text-[10px] text-gray-400 font-serif italic">
                  <div class="flex items-center gap-1.5">
                    <span class="font-medium text-[#c49b6b] dark:text-[#d8b488]">by {{ item.authorName || 'Anonymous' }}</span>
                  </div>
                  <span>·</span>
                  <div class="flex items-center gap-1 text-rose-500/60">
                    <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    <span>{{ getThreadLikes(item.id) }}</span>
                  </div>
                  <span>·</span>
                  <span>Viewed {{ formatTime(item.viewedAt) }}</span>
                </div>
              </div>
              <h5 class="text-lg font-serif group-hover:tracking-wide transition-all duration-300">
                {{ item.title }}
              </h5>
            </div>
            <span class="text-[10px] uppercase tracking-widest text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">
              Continue Reading →
            </span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="flex flex-col items-center justify-center py-32 text-center">
      <div class="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
        <svg class="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-sm font-serif italic text-gray-500">
        {{ historyStore.searchQuery ? 'No matching threads in your history' : 'Your research archive is currently empty' }}
      </p>
      <button 
        @click="historyStore.searchQuery = ''; historyStore.timeFilter = 'all'; historyStore.categoryFilter = 'all'" 
        v-if="historyStore.searchQuery || historyStore.timeFilter !== 'all' || historyStore.categoryFilter !== 'all'"
        class="mt-4 text-[9px] uppercase tracking-widest font-bold text-blue-500 hover:opacity-70 transition"
      >
        Reset Filters
      </button>
    </div>

    <!-- Actions -->
    <div v-if="historyStore.history.length > 0" class="mt-24 px-4 flex justify-start">
        <button 
          @click="isConfirmingClear = true"
          class="text-[9px] uppercase tracking-widest font-bold text-red-500/50 hover:text-red-500 transition-colors flex items-center gap-2"
        >
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Purge History
        </button>
    </div>

    <!-- Confirmation Modal (Minimalist) -->
    <transition name="fade">
      <div v-if="isConfirmingClear" class="fixed inset-0 z-[1000] flex items-center justify-center p-6">
        <div @click="isConfirmingClear = false" class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div class="relative bg-white dark:bg-[#0a0a0a] rounded-2xl p-8 max-w-sm w-full border border-black/5 dark:border-white/10 shadow-2xl text-center">
          <h4 class="text-xl font-serif mb-2">Clear History?</h4>
          <p class="text-xs text-gray-500 mb-8 italic leading-relaxed">This will permanently remove your local archive of viewed threads.</p>
          <div class="flex gap-3">
            <button @click="isConfirmingClear = false" class="flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-lg border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition">Cancel</button>
            <button @click="clearHistory" class="flex-1 py-3 text-[10px] uppercase tracking-widest font-bold rounded-lg bg-red-500 text-white shadow-lg shadow-red-500/30 hover:opacity-90 transition">Purge</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useForumHistoryStore } from '~/features/store/useForumHistory'
import { capitalize } from "~/shared/capitalise";

const props = defineProps<{
    isCompact?: boolean
}>()

const historyStore = useForumHistoryStore()
const isConfirmingClear = ref(false)

const filters = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: '7 Days' },
  { id: 'month', label: '30 Days' }
] as const

onMounted(() => {
  historyStore.loadFromLocal()
})

function clearHistory() {
  historyStore.clearHistory()
  isConfirmingClear.value = false
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getThreadLikes(threadId: string) {
  const t = historyStore.history.find(item => item.id === threadId)
  return t?.likesCount || 0
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
