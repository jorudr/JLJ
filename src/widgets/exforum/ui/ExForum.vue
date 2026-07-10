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
        class="fixed z-[9000] cursor-grab select-none overflow-hidden bg-white bg-[radial-gradient(circle,rgba(0,0,0,0.1)_1px,transparent_1.6px)] bg-[length:28px_28px] bg-center text-[#2c2c2a] active:cursor-grabbing"
        :style="boardFullscreenViewportStyle"
        :aria-label="articleLabels.fullscreenBoard"
        @pointerdown="startBoardPan"
        @wheel.prevent="handleBoardWheel"
      >
        <button
          class="absolute left-1/2 top-5 z-20 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 border border-black/20 bg-white/90 px-4 py-3 text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-black/65 shadow-[0_8px_22px_rgba(0,0,0,0.08)] transition-colors hover:border-black/40 hover:text-black sm:px-5"
          type="button"
          @click.stop="closeBoardFullscreen"
        >
          {{ fullscreenExitLabel }}
        </button>

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
            <span>{{ articleLabels.returnToJournal }}</span>
          </button>
        </div>

        <div class="article-reader-title-row">
          <div class="min-w-0">
            <h1>{{ selectedArticle.title }}</h1>
            <p>{{ selectedArticle.description }}</p>
          </div>

          <div class="article-reader-metrics" :aria-label="articleLabels.metrics">
            <div v-for="metric in selectedArticle.metrics" :key="metric.id" class="article-reader-metric">
              <span>{{ getMetricLabel(metric.label) }}</span>
              <strong>{{ metric.value }}</strong>
            </div>
          </div>
        </div>
      </header>

      <main class="box-border flex w-full max-w-full flex-none overflow-hidden py-6">
        <section
          class="group relative box-border h-[68vh] min-h-[460px] w-full max-w-full flex-1 cursor-zoom-in select-none overflow-hidden border-y border-x-0 border-current/10 bg-white/20 bg-[radial-gradient(circle,rgba(0,0,0,0.1)_1px,transparent_1.6px)] bg-[length:22px_22px] bg-center shadow-inner sm:min-h-[min(72vh,780px)] sm:bg-[length:28px_28px]"
          :aria-label="articleLabels.board"
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
            {{ articleLabels.openBoard }}
          </div>
        </section>
      </main>

      <footer class="article-comments-footer">
        <div class="article-comments-heading">
          <div>
            <span>{{ articleLabels.comments }}</span>
          </div>
          <strong>{{ articleLabels.published }}: {{ articleComments.length }}</strong>
        </div>

        <form class="article-comment-composer" @submit.prevent="submitComment">
          <div class="article-comment-composer-title">
            <div>
              <span>{{ articleLabels.newComment }}</span>
              <h3>{{ articleLabels.leaveComment }}</h3>
            </div>
            <span v-if="!isAuthenticated" class="article-comment-composer-status">{{ articleLabels.signInRequired }}</span>
          </div>
          <div class="article-comment-composer-meta">
            <span>{{ articleLabels.commentingAs }}</span>
            <strong>{{ currentUserName }}</strong>
          </div>
          <textarea
            ref="commentInputRef"
            id="article-comment-input"
            v-model="commentDraft"
            class="article-comment-input"
            rows="1"
            maxlength="1000"
            :disabled="!isAuthenticated"
            :placeholder="isAuthenticated ? articleLabels.writeComment : articleLabels.signInToComment"
            @input="resizeCommentInput"
          ></textarea>
          <div class="article-comment-composer-actions">
            <span>{{ commentDraft.length }}/1000</span>
            <button
              class="article-comment-submit"
              type="submit"
              :disabled="!isAuthenticated || !commentDraft.trim()"
            >
              {{ articleLabels.postComment }}
            </button>
          </div>
        </form>

        <div v-if="articleComments.length" class="article-comments-list">
          <article v-for="comment in articleComments" :key="comment.id" class="article-comment">
            <div class="article-comment-head">
              <div>
                <h3>{{ comment.authorName }}</h3>
                <span>{{ comment.authorRole }}</span>
              </div>
              <div class="article-comment-meta">
                <span>{{ formatCommentDate(comment.createdAt) }}</span>
                <span>{{ comment.likesCount }} {{ articleLabels.likes }}</span>
              </div>
            </div>
            <p>{{ comment.text }}</p>
          </article>
        </div>

        <p v-else class="article-comments-empty">{{ articleLabels.noComments }}</p>
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
            <span>{{ journalLabels.volume }}</span>
            <span class="text-[10px] tracking-[1em] italic font-serif">{{ journalLabels.edition }}</span>
            <span>{{ journalLabels.datePrefix }} {{ formatJournalDate() }}</span>
          </div>

          <h1 class="text-6xl font-serif italic tracking-tighter text-current opacity-90 text-center px-6 py-6 drop-shadow-sm cursor-pointer" @click="navigateToPage(1)">
            The Eve's Apple
          </h1>
        </template>

        <div class="journal-masthead-tools flex items-center justify-between w-full border-t border-current/10 pt-4 px-4">
          <!-- Filters -->
          <div class="journal-filter-list flex items-center space-x-2">
            <button
              v-for="filter in journalFilters"
              :key="filter.mode"
              class="journal-filter-button"
              :class="{ 'is-active': activeJournalFilter === filter.mode }"
              type="button"
              @click="setJournalFilter(filter.mode)"
            >
              {{ filter.label }}
            </button>
          </div>

          <!-- Search Bar -->
          <label class="journal-search-shell group/search" for="journal-search">
            <span class="journal-search-label">{{ journalLabels.search }}</span>
            <input
              id="journal-search"
              v-model="searchQuery"
              type="search"
              :placeholder="journalLabels.searchPlaceholder"
              class="journal-search-input"
            />
          </label>
        </div>
      </header>

      <!-- Main Journal Body -->
      <div class="flex-grow relative z-10 pb-0">
        
        <!-- DYNAMIC MAGAZINE LAYOUT -->
        <div v-if="pagedNodes.length > 0" class="flex flex-col">
          <!-- SECTION 1: Top Row (Lead Analysis + Signal Sidebar) -->
          <div class="grid grid-cols-12 border-b border-current/10">
            <section class="journal-sector col-span-12 lg:col-span-8 px-12 pb-12 pt-6 lg:border-r border-current/10">
              <div class="flex flex-col space-y-12">
                <div class="flex items-center justify-between pb-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-1.5 h-1.5 bg-current opacity-30 transform rotate-45"></div>
                    <h2 class="text-sm font-mono tracking-[0.4em] uppercase opacity-60">{{ journalLabels.analysis }}</h2>
                  </div>
                  <span v-if="currentPage > 1" class="text-[9px] font-mono opacity-20 uppercase tracking-widest">{{ journalLabels.editionPrefix }}{{ currentPage }}</span>
                </div>
                <ExJournalSpotlight v-if="pagedAnalysis[0]" :node="pagedAnalysis[0]" @click="navigateToNode(pagedAnalysis[0].id)" />
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                  <ExNodeCard v-for="node in pagedAnalysis.slice(1, 3)" :key="node.id" :node="node" />
                </div>
              </div>
            </section>
            
            <section class="journal-sector col-span-12 lg:col-span-4 px-8 pb-8 pt-6">
              <div class="space-y-4">
                 <div class="flex items-center space-x-3 pb-2">
                   <div class="w-1 h-1 bg-current opacity-20"></div>
                   <h2 class="text-xs font-mono tracking-[0.3em] uppercase opacity-50">{{ journalLabels.signals }}</h2>
                </div>
                <div class="space-y-1">
                  <ExNodeCard
                    v-for="node in pagedSignals.slice(0, 4)"
                    :key="node.id"
                    :node="node"
                    class="journal-signal-card"
                  />
                </div>
              </div>
            </section>
          </div>

          <!-- SECTION 2: Middle Horizontal (Research) -->
          <section class="journal-sector p-12 border-b border-current/10">
            <div class="flex flex-col space-y-12">
              <div class="flex items-center justify-between pb-4">
                <div class="flex items-center space-x-3">
                  <div class="w-1.5 h-1.5 bg-current opacity-30 transform rotate-45"></div>
                  <h2 class="text-sm font-mono tracking-[0.4em] uppercase opacity-60">{{ journalLabels.research }}</h2>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                <ExNodeCard v-for="node in pagedResearch.slice(0, 3)" :key="node.id" :node="node" />
              </div>
            </div>
          </section>

          <!-- SECTION 3: Bottom Strip (Strategy) -->
          <section class="journal-sector p-12">
            <div class="flex flex-col space-y-12">
              <div class="flex items-center justify-between pb-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-1.5 h-1.5 bg-current opacity-30 transform rotate-45"></div>
                    <h2 class="text-sm font-mono tracking-[0.4em] uppercase opacity-60">{{ journalLabels.strategy }}</h2>
                  </div>
              </div>
              <div class="flex overflow-x-auto space-x-12 scroll-minimal pb-4">
                <div v-for="node in pagedStrategies.slice(0, 3)" :key="node.id" class="min-w-[400px]">
                  <ExNodeCard :node="node" class="!border-none" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- NO CONTENT WARNING: The Reification Void -->
        <div v-else class="flex flex-col items-center justify-center py-48 px-12 space-y-8 animate-pulse text-center">
            <div class="text-4xl font-serif italic tracking-tighter opacity-20">
               {{ journalLabels.emptyTitle }}
            </div>
            <div class="w-12 h-px bg-current opacity-10"></div>
            <p class="max-w-md text-[10px] font-mono tracking-[0.3em] uppercase opacity-30 leading-loose">
               {{ journalLabels.emptyDescription }}
            </p>
            <button @click="navigateToPage(1)" class="mt-8 text-[9px] font-mono tracking-[0.4em] uppercase border border-current/20 px-8 py-3 hover:bg-current/5 transition-all">
               {{ journalLabels.returnToOrigin }}
            </button>
        </div>

        <!-- Pagination Controls -->
        <div class="p-12 flex flex-col items-center space-y-8 border-t border-current/10 mt-12">
           <div class="flex items-center space-x-12">
              <button v-if="currentPage > 1" @click="navigateToPage(currentPage - 1)" 
                      class="px-8 py-3 border border-current/10 text-[9px] font-mono tracking-[0.4em] uppercase opacity-40 hover:opacity-100 hover:bg-current/[0.02] transition-all">
                {{ journalLabels.previousPage }}
              </button>
              <button @click="navigateToPage(currentPage + 1)" 
                      class="px-8 py-3 bg-zinc-800 text-white text-[9px] font-mono tracking-[0.4em] uppercase hover:shadow-[0_0_30px_rgba(var(--text-primary-rgb),0.1)] transition-all">
                {{ journalLabels.nextPage }} // {{ journalLabels.archivePrefix }}0{{ currentPage + 1 }} ]
              </button>
           </div>
           
           <div class="text-[7px] font-mono opacity-20 uppercase tracking-[0.8em]">{{ journalLabels.endOfArchive }}</div>
        </div>

        <!-- Journal Footer -->
        <footer class="py-4 text-center opacity-10 hover:opacity-100 transition-opacity duration-700">
          <div class="flex flex-col items-center space-y-4">
            <div class="text-[10px] font-serif italic tracking-widest text-current">{{ journalLabels.footerQuote }}</div>
            <div class="w-24 h-px bg-current/20 mx-auto text-current"></div>
            <div class="text-[7px] font-mono tracking-[0.8em] uppercase text-current">{{ journalLabels.footerBrand }}</div>
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
import { useI18n } from '~/shared/i18n/useI18n'
import { useAuthStore } from '~/entities/user/auth.store'
import { mockExNodes } from '~/entities/exnode/model/exnode.mock'
import { mockComments } from '~/entities/comment/mock/comment.mock'
import { mockJournalArticles, mockJournalArticle } from '~/entities/journal-article/mock/journal-article.mock'
import type { Comment } from '~/entities/comment/types/comment.types'
import type { JournalArticleBoardNode } from '~/entities/journal-article/types/journal-article.types'
import ExNodeCard from '~/entities/exnode/ui/ExNodeCard.vue'
import ExJournalSpotlight from '~/widgets/exforum/ui/ExJournalSpotlight.vue'

