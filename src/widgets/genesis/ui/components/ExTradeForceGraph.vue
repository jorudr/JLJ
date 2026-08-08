<template>
  <svg
    class="asset-heatmap"
    :viewBox="layout.viewBox"
    preserveAspectRatio="none"
    width="100%"
    height="100%"
    role="img"
    aria-label="Asset trading heatmap"
  >
    <g v-if="layout.blocks.length" class="asset-heatmap__blocks">
      <g
        v-for="block in layout.blocks"
        :key="block.key"
        class="asset-heatmap__block"
        :transform="`translate(${block.x} ${block.y})`"
      >
        <rect
          :width="block.width"
          :height="block.height"
          :rx="0"
          :fill="block.fill"
          stroke="#000000"
          :stroke-width="safeStrokeWidth"
          stroke-opacity="1"
          shape-rendering="crispEdges"
        />

        <text
          class="asset-heatmap__ticker"
          :x="block.width / 2"
          :y="block.height * 0.42"
          :font-size="block.tickerFontSize"
          :fill="block.textColor"
          text-anchor="middle"
          dominant-baseline="middle"
          pointer-events="none"
        >
          {{ block.ticker }}
        </text>

        <text
          class="asset-heatmap__result"
          :x="block.width / 2"
          :y="block.height * 0.67"
          :font-size="block.resultFontSize"
          :fill="block.textColor"
          text-anchor="middle"
          dominant-baseline="middle"
          pointer-events="none"
        >
          {{ formatDollar(block.pnl) }}
        </text>
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'

type Trade = Record<string, any>

type AssetAggregate = {
  key: string
  ticker: string
  tradeCount: number
  pnl: number
}

type HeatmapBlock = AssetAggregate & {
  x: number
  y: number
  width: number
  height: number
  fill: string
  textColor: string
  tickerFontSize: number
  resultFontSize: number
}

const props = withDefaults(defineProps<{
  /** Preferred input for direct use. */
  trades?: Trade[]
  /** Existing parent API: trade nodes are accepted as an alias. */
  nodes?: Trade[]
  links?: unknown[]
  isDark?: boolean
  cacheKey?: string
  pnlMin?: number
  pnlMax?: number
  strokeWidth?: number
}>(), {
  trades: undefined,
  nodes: () => [],
  links: () => [],
  isDark: false,
  cacheKey: '',
  pnlMin: 0,
  pnlMax: 0,
  strokeWidth: 0.8
})

const emit = defineEmits<{
  (event: 'node-click', payload: { node: Trade, event: MouseEvent }): void
  (event: 'node-hover', node: Trade | null): void
  (event: 'ready'): void
}>()

const inputTrades = computed(() => props.trades ?? props.nodes ?? [])
const safeStrokeWidth = computed(() => Math.max(0.1, Number(props.strokeWidth) || 0.8))

const getNestedValue = (trade: Trade, key: string) => trade[key] ?? trade.trade?.[key]

const resolveTicker = (trade: Trade) => {
  const value = getNestedValue(trade, 'asset') ??
    getNestedValue(trade, 'ticker') ??
    getNestedValue(trade, 'symbol') ??
    trade.label ??
    'UNKNOWN'

  const ticker = String(value)
    .split('[')[0]!
    .split('|')[0]!
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')

  return ticker || 'UNKNOWN'
}

const resolvePnl = (trade: Trade) => {
  const value = getNestedValue(trade, 'profitInCurrency') ??
    getNestedValue(trade, 'pnl') ??
    getNestedValue(trade, 'profit') ??
    getNestedValue(trade, 'result') ??
    0

  const normalized = typeof value === 'string'
    ? Number.parseFloat(value.replace(/[$,\s]/g, ''))
    : Number(value)

  return Number.isFinite(normalized) ? normalized : 0
}

const aggregateByAsset = (trades: Trade[]): AssetAggregate[] => {
  const aggregates = new Map<string, AssetAggregate>()

  trades
    .filter(trade => !trade?.isCore && !trade?.isNote && !trade?.isScenario)
    .forEach((trade, index) => {
      const ticker = resolveTicker(trade)
      const key = ticker.toUpperCase()
      const existing = aggregates.get(key)

      if (existing) {
        existing.tradeCount += 1
        existing.pnl += resolvePnl(trade)
        return
      }

      aggregates.set(key, {
        key: `${key}-${index}`,
        ticker,
        tradeCount: 1,
        pnl: resolvePnl(trade)
      })
    })

  return Array.from(aggregates.values()).sort((left, right) => {
    if (right.tradeCount !== left.tradeCount) return right.tradeCount - left.tradeCount
    return right.pnl - left.pnl
  })
}

const interpolateColor = (from: [number, number, number], to: [number, number, number], ratio: number) => {
  const safeRatio = Math.min(1, Math.max(0, ratio))
  const channels = from.map((channel, index) => Math.round(channel + (to[index]! - channel) * safeRatio))
  return `rgb(${channels.join(' ')})`
}

