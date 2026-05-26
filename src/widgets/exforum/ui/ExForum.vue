<template>
  <div class="w-full max-w-4xl mx-auto px-6 py-12 pb-32 flex flex-col space-y-16">
    <!-- Header -->
    <header class="flex flex-col items-start border-b border-theme-border pb-8">
      <div class="flex items-center space-x-4 mb-4">
        <div class="w-3 h-3 bg-theme-text rotate-45"></div>
        <h1 class="text-[10px] font-mono tracking-[0.8em] uppercase font-black opacity-40 text-theme-text">Market_Intel_Subsystem</h1>
      </div>
      <p class="text-4xl font-mono font-black uppercase tracking-tighter text-theme-text">Real-Time_Discourse</p>
    </header>

    <!-- Feed -->
    <div class="flex flex-col space-y-16">
      <div v-for="(thread, index) in threads" :key="thread.id" class="flex flex-col space-y-6">
        
        <!-- Section Divider / Meta Tag -->
        <div class="flex items-center space-x-6 text-theme-text">
          <span class="text-[10px] font-mono tracking-[0.4em] opacity-30 uppercase">{{ (index + 1).toString().padStart(2, '0') }} // {{ thread.asset }}</span>
          <div class="flex-grow h-px bg-theme-border"></div>
        </div>

        <!-- ExPanel for the Thread -->
        <ExPanel :title="thread.title" :telemetry="thread.time" variant="standard">
          <div class="flex flex-col space-y-6 pt-2">
            
            <!-- Author & Sentiment Metadata -->
            <div class="flex flex-wrap items-center space-x-4 pb-4 border-b border-theme-border/30 gap-y-2">
              <div class="flex items-center space-x-2">
                <div class="w-1.5 h-1.5 rotate-45" :class="thread.sentiment === 'Bullish' ? 'bg-green-500' : thread.sentiment === 'Bearish' ? 'bg-red-500' : 'bg-theme-text/50'"></div>
                <span class="text-[9px] font-mono uppercase tracking-[0.3em] font-black" :class="thread.sentiment === 'Bullish' ? 'text-green-500' : thread.sentiment === 'Bearish' ? 'text-red-500' : 'text-theme-text/50'">Bias: {{ thread.sentiment }}</span>
              </div>
              <span class="text-[9px] font-mono uppercase tracking-widest opacity-30 hidden sm:inline">|</span>
              <div class="flex items-center space-x-2">
                <img :src="thread.avatar" :alt="thread.author" class="w-5 h-5 rounded-sm border border-theme-border opacity-80" />
                <span class="text-[9px] font-mono uppercase tracking-widest opacity-60">{{ thread.author }}</span>
              </div>
            </div>

            <!-- Content Area (Expandable) -->
            <div class="relative transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden"
                 :class="thread.expanded ? 'max-h-[2000px]' : 'max-h-[72px]'">
              <ExText variant="body" class="leading-relaxed whitespace-pre-wrap opacity-80">{{ thread.content }}</ExText>
              
              <!-- Fade Out Gradient -->
              <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[var(--theme-bg)] to-transparent pointer-events-none transition-opacity duration-500"
                   :style="{ opacity: thread.expanded ? '0' : '0.95' }">
              </div>
            </div>

            <!-- Footer Actions -->
            <div class="flex items-center justify-between pt-4 border-t border-theme-border/30">
              <div class="flex space-x-6 text-[9px] font-mono tracking-[0.2em] uppercase text-theme-text opacity-40">
                <span class="flex items-center space-x-2">
                  <span class="w-1 h-1 bg-current rounded-full"></span>
                  <span>{{ thread.replies }} Replies</span>
                </span>
                <span class="flex items-center space-x-2">
                  <span class="w-1 h-1 bg-current rounded-full"></span>
                  <span>{{ thread.likes }} Likes</span>
                </span>
                <span class="flex items-center space-x-2">
                  <span class="w-1 h-1 bg-current rounded-full"></span>
                  <span>Impact: {{ thread.impact }}</span>
                </span>
              </div>
              
              <ExButton variant="ghost" @click="thread.expanded = !thread.expanded">
                {{ thread.expanded ? 'Collapse_Data' : 'Expand_Data' }}
              </ExButton>
            </div>
          </div>
        </ExPanel>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ExPanel from '~/shared/ui/ExPanel.vue'
