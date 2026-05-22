<template>
<main class="min-h-screen">


  <section class="border-t border-b border-black/10 dark:border-white/10 relative overflow-hidden py-24 min-h-[600px] flex items-center">
    <!-- Subtle grid background -->
    <div class="absolute inset-0 z-0 pointer-events-none opacity-[0.2] mix-blend-overlay" style="background-image: radial-gradient(rgba(0,0,0,0.1) 1px, transparent 1px); background-size: 32px 32px;"></div>

    <div class="max-w-6xl mx-auto px-8 w-full relative z-10 flex flex-col items-center">
      
      <!-- Top Bar: Title & Search (Centered) -->
      <transition name="fade">
        <div v-if="!activeListCategory" class="w-full max-w-4xl flex flex-col items-center text-center mb-24">
          <h2 class="text-[10px] font-serif uppercase tracking-[0.5em] mb-4">
            Knowledge System
          </h2>
          <h3 class="text-4xl lg:text-5xl font-serif tracking-tight mb-12">
            Explore the Methodology
          </h3>

          <div class="relative w-full max-w-md group border-b border-black/10 dark:border-white/10 pb-3 focus-within:border-black dark:focus-within:border-white transition-all duration-500">
            <svg class="absolute left-0 top-1/2 -translate-y-[calc(50%+6px)] w-4 h-4 text-[#aaa] group-focus-within:text-black dark:group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Search topics, methods, or models..."
              class="w-full bg-transparent pl-8 text-sm focus:outline-none text-center pr-8"
            />
          </div>
        </div>
      </transition>

      <transition name="fade" mode="out-in">
        <div v-if="!activeListCategory" class="grid md:grid-cols-2 gap-20 lg:gap-32 items-start w-full">
          <!-- LEFT: Permanent Navigator Semicircle (Upscaled) -->
        <div class="relative w-full max-w-lg mx-auto md:mx-0 aspect-[2/1] select-none flex items-end justify-center pt-10">
          
          <svg viewBox="0 0 400 200" class="w-[120%] h-[120%] overflow-visible">
            <defs>
              <filter id="elegantShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="12" stdDeviation="15" flood-color="#000" flood-opacity="0.1"/>
              </filter>
            </defs>

            <!-- Main Sections - Permanent View -->
            <g v-for="arc in mainSectionArcs" :key="arc.id" 
               @mouseenter="hoveredMainSection = arc.id" 
               @mouseleave="hoveredMainSection = null"
               @click="activeSection = arc.id; currentPage = 0"
               class="cursor-pointer transition-all duration-700 transform origin-[200px_200px]"
               :class="[
                 (hoveredMainSection === arc.id || activeSection === arc.id || isMainSectionMatch(arc.id)) ? 'scale-[1.04] opacity-100' : 'scale-100 opacity-40',
                 activeSection === arc.id ? 'z-20' : 'z-10'
               ]">
              
              <path 
                :d="arc.path" 
                class="transition-all duration-700 stroke-[1px] stroke-black/5 dark:stroke-white/5"
                :class="activeSection === arc.id ? 'fill-black/10 dark:fill-white/10' : 'fill-black/5 dark:fill-white/5'"
                :filter="(hoveredMainSection === arc.id || activeSection === arc.id) ? 'url(#elegantShadow)' : ''"
              />
              
              <text 
                :x="arc.midPos.x" 
                :y="arc.midPos.y + 3" 
                text-anchor="middle" 
                class="text-[10px] font-medium tracking-[0.25em] pointer-events-none uppercase transition-all duration-500"
                style="fill: var(--text-heading)"
                :class="(activeSection === arc.id || hoveredMainSection === arc.id) ? 'opacity-100 font-bold' : 'opacity-60'"
              >
                {{ arc.shortLabel }}
              </text>
            </g>
          </svg>

          <!-- Minimalist indicator for active selection -->
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 rounded-t-full border border-b-0 border-black/5 dark:border-white/5 pointer-events-none flex items-center justify-center pt-8">
             <transition name="fade" mode="out-in">
                <span :key="activeSection || 'none'" class="text-[8px] tracking-[0.4em] uppercase">
                  {{ activeSection ? 'Inspecting' : 'System Navigator' }}
                </span>
             </transition>
          </div>
        </div>

        <!-- RIGHT: Category Cloud / Tiles -->
        <div class="flex flex-col min-h-[400px]">
          <transition name="fade" mode="out-in">
            <div :key="activeSection || 'none'" class="h-full">
              
              <div v-if="activeSection" class="flex flex-col h-full">
                 <div class="mb-10">
                    <span class="text-2xl font-serif mb-3 block">
                      {{ mainSections.find(s => s.id === activeSection)?.name }}
                    </span>
                    <p class="text-xs font-serif italic max-w-sm leading-relaxed text-[#444] dark:text-[#888]">
                      {{ mainSections.find(s => s.id === activeSection)?.desc }}
                    </p>
                 </div>

                 <!-- Category Grid (The Cloud with Pagination) -->
                 <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div 
                       v-for="cat in paginatedCategories" 
                       :key="cat.id"
                       @click="handleCategoryClick(cat)"
                       class="group p-5 rounded-2xl border transition-all duration-500 cursor-pointer flex flex-col justify-between min-h-[140px]"
                       :class="[
                         isCategoryMatch(cat) ? 'border-black dark:border-white scale-[1.02] shadow-xl' : 'border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20',
                         (searchQuery && !isCategoryMatch(cat)) ? 'opacity-30' : 'opacity-100'
                       ]"
                    >
                       <div>
                         <h4 class="text-sm font-serif group-hover:tracking-wider transition-all duration-300 mb-2">
                           {{ cat.name }}
                         </h4>
                         <p class="text-[10px] leading-relaxed line-clamp-2 text-[#444] dark:text-[#888]">
                           {{ cat.desc }}
                         </p>
                       </div>
                       <div class="flex items-center justify-between mt-4">
                          <span class="text-[8px] tracking-[0.2em] uppercase text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors">Enter →</span>
                          <div class="w-1.5 h-1.5 rounded-full bg-black/5 dark:bg-white/5 group-hover:bg-black dark:group-hover:bg-white transition-colors"></div>
                       </div>
                    </div>
                 </div>

                 <!-- Pagination Footer -->
                 <div v-if="totalPages > 1" class="mt-8 flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-6">
                    <span class="text-[9px] uppercase tracking-widest text-gray-500">
                       Page {{ currentPage + 1 }} of {{ totalPages }}
                    </span>
                    <div class="flex gap-4">
                       <button 
                         @click="currentPage--" 
                         :disabled="currentPage === 0"
                         class="text-[9px] uppercase tracking-[0.3em] transition-colors"
                         :class="currentPage === 0 ? 'opacity-20 cursor-not-allowed' : 'text-black dark:text-white hover:opacity-100'"
                       >
                         ← Prev
                       </button>
                       <button 
                         @click="currentPage++" 
                         :disabled="currentPage >= totalPages - 1"
                         class="text-[9px] uppercase tracking-[0.3em] transition-colors"
                         :class="currentPage >= totalPages - 1 ? 'opacity-20 cursor-not-allowed' : 'text-black dark:text-white hover:opacity-100'"
                       >
                         Next →
                       </button>
                    </div>
                 </div>

                 <button 
                   @click="resetViews" 
                   class="mt-12 self-start text-[9px] uppercase tracking-[0.3em] font-medium text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                 >
                   ← Global View
                 </button>
              </div>

              <!-- Default View (Manual Selection) -->
              <div v-else class="flex flex-col justify-center h-full pt-10">
                <div class="space-y-12">
                   <div v-for="section in mainSections" :key="section.id" 
                        @mouseenter="hoveredMainSection = section.id"
                        @mouseleave="hoveredMainSection = null"
                        @click="activeSection = section.id; currentPage = 0"
                        class="group cursor-pointer max-w-md transition-all duration-500"
                        :class="(hoveredMainSection === section.id || isMainSectionMatch(section.id)) ? 'translate-x-4' : ''"
                   >
                      <span class="text-[9px] tracking-[0.3em] text-gray-500 mb-2 block group-hover:text-black dark:group-hover:text-white transition-colors">{{ section.shortLabel }}</span>
                      <h4 class="text-xl font-serif mb-2">{{ section.name }}</h4>
                      <p class="text-xs font-serif italic">{{ section.desc }}</p>
                   </div>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>
      
      <!-- List View Overlay -->
      <div v-else class="w-full max-w-5xl mx-auto flex flex-col items-center">
        <ThreadListOverlay 
          v-if="activeListCategory"
          :categoryId="activeListCategory.id"
          :categoryName="activeListCategory.name"
          :categoryDesc="activeListCategory.desc"
          :threads="props.threads"
          @close="activeListCategory = null"
        />
      </div>
    </transition>
  </div>
