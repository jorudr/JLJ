<template>
  <div class="absolute inset-0 h-full w-full overflow-hidden bg-transparent" />
</template>

<script setup lang="ts">
defineProps<{
  nodes: unknown[]
  links: unknown[]
  isDark?: boolean
  cacheKey?: string
  pnlMin?: number
  pnlMax?: number
}>()

defineEmits<{
  (event: 'node-click', payload: unknown): void
  (event: 'node-hover', node: unknown): void
  (event: 'ready'): void
}>()
</script>
