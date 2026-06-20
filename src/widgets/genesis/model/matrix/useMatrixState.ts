import { ref, computed, watch } from 'vue'
import { saveToDisk, loadFromDisk } from '@/shared/diskStorage'
import { useStrategyTradesStore } from '@/features/store/useStrategyTrades'
import { useAppBootStore } from '~/features/store/useAppBoot'
import { getMatrixStrategyName, isStrategyNode } from './useMatrixStrategies'
import { useMatrixChangeTree } from './useMatrixChangeTree'

export const STORAGE_KEY = 'genesis_matrix_v2'

export interface Point { x: number; y: number }
export interface Node {
  id: string
  label: string
  type: string
  x: number
  y: number
  color: string
  params: any
  isRoot?: boolean
  subGraph?: {
    nodes: Node[]
    connections: Connection[]
    zones: Zone[]
  }
}
export interface Connection {
  fromId: string
  toId: string
  fromPort?: 'left' | 'right' | 'top' | 'bottom'
  toPort?: 'left' | 'right' | 'top' | 'bottom'
  label?: string
  bundleId?: string
  bundleStemX?: number
  bundleStemY?: number
}
export interface Zone {
  id: string
  type: 'entry' | 'in-trade' | 'exit' | 'session'
  x: number
  y: number
  width: number
  height: number
  label: string
}
export interface MatrixPage {
  id: string
  name: string
  nodes: Node[]
  connections: Connection[]
  zones: Zone[]
  view?: {
    panX: number
    panY: number
    scale: number
  }
}

export interface MatrixStrategySnapshot {
  pages: MatrixPage[]
  activePageId: string | null
  events: any[]
  disabledChanges: string[]
  view: {
    panX: number
    panY: number
    scale: number
  }
  personalIndicators: any[]
}

export interface MatrixStrategyVersion {
  id: string
  label: string
  createdAt: number
  updatedAt: number
  snapshot: MatrixStrategySnapshot
}

export interface MatrixAnonymousVersion {
  id: 'anonymous'
  baseVersionId: string | null
  updatedAt: number
  hasChanges: boolean
  snapshot: MatrixStrategySnapshot
}

export type MenuCategory =
  | 'LOGIC'
  | 'METHODS'
  | 'DATA'
  | 'DOMAINS'
  | 'INDICATORS'
  | 'EMOTIONS'
  | 'STEPS'
  | 'SCALING'
  | 'RISK'
  | 'SYSTEM'
  | 'TEXT_FORMAT'
  | 'SCENARIO_DOCS'
  | 'SCENARIO_VISUALS'
  | 'SCENARIO_AUDIO'
  | 'LABELS'

// Singleton reactive state
const rootNodes = ref<Node[]>([])
const rootConnections = ref<Connection[]>([])
const rootZones = ref<Zone[]>([])
const matrixPages = ref<MatrixPage[]>([])
const activePageId = ref<string | null>(null)

const navigationStack = ref<string[]>([])
const savedScales = new Map<string, number>()

const viewState = ref({
  panX: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
  panY: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
  scale: 0.5,
  isPanning: false
})

const lastSelectedId = ref<string | null>(null)
const isCommentDragging = ref(false)
const activeDrawingNodeId = ref<string | null>(null)
const activeTextNodeId = ref<string | null>(null)
const activeMenuCategory = ref<MenuCategory | null>('LOGIC')
const activeEmotionTab = ref<'NEGATIVE' | 'POSITIVE' | 'NEUTRAL'>('NEGATIVE')
const personalIndicators = ref<any[]>([])
const updateKey = ref(0)
const pendingNodeConfig = ref<any | null>(null)
const strategyVersions = ref<MatrixStrategyVersion[]>([])
const selectedStrategyVersionId = ref<string | null>(null)
const anonymousStrategyVersion = ref<MatrixAnonymousVersion | null>(null)
const hasStrategyVersionChanges = ref(false)
let matrixPersistQueue: Promise<void> = Promise.resolve()

function createPageId() {
  return 'page-' + Math.random().toString(36).substr(2, 9)
}

function createMatrixPage(name = 'Strategy Page'): MatrixPage {
  return {
    id: createPageId(),
    name,
    nodes: [],
    connections: [],
    zones: [],
    view: {
      panX: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
      panY: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
      scale: 0.5
    }
  }
}

function normalizeNode(node: any): Node {
  return node?.type === 'system' ? { ...node, type: 'strategy' } : node
}

function getStrategyCount(nodes: Node[]) {
  return nodes.filter(isStrategyNode).length
}

