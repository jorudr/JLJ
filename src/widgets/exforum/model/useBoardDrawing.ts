import { ref, computed } from 'vue'

export function useBoardDrawing() {
  const boardViewport = ref<HTMLElement | null>(null)
  
  const activeBoardStrokeId = ref<string | null>(null)
  const isBoardDrawingPointerDown = ref(false)
  const isBoardDrawingCursorVisible = ref(false)
  const boardDrawingCursor = ref({ x: 0, y: 0 })
  const boardDrawingTool = ref<'pencil' | 'eraser'>('pencil')
  const boardDrawingColor = ref('#000000') // Default to black
  const boardDrawingSize = ref(4)

  const boardDrawingCursorDiameter = computed(() => Math.max(10, boardDrawingSize.value * (boardDrawingTool.value === 'eraser' ? 2.8 : 2)))
  const boardDrawingSizePercent = computed(() => ((boardDrawingSize.value - 1) / 23) * 100)
  
  const boardDrawingCursorStyle = computed(() => ({
    width: `${boardDrawingCursorDiameter.value}px`,
    height: `${boardDrawingCursorDiameter.value}px`,
    transform: `translate(${boardDrawingCursor.value.x - boardDrawingCursorDiameter.value / 2}px, ${boardDrawingCursor.value.y - boardDrawingCursorDiameter.value / 2}px)`
  }))

  function setBoardDrawingSizeFromEvent(e: MouseEvent, track: HTMLElement) {
    const rect = track.getBoundingClientRect()
    let ratio = 0
    if (rect.height > rect.width) {
      // Vertical slider (usually bottom to top)
      ratio = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / Math.max(1, rect.height)))
    } else {
      // Horizontal slider (left to right)
      ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)))
    }
    boardDrawingSize.value = Math.round(1 + ratio * 23)
  }

  function startBoardDrawingSizeDrag(e: MouseEvent) {
    const track = e.currentTarget as HTMLElement
    setBoardDrawingSizeFromEvent(e, track)

    const move = (moveEvent: MouseEvent) => {
      setBoardDrawingSizeFromEvent(moveEvent, track)
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  function getBoardDrawingPoint(e: MouseEvent) {
    const board = boardViewport.value
    if (!board) return { x: 0, y: 0 }
    const rect = board.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100,
      y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100
    }
  }

  function updateBoardDrawingCursor(e: MouseEvent) {
    const board = boardViewport.value
    if (!board) return
    const rect = board.getBoundingClientRect()
    boardDrawingCursor.value = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    isBoardDrawingCursorVisible.value = true
  }

  function startBoardDrawing(e: MouseEvent, strokesArray: any[]) {
    // If the event target is a node, don't draw
    const target = e.target as HTMLElement
    if (target.closest('[data-board-node]')) return

    updateBoardDrawingCursor(e)
    isBoardDrawingPointerDown.value = true
    
    if (boardDrawingTool.value === 'eraser') {
      eraseBoardDrawingAtPoint(getBoardDrawingPoint(e), strokesArray)
      return
    }

    const stroke = {
      id: 'bs' + Date.now().toString(36),
      color: boardDrawingColor.value,
      size: boardDrawingSize.value,
      points: [getBoardDrawingPoint(e)]
    }
    
    strokesArray.push(stroke)
    activeBoardStrokeId.value = stroke.id
  }

  function moveBoardDrawing(e: MouseEvent, strokesArray: any[]) {
    updateBoardDrawingCursor(e)
    if (!isBoardDrawingPointerDown.value) return

    if (boardDrawingTool.value === 'eraser') {
      eraseBoardDrawingAtPoint(getBoardDrawingPoint(e), strokesArray)
      return
    }

    if (!activeBoardStrokeId.value) return
    const stroke = strokesArray.find((item: any) => item.id === activeBoardStrokeId.value)
    if (!stroke) return
    stroke.points.push(getBoardDrawingPoint(e))
  }

  function finishBoardDrawing() {
    activeBoardStrokeId.value = null
    isBoardDrawingPointerDown.value = false
    isBoardDrawingCursorVisible.value = false
  }

  function formatBoardDrawingStroke(stroke: any) {
    return (stroke.points || []).map((point: any) => `${point.x},${point.y}`).join(' ')
  }

  function eraseBoardDrawingAtPoint(point: { x: number; y: number }, strokesArray: any[]) {
    const boardRect = boardViewport.value?.getBoundingClientRect()
    const thresholdPx = Math.max(6, boardDrawingSize.value * 1.4)
    
    const nextStrokes: any[] = []

    strokesArray.forEach((stroke: any) => {
      let currentSegment: any[] = []

      ;(stroke.points || []).forEach((strokePoint: any) => {
        const dx = ((strokePoint.x - point.x) / 100) * (boardRect?.width || 1000)
        const dy = ((strokePoint.y - point.y) / 100) * (boardRect?.height || 1000)
        const shouldErasePoint = Math.sqrt(dx * dx + dy * dy) <= thresholdPx

        if (shouldErasePoint) {
          if (currentSegment.length > 1) {
            nextStrokes.push({
              ...stroke,
              id: 'bs' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
              points: currentSegment
            })
          }
          currentSegment = []
        } else {
          currentSegment.push(strokePoint)
        }
      })

      if (currentSegment.length > 1) {
        nextStrokes.push({
          ...stroke,
          id: 'bs' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          points: currentSegment
        })
      }
    })

    // Update original array by mutating it (clearing and pushing)
    strokesArray.length = 0
    strokesArray.push(...nextStrokes)
  }

  return {
    boardViewport,
    activeBoardStrokeId,
    isBoardDrawingPointerDown,
    isBoardDrawingCursorVisible,
    boardDrawingCursor,
    boardDrawingTool,
    boardDrawingColor,
    boardDrawingSize,
    boardDrawingCursorDiameter,
    boardDrawingSizePercent,
    boardDrawingCursorStyle,
    startBoardDrawingSizeDrag,
    startBoardDrawing,
    moveBoardDrawing,
    finishBoardDrawing,
    formatBoardDrawingStroke,
    updateBoardDrawingCursor
  }
}