</section>


 


  <section class="border-t border-black/10 dark:border-white/10 mb-20 scroll-mt-20" id="forum-archive">
    <div class="max-w-6xl mx-auto px-8 py-20">
       <div class="flex flex-col md:flex-row items-baseline justify-between mb-16 gap-8">
          <div class="flex-1">
            <h2 class="text-[10px] font-serif uppercase tracking-[0.5em] mb-4 text-gray-400">
              Personal Archive
            </h2>
            <div class="flex items-center gap-12">
              <button 
                @click="archiveStore.setActiveTab('saved')"
                class="group flex flex-col items-start transition-all duration-500"
                :class="archiveStore.activeTab === 'saved' ? 'opacity-100' : 'opacity-30 hover:opacity-100'"
              >
                <span class="text-3xl font-serif tracking-tight">Saved Topics</span>
                <div class="h-px bg-emerald-500 transition-all duration-700 mt-2" :class="archiveStore.activeTab === 'saved' ? 'w-24' : 'w-0 group-hover:w-12'"></div>
              </button>
              
              <button 
                @click="archiveStore.setActiveTab('history')"
                class="group flex flex-col items-start transition-all duration-500"
                :class="archiveStore.activeTab === 'history' ? 'opacity-100' : 'opacity-30 hover:opacity-100'"
              >
                <span class="text-3xl font-serif tracking-tight">Recent Search</span>
                <div class="h-px bg-slate-400 dark:bg-slate-500 transition-all duration-700 mt-2" :class="archiveStore.activeTab === 'history' ? 'w-24' : 'w-0 group-hover:w-12'"></div>
              </button>
            </div>
          </div>
       </div>

       <transition name="fade" mode="out-in">
          <div :key="archiveStore.activeTab">
            <ThreadSaved v-if="archiveStore.activeTab === 'saved'" :is-compact="true" />
            <ThreadHistory v-if="archiveStore.activeTab === 'history'" :is-compact="true" />
          </div>
       </transition>
    </div>
  </section>
