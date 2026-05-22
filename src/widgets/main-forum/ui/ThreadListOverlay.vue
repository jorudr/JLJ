<template>
  <div class="w-full flex flex-col h-full animate-fadeIn flex-1">
    
    <!-- Top Header Navigation and Search -->
    <div class="flex items-center justify-between mb-12">
      <!-- Search Input -->
      <div class="w-full max-w-sm">
        <!-- Search Input -->
        <div class="relative w-full group border-b border-black/10 dark:border-white/10 pb-2 focus-within:border-black dark:focus-within:border-white transition-all duration-500">
          <svg class="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa] group-focus-within:text-black dark:group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            v-model="localSearchQuery"
            type="text"
            :placeholder="`Search ${categoryName}...`"
            class="w-full bg-transparent pl-7 text-xs focus:outline-none placeholder-[#ccc] dark:placeholder-[#555] text-[#050505] dark:text-white"
          />
        </div>
      </div>




      <button 
        @click="$emit('close')" 
        class="text-[9px] uppercase tracking-[0.3em] text-[#bbb] hover:text-black dark:hover:text-white transition-colors"
      >
        Close ✕
      </button>
    </div>

    <!-- Header Description & Filters -->
    <div class="flex flex-col md:flex-row items-end justify-between gap-8 mb-14">
      <div>
        <h2 class="text-31xl font-serif text-[#050505] dark:text-[#eee] mb-2 leading-tight tracking-tight">{{ categoryName }}</h2>
        <p class="text-sm text-[#444] dark:text-[#888] font-serif italic max-w-xl leading-relaxed">{{ categoryDesc }}</p>
      </div>

      <!-- Sorting Selector (Relocated Here) -->
      <div class="flex items-center p-1 rounded-full border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] backdrop-blur-sm shadow-inner shrink-0 mb-1">
        <button 
          v-for="option in sortOptions" 
          :key="option.id"
          @click="sortBy = option.id"
          class="px-5 py-2 rounded-full text-[10px] font-serif uppercase tracking-[0.25em] transition-all duration-500 ease-out"
          :class="sortBy === option.id 
            ? 'bg-[#c49b6b] text-white shadow-md transform scale-105 z-10' 
            : 'text-[#888] hover:text-[#050505] dark:hover:text-white'"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Thread List -->
    <div class="flex-1 min-h-[300px] flex flex-col justify-between">
      
      <div v-if="paginatedThreads.length > 0" class="flex flex-col gap-5">
        <div 
          v-for="(thread, index) in paginatedThreads" 
          :key="thread.id"
          class="group p-6 shadow-sm shadow-black/30 rounded-3xl border transition-all duration-700 cursor-pointer relative overflow-hidden"
          :class="[
            (index === 0 && currentPage === 0) 
              ? 'premium-thread-highlight border-transparent ' 
              : 'border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/5 hover:drop-shadow-2xl transition-all duration-700'
          ]"
          @click="$router.push(`/forum/thread/${thread.id}`)"
        >
          <!-- Liquid Background for Top Item -->
          <div v-if="index === 0 && currentPage === 0" class="absolute inset-0 liquid-bg opacity-30 pointer-events-none"></div>
          
          <!-- Pin Icon (Top Item Only) -->
          <div v-if="index === 0 && currentPage === 0" class="absolute top-5 right-5 text-[#c49b6b] drop-shadow-sm">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22L12,22.8L12.8,22V16H18V14L16,12Z" />
            </svg>
          </div>
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <h3 class="text-base font-serif text-[#050505] dark:text-[#eee] group-hover:tracking-wide transition-all duration-300 mb-2">
                {{ thread.title }}
              </h3>
              <p class="text-[11px] text-[#444] dark:text-[#888] line-clamp-2 leading-relaxed mb-4">
                {{ thread.description }}
              </p>
              
              <!-- Thread Metadata -->
              <div class="flex items-center gap-4 text-[9px] uppercase tracking-[0.1em] text-[#666] dark:text-[#777]">
                <div class="flex items-center gap-2">
                  <!-- Avatar -->
                  <div class="relative w-4 h-4 shrink-0">
                    <div class="absolute inset-0 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[7px] font-sans border dark:border-white/5 border-black/5 select-none text-[#777]">
                      {{ getAuthorName(thread.authorId).charAt(0) }}
                    </div>
                    <img v-if="getUserAvatar(thread.authorId) && !imgErrors[thread.id]" @error="imgErrors[thread.id] = true" :src="getUserAvatar(thread.authorId)" referrerpolicy="no-referrer" class="absolute inset-0 w-4 h-4 rounded-full object-cover shadow-sm" alt="Avatar"/>
                  </div>
                  <span class="font-medium text-[#c49b6b] dark:text-[#d8b488]">
                    {{ getAuthorName(thread.authorId) }}
                  </span>
                </div>
                <span>•</span>
                <div class="flex items-center gap-1">
                  <svg class="w-3 h-3 fill-none stroke-current" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.38-.432 1.628-1.52 3.25-1.52 3.25s2.5 .25 4.604-1.28A9.37 9.37 0 0012 20.25z"/></svg>
                  {{ thread.repliesCount || 0 }}
                </div>
                <span>•</span>
                <div class="flex items-center gap-1">
                  <svg class="w-3 h-3 fill-current text-rose-500/80" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  {{ thread.likesCount || 0 }}
                </div>
                <span>•</span>
                <span>{{ timeAgo(thread.lastActivityAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-else class="flex-1 flex flex-col items-center justify-center text-center opacity-60 my-10">
        <svg class="w-8 h-8 mb-4 text-[#aaa]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <span class="text-xs uppercase tracking-[0.2em] text-[#777]">No threads found</span>
      </div>

      <!-- Pagination Footer -->
      <div v-if="totalPages > 1" class="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
        <span class="text-[9px] uppercase tracking-widest text-[#777] dark:text-[#bbb]">
          Page {{ currentPage + 1 }} of {{ totalPages }}
        </span>
        <div class="flex gap-4">
          <button 
            @click="handlePrevPage" 
            :disabled="currentPage === 0"
            class="text-[9px] uppercase tracking-[0.3em] transition-colors"
            :class="currentPage === 0 ? 'opacity-20 cursor-not-allowed' : 'text-black dark:text-white hover:opacity-100'"
          >
            ← Prev
          </button>
          <button 
            @click="handleNextPage" 
            :disabled="currentPage >= totalPages - 1"
            class="text-[9px] uppercase tracking-[0.3em] transition-colors"
            :class="currentPage >= totalPages - 1 ? 'opacity-20 cursor-not-allowed' : 'text-black dark:text-white hover:opacity-100'"
          >
           Next →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useForumStore } from '~/features/store/useForum'
import type { Thread } from '~/entities/thread/model/thread.types'
import { timeAgo } from '~/composables/timeAgo'

const props = defineProps<{
  categoryId: string
  categoryName: string
  categoryDesc: string
  threads: Thread[]
}>()

const emit = defineEmits(['close'])

const forum = useForumStore()
const localSearchQuery = ref('')
const currentPage = ref(0)
const itemsPerPage = 5
const imgErrors = ref<Record<string, boolean>>({})

const sortBy = ref('newest')
const sortOptions = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'likes', label: 'Reputation' },
  { id: 'worst', label: 'Low Rep' }
]

function parseDate(val: any) {
  if (!val) return 0
  if (typeof val === 'object' && val.seconds !== undefined) return val.seconds * 1000
  const parsed = Date.parse(val)
  return isNaN(parsed) ? 0 : parsed
}

// Filter threads by category and search
const filteredThreads = computed(() => {
  let result = props.threads.filter(t => t.category === props.categoryId)
  
  if (localSearchQuery.value) {
    const q = localSearchQuery.value.toLowerCase()
    result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
  }
  
  // Apply sorting
  if (sortBy.value === 'newest') {
    return result.sort((a, b) => parseDate(b.createdAt) - parseDate(a.createdAt))
  } else if (sortBy.value === 'oldest') {
    return result.sort((a, b) => parseDate(a.createdAt) - parseDate(b.createdAt))
  } else if (sortBy.value === 'likes') {
    return result.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
  } else if (sortBy.value === 'worst') {
    return result.sort((a, b) => (a.likesCount || 0) - (b.likesCount || 0))
  }
  
  return result
})

const totalPages = computed(() => Math.ceil(filteredThreads.value.length / itemsPerPage))

const paginatedThreads = computed(() => {
  const start = currentPage.value * itemsPerPage
  return filteredThreads.value.slice(start, start + itemsPerPage)
})

function handlePrevPage() {
  if (currentPage.value > 0) currentPage.value--
}

function handleNextPage() {
  if (currentPage.value < totalPages.value - 1) currentPage.value++
}

// Reset pagination on search
import { watch } from 'vue'
watch(localSearchQuery, () => {
  currentPage.value = 0
})

// Removed stripHtml since we are using plain-text description field now

// Minimal user fetcher logic identical to what we had in List.vue
const fetchingUsers = new Set()
function getAuthorName(authorId: string) {
  if (!authorId) return 'Anonymous'
  
  const user = forum.users.get(authorId)
  if (user) return user.displayName || user.name || 'Anonymous'
  
  if (!fetchingUsers.has(authorId)) {
    fetchingUsers.add(authorId)
    forum.fetchUser(authorId).finally(() => {
      fetchingUsers.delete(authorId)
    })
  }
  return '...'
}

function getUserAvatar(authorId: string) {
  if (!authorId) return null
  const user = forum.users.get(authorId)
  return user?.photoURL || user?.avatar || null
}
</script>

<style scoped>
.animate-fadeIn {
  animation: fadeInList 0.5s ease-out forwards;
}

@keyframes fadeInList {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.premium-thread-highlight {
  /* For Light theme: Very soft ivory/sand depth with deep shadow */
  background: rgba(196, 155, 107, 0.03); 
  backdrop-filter: blur(30px);
  box-shadow: 
    0 25px 60px -15px rgba(0, 0, 0, 0.2), /* Deep black premium shadow */
    inset 0 0 0 0.5px rgba(196, 155, 107, 0.1);
  border: none !important;
  position: relative;
  z-index: 1;
}

.dark .premium-thread-highlight {
  /* For Dark theme: Substantially deeper glow/shadow */
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 
    0 25px 60px -15px rgba(0, 0, 0, 0.6),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.03);
  border: none !important;
}

.liquid-bg {
  /* Sophisticated palette: Champagne Gold to Ivory */
  background: linear-gradient(-45deg, #f5f5f0, #fdfbf7, #f5f5f0, #e8e6e1);
  background-size: 400% 400%;
  animation: liquidGradient 35s ease-in-out infinite;
  filter: blur(60px);
}

.dark .liquid-bg {
  /* Darker variants for the liquid motion in dark mode */
  background: linear-gradient(-45deg, #0a0a0a, #2a2a2a, #0a0a0a, #252525);
}

.premium-thread-highlight .liquid-bg {
  opacity: 0.15; /* Barely visible lux texture */
}

@keyframes liquidGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