import ExText from '~/shared/ui/ExText.vue'
import ExButton from '~/shared/ui/ExButton.vue'

interface Thread {
  id: number
  asset: string
  author: string
  avatar: string
  time: string
  title: string
  content: string
  sentiment: 'Bullish' | 'Bearish' | 'Neutral'
  replies: number
  likes: number
  impact: string
  expanded: boolean
}

const threads = ref<Thread[]>([
  {
    id: 1,
    asset: 'EUR/USD',
    author: 'Quant_0x9',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Quant_0x9',
    time: 'T-15m',
    title: 'Liquidity Sweep at 1.0850 structural level',
    content: 'We observed a massive liquidity cascade sweeping the 1.0850 lows during the London open. High-frequency algorithms unloaded significant volume into retail stop losses, creating a classic deviation before reversion.\n\nLooking at the order book depth, there is an imbalance resting around 1.0920. If we reclaim the Vwap on the 15m timeframe, the probability of a squeeze towards that inefficiency is extremely high. Note the delta divergence on the footprint charts—selling pressure was entirely absorbed by passive limit bids. This indicates accumulation by larger participants. We are setting alerts for a break of structure on the 5m to confirm the shift in order flow.',
    sentiment: 'Bullish',
    replies: 12,
    likes: 342,
    impact: 'High',
    expanded: false
  },
  {
    id: 2,
    asset: 'XAU/USD',
    author: 'Macro_Vector',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Macro_Vector',
    time: 'T-1h',
    title: 'Yield curve steepening implications for Gold',
    content: 'The recent bear steepening of the yield curve is putting unprecedented pressure on non-yielding assets. Despite geopolitical premiums remaining high, the mathematical reality of a 10-year pushing 4.8% is shifting capital flows.\n\nFrom a technical perspective, Gold is testing the weekly fair value gap. A closure below $1980 on the daily timeframe would likely trigger systematic trend-following funds to flip net-short. However, central bank buying remains the invisible hand supporting the bids. Proceed with caution and reduce position sizing until structural clarity returns. The next 48 hours will be critical for defining the quarterly trend.',
    sentiment: 'Bearish',
    replies: 34,
    likes: 184,
    impact: 'Medium',
    expanded: false
  },
  {
    id: 3,
    asset: 'BTC/USD',
    author: 'Hash_Rate',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Hash_Rate',
    time: 'T-3h',
    title: 'On-chain accumulation phases and exchange outflow',
    content: 'Exchange reserves have hit a multi-year low this morning. On-chain metrics show aggressive accumulation by wallets holding between 1k and 10k BTC, a cohort that historically front-runs major volatility expansions.\n\nSimultaneously, the funding rates on perpetual futures have reset to baseline neutral, washing out the excessive leverage from late longs. This creates a clean slate for the next impulse. The primary resistance block sits at $64,500. A daily close above this level invalidates the local distribution thesis and shifts the market structure back to trending conditions. Spot volume must confirm any breakout attempts.',
    sentiment: 'Bullish',
    replies: 89,
    likes: 812,
    impact: 'High',
    expanded: false
  },
  {
    id: 4,
    asset: 'SPX',
    author: 'Volatility_Arb',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Volatility_Arb',
    time: 'T-5h',
    title: 'VIX crush and institutional put selling',
    content: 'The relentless grind higher in equities is being entirely driven by options market dealer positioning. We are seeing massive volumes of put selling at the 5000 strike, forcing dealers into a long-gamma state. This suppresses volatility and creates a self-fulfilling feedback loop of tight ranges and upward drift.\n\nUntil we see a catalyst that forces dealers to unhedge, shorting this market is fighting structural flows. The skew is historically flat, suggesting complacency is at a peak. While a reversion is mathematically inevitable, timing it in a suppressed volatility regime requires patience. Wait for the VIX to sustain a breakout above 15 before assuming any short delta exposure.',
    sentiment: 'Neutral',
    replies: 45,
    likes: 92,
    impact: 'Low',
    expanded: false
  }
])
</script>

<style scoped>
/* Scoped styles are largely unnecessary due to Ex* components and global tokens. */
</style>
