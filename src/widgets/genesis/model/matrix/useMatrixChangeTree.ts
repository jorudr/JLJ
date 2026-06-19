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
  linkedIds?: string[]
  payload?: any
}

export type MatrixChangeEvent = {
  id: string
  type: MatrixChangeType
  title: string
  node: string
  createdAt: number
  targetId?: string
  targetKind?: 'node' | 'connection' | 'board' | 'version' | 'domain'
  subchanges: MatrixSubchange[]
  action?: MatrixChangeAction
  linkedIds?: string[]
  payload?: any
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

function readableDomainValue(domain: any) {
  if (domain?.type === 'session') return String(domain?.label || 'SESSION').toUpperCase()
  return String(domain?.type || domain?.label || 'domain').toUpperCase()
}

function readableDomainLine(domain: any) {
  return `domain: ${readableDomainValue(domain)}`
}

function connectionId(connection: { fromId: string, toId: string }) {
  return `${connection.fromId}->${connection.toId}`
}

function addEvent(event: Omit<MatrixChangeEvent, 'id' | 'createdAt' | 'subchanges'> & { subchanges?: MatrixSubchange[] }) {
  const nextEvent = {
    ...event,
    id: nextId(),
    createdAt: Date.now(),
    subchanges: event.subchanges || []
  }
  events.value = [
    ...events.value,
    nextEvent
  ]
  return nextEvent
}

function addSubchange(parent: MatrixChangeEvent, label: string, value: string, targetIdOrAction?: string | MatrixChangeAction, actionOpt?: MatrixChangeAction, payload?: any) {
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

  const subchange = {
    id: nextId('sub'),
    label,
    value: normalizedValue,
    targetId,
    action,
    payload
  }
  parent.subchanges.push(subchange)
  events.value = [...events.value]
  return subchange
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

function ensureDomainParent(domain: any) {
  const existing = findParentEvent('domain', domain.id)
  if (existing) {
    existing.node = readableDomainLine(domain)
    return existing
  }

  const event: MatrixChangeEvent = {
    id: nextId(),
    type: 'add',
    title: 'ADD_DOMAIN',
    node: readableDomainLine(domain),
    createdAt: Date.now(),
    targetId: domain.id,
    targetKind: 'domain',
    subchanges: []
  }
  events.value = [...events.value, event]
  return event
}

function findChangeById(id: string): MatrixChangeEvent | MatrixSubchange | undefined {
  for (const event of events.value) {
    if (event.id === id) return event

    const stack = [...event.subchanges]
    while (stack.length) {
      const subchange = stack.shift()
      if (!subchange) continue
      if (subchange.id === id) return subchange
      if (subchange.subchanges?.length) stack.unshift(...subchange.subchanges)
    }
  }
}

function findChangeContext(id: string): { change: MatrixChangeEvent | MatrixSubchange, parent?: MatrixSubchange, event?: MatrixChangeEvent } | undefined {
  for (const event of events.value) {
    if (event.id === id) return { change: event, event }

    const stack = event.subchanges.map(subchange => ({ change: subchange, parent: undefined as MatrixSubchange | undefined }))
    while (stack.length) {
      const item = stack.shift()
      if (!item) continue
      if (item.change.id === id) return { change: item.change, parent: item.parent, event }
      item.change.subchanges?.forEach(child => stack.unshift({ change: child, parent: item.change }))
    }
  }
}

function collectDescendantChangeIds(id: string) {
  const context = findChangeContext(id)
  const subchanges = (context?.change as MatrixSubchange | MatrixChangeEvent | undefined)?.subchanges || []
  const ids: string[] = []
  const stack = [...subchanges]

  while (stack.length) {
    const subchange = stack.shift()
    if (!subchange) continue
    ids.push(subchange.id)
    if (subchange.subchanges?.length) stack.unshift(...subchange.subchanges)
  }

  return ids
}

function isLogicLabelChange(id: string) {
  return (findChangeContext(id)?.change as MatrixSubchange | undefined)?.label === 'link_label'
}

function isLogicLabelAddNode(id: string) {
  const context = findChangeContext(id)
  return (context?.change as MatrixSubchange | undefined)?.label === 'ADD_NODE' && context?.parent?.label === 'link_label'
}

function isInitialLogicLabelAddNode(id: string) {
  const context = findChangeContext(id)
  if ((context?.change as MatrixSubchange | undefined)?.label !== 'ADD_NODE' || context?.parent?.label !== 'link_label') return false
  const addNodes = context.parent.subchanges?.filter(subchange => subchange.label === 'ADD_NODE') || []
  return addNodes[0]?.id === id
}

function getParentLogicLabelId(id: string) {
  const parent = findChangeContext(id)?.parent
  return parent?.label === 'link_label' ? parent.id : undefined
}

function getLogicLabelParentIds(labelId: string) {
  const context = findChangeContext(labelId)
  const parentId = context?.parent?.id
  const eventId = context?.event?.id
  return { parentId, eventId }
}

function getInitialLogicLabelAddNodeId(labelId: string) {
  const context = findChangeContext(labelId)
  const addNodes = ((context?.change as MatrixSubchange | undefined)?.subchanges || [])
    .filter(subchange => subchange.label === 'ADD_NODE')
  return addNodes[0]?.id
}

function hasEnabledLogicLabelAddNodes(labelId: string, disabledIds: Set<string>) {
  const context = findChangeContext(labelId)
  const subchanges = (context?.change as MatrixSubchange | undefined)?.subchanges || []
  return subchanges
    .filter(subchange => subchange.label === 'ADD_NODE')
    .slice(1)
    .some(subchange => !disabledIds.has(subchange.id))
}

function collectLinkedChangeIds(id: string) {
  const linked = new Set<string>()
  const stack = [id]

  while (stack.length) {
    const currentId = stack.pop()
    if (!currentId) continue
    const change = findChangeById(currentId)
    change?.linkedIds?.forEach(linkedId => {
      if (linkedId === id || linked.has(linkedId)) return
      linked.add(linkedId)
      stack.push(linkedId)
    })
  }

  return Array.from(linked)
}

function setChangeOwnActionEnabled(id: string, enabled: boolean) {
  const change = findChangeById(id)
  if (!change) return
  if (enabled) change.action?.redo?.()
  else change.action?.undo?.()
}

function setSubchangeEnabled(subchange: MatrixSubchange, enabled: boolean) {
  if (enabled) {
    subchange.action?.redo?.()
    subchange.subchanges?.forEach(child => setSubchangeEnabled(child, true))
  } else {
    if (subchange.subchanges?.length) {
      ;[...subchange.subchanges].reverse().forEach(child => setSubchangeEnabled(child, false))
    }
    subchange.action?.undo?.()
  }
}

function updateSubchangeNodeLine(subchanges: MatrixSubchange[], targetId: string, newLine: string, newName: string, eventTargetId?: string) {
  subchanges.forEach(subchange => {
    if (subchange.targetId === targetId && ['to', 'removed', 'ADD_NODE'].includes(subchange.label)) {
      subchange.value = newLine
    }
    if (eventTargetId === targetId && subchange.label === 'removed' && !subchange.targetId) {
      subchange.value = newName
    }
    if (subchange.subchanges?.length) {
      updateSubchangeNodeLine(subchange.subchanges, targetId, newLine, newName, eventTargetId)
    }
  })
}

function findLogicLabelSubchange(connection: { fromId: string, toId: string, label?: string, bundleId?: string }) {
  const parentEvent = findParentEvent('node', connection.fromId)
  if (!parentEvent) return

  const bundleId = connection.bundleId
  const isLogicValue = (value: string) => {
    const normalized = value.toLowerCase()
    return normalized === 'and' || normalized === 'or'
  }

  for (let i = parentEvent.subchanges.length - 1; i >= 0; i--) {
    const subchange = parentEvent.subchanges[i]
    if (!subchange?.subchanges?.length) continue

    for (let j = subchange.subchanges.length - 1; j >= 0; j--) {
      const nested = subchange.subchanges[j]
      if (!nested || nested.label !== 'link_label') continue
      if (bundleId && nested.targetId === bundleId) return nested
      if (!bundleId && isLogicValue(nested.value)) return nested
    }
  }
}

function addLogicLabelNodeSubchange(labelSubchange: MatrixSubchange, node: any, action?: MatrixChangeAction) {
  if (!labelSubchange.subchanges) labelSubchange.subchanges = []
  if (labelSubchange.subchanges.some(subchange => subchange.label === 'ADD_NODE' && subchange.targetId === node.id)) return

  const nestedAdd: MatrixSubchange = {
    id: nextId('sub'),
    label: 'ADD_NODE',
    value: readableNodeLine(node),
    targetId: node.id,
    action
  }

  labelSubchange.subchanges.push(nestedAdd)
  events.value = [...events.value]

  return nestedAdd
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
        event.subchanges.forEach(subchange => setSubchangeEnabled(subchange, true))
      } else {
        ;[...event.subchanges].reverse().forEach(subchange => setSubchangeEnabled(subchange, false))
        event.action?.undo?.()
      }
      return
    }

    const subchange = findChangeById(id) as MatrixSubchange | undefined
    if (!subchange) return
    setSubchangeEnabled(subchange, enabled)
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
    return addEvent({
      type: 'add',
      title: 'ADD_NODE',
      node: readableNodeLine(node),
      targetId: node.id,
      targetKind: 'node',
      action
    })
  }

  function recordLogicPlaceholderNodeAdded(node: any, connection: { fromId: string, toId: string, label?: string, bundleId?: string }, action?: MatrixChangeAction) {
    const labelSubchange = findLogicLabelSubchange(connection)

    if (!labelSubchange) return

    return addLogicLabelNodeSubchange(labelSubchange, node, action)
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

      updateSubchangeNodeLine(event.subchanges, targetId, newLine, newName, event.targetId)
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

  function recordNodeLabelTextChanged(node: any, value: string, action?: MatrixChangeAction, payload?: any) {
    addSubchange(ensureNodeParent(node), 'text', value || 'empty', action, undefined, payload)
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

  function recordDomainAdded(domain: any, action?: MatrixChangeAction) {
    addEvent({
      type: 'add',
      title: 'ADD_DOMAIN',
      node: readableDomainLine(domain),
      targetId: domain.id,
      targetKind: 'domain',
      action,
      subchanges: [
        {
          id: nextId('sub'),
          label: domain.type === 'session' ? 'session' : 'domain',
          value: readableDomainValue(domain),
          targetId: domain.id
        }
      ]
    })
  }

  function recordDomainDeleted(domain: any, action?: MatrixChangeAction) {
    addEvent({
      type: 'delete',
      title: 'DELETE_DOMAIN',
      node: readableDomainLine(domain),
      targetId: domain.id,
      targetKind: 'domain',
      action
    })
  }

  function disableDomainAddEvent(domainId: string) {
    const parentEvent = [...events.value].reverse().find(event => event.targetKind === 'domain' && event.targetId === domainId && event.type === 'add')
    if (parentEvent && !disabledChanges.value.has(parentEvent.id)) {
      const next = new Set(disabledChanges.value)
      next.add(parentEvent.id)
      parentEvent.subchanges.forEach(sub => {
        if (!next.has(sub.id)) next.add(sub.id)
      })
      disabledChanges.value = next
      
      parentEvent.subchanges.forEach(sub => setChangeEnabled(sub.id, false))
      setChangeEnabled(parentEvent.id, false)
    }
  }

  function recordDomainNodeChanged(domainId: string, nodeId: string, isAdded: boolean, nodeLabel: string) {
    const parentEvent = [...events.value].reverse().find(event => event.targetKind === 'domain' && event.targetId === domainId && event.type === 'add')
    if (!parentEvent) return
    
    addSubchange(parentEvent, isAdded ? 'node_added' : 'node_removed', nodeLabel, nodeId)
  }

  function getDomainState(domainId: string) {
    const parentEvent = [...events.value].reverse().find(event => event.targetKind === 'domain' && event.targetId === domainId && event.type === 'add')
    if (!parentEvent) return null

    if (disabledChanges.value.has(parentEvent.id)) return null

    const changerSub = parentEvent.subchanges.find(s => s.label === 'TYPE/SESSION_CHANGER')
    let lastActiveTo: any = undefined
    if (changerSub && changerSub.subchanges) {
      for (const sub of changerSub.subchanges) {
        if (sub.label === 'to' && !disabledChanges.value.has(sub.id)) {
          lastActiveTo = sub
        }
      }
    }

    if (lastActiveTo) {
      return lastActiveTo.value
    }

    const initialSub = parentEvent.subchanges.find(s => s.label === 'session' || s.label === 'domain')
    return initialSub ? initialSub.value : null
  }

  function recordDomainChanged(domain: any, value: string, action?: MatrixChangeAction) {
    const normalizedValue = value || readableDomainValue(domain)
    const parentEvent = ensureDomainParent(domain)
    parentEvent.node = readableDomainLine(domain)

    let changerSub = parentEvent.subchanges.find(s => s.label === 'TYPE/SESSION_CHANGER')
    if (!changerSub) {
      changerSub = addSubchange(parentEvent, 'TYPE/SESSION_CHANGER', 'TYPE/SESSION_CHANGER', domain.id)
    }

    if (changerSub) {
      if (!changerSub.subchanges) {
        changerSub.subchanges = []
      }

      const subId = nextId('sub')
      const nestedSub: MatrixSubchange = {
        id: subId,
        label: 'to',
        value: normalizedValue,
        targetId: domain.id,
        action,
        payload: { value: normalizedValue }
      }
      
      changerSub.subchanges.push(nestedSub)
      events.value = [...events.value]
    }
  }

  function recordConnectionLabelChanged(connection: { fromId: string, toId: string, label?: string, bundleId?: string }, label: string | null, action?: MatrixChangeAction, memberNode?: any, memberAction?: MatrixChangeAction) {
    const sourceNode = { id: connection.fromId, label: connection.fromId }
    const parentEvent = ensureNodeParent(sourceNode)
    const toSubchange = [...parentEvent.subchanges].reverse().find(s => s.label === 'to' && s.targetId === connection.toId)
    
    if (toSubchange) {
      if (!toSubchange.subchanges) toSubchange.subchanges = []
      const labelSubchange: MatrixSubchange = {
        id: nextId('sub'),
        label: 'link_label',
        value: label ? label.toUpperCase() : 'CLEAR',
        targetId: connection.bundleId || connectionId(connection),
        action
      }
      toSubchange.subchanges.push(labelSubchange)
      if (memberNode && (label?.toLowerCase() === 'and' || label?.toLowerCase() === 'or')) {
        addLogicLabelNodeSubchange(labelSubchange, memberNode, memberAction)
      }
      events.value = [...events.value]
    }
  }

  function removeLatestConnectionLabelChange(targetId: string) {
    for (let eventIndex = events.value.length - 1; eventIndex >= 0; eventIndex--) {
      const event = events.value[eventIndex]
      if (!event) continue

      for (let subIndex = event.subchanges.length - 1; subIndex >= 0; subIndex--) {
        const subchange = event.subchanges[subIndex]
        if (!subchange?.subchanges?.length) continue

        for (let nestedIndex = subchange.subchanges.length - 1; nestedIndex >= 0; nestedIndex--) {
          const nested = subchange.subchanges[nestedIndex]
          if (!nested || nested.label !== 'link_label' || nested.targetId !== targetId) continue

          const removedIds = [nested.id, ...collectDescendantChangeIds(nested.id)]
          removedIds.forEach(id => disabledChanges.value.delete(id))
          disabledChanges.value = new Set(disabledChanges.value)
          subchange.subchanges.splice(nestedIndex, 1)
          events.value = [...events.value]
          return true
        }
      }
    }

    return false
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
    collectDescendantChangeIds,
    collectLinkedChangeIds,
    getInitialLogicLabelAddNodeId,
    getLogicLabelParentIds,
    getParentLogicLabelId,
    hasEnabledLogicLabelAddNodes,
    isInitialLogicLabelAddNode,
    isLogicLabelAddNode,
    isLogicLabelChange,
    setChangeOwnActionEnabled,
    resetChanges,
    setChangeEnabled,
    disableNodeDependents,
    enableNodeDependents,
    recordNodeAdded,
    recordLogicPlaceholderNodeAdded,
    recordNodeDeleted,
    recordConnectionCreated,
    recordConnectionDeleted,
    recordStrategyVersionCreated,
    recordNodeIdentityChanged,
    recordNodeDirectionChanged,
    recordNodePhaseChanged,
    recordNodePriorityChanged,
    recordNodeDescriptionChanged,
    recordNodeLabelTextChanged,
    recordCommentAdded,
    recordCommentTextChanged,
    recordCommentRemoved,
    recordDomainAdded,
    recordDomainDeleted,
    disableDomainAddEvent,
    recordDomainNodeChanged,
    getDomainState,
    recordDomainChanged,
    recordConnectionLabelChanged,
    removeLatestConnectionLabelChange,
    updateConnectionAction
  }
}
