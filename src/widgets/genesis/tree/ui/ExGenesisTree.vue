<template>
  <div class="absolute inset-0 z-50 overflow-hidden pointer-events-auto touch-none"
       :class="isPanning ? 'cursor-grabbing' : 'cursor-grab'"
       @pointerdown="startPan"
       @pointermove="movePan"
       @pointerup="endPan"
       @pointercancel="endPan">
    <div class="absolute inset-0" :style="panLayerStyle">
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
      <svg class="overflow-visible" width="2" height="2">
        <path :d="connectorPath(1, 1, strategyNodePositions, 'x', 'y')"
              fill="none"
              stroke="#7f7f7f"
              stroke-width="1.5" />
        <template v-for="node in strategyNodePositions" :key="'line-group-'+node.id">
          <path :d="connectorPath(node.x + 1, node.y + 1, node.scenarios, 'globalX', 'globalY')"
                fill="none"
                stroke="#333333"
                stroke-dasharray="2 2"
                stroke-width="1" />
          <template v-for="sc in node.scenarios" :key="'line-content-group-'+sc.id">
            <path :d="conditionRowsPath(sc.globalX + 1, sc.globalY + 1, sc.contents || [])"
                  fill="none"
                  stroke="#2e2e2e"
                  stroke-width="1" />
          </template>
        </template>
      </svg>
    </div>

    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <ExNTtooltip>
        <template #trigger>
          <div class="relative w-16 h-16 border flex items-center justify-center cursor-pointer transition-all duration-500 group/node bg-zinc-100 dark:bg-[#0a0a0a] border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white shadow-[0_0_40px_rgba(0,0,0,0.05)] backdrop-blur-md">
            <div class="absolute top-1 left-1 w-1 h-1 border-t border-l border-black/20 dark:border-white/20 transition-colors duration-500 group-hover/node:border-black dark:group-hover/node:border-white"></div>

            <span class="text-[16px] font-mono font-black tracking-tighter uppercase transition-colors text-black/40 dark:text-white/40 group-hover/node:text-black dark:group-hover/node:text-white">
              USR
            </span>
          </div>
        </template>
        <div class="flex flex-col gap-1 min-w-[120px] p-1">
          <div class="flex flex-col space-y-1 font-mono leading-relaxed uppercase text-black dark:text-white">
            <span class="font-black text-[14px] tracking-widest pb-0.5">{{ authStore.user?.displayName || authStore.user?.email || 'Operator_0x4F' }}</span>
            <div class="w-full h-[1px] bg-black/10 dark:bg-white/10 mb-1"></div>
            <span class="text-[9px] opacity-60">ID. {{ authStore.user?.uid?.slice(0, 10) || 'UNKNOWN' }}</span>
            <span class="text-[9px] opacity-60">TYPE. {{ authStore.user?.type || 'COMMON' }}</span>
            <span class="text-[9px] opacity-60">EST. {{ formatCreationDate(authStore.user?.joinedAt) }}</span>
          </div>
        </div>
      </ExNTtooltip>
    </div>

    <template v-for="node in strategyNodePositions" :key="'strat-'+node.id">
      <div class="absolute top-1/2 left-1/2 transition-all duration-1000 z-[5]"
           :style="{ transform: `translate(calc(-50% + ${node.x}px), calc(-50% + ${node.y}px))` }">
        <ExNTtooltip>
          <template #trigger>
            <div @click="handleStrategyClick(node.id)"
                 class="relative w-12 h-12 border flex items-center justify-center cursor-pointer transition-all duration-500 group/node backdrop-blur-md bg-zinc-100 dark:bg-[#0a0a0a] border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white"
                 :class="[
                   selectedStrategyId === node.id
                     ? 'shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.05)] border-black/30 dark:border-white/30'
                     : ''
                 ]">
              <div class="absolute top-1 left-1 w-1 h-1 border-t border-l transition-colors duration-500"
                   :class="selectedStrategyId === node.id ? 'border-black/40 dark:border-white/40' : 'border-black/10 dark:border-white/10 group-hover/node:border-black dark:group-hover/node:border-white'"></div>

              <span class="text-[12px] font-mono font-black tracking-tighter uppercase transition-colors"
                    :class="selectedStrategyId === node.id ? 'text-black dark:text-white' : 'text-black/40 dark:text-white/40 group-hover/node:text-black dark:group-hover/node:text-white'">
                {{ (node.name || '').slice(0, 3) }}
              </span>

              <div v-if="selectedStrategyId === node.id"
                   class="absolute -bottom-1 -right-1 w-2.5 h-2.5 rotate-45 border-2 border-white dark:border-black shadow-sm transition-colors duration-500 bg-emerald-500"></div>
            </div>
          </template>
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-[8px] font-mono opacity-40 uppercase">Protocol_Metadata</span>
            </div>
            <p class="text-[10px] font-mono font-bold leading-relaxed uppercase">{{ node.name }}</p>
          </div>
        </ExNTtooltip>
      </div>

      <div v-for="sc in node.scenarios" :key="'sc-'+sc.id"
           class="absolute top-1/2 left-1/2 transition-all duration-1000 z-[4]"
           :style="{ transform: `translate(calc(-50% + ${sc.globalX}px), calc(-50% + ${sc.globalY}px))` }">
        <ExNTtooltip>
          <template #trigger>
            <div class="relative w-12 h-12 border flex items-center justify-center cursor-pointer transition-all duration-500 group/node backdrop-blur-md bg-zinc-100 dark:bg-[#0a0a0a] border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white">
              <div class="absolute top-1 left-1 w-1 h-1 border-t border-l transition-colors duration-500 border-black/10 dark:border-white/10 group-hover/node:border-black dark:group-hover/node:border-white"></div>
              <span class="px-1 text-[10px] font-mono font-black tracking-[0.16em] uppercase leading-tight text-center transition-colors text-black/45 dark:text-white/45 group-hover/node:text-black dark:group-hover/node:text-white break-words">
                {{ sc.shortName || sc.displayName || sc.label || sc.name || 'SCN' }}
              </span>
            </div>
          </template>
          <div class="flex min-w-[150px] flex-col gap-2">
            <p class="text-[13px] font-mono font-black leading-snug uppercase tracking-wide text-black dark:text-white">
              {{ sc.displayName || sc.label || sc.name || 'Scenario' }}
            </p>
            <div class="h-px w-full bg-white/25"></div>
            <p class="text-[9px] font-mono font-bold uppercase tracking-wide text-black/60 dark:text-white/60">
              TYPE: {{ sc.typeLabel || 'ENTRY SCENARIO' }}
            </p>
          </div>
        </ExNTtooltip>
      </div>

      <template v-for="sc in node.scenarios" :key="'content-group-'+sc.id">
        <div v-for="content in (sc.contents || [])" :key="'content-'+content.id"
             class="absolute top-1/2 left-1/2 transition-all duration-1000 z-[2]"
             :style="{ transform: `translate(calc(-50% + ${content.globalX}px), calc(-50% + ${content.globalY}px))` }">
          <ExNTtooltip>
            <template #trigger>
              <div class="relative w-12 h-12 border flex items-center justify-center cursor-pointer transition-all duration-500 group/node backdrop-blur-md bg-zinc-100 dark:bg-[#0a0a0a] border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white">
                <div class="absolute top-1 left-1 w-1 h-1 border-t border-l transition-colors duration-500 border-black/10 dark:border-white/10 group-hover/node:border-black dark:group-hover/node:border-white"></div>
                <span class="px-1 text-[10px] font-mono font-black tracking-[0.16em] uppercase leading-tight text-center transition-colors text-black/45 dark:text-white/45 group-hover/node:text-black dark:group-hover/node:text-white break-words">
                  {{ content.shortName || content.displayName || content.label || content.name || 'CNT' }}
                </span>
              </div>
            </template>
            <div class="flex min-w-[140px] flex-col gap-2">
              <p class="text-[13px] font-mono font-black leading-snug uppercase tracking-wide text-black dark:text-white">
                {{ content.displayName || content.label || content.name || 'Condition' }}
              </p>
              <div class="h-px w-full bg-white/25"></div>
              <p class="text-[9px] font-mono font-bold uppercase tracking-wide text-black/60 dark:text-white/60">
                TYPE: {{ content.typeLabel || 'CONDITION' }}
              </p>
            </div>
          </ExNTtooltip>
        </div>
      </template>
    </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ExNTtooltip from '~/shared/ui/ExNTtooltip.vue'
