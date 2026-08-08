<template>
  <svg
    class="trade-dragon-grid"
    :viewBox="layout.viewBox"
    preserveAspectRatio="xMidYMid meet"
    role="img"
    aria-label="Trade dragon curve"
    @mouseleave="emit('node-hover', null)"
  >
    <!-- One transparent, outlined square represents one trade. -->
    <rect
      v-for="cell in layout.cells"
      :key="cell.key"
      class="trade-dragon-grid__cell"
      :x="cell.x"
      :y="cell.y"
      :width="safeCellSize"
      :height="safeCellSize"
      fill="transparent"
      :stroke="props.strokeColor"
      :stroke-width="props.strokeWidth"
      stroke-linejoin="miter"
      shape-rendering="crispEdges"
      :aria-label="`Trade ${cell.index + 1}`"
      @click="emit('node-click', { node: cell.trade, event: $event })"
      @mouseenter="emit('node-hover', cell.trade)"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'

type Trade = Record<string, unknown>
type GridPoint = { x: number, y: number }
type Direction = 0 | 1 | 2 | 3
type TradeCell = {
  key: string
  index: number
  trade: Trade
  x: number
  y: number
}

const props = withDefaults(defineProps<{
  /** Preferred input for the reusable component. */
  trades?: Trade[]
  /** Backwards-compatible alias used by ExGenesisLog. */
  nodes?: Trade[]
  links?: unknown[]
  isDark?: boolean
  cacheKey?: string
  pnlMin?: number
  pnlMax?: number
  cellSize?: number
  strokeWidth?: number
  strokeColor?: string
}>(), {
  trades: undefined,
  nodes: () => [],
  links: () => [],
  isDark: false,
  cacheKey: '',
  pnlMin: 0,
  pnlMax: 0,
  cellSize: 24,
  strokeWidth: 1,
  strokeColor: 'currentColor'
})

const emit = defineEmits<{
  (event: 'node-click', payload: { node: Trade, event: MouseEvent }): void
  (event: 'node-hover', node: Trade | null): void
  (event: 'ready'): void
}>()

const inputTrades = computed(() => props.trades ?? props.nodes ?? [])

/**
 * Generate the turn sequence used by the Heighway dragon L-system.
 *
 * X -> X + YF +
 * Y -> - FX - Y
 * F draws one segment; X and Y only describe how the next turns are built.
 */
function generateDragonCurveTurns(segmentCount: number): string[] {
  if (segmentCount <= 1) return []

  return [...generateDragonCurveLSystem(segmentCount)]
    .filter(symbol => symbol === '+' || symbol === '-')
}

function generateDragonCurveLSystem(segmentCount: number): string {
  let sequence = 'FX'
  let generation = 0

  while ([...sequence].filter(symbol => symbol === 'F').length < segmentCount && generation <= 24) {
    let next = ''
    for (const symbol of sequence) {
      if (symbol === 'X') next += 'X+YF+'
      else if (symbol === 'Y') next += '-FX-Y'
      else next += symbol
    }
    sequence = next
    generation += 1
  }

  return sequence
}

/** Convert L-system turns into one cardinal direction per grid move. */
function generateDragonCurveDirections(moveCount: number): Direction[] {
  if (moveCount <= 0) return []

  const directions: Direction[] = []
  let heading: Direction = 0 // east

  // The L-system can contain consecutive turns. They all affect the heading
  // before the next F segment is drawn.
  const sequence = generateDragonCurveLSystem(moveCount)

  for (const symbol of sequence) {
    if (symbol === 'F') {
      directions.push(heading)
      if (directions.length === moveCount) break
    } else if (symbol === '+' || symbol === '-') {
      // + is a quarter-turn clockwise in SVG's y-down coordinate system.
      const turn = symbol === '+' ? 1 : -1
      heading = ((heading + turn + 4) % 4) as Direction
    }
  }

  return directions
}

