<template>
  <div
    ref="journalWrapperRef"
    class="journal-wrapper force-light-theme bg-theme-bg text-theme-text h-full flex flex-col min-w-0 overflow-y-auto scroll-minimal relative pt-4 md:pt-6"
    :class="{
      'exforum-transparent-bg': isForumLightTheme,
      'exforum-edge-shadows': showForumEdgeShadows,
      '!overflow-hidden': isBoardFullscreen
    }"
  >
    <Transition name="fade-slide">
      <section
        v-if="isBoardFullscreen"
        ref="boardViewportRef"
        class="absolute inset-0 z-[9000] cursor-grab select-none overflow-hidden bg-white bg-[radial-gradient(circle,rgba(0,0,0,0.1)_1px,transparent_1.6px)] bg-[length:28px_28px] bg-center text-[#2c2c2a] active:cursor-grabbing"
        aria-label="Fullscreen article board"
        @pointerdown="startBoardPan"
        @wheel.prevent="handleBoardWheel"
      >
        <div
          class="absolute left-0 top-0 origin-top-left"
          :style="[boardWorldStyle, boardTransformStyle]"
        >
          <article
            v-for="node in boardNodes"
            :key="node.id"
            data-board-node
            class="absolute box-border overflow-hidden border border-black/20 bg-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-sm"
            :style="getBoardNodeStyle(node)"
            @pointerdown.stop="startBoardNodeDrag($event, node.id)"
          >
            <div v-if="node.type === 'text'" class="flex h-full flex-col gap-3 p-4">
              <h3 class="font-serif text-xl italic leading-none text-black/80">{{ node.title }}</h3>
              <p class="min-h-0 overflow-hidden font-serif text-sm italic leading-relaxed text-black/55">{{ node.text }}</p>
            </div>

            <div v-else class="flex h-full flex-col">
              <img :src="node.src" :alt="node.alt" class="min-h-0 flex-1 object-cover" draggable="false" />
              <p v-if="node.caption" class="border-t border-black/10 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.28em] text-black/35">
                {{ node.caption }}
              </p>
            </div>

            <button
              class="absolute bottom-0 right-0 h-5 w-5 cursor-se-resize border-l border-t border-black/20 bg-white/80"
              type="button"
              aria-label="Resize node"
              @pointerdown.stop="startBoardNodeResize($event, node.id)"
            ></button>
          </article>
        </div>
      </section>
    </Transition>

    <Transition name="fade-slide" mode="out-in">
    <!-- READER VIEW: Detailed Content -->
    <article v-if="selectedArticle" class="journal-article-reader flex flex-col min-h-full" key="reader">
      <header class="article-reader-header">
        <div class="article-reader-toolbar">
          <button @click="closeReader" class="article-reader-back group">
            <span class="text-xl opacity-30 group-hover:-translate-x-1 transition-transform">←</span>
            <span>Return to The Journal</span>
          </button>
        </div>

        <div class="article-reader-kicker">
          <span>{{ selectedArticle.subtitle }}</span>
          <span class="h-1 w-1 rotate-45 bg-current/20"></span>
          <span>{{ selectedArticle.category }}</span>
        </div>

        <div class="article-reader-title-row">
          <div class="min-w-0">
            <h1>{{ selectedArticle.title }}</h1>
            <p>{{ selectedArticle.description }}</p>
          </div>

          <div class="article-reader-metrics" aria-label="Article metrics">
            <div v-for="metric in selectedArticle.metrics" :key="metric.id" class="article-reader-metric">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.value }}</strong>
            </div>
          </div>
        </div>
      </header>

      <main class="box-border flex w-full max-w-full flex-none overflow-hidden py-6">
        <section
          class="group relative box-border h-[68vh] min-h-[460px] w-full max-w-full flex-1 cursor-zoom-in select-none overflow-hidden border-y border-x-0 border-current/10 bg-white/20 bg-[radial-gradient(circle,rgba(0,0,0,0.1)_1px,transparent_1.6px)] bg-[length:22px_22px] bg-center shadow-inner sm:min-h-[min(72vh,780px)] sm:bg-[length:28px_28px]"
          aria-label="Article board"
          @click="openBoardFullscreen"
        >
          <div
            class="pointer-events-none absolute left-0 top-0 origin-top-left"
            :style="[boardWorldStyle, boardPreviewTransformStyle]"
          >
            <article
              v-for="node in boardNodes"
              :key="node.id"
              data-board-node
              class="absolute box-border overflow-hidden border border-current/20 bg-white/85 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-sm"
              :style="getBoardNodeStyle(node)"
            >
              <div v-if="node.type === 'text'" class="flex h-full flex-col gap-3 p-4">
                <h3 class="font-serif text-xl italic leading-none text-current/80">{{ node.title }}</h3>
                <p class="min-h-0 overflow-hidden font-serif text-sm italic leading-relaxed text-current/55">{{ node.text }}</p>
              </div>

              <div v-else class="flex h-full flex-col">
                <img :src="node.src" :alt="node.alt" class="min-h-0 flex-1 object-cover" draggable="false" />
                <p v-if="node.caption" class="border-t border-current/10 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.28em] text-current/35">
                  {{ node.caption }}
                </p>
              </div>
            </article>
          </div>

          <div class="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/[0.025]"></div>
          <div class="pointer-events-none absolute right-4 top-4 border border-current/10 bg-white/85 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.28em] text-current/35">
            Open Board
          </div>
        </section>
      </main>

      <footer class="article-comments-footer">
        <div class="article-comments-heading">
          <div>
            <span>Comments</span>
            <h2>User Discussion</h2>
          </div>
          <strong>{{ articleComments.length }} Published</strong>
        </div>

        <div v-if="articleComments.length" class="article-comments-list">
          <article v-for="comment in articleComments" :key="comment.id" class="article-comment">
            <div class="article-comment-head">
              <div>
                <h3>{{ comment.authorName }}</h3>
                <span>{{ comment.authorRole }}</span>
              </div>
              <div class="article-comment-meta">
                <span>{{ formatCommentDate(comment.createdAt) }}</span>
                <span>{{ comment.likesCount }} Likes</span>
              </div>
            </div>
            <p>{{ comment.text }}</p>
          </article>
        </div>

        <p v-else class="article-comments-empty">No comments yet.</p>
      </footer>

    </article>

    <!-- JOURNAL VIEW: Front Page & Archive -->
    <div v-else class="flex flex-col min-h-full px-4 md:px-6 xl:px-8" :key="`page-${currentPage}`">
      
      <!-- Masthead -->
      <header
        class="border-b-4 border-double border-current/20 flex flex-col items-center px-8 relative z-10"
        :class="currentPage === 1 ? 'pt-8 pb-4 space-y-4' : 'pt-3 pb-4'"
      >
        <template v-if="currentPage === 1">
          <div class="flex items-center justify-between w-full text-[8px] font-mono tracking-[0.6em] opacity-40 uppercase">
            <span>Vol. XXIV // No. 12</span>
            <span class="text-[10px] tracking-[1em] italic font-serif">Reification Edition</span>
            <span>Reified on {{ new Date().toLocaleDateString() }}</span>
          </div>

          <h1 class="text-6xl font-serif italic tracking-tighter text-current opacity-90 text-center px-6 py-6 drop-shadow-sm cursor-pointer" @click="navigateToPage(1)">
            The Eve's Apple
          </h1>
        </template>

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
      <div class="flex-grow relative z-10 pb-0">
        
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '~/features/store/useTheme'
import { mockExNodes } from '~/entities/exnode/model/exnode.mock'
import { mockComments } from '~/entities/comment/mock/comment.mock'
import { mockJournalArticles, mockJournalArticle } from '~/entities/journal-article/mock/journal-article.mock'
import type { JournalArticleBoardNode } from '~/entities/journal-article/types/journal-article.types'
import ExNodeCard from '~/entities/exnode/ui/ExNodeCard.vue'
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
const selectedArticle = computed(() => {
  if (!selectedNode.value) return undefined
  return mockJournalArticles.find(article => article.sourceNodeId === selectedNode.value?.id) || mockJournalArticle
})
const articleComments = computed(() => {
  if (!selectedArticle.value) return []
  return mockComments.filter(comment => comment.articleId === selectedArticle.value?.id && comment.status === 'published')
})
const journalWrapperRef = ref<HTMLElement | null>(null)
const boardViewportRef = ref<HTMLElement | null>(null)
const boardNodes = ref<JournalArticleBoardNode[]>([])
const boardPan = ref({ x: 48, y: 36 })
const boardScale = ref(1)
const isBoardFullscreen = ref(false)

