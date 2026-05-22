<template>
  <div @click="handleNodeClick"
       class="journal-node group relative py-8 border-b border-current/10 transition-all duration-700 hover:bg-current/[0.02] cursor-pointer">
    <div class="flex flex-col space-y-4">
      <!-- Metadata Rail -->
      <div class="flex items-center justify-between text-[7px] font-mono tracking-[0.4em] opacity-40 uppercase">
        <div class="flex items-center space-x-4">
          <span>ID//{{ node.id.slice(-4).toUpperCase() }}</span>
          <span class="w-1 h-1 bg-current opacity-20"></span>
          <span>{{ node.category }}</span>
        </div>
        <span>{{ node.lastActivityAt.slice(11, 16) }} UTC</span>
      </div>

      <!-- Main Headline -->
      <h3 class="text-2xl font-serif italic text-current opacity-90 leading-tight tracking-tight group-hover:opacity-100 transition-opacity">
        {{ node.title }}
      </h3>

      <!-- Content Snippet -->
      <div class="flex-grow">
        <!-- Setup: Technical Ledger -->
        <div v-if="node.mode === 'SETUP'" class="my-4 py-4 border-y border-current/5 flex items-center space-x-12">
          <div class="flex flex-col">
            <span class="text-[6px] font-mono opacity-20 uppercase tracking-widest">Pricing Pillar</span>
            <span class="text-lg font-mono opacity-60">{{ node.setupLevels?.tp }}</span>
          </div>
          <div class="flex flex-col border-l border-current/5 pl-12">
            <span class="text-[6px] font-mono opacity-20 uppercase tracking-widest">Risk Barrier</span>
            <span class="text-lg font-mono opacity-60">{{ node.setupLevels?.sl }}</span>
          </div>
        </div>

        <!-- Research: Metric Index -->
        <div v-if="node.mode === 'RESEARCH'" class="my-4 flex flex-wrap gap-x-8 gap-y-2">
          <div v-for="metric in node.metrics" :key="metric.label" class="flex items-center space-x-3">
            <span class="text-[8px] font-serif italic opacity-40">{{ metric.label }}</span>
            <span class="text-[10px] font-mono opacity-60">{{ metric.value }}%</span>
          </div>
        </div>

        <!-- Lesson: Protocol Steps -->
        <div v-if="node.mode === 'LESSON'" class="my-4 flex items-center space-x-6 overflow-hidden">
          <div v-for="(step, sIdx) in node.steps?.slice(0, 3)" :key="sIdx" class="flex items-center space-x-4 shrink-0">
            <span class="text-[9px] font-mono opacity-20 leading-none">0{{ sIdx + 1 }}</span>
            <span class="text-[10px] font-serif italic opacity-50 uppercase tracking-widest">{{ step }}</span>
            <span v-if="sIdx < 2" class="w-4 h-px bg-current/10"></span>
          </div>
        </div>

        <p class="text-[11px] font-serif italic text-current/50 leading-relaxed tracking-wide mt-2 line-clamp-2">
          "{{ node.thesis_brief }}"
        </p>
      </div>

      <!-- Footer Telemetry -->
      <div class="flex items-center justify-end pt-4">
        <div class="flex items-center space-x-10 text-[9px] font-serif italic tracking-widest opacity-80">
          <span>{{ node.repliesCount }} Echoes</span>
          <span>{{ node.likesCount }} Affinity</span>
        </div>
      </div>
    </div>

    <!-- Decorative Corner Gauge -->
    <div class="absolute bottom-2 right-0 w-8 h-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
      <svg viewBox="0 0 100 100" class="w-full h-full fill-current">
        <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="none" stroke="currentColor" stroke-width="2"/>
        <circle cx="50" cy="50" r="10" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import type { ExNode } from '../model/exnode.types'

const props = defineProps<{
  node: ExNode
}>()

const router = useRouter()
const route = useRoute()

const handleNodeClick = () => {
  router.replace({
    query: {
      ...route.query,
      nodeId: props.node.id
    }
  })
}
</script>

<style scoped>
.journal-node {
  /* Newspaper style vertical spacing */
  margin-bottom: 0;
}

/* Custom underline that grows on hover */
h3 {
  position: relative;
  display: inline-block;
}

h3::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: currentColor;
  opacity: 0.2;
  transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.journal-node:hover h3::after {
  width: 100%;
}
</style>