</main>

</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useForumCategoryStore } from '~/features/store/useForumCategory'
import ThreadRecent from "@/entities/thread/ui/ThreadRecent.vue";
import ThreadListOverlay from "~/widgets/main-forum/ui/ThreadListOverlay.vue";
import ThreadHistory from "~/widgets/main-forum/ui/ThreadHistory.vue";
import ThreadSaved from "~/widgets/main-forum/ui/ThreadSaved.vue";
import { useMainForum } from "~/widgets/main-forum/model/useMainForum"
import type { Thread } from "~/entities/thread/model/thread.types"
import { useForumHistoryStore } from '~/features/store/useForumHistory'
import { useAuthStore } from '~/entities/user/auth.store'
import { useForumArchiveStore } from '~/features/store/useForumArchive'

const props = defineProps<{
    threads: Thread[]
}>()

const { recentThreads } = useMainForum(props.threads)
const auth = useAuthStore()
const archiveStore = useForumArchiveStore()

// Optional: keep router if used elsewhere, else remove
// import { useRouter } from 'vue-router'
// const router = useRouter()

// --- Interactive Semicircle Logic ---

const forumCategory = useForumCategoryStore()
const mainSections = forumCategory.mainSections
const categories = forumCategory.categories

const activeSection = ref<string | null>(forumCategory.activeSectionId)
const hoveredMainSection = ref<string | null>(null)
const searchQuery = ref('')
const currentPage = ref(0)
const itemsPerPage = 4
const activeListCategory = ref<{id: string, name: string, desc: string} | null>(null)

import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

onMounted(() => {
  if (route.query.restore === 'true' && forumCategory.activeCategoryId) {
    // Look up the category object to restore the overlay
    for (const sectionId in categories) {
      const sectionCats = categories[sectionId]
      if (!sectionCats) continue
      const cat = sectionCats.find(c => c.id === forumCategory.activeCategoryId)
      if (cat) {
        activeListCategory.value = cat
        activeSection.value = sectionId
        break
      }
    }
  } else if (route.query.restore === 'true' && forumCategory.activeSectionId) {
    activeSection.value = forumCategory.activeSectionId
  }
})

const historyStore = useForumHistoryStore()


