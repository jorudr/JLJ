<template>
  <div ref="hostRef" class="absolute inset-0 h-full w-full overflow-hidden bg-transparent">
    <div ref="graphRef" class="h-full w-full" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import ForceGraph, { type LinkObject, type NodeObject } from 'force-graph'
// d3-force-3d is the physics engine used internally by force-graph. The
// package currently does not publish TypeScript declarations.
// @ts-expect-error Missing declaration file is provided by the upstream package.
import { forceCollide } from 'd3-force-3d'

interface TradeForceNode extends NodeObject {
  id: string
  label: string
  isCore?: boolean
  isScenario?: boolean
  isNote?: boolean
  isOpenTrade?: boolean
  parentId?: string
  pnl?: number
  graphPos?: { x: number; y: number }
  seedPos?: { x: number; y: number; z: number }
}

interface TradeForceLink extends LinkObject<TradeForceNode> {
  source: string | TradeForceNode
  target: string | TradeForceNode
  kind?: 'chronological' | 'scenario' | 'note' | 'core'
  distance?: number
  strength?: number
}

const props = withDefaults(defineProps<{
  nodes: TradeForceNode[]
  links: TradeForceLink[]
  isDark?: boolean
  cacheKey?: string
  pnlMin?: number
  pnlMax?: number
}>(), {
  isDark: false,
  cacheKey: '',
  pnlMin: 0,
  pnlMax: 0
})

const emit = defineEmits<{
  (event: 'node-click', payload: { node: TradeForceNode; event: MouseEvent }): void
  (event: 'node-hover', node: TradeForceNode | null): void
  (event: 'ready'): void
}>()

const hostRef = ref<HTMLDivElement | null>(null)
const graphRef = ref<HTMLDivElement | null>(null)
let graph: any = null
let graphDataSignature = ''
let hoveredNodeId: string | null = null
let connectedNodeIds = new Set<string>()
let nodeDegreeMap = new Map<string, number>()

// Physics parameters changed: do not reuse positions produced by the old
// non-collision layout.
const CACHE_PREFIX = 'exgenesis-force-graph:v4:'

const hash = (value: string) => {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return (result >>> 0).toString(36)
}

const getCacheKey = () => {
  const nodeIds = props.nodes.map(node => node.id).sort().join(',')
  const links = props.links
    .map(link => `${link.kind || 'link'}:${String(link.source)}:${String(link.target)}`)
    .sort()
    .join(',')
  return `${CACHE_PREFIX}${hash(`${props.cacheKey}|${nodeIds}|${links}`)}`
}

const getNodeGraphRadius = (node: TradeForceNode) => {
  const degree = nodeDegreeMap.get(node.id) || 1
  if (node.isCore) return 6.5
  if (node.isScenario) return 5.5
  if (node.isNote) return 2.2
  return 3.4 + Math.min(3, degree) * 0.45
}

const getNodeRadius = (node: TradeForceNode, globalScale = 1) => {
  return getNodeGraphRadius(node) * Math.max(0.8, globalScale / 3.2)
}

const getNodeColor = (node: TradeForceNode) => {
  if (node.isOpenTrade) return props.isDark ? '#facc15' : '#ca8a04'
  if (node.isCore) return props.isDark ? '#f8fafc' : '#0f172a'
  if (node.isScenario) return props.isDark ? '#cbd5e1' : '#475569'
  if (node.isNote) return props.isDark ? '#94a3b8' : '#64748b'

  const pnl = Number(node.pnl)
  if (pnl > 0) {
    const intensity = props.pnlMax > 0 ? Math.min(1, pnl / props.pnlMax) : 1
    const channel = Math.round(174 + (255 - 174) * intensity)
    return `rgb(${channel} ${channel} ${channel})`
  }

  if (pnl < 0) {
    const intensity = props.pnlMin < 0 ? Math.min(1, Math.abs(pnl) / Math.abs(props.pnlMin)) : 1
    const red = Math.round(254 - (254 - 239) * intensity)
    const green = Math.round(202 - (202 - 68) * intensity)
    const blue = Math.round(202 - (202 - 68) * intensity)
    return `rgb(${red} ${green} ${blue})`
  }

  return 'rgb(210 210 210)'
}

const isConnected = (node: TradeForceNode) => {
  return !hoveredNodeId || node.id === hoveredNodeId || connectedNodeIds.has(node.id)
}

const paintNode = (node: TradeForceNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
  const radius = getNodeRadius(node, globalScale)
  const active = isConnected(node)
  const dimmed = hoveredNodeId !== null && !active
  const color = getNodeColor(node)

  ctx.save()
  ctx.globalAlpha = dimmed ? 0.16 : 1
  ctx.fillStyle = color
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.arc(node.x || 0, node.y || 0, radius, 0, Math.PI * 2)
  ctx.fill()

  if (node.id === hoveredNodeId && node.label) {
    const fontSize = Math.max(node.isNote ? 8 : 10, Math.floor(11 * Math.max(0.75, globalScale / 2.2)))
    ctx.globalAlpha = dimmed ? 0.16 : 1
    ctx.fillStyle = props.isDark ? '#f8fafc' : '#0f172a'
    ctx.font = `bold ${fontSize}px Inter`
    ctx.textAlign = node.isCore ? 'center' : 'left'
    ctx.textBaseline = node.isCore ? 'bottom' : 'middle'
    ctx.fillText(
      node.label,
      node.isCore ? (node.x || 0) : (node.x || 0) + radius + 7 / globalScale,
      node.isCore ? (node.y || 0) - radius - 7 / globalScale : (node.y || 0)
    )
  }
  ctx.restore()
}

