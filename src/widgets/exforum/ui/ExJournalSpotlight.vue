<template>
  <div class="journal-spotlight group cursor-pointer" @click="$emit('click')">
    <div class="flex flex-col space-y-8">
      <!-- Spotlight Header -->
      <div class="flex items-center space-x-4 text-[8px] font-mono tracking-widest opacity-30 uppercase">
        <div class="flex items-center space-x-2">
           <div class="w-1.5 h-1.5 bg-current opacity-40 transform rotate-45"></div>
           <span>Featured_Analysis</span>
        </div>
        <span class="w-1 h-px bg-current opacity-10 flex-grow"></span>
        <span>Node//{{ node.id.slice(-4).toUpperCase() }}</span>
      </div>

      <!-- Main Headline -->
      <h2 class="text-5xl lg:text-6xl font-serif italic text-current leading-[1.02] tracking-tighter group-hover:opacity-80 transition-opacity duration-700">
        {{ node.title }}
      </h2>

      <!-- Abstract -->
      <p class="text-xl font-serif italic text-current/50 leading-relaxed line-clamp-3 max-w-3xl">
        "{{ node.thesis_brief }}"
      </p>

      <!-- Footer Info -->
      <div class="flex items-center justify-between border-t border-current/10 pt-8">
        <div class="flex items-center space-x-12 text-[10px] font-serif italic opacity-70 tracking-wide">
          <span class="flex items-center space-x-2">
            <span class="opacity-30">ECHOES:</span> {{ node.repliesCount }}
          </span>
          <span class="flex items-center space-x-2">
            <span class="opacity-30">AFFINITY:</span> {{ node.likesCount }}
          </span>
        </div>
        
        <div class="flex items-center space-x-4 group-hover:translate-x-2 transition-transform duration-700">
          <span class="text-[9px] font-mono tracking-[0.4em] opacity-30 uppercase group-hover:opacity-100">Access_Node</span>
          <span class="text-2xl opacity-20 group-hover:opacity-100 pb-1">→</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExNode } from '../../../entities/exnode/model/exnode.types'

defineProps<{
  node: ExNode
}>()

defineEmits(['click'])
</script>

<style scoped>
.journal-spotlight {
  transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

h2 {
  font-feature-settings: "ss01", "ss02", "cv01";
}
</style>