const directionOffsets: Record<Direction, GridPoint> = {
  0: { x: 1, y: 0 },
  1: { x: 0, y: 1 },
  2: { x: -1, y: 0 },
  3: { x: 0, y: -1 }
}

/**
 * Convert directions to unique grid coordinates.
 *
 * The mathematical dragon path occasionally revisits a lattice vertex when
 * truncated at an arbitrary length. In that case the next available
 * perpendicular cell is chosen. This keeps the invariant required by the
 * renderer: every trade gets a unique cell, and consecutive cells remain
 * edge-adjacent.
 */
function directionsToGridCoordinates(directions: Direction[]): GridPoint[] {
  const coordinates: GridPoint[] = [{ x: 0, y: 0 }]
  const occupied = new Set(['0:0'])

  // This is a small depth-first correction layer around the ideal dragon
  // path. It tries the intended direction first, then perpendicular turns,
  // and backtracks only if a choice would eventually box the path in. Because
  // every step can use any of the four cardinal directions, the returned path
  // is guaranteed to contain unique cells connected edge-to-edge.
  const nextOptionIndex = directions.map(() => 0)
  let step = 0

  while (step < directions.length) {
    const desiredHeading = directions[step]!
    const candidateHeadings: Direction[] = [
      desiredHeading,
      ((desiredHeading + 1) % 4) as Direction,
      ((desiredHeading + 3) % 4) as Direction,
      ((desiredHeading + 2) % 4) as Direction
    ]
    const current = coordinates[step]!
    let placed = false

    for (let option = nextOptionIndex[step]!; option < candidateHeadings.length; option += 1) {
      const candidate = candidateHeadings[option]!
      const offset = directionOffsets[candidate]
      const next = { x: current.x + offset.x, y: current.y + offset.y }
      const key = `${next.x}:${next.y}`

      if (occupied.has(key)) continue

      nextOptionIndex[step] = option + 1
      coordinates.push(next)
      occupied.add(key)
      step += 1
      if (step < nextOptionIndex.length) nextOptionIndex[step] = 0
      placed = true
      break
    }

    if (placed) continue

    // No candidate works from this cell: remove the previous step and let it
    // try its next direction on the following loop.
    nextOptionIndex[step] = 0
    if (step === 0) break
    const removed = coordinates.pop()!
    occupied.delete(`${removed.x}:${removed.y}`)
    step -= 1
  }

  return coordinates
}

/** Normalize a grid path into SVG coordinates and map each trade to a cell. */
function mapTradesToDragonCells(trades: Trade[], size: number): {
  cells: TradeCell[]
  viewBox: string
} {
  if (!trades.length) return { cells: [], viewBox: '0 0 1 1' }

  const directions = generateDragonCurveDirections(Math.max(0, trades.length - 1))
  const grid = directionsToGridCoordinates(directions)
  const minX = Math.min(...grid.map(point => point.x))
  const minY = Math.min(...grid.map(point => point.y))
  const maxX = Math.max(...grid.map(point => point.x))
  const maxY = Math.max(...grid.map(point => point.y))
  const columns = maxX - minX + 1
  const rows = maxY - minY + 1
  const padding = Math.max(size * 0.02, 0.5)

  return {
    cells: trades.map((trade, index) => ({
      key: `${String(trade?.id ?? 'trade')}-${index}`,
      index,
      trade,
      x: (grid[index]!.x - minX) * size,
      y: (grid[index]!.y - minY) * size
    })),
    viewBox: `${-padding} ${-padding} ${columns * size + padding * 2} ${rows * size + padding * 2}`
  }
}

const safeCellSize = computed(() => Math.max(1, Number(props.cellSize) || 24))
const layout = computed(() => mapTradesToDragonCells(inputTrades.value, safeCellSize.value))

onMounted(() => {
  nextTick(() => emit('ready'))
})

watch(layout, () => emit('ready'))
</script>

<style scoped>
.trade-dragon-grid {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
  color: inherit;
}

.trade-dragon-grid__cell {
  cursor: pointer;
}
</style>
