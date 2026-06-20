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

export function useMatrixChangeTree() {
  function recordNodeAdded(node: any, ...args: any[]) {
    // Valid types for git panel
    const validTypes = [
      'strategy', 'condition', 'scenario', 'indicator', 
      'pattern', 'smc', 'data', 'methods', 'risk', 
      'risk-management', 'emotion'
    ]
    if (!validTypes.includes(node.type)) return

    events.value.push({
      id: 'chg-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5),
      type: 'add',
      title: 'ADD_NODE',
      node: `${node.type}: ${node.params?.customName || node.params?.identityName || node.label || node.id}`,
      createdAt: Date.now(),
      targetId: node.id,
      targetKind: 'node',
      subchanges: []
    })
  }

  function recordNodeDeleted(node: any, ...args: any[]) {
    events.value = events.value.filter(e => e.targetId !== node.id)
  }

  // Stubs for remaining functions to not break useMatrixState.ts
  function recordLogicPlaceholderNodeAdded(...args: any[]) {}
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