type BoardInteraction =
  | { type: 'pan'; startClientX: number; startClientY: number; startPanX: number; startPanY: number }
  | {
      type: 'drag'
      nodeId: string
      startClientX: number
      startClientY: number
      startX: number
      startY: number
      width: number
      height: number
    }
  | {
      type: 'resize'
      nodeId: string
      startClientX: number
      startClientY: number
      startWidth: number
      startHeight: number
    }

const activeBoardInteraction = ref<BoardInteraction | null>(null)
const minBoardNodeSize = { width: 6, height: 4 }
const boardGridSize = computed(() => selectedArticle.value?.board.gridSize || 28)
const boardUnitSize = computed(() => selectedArticle.value?.board.size || { width: 72, height: 44 })
const boardWorldStyle = computed(() => ({
  width: `${boardUnitSize.value.width * boardGridSize.value}px`,
  height: `${boardUnitSize.value.height * boardGridSize.value}px`
}))
const boardTransformStyle = computed(() => ({
  transform: `translate(${boardPan.value.x}px, ${boardPan.value.y}px) scale(${boardScale.value})`
}))
const boardPreviewTransformStyle = computed(() => ({
  transform: 'translate(48px, 36px) scale(0.82)'
}))

const cloneBoardNodes = (nodes: JournalArticleBoardNode[]) => nodes.map(node => ({
  ...node,
  position: { ...node.position },
  size: { ...node.size }
})) as JournalArticleBoardNode[]

