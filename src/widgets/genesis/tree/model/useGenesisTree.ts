import { computed, onMounted, ref, shallowRef } from 'vue'
import { loadFromDisk } from '~/shared/diskStorage'
import { useStrategyTradesStore } from '~/features/store/useStrategyTrades'
import { useAuthStore } from '~/entities/user/auth.store'
import { useAppBootStore } from '~/features/store/useAppBoot'
import { useI18n } from '~/shared/i18n/useI18n'

export interface GenesisTreeScenarioNode {
  id: string
  name?: string
  label?: string
  globalX: number
  globalY: number
}

export interface GenesisTreeStrategyNode {
  id: string
  name: string
  x: number
  y: number
  scenarios: GenesisTreeScenarioNode[]
}

export const useGenesisTree = () => {
  const tradeStore = useStrategyTradesStore()
  const authStore = useAuthStore()
  const appBootStore = useAppBootStore()
  const { locale, t } = useI18n()

  const matrixNodes = shallowRef<any[]>([])
  const matrixConnections = shallowRef<any[]>([])
  const isMatrixLoading = ref(true)

  const selectedStrategyId = computed<string | null>({
    get: () => tradeStore.selectedStrategyId,
    set: (val) => {
      tradeStore.selectedStrategyId = val
    }
  })

  const loadMatrixData = async () => {
    isMatrixLoading.value = true
    try {
      const data = (appBootStore.genesisMatrixCache || await loadFromDisk('genesis_matrix_v2')) as any
      if (data) {
        appBootStore.genesisMatrixCache = data
        const allNodes: any[] = []
        const allConns: any[] = []

        const flatten = (nodesList: any[], connsList: any[]) => {
          nodesList.forEach(n => {
            allNodes.push(n)
            if (n.subGraph) {
              flatten(n.subGraph.nodes || [], n.subGraph.connections || [])
            }
          })
          connsList.forEach(c => allConns.push(c))
        }

        flatten(data.nodes || [], data.connections || [])
        matrixNodes.value = allNodes
        matrixConnections.value = allConns
      }
    } catch (err) {
      console.error('Failed to load matrix data:', err)
    } finally {
      isMatrixLoading.value = false
    }
  }

  const strategies = computed(() => {
    return matrixNodes.value
      .filter(n => n.type === 'strategy' || n.type === 'system')
      .map(n => ({
        id: n.id,
        name: String(n.params?.customName || n.label || n.id).toUpperCase()
      }))
  })

  const getNodeById = (id: string) => matrixNodes.value.find(n => n.id === id)

  const getScenarioDisplayName = (node: any) => {
    const name = node?.params?.customName || node?.label || node?.name || node?.id || 'Scenario'
    return String(name).toUpperCase()
  }

  const getScenarioShortName = (node: any) => {
    const displayName = getScenarioDisplayName(node)
    const parts = displayName
      .split(/[\s_/-]+/g)
      .map(part => part.trim())
      .filter(Boolean)

    if (parts.length > 1) {
      return parts
        .map(part => part[0])
        .join('')
        .slice(0, 3)
    }

    return displayName.replace(/[^A-Z0-9]/g, '').slice(0, 3)
  }

  const collectScenarioNodes = (rootId: string, depth = 0, visited = new Set<string>()): any[] => {
    if (depth > 5 || visited.has(rootId)) return []

    visited.add(rootId)

    const rootNode = getNodeById(rootId)
    if (!rootNode) return []

    const discovered = new Map<string, any>()
    const directConnections = matrixConnections.value.filter(c => c.fromId === rootId)
    const directNodes = directConnections
      .map(c => getNodeById(c.toId))
      .filter(Boolean)

    const subGraphNodes = rootNode.subGraph?.nodes || []
    const nextNodes = [...subGraphNodes, ...directNodes]

    for (const node of nextNodes) {
      if (!node || !node.id) continue

      if (node.type === 'scenario') {
        discovered.set(node.id, node)
      }

      const descendants = collectScenarioNodes(node.id, depth + 1, visited)
      for (const descendant of descendants) {
        discovered.set(descendant.id, descendant)
      }
    }

    return [...discovered.values()]
  }

  const strategyNodePositions = computed<GenesisTreeStrategyNode[]>(() => {
    const nodes = strategies.value.filter(s => s.id !== 'MAIN_DIARY')

    return nodes.map((strat, i) => {
      const angleStep = Math.PI * 2 * 0.61803398875
      const baseRadius = 150
      const r = baseRadius + Math.sqrt(i) * 50
      const theta = i * angleStep

      const x = Math.cos(theta) * r
      const y = Math.sin(theta) * r

      const rawScenarios = collectScenarioNodes(strat.id)

      const scenarios = rawScenarios.map((sc, scIdx) => {
        const scAngle = rawScenarios.length === 1
          ? theta
          : theta - Math.PI / 2 + (Math.PI / (rawScenarios.length - 1)) * scIdx
        const scRadius = 70

        return {
          ...sc,
          displayName: getScenarioDisplayName(sc),
          shortName: getScenarioShortName(sc),
          globalX: x + Math.cos(scAngle) * scRadius,
          globalY: y + Math.sin(scAngle) * scRadius
        }
      })

      return {
        ...strat,
        x,
        y,
        scenarios
      }
    })
  })

  const selectedStrategy = computed(() => {
    return strategies.value.find(s => s.id === selectedStrategyId.value) || strategies.value[0] || { id: 'MAIN_DIARY', name: 'MAIN_DIARY' }
  })

  const selectedStrategyLabel = computed(() => {
    const name = selectedStrategy.value?.name || 'MAIN_DIARY'
    return name === 'MAIN_DIARY' ? t('genesis.virtualLog.mainDiary') : name
  })

  const selectStrategy = (id: string) => {
    selectedStrategyId.value = id

    const findStyleRecursive = (targetId: string, depth: number): any => {
      if (depth > 3) return null

      const directConnections = matrixConnections.value.filter(c => c.fromId === targetId)
      const connectedNodes = directConnections.map(c => matrixNodes.value.find(n => n.id === c.toId)).filter(Boolean)

      const styleNode = connectedNodes.find(n =>
        (n.type === 'risk-element' && n.params?.riskType === 'style') ||
        (n.label && n.label.toLowerCase().includes('style'))
      )

      if (styleNode) return styleNode

      for (const node of connectedNodes) {
        const result = findStyleRecursive(node.id, depth + 1)
        if (result) return result
      }

      return null
    }

    const styleNode = findStyleRecursive(id, 0)
    console.log(`[GENESIS_TREE] Protocol Selection: ${id} | Resolved Trading Style: ${styleNode?.label || 'UNDEFINED'}`)
  }

  const formatCreationDate = (d: string | null | undefined) => {
    if (!d) return 'UNKNOWN_ORIGIN'
    const date = new Date(d)
    return date.toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).toUpperCase()
  }

  onMounted(loadMatrixData)

  return {
    authStore,
    formatCreationDate,
    isMatrixLoading,
    matrixConnections,
    matrixNodes,
    getScenarioDisplayName,
    getScenarioShortName,
    selectStrategy,
    selectedStrategyId,
    selectedStrategyLabel,
    strategies,
    strategyNodePositions
  }
}
