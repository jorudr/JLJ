<template>
  <div class="community-page min-h-screen bg-[#f7f7f4] text-[#171717]">
    <header class="sticky top-0 z-40 border-b border-black/[0.08] bg-[#f7f7f4]/90 backdrop-blur-xl">
      <div class="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 md:px-6">
        <div class="shrink-0">
          <h1 class="text-lg font-semibold tracking-tight">Community</h1>
        </div>

        <label class="relative min-w-0 flex-1">
          <input
            v-model="searchQuery"
            class="h-11 w-full rounded-none border border-black/[0.1] bg-white/70 px-4 text-[15px] outline-none transition-colors placeholder:text-black/35 focus:border-black/30"
            placeholder="Search ideas, questions, trades, signals, lessons"
          />
        </label>
      </div>
    </header>

    <main class="mx-auto grid max-w-5xl gap-10 px-4 py-8 md:px-6 md:py-12">
      <section class="grid gap-3">
        <article
          v-for="item in filteredFeed"
          :key="item.id"
          class="feed-item group bg-white transition-colors hover:bg-[#fbfbf8]"
        >
          <div class="flex gap-4 p-5 md:gap-5 md:p-6">
            <div class="grid h-11 w-11 shrink-0 place-items-center border border-black/[0.08] bg-[#f2f2ee] text-sm font-medium text-black/55">
              {{ initials(item.author) }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-black/45">
                <span>{{ item.author }}</span>
                <span>{{ item.domain }}</span>
              </div>

              <h2 class="mt-2 text-xl font-semibold leading-snug tracking-tight text-black md:text-2xl">
                {{ item.title }}
              </h2>

              <p class="mt-3 max-w-3xl text-[15px] leading-7 text-black/64">
                {{ item.summary }}
              </p>

              <div class="mt-4 flex flex-wrap gap-2">
                <span
                  v-for="tag in item.tags"
                  :key="tag"
                  class="border border-black/[0.08] bg-[#f7f7f4] px-2.5 py-1 text-xs text-black/50"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </article>

        <div v-if="filteredFeed.length === 0" class="border border-black/[0.08] bg-white p-10 text-center text-sm text-black/45">
          Nothing found
        </div>
      </section>

      <section class="grid gap-3">
        <h2 class="px-1 text-base font-semibold tracking-tight text-black/80">Education</h2>

        <article
          v-for="lesson in filteredEducation"
          :key="lesson.id"
          class="feed-item bg-white transition-colors hover:bg-[#fbfbf8]"
        >
          <div class="p-5 md:p-6">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-black/45">
              <span>{{ lesson.level }}</span>
              <span>{{ lesson.duration }}</span>
            </div>

            <h3 class="mt-2 text-xl font-semibold leading-snug tracking-tight text-black md:text-2xl">
              {{ lesson.title }}
            </h3>

            <p class="mt-3 max-w-3xl text-[15px] leading-7 text-black/64">
              {{ lesson.summary }}
            </p>

            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="module in lesson.modules"
                :key="module"
                class="border border-black/[0.08] bg-[#f7f7f4] px-2.5 py-1 text-xs text-black/50"
              >
                {{ module }}
              </span>
            </div>
          </div>
        </article>

        <div v-if="filteredEducation.length === 0" class="border border-black/[0.08] bg-white p-10 text-center text-sm text-black/45">
          Nothing found
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'

type FeedType = 'idea' | 'question' | 'trade' | 'signal'

interface FeedItem {
  id: string
  type: FeedType
  title: string
  summary: string
  author: string
  domain: string
  tags: string[]
}

interface EducationItem {
  id: string
  title: string
  summary: string
  level: string
  duration: string
  modules: string[]
}

const searchQuery = ref('')

const feedItems: FeedItem[] = [
  {
    id: 'signal-btc-supply',
    type: 'signal',
    title: 'BTC compression into weekly supply',
    summary: 'Funding reset while spot bids keep holding the prior displacement block. Signal remains conditional: accept above 71.4k, invalidate below the lower shelf.',
    author: 'Hash Vector',
    domain: 'Crypto',
    tags: ['BTC', 'Funding', 'Supply']
  },
  {
    id: 'idea-london-continuation',
    type: 'idea',
    title: 'Session drift model for London continuation',
    summary: 'A model for separating Asian-range continuation from reversal. The useful variable is not range size, but where volume accepts after the first sweep.',
    author: 'Mira',
    domain: 'FX',
    tags: ['London', 'Volume', 'Session']
  },
  {
    id: 'trade-xau-auction',
    type: 'trade',
    title: 'XAUUSD failed auction short',
    summary: 'Entry after the third rejection through prior day high. Partial at 1.8R, final exit on New York VWAP reclaim. Good read, weak patience on runner.',
    author: 'Aurum Log',
    domain: 'Metals',
    tags: ['XAUUSD', 'Execution', 'Review']
  },
  {
    id: 'question-cpi-sizing',
    type: 'question',
    title: 'How do you size during CPI volatility?',
    summary: 'ATR reduction protects the account but cuts the best setups too far. Looking for a rule that accounts for spread expansion and invalidation distance.',
    author: 'Risk Apprentice',
    domain: 'Risk',
    tags: ['Risk', 'CPI', 'Position sizing']
  },
  {
    id: 'idea-signal-decay',
    type: 'idea',
    title: 'Community levels should expire like options',
    summary: 'Shared levels become dangerous when they survive without context. Proposal: every public level gets a decay state: fresh, aging, stale or invalidated.',
    author: 'Archive Seer',
    domain: 'Process',
    tags: ['Workflow', 'Levels', 'Context']
  },
  {
    id: 'signal-dxy-midpoint',
    type: 'signal',
    title: 'DXY rejection at macro midpoint',
    summary: 'A daily close below midpoint unlocks EUR and metals correlation basket. Confirmation needs weakness into the final two hours, not only an intraday wick.',
    author: 'Macro Circuit',
    domain: 'Macro',
    tags: ['DXY', 'Macro', 'Correlation']
  },
  {
    id: 'trade-nvda-orb',
    type: 'trade',
    title: 'NVDA opening range breakout review',
    summary: 'Good thesis, late execution. Breakout was valid after reclaim of first pullback; chasing the first candle added avoidable heat.',
    author: 'Equity Ghost',
    domain: 'Equities',
    tags: ['NVDA', 'ORB', 'Review']
  },
  {
    id: 'question-curve-fitting',
    type: 'question',
    title: 'When does backtesting become curve fitting?',
    summary: 'Three-filter strategy across regimes. Performance improves after volatility filter, but sample size drops below comfort. Where do you draw the line?',
    author: 'Data Monk',
    domain: 'Research',
    tags: ['Backtest', 'Systems', 'Sample size']
  }
]

const educationItems: EducationItem[] = [
  {
    id: 'education-structure-basics',
    title: 'Market Structure Basics',
    summary: 'A foundation for reading swing structure, displacement, invalidation and clean continuation without adding unnecessary indicators.',
    level: 'Starter',
    duration: '12 lessons',
    modules: ['Swing logic', 'Break vs sweep', 'Invalidation']
  },
  {
    id: 'education-review-lab',
    title: 'Execution Review Lab',
    summary: 'A practical workflow for turning each completed trade into a decision record, mistake class and reusable rule.',
    level: 'Intermediate',
    duration: '9 lessons',
    modules: ['Replay', 'Error taxonomy', 'Rule extraction']
  },
  {
    id: 'education-signal-validation',
    title: 'Signal Validation Systems',
    summary: 'How to separate useful public signals from noise using context windows, confirmation, conflict checks and time decay.',
    level: 'Advanced',
    duration: '15 lessons',
    modules: ['Signal decay', 'Context scoring', 'Confirmation']
  }
]

const normalizedQuery = computed(() => searchQuery.value.trim().toLowerCase())

const filteredFeed = computed(() => {
  if (!normalizedQuery.value) return feedItems

  return feedItems.filter((item) => [
    item.type,
    item.title,
    item.summary,
    item.author,
    item.domain,
    ...item.tags
  ].join(' ').toLowerCase().includes(normalizedQuery.value))
})

const filteredEducation = computed(() => {
  if (!normalizedQuery.value) return educationItems

  return educationItems.filter((item) => [
    item.title,
    item.summary,
    item.level,
    ...item.modules
  ].join(' ').toLowerCase().includes(normalizedQuery.value))
})

const initials = (name: string) => name
  .split(' ')
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

const resetScroll = () => {
  document.documentElement.style.overflow = 'auto'
  document.documentElement.style.height = 'auto'
  document.body.style.overflow = 'auto'
  document.body.style.height = 'auto'
}

onMounted(() => {
  resetScroll()
})

onUnmounted(() => {
  document.documentElement.style.overflow = ''
  document.documentElement.style.height = ''
  document.body.style.overflow = ''
  document.body.style.height = ''
})

definePageMeta({ layout: false })
</script>

<style scoped>
.community-page {
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: visible;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.feed-item {
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
}

:global(html),
:global(body),
:global(#__nuxt) {
  min-height: 100%;
  overflow-y: auto;
}
</style>
