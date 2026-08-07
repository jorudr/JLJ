<template>
  <div class="gradflow-background" aria-hidden="true">
    <div ref="mountEl" class="gradflow-canvas"></div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { GradientConfigInput } from 'gradflow'
import type { Root } from 'react-dom/client'

type GradFlowPreset =
  | 'cosmic'
  | 'matrix'
  | 'electric'
  | 'inferno'
  | 'mystic'
  | 'cyber'
  | 'neon'
  | 'plasma'
  | 'dream'
  | 'borealis'

const props = defineProps<{
  config?: GradientConfigInput
  preset?: GradFlowPreset
}>()

const mountEl = ref<HTMLDivElement | null>(null)
let reactRoot: Root | null = null

onMounted(async () => {
  if (!mountEl.value) return

  const [{ createElement }, { createRoot }, { GradFlow }] = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('gradflow')
  ])

  if (!mountEl.value) return

  reactRoot = createRoot(mountEl.value)
  reactRoot.render(createElement(GradFlow, { config: props.config, preset: props.preset }))
})

onBeforeUnmount(() => {
  reactRoot?.unmount()
  reactRoot = null
})
</script>

<style scoped>
.gradflow-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  background: #020f12;
}

.gradflow-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.gradflow-canvas :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
