<template>
  <div
    class="journal-wrapper force-light-theme bg-theme-bg text-theme-text h-full flex flex-col min-w-0 overflow-hidden relative pt-4 md:pt-6"
    :class="{ 'exforum-transparent-bg': isForumLightTheme }"
  >
    <!-- Inner Shadows -->
    <div v-if="showForumEdgeShadows" class="forum-edge-shadow forum-edge-shadow-top"></div>
    <div v-if="showForumEdgeShadows" class="forum-edge-shadow forum-edge-shadow-bottom"></div>
    
    <Transition name="fade-slide" mode="out-in">
    <!-- READER VIEW: Detailed Content -->
    <ExNodeContent v-if="selectedNode" :node="selectedNode" @back="closeReader" key="reader" />

    <!-- JOURNAL VIEW: Front Page & Archive -->
    <div v-else class="flex flex-col h-full overflow-hidden" :key="`page-${currentPage}`">
      
      <!-- Masthead (Page 1 Only) -->
      <header v-if="currentPage === 1" class="pt-8 pb-4 border-b-4 border-double border-current/20 flex flex-col items-center space-y-4 px-8 relative z-10">
        <div class="flex items-center justify-between w-full text-[8px] font-mono tracking-[0.6em] opacity-40 uppercase">
          <span>Vol. XXIV // No. 12</span>
          <span class="text-[10px] tracking-[1em] italic font-serif">Reification Edition</span>
          <span>Reified on {{ new Date().toLocaleDateString() }}</span>
        </div>
        
        <h1 class="text-6xl font-serif italic tracking-tighter text-current opacity-90 text-center py-4 drop-shadow-sm cursor-pointer" @click="navigateToPage(1)">
          The Eve's Apple
        </h1>

        <div class="flex items-center justify-between w-full border-t border-current/10 pt-4 px-4">
          <!-- Filters -->
          <div class="flex items-center space-x-8">
            <div v-for="tag in ['SETUPS', 'RESEARCH', 'PROTOCOL', 'INQUIRY']" :key="tag" 
                 class="text-[9px] font-mono tracking-[0.4em] opacity-30 hover:opacity-100 transition-opacity cursor-pointer">
              {{ tag }}
            </div>
          </div>

          <!-- Search Bar -->
          <div class="relative flex items-center group/search">
            <span class="absolute left-0 text-[10px] font-mono opacity-20 group-focus-within/search:opacity-100 transition-opacity uppercase tracking-widest">Search_</span>
            <input v-model="searchQuery" 
                   type="text" 
                   placeholder="INDEX_REIFICATION"
                   class="bg-transparent border-b border-current/10 py-2 pl-20 pr-4 text-[10px] font-mono tracking-widest focus:outline-none focus:border-current/40 w-48 transition-all focus:w-80 placeholder:opacity-20 uppercase" />
          </div>
        </div>
      </header>

      <!-- Main Journal Body -->
      <div class="flex-grow overflow-y-auto scroll-minimal relative z-10 pb-0">
        
        <!-- DYNAMIC MAGAZINE LAYOUT -->
        <div v-if="pagedNodes.length > 0" class="flex flex-col">
          <!-- SECTION 1: Top Row (Lead Setup + Inquiry Sidebar) -->
          <div class="grid grid-cols-12 border-b border-current/10">
            <section class="journal-sector col-span-12 lg:col-span-8 px-12 pb-12 pt-6 lg:border-r border-current/10">
              <div class="flex flex-col space-y-12">
                <div class="flex items-center justify-between border-b border-current/10 pb-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-1.5 h-1.5 bg-current opacity-30 transform rotate-45"></div>
                    <h2 class="text-sm font-mono tracking-[0.4em] uppercase opacity-60">Strategic Setups</h2>
                  </div>
                  <span v-if="currentPage > 1" class="text-[9px] font-mono opacity-20 uppercase tracking-widest">Edition_0{{ currentPage }}</span>
                </div>
                <ExJournalSpotlight v-if="pagedSetups[0]" :node="pagedSetups[0]" @click="navigateToNode(pagedSetups[0].id)" />
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-current/10 pt-8">
                  <ExNodeCard v-for="node in pagedSetups.slice(1, 3)" :key="node.id" :node="node" />
                </div>
              </div>
            </section>
            
            <section class="journal-sector col-span-12 lg:col-span-4 px-8 pb-8 pt-6">
              <div class="space-y-12">
                 <div class="flex items-center space-x-3 border-b border-current/10 pb-4">
                   <div class="w-1 h-1 bg-current opacity-20"></div>
                   <h2 class="text-xs font-mono tracking-[0.3em] uppercase opacity-50">Inquiry Voices</h2>
                </div>
                <div class="space-y-6">
                  <ExNodeCard v-for="node in pagedInquiry.slice(0, 3)" :key="node.id" :node="node" />
                </div>
              </div>
            </section>
          </div>

          <!-- SECTION 2: Middle Horizontal (Market Ledger) -->
          <section class="journal-sector p-12 border-b border-current/10">
            <div class="flex flex-col space-y-12">
              <div class="flex items-center justify-between border-b border-current/10 pb-4">
                <div class="flex items-center space-x-3">
                  <div class="w-1.5 h-1.5 bg-current opacity-30 transform rotate-45"></div>
                  <h2 class="text-sm font-mono tracking-[0.4em] uppercase opacity-60">Market Ledger</h2>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                <ExNodeCard v-for="node in pagedResearch.slice(0, 3)" :key="node.id" :node="node" />
              </div>
            </div>
          </section>

          <!-- SECTION 3: Bottom Strip (Protocol Masterclass) -->
          <section class="journal-sector p-12">
            <div class="flex flex-col space-y-12">
              <div class="flex items-center justify-between border-b border-current/10 pb-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-1.5 h-1.5 bg-current opacity-30 transform rotate-45"></div>
                    <h2 class="text-sm font-mono tracking-[0.4em] uppercase opacity-60">Protocol Masterclass</h2>
                  </div>
              </div>
              <div class="flex overflow-x-auto space-x-12 scroll-minimal pb-4">
                <div v-for="node in pagedLessons.slice(0, 3)" :key="node.id" class="min-w-[400px]">
                  <ExNodeCard :node="node" class="!border-none" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- NO CONTENT WARNING: The Reification Void -->
        <div v-else class="flex flex-col items-center justify-center py-48 px-12 space-y-8 animate-pulse text-center">
            <div class="text-4xl font-serif italic tracking-tighter opacity-20">
               The Reification Void
            </div>
            <div class="w-12 h-px bg-current opacity-10"></div>
            <p class="max-w-md text-[10px] font-mono tracking-[0.3em] uppercase opacity-30 leading-loose">
               Caution: You have reached the edge of the indexed registry. 
               No tactical intelligence or archival nodes have been reified at this temporal coordinate.
            </p>
            <button @click="navigateToPage(1)" class="mt-8 text-[9px] font-mono tracking-[0.4em] uppercase border border-current/20 px-8 py-3 hover:bg-current/5 transition-all">
               [ Return_to_Origin ]
            </button>
        </div>

        <!-- Pagination Controls -->
        <div class="p-12 flex flex-col items-center space-y-8 border-t border-current/10 mt-12">
           <div class="flex items-center space-x-12">
              <button v-if="currentPage > 1" @click="navigateToPage(currentPage - 1)" 
                      class="px-8 py-3 border border-current/10 text-[9px] font-mono tracking-[0.4em] uppercase opacity-40 hover:opacity-100 hover:bg-current/[0.02] transition-all">
                [ PREV_PAGE ]
              </button>
              <button @click="navigateToPage(currentPage + 1)" 
                      class="px-8 py-3 bg-zinc-800 text-white text-[9px] font-mono tracking-[0.4em] uppercase hover:shadow-[0_0_30px_rgba(var(--text-primary-rgb),0.1)] transition-all">
                [ NEXT_PAGE // ARV_0{{ currentPage + 1 }} ]
              </button>
           </div>
           
           <div class="text-[7px] font-mono opacity-20 uppercase tracking-[0.8em]">End of Indexed Reification</div>
        </div>

        <!-- Journal Footer -->
        <footer class="py-4 text-center opacity-10 hover:opacity-100 transition-opacity duration-700">
          <div class="flex flex-col items-center space-y-4">
            <div class="text-[10px] font-serif italic tracking-widest text-current">"Knowledge Reified. Value Extracted."</div>
            <div class="w-24 h-px bg-current/20 mx-auto text-current"></div>
            <div class="text-[7px] font-mono tracking-[0.8em] uppercase text-current">The Eve's Apple // Distributed Intel Hub</div>
          </div>
        </footer>

      </div>
    </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '~/features/store/useTheme'
import { mockExNodes } from '~/entities/exnode/model/exnode.mock'
import ExNodeCard from '~/entities/exnode/ui/ExNodeCard.vue'
import ExNodeContent from '~/entities/exnode/ui/ExNodeContent.vue'
import ExJournalSpotlight from '~/widgets/exforum/ui/ExJournalSpotlight.vue'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()

// Archival State
const searchQuery = ref('')
const isForumLightTheme = computed(() => !themeStore.settings.isDark)
const showForumEdgeShadows = computed(() => themeStore.settings.isDark)

// Pagination Logic
const currentPage = computed(() => Number(route.query.page) || 1)
const nodesPerPage = 12

const filteredNodes = computed(() => {
  if (!searchQuery.value) return mockExNodes
  const q = searchQuery.value.toLowerCase()
  return mockExNodes.filter((n: any) => 
    n.title.toLowerCase().includes(q) || 
    n.thesis_brief?.toLowerCase().includes(q) ||
    n.category.toLowerCase().includes(q)
  )
})

const pagedNodes = computed(() => {
  const start = (currentPage.value - 1) * nodesPerPage
  return filteredNodes.value.slice(start, start + nodesPerPage)
})

const pagedSetups = computed(() => pagedNodes.value.filter((n: any) => n.mode === 'SETUP'))
const pagedResearch = computed(() => pagedNodes.value.filter((n: any) => n.mode === 'RESEARCH'))
const pagedLessons = computed(() => pagedNodes.value.filter((n: any) => n.mode === 'LESSON'))
const pagedInquiry = computed(() => pagedNodes.value.filter((n: any) => n.mode === 'QUESTION'))

const navigateToPage = (page: number) => {
  const query = { ...route.query, page: page === 1 ? undefined : page.toString() }
  router.replace({ query })
}

// Reader Logic
const selectedNodeId = computed(() => route.query.nodeId as string | undefined)
const selectedNode = computed(() => mockExNodes.find((n: any) => n.id === selectedNodeId.value))

const closeReader = () => {
  const query = { ...route.query }
  delete query.nodeId
  router.replace({ query })
}

const navigateToNode = (id: string) => {
  router.replace({
    query: {
      ...route.query,
      nodeId: id
    }
  })
}

// Scroll to Top Logic
watch(() => [route.query.nodeId, route.query.page], () => {
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const scrollContainers = document.querySelectorAll('.scroll-minimal, .overflow-y-auto, main, .ethereal-void')
    scrollContainers.forEach(container => {
      container.scrollTo({ top: 0, behavior: 'smooth' })
    })
  })
}, { immediate: true })