const route = useRoute()
const router = useRouter()
const { locale } = useI18n()
const themeStore = useThemeStore()
const authStore = useAuthStore()

// Archival State
const searchQuery = ref('')
const journalLabels = computed(() => locale.value === 'ru'
  ? {
      volume: 'Том XXIV // № 12',
      edition: 'Издание Реализации',
      datePrefix: 'Опубликовано',
      search: 'Поиск_',
      searchPlaceholder: 'ПОИСК_В_АРХИВЕ',
      signals: 'Сигналы',
      research: 'Исследования',
      strategy: 'Стратегии',
      analysis: 'Аналитика',
      editionPrefix: 'Выпуск_0',
      emptyTitle: 'Пустота архива',
      emptyDescription: 'Внимание: вы достигли края индексированного архива. Для этой позиции нет тактических данных или публикаций.',
      returnToOrigin: '[ Вернуться_к_началу ]',
      previousPage: '[ ПРЕДЫДУЩАЯ_СТРАНИЦА ]',
      nextPage: '[ СЛЕДУЮЩАЯ_СТРАНИЦА',
      archivePrefix: 'АРХ_',
      endOfArchive: 'Конец индексированного архива',
      footerQuote: '"Знание реализовано. Ценность извлечена."',
      footerBrand: 'The Eve\'s Apple // Распределенный центр аналитики'
    }
  : {
      volume: 'Vol. XXIV // No. 12',
      edition: 'Reification Edition',
      datePrefix: 'Reified on',
      search: 'Search_',
      searchPlaceholder: 'INDEX_REIFICATION',
      signals: 'Signals',
      research: 'Research',
      strategy: 'Strategy',
      analysis: 'Analysis',
      editionPrefix: 'Edition_0',
      emptyTitle: 'The Reification Void',
      emptyDescription: 'Caution: You have reached the edge of the indexed registry. No tactical intelligence or archival nodes have been reified at this temporal coordinate.',
      returnToOrigin: '[ Return_to_Origin ]',
      previousPage: '[ PREV_PAGE ]',
      nextPage: '[ NEXT_PAGE',
      archivePrefix: 'ARV_',
      endOfArchive: 'End of Indexed Reification',
      footerQuote: '"Knowledge Reified. Value Extracted."',
      footerBrand: 'The Eve\'s Apple // Distributed Intel Hub'
    })
