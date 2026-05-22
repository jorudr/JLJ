<template>
  <div 
    class="relative inline-block"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousemove="handleMouseMove"
    ref="triggerRef"
  >
    <!-- Trigger -->
    <slot name="trigger"></slot>
    
    <!-- Non-Tactical Tooltip Content (Teleported to Body) -->
    <Teleport to="body">
      <Transition name="nt-tooltip-fade">
        <div 
          v-if="isVisible"
          ref="tooltipRef"
          :style="tooltipStyle"
          class="fixed pointer-events-none z-[2147483647]"
        >
          <div class="border border-nier-text-light/30 dark:border-nier-text-dark/30 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] min-w-[320px] max-w-[450px] flex flex-col space-y-4 text-nier-text-light dark:text-nier-text-dark relative bg-nier-white dark:bg-nier-black">
            <div v-if="title" class="flex items-center justify-between border-b border-nier-border-light dark:border-nier-border-dark pb-3">
              <span class="text-[10px] font-mono uppercase tracking-[0.4em] font-black">{{ title }}</span>
              <div class="w-2 h-2 bg-theme-accent rotate-45"></div>
            </div>
            <div class="text-[12px] font-mono leading-relaxed opacity-100">
              <slot></slot>
            </div>
          </div>
          <!-- Tooltip Stem -->
          <div class="w-3 h-3 border-r border-b border-nier-text-light/30 dark:border-nier-text-dark/30 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-nier-white dark:bg-nier-black"
               :style="stemStyle"></div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'

const props = defineProps<{
  title?: string
}>()

const isVisible = ref(false)
const mousePos = ref({ x: 0, y: 0 })
const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const horizontalOffset = ref(0)

const handleMouseEnter = () => {
  isVisible.value = true
  horizontalOffset.value = 0
}

const handleMouseLeave = () => {
  isVisible.value = false
}

const handleMouseMove = (e: MouseEvent) => {
  mousePos.value = { x: e.clientX, y: e.clientY }
  
  if (isVisible.value) {
    nextTick(() => {
      if (tooltipRef.value) {
        const rect = tooltipRef.value.getBoundingClientRect()
        const padding = 20
        
        let offset = 0
        if (rect.left < padding) {
          offset = padding - rect.left
        } else if (rect.right > window.innerWidth - padding) {
          offset = (window.innerWidth - padding) - rect.right
        }
        
        horizontalOffset.value += offset
      }
    })
  }
}

const tooltipStyle = computed(() => {
  return {
    left: `${mousePos.value.x + horizontalOffset.value}px`,
    top: `${mousePos.value.y}px`,
    transform: 'translate(-50%, -100%) translateY(-24px)',
    transition: 'left 0.1s ease-out'
  }
})

const stemStyle = computed(() => {
  return {
    left: `calc(50% - ${horizontalOffset.value}px)`
  }
})
</script>

<style scoped>
.nt-tooltip-fade-enter-active,
.nt-tooltip-fade-leave-active {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.nt-tooltip-fade-enter-from,
.nt-tooltip-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -100%) translateY(-10px) scale(0.95);
}
</style>