// Sectional Intelligence Logic (Inherited by paged computed)
</script>

<style scoped>
.force-light-theme {
  --theme-bg: #FFFFFF !important;
  --theme-panel: rgba(255, 255, 255, 0.92) !important;
  --theme-text: #2c2c2a !important;
  --theme-muted: rgba(44, 44, 42, 0.58) !important;
  --theme-border: rgba(44, 44, 42, 0.12) !important;
  --theme-border-strong: rgba(44, 44, 42, 0.28) !important;
  --theme-accent: #8d7f61 !important;
  --theme-grid-dot: rgba(44, 44, 42, 0.24) !important;
  --theme-tooltip-bg: #F9F9F9 !important;
  --theme-tooltip-text: #2c2c2a !important;
  --theme-tooltip-muted: rgba(44, 44, 42, 0.62) !important;
  --theme-tooltip-border: rgba(44, 44, 42, 0.18) !important;
  --text-heading: #050505 !important;
  --text-description: rgba(18, 18, 18, 0.45) !important;
  --icon-color-mode: black !important;
  
  background-color: var(--theme-bg) !important;
  color: var(--theme-text) !important;
}

.force-light-theme.exforum-transparent-bg {
  background-color: transparent !important;
}

.force-light-theme * {
  border-color: var(--theme-border);
}
</style>

