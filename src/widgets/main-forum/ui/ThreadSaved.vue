<template>
  <div class="w-full flex flex-col pt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div v-if="!props.isCompact" class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-4">
      <div class="flex-1">
        <h2 class="text-[10px] font-serif uppercase tracking-[0.5em] mb-4 opacity-40">
          Knowledge Base
        </h2>
        <h3 class="text-3xl font-serif tracking-tight mb-8">
          Saved Threads
        </h3>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-4">
      <div class="flex-1">
        <!-- Search Bar -->
        <div class="relative max-w-md group border-b border-black/10 dark:border-white/10 pb-3 focus-within:border-black dark:focus-within:border-white transition-all duration-500">
          <svg class="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            v-model="savedThreads.searchQuery"
            type="text"
            placeholder="Search saved topics..."
            class="w-full bg-transparent pl-8 text-sm focus:outline-none"
          />
        </div>
      </div>

      <!-- Category Filters -->
      <div v-if="savedThreads.availableCategories.length > 0" class="flex flex-wrap justify-end gap-2 max-w-md">
          <button 
            @click="savedThreads.categoryFilter = 'all'"
            class="px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold rounded-full border transition-all duration-300"
            :class="savedThreads.categoryFilter === 'all' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-black/10 dark:border-white/10 opacity-40 hover:text-black dark:hover:text-white'"
          >
            All Categories
          </button>
          <button 
            v-for="cat in savedThreads.availableCategories" 
            :key="cat"
            @click="savedThreads.categoryFilter = cat"
            class="px-3 py-1.5 text-[9px] uppercase tracking-wider font-bold rounded-full border transition-all duration-300"
            :class="savedThreads.categoryFilter === cat ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-black/10 dark:border-white/10 opacity-40 hover:text-black dark:hover:text-white'"
          >
            {{ capitalize(cat) }}
          </button>
      </div>
    </div>

    <div v-if="savedThreads.filteredSavedThreads.length > 0" class="grid gap-4 px-4">
      <NuxtLink 
        v-for="thread in savedThreads.filteredSavedThreads" 
        :key="thread.id" 
        class="group p-6 rounded-2xl border border-black/5 dark:border-white/5 bg-current/[0.03] dark:bg-current/[0.03] hover:bg-white dark:hover:bg-current/[0.06] transition-all duration-500 flex items-center justify-between shadow-sm hover:shadow-xl hover:scale-[1.01]"
      >
        <div>
          <div class="flex items-center gap-4 mb-2">
            <span class="text-[8px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 opacity-50">
              {{ thread.subcategory || thread.category }}
            </span>
            <div class="flex items-center gap-3 text-[10px] opacity-40 font-serif italic">
              <span class="font-medium opacity-80">by {{ getAuthorName(thread.authorId) }}</span>
              <span>·</span>
              <div class="flex items-center gap-1 opacity-60">
                <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <span>{{ thread.likesCount || 0 }}</span>
              </div>
            </div>
          </div>
          <h5 class="text-lg font-serif group-hover:tracking-wide transition-all duration-300">
            {{ thread.title }}
          </h5>
        </div>
        <div class="flex items-center gap-6">
            <button 
                @click.prevent="savedThreads.toggleSaveThread(auth.user?.uid as string, thread.id)"
                class="opacity-40 hover:opacity-100 transition-opacity"
            >
                <svg class="w-4 h-4 fill-current stroke-current" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
            </button>
            <span class="text-[10px] uppercase tracking-widest opacity-40 group-hover:text-black dark:group-hover:text-white transition-colors">
              Open Topic →
            </span>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-32 text-center px-4">
      <div class="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
        <svg class="w-6 h-6 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </div>
      <p class="text-sm font-serif italic opacity-50">
        {{ savedThreads.searchQuery || savedThreads.categoryFilter !== 'all' ? 'No matching saved topics' : 'Your saved archive is currently empty' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSavedThreadsStore } from '~/features/store/useSavedThreads'
import { useForumStore } from '~/features/store/useForum'
import { useAuthStore } from '~/entities/user/auth.store'
import { capitalize } from "~/shared/capitalise";

const props = defineProps<{
    isCompact?: boolean
}>()

const savedThreads = useSavedThreadsStore()
const forumStore = useForumStore()
const auth = useAuthStore()

const savedThreadsList = computed(() => {
  return savedThreads.savedThreadIds
    .map(id => forumStore.threads.get(id))
    .filter(Boolean) as any[]
})

// Avatar and Likes helpers
const fetchingUsers = new Set()
function getAuthorName(authorId: string) {
  if (!authorId) return 'Anonymous'
  const user = forumStore.users.get(authorId)
  if (user) return user.displayName || user.name || 'Anonymous'
  
  if (!fetchingUsers.has(authorId)) {
    fetchingUsers.add(authorId)
    forumStore.fetchUser(authorId).finally(() => {
      fetchingUsers.delete(authorId)
    })
  }
  return '...'
}

</script>