const journalFilters = computed(() => locale.value === 'ru'
  ? [
      { label: 'СИГНАЛЫ', mode: 'SETUP' },
      { label: 'ИССЛЕДОВАНИЯ', mode: 'RESEARCH' },
      { label: 'СТРАТЕГИИ', mode: 'LESSON' },
      { label: 'АНАЛИТИКА', mode: 'QUESTION' }
    ]
  : [
      { label: 'SIGNALS', mode: 'SETUP' },
      { label: 'RESEARCH', mode: 'RESEARCH' },
      { label: 'STRATEGY', mode: 'LESSON' },
      { label: 'ANALYSIS', mode: 'QUESTION' }
    ])
const activeJournalFilter = ref<string | null>(null)
const isForumLightTheme = computed(() => !themeStore.settings.isDark)
const showForumEdgeShadows = computed(() => themeStore.settings.isDark)
const articleLabels = computed(() => locale.value === 'ru'
  ? {
      returnToJournal: 'Вернуться в журнал',
      fullscreenBoard: 'Полноэкранная доска статьи',
      metrics: 'Метрики статьи',
      board: 'Доска статьи',
      openBoard: 'Открыть доску',
      comments: 'Комментарии',
      published: 'Опубликовано',
      newComment: 'Новый комментарий',
      leaveComment: 'Оставить комментарий',
      signInRequired: 'Требуется войти',
      commentingAs: 'Автор комментария',
      writeComment: 'Напишите комментарий...',
      signInToComment: 'Войдите, чтобы оставить комментарий.',
      postComment: 'Опубликовать комментарий',
      likes: 'лайков',
      noComments: 'Комментариев пока нет',
      leaveFullscreen: 'Покинуть полноэкранный режим'
    }
  : {
      returnToJournal: 'Return to The Journal',
      fullscreenBoard: 'Fullscreen article board',
      metrics: 'Article metrics',
      board: 'Article board',
      openBoard: 'Open Board',
      comments: 'Comments',
      published: 'Published',
      newComment: 'New comment',
      leaveComment: 'Leave a comment',
      signInRequired: 'Sign in required',
      commentingAs: 'Commenting as',
      writeComment: 'Write a comment...',
      signInToComment: 'Sign in to join the discussion.',
      postComment: 'Post comment',
      likes: 'Likes',
      noComments: 'No comments yet.',
      leaveFullscreen: 'Leave fullscreen mode'
    })