watch(selectedArticle, (article) => {
  boardNodes.value = article ? cloneBoardNodes(article.board.nodes) : []
  boardPan.value = { x: 48, y: 36 }
  boardScale.value = 1
}, { immediate: true })

const closeReader = () => {
  closeBoardFullscreen()
  const query = { ...route.query }
  delete query.nodeId
  router.replace({ query })
}

const openBoardFullscreen = () => {
  isBoardFullscreen.value = true
  boardPan.value = { x: 48, y: 36 }
  boardScale.value = 1
  journalWrapperRef.value?.scrollTo({ top: 0, left: 0 })
}

const closeBoardFullscreen = () => {
  isBoardFullscreen.value = false
  stopBoardInteraction()
}

const navigateToNode = (id: string) => {
  router.replace({
    query: {
      ...route.query,
      nodeId: id
    }
  })
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const getBoardNodeStyle = (node: JournalArticleBoardNode) => ({
  left: `${node.position.x * boardGridSize.value}px`,
  top: `${node.position.y * boardGridSize.value}px`,
  width: `${node.size.width * boardGridSize.value}px`,
  height: `${node.size.height * boardGridSize.value}px`
})

const updateBoardNode = (nodeId: string, updater: (node: JournalArticleBoardNode) => JournalArticleBoardNode) => {
  boardNodes.value = boardNodes.value.map(node => node.id === nodeId ? updater(node) : node)
}

const startWindowTracking = () => {
  window.addEventListener('pointermove', handleBoardPointerMove)
  window.addEventListener('pointerup', stopBoardInteraction)
  window.addEventListener('pointercancel', stopBoardInteraction)
}

const stopWindowTracking = () => {
  window.removeEventListener('pointermove', handleBoardPointerMove)
  window.removeEventListener('pointerup', stopBoardInteraction)
  window.removeEventListener('pointercancel', stopBoardInteraction)
}

const startBoardPan = (event: PointerEvent) => {
  const target = event.target as HTMLElement | null
  if (target?.closest('[data-board-node]')) return

  activeBoardInteraction.value = {
    type: 'pan',
    startClientX: event.clientX,
    startClientY: event.clientY,
    startPanX: boardPan.value.x,
    startPanY: boardPan.value.y
  }
  startWindowTracking()
}

const startBoardNodeDrag = (event: PointerEvent, nodeId: string) => {
  const node = boardNodes.value.find(item => item.id === nodeId)
  if (!node) return

  activeBoardInteraction.value = {
    type: 'drag',
    nodeId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: node.position.x,
    startY: node.position.y,
    width: node.size.width,
    height: node.size.height
  }
  startWindowTracking()
}

const startBoardNodeResize = (event: PointerEvent, nodeId: string) => {
  const node = boardNodes.value.find(item => item.id === nodeId)
  if (!node) return

  activeBoardInteraction.value = {
    type: 'resize',
    nodeId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startWidth: node.size.width,
    startHeight: node.size.height
  }
  startWindowTracking()
}

const handleBoardPointerMove = (event: PointerEvent) => {
  const interaction = activeBoardInteraction.value
  if (!interaction) return

  if (interaction.type === 'pan') {
    boardPan.value = {
      x: interaction.startPanX + event.clientX - interaction.startClientX,
      y: interaction.startPanY + event.clientY - interaction.startClientY
    }
    return
  }

  const deltaX = Math.round((event.clientX - interaction.startClientX) / (boardScale.value * boardGridSize.value))
  const deltaY = Math.round((event.clientY - interaction.startClientY) / (boardScale.value * boardGridSize.value))

  if (interaction.type === 'drag') {
    updateBoardNode(interaction.nodeId, node => ({
      ...node,
      position: {
        x: clamp(interaction.startX + deltaX, 0, boardUnitSize.value.width - interaction.width),
        y: clamp(interaction.startY + deltaY, 0, boardUnitSize.value.height - interaction.height)
      }
    }))
    return
  }

  updateBoardNode(interaction.nodeId, node => ({
    ...node,
    size: {
      width: clamp(interaction.startWidth + deltaX, minBoardNodeSize.width, boardUnitSize.value.width - node.position.x),
      height: clamp(interaction.startHeight + deltaY, minBoardNodeSize.height, boardUnitSize.value.height - node.position.y)
    }
  }))
}

const stopBoardInteraction = () => {
  activeBoardInteraction.value = null
  stopWindowTracking()
}

const handleBoardWheel = (event: WheelEvent) => {
  const viewport = boardViewportRef.value
  if (!viewport) return

  const rect = viewport.getBoundingClientRect()
  const previousScale = boardScale.value
  const nextScale = clamp(previousScale - event.deltaY * 0.001, 0.45, 2.2)
  const pointerX = event.clientX - rect.left
  const pointerY = event.clientY - rect.top
  const worldX = (pointerX - boardPan.value.x) / previousScale
  const worldY = (pointerY - boardPan.value.y) / previousScale

  boardScale.value = nextScale
  boardPan.value = {
    x: pointerX - worldX * nextScale,
    y: pointerY - worldY * nextScale
  }
}

const handleBoardKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isBoardFullscreen.value) {
    closeBoardFullscreen()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleBoardKeydown)
})

