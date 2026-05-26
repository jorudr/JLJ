<template>
  <main class="min-h-screen bg-white text-black dark:bg-black dark:text-white">
    <section class="border-y border-current/10 relative overflow-hidden py-24 min-h-[680px]">
      <div class="absolute inset-x-0 top-0 h-px bg-current/30"></div>
      <div class="max-w-6xl mx-auto px-8 w-full relative z-10">
        <transition name="fade">
          <div v-if="!activeListCategory" class="grid lg:grid-cols-[0.85fr_1.15fr] gap-16 lg:gap-24 items-start">
            <header class="lg:sticky lg:top-10 space-y-12">
              <div>
                <p class="text-[10px] font-serif uppercase tracking-[0.5em] mb-5 opacity-60">
                  Knowledge System
                </p>
                <h1 class="text-5xl lg:text-7xl font-serif tracking-tight leading-none">
                  Explore the Methodology
                </h1>
              </div>

              <div class="relative w-full max-w-md group border-b border-current/20 pb-3 focus-within:border-current transition-all duration-500">
                <svg class="absolute left-0 top-1/2 -translate-y-[calc(50%+6px)] w-4 h-4 opacity-40 group-focus-within:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search topics, methods, or models..."
                  class="w-full bg-transparent pl-8 pr-8 text-sm focus:outline-none placeholder-current/30"
                />
              </div>

              <div v-if="activeSection" class="border border-current/10 p-6">
                <p class="text-[9px] uppercase tracking-[0.4em] opacity-40 mb-4">Current Discipline</p>
                <h2 class="text-2xl font-serif mb-3">
                  {{ mainSections.find(s => s.id === activeSection)?.name }}
                </h2>
                <p class="text-xs font-serif italic leading-relaxed opacity-60">
                  {{ mainSections.find(s => s.id === activeSection)?.desc }}
                </p>
                <button
                  @click="resetViews"
                  class="mt-8 text-[9px] uppercase tracking-[0.3em] font-medium opacity-50 hover:opacity-100 transition-opacity"
                >
                  Reset View
                </button>
              </div>
            </header>

            <div class="space-y-10">
              <div class="grid sm:grid-cols-2 gap-4">
                <button
                  v-for="section in mainSections"
                  :key="section.id"
                  @click="activeSection = section.id; currentPage = 0"
                  class="group text-left border p-6 min-h-[180px] transition-all duration-500"
                  :class="[
                    activeSection === section.id || isMainSectionMatch(section.id)
                      ? 'border-current bg-current text-white dark:text-black'
                      : 'border-current/10 hover:border-current/50'
                  ]"
                >
                  <div class="flex items-start justify-between gap-6">
                    <span class="text-[9px] tracking-[0.35em] uppercase opacity-60">{{ section.shortLabel }}</span>
                    <span class="text-[9px] tracking-[0.2em] uppercase opacity-40">0{{ mainSections.findIndex(s => s.id === section.id) + 1 }}</span>
                  </div>
                  <h3 class="mt-10 text-2xl font-serif leading-tight">{{ section.name }}</h3>
                  <p class="mt-4 text-xs font-serif italic leading-relaxed opacity-70">{{ section.desc }}</p>
                </button>
              </div>

              <transition name="fade" mode="out-in">
                <div :key="activeSection || 'all'" class="border-t border-current/10 pt-10">
                  <div class="flex items-end justify-between gap-8 mb-8">
                    <div>
                      <p class="text-[9px] uppercase tracking-[0.4em] opacity-40 mb-3">
                        {{ activeSection ? 'Method Index' : 'Select a Discipline' }}
                      </p>
                      <h2 class="text-3xl font-serif tracking-tight">
                        {{ activeSection ? 'Available Protocols' : 'Core Methodology Map' }}
                      </h2>
                    </div>
                    <span v-if="activeSection && totalPages > 1" class="text-[9px] uppercase tracking-[0.3em] opacity-40">
                      {{ currentPage + 1 }} / {{ totalPages }}
                    </span>
                  </div>

                  <div v-if="activeSection" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      v-for="cat in paginatedCategories"
                      :key="cat.id"
                      @click="handleCategoryClick(cat)"
                      class="group text-left p-5 border transition-all duration-500 min-h-[150px] flex flex-col justify-between"
                      :class="[
                        isCategoryMatch(cat) ? 'border-current bg-current text-white dark:text-black' : 'border-current/10 hover:border-current/50',
                        (searchQuery && !isCategoryMatch(cat)) ? 'opacity-30' : 'opacity-100'
                      ]"
                    >
                      <div>
                        <h4 class="text-base font-serif mb-3 group-hover:tracking-wide transition-all duration-300">
                          {{ cat.name }}
                        </h4>
                        <p class="text-[10px] leading-relaxed line-clamp-3 opacity-60">
                          {{ cat.desc }}
                        </p>
                      </div>
                      <span class="mt-6 text-[8px] tracking-[0.25em] uppercase opacity-45 group-hover:opacity-100 transition-opacity">Open Protocol</span>
                    </button>
                  </div>

                  <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      v-for="section in mainSections"
                      :key="`summary-${section.id}`"
                      @click="activeSection = section.id; currentPage = 0"
                      class="text-left border border-current/10 hover:border-current/50 p-5 min-h-[130px] transition-all duration-500"
                    >
                      <span class="text-[8px] tracking-[0.3em] uppercase opacity-45">{{ section.shortLabel }}</span>
                      <h4 class="mt-6 text-lg font-serif">{{ section.name }}</h4>
                    </button>
                  </div>

                  <div v-if="activeSection && totalPages > 1" class="mt-8 flex items-center justify-between border-t border-current/10 pt-6">
                    <button
                      @click="currentPage--"
                      :disabled="currentPage === 0"
                      class="text-[9px] uppercase tracking-[0.3em] transition-opacity"
                      :class="currentPage === 0 ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100'"
                    >
                      Prev
                    </button>
                    <button
                      @click="currentPage++"
                      :disabled="currentPage >= totalPages - 1"
                      class="text-[9px] uppercase tracking-[0.3em] transition-opacity"
                      :class="currentPage >= totalPages - 1 ? 'opacity-20 cursor-not-allowed' : 'opacity-60 hover:opacity-100'"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </transition>

        <transition name="fade" mode="out-in">
          <div v-if="activeListCategory" class="w-full max-w-5xl mx-auto flex flex-col items-center">
            <ThreadListOverlay
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

    <section class="border-t border-current/10 mb-20 scroll-mt-20" id="forum-archive">
      <div class="max-w-6xl mx-auto px-8 py-20">
        <div class="flex flex-col md:flex-row items-baseline justify-between mb-16 gap-8">
          <div class="flex-1">
            <h2 class="text-[10px] font-serif uppercase tracking-[0.5em] mb-4 opacity-40">
              Personal Archive
            </h2>
            <div class="flex flex-wrap items-center gap-12">
              <button
                @click="archiveStore.setActiveTab('saved')"
                class="group flex flex-col items-start transition-all duration-500"
                :class="archiveStore.activeTab === 'saved' ? 'opacity-100' : 'opacity-30 hover:opacity-100'"
              >
                <span class="text-3xl font-serif tracking-tight">Saved Topics</span>
                <div class="h-px bg-current transition-all duration-700 mt-2" :class="archiveStore.activeTab === 'saved' ? 'w-24' : 'w-0 group-hover:w-12'"></div>
              </button>

              <button
                @click="archiveStore.setActiveTab('history')"
                class="group flex flex-col items-start transition-all duration-500"
                :class="archiveStore.activeTab === 'history' ? 'opacity-100' : 'opacity-30 hover:opacity-100'"
              >
                <span class="text-3xl font-serif tracking-tight">Recent Search</span>
                <div class="h-px bg-current transition-all duration-700 mt-2" :class="archiveStore.activeTab === 'history' ? 'w-24' : 'w-0 group-hover:w-12'"></div>
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
import { useForumCategoryStore } from '~/features/store/useForumCategory'
import ThreadListOverlay from "~/widgets/main-forum/ui/ThreadListOverlay.vue";
import ThreadHistory from "~/widgets/main-forum/ui/ThreadHistory.vue";
import ThreadSaved from "~/widgets/main-forum/ui/ThreadSaved.vue";
import type { Thread } from "~/entities/thread/model/thread.types"
import { useForumArchiveStore } from '~/features/store/useForumArchive'

const props = defineProps<{
    threads: Thread[]
}>()

const archiveStore = useForumArchiveStore()

const forumCategory = useForumCategoryStore()
const mainSections = forumCategory.mainSections
const categories = forumCategory.categories

const activeSection = ref<string | null>(forumCategory.activeSectionId)
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
