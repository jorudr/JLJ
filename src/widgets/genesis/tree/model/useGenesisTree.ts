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
  displayName?: string
  shortName?: string
  typeLabel?: string
  globalX: number
  globalY: number
  conditions?: GenesisTreeConditionNode[]
  contents?: GenesisTreeConditionContentNode[]
}

export interface GenesisTreeConditionNode {
  id: string
  name?: string
  label?: string
  displayName?: string
  shortName?: string
  globalX: number
  globalY: number
  contents?: GenesisTreeConditionContentNode[]
}

export interface GenesisTreeConditionContentNode {
  id: string
  name?: string
  label?: string
  displayName?: string
  shortName?: string
  typeLabel?: string
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
    const firstWord = displayName
      .split(/[\s_/-]+/g)
      .map(part => part.trim())
      .find(Boolean) || displayName

    return firstWord.replace(/[^A-Z0-9]/g, '').slice(0, 3)
  }

  const getScenarioTypeLabel = (node: any) => {
    const rawType = String(
      node?.params?.scenarioType ||
      node?.params?.type ||
      node?.params?.phase ||
      node?.type ||
      ''
    ).toUpperCase()
    const scenarioType = rawType.includes('EXIT') ? 'EXIT' : 'ENTRY'

    return `${scenarioType} SCENARIO`
  }

  const getConditionDisplayName = (node: any) => {
    const name = node?.params?.customName || node?.label || node?.name || node?.id || 'Condition'
    return String(name).toUpperCase()
  }

  const getConditionShortName = (node: any) => {
    return getConditionDisplayName(node).replace(/[^A-Z0-9]/g, '').slice(0, 3)
  }

  const getConditionContentDisplayName = (node: any) => {
    const name = node?.params?.customName || node?.label || node?.name || node?.id || 'Node'
    return String(name).toUpperCase()
  }

  const getConditionContentShortName = (node: any) => {
    return getConditionContentDisplayName(node).replace(/[^A-Z0-9]/g, '').slice(0, 3)
  }

  const resolveNode = (nodeId: string, fallbackNodes: any[] = []) => {
    return getNodeById(nodeId) || fallbackNodes.find((node: any) => node.id === nodeId) || null
  }

  const collectLogicalNodeIds = (structure: any[]): string[] => {
    const ids: string[] = []

    const visit = (units: any[] | undefined) => {
      if (!Array.isArray(units)) return

      units.forEach((unit: any) => {
        if (!unit) return

        if (Array.isArray(unit.nodeIds)) {
          unit.nodeIds.forEach((nodeId: any) => {
            if (typeof nodeId === 'string' && nodeId.trim()) ids.push(nodeId)
          })
        }

        if (typeof unit.id === 'string' && unit.type !== 'bundle') {
          ids.push(unit.id)
        }

        if (Array.isArray(unit.logicalStructure)) {
          visit(unit.logicalStructure)
        }
      })
    }

    visit(structure)

    return Array.from(new Set(ids))
  }

  const getReachableNodes = (startId: string) => {
    const visited = new Set<string>([startId])
    const queue = [startId]
    const reachable: any[] = []

    while (queue.length > 0) {
      const currId = queue.shift()
      if (!currId) continue

      const childrenIds = matrixConnections.value
        .filter(c => c.fromId === currId)
        .map(c => c.toId)

      for (const childId of childrenIds) {
        if (visited.has(childId)) continue
        visited.add(childId)
        queue.push(childId)

        const node = getNodeById(childId)
        if (node) reachable.push(node)
      }
    }

    return reachable
  }

  const collectConditionNodes = (scenarioId: string) => {
    const scenarioNode = getNodeById(scenarioId)
    if (!scenarioNode) return []

    const scenarioLocalNodes = scenarioNode.subGraph?.nodes || []
    const scenarioStructureIds = collectLogicalNodeIds(scenarioNode.params?.logicalStructure || [])
    const fallbackConditionIds = [
      ...matrixConnections.value.filter(c => c.fromId === scenarioId).map(c => c.toId),
      ...scenarioLocalNodes.filter((node: any) => node.type === 'condition').map((node: any) => node.id)
    ]

    const conditionIds = Array.from(new Set([
      ...scenarioStructureIds,
      ...fallbackConditionIds
    ]))

    const collected = conditionIds
      .map(conditionId => resolveNode(conditionId, scenarioLocalNodes))
      .filter((node: any) => node && node.type === 'condition')

    return Array.from(new Map(collected.map((cond: any) => [cond.id, cond])).values())
  }

  const collectConditionContentNodes = (conditionId: string) => {
    const conditionNode = getNodeById(conditionId)
    if (!conditionNode) return []

    const subNodes = conditionNode.subGraph?.nodes || []
    const subConns = conditionNode.subGraph?.connections || []

    const structure = conditionNode.params?.logicalStructure || []
    const collected: any[] = []

    const pushNode = (node: any) => {
      if (!node || !node.id) return
      if (node.type === 'placeholder' || node.params?.needsConfig) return
      if (node.id === conditionId) return
      collected.push(node)
    }

    if (structure && structure.length > 0) {
      collectLogicalNodeIds(structure).forEach((nodeId: string) => {
        const node = resolveNode(nodeId, subNodes)
        pushNode(node)
      })
    } else {
      const connectedIds = [
        ...matrixConnections.value.filter(c => c.fromId === conditionId).map(c => c.toId),
        ...subConns.filter((c: any) => c.fromId === conditionId).map((c: any) => c.toId)
      ]

      const fallbackNodes = [
        ...matrixNodes.value.filter(n => connectedIds.includes(n.id)),
        ...subNodes.filter((n: any) => connectedIds.includes(n.id))
      ]

      fallbackNodes.forEach(pushNode)
      subNodes.forEach((node: any) => {
        if (node.type !== 'condition') pushNode(node)
      })
    }

    return Array.from(new Map(collected.map(node => [node.id, node])).values())
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
    const horizontalGap = 92
    const contentRowGap = 92
    const maxConditionColumns = 3
    const strategyY = 120
    const scenarioY = 240
    const contentY = 360
    let leafCursor = 0

    const treeNodes = nodes.map((strat) => {
      const rawScenarios = collectScenarioNodes(strat.id)

      const scenarios = rawScenarios.map((sc) => {
        const conditionNodes = collectConditionNodes(sc.id)

        const conditions = conditionNodes.map((cond) => {
          return {
            ...cond,
            displayName: getConditionDisplayName(cond),
            shortName: getConditionShortName(cond),
            globalX: 0,
            globalY: scenarioY
          }
        })

        const contentNodes = conditionNodes.flatMap((cond) =>
          collectConditionContentNodes(cond.id).map((content) => ({
            ...content,
            conditionId: cond.id,
            displayName: getConditionContentDisplayName(content),
            shortName: getConditionContentShortName(content),
            typeLabel: 'CONDITION'
          }))
        )

        const scenarioLeafCount = Math.max(Math.min(contentNodes.length, maxConditionColumns), 1)
        const contents = contentNodes.map((content, contentIdx) => {
          const column = contentIdx % maxConditionColumns
          const row = Math.floor(contentIdx / maxConditionColumns)
          const globalX = (leafCursor + column) * horizontalGap

          return {
            ...content,
            globalX,
            globalY: contentY + (row * contentRowGap)
          }
        })

        const scenarioStartX = leafCursor * horizontalGap
        const scenarioEndX = (leafCursor + scenarioLeafCount - 1) * horizontalGap
        const scenarioX = (scenarioStartX + scenarioEndX) / 2

        leafCursor += scenarioLeafCount

        return {
          ...sc,
          displayName: getScenarioDisplayName(sc),
          shortName: getScenarioShortName(sc),
          typeLabel: getScenarioTypeLabel(sc),
          conditions,
          contents,
          globalX: scenarioX,
          globalY: scenarioY
        }
      })

      if (scenarios.length === 0) {
        const strategyX = leafCursor * horizontalGap
        leafCursor += 1

        return {
          ...strat,
          x: strategyX,
          y: strategyY,
          scenarios
        }
      }

      const strategyX = scenarios.reduce((sum, scenario) => sum + scenario.globalX, 0) / scenarios.length

      return {
        ...strat,
        x: strategyX,
        y: strategyY,
        scenarios
      }
    })

    const centerOffset = ((Math.max(leafCursor, 1) - 1) * horizontalGap) / 2
    treeNodes.forEach((node) => {
      node.x -= centerOffset

      node.scenarios.forEach((scenario) => {
        scenario.globalX -= centerOffset

        ;(scenario.conditions || []).forEach((condition) => {
          condition.globalX = scenario.globalX
        })

        ;(scenario.contents || []).forEach((content) => {
          content.globalX -= centerOffset
        })
      })
    })

    return treeNodes
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
    getConditionDisplayName,
    getConditionShortName,
    selectStrategy,
    selectedStrategyId,
    selectedStrategyLabel,
    strategies,
    strategyNodePositions
  }
}