const formatJournalDate = () => new Intl.DateTimeFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US').format(new Date())
const fullscreenExitLabel = computed(() => articleLabels.value.leaveFullscreen)

const getMetricLabel = (label: string) => {
  if (locale.value !== 'ru') return label

  return {
    Likes: 'Лайки',
    Comments: 'Комментарии'
  }[label] || label
}

// Pagination Logic
const currentPage = computed(() => Number(route.query.page) || 1)
const nodesPerPage = 12

const filteredNodes = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return mockExNodes.filter((n: any) => {
    const matchesFilter = !activeJournalFilter.value || n.mode === activeJournalFilter.value
    const matchesSearch = !q
      || n.title.toLowerCase().includes(q)
      || n.thesis_brief?.toLowerCase().includes(q)
      || n.category.toLowerCase().includes(q)
      || n.signal?.asset.toLowerCase().includes(q)
      || n.signal?.description.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })
})

const pagedNodes = computed(() => {
  const start = (currentPage.value - 1) * nodesPerPage
  return filteredNodes.value.slice(start, start + nodesPerPage)
})

const pagedSignals = computed(() => pagedNodes.value.filter((n: any) => n.mode === 'SETUP'))
const pagedResearch = computed(() => pagedNodes.value.filter((n: any) => n.mode === 'RESEARCH'))
const pagedStrategies = computed(() => pagedNodes.value.filter((n: any) => n.mode === 'LESSON'))
const pagedAnalysis = computed(() => pagedNodes.value.filter((n: any) => n.mode === 'QUESTION'))

