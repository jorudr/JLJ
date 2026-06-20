import { ref } from 'vue'

export type MatrixChangeType = 'add' | 'delete' | 'connect' | 'version' | 'clear' | 'update'

export type MatrixChangeEvent = {
  id: string
  type: MatrixChangeType
  title: string
  node: string
  createdAt: number
  targetId?: string
  targetKind?: 'node' | 'connection' | 'board' | 'version' | 'domain'
  subchanges: any[]
}

const events = ref<MatrixChangeEvent[]>([])
const RESOURCE_GROUP_ID = 'instruments-domains'

export function useMatrixChangeTree() {
  function changeId(prefix = 'chg') {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5)
  }

  function nodeDisplayValue(node: any) {
    return node.params?.customName || node.params?.identityName || node.label || node.id
  }

  function appendAddNodeEvent(node: any, targetKind: MatrixChangeEvent['targetKind'] = 'node') {
    events.value.push({
      id: changeId(),
      type: 'add',
      title: 'ADD_NODE',
      node: `${node.type}: ${nodeDisplayValue(node)}`,
      createdAt: Date.now(),
      targetId: node.id,
      targetKind,
      subchanges: []
    })
  }

  function isResourceEvent(event: MatrixChangeEvent) {
    if (event.targetId === RESOURCE_GROUP_ID && event.targetKind === 'board') return false
    if (event.targetKind === 'domain') return true
    return event.targetKind === 'node' && event.node.startsWith('instrument:')
  }

  function resourceSubchange(node: any, targetKind: 'node' | 'domain' = 'node') {
    return {
      id: changeId('sub'),
      label: targetKind === 'domain' ? 'domain' : 'instrument',
      value: nodeDisplayValue(node),
      targetId: node.id,
      subchanges: []
    }
  }

  function appendResourceNode(node: any, targetKind: 'node' | 'domain' = 'node') {
    const legacyEvents = events.value.filter(isResourceEvent)
    let group = events.value.find(event => (
      event.targetId === RESOURCE_GROUP_ID && event.targetKind === 'board'
    ))

    if (!group) {
      group = {
        id: changeId(),
        type: 'add',
        title: 'ADD_NODE',
        node: 'resources: instruments / domains',
        createdAt: Date.now(),
        targetId: RESOURCE_GROUP_ID,
        targetKind: 'board',
        subchanges: []
      }
    }

    const migratedSubchanges = [...legacyEvents].reverse().map(event => ({
      id: event.id,
      label: event.targetKind === 'domain' ? 'domain' : 'instrument',
      value: event.node.replace(/^[^:]+:\s*/, ''),
      targetId: event.targetId,
      subchanges: event.subchanges || []
    }))

    group.subchanges = [
      resourceSubchange(node, targetKind),
      ...migratedSubchanges,
      ...group.subchanges.filter(change => change.targetId !== node.id)
    ]
    group.createdAt = Date.now()
    events.value = [
      ...events.value.filter(event => event.id !== group!.id && !legacyEvents.includes(event)),
      group
    ]
  }

  function recordNodeAdded(node: any, ...args: any[]) {
    // Valid types for git panel
    const validTypes = [
      'strategy', 'condition', 'scenario', 'indicator', 
      'pattern', 'smc', 'data', 'methods', 'risk', 
      'risk-management', 'emotion', 'instrument',
      'pyramiding', 'averaging', 'domain'
    ]
    if (!validTypes.includes(node.type)) return

    if (node.type === 'instrument' || node.type === 'domain') {
      appendResourceNode(node, node.type === 'domain' ? 'domain' : 'node')
      return
    }

    appendAddNodeEvent(node)
  }

  function recordDomainAdded(domain: any, ...args: any[]) {
    appendResourceNode({
      id: domain.id,
      type: 'domain',
      label: domain.label || domain.type
    }, 'domain')
  }

  function recordNodeDeleted(node: any, ...args: any[]) {
    events.value = events.value.flatMap(event => {
      if (event.targetId === node.id) return []
      if (event.targetId !== RESOURCE_GROUP_ID) return [event]
      const subchanges = event.subchanges.filter(change => change.targetId !== node.id)
      return subchanges.length ? [{ ...event, subchanges }] : []
    })
  }

  // Stubs for remaining functions to not break useMatrixState.ts
  function recordLogicPlaceholderNodeAdded(node: any, ...args: any[]) {
    recordNodeAdded(node)
  }
  function recordConnectionCreated(...args: any[]) {}
  function recordConnectionDeleted(...args: any[]) {}
  function recordStrategyVersionCreated(...args: any[]) {}
  function recordNodeIdentityChanged(...args: any[]) {}
  function recordNodeDirectionChanged(...args: any[]) {}
  function recordNodePriorityChanged(...args: any[]) {}
  function recordNodeCommentAdded(...args: any[]) {}
  function recordNodeCommentChanged(...args: any[]) {}
  function recordZoneCreated(...args: any[]) {}
  function recordZoneDeleted(...args: any[]) {}
  function recordZoneTypeChanged(...args: any[]) {}

  // Additional stubs required by ExSkillNode.vue and useMatrixState.ts
  function recordNodeLabelTextChanged(...args: any[]) {}
  function recordNodeEmbedUrlChanged(...args: any[]) {}
  function recordNodeDescriptionChanged(...args: any[]) {}
  function recordChecklistItemAdded(...args: any[]) {}
  function recordChecklistItemRemoved(...args: any[]) {}
  function recordChecklistItemTextChanged(...args: any[]) {}
  function recordNodeTableChanged(...args: any[]) {}
  function recordCommentTextChanged(...args: any[]) {}
  function recordCommentRemoved(...args: any[]) {}
  function recordNodePhaseChanged(...args: any[]) {}
  function recordConnectionLabelChanged(...args: any[]) {}
  function removeLatestConnectionLabelChange(...args: any[]) {}
  
  function syncNodeIdentityLabels(next: Set<string>): Map<string, string> {
    return new Map<string, string>()
  }

  function resetChanges() {
    events.value = []
  }

  return {
    events,
    disabledChanges: ref(new Set<string>()),
    recordNodeAdded,
    recordDomainAdded,
    recordNodeDeleted,
    recordLogicPlaceholderNodeAdded,
    recordConnectionCreated,
    recordConnectionDeleted,
    recordStrategyVersionCreated,
    recordNodeIdentityChanged,
    recordNodeDirectionChanged,
    recordNodePriorityChanged,
    recordNodeCommentAdded,
    recordNodeCommentChanged,
    recordZoneCreated,
    recordZoneDeleted,
    recordZoneTypeChanged,
    recordNodeLabelTextChanged,
    recordNodeEmbedUrlChanged,
    recordNodeDescriptionChanged,
    recordChecklistItemAdded,
    recordChecklistItemRemoved,
    recordChecklistItemTextChanged,
    recordNodeTableChanged,
    recordCommentTextChanged,
    recordCommentRemoved,
    recordNodePhaseChanged,
    recordConnectionLabelChanged,
    removeLatestConnectionLabelChange,
    syncNodeIdentityLabels,
    resetChanges
  }
}