const paintLink = (link: TradeForceLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
  const source = typeof link.source === 'object' ? link.source : null
  const target = typeof link.target === 'object' ? link.target : null
  if (!source || !target) return

  const active = !hoveredNodeId || source.id === hoveredNodeId || target.id === hoveredNodeId
  const color = props.isDark ? '#cbd5e1' : '#334155'
  ctx.save()
  ctx.globalAlpha = active
    ? (link.kind === 'core' || link.kind === 'scenario' ? 0.11 : 0.24)
    : 0.025
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(0.45, 0.8 / globalScale)
  ctx.beginPath()
  ctx.moveTo(source.x || 0, source.y || 0)
  ctx.lineTo(target.x || 0, target.y || 0)
  ctx.stroke()
  ctx.restore()
}

const readCachedPositions = (nodes: TradeForceNode[]) => {
  if (typeof window === 'undefined') return

  try {
    const raw = window.localStorage.getItem(getCacheKey())
    if (!raw) return
    const cached = JSON.parse(raw) as Record<string, { x: number; y: number }>
    nodes.forEach(node => {
      const position = cached[node.id]
      if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return
      node.x = position.x
      node.y = position.y
      node.vx = 0
      node.vy = 0
    })
  } catch {
    // Rendering must continue when localStorage is unavailable.
  }
}

const saveCachedPositions = () => {
  if (typeof window === 'undefined' || !graph) return

  try {
    const positions: Record<string, { x: number; y: number }> = {}
    graph.graphData().nodes.forEach((node: TradeForceNode) => {
      if (Number.isFinite(node.x) && Number.isFinite(node.y)) {
        positions[node.id] = { x: node.x!, y: node.y! }
      }
    })
    window.localStorage.setItem(getCacheKey(), JSON.stringify(positions))
  } catch {
    // Rendering must continue when localStorage is unavailable.
  }
}

const makeGraphData = () => {
  const nodes = props.nodes.map(node => ({
    ...node,
    x: node.graphPos?.x ?? node.x,
    y: node.graphPos?.y ?? node.y,
    vx: 0,
    vy: 0
  }))
  readCachedPositions(nodes)

  const nodeIds = new Set(nodes.map(node => node.id))
  const links = props.links
    .filter(link => nodeIds.has(String(link.source)) && nodeIds.has(String(link.target)))
    .map(link => ({ ...link, source: String(link.source), target: String(link.target) }))

  nodeDegreeMap = new Map<string, number>()
  links.forEach(link => {
    const sourceId = String(link.source)
    const targetId = String(link.target)
    nodeDegreeMap.set(sourceId, (nodeDegreeMap.get(sourceId) || 0) + 1)
    nodeDegreeMap.set(targetId, (nodeDegreeMap.get(targetId) || 0) + 1)
  })

  return { nodes, links }
}

const updateGraphData = () => {
  if (!graph) return
  const data = makeGraphData()
  graphDataSignature = `${props.cacheKey}|${data.nodes.map(node => node.id).sort().join(',')}|${data.links.map(link => `${link.kind}:${link.source}:${link.target}`).sort().join(',')}`
  graph.graphData(data)
  graph.d3ReheatSimulation()
  graph.centerAt(0, 0, 0)
  graph.zoom(4.4, 0)
  hoveredNodeId = null
  connectedNodeIds = new Set()
  emit('ready')
}

const setupGraph = () => {
  if (!graphRef.value || graph) return

  graph = new ForceGraph(graphRef.value)
    .backgroundColor('rgba(0,0,0,0)')
    .nodeId('id')
    .nodeVal((node: TradeForceNode) => node.isCore ? 16 : node.isScenario ? 10 : node.isNote ? 3 : 7)
    .nodeCanvasObject(paintNode)
    .nodeCanvasObjectMode(() => 'replace')
    .linkCanvasObject(paintLink)
    .linkCanvasObjectMode(() => 'replace')
    .enableNodeDrag(false)
    .minZoom(0.5)
    .maxZoom(12)
    .warmupTicks(80)
    .cooldownTicks(140)
    .d3AlphaDecay(0.045)
    .d3VelocityDecay(0.55)
    .onNodeClick((node: TradeForceNode, event: MouseEvent) => emit('node-click', { node, event }))
    .onNodeHover((node: TradeForceNode | null) => {
      hoveredNodeId = node?.id || null
      connectedNodeIds = new Set<string>()
      if (node) {
        props.links.forEach(link => {
          const source = String(link.source)
          const target = String(link.target)
          if (source === node.id) connectedNodeIds.add(target)
          if (target === node.id) connectedNodeIds.add(source)
        })
      }
      emit('node-hover', node)
    })
    .onEngineStop(() => saveCachedPositions())

  const chargeForce = graph.d3Force('charge')
  if (chargeForce && typeof chargeForce.strength === 'function') {
    chargeForce.strength(-18)
  }
  const linkForce = graph.d3Force('link')
  if (linkForce && typeof linkForce.distance === 'function') {
    linkForce.distance((link: TradeForceLink) => {
      if (link.kind === 'core') return 10
      if (link.kind === 'scenario') return 22
      if (link.kind === 'note') return 14
      return 30
    })
  }

  graph.d3Force('collide', forceCollide((node: TradeForceNode) => {
    return getNodeGraphRadius(node) + 1.8
  }).strength(1).iterations(4))

  updateGraphData()
}

watch(() => [props.nodes, props.links, props.cacheKey], () => {
  if (!graph) return
  updateGraphData()
}, { deep: true })

watch(() => props.isDark, () => graph?.resumeAnimation())

onMounted(async () => {
  await nextTick()
  setupGraph()
})

onUnmounted(() => {
  saveCachedPositions()
  graph?._destructor?.()
  graph = null
  graphDataSignature = ''
})
</script>

<style scoped>
:host,
div {
  contain: layout paint size;
}
</style>