onUnmounted(() => {
  stopWindowTracking()
  window.removeEventListener('keydown', handleBoardKeydown)
})

const formatCommentDate = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(new Date(value))
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

.journal-wrapper.exforum-edge-shadows {
  background-attachment: local, local, local, local;
  background-image:
    radial-gradient(ellipse 120% 86% at 50% 0%, rgba(0, 0, 0, 0.11) 0%, rgba(0, 0, 0, 0.07) 28%, rgba(0, 0, 0, 0.026) 58%, rgba(0, 0, 0, 0) 82%),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.07) 0%, rgba(0, 0, 0, 0.038) 34%, rgba(0, 0, 0, 0.014) 68%, rgba(0, 0, 0, 0) 100%),
    radial-gradient(ellipse 120% 86% at 50% 100%, rgba(0, 0, 0, 0.11) 0%, rgba(0, 0, 0, 0.07) 28%, rgba(0, 0, 0, 0.026) 58%, rgba(0, 0, 0, 0) 82%),
    linear-gradient(to top, rgba(0, 0, 0, 0.07) 0%, rgba(0, 0, 0, 0.038) 34%, rgba(0, 0, 0, 0.014) 68%, rgba(0, 0, 0, 0) 100%);
  background-position: top, top, bottom, bottom;
  background-repeat: no-repeat;
  background-size: 100% 260px, 100% 260px, 100% 260px, 100% 260px;
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