<style scoped>
.journal-wrapper {
  color: var(--text-primary);
}

.forum-edge-shadow {
  height: min(34vh, 260px);
  left: 0;
  mix-blend-mode: multiply;
  pointer-events: none;
  position: absolute;
  width: 100%;
  z-index: 100;
}

.forum-edge-shadow-top {
  background:
    radial-gradient(ellipse 120% 86% at 50% 0%, rgba(0, 0, 0, 0.11) 0%, rgba(0, 0, 0, 0.07) 28%, rgba(0, 0, 0, 0.026) 58%, rgba(0, 0, 0, 0) 82%),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.07) 0%, rgba(0, 0, 0, 0.038) 34%, rgba(0, 0, 0, 0.014) 68%, rgba(0, 0, 0, 0) 100%);
  top: 0;
}

.forum-edge-shadow-bottom {
  background:
    radial-gradient(ellipse 120% 86% at 50% 100%, rgba(0, 0, 0, 0.11) 0%, rgba(0, 0, 0, 0.07) 28%, rgba(0, 0, 0, 0.026) 58%, rgba(0, 0, 0, 0) 82%),
    linear-gradient(to top, rgba(0, 0, 0, 0.07) 0%, rgba(0, 0, 0, 0.038) 34%, rgba(0, 0, 0, 0.014) 68%, rgba(0, 0, 0, 0) 100%);
  bottom: 0;
}

.journal-sector {
  position: relative;
}

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-slide-enter-from { opacity: 0; transform: translateY(20px); filter: blur(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-20px); filter: blur(20px); }

.scroll-minimal::-webkit-scrollbar { display: none; }
.scroll-minimal { scrollbar-width: none; }

.grid-auto-flow-dense {
  grid-auto-flow: dense;
}

/* Double border for masthead authority */
.border-double {
  border-style: double;
}
</style>