const navigateToPage = (page: number) => {
  const query = { ...route.query, page: page === 1 ? undefined : page.toString() }
  router.replace({ query })
}

const setJournalFilter = (mode: string) => {
  activeJournalFilter.value = activeJournalFilter.value === mode ? null : mode
  navigateToPage(1)
}

// Reader Logic
const selectedNodeId = computed(() => route.query.nodeId as string | undefined)
const selectedNode = computed(() => mockExNodes.find((n: any) => n.id === selectedNodeId.value))
const selectedArticle = computed(() => {
  if (!selectedNode.value) return undefined
  return mockJournalArticles.find(article => article.sourceNodeId === selectedNode.value?.id) || mockJournalArticle
})
const comments = ref<Comment[]>(mockComments.map(comment => ({ ...comment })))
const commentDraft = ref('')
const commentInputRef = ref<HTMLTextAreaElement | null>(null)
const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUserName = computed(() => authStore.user?.displayName?.trim() || authStore.user?.email?.trim() || 'Authenticated user')
const articleComments = computed(() => {
  return comments.value.filter(comment => comment.articleId === selectedArticle.value?.id && comment.status === 'published')
})
const journalWrapperRef = ref<HTMLElement | null>(null)
const boardViewportRef = ref<HTMLElement | null>(null)
const boardNodes = ref<JournalArticleBoardNode[]>([])
const boardPan = ref({ x: 48, y: 36 })
const boardScale = ref(1)
const isBoardFullscreen = ref(false)
const boardFullscreenViewportStyle = ref<Record<string, string>>({})

