<template>
  <ExTestCleanWorkspace />
</template>

<script setup>
import ExTestCleanWorkspace from '~/widgets/test-clean/ui/ExTestCleanWorkspace.vue'

definePageMeta({ 
  layout: false,
  key: route => 'workspace'
})
</script>
