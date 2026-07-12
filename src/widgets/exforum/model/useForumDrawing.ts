import { ref, computed } from 'vue'
import type { JournalArticleBoardDrawingNode } from '~/entities/journal-article/types/journal-article.types'

export function useForumDrawing() {
  const fullscreenDrawingBoard = ref<HTMLElement | null>(null)
  
  const activeDrawingNode = ref<JournalArticleBoardDrawingNode | null>(null)
  const activeDrawingStrokeId = ref<string | null>(null)
  const isDrawingPointerDown = ref(false)
  const isDrawingCursorVisible = ref(false)
  const drawingCursor = ref({ x: 0, y: 0 })
  const drawingTool = ref<'brush' | 'eraser'>('brush')
  const drawingColor = ref('#000000') // Default to black
  const drawingSize = ref(4)

  const drawingCursorDiameter = computed(() => Math.max(10, drawingSize.value * (drawingTool.value === 'eraser' ? 2.8 : 2)))
  const drawingSizePercent = computed(() => ((drawingSize.value - 1) / 23) * 100)
  
  const drawingCursorStyle = computed(() => ({
    width: `${drawingCursorDiameter.value}px`,
    height: `${drawingCursorDiameter.value}px`,
    transform: `translate(${drawingCursor.value.x - drawingCursorDiameter.value / 2}px, ${drawingCursor.value.y - drawingCursorDiameter.value / 2}px)`
  }))

  function ensureDrawingParams(node: JournalArticleBoardDrawingNode) {
    if (!node.params) node.params = {}
    if (!Array.isArray(node.params.strokes)) node.params.strokes = []
  }

  function openDrawingFullscreen(node: JournalArticleBoardDrawingNode) {
    ensureDrawingParams(node)
    activeDrawingNode.value = node
  }

  function closeDrawingFullscreen() {
    activeDrawingNode.value = null
    activeDrawingStrokeId.value = null
    isDrawingPointerDown.value = false
    isDrawingCursorVisible.value = false
  }

  function clearDrawingFullscreen() {
    if (!activeDrawingNode.value) return
    ensureDrawingParams(activeDrawingNode.value)
    activeDrawingNode.value.params!.strokes = []
  }

  function setDrawingSizeFromEvent(e: MouseEvent, track: HTMLElement) {
    const rect = track.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)))
    drawingSize.value = Math.round(1 + ratio * 23)
  }

  function startDrawingSizeDrag(e: MouseEvent) {
    const track = e.currentTarget as HTMLElement
    setDrawingSizeFromEvent(e, track)

    const move = (moveEvent: MouseEvent) => {
      setDrawingSizeFromEvent(moveEvent, track)
    }
    const stop = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
  }

  function getFullscreenDrawingPoint(e: MouseEvent) {
    const board = fullscreenDrawingBoard.value
    if (!board) return { x: 0, y: 0 }
    const rect = board.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100))
    }
  }

  function updateDrawingCursor(e: MouseEvent) {
    const board = fullscreenDrawingBoard.value
    if (!board) return
    const rect = board.getBoundingClientRect()
    drawingCursor.value = {
      x: Math.max(0, Math.min(rect.width, e.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, e.clientY - rect.top))
    }
    isDrawingCursorVisible.value = true
  }

  function startFullscreenDrawing(e: MouseEvent) {
    if (!activeDrawingNode.value) return
    ensureDrawingParams(activeDrawingNode.value)
    updateDrawingCursor(e)
    isDrawingPointerDown.value = true
    if (drawingTool.value === 'eraser') {
      eraseDrawingAtPoint(getFullscreenDrawingPoint(e))
      return
    }
    const stroke = {
      id: 's' + Date.now().toString(36),
      color: drawingColor.value,
      size: drawingSize.value,
      points: [getFullscreenDrawingPoint(e)]
    }
    activeDrawingNode.value.params!.strokes!.push(stroke)
    activeDrawingStrokeId.value = stroke.id
  }

  function moveFullscreenDrawing(e: MouseEvent) {
    if (!activeDrawingNode.value) return
    updateDrawingCursor(e)
    if (!isDrawingPointerDown.value) return
    if (drawingTool.value === 'eraser') {
      eraseDrawingAtPoint(getFullscreenDrawingPoint(e))
      return
    }
    if (!activeDrawingStrokeId.value) return
    const stroke = activeDrawingNode.value.params?.strokes?.find((item: any) => item.id === activeDrawingStrokeId.value)
    if (!stroke) return
    stroke.points.push(getFullscreenDrawingPoint(e))
  }

  function finishFullscreenDrawing() {
    if (!activeDrawingNode.value) return
    activeDrawingStrokeId.value = null
    isDrawingPointerDown.value = false
    isDrawingCursorVisible.value = false
  }

  function formatDrawingStroke(stroke: any) {
    return (stroke.points || []).map((point: any) => `${point.x},${point.y}`).join(' ')
  }

  function eraseDrawingAtPoint(point: { x: number; y: number }) {
    if (!activeDrawingNode.value?.params?.strokes) return
    const boardRect = fullscreenDrawingBoard.value?.getBoundingClientRect()
    const thresholdPx = Math.max(6, drawingSize.value * 1.4)
    const nextStrokes: any[] = []

    activeDrawingNode.value.params.strokes.forEach((stroke: any) => {
      let currentSegment: any[] = []

      ;(stroke.points || []).forEach((strokePoint: any) => {
        const dx = ((strokePoint.x - point.x) / 100) * (boardRect?.width || 1000)
        const dy = ((strokePoint.y - point.y) / 100) * (boardRect?.height || 1000)
        const shouldErasePoint = Math.sqrt(dx * dx + dy * dy) <= thresholdPx

        if (shouldErasePoint) {
          if (currentSegment.length > 1) {
            nextStrokes.push({
              ...stroke,
              id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
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
          id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          points: currentSegment
        })
      }
    })

    activeDrawingNode.value.params.strokes = nextStrokes
  }

  return {
    fullscreenDrawingBoard,
    activeDrawingStrokeId,
    isDrawingPointerDown,
    isDrawingCursorVisible,
    drawingCursor,
    drawingTool,
    drawingColor,
    drawingSize,
    activeDrawingNode,
    drawingCursorDiameter,
    drawingSizePercent,
    drawingCursorStyle,
    openDrawingFullscreen,
    closeDrawingFullscreen,
    clearDrawingFullscreen,
    startDrawingSizeDrag,
    startFullscreenDrawing,
    moveFullscreenDrawing,
    finishFullscreenDrawing,
    formatDrawingStroke
  }
}
