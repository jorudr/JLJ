import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useMatrixState } from './useMatrixState'

const STORAGE_KEY = 'ex_genesis_matrix_undo_buffer'
const MAX_HISTORY = 5

export function useExGenesisMatrixUndo() {
  const state = useMatrixState()
  const isUndoing = ref(false)

  const getBuffer = (): any[] => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const saveBuffer = (buffer: any[]) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(buffer))
  }

  const captureSnapshot = () => {
    return {
      rootNodes: JSON.parse(JSON.stringify(state.rootNodes.value)),
      rootConnections: JSON.parse(JSON.stringify(state.rootConnections.value)),
      rootZones: JSON.parse(JSON.stringify(state.rootZones.value)),
      treeEvents: JSON.parse(JSON.stringify(state.changeTree.events.value))
    }
  }

  const pushSnapshot = () => {
    if (isUndoing.value) return
    const buffer = getBuffer()
    const snapshot = captureSnapshot()
    
    if (buffer.length > 0) {
      const last = buffer[buffer.length - 1]
      if (JSON.stringify(last) === JSON.stringify(snapshot)) {
        return
      }
    }

    buffer.push(snapshot)
    // +1 because we need 5 PAST states + 1 CURRENT state = 6 total items in the stack
    if (buffer.length > MAX_HISTORY + 1) {
      buffer.shift()
    }
    saveBuffer(buffer)
  }

  const undo = () => {
    const buffer = getBuffer()
    if (buffer.length <= 1) return // Nothing to undo

    isUndoing.value = true
    
    // Pop the current state
    buffer.pop()
    saveBuffer(buffer)

    // Revert to previous state
    const previousState = buffer[buffer.length - 1]
    if (previousState) {
      state.rootNodes.value = previousState.rootNodes
      state.rootConnections.value = previousState.rootConnections
      state.rootZones.value = previousState.rootZones
      if (previousState.treeEvents) {
        state.changeTree.events.value = previousState.treeEvents
      }
      state.forceUpdate()
      state.saveMatrixData()
    }

    // Wait a brief moment to allow watchers to bypass this change
    setTimeout(() => {
      isUndoing.value = false
    }, 100)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const isUndo = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey
    
    if (isUndo) {
      const target = e.target as HTMLElement
      // Let native undo handle text inputs while they are focused
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return 
      }
      e.preventDefault()
      undo()
    }
  }

  let timeout: any = null
  watch(
    [state.rootNodes, state.rootConnections, state.rootZones],
    () => {
      if (isUndoing.value) return
      if (timeout) clearTimeout(timeout)
      // Debounce the saves to avoid recording intermediate drag states excessively
      timeout = setTimeout(() => {
        pushSnapshot()
      }, 300)
    },
    { deep: true }
  )

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    if (getBuffer().length === 0) {
      pushSnapshot()
    }
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    undo,
    pushSnapshot
  }
}
