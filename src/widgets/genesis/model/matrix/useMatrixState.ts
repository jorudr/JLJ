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

  const cloneMatrixValue = <T>(value: T): T => {
    return JSON.parse(JSON.stringify(value))
  }

  function createActiveContainerAccess() {
    const contextNode = activeContextId.value && activeContextNode.value ? activeContextNode.value : null
    if (contextNode) {
      if (!contextNode.subGraph) contextNode.subGraph = { nodes: [], connections: [], zones: [] }
      return {
        getNodes: () => contextNode.subGraph!.nodes,
        setNodes: (nextNodes: Node[]) => { contextNode.subGraph!.nodes = nextNodes },
        getConnections: () => contextNode.subGraph!.connections,
        setConnections: (nextConnections: Connection[]) => { contextNode.subGraph!.connections = nextConnections }
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

  function createNodeDeleteAction(node: Node, removedConnections: Connection[], container = createActiveContainerAccess()) {
    const nodeSnapshot = cloneMatrixValue(node)
    const connectionSnapshots = cloneMatrixValue(removedConnections)
    return {
      undo: () => {
        if (!container.getNodes().some(item => item.id === nodeSnapshot.id)) {
          container.setNodes([...container.getNodes(), cloneMatrixValue(nodeSnapshot)])
        }
        const existingKeys = new Set(container.getConnections().map(conn => `${conn.fromId}->${conn.toId}`))
        const restoredConnections = connectionSnapshots.filter(conn => !existingKeys.has(`${conn.fromId}->${conn.toId}`))
        container.setConnections([...container.getConnections(), ...cloneMatrixValue(restoredConnections)])
        forceUpdate()
        saveMatrixData()
      },
      redo: () => {
        container.setNodes(container.getNodes().filter(item => item.id !== nodeSnapshot.id))
        container.setConnections(container.getConnections().filter(conn => conn.fromId !== nodeSnapshot.id && conn.toId !== nodeSnapshot.id))
        forceUpdate()
        saveMatrixData()
      }
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
    const t = activeContextNode.value?.type
    return t && t !== 'strategy'
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
    
    connections.value.forEach(conn => {
      if (conn.bundleId) {
        const key = conn.fromId + '_b_' + conn.bundleId
        if (processed.has(key)) return
        const siblings = connections.value.filter(c => c.fromId === conn.fromId && c.bundleId === conn.bundleId)
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
    return nodes.value.find((n: Node) => n.id === id)
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
      const parentConn = connections.value.find(c => c.toId === id)
      const parentNode = parentConn ? getNode(parentConn.fromId) : null
      activeMenuCategory.value = getMenuCategoryForNode(parentNode || null)
    } else {
      if (node?.type !== 'text-panel') activeTextNodeId.value = null
      activeMenuCategory.value = getMenuCategoryForNode(node || null)
    }
  }

  function getMenuCategoryForNode(node: Node | null): MenuCategory | null {
    if (!node) return null
    if (isScenarioContext.value) {
      if (node.type === 'text-panel') return 'TEXT_FORMAT'
      if (['checklist-panel', 'embed-panel', 'table-panel', 'image', 'drawing-panel', 'file-attachment', 'audio-note'].includes(node.type)) return null
      return 'SCENARIO_DOCS'
    }
    if (node.type === 'text-panel') return 'TEXT_FORMAT'
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
    changeTree.recordNodeAdded(newNode, createNodeAddAction(newNode))
    saveMatrixData()
  }

  function setPendingNode(config: any) {
    const nextConfig = typeof config === 'string' 
      ? { type: config, label: config.toUpperCase(), params: {} }
      : config;
    if (isStrategyNode(nextConfig) && currentPageHasStrategy()) {
      addMatrixPage(`Strategy Page ${matrixPages.value.length + 1}`)
    }
    pendingNodeConfig.value = nextConfig
  }

  function removeNode(id: string) {
    const nodeToRemove = getNode(id)
    const container = createActiveContainerAccess()
    const removedConnections = container.getConnections().filter(c => c.fromId === id || c.toId === id)
    const deleteAction = nodeToRemove ? createNodeDeleteAction(nodeToRemove, removedConnections, container) : undefined
    if (nodeToRemove?.type === 'condition' && activeMenuCategory.value === 'INDICATORS') {
      activeMenuCategory.value = null
    }
    if (lastSelectedId.value === id) {
      lastSelectedId.value = null
      activeMenuCategory.value = null
    }

    if (activeContextId.value && activeContextNode.value?.subGraph) {
      activeContextNode.value.subGraph.nodes = activeContextNode.value.subGraph.nodes.filter(n => n.id !== id)
      activeContextNode.value.subGraph.connections = activeContextNode.value.subGraph.connections.filter(c => c.fromId !== id && c.toId !== id)
    } else {
      rootNodes.value = rootNodes.value.filter(n => n.id !== id)
      rootConnections.value = rootConnections.value.filter(c => c.fromId !== id && c.toId !== id)
    }
    cleanupLogicBundles()
    if (nodeToRemove) changeTree.recordNodeDeleted(nodeToRemove, deleteAction)
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

  function cleanupLogicBundles() {
    const bundles = new Map<string, Connection[]>()
    
    connections.value.forEach(c => {
      if (c.bundleId) {
        const key = `${c.fromId}_${c.bundleId}`
        if (!bundles.has(key)) bundles.set(key, [])
        bundles.get(key)!.push(c)
      }
    })
    
    bundles.forEach((conns) => {
      if (conns.length <= 1) {
        conns.forEach(c => {
          delete c.bundleId
          if (c.label?.toLowerCase() === 'and' || c.label?.toLowerCase() === 'or') {
            delete c.label
          }
          delete c.bundleStemX
          delete c.bundleStemY
        })
      }
    })
    forceUpdate()
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
    const newNode = {
      ...node,
      params: {
        ...node.params,
        logicalStructure: structure
      }
    }

    if (newNode.subGraph && newNode.subGraph.nodes) {
      newNode.subGraph.nodes = newNode.subGraph.nodes
        .map((n: any) => processNodeTree(n, newNode.subGraph!.nodes, newNode.subGraph!.connections))
        .filter((n: any) => n.type !== 'placeholder')
    }

    return newNode
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

  let saveTimeout: any = null
  const saveMatrixData = async () => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(async () => {
      syncActivePageFromRoot()

      const processedPages = matrixPages.value.map((page) => {
        const processedNodes = page.nodes
          .map(n => processNodeTree(n, page.nodes, page.connections))
          .filter(n => n.type !== 'placeholder')
        return {
          ...page,
          nodes: processedNodes,
          connections: page.connections,
          zones: page.zones
        }
      })

      const data = {
        pages: processedPages,
        activePageId: activePageId.value,
        nodes: processedPages.flatMap(page => page.nodes),
        connections: processedPages.flatMap(page => page.connections),
        zones: processedPages.flatMap(page => page.zones),
        view: {
          panX: viewState.value.panX,
          panY: viewState.value.panY,
          scale: viewState.value.scale
        },
        personalIndicators: personalIndicators.value
      }
      const appBootStore = useAppBootStore()
      appBootStore.genesisMatrixCache = data
      await saveToDisk(STORAGE_KEY, data)
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
        if (saved.personalIndicators) {
          personalIndicators.value = saved.personalIndicators
        }
      } else {
        throw new Error('No saved nodes found')
      }
    } catch (err) {
      console.warn('[GenesisPersistence] fallback:', err)
      matrixPages.value = []
      activePageId.value = null
      ensurePages()
    }
  }

  // Set up standard watchers
  watch([rootNodes, rootConnections, rootZones, personalIndicators], () => {
    saveMatrixData()
  }, { deep: true })

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
    clearBoard,
    mergeNodes,
    refreshMergeStatus,
    saveMatrixData,
    restoreData
  }
}