export function useMatrixState() {
  const changeTree = useMatrixChangeTree()
  const forceUpdate = () => updateKey.value++
  const selectedStrategyVersion = computed(() => (
    strategyVersions.value.find(version => version.id === selectedStrategyVersionId.value) || null
  ))

  const cloneMatrixValue = <T>(value: T): T => {
    return JSON.parse(JSON.stringify(value))
  }

  function createActiveContainerAccess() {
    const contextNodeId = activeContextId.value
    if (contextNodeId) {
      const resolveContextNode = () => findNodeById(rootNodes.value, contextNodeId)
      const ensureContextGraph = () => {
        const contextNode = resolveContextNode()
        if (contextNode && !contextNode.subGraph) {
          contextNode.subGraph = { nodes: [], connections: [], zones: [] }
        }
        return contextNode?.subGraph
      }

      ensureContextGraph()
      return {
        getNodes: () => ensureContextGraph()?.nodes || [],
        setNodes: (nextNodes: Node[]) => {
          const graph = ensureContextGraph()
          if (graph) graph.nodes = nextNodes
        },
        getConnections: () => ensureContextGraph()?.connections || [],
        setConnections: (nextConnections: Connection[]) => {
          const graph = ensureContextGraph()
          if (graph) graph.connections = nextConnections
        }
      }
    }

    return {
      getNodes: () => rootNodes.value,
      setNodes: (nextNodes: Node[]) => { rootNodes.value = nextNodes },
      getConnections: () => rootConnections.value,
      setConnections: (nextConnections: Connection[]) => { rootConnections.value = nextConnections }
    }
  }

  function createNodeAddAction(node: Node, container = createActiveContainerAccess()) {
    return {
      undo: () => {
        container.setNodes(container.getNodes().filter(item => item.id !== node.id))
        container.setConnections(container.getConnections().filter(conn => conn.fromId !== node.id && conn.toId !== node.id))
        forceUpdate()
        saveMatrixData()
      },
      redo: () => {
        if (!container.getNodes().some(item => item.id === node.id)) {
          container.setNodes([...container.getNodes(), cloneMatrixValue(node)])
        }
        forceUpdate()
        saveMatrixData()
      }
    }
  }

  function createSnapshotAction(beforeNodes: Node[], beforeConnections: Connection[], afterNodes: Node[], afterConnections: Connection[], container = createActiveContainerAccess()) {
    const beforeNodeSnapshots = cloneMatrixValue(beforeNodes)
    const beforeConnectionSnapshots = cloneMatrixValue(beforeConnections)
    const afterNodeSnapshots = cloneMatrixValue(afterNodes)
    const afterConnectionSnapshots = cloneMatrixValue(afterConnections)
    return {
      undo: () => {
        container.setNodes(cloneMatrixValue(beforeNodeSnapshots))
        container.setConnections(cloneMatrixValue(beforeConnectionSnapshots))
        forceUpdate()
        saveMatrixData()
      },
      redo: () => {
        container.setNodes(cloneMatrixValue(afterNodeSnapshots))
        container.setConnections(cloneMatrixValue(afterConnectionSnapshots))
        forceUpdate()
        saveMatrixData()
      }
    }
  }

  function isLogicConnection(connection: Connection) {
    const label = connection.label?.toLowerCase()
    return !!connection.bundleId && (label === 'and' || label === 'or')
  }

  function collapseLogicChainAroundRemovedNode(nodeId: string, sourceConnections: Connection[], nextConnections: Connection[]) {
    const incomingLogic = sourceConnections.filter(conn => conn.toId === nodeId && isLogicConnection(conn))
    const outgoingLogic = sourceConnections.filter(conn => conn.fromId === nodeId && isLogicConnection(conn))
    if (!incomingLogic.length || !outgoingLogic.length) return nextConnections

    const existingKeys = new Set(nextConnections.map(conn => `${conn.fromId}->${conn.toId}`))
    const rewiredConnections: Connection[] = []

    incomingLogic.forEach(incoming => {
      outgoingLogic.forEach(outgoing => {
        const key = `${incoming.fromId}->${outgoing.toId}`
        if (incoming.fromId === outgoing.toId || existingKeys.has(key)) return
        existingKeys.add(key)
        rewiredConnections.push({
          ...cloneMatrixValue(outgoing),
          fromId: incoming.fromId,
          fromPort: incoming.fromPort,
          toPort: outgoing.toPort,
          label: outgoing.label || incoming.label,
          bundleId: outgoing.bundleId || incoming.bundleId,
          bundleStemX: outgoing.bundleStemX ?? incoming.bundleStemX,
          bundleStemY: outgoing.bundleStemY ?? incoming.bundleStemY
        })
      })
    })

    return [...nextConnections, ...rewiredConnections]
  }

  function createPlaceholderResolveAction(beforeNode: Node, afterNode: Node, container = createActiveContainerAccess()) {
    const targetId = beforeNode.id
    const afterSnapshot = cloneMatrixValue(afterNode)
    const afterConnectionSnapshots = cloneMatrixValue(container.getConnections().filter(conn => conn.fromId === targetId || conn.toId === targetId))
    const applySnapshot = (snapshot: Node) => {
      const nextNodes = container.getNodes().map(item =>
        item.id === snapshot.id ? cloneMatrixValue(snapshot) : item
      )
      if (!nextNodes.some(item => item.id === snapshot.id)) {
        nextNodes.push(cloneMatrixValue(snapshot))
      }
      const existingKeys = new Set(container.getConnections().map(conn => `${conn.fromId}->${conn.toId}`))
      const restoredConnections = afterConnectionSnapshots.filter(conn => !existingKeys.has(`${conn.fromId}->${conn.toId}`))
      if (restoredConnections.length) {
        container.setConnections([...container.getConnections(), ...cloneMatrixValue(restoredConnections)])
      }
      container.setNodes(nextNodes)
      forceUpdate()
      saveMatrixData()
    }
    const removeResolvedNode = () => {
      container.setNodes(container.getNodes().filter(item => item.id !== targetId))
      container.setConnections(container.getConnections().filter(conn => conn.fromId !== targetId && conn.toId !== targetId))
      forceUpdate()
      saveMatrixData()
    }

    return {
      undo: removeResolvedNode,
      redo: () => applySnapshot(afterSnapshot)
    }
  }

  const activePage = computed(() => (
    matrixPages.value.find(page => page.id === activePageId.value) || matrixPages.value[0] || null
  ))

  function syncActivePageFromRoot() {
    const page = activePage.value
    if (!page) return
    page.nodes = rootNodes.value
    page.connections = rootConnections.value
    page.zones = rootZones.value
    page.view = {
      panX: viewState.value.panX,
      panY: viewState.value.panY,
      scale: viewState.value.scale
    }
  }

  function applyPage(page: MatrixPage) {
    rootNodes.value = page.nodes
    rootConnections.value = page.connections
    rootZones.value = page.zones
    viewState.value.panX = page.view?.panX ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 400)
    viewState.value.panY = page.view?.panY ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 300)
    viewState.value.scale = page.view?.scale ?? 0.5
    navigationStack.value = []
    savedScales.clear()
    lastSelectedId.value = null
    activeMenuCategory.value = 'LOGIC'
    activeTextNodeId.value = null
  }

  function ensurePages() {
    if (matrixPages.value.length === 0) {
      const page = createMatrixPage('Strategy Page 1')
      matrixPages.value = [page]
      activePageId.value = page.id
      applyPage(page)
    } else if (!activePageId.value || !matrixPages.value.some(page => page.id === activePageId.value)) {
      activePageId.value = matrixPages.value[0]!.id
      applyPage(matrixPages.value[0]!)
    }
  }

  function switchMatrixPage(pageId: string) {
    const nextPage = matrixPages.value.find(page => page.id === pageId)
    if (!nextPage || nextPage.id === activePageId.value) return
    syncActivePageFromRoot()
    activePageId.value = nextPage.id
    applyPage(nextPage)
    saveMatrixData()
  }

  function addMatrixPage(name?: string) {
    syncActivePageFromRoot()
    const page = createMatrixPage(name || `Strategy Page ${matrixPages.value.length + 1}`)
    matrixPages.value.push(page)
    activePageId.value = page.id
    applyPage(page)
    saveMatrixData()
    return page
  }

  function removeMatrixPage(pageId: string) {
    syncActivePageFromRoot()
    const targetIndex = matrixPages.value.findIndex(page => page.id === pageId)
    if (targetIndex === -1) return

    matrixPages.value.splice(targetIndex, 1)

    if (matrixPages.value.length === 0) {
      activePageId.value = null
      ensurePages()
      saveMatrixData()
      return
    }

    const nextPage = matrixPages.value[Math.max(0, targetIndex - 1)] || matrixPages.value[0]!
    activePageId.value = nextPage.id
    applyPage(nextPage)
    saveMatrixData()
  }

  function currentPageHasStrategy() {
    return getStrategyCount(rootNodes.value) > 0
  }

  const handleNodeMoved = () => {
    forceUpdate()
    saveMatrixData()
  }

  const activeContextId = computed(() => navigationStack.value[navigationStack.value.length - 1] || null)

  const activeContextNode = computed(() => {
    if (!activeContextId.value) return null
    return findNodeById(rootNodes.value, activeContextId.value)
  })

  const isScenarioContext = computed(() => {
    return !!activeContextNode.value
  })

  // Viewport context getters/setters
  const nodes = computed<Node[]>({
    get: () => {
      if (activeContextId.value && activeContextNode.value) {
        return activeContextNode.value.subGraph?.nodes || []
      }
      return rootNodes.value
    },
    set: (val) => {
      if (activeContextId.value && activeContextNode.value) {
        if (!activeContextNode.value.subGraph) activeContextNode.value.subGraph = { nodes: [], connections: [], zones: [] }
        activeContextNode.value.subGraph.nodes = val
      } else {
        rootNodes.value = val
      }
    }
  })

  const connections = computed<Connection[]>({
    get: () => {
      if (activeContextId.value && activeContextNode.value) {
        return activeContextNode.value.subGraph?.connections || []
      }
      return rootConnections.value
    },
    set: (val) => {
      if (activeContextId.value && activeContextNode.value) {
        if (!activeContextNode.value.subGraph) activeContextNode.value.subGraph = { nodes: [], connections: [], zones: [] }
        activeContextNode.value.subGraph.connections = val
      } else {
        rootConnections.value = val
      }
    }
  })

  const zones = computed<Zone[]>({
    get: () => {
      if (activeContextId.value && activeContextNode.value) {
        return activeContextNode.value.subGraph?.zones || []
      }
      return rootZones.value
    },
    set: (val) => {
      if (activeContextId.value && activeContextNode.value) {
        if (!activeContextNode.value.subGraph) activeContextNode.value.subGraph = { nodes: [], connections: [], zones: [] }
        activeContextNode.value.subGraph.zones = val
      } else {
        rootZones.value = val
      }
    }
  })

  const shouldShowInitializePrompt = computed(() => (
    nodes.value.length === 0
  ))

  const bundleGroups = computed(() => {
    const groups: any[] = []
    const processed = new Set<string>()
    const parentSeen = new Set<string>()
    const visibleConnections = connections.value.filter(conn => (
      !!getNode(conn.fromId) && !!getNode(conn.toId)
    ))

    visibleConnections.forEach(conn => {
      if (conn.bundleId) {
        const key = conn.fromId + '_b_' + conn.bundleId
        if (processed.has(key)) return
        const siblings = visibleConnections.filter(c => c.fromId === conn.fromId && c.bundleId === conn.bundleId)
        groups.push({
          type: 'bundle',
          id: key,
          fromId: conn.fromId,
          bundleId: conn.bundleId,
          connections: siblings,
          isFirstForParent: !parentSeen.has(conn.fromId)
        })
        parentSeen.add(conn.fromId)
        processed.add(key)
      } else {
        const key = conn.fromId + '_s_' + conn.toId
        groups.push({
          type: 'simple',
          id: key,
          connection: conn
        })
        processed.add(key)
      }
    })
    return groups
  })

  const contentTransform = computed(() => ({
    transform: `translate(${viewState.value.panX}px, ${viewState.value.panY}px)`
  }))

  const effectiveSelectedNode = computed(() => {
    const node = lastSelectedId.value ? getNode(lastSelectedId.value) : null
    if (node?.type === 'placeholder') {
      const parentConn = connections.value.find(c => c.toId === node.id)
      return parentConn ? getNode(parentConn.fromId) : null
    }
    return node
  })

  const activeDrawingNode = computed(() => (
    activeDrawingNodeId.value ? findNodeById(rootNodes.value, activeDrawingNodeId.value) : null
  ))

  const activeTextNode = computed(() => (
    activeTextNodeId.value ? findNodeById(rootNodes.value, activeTextNodeId.value) : null
  ))

  const breadcrumbs = computed(() => {
    const list = navigationStack.value.map(id => {
      const node = findNodeById(rootNodes.value, id)
      return { id, label: node?.params?.customName || node?.label || 'SCENARIO' }
    })
    return [{ id: null, label: 'MAIN' }, ...list]
  })

  function getNode(id: string) {
    return nodes.value.find(node => node.id === id) || findNodeById(rootNodes.value, id)
  }

  function findNodeById(list: Node[], id: string): Node | null {
    for (const node of list) {
      if (node.id === id) return node
      if (node.subGraph) {
        const found = findNodeById(node.subGraph.nodes, id)
        if (found) return found
      }
    }
    return null
  }

  function navigateTo(newStack: string[]) {
    const currentPath = navigationStack.value.join('/')
    const nextPath = newStack.join('/')
    if (currentPath !== nextPath) {
      cleanupUnresolvedLogicPlaceholders()
    }

    const currentKey = navigationStack.value.join('/') || 'root'
    savedScales.set(currentKey, viewState.value.scale)
    
    navigationStack.value = newStack
    
    viewState.value.panX = 0
    viewState.value.panY = 0
    
    const newKey = newStack.join('/') || 'root'
    if (savedScales.has(newKey)) {
      viewState.value.scale = savedScales.get(newKey)!
    } else {
      viewState.value.scale = 1
    }
  }

  function goBack() {
    navigateTo(navigationStack.value.slice(0, -1))
  }

  function jumpTo(index: number | null) {
    if (index === null) {
      navigateTo([])
      return
    }
    navigateTo(navigationStack.value.slice(0, index + 1))
  }

  function selectNode(id: string | null) {
    lastSelectedId.value = id
    if (!id) {
      activeMenuCategory.value = null
      activeTextNodeId.value = null
      return
    }
    const node = getNode(id)
    
    if (node?.type === 'placeholder') {
      activeTextNodeId.value = null
      activeMenuCategory.value = isScenarioContext.value ? 'SCENARIO_DOCS' : 'INDICATORS'
    } else {
      if (node?.type !== 'text-panel') activeTextNodeId.value = null
      activeMenuCategory.value = getMenuCategoryForNode(node || null)
    }
  }

  function getMenuCategoryForNode(node: Node | null): MenuCategory | null {
    if (!node) return null
    if (isScenarioContext.value) {
      if (node.type === 'text-panel') {
        return activeTextNodeId.value === node.id ? 'TEXT_FORMAT' : 'SCENARIO_DOCS'
      }
      if (['checklist-panel', 'embed-panel', 'table-panel'].includes(node.type)) return 'SCENARIO_DOCS'
      if (['image', 'drawing-panel', 'file-attachment'].includes(node.type)) return 'SCENARIO_VISUALS'
      if (node.type === 'audio-note') return 'SCENARIO_AUDIO'
      return 'SCENARIO_DOCS'
    }
    if (node.type === 'text-panel') {
      return activeTextNodeId.value === node.id ? 'TEXT_FORMAT' : 'LABELS'
    }
    if (node.type === 'instrument') {
      return 'DATA'
    }
    if (node.type === 'condition' || node.type === 'indicator' || node.type === 'pattern' || node.type === 'smc') {
      return 'INDICATORS'
    } else if (node.type === 'emotion') {
      return 'EMOTIONS'
    } else if (node.type === 'emotion-state') {
      return null
    } else if (node.type === 'pyramiding' || node.type === 'averaging' || node.type === 'scaling-entry') {
      return 'SCALING'
    } else if (node.type === 'risk') {
      return 'RISK'
    }
    return 'LOGIC'
  }

  function addNode(typeOrConfig: any) {
    const config = typeof typeOrConfig === 'string' 
      ? { type: typeOrConfig, label: typeOrConfig.toUpperCase(), params: {} }
      : typeOrConfig;

    if (isStrategyNode(config)) {
      if (activeContextId.value) return
      if (currentPageHasStrategy()) {
        const nextPage = addMatrixPage(`Strategy Page ${matrixPages.value.length + 1}`)
        const newStrategyNode: Node = {
          id: 'node-' + Math.random().toString(36).substr(2, 9),
          label: config.label || 'Strategy',
          type: config.type || 'strategy',
          x: config.x !== undefined ? config.x : 100,
          y: config.y !== undefined ? config.y : 100,
          color: config.color || 'currentColor',
          params: config.params ? { ...config.params } : {},
          ...(config.subGraph ? { subGraph: config.subGraph } : {})
        }
        nextPage.nodes.push(newStrategyNode)
        applyPage(nextPage)
        selectNode(nextPage.nodes[0]?.id || null)
        changeTree.recordNodeAdded(newStrategyNode, createNodeAddAction(newStrategyNode))
        saveMatrixData()
        return
      }
    }
      
    const params = config.params ? { ...config.params } : {}
    if (config.description && !params.description) {
      params.description = config.description
    }

    const newNode: Node = {
      id: 'node-' + Math.random().toString(36).substr(2, 9),
      label: config.label || 'NODE',
      type: config.type || 'unknown',
      x: config.x !== undefined ? config.x : -viewState.value.panX / viewState.value.scale + 100,
      y: config.y !== undefined ? config.y : -viewState.value.panY / viewState.value.scale + 100,
      color: config.color || 'currentColor',
      params: params,
      ...(config.subGraph ? { subGraph: config.subGraph } : {})
    }
    
    if (activeContextId.value && activeContextNode.value) {
      if (!activeContextNode.value.subGraph) {
        activeContextNode.value.subGraph = { nodes: [], connections: [], zones: [] }
      }
      activeContextNode.value.subGraph.nodes.push(newNode)
    } else {
      rootNodes.value.push(newNode)
    }
    
    selectNode(newNode.id)
    changeTree.recordNodeAdded(newNode, createNodeAddAction(newNode), activeContextNode.value || undefined)
    saveMatrixData()
  }

  function setPendingNode(config: any) {
    pendingNodeConfig.value = config
    const nextConfig = typeof config === 'string' 
      ? { type: config, label: config.toUpperCase(), params: {} }
      : config;
    if (isStrategyNode(nextConfig) && currentPageHasStrategy()) {
      addMatrixPage(`Strategy Page ${matrixPages.value.length + 1}`)
    }

    if (lastSelectedId.value) {
      const container = createActiveContainerAccess()
      const selectedNode = container.getNodes().find(node => node.id === lastSelectedId.value)
      if (selectedNode && selectedNode.type === 'placeholder') {
        const beforeNode = cloneMatrixValue(selectedNode)
        const logicConnection = container.getConnections().find(conn => {
          const label = (conn.label || '').toLowerCase()
          return conn.toId === selectedNode.id && (label === 'and' || label === 'or')
        })

        selectedNode.type = nextConfig.type || 'unknown'
        selectedNode.label = nextConfig.label || 'NODE'
        selectedNode.color = nextConfig.color || 'currentColor'
        selectedNode.params = { ...(selectedNode.params || {}), ...(nextConfig.params || {}) }
        if (nextConfig.description) {
          selectedNode.params.description = nextConfig.description
        }

        const afterNode = cloneMatrixValue(selectedNode)
        const resolveAction = createPlaceholderResolveAction(beforeNode, afterNode, container)
        if (logicConnection) {
          changeTree.recordLogicPlaceholderNodeAdded(afterNode, logicConnection, resolveAction)
        } else {
          changeTree.recordNodeAdded(afterNode, resolveAction, activeContextNode.value || undefined)
        }

        resolveAction.redo()
        selectNode(selectedNode.id)
        forceUpdate()
        saveMatrixData()
        return
      }
    }

    pendingNodeConfig.value = nextConfig
  }

  function removeNode(id: string) {
    const nodeToRemove = getNode(id)
    const container = createActiveContainerAccess()
    const beforeNodes = cloneMatrixValue(container.getNodes())
    const beforeConnections = cloneMatrixValue(container.getConnections())
    if (nodeToRemove?.type === 'condition' && activeMenuCategory.value === 'INDICATORS') {
      activeMenuCategory.value = null
    }
    if (lastSelectedId.value === id) {
      lastSelectedId.value = null
      activeMenuCategory.value = null
    }

    const nextNodes = container.getNodes().filter(n => n.id !== id)
    const nextConnections = collapseLogicChainAroundRemovedNode(
      id,
      container.getConnections(),
      container.getConnections().filter(c => c.fromId !== id && c.toId !== id)
    )
    container.setNodes(nextNodes)
    container.setConnections(nextConnections)
    cleanupLogicBundles()
    const deleteAction = nodeToRemove
      ? createSnapshotAction(beforeNodes, beforeConnections, container.getNodes(), container.getConnections(), container)
      : undefined
    if (nodeToRemove) changeTree.recordNodeDeleted(nodeToRemove, deleteAction, activeContextNode.value || undefined)
    saveMatrixData()
  }

  function clearNodeInputConnections(node: Node) {
    if (activeContextId.value && activeContextNode.value?.subGraph) {
      activeContextNode.value.subGraph.connections = activeContextNode.value.subGraph.connections.filter(c => c.toId !== node.id)
    } else {
      rootConnections.value = rootConnections.value.filter(c => c.toId !== node.id)
    }
    cleanupLogicBundles()
    saveMatrixData()
  }

  function clearNodeOutputConnections(node: Node) {
    if (activeContextId.value && activeContextNode.value?.subGraph) {
      activeContextNode.value.subGraph.connections = activeContextNode.value.subGraph.connections.filter(c => c.fromId !== node.id)
    } else {
      rootConnections.value = rootConnections.value.filter(c => c.fromId !== node.id)
    }
    cleanupLogicBundles()
    saveMatrixData()
  }

  function cleanupLogicBundles(container = createActiveContainerAccess()) {
    const bundles = new Map<string, Connection[]>()
    
    container.getConnections().forEach(c => {
      if (c.bundleId) {
        const key = `${c.fromId}_${c.bundleId}`
        if (!bundles.has(key)) bundles.set(key, [])
        bundles.get(key)!.push(c)
      }
    })
    
    bundles.forEach((conns) => {
      conns.forEach(c => {
        const label = c.label?.toLowerCase()
        if (label === 'and' || label === 'or') return
        delete c.bundleId
        delete c.bundleStemX
        delete c.bundleStemY
      })
    })
    forceUpdate()
  }

  function cleanupUnresolvedLogicPlaceholdersInContainer(
    containerNodes: Node[],
    containerConnections: Connection[]
  ): { nodes: Node[], connections: Connection[], changed: boolean } {
    let changed = false
    const placeholderIds = new Set(containerNodes.filter(node => node.type === 'placeholder').map(node => node.id))
    const unresolvedPlaceholderIds = new Set<string>()
    const affectedBundleKeys = new Set<string>()

    containerConnections.forEach(connection => {
      const label = connection.label?.toLowerCase()
      if (!connection.bundleId || (label !== 'and' && label !== 'or') || !placeholderIds.has(connection.toId)) return
      unresolvedPlaceholderIds.add(connection.toId)
      affectedBundleKeys.add(`${connection.fromId}_${connection.bundleId}`)
      changeTree.removeLatestConnectionLabelChange(connection.bundleId)
    })

    let nextNodes = containerNodes
    let nextConnections = containerConnections

    if (unresolvedPlaceholderIds.size) {
      changed = true
      nextNodes = containerNodes.filter(node => !unresolvedPlaceholderIds.has(node.id))
      nextConnections = containerConnections.filter(connection => (
        !unresolvedPlaceholderIds.has(connection.fromId) &&
        !unresolvedPlaceholderIds.has(connection.toId)
      ))

      affectedBundleKeys.forEach(bundleKey => {
        const bundleConnections = nextConnections.filter(connection => (
          connection.bundleId &&
          `${connection.fromId}_${connection.bundleId}` === bundleKey
        ))
        if (bundleConnections.length > 1) return

        bundleConnections.forEach(connection => {
          delete connection.label
          delete connection.bundleId
          delete connection.bundleStemX
          delete connection.bundleStemY
        })
      })
    }

    nextNodes.forEach(node => {
      if (!node.subGraph) return
      const result = cleanupUnresolvedLogicPlaceholdersInContainer(
        node.subGraph.nodes || [],
        node.subGraph.connections || []
      )
      if (!result.changed) return
      changed = true
      node.subGraph.nodes = result.nodes
      node.subGraph.connections = result.connections
    })

    return { nodes: nextNodes, connections: nextConnections, changed }
  }

  function cleanupUnresolvedLogicPlaceholders() {
    syncActivePageFromRoot()

    let changed = false
    matrixPages.value.forEach(page => {
      const result = cleanupUnresolvedLogicPlaceholdersInContainer(page.nodes, page.connections)
      if (!result.changed) return
      changed = true
      page.nodes = result.nodes
      page.connections = result.connections
    })

    if (!changed) return false

    const page = activePage.value
    if (page) {
      rootNodes.value = page.nodes
      rootConnections.value = page.connections
      rootZones.value = page.zones
    }

    forceUpdate()
    saveMatrixData()
    return true
  }

  function clearBoard() {
    const strategyTradesStore = useStrategyTradesStore()
    strategyTradesStore.purgeAllStrategies()
    const snapshot = {
      rootNodes: cloneMatrixValue(rootNodes.value),
      rootConnections: cloneMatrixValue(rootConnections.value),
      rootZones: cloneMatrixValue(rootZones.value),
      matrixPages: cloneMatrixValue(matrixPages.value),
      activePageId: activePageId.value
    }

    rootNodes.value = []
    rootConnections.value = []
    rootZones.value = []
    matrixPages.value = []
    activePageId.value = null
    ensurePages()
    navigationStack.value = []
    savedScales.clear()
    lastSelectedId.value = null
    changeTree.resetChanges()
    strategyVersions.value = []
    selectedStrategyVersionId.value = null
    anonymousStrategyVersion.value = null
    hasStrategyVersionChanges.value = false
    saveMatrixData()
  }

  function mergeNodes(indicatorId: string, configId: string) {
    // Config logic removed
  }

  function refreshMergeStatus() {
    // Config logic removed
  }

  const buildLogicalStructure = (parentId: string, allNodes: any[], allConnections: any[]) => {
    const conns = allConnections.filter(c => c.fromId === parentId)
    const bundles: Record<string, any> = {}
    const structure: any[] = []

    conns.forEach(c => {
      const toNode = allNodes.find(n => n.id === c.toId)
      if (!toNode || toNode.type === 'placeholder') return

      if (c.bundleId) {
        if (!bundles[c.bundleId]) {
          bundles[c.bundleId] = { 
            id: c.bundleId, 
            type: 'bundle', 
            logic: (c.label || 'AND').toUpperCase(), 
            nodeIds: [] 
          }
          structure.push(bundles[c.bundleId])
        }
        bundles[c.bundleId].nodeIds.push(toNode.id)
      } else {
        structure.push({ 
          id: toNode.id, 
          type: 'single' 
        })
      }
    })
    return structure
  }

  const processNodeTree = (node: any, allNodes: any[], allConnections: any[]): any => {
    const structure = buildLogicalStructure(node.id, allNodes, allConnections)
    const processedNode = {
      ...node,
      params: {
        ...node.params,
        logicalStructure: structure
      }
    }

    if (node.subGraph?.nodes) {
      processedNode.subGraph = {
        ...node.subGraph,
        nodes: node.subGraph.nodes
          .map((childNode: any) => processNodeTree(childNode, node.subGraph.nodes, node.subGraph.connections || []))
          .filter((childNode: any) => childNode.type !== 'placeholder'),
        connections: [...(node.subGraph.connections || [])],
        zones: [...(node.subGraph.zones || [])]
      }
    }

    return processedNode
  }

  function makePageName(index: number, strategy?: Node) {
    const strategyName = strategy ? getMatrixStrategyName(strategy) : ''
    return strategyName && strategyName !== 'Strategy'
      ? strategyName
      : `Strategy Page ${index + 1}`
  }

  function splitLegacyDataIntoPages(saved: any): MatrixPage[] {
    const savedNodes = (saved.nodes || []).map(normalizeNode)
    const savedConnections = saved.connections || []
    const savedZones = saved.zones || []
    const strategyNodes = savedNodes.filter(isStrategyNode)

    if (strategyNodes.length <= 1) {
      return [{
        id: 'page-main',
        name: makePageName(0, strategyNodes[0]),
        nodes: savedNodes,
        connections: savedConnections,
        zones: savedZones,
        view: saved.view
      }]
    }

    const assignedNodeIds = new Set<string>()
    const pages = strategyNodes.map((strategy: Node, index: number) => {
      const pageNodeIds = new Set<string>([strategy.id])
      const queue = [strategy.id]

      while (queue.length > 0) {
        const currentId = queue.shift()!
        savedConnections.forEach((connection: Connection) => {
          const nextId = connection.fromId === currentId
            ? connection.toId
            : connection.toId === currentId
              ? connection.fromId
              : null
          if (!nextId || pageNodeIds.has(nextId)) return
          const nextNode = savedNodes.find((node: Node) => node.id === nextId)
          if (!nextNode || (isStrategyNode(nextNode) && nextNode.id !== strategy.id)) return
          pageNodeIds.add(nextId)
          queue.push(nextId)
        })
      }

      pageNodeIds.forEach(id => assignedNodeIds.add(id))

      const pageNodes = savedNodes.filter((node: Node) => pageNodeIds.has(node.id))
      const pageConnections = savedConnections.filter((connection: Connection) => (
        pageNodeIds.has(connection.fromId) && pageNodeIds.has(connection.toId)
      ))
      const pageZones = savedZones.filter((zone: Zone) => pageNodes.some((node: Node) => (
        node.x >= zone.x &&
        node.x <= zone.x + zone.width &&
        node.y >= zone.y &&
        node.y <= zone.y + zone.height
      )))

      return {
        id: `page-${strategy.id}`,
        name: makePageName(index, strategy),
        nodes: pageNodes,
        connections: pageConnections,
        zones: pageZones,
        view: index === 0 ? saved.view : undefined
      }
    })

    const unassignedNodes = savedNodes.filter((node: Node) => !assignedNodeIds.has(node.id))
    if (unassignedNodes.length > 0 && pages[0]) {
      const firstPageNodeIds = new Set(pages[0].nodes.map((node: Node) => node.id))
      unassignedNodes.forEach((node: Node) => {
        pages[0]!.nodes.push(node)
        firstPageNodeIds.add(node.id)
      })
      pages[0].connections = savedConnections.filter((connection: Connection) => (
        firstPageNodeIds.has(connection.fromId) && firstPageNodeIds.has(connection.toId)
      ))
      pages[0].zones = savedZones
    }

    return pages
  }

  function normalizeSavedPages(saved: any): MatrixPage[] {
    if (Array.isArray(saved.pages) && saved.pages.length > 0) {
      return saved.pages.flatMap((page: any, index: number) => {
        const pageNodes = (page.nodes || []).map(normalizeNode)
        if (getStrategyCount(pageNodes) > 1) {
          return splitLegacyDataIntoPages({
            nodes: pageNodes,
            connections: page.connections || [],
            zones: page.zones || [],
            view: page.view
          }).map((splitPage, splitIndex) => ({
            ...splitPage,
            id: `${page.id || `page-${index + 1}`}-${splitPage.id}`,
            name: splitPage.name || `${page.name || `Strategy Page ${index + 1}`} ${splitIndex + 1}`
          }))
        }
        const strategy = pageNodes.find(isStrategyNode)
        return [{
          id: page.id || createPageId(),
          name: page.name || makePageName(index, strategy),
          nodes: pageNodes,
          connections: page.connections || [],
          zones: page.zones || [],
          view: page.view
        }]
      })
    }

    return splitLegacyDataIntoPages(saved)
  }

  function buildPersistedPages() {
    syncActivePageFromRoot()
    return matrixPages.value.map(page => ({
      ...page,
      nodes: page.nodes
        .map(node => processNodeTree(node, page.nodes, page.connections))
        .filter(node => node.type !== 'placeholder'),
      connections: page.connections,
      zones: page.zones
    }))
  }

  function captureStrategySnapshot(processedPages = buildPersistedPages()): MatrixStrategySnapshot {
    return cloneMatrixValue({
      pages: processedPages,
      activePageId: activePageId.value,
      events: changeTree.events.value,
      disabledChanges: Array.from(changeTree.disabledChanges.value),
      view: {
        panX: viewState.value.panX,
        panY: viewState.value.panY,
        scale: viewState.value.scale
      },
      personalIndicators: personalIndicators.value
    })
  }

  function canonicalStrategySnapshot(snapshot: MatrixStrategySnapshot) {
    const canonical = cloneMatrixValue(snapshot) as any
    delete canonical.activePageId
    delete canonical.view

    const normalizeNodeForComparison = (node: any) => {
      delete node.x
      delete node.y
      if (node.params) {
        delete node.params.isEditingName
        delete node.params.isEditingDescription
        delete node.params.logicalStructure
      }
      node.subGraph?.nodes?.forEach(normalizeNodeForComparison)
      node.subGraph?.connections?.forEach((connection: any) => {
        delete connection.bundleStemX
        delete connection.bundleStemY
      })
      node.subGraph?.zones?.forEach((zone: any) => {
        delete zone.x
        delete zone.y
        delete zone.width
        delete zone.height
      })
    }

    canonical.pages?.forEach((page: any) => {
      delete page.view
      page.nodes?.forEach(normalizeNodeForComparison)
      page.connections?.forEach((connection: any) => {
        delete connection.bundleStemX
        delete connection.bundleStemY
      })
      page.zones?.forEach((zone: any) => {
        delete zone.x
        delete zone.y
        delete zone.width
        delete zone.height
      })
    })

    canonical.events?.forEach((event: any) => delete event.createdAt)
    return canonical
  }

  function strategySnapshotsMatch(left: MatrixStrategySnapshot, right: MatrixStrategySnapshot) {
    return JSON.stringify(canonicalStrategySnapshot(left)) === JSON.stringify(canonicalStrategySnapshot(right))
  }

  function refreshAnonymousStrategyVersion(snapshot = captureStrategySnapshot()) {
    const selectedVersion = selectedStrategyVersion.value
    const hasChanges = !!selectedVersion && !strategySnapshotsMatch(snapshot, selectedVersion.snapshot)
    hasStrategyVersionChanges.value = hasChanges
    anonymousStrategyVersion.value = {
      id: 'anonymous',
      baseVersionId: selectedVersion?.id || null,
      updatedAt: Date.now(),
      hasChanges,
      snapshot: cloneMatrixValue(snapshot)
    }
  }

  function applyStrategySnapshot(snapshot: MatrixStrategySnapshot) {
    matrixPages.value = normalizeSavedPages({ pages: cloneMatrixValue(snapshot.pages) })
    activePageId.value = snapshot.activePageId && matrixPages.value.some(page => page.id === snapshot.activePageId)
      ? snapshot.activePageId
      : matrixPages.value[0]?.id || null
    ensurePages()
    if (activePage.value) applyPage(activePage.value)
    if (snapshot.view) {
      viewState.value.panX = snapshot.view.panX
      viewState.value.panY = snapshot.view.panY
      viewState.value.scale = snapshot.view.scale
    }
    personalIndicators.value = cloneMatrixValue(snapshot.personalIndicators || [])
    changeTree.events.value = cloneMatrixValue(snapshot.events || [])
    changeTree.disabledChanges.value = new Set(snapshot.disabledChanges || [])
    navigationStack.value = []
    lastSelectedId.value = null
    forceUpdate()
  }

  async function createStrategyVersion() {
    const versionNumber = strategyVersions.value.reduce((highest, version) => {
      const match = version.label.match(/v(\d+)$/i)
      return Math.max(highest, match ? Number(match[1]) : 0)
    }, 0) + 1
    const label = `Strategy v${versionNumber}`
    changeTree.clearStrategyVersionCheckpoints()
    changeTree.recordStrategyVersionCreated(label)
    const snapshot = captureStrategySnapshot()
    const now = Date.now()
    const version: MatrixStrategyVersion = {
      id: `strategy-version-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      label,
      createdAt: now,
      updatedAt: now,
      snapshot
    }
    strategyVersions.value = [...strategyVersions.value, version]
    selectedStrategyVersionId.value = version.id
    refreshAnonymousStrategyVersion(snapshot)
    await saveMatrixData(true)
  }

  async function updateSelectedStrategyVersion() {
    const selectedId = selectedStrategyVersionId.value
    const versionIndex = strategyVersions.value.findIndex(version => version.id === selectedId)
    if (versionIndex === -1) return
    const currentVersion = strategyVersions.value[versionIndex]!
    changeTree.recordStrategyVersionUpdated(currentVersion.label)
    const snapshot = captureStrategySnapshot()
    strategyVersions.value[versionIndex] = {
      ...currentVersion,
      updatedAt: Date.now(),
      snapshot
    }
    strategyVersions.value = [...strategyVersions.value]
    refreshAnonymousStrategyVersion(snapshot)
    await saveMatrixData(true)
  }

  async function clearStrategyVersionChanges() {
    const version = selectedStrategyVersion.value
    if (!version) return
    applyStrategySnapshot(version.snapshot)
    refreshAnonymousStrategyVersion(version.snapshot)
    await saveMatrixData(true)
  }

  async function selectStrategyVersion(versionId: string) {
    const version = strategyVersions.value.find(item => item.id === versionId)
    if (!version) return
    selectedStrategyVersionId.value = version.id
    applyStrategySnapshot(version.snapshot)
    refreshAnonymousStrategyVersion(version.snapshot)
    await saveMatrixData(true)
  }

  async function removeStrategyVersion(versionId: string) {
    const versionIndex = strategyVersions.value.findIndex(version => version.id === versionId)
    if (versionIndex === -1) return

    const wasSelected = selectedStrategyVersionId.value === versionId
    strategyVersions.value = strategyVersions.value.filter(version => version.id !== versionId)

    if (wasSelected && strategyVersions.value.length) {
      const fallbackVersion = strategyVersions.value[strategyVersions.value.length - 1]!
      selectedStrategyVersionId.value = fallbackVersion.id
      applyStrategySnapshot(fallbackVersion.snapshot)
      refreshAnonymousStrategyVersion(fallbackVersion.snapshot)
    } else if (wasSelected) {
      selectedStrategyVersionId.value = null
      changeTree.clearStrategyVersionCheckpoints()
      refreshAnonymousStrategyVersion(captureStrategySnapshot())
    } else {
      refreshAnonymousStrategyVersion(captureStrategySnapshot())
    }

    await saveMatrixData(true)
  }

  let saveTimeout: any = null
  const persistMatrixData = async () => {
    const processedPages = buildPersistedPages()
    const currentSnapshot = captureStrategySnapshot(processedPages)
    refreshAnonymousStrategyVersion(currentSnapshot)

    const data = {
      pages: processedPages,
      activePageId: activePageId.value,
      nodes: processedPages.flatMap(page => page.nodes),
      connections: processedPages.flatMap(page => page.connections),
      zones: processedPages.flatMap(page => page.zones),
      events: currentSnapshot.events,
      disabledChanges: currentSnapshot.disabledChanges,
      view: {
        panX: viewState.value.panX,
        panY: viewState.value.panY,
        scale: viewState.value.scale
      },
      personalIndicators: personalIndicators.value,
      strategyVersioning: {
        schemaVersion: 1,
        selectedVersionId: selectedStrategyVersionId.value,
        versions: cloneMatrixValue(strategyVersions.value),
        anonymous: cloneMatrixValue(anonymousStrategyVersion.value)
      }
    }
    const appBootStore = useAppBootStore()
    appBootStore.genesisMatrixCache = data
    matrixPersistQueue = matrixPersistQueue
      .catch(() => undefined)
      .then(() => saveToDisk(STORAGE_KEY, data))
    await matrixPersistQueue
  }

  const saveMatrixData = async (immediate = false) => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = null
    if (immediate) {
      await persistMatrixData()
      return
    }
    saveTimeout = setTimeout(() => {
      saveTimeout = null
      void persistMatrixData()
    }, 1000)
  }

  const restoreData = async () => {
    try {
      const appBootStore = useAppBootStore()
      const saved = appBootStore.genesisMatrixCache || await loadFromDisk<any>(STORAGE_KEY)
      if (saved && ((Array.isArray(saved.pages) && saved.pages.length > 0) || saved.nodes?.length > 0)) {
        matrixPages.value = normalizeSavedPages(saved)
        activePageId.value = saved.activePageId && matrixPages.value.some(page => page.id === saved.activePageId)
          ? saved.activePageId
          : matrixPages.value[0]?.id || null
        ensurePages()
        if (activePage.value) applyPage(activePage.value)
        
        if (saved.view) {
          viewState.value.panX = saved.view.panX ?? viewState.value.panX
          viewState.value.panY = saved.view.panY ?? viewState.value.panY
          viewState.value.scale = saved.view.scale ?? viewState.value.scale
        }
        if (saved.events && Array.isArray(saved.events)) {
          const sanitizeSubs = (subs: any[]): any[] => (subs || []).map((s: any) => ({ ...s, subchanges: sanitizeSubs(s.subchanges) }))
          changeTree.events.value = saved.events.map((ev: any) => ({ ...ev, subchanges: sanitizeSubs(ev.subchanges) }))
        } else {
          changeTree.events.value = []
        }
        if (saved.disabledChanges && Array.isArray(saved.disabledChanges)) {
          changeTree.disabledChanges.value = new Set(saved.disabledChanges)
        } else {
          changeTree.disabledChanges.value = new Set()
        }
        const savedVersioning = saved.strategyVersioning
        if (savedVersioning?.schemaVersion === 1 && Array.isArray(savedVersioning.versions)) {
          strategyVersions.value = savedVersioning.versions
            .filter((version: any) => version?.id && version?.snapshot?.pages)
            .map((version: any) => ({
              id: String(version.id),
              label: String(version.label || 'Strategy Version'),
              createdAt: Number(version.createdAt) || Date.now(),
              updatedAt: Number(version.updatedAt) || Number(version.createdAt) || Date.now(),
              snapshot: {
                pages: normalizeSavedPages({ pages: version.snapshot.pages }),
                activePageId: version.snapshot.activePageId || null,
                events: cloneMatrixValue(version.snapshot.events || []),
                disabledChanges: [...(version.snapshot.disabledChanges || [])],
                view: cloneMatrixValue(version.snapshot.view || saved.view || {
                  panX: 0,
                  panY: 0,
                  scale: 0.5
                }),
                personalIndicators: cloneMatrixValue(version.snapshot.personalIndicators || saved.personalIndicators || [])
              }
            }))
          selectedStrategyVersionId.value = strategyVersions.value.some(
            version => version.id === savedVersioning.selectedVersionId
          ) ? savedVersioning.selectedVersionId : null
          anonymousStrategyVersion.value = savedVersioning.anonymous || null
        } else {
          strategyVersions.value = []
          selectedStrategyVersionId.value = null
          anonymousStrategyVersion.value = null
        }
        if (saved.personalIndicators) {
          personalIndicators.value = saved.personalIndicators
        }
        applyTreeStateToMatrix(changeTree.disabledChanges.value)
        refreshAnonymousStrategyVersion(captureStrategySnapshot())
      } else {
        throw new Error('No saved nodes found')
      }
    } catch (err) {
      console.warn('[GenesisPersistence] fallback:', err)
      matrixPages.value = []
      activePageId.value = null
      strategyVersions.value = []
      selectedStrategyVersionId.value = null
      anonymousStrategyVersion.value = null
      hasStrategyVersionChanges.value = false
      ensurePages()
    }
  }

  function applyTreeStateToMatrix(next: Set<string>) {
    const activeNodeIdentities = changeTree.syncNodeIdentityLabels(next)
    activeNodeIdentities.forEach((identity: any, nodeId: any) => {
      const node = getNode(nodeId)
      if (!node) return
      if (!node.params) node.params = {}
      node.params.customName = identity
    })

    const nodeHolderStates = new Map<string, {
      fallbackPosition?: { x: number, y: number }
      activePosition?: { x: number, y: number }
    }>()

    changeTree.events.value.forEach(event => {
      if (event.targetKind !== 'domain' || event.type !== 'add') return
      const isEventEnabled = !next.has(event.id)

      event.subchanges.forEach(subchange => {
        if (subchange.label !== 'NODES_HOLDER' || !subchange.subchanges?.length) return
        const isHolderEnabled = isEventEnabled && !next.has(subchange.id)

        subchange.subchanges.forEach((nodeChange: any) => {
          if (nodeChange.label !== 'add' && nodeChange.label !== 'remove') return
          if (!nodeChange.targetId) return

          const isNodeChangeEnabled = isHolderEnabled && !next.has(nodeChange.id)
          const state = nodeHolderStates.get(nodeChange.targetId) || {}

          if (!state.fallbackPosition && nodeChange.payload?.fromPosition) {
            state.fallbackPosition = {
              x: nodeChange.payload.fromPosition.x,
              y: nodeChange.payload.fromPosition.y
            }
          }

          if (isNodeChangeEnabled && nodeChange.payload?.toPosition) {
            state.activePosition = {
              x: nodeChange.payload.toPosition.x,
              y: nodeChange.payload.toPosition.y
            }
          }

          nodeHolderStates.set(nodeChange.targetId, state)
        })
      })
    })

    nodeHolderStates.forEach((holderState, nodeId) => {
      const position = holderState.activePosition || holderState.fallbackPosition
      if (!position) return
      const node = getNode(nodeId)
      if (!node) return
      node.x = position.x
      node.y = position.y
    })

    const getNodeContentReplay = (nodeId: string, label: string) => {
      let firstChange: any = undefined
      let lastActiveChange: any = undefined

      changeTree.events.value.forEach(event => {
        if (event.targetKind !== 'node' || !event.targetId) return

        const visit = (subchanges: any[], scopedNodeId: string, parentEnabled: boolean) => {
          subchanges.forEach(subchange => {
            const isEnabled = parentEnabled && !next.has(subchange.id)
            const nextNodeId = subchange.label === 'ADD_NODE' && subchange.targetId
              ? subchange.targetId
              : scopedNodeId

            if (nextNodeId === nodeId && subchange.label === label) {
              if (!firstChange) firstChange = subchange
              if (isEnabled) lastActiveChange = subchange
            }
            if (subchange.subchanges?.length) {
              visit(subchange.subchanges, nextNodeId, isEnabled)
            }
          })
        }

        visit(event.subchanges, event.targetId, !next.has(event.id))
      })

      return { firstChange, lastActiveChange }
    }

    const applyContentReplay = (node: Node) => {
      if (!node.params) node.params = {}

      if (node.type === 'text-panel') {
        const { firstChange, lastActiveChange } = getNodeContentReplay(node.id, 'text')
        if (firstChange) {
          const source = lastActiveChange?.payload
            ? lastActiveChange.payload
            : firstChange.payload
          node.params.html = lastActiveChange
            ? String(source?.nextHtml ?? node.params.html ?? '')
            : String(source?.previousHtml ?? '')
          node.params.value = lastActiveChange
            ? String(source?.nextValue ?? lastActiveChange.value ?? '')
            : String(source?.previousValue ?? '')
        }
      } else if (node.type === 'embed-panel') {
        const { firstChange, lastActiveChange } = getNodeContentReplay(node.id, 'url')
        if (firstChange) {
          node.params.embedUrl = lastActiveChange
            ? String(lastActiveChange.payload?.nextValue ?? lastActiveChange.value ?? '')
            : String(firstChange.payload?.previousValue ?? '')
        }
      } else if (node.type === 'table-panel') {
        const { firstChange, lastActiveChange } = getNodeContentReplay(node.id, 'table')
        const snapshot = lastActiveChange?.payload?.nextSnapshot || firstChange?.payload?.previousSnapshot
        if (snapshot) {
          node.params.rows = snapshot.rows
          node.params.cols = snapshot.cols
          node.params.table = cloneMatrixValue(snapshot.table)
        }
      }

      node.subGraph?.nodes?.forEach(applyContentReplay)
    }

    rootNodes.value.forEach(applyContentReplay)

    zones.value.forEach(zone => {
      const event = changeTree.events.value.find(
        e => e.targetKind === 'domain' && e.targetId === zone.id && e.type === 'add'
      )
      if (event) {
        let activeValue: string | null = null

        if (!next.has(event.id)) {
          const changerSub = event.subchanges.find(s => s.label === 'SESSION_CHANGER' || s.label === 'TYPE_CHANGER' || s.label === 'TYPE/SESSION_CHANGER')
          let lastActiveTo: any = undefined
          if (changerSub && changerSub.subchanges) {
            for (const sub of changerSub.subchanges) {
              if (sub.label === 'to' && !next.has(sub.id)) {
                lastActiveTo = sub
              }
            }
          }
          
          if (lastActiveTo) {
            activeValue = lastActiveTo.value
          } else {
            const initialSub = event.subchanges.find(
              s => s.label === 'session' || s.label === 'domain'
            )
            if (initialSub) {
              activeValue = initialSub.value
            }
          }
        }

        if (activeValue) {
          const val = activeValue.toLowerCase()
          if (['entry', 'in-trade', 'exit'].includes(val)) {
            zone.type = val as any
            zone.label = `SECTOR_${activeValue.toUpperCase()}`
          } else {
            zone.type = 'session'
            zone.label = activeValue
          }
        }
      }
    })

    forceUpdate()
    saveMatrixData()
  }

  // Set up standard watchers
  watch([rootNodes, rootConnections, rootZones, personalIndicators], () => {
    saveMatrixData()
  }, { deep: true })

  watch(changeTree.events, () => {
    void saveMatrixData(true)
  }, { deep: true })

  watch(() => Array.from(changeTree.disabledChanges.value), () => {
    void saveMatrixData(true)
  })

  watch([() => viewState.value.panX, () => viewState.value.panY, () => viewState.value.scale], () => {
    if (isScenarioContext.value && viewState.value.scale !== 1) {
      viewState.value.scale = 1
      return
    }
    saveMatrixData()
  })

  return {
    rootNodes,
    rootConnections,
    rootZones,
    createActiveContainerAccess,
    matrixPages,
    activePageId,
    navigationStack,
    viewState,
    lastSelectedId,
    isCommentDragging,
    activeDrawingNodeId,
    activeTextNodeId,
    activeMenuCategory,
    activeEmotionTab,
    personalIndicators,
    pendingNodeConfig,
    strategyVersions,
    selectedStrategyVersionId,
    selectedStrategyVersion,
    anonymousStrategyVersion,
    hasStrategyVersionChanges,
    updateKey,
    forceUpdate,
    handleNodeMoved,
    activeContextId,
    activeContextNode,
    activePage,
    isScenarioContext,
    nodes,
    connections,
    zones,
    shouldShowInitializePrompt,
    bundleGroups,
    contentTransform,
    effectiveSelectedNode,
    activeDrawingNode,
    activeTextNode,
    breadcrumbs,
    getNode,
    findNodeById,
    navigateTo,
    goBack,
    jumpTo,
    switchMatrixPage,
    addMatrixPage,
    removeMatrixPage,
    currentPageHasStrategy,
    selectNode,
    getMenuCategoryForNode,
    addNode,
    setPendingNode,
    removeNode,
    clearNodeInputConnections,
    clearNodeOutputConnections,
    cleanupLogicBundles,
    cleanupUnresolvedLogicPlaceholders,
    clearBoard,
    mergeNodes,
    refreshMergeStatus,
    createStrategyVersion,
    updateSelectedStrategyVersion,
    clearStrategyVersionChanges,
    selectStrategyVersion,
    removeStrategyVersion,
    saveMatrixData,
    restoreData,
    applyTreeStateToMatrix,
    changeTree
  }
}