.journal-article-reader {
  color: var(--text-primary);
}

.article-reader-header {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 0 clamp(20px, 4vw, 64px) 28px;
  border-bottom: 1px solid color-mix(in srgb, currentColor 9%, transparent);
}

.article-reader-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 calc(clamp(20px, 4vw, 64px) * -1);
  padding: 24px clamp(20px, 4vw, 64px);
  border-bottom: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  background: color-mix(in srgb, currentColor 1%, transparent);
}

.article-reader-back {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  color: color-mix(in srgb, currentColor 40%, transparent);
  transition: color 0.3s ease;
}

.article-reader-back:hover {
  color: currentColor;
}

.article-reader-back span:last-child {
  font-size: 9px;
  letter-spacing: 0.4em;
  text-transform: uppercase;
}

.article-reader-kicker {
  display: flex;
  align-items: center;
  gap: 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.48em;
  text-transform: uppercase;
  opacity: 0.35;
}

.article-reader-title-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 420px);
  gap: clamp(28px, 5vw, 72px);
  align-items: end;
}

.article-reader-title-row h1 {
  max-width: 980px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.4rem, 5vw, 5.8rem);
  font-style: italic;
  line-height: 0.98;
  letter-spacing: 0;
  color: currentColor;
}

.article-reader-title-row p {
  max-width: 720px;
  margin-top: 22px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1rem, 1.25vw, 1.25rem);
  font-style: italic;
  line-height: 1.65;
  color: color-mix(in srgb, currentColor 54%, transparent);
}

.article-reader-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-left: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}

.article-reader-metric {
  min-height: 82px;
  padding: 16px 18px;
  border-right: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  background: color-mix(in srgb, currentColor 1.5%, transparent);
}

.article-reader-metric span {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  opacity: 0.35;
}

.article-reader-metric strong {
  display: block;
  margin-top: 12px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.55rem;
  font-style: italic;
  font-weight: 400;
  line-height: 1;
  color: color-mix(in srgb, currentColor 76%, transparent);
}

.article-comments-footer {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 34px clamp(20px, 4vw, 64px) 46px;
  border-top: 1px solid color-mix(in srgb, currentColor 10%, transparent);
}

.article-comments-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
}

.article-comments-heading span,
.article-comments-heading strong,
.article-comment span,
.article-comment-meta {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  opacity: 0.35;
}

.article-comments-heading h2 {
  margin-top: 8px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(1.8rem, 2.6vw, 3rem);
  font-style: italic;
  line-height: 1;
  color: color-mix(in srgb, currentColor 84%, transparent);
}

.article-comments-list {
  display: grid;
  gap: 12px;
}

.article-comment {
  padding: 20px 22px;
  border: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  background: color-mix(in srgb, currentColor 1.5%, transparent);
}

.article-comment-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 14px;
}

.article-comment h3 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.25rem;
  font-style: italic;
  line-height: 1;
  color: color-mix(in srgb, currentColor 78%, transparent);
}

.article-comment span {
  display: block;
  margin-top: 8px;
}

.article-comment-meta {
  display: flex;
  gap: 18px;
  text-align: right;
  white-space: nowrap;
}

.article-comment-meta span {
  margin-top: 0;
}

.article-comment p,
.article-comments-empty {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1rem;
  font-style: italic;
  line-height: 1.65;
  color: color-mix(in srgb, currentColor 56%, transparent);
}

@media (max-width: 1023px) {
  .article-reader-title-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 639px) {
  .article-reader-header {
    padding-top: 28px;
  }

  .article-reader-kicker {
    flex-wrap: wrap;
    letter-spacing: 0.32em;
  }

  .article-reader-metrics {
    grid-template-columns: 1fr;
  }

  .article-comments-heading,
  .article-comment-head,
  .article-comment-meta {
    align-items: start;
    flex-direction: column;
    text-align: left;
    white-space: normal;
  }
}
</style>