const interpolateStops = (stops: Array<[number, number, number]>, ratio: number) => {
  const safeRatio = Math.min(1, Math.max(0, ratio))
  const segmentCount = stops.length - 1
  const scaledRatio = safeRatio * segmentCount
  const segmentIndex = Math.min(segmentCount - 1, Math.floor(scaledRatio))
  const segmentRatio = scaledRatio - segmentIndex

  return interpolateColor(stops[segmentIndex]!, stops[segmentIndex + 1]!, segmentRatio)
}

const neutralColor = '#374151'
const lossColorStops: Array<[number, number, number]> = [
  [55, 65, 81],
  [127, 29, 29],
  [220, 38, 38],
  [255, 31, 31]
]
const profitColorStops: Array<[number, number, number]> = [
  [55, 65, 81],
  [20, 83, 45],
  [22, 163, 74],
  [0, 230, 118]
]

type TreemapArea = {
  aggregate: AssetAggregate
  x: number
  y: number
  width: number
  height: number
}

/**
 * Recursively split one rectangle into adjacent rectangles.
 * The area of every asset block is proportional to its trade count and there
 * are no gaps, so the result remains one solid heatmap parallelepiped.
 */
const splitTreemap = (
  aggregates: AssetAggregate[],
  x: number,
  y: number,
  width: number,
  height: number
): TreemapArea[] => {
  if (!aggregates.length) return []
  if (aggregates.length === 1) {
    return [{ aggregate: aggregates[0]!, x, y, width, height }]
  }

  const totalWeight = aggregates.reduce((sum, asset) => sum + asset.tradeCount, 0)
  const targetWeight = totalWeight / 2
  let accumulatedWeight = 0
  let splitIndex = 1

  for (let index = 0; index < aggregates.length - 1; index += 1) {
    const nextWeight = accumulatedWeight + aggregates[index]!.tradeCount
    if (Math.abs(nextWeight - targetWeight) < Math.abs(accumulatedWeight - targetWeight)) {
      accumulatedWeight = nextWeight
      splitIndex = index + 1
    } else {
      break
    }
  }

  const left = aggregates.slice(0, splitIndex)
  const right = aggregates.slice(splitIndex)
  const leftWeight = left.reduce((sum, asset) => sum + asset.tradeCount, 0)
  const ratio = leftWeight / totalWeight

  if (width >= height) {
    const leftWidth = width * ratio
    return [
      ...splitTreemap(left, x, y, leftWidth, height),
      ...splitTreemap(right, x + leftWidth, y, width - leftWidth, height)
    ]
  }

  const topHeight = height * ratio
  return [
    ...splitTreemap(left, x, y, width, topHeight),
    ...splitTreemap(right, x, y + topHeight, width, height - topHeight)
  ]
}

const layout = computed(() => {
  const aggregates = aggregateByAsset(inputTrades.value)
  if (!aggregates.length) return { blocks: [] as HeatmapBlock[], viewBox: '0 0 1 1' }

  const maxPositivePnl = Math.max(0, ...aggregates.map(asset => asset.pnl))
  const maxNegativeMagnitude = Math.max(0, ...aggregates.map(asset => asset.pnl < 0 ? Math.abs(asset.pnl) : 0))
  const heatmapWidth = 1000
  const heatmapHeight = 640
  const areas = splitTreemap(aggregates, 0, 0, heatmapWidth, heatmapHeight)

  const blocks = areas.map(({ aggregate: asset, x, y, width, height }): HeatmapBlock => {
    const isLoss = asset.pnl < 0
    const isProfit = asset.pnl > 0
    const intensity = isLoss
      ? (maxNegativeMagnitude > 0 ? Math.abs(asset.pnl) / maxNegativeMagnitude : 0)
      : (maxPositivePnl > 0 ? asset.pnl / maxPositivePnl : 1)
    const fill = isLoss
      ? interpolateStops(lossColorStops, intensity)
      : isProfit
        ? interpolateStops(profitColorStops, intensity)
        : neutralColor
    const textColor = '#FFFFFF'
    const textScale = Math.min(width, height)

    return {
      ...asset,
      x,
      y,
      width,
      height,
      fill,
      textColor,
      tickerFontSize: Math.max(7, Math.min(18, textScale * 0.17)),
      resultFontSize: Math.max(6.5, Math.min(13, textScale * 0.13))
    }
  })

  return {
    blocks,
    viewBox: `0 0 ${heatmapWidth} ${heatmapHeight}`
  }
})

const formatDollar = (value: number) => {
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  const absolute = Math.abs(value)
  const formatted = absolute >= 1_000_000
    ? `${(absolute / 1_000_000).toFixed(1)}M`
    : absolute >= 1_000
      ? `${(absolute / 1_000).toFixed(1)}K`
      : absolute.toFixed(2)

  return `${sign}$${formatted}`
}

const emitReady = () => nextTick(() => emit('ready'))

onMounted(emitReady)
watch(layout, emitReady)
</script>

<style scoped>
.asset-heatmap {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  color: inherit;
}

.asset-heatmap__block {
  cursor: default;
}

.asset-heatmap__ticker,
.asset-heatmap__result {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
  letter-spacing: 0.02em;
  user-select: none;
}

.asset-heatmap__result {
  font-weight: 600;
}
</style>
