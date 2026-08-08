<template />

<script setup lang="ts">
import { onMounted } from 'vue'

defineProps<{
  nodes?: unknown[]
  links?: unknown[]
  isDark?: boolean
  cacheKey?: string
  pnlMin?: number
  pnlMax?: number
}>()

const emit = defineEmits<{
  (event: 'ready'): void
}>()

onMounted(() => emit('ready'))
</script>