function isCategoryMatchForQuery(cat: { name: string, desc: string }, q: string) {
  return cat.name.toLowerCase().includes(q) || cat.desc.toLowerCase().includes(q)
}

// Reset page on search or section change
watch(searchQuery, (newQuery) => {
  if (!newQuery) {
    currentPage.value = 0
    return
  }
  
  const q = newQuery.toLowerCase()
  let targetSection = activeSection.value

  if (!targetSection) {
    for (const [sectionId, cats] of Object.entries(categories)) {
      if (cats.some(c => isCategoryMatchForQuery(c, q))) {
        targetSection = sectionId
        activeSection.value = sectionId
        break
      }
    }
  } else {
    const cats = categories[targetSection]
    const hasMatch = cats && cats.some(c => isCategoryMatchForQuery(c, q))
    if (!hasMatch) {
      for (const [sectionId, sectionCats] of Object.entries(categories)) {
        if (sectionCats.some(c => isCategoryMatchForQuery(c, q))) {
          targetSection = sectionId
          activeSection.value = sectionId
          break
        }
      }
    }
  }

  if (targetSection) {
    const cats = categories[targetSection]
    if (cats) {
      const matchIndex = cats.findIndex(c => isCategoryMatchForQuery(c, q))
      if (matchIndex !== -1) {
        currentPage.value = Math.floor(matchIndex / itemsPerPage)
      }
    }
  }
})

// Calculate points for an SVG arc
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  }
}

function describeArc(x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) {
  const startOut = polarToCartesian(x, y, outerRadius, endAngle)
  const endOut = polarToCartesian(x, y, outerRadius, startAngle)
  const startIn = polarToCartesian(x, y, innerRadius, endAngle)
  const endIn = polarToCartesian(x, y, innerRadius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
  return [
    "M", startOut.x, startOut.y,
    "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOut.x, endOut.y,
    "L", endIn.x, endIn.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startIn.x, startIn.y,
    "Z"
  ].join(" ")
}

// Fixed Semicircle Arcs for Main Sections
const mainSectionArcs = computed(() => {
  const totalAngle = 180
  const anglePerItem = totalAngle / mainSections.length

  return mainSections.map((item, index) => {
    const startAngle = -90 + (index * anglePerItem) + 1
    const endAngle = -90 + ((index + 1) * anglePerItem) - 1
    const midAngle = (startAngle + endAngle) / 2
    const midPos = polarToCartesian(200, 200, 130, midAngle)

    return {
      ...item,
      path: describeArc(200, 200, 80, 180, startAngle, endAngle), 
      midPos
    }
  })
})

// Matching Logic for Search
function isMainSectionMatch(sectionId: string) {
  if (!searchQuery.value) return false
  const q = searchQuery.value.toLowerCase()
  const section = mainSections.find(s => s.id === sectionId)
  if (section?.name.toLowerCase().includes(q) || section?.shortLabel.toLowerCase().includes(q)) return true
  
  // Also match if any of its categories match
  return categories[sectionId]?.some(c => isCategoryMatchForQuery(c, q))
}

function isCategoryMatch(cat: { name: string, desc: string }) {
  if (!searchQuery.value) return false
  return isCategoryMatchForQuery(cat, searchQuery.value.toLowerCase())
}

const currentCategories = computed(() => {
  if (!activeSection.value) return []
  return categories[activeSection.value] || []
})

const totalPages = computed(() => Math.ceil(currentCategories.value.length / itemsPerPage))

const paginatedCategories = computed(() => {
  const start = currentPage.value * itemsPerPage
  return currentCategories.value.slice(start, start + itemsPerPage)
})

function resetViews() {
  activeSection.value = null
  currentPage.value = 0
  activeListCategory.value = null
  searchQuery.value = ''
  forumCategory.activeSectionId = null
  forumCategory.activeCategoryId = null
}

function handleCategoryClick(cat: {id: string, name: string, desc: string}) {
  activeListCategory.value = cat
  forumCategory.activeCategoryId = cat.id
  forumCategory.activeSectionId = activeSection.value
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Watch activeSection to sync with store
watch(activeSection, (newVal) => {
  forumCategory.activeSectionId = newVal
})

</script>

<style scoped>
.arcs-move, /* apply transition to moving elements */
.arcs-enter-active,
.arcs-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.arcs-enter-from,
.arcs-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
.arcs-leave-active {
  position: absolute;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>