type BoardInteraction = { type: 'pan'; startClientX: number; startClientY: number; startPanX: number; startPanY: number }

const activeBoardInteraction = ref<BoardInteraction | null>(null)
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

const resizeCommentInput = () => {
  const input = commentInputRef.value
  if (!input) return

  input.style.height = 'auto'
  const maxHeight = 220
  input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`
  input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden'
}

watch(selectedArticle, (article) => {
  boardNodes.value = article ? cloneBoardNodes(article.board.nodes) : []
  commentDraft.value = ''
  nextTick(resizeCommentInput)
  boardPan.value = { x: 48, y: 36 }
  boardScale.value = 1
}, { immediate: true })

const submitComment = () => {
  const article = selectedArticle.value
  const user = authStore.user
  const text = commentDraft.value.trim()

  if (!article || !user || !text) return

  comments.value.unshift({
    id: `comment-${Date.now()}`,
    articleId: article.id,
    authorId: user.uid,
    authorName: currentUserName.value,
    authorRole: user.type || 'Authenticated user',
    createdAt: new Date().toISOString(),
    text,
    likesCount: 0,
    status: 'published'
  })
  commentDraft.value = ''
  nextTick(resizeCommentInput)
}

const closeReader = () => {
  closeBoardFullscreen()
  const query = { ...route.query }
  delete query.nodeId
  router.replace({ query })
}

const syncBoardFullscreenViewport = () => {
  const wrapper = journalWrapperRef.value
  if (!wrapper) return

  const rect = wrapper.getBoundingClientRect()
  boardFullscreenViewportStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  }
}

const openBoardFullscreen = () => {
  isBoardFullscreen.value = true
  syncBoardFullscreenViewport()
  boardPan.value = { x: 48, y: 36 }
  boardScale.value = 1
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

const handleBoardPointerMove = (event: PointerEvent) => {
  const interaction = activeBoardInteraction.value
  if (!interaction) return

  boardPan.value = {
    x: interaction.startPanX + event.clientX - interaction.startClientX,
    y: interaction.startPanY + event.clientY - interaction.startClientY
  }
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

const handleWindowResize = () => {
  if (isBoardFullscreen.value) syncBoardFullscreenViewport()
}

onMounted(() => {
  nextTick(resizeCommentInput)
  window.addEventListener('keydown', handleBoardKeydown)
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  stopWindowTracking()
  window.removeEventListener('keydown', handleBoardKeydown)
  window.removeEventListener('resize', handleWindowResize)
})

const formatCommentDate = (value: string) => {
  return new Intl.DateTimeFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
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

:deep(.journal-signal-card) {
  border: 0 !important;
}

.journal-filter-list {
  flex-wrap: wrap;
}

.journal-filter-button {
  position: relative;
  min-height: 30px;
  border: 0;
  border-bottom: 1px solid transparent;
  padding: 7px 5px 8px;
  background: transparent;
  color: rgba(44, 44, 42, 0.52);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  line-height: 1;
  text-transform: uppercase;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.journal-filter-button:hover {
  border-bottom-color: rgba(44, 44, 42, 0.42);
  color: rgba(44, 44, 42, 0.95);
}

.journal-filter-button.is-active {
  border-bottom-color: rgba(44, 44, 42, 0.88);
  color: rgba(44, 44, 42, 0.95);
}

.journal-filter-button.is-active::after {
  position: absolute;
  bottom: -3px;
  left: 50%;
  width: 4px;
  height: 4px;
  background: rgba(44, 44, 42, 0.88);
  content: '';
  transform: translateX(-50%) rotate(45deg);
}

.journal-search-shell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
  border: 0;
  border-bottom: 1px solid rgba(44, 44, 42, 0.28);
  padding: 0 2px;
  background: transparent;
  transition: border-color 0.2s ease;
}

.journal-search-shell:focus-within {
  border-bottom-color: rgba(44, 44, 42, 0.78);
}

.journal-search-label {
  flex: 0 0 auto;
  color: rgba(44, 44, 42, 0.64);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.journal-search-input {
  width: 210px;
  border: 0;
  padding: 9px 0;
  background: transparent;
  color: rgba(44, 44, 42, 0.9);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  outline: none;
  text-transform: uppercase;
  transition: width 0.2s ease;
}

.journal-search-input:focus {
  width: 290px;
}

.journal-search-input::placeholder {
  color: rgba(44, 44, 42, 0.5);
  opacity: 1;
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
  border: 1px solid rgba(44, 44, 42, 0.24);
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 22px rgba(44, 44, 42, 0.07);
  color: rgba(44, 44, 42, 0.7);
  transition: border-color 0.3s ease, background 0.3s ease, color 0.3s ease;
}

.article-reader-back:hover {
  border-color: rgba(44, 44, 42, 0.5);
  background: #ffffff;
  color: rgba(44, 44, 42, 1);
}

.article-reader-back span:last-child {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.26em;
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

.article-comments-heading span,
.article-comments-heading strong {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.24em;
  opacity: 0.72;
}

.article-comment-composer {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  padding: 22px;
  border: 1px solid rgba(44, 44, 42, 0.24);
  border-left: 3px solid rgba(44, 44, 42, 0.72);
  background: rgba(248, 248, 246, 0.96);
  box-shadow: 0 12px 30px rgba(44, 44, 42, 0.08);
}

.article-comment-composer-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 2px;
}

.article-comment-composer-title > div > span {
  display: block;
  margin-bottom: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(44, 44, 42, 0.58);
}

.article-comment-composer-title h3 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 1.45rem;
  font-style: italic;
  font-weight: 400;
  line-height: 1;
  color: rgba(44, 44, 42, 0.88);
}

.article-comment-composer-status {
  flex: 0 0 auto;
  border: 1px solid rgba(44, 44, 42, 0.18);
  padding: 7px 9px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(44, 44, 42, 0.56);
}

.article-comment-composer-meta,
.article-comment-composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.article-comment-composer-meta span,
.article-comment-composer-actions span {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(44, 44, 42, 0.52);
}

.article-comment-composer-meta strong {
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  color: rgba(44, 44, 42, 0.8);
}

.article-comment-input {
  width: 100%;
  min-height: 42px;
  max-height: 220px;
  resize: none;
  overflow-y: hidden;
  border: 1px solid rgba(44, 44, 42, 0.24);
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.98);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.95rem;
  font-style: italic;
  line-height: 1.45;
  color: rgba(44, 44, 42, 0.9);
  box-shadow: inset 0 1px 2px rgba(44, 44, 42, 0.04);
  outline: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.article-comment-input::placeholder {
  color: rgba(44, 44, 42, 0.6);
  opacity: 1;
}

.article-comment-input:focus {
  border-color: rgba(44, 44, 42, 0.62);
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(44, 44, 42, 0.08);
}

.article-comment-input:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.article-comment-submit {
  border: 1px solid rgba(44, 44, 42, 0.82);
  padding: 11px 15px;
  background: rgba(44, 44, 42, 0.88);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 8px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #ffffff;
  transition: background 0.2s ease, opacity 0.2s ease;
}

.article-comment-submit:hover:not(:disabled) {
  background: rgba(44, 44, 42, 1);
}

.article-comment-submit:disabled {
  cursor: not-allowed;
  background: rgba(44, 44, 42, 0.42);
  border-color: rgba(44, 44, 42, 0.42);
  opacity: 1;
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
  .journal-masthead-tools {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .journal-filter-list {
    width: 100%;
  }

  .journal-search-shell,
  .journal-search-input,
  .journal-search-input:focus {
    width: 100%;
  }

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
  .article-comment-meta,
  .article-comment-composer-title,
  .article-comment-composer-meta,
  .article-comment-composer-actions {
    align-items: start;
    flex-direction: column;
    text-align: left;
    white-space: normal;
  }
}
</style>