import { useGenesisTree } from '../model/useGenesisTree'

const emit = defineEmits<{
  (e: 'switch-view', value: 'cube'): void
}>()

const {
  authStore,
  formatCreationDate,
  selectedStrategyId,
  strategyNodePositions,
  selectStrategy
} = useGenesisTree()

const pan = ref({ x: 0, y: 0 })
const panStart = ref({ x: 0, y: 0 })
const lastPointer = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const suppressNextClick = ref(false)

const panLayerStyle = computed(() => ({
  transform: `translate3d(${pan.value.x}px, ${pan.value.y}px, 0)`
}))

const handleStrategyClick = (id: string) => {
  if (suppressNextClick.value) return

  selectStrategy(id)
  emit('switch-view', 'cube')
}

const startPan = (event: PointerEvent) => {
  if (event.button !== 0) return

  isPanning.value = true
  suppressNextClick.value = false
  panStart.value = { x: event.clientX, y: event.clientY }
  lastPointer.value = { x: event.clientX, y: event.clientY }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

const movePan = (event: PointerEvent) => {
  if (!isPanning.value) return

  const totalDx = event.clientX - panStart.value.x
  const totalDy = event.clientY - panStart.value.y
  const dx = event.clientX - lastPointer.value.x
  const dy = event.clientY - lastPointer.value.y

  if (Math.hypot(totalDx, totalDy) > 4) {
    suppressNextClick.value = true
  }

  pan.value = {
    x: pan.value.x + dx,
    y: pan.value.y + dy
  }
  lastPointer.value = { x: event.clientX, y: event.clientY }
}

const endPan = (event: PointerEvent) => {
  if (!isPanning.value) return

  isPanning.value = false

  if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) {
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  }

  if (suppressNextClick.value) {
    window.setTimeout(() => {
      suppressNextClick.value = false
    }, 0)
  }
}

