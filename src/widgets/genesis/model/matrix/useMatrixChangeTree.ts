import { ref } from 'vue'

export type MatrixChangeType = 'add' | 'delete' | 'connect' | 'version' | 'clear' | 'update'

type MatrixChangeAction = {
  undo?: () => void
  redo?: () => void
}

export type MatrixSubchange = {
  id: string
  label: string
  value: string
  action?: MatrixChangeAction
}

export type MatrixChangeEvent = {
  id: string
  type: MatrixChangeType
  title: string
  node: string
  createdAt: number
  targetId?: string
  targetKind?: 'node' | 'connection' | 'board' | 'version'
  subchanges: MatrixSubchange[]
  action?: MatrixChangeAction
}

const events = ref<MatrixChangeEvent[]>([])
let sequence = 0

function nextId(prefix = 'chg') {
  sequence += 1
  return `${prefix}-${Date.now().toString(36)}-${sequence}`
}

function readableNodeName(node: any) {
  return node?.params?.customName || node?.params?.identityName || node?.params?.name || node?.label || node?.id || 'node'
}

function readableNodeLine(node: any) {
  return `${node?.type || 'node'}: ${readableNodeName(node)}`
}

function connectionId(connection: { fromId: string, toId: string }) {
  return `${connection.fromId}->${connection.toId}`
}

function addEvent(event: Omit<MatrixChangeEvent, 'id' | 'createdAt' | 'subchanges'> & { subchanges?: MatrixSubchange[] }) {
  events.value = [
    ...events.value,
    {
      ...event,
      id: nextId(),
      createdAt: Date.now(),
      subchanges: event.subchanges || []
    }
  ]
}

function addSubchange(parent: MatrixChangeEvent, label: string, value: string, action?: MatrixChangeAction) {
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) return

  parent.subchanges.push({
    id: nextId('sub'),
    label,
    value: normalizedValue,
    action
  })
  events.value = [...events.value]
}

function findParentEvent(targetKind: MatrixChangeEvent['targetKind'], targetId: string) {
  return [...events.value]
    .reverse()
    .find(event => event.targetKind === targetKind && event.targetId === targetId && event.type !== 'delete')
}

function ensureNodeParent(node: any) {
  const existing = findParentEvent('node', node.id)
  if (existing) return existing

  const event: MatrixChangeEvent = {
    id: nextId(),
    type: 'update',
    title: 'UPDATE_NODE',
    node: readableNodeLine(node),
    createdAt: Date.now(),
    targetId: node.id,
    targetKind: 'node',
    subchanges: []
  }
  events.value = [...events.value, event]
  return event
}

function ensureConnectionParent(connection: { fromId: string, toId: string }) {
  const targetId = connectionId(connection)
  const existing = findParentEvent('connection', targetId)
  if (existing) return existing

  const event: MatrixChangeEvent = {
    id: nextId(),
    type: 'update',
    title: 'UPDATE_CONNECTION',
    node: targetId,
    createdAt: Date.now(),
    targetId,
    targetKind: 'connection',
    subchanges: []
  }
  events.value = [...events.value, event]
  return event
}

export function useMatrixChangeTree() {
  function resetChanges() {
    events.value = []
  }

  function setChangeEnabled(id: string, enabled: boolean) {
    const event = events.value.find(item => item.id === id)
    if (event) {
      if (enabled) {
        event.action?.redo?.()
        event.subchanges.forEach(subchange => subchange.action?.redo?.())
      } else {
        ;[...event.subchanges].reverse().forEach(subchange => subchange.action?.undo?.())
        event.action?.undo?.()
      }
      return
    }

    const subchange = events.value.flatMap(item => item.subchanges).find(item => item.id === id)
    if (!subchange) return
    if (enabled) subchange.action?.redo?.()
    else subchange.action?.undo?.()
  }

  function recordNodeAdded(node: any, action?: MatrixChangeAction) {
    addEvent({
      type: 'add',
      title: 'ADD_NODE',
      node: readableNodeLine(node),
      targetId: node.id,
      targetKind: 'node',
      action
    })
  }

  function recordNodeDeleted(node: any, action?: MatrixChangeAction) {
    addEvent({
      type: 'delete',
      title: 'DELETE_NODE',
      node: readableNodeLine(node),
      targetId: node.id,
      targetKind: 'node',
      action,
      subchanges: [
        { id: nextId('sub'), label: 'removed', value: readableNodeName(node) }
      ]
    })
  }

  function recordConnectionCreated(connection: { fromId: string, toId: string }, fromNode?: any, toNode?: any, action?: MatrixChangeAction) {
    addEvent({
      type: 'connect',
      title: 'CONNECT_NODES',
      node: `${readableNodeName(fromNode) || connection.fromId} -> ${readableNodeName(toNode) || connection.toId}`,
      targetId: connectionId(connection),
      targetKind: 'connection',
      action,
      subchanges: [
        { id: nextId('sub'), label: 'from', value: readableNodeLine(fromNode || { id: connection.fromId, label: connection.fromId }) },
        { id: nextId('sub'), label: 'to', value: readableNodeLine(toNode || { id: connection.toId, label: connection.toId }) }
      ]
    })
  }

  function recordBoardCleared(action?: MatrixChangeAction) {
    addEvent({
      type: 'clear',
      title: 'CLEAR_BOARD',
      node: 'genesis matrix',
      targetKind: 'board',
      action
    })
  }

  function recordStrategyVersionCreated(versionLabel?: string, action?: MatrixChangeAction) {
    const versionNumber = events.value.filter(event => event.type === 'version').length + 1
    addEvent({
      type: 'version',
      title: 'SET_STRATEGY_VERSION',
      node: versionLabel || `strategy version v${versionNumber}`,
      targetKind: 'version',
      action
    })
  }

  function recordNodeIdentityChanged(node: any, value: string, action?: MatrixChangeAction) {
    addSubchange(ensureNodeParent(node), 'identity', value, action)
  }

  function recordNodeDescriptionChanged(node: any, value: string, action?: MatrixChangeAction) {
    addSubchange(ensureNodeParent(node), 'description', value, action)
  }

  function recordCommentAdded(node: any, comment: any, action?: MatrixChangeAction) {
    addSubchange(ensureNodeParent(node), 'comment_added', comment?.text || 'comment', action)
  }

  function recordCommentTextChanged(node: any, comment: any, action?: MatrixChangeAction) {
    addSubchange(ensureNodeParent(node), 'comment_text', comment?.text || 'comment', action)
  }

  function recordCommentRemoved(node: any, comment: any, action?: MatrixChangeAction) {
    addSubchange(ensureNodeParent(node), 'comment_removed', comment?.text || 'comment', action)
  }

  function recordConnectionLabelChanged(connection: { fromId: string, toId: string, label?: string }, label: string | null, action?: MatrixChangeAction) {
    addSubchange(ensureConnectionParent(connection), 'link_label', label ? label.toUpperCase() : 'CLEAR', action)
  }

  return {
    events,
    resetChanges,
    setChangeEnabled,
    recordNodeAdded,
    recordNodeDeleted,
    recordConnectionCreated,
    recordBoardCleared,
    recordStrategyVersionCreated,
    recordNodeIdentityChanged,
    recordNodeDescriptionChanged,
    recordCommentAdded,
    recordCommentTextChanged,
    recordCommentRemoved,
    recordConnectionLabelChanged
  }
}
