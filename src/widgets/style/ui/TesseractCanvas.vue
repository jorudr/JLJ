<template>
  <canvas 
    ref="tesseractCanvas" 
    class="fixed inset-0 z-10 pointer-events-none opacity-[0.35] blur-[5px]"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useTesseract } from '../model/useTesseract'

const props = defineProps<{
  isDark: boolean
}>()

const tesseractCanvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animationId: number | null = null

const { vertices, edges, angles, speeds, rotate5DInPlace, project } = useTesseract()

// Pre-allocate buffers for transformation and projection
const transformedVertices = new Float32Array(32 * 5)
const projectedVertices = new Array(32).fill(null).map(() => ({ x: 0, y: 0, z: 0 }))
const cosValues = new Float32Array(10)
const sinValues = new Float32Array(10)

const handleResize = () => {
  if (tesseractCanvas.value) {
    tesseractCanvas.value.width = window.innerWidth
    tesseractCanvas.value.height = window.innerHeight
  }
}

const draw = () => {
  if (!ctx || !tesseractCanvas.value) return
  const { width, height } = tesseractCanvas.value
  ctx.clearRect(0, 0, width, height)
  
  const time = Date.now() * 0.0005
  
  // 1. Update angles and pre-calculate sin/cos for the frame
  for (let i = 0; i < 10; i++) {
    angles[i] = (angles[i]!) + (speeds[i]!) * (1.2 + Math.sin(time * (i + 1) * 0.7) * 0.8)
    cosValues[i] = Math.cos(angles[i]!)
    sinValues[i] = Math.sin(angles[i]!)
  }

  // 2. Reset transformedVertices buffer and apply rotations
  transformedVertices.set(vertices)
  for (let vIdx = 0; vIdx < 32; vIdx++) {
    const offset = vIdx * 5
    for (let pIdx = 0; pIdx < 10; pIdx++) {
      rotate5DInPlace(transformedVertices, offset, pIdx, cosValues[pIdx]!, sinValues[pIdx]!)
    }
    
    // 3. Project to 2D screen space
    const proj = project(transformedVertices, offset, width, height)
    projectedVertices[vIdx]!.x = proj.x
    projectedVertices[vIdx]!.y = proj.y
    projectedVertices[vIdx]!.z = proj.z
  }

  const strokeBase = props.isDark ? '255, 255, 255' : '44, 62, 80'
  
  // 4. Draw edges with depth-based opacity
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i]!
    const v1 = projectedVertices[edge[0]!]!
    const v2 = projectedVertices[edge[1]!]!
    
    const avgZ = (v1.z + v2.z) / 2
    const opacity = 0.25 + (avgZ + 175) / 350 * 0.75
    
    ctx.beginPath()
    ctx.moveTo(v1.x, v1.y)
    ctx.lineTo(v2.x, v2.y)
    ctx.strokeStyle = `rgba(${strokeBase}, ${opacity})`
    ctx.lineWidth = 0.8 + (avgZ + 175) / 350 * 1.2
    ctx.stroke()
  }
  
  animationId = requestAnimationFrame(draw)
}

const start = () => {
  if (animationId) cancelAnimationFrame(animationId)
  if (tesseractCanvas.value) {
    ctx = tesseractCanvas.value.getContext('2d', { alpha: true }) // Optimize context
    handleResize()
    draw()
  }
}

const stop = () => {
  if (animationId) cancelAnimationFrame(animationId)
  animationId = null
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  start()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stop()
})
</script>
