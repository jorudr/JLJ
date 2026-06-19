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
  targetId?: string
  action?: MatrixChangeAction
  subchanges?: MatrixSubchange[]
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
const disabledChanges = ref(new Set<string>())
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

function addSubchange(parent: MatrixChangeEvent, label: string, value: string, targetIdOrAction?: string | MatrixChangeAction, actionOpt?: MatrixChangeAction) {
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) return

  let targetId: string | undefined
  let action: MatrixChangeAction | undefined

  if (targetIdOrAction && typeof targetIdOrAction === 'object') {
    action = targetIdOrAction as MatrixChangeAction
  } else if (typeof targetIdOrAction === 'string') {
    targetId = targetIdOrAction
    action = actionOpt
  } else if (targetIdOrAction === undefined && actionOpt) {
    action = actionOpt
  }

  parent.subchanges.push({
    id: nextId('sub'),
    label,
    value: normalizedValue,
    targetId,
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
    disabledChanges.value.clear()
    sequence = 0
  }

  function setChangeEnabled(id: string, enabled: boolean) {
    const event = events.value.find(item => item.id === id)
    if (event) {
      if (enabled) {
        event.action?.redo?.()
        event.subchanges.forEach(subchange => {
          subchange.action?.redo?.()
          subchange.subchanges?.forEach(subsub => subsub.action?.redo?.())
        })
      } else {
        ;[...event.subchanges].reverse().forEach(subchange => {
          if (subchange.subchanges) {
            ;[...subchange.subchanges].reverse().forEach(subsub => subsub.action?.undo?.())
          }
          subchange.action?.undo?.()
        })
        event.action?.undo?.()
      }
      return
    }

    let subchange: MatrixSubchange | undefined
    for (const item of events.value) {
      for (const sub of item.subchanges) {
        if (sub.id === id) {
          subchange = sub
          break
        }
        if (sub.subchanges) {
          const subsub = sub.subchanges.find(s => s.id === id)
          if (subsub) {
            subchange = subsub
            break
          }
        }
      }
      if (subchange) break
    }

    if (!subchange) return
    if (enabled) {
      subchange.action?.redo?.()
      subchange.subchanges?.forEach(subsub => subsub.action?.redo?.())
    } else {
      if (subchange.subchanges) {
        ;[...subchange.subchanges].reverse().forEach(subsub => subsub.action?.undo?.())
      }
      subchange.action?.undo?.()
    }
  }

  function disableNodeDependents(targetId: string, nodeStr: string) {
    const next = new Set(disabledChanges.value)
    for (let evIndex = events.value.length - 1; evIndex >= 0; evIndex--) {
      const ev = events.value[evIndex]
      if (!ev) continue
      
      // Turn off events modifying or originating from this node (including ADD_NODE)
      if (ev.targetKind === 'node' && ev.targetId === targetId && ev.type !== 'delete') {
        for (let i = ev.subchanges.length - 1; i >= 0; i--) {
          const sub = ev.subchanges[i]
          if (!sub) continue
          if (sub.id && !next.has(sub.id)) {
            next.add(sub.id)
            setChangeEnabled(sub.id, false)
          }
        }
        if (!next.has(ev.id)) {
          next.add(ev.id)
          setChangeEnabled(ev.id, false)
        }
      }
      
      // Turn off subchanges connecting to this node
      for (let i = ev.subchanges.length - 1; i >= 0; i--) {
        const sub = ev.subchanges[i]
        if (!sub) continue
        if ((sub.label === 'to' || sub.label === 'removed') && (sub.targetId === targetId || (!sub.targetId && sub.value === nodeStr))) {
          if (sub.id && !next.has(sub.id)) {
            next.add(sub.id)
            setChangeEnabled(sub.id, false)
          }
        }
      }
    }
    disabledChanges.value = next
  }

  function enableNodeDependents(targetId: string, nodeStr: string) {
    const next = new Set(disabledChanges.value)
    events.value.forEach(ev => {
      // Turn on events modifying or originating from this node (including ADD_NODE)
      if (ev.targetKind === 'node' && ev.targetId === targetId && ev.type !== 'delete') {
        if (next.has(ev.id)) {
          next.delete(ev.id)
          setChangeEnabled(ev.id, true)
        }
        ev.subchanges.forEach(sub => {
          if (next.has(sub.id)) {
            next.delete(sub.id)
            setChangeEnabled(sub.id, true)
          }
        })
      }
      
      // Turn on subchanges connecting to this node
      ev.subchanges.forEach(sub => {
        if ((sub.label === 'to' || sub.label === 'removed') && (sub.targetId === targetId || (!sub.targetId && sub.value === nodeStr))) {
          if (next.has(sub.id)) {
            next.delete(sub.id)
            setChangeEnabled(sub.id, true)
          }
        }
      })
    })
    disabledChanges.value = next
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
    disableNodeDependents(node.id, readableNodeLine(node))
  }

  function recordConnectionCreated(connection: { fromId: string, toId: string }, fromNode?: any, toNode?: any, action?: MatrixChangeAction) {
    const sourceNode = fromNode || { id: connection.fromId, label: connection.fromId }
    const targetNode = toNode || { id: connection.toId, label: connection.toId }

    addSubchange(
      ensureNodeParent(sourceNode),
      'to',
      readableNodeLine(targetNode),
      connection.toId,
      action
    )
  }

  function recordConnectionDeleted(connection: { fromId: string, toId: string }, fromNode?: any, toNode?: any, action?: MatrixChangeAction) {
    const sourceNode = fromNode || { id: connection.fromId, label: connection.fromId }
    const targetNode = toNode || { id: connection.toId, label: connection.toId }

    addSubchange(
      ensureNodeParent(sourceNode),
      'removed',
      readableNodeLine(targetNode),
      connection.toId,
      action
    )
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
    // Retroactively update the node's readable name in all previous events and subchanges
    const targetId = node.id
    const newLine = readableNodeLine(node)
    const newName = readableNodeName(node)

    events.value.forEach(event => {
      if (event.targetKind === 'node' && event.targetId === targetId) {
        event.node = newLine
      }
      
      event.subchanges.forEach(sub => {
        if (sub.targetId === targetId && (sub.label === 'to' || sub.label === 'removed')) {
          sub.value = newLine
        }
        if (event.targetId === targetId && sub.label === 'removed' && !sub.targetId) {
          sub.value = newName
        }
      })
    })
    events.value = [...events.value]
    
    // Add the actual subchange for the identity update
    addSubchange(
      ensureNodeParent(node),
      'identity',
      value,
      undefined,
      action
    )
  }

  function recordNodeDirectionChanged(node: any, value: string, action?: MatrixChangeAction) {
    const parentEvent = ensureNodeParent(node)
    if (value === 'NONE') {
      addSubchange(parentEvent, 'direction_removed', value, undefined, action)
    } else {
      const lastSub = [...parentEvent.subchanges].reverse().find(s => s.label === 'direction' || s.label === 'direction_removed')
      if (lastSub && lastSub.label === 'direction') {
        lastSub.value = value
        const originalUndo = lastSub.action?.undo
        lastSub.action = {
          undo: originalUndo || action?.undo,
          redo: action?.redo
        }
        events.value = [...events.value]
      } else {
        addSubchange(parentEvent, 'direction', value, undefined, action)
      }
    }
  }

  function recordNodePhaseChanged(node: any, value: string, action?: MatrixChangeAction) {
    const parentEvent = ensureNodeParent(node)
    if (value === 'NONE') {
      addSubchange(parentEvent, 'phase_removed', value, undefined, action)
    } else {
      const lastSub = [...parentEvent.subchanges].reverse().find(s => s.label === 'phase' || s.label === 'phase_removed')
      if (lastSub && lastSub.label === 'phase') {
        lastSub.value = value
        const originalUndo = lastSub.action?.undo
        lastSub.action = {
          undo: originalUndo || action?.undo,
          redo: action?.redo
        }
        events.value = [...events.value]
      } else {
        addSubchange(parentEvent, 'phase', value, undefined, action)
      }
    }
  }

  function recordNodePriorityChanged(node: any, value: string, action?: MatrixChangeAction) {
    const parentEvent = ensureNodeParent(node)
    if (value === 'NONE') {
      addSubchange(parentEvent, 'priority_removed', value, undefined, action)
    } else {
      const lastSub = [...parentEvent.subchanges].reverse().find(s => s.label === 'priority' || s.label === 'priority_removed')
      if (lastSub && lastSub.label === 'priority') {
        lastSub.value = value
        const originalUndo = lastSub.action?.undo
        lastSub.action = {
          undo: originalUndo || action?.undo,
          redo: action?.redo
        }
        events.value = [...events.value]
      } else {
        addSubchange(parentEvent, 'priority', value, undefined, action)
      }
    }
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
    const sourceNode = { id: connection.fromId, label: connection.fromId }
    const parentEvent = ensureNodeParent(sourceNode)
    const toSubchange = [...parentEvent.subchanges].reverse().find(s => s.label === 'to' && s.targetId === connection.toId)
    
    if (toSubchange) {
      if (!toSubchange.subchanges) toSubchange.subchanges = []
      toSubchange.subchanges.push({
        id: nextId('sub'),
        label: 'link_label',
        value: label ? label.toUpperCase() : 'CLEAR',
        action
      })
      events.value = [...events.value]
    } else {
      addSubchange(ensureConnectionParent(connection), 'link_label', label ? label.toUpperCase() : 'CLEAR', action)
    }
  }

  function updateConnectionAction(fromId: string, toId: string, targetNode: any, action: MatrixChangeAction) {
    const parentEvent = findParentEvent('node', fromId)
    if (parentEvent) {
      const sub = parentEvent.subchanges.find(s => s.targetId === toId && s.label === 'to')
      if (sub) {
        sub.action = action
      }
    }
  }

  return {
    events,
    disabledChanges,
    resetChanges,
    setChangeEnabled,
    disableNodeDependents,
    enableNodeDependents,
    recordNodeAdded,
    recordNodeDeleted,
    recordConnectionCreated,
    recordConnectionDeleted,
    recordStrategyVersionCreated,
    recordNodeIdentityChanged,
    recordNodeDirectionChanged,
    recordNodePhaseChanged,
    recordNodePriorityChanged,
    recordNodeDescriptionChanged,
    recordCommentAdded,
    recordCommentTextChanged,
    recordCommentRemoved,
    recordConnectionLabelChanged,
    updateConnectionAction
  }
}
