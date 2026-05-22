<template>
  <div class="fixed inset-0 flex flex-col overflow-hidden">
    <Header class="shrink-0 transition z-50 mb-0" />
    <BoardMain class="flex-1" />
  </div>
</template>

<script setup lang="ts">
import Header from '@/widgets/header/ui/Header.vue'
import BoardMain from '@/widgets/board/ui/BoardMain.vue'

definePageMeta({
  public: true
})
</script>