const connectorPath = (
  parentX: number,
  parentY: number,
  children: Array<Record<string, any>>,
  childXKey: string,
  childYKey: string
) => {
  if (!children.length) return ''

  const points = children.map(child => ({
    x: Number(child[childXKey]) + 1,
    y: Number(child[childYKey]) + 1
  }))
  const childY = points[0].y
  const busY = parentY + ((childY - parentY) / 2)
  const minX = Math.min(...points.map(point => point.x))
  const maxX = Math.max(...points.map(point => point.x))
  const busStartX = Math.min(parentX, minX)
  const busEndX = Math.max(parentX, maxX)
  const childDrops = points.map(point => `M ${point.x} ${busY} V ${point.y}`)

  return [
    `M ${parentX} ${parentY} V ${busY}`,
    `M ${busStartX} ${busY} H ${busEndX}`,
    ...childDrops
  ].join(' ')
}

const conditionRowsPath = (
  scenarioX: number,
  scenarioY: number,
  contents: Array<Record<string, any>>
) => {
  if (!contents.length) return ''

  const points = contents.map(content => ({
    x: Number(content.globalX) + 1,
    y: Number(content.globalY) + 1
  }))
  const rowMap = new Map<number, Array<{ x: number, y: number }>>()

  points.forEach((point) => {
    rowMap.set(point.y, [...(rowMap.get(point.y) || []), point])
  })

  const rows = Array.from(rowMap.entries())
    .sort(([rowA], [rowB]) => rowA - rowB)
    .map(([, row]) => row.sort((a, b) => a.x - b.x))
  const firstRow = rows[0]
  const firstRowY = firstRow[0].y
  const rootBusY = scenarioY + ((firstRowY - scenarioY) / 2)
  const rootMinX = Math.min(scenarioX, ...firstRow.map(point => point.x))
  const rootMaxX = Math.max(scenarioX, ...firstRow.map(point => point.x))
  const paths = [
    `M ${scenarioX} ${scenarioY} V ${rootBusY}`,
    `M ${rootMinX} ${rootBusY} H ${rootMaxX}`,
    ...firstRow.map(point => `M ${point.x} ${rootBusY} V ${point.y}`)
  ]

  rows.slice(1).forEach((row, rowIndex) => {
    const previousRow = rows[rowIndex]
    const parentPoint = previousRow[Math.min(1, previousRow.length - 1)]
    const rowY = row[0].y
    const rowBusY = parentPoint.y + ((rowY - parentPoint.y) / 2)
    const minX = Math.min(...row.map(point => point.x))
    const maxX = Math.max(...row.map(point => point.x))
    const childDrops = row.map(point => `M ${point.x} ${rowBusY} V ${point.y}`)

    paths.push(`M ${parentPoint.x} ${parentPoint.y} V ${rowBusY}`)
    paths.push(`M ${Math.min(parentPoint.x, minX)} ${rowBusY} H ${Math.max(parentPoint.x, maxX)}`)
    paths.push(...childDrops)
  })

  return paths.join(' ')
}

const connectorPointsPath = (
  parentX: number,
  parentY: number,
  points: Array<{ x: number, y: number }>
) => {
  if (!points.length) return ''

  const childY = points[0].y
  const busY = parentY + ((childY - parentY) / 2)
  const minX = Math.min(...points.map(point => point.x))
  const maxX = Math.max(...points.map(point => point.x))
  const busStartX = Math.min(parentX, minX)
  const busEndX = Math.max(parentX, maxX)
  const childDrops = points.map(point => `M ${point.x} ${busY} V ${point.y}`)

  return [
    `M ${parentX} ${parentY} V ${busY}`,
    `M ${busStartX} ${busY} H ${busEndX}`,
    ...childDrops
  ].join(' ')
}

</script>
