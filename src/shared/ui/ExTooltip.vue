<template>
  <div 
    class="relative inline-block"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    ref="triggerRef"
  >
    <!-- Trigger -->
    <slot name="trigger"></slot>
    
    <!-- Tooltip Content (Teleported to Body) -->
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div 
          v-if="isVisible"
          :style="tooltipStyle"
          class="fixed pointer-events-none z-[2147483647] transition-colors duration-500"
          :class="[isDark ? 'is-dark dark theme-dark' : 'theme-light']"
        >
          <!-- TACTICAL VARIANT -->
          <div v-if="variant === 'tactical'" class="border-2 border-theme-text p-7 shadow-[20px_20px_0_rgba(0,0,0,0.2)] min-w-[390px] relative text-theme-text"
               style="background-color: var(--theme-bg); opacity: 1 !important;">
            <div class="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-theme-text"></div>
            <div class="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-theme-text"></div>
            <div class="flex flex-col space-y-5">
              <h4 v-if="title" class="text-[17px] font-mono font-black uppercase tracking-[0.5em] text-theme-text border-b border-theme-border pb-3">{{ title }}</h4>
              <p class="text-[14px] font-mono leading-loose uppercase tracking-widest opacity-100">
                <slot></slot>
              </p>
            </div>
          </div>

          <!-- BASIC VARIANT -->
          <div v-else class="border border-theme-text/20 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] min-w-[300px] flex flex-col space-y-3 text-theme-text relative"
               style="background-color: var(--theme-bg); opacity: 1 !important;">
            <div v-if="title" class="flex items-center justify-between border-b border-theme-border pb-3">
              <span class="text-[12px] font-mono uppercase tracking-[0.3em] font-black">{{ title }}</span>
              <div class="w-2 h-2 bg-theme-accent rotate-45"></div>
            </div>
            <p class="text-[15px] font-mono leading-relaxed opacity-100">
              <slot></slot>
            </p>
            <!-- Stem -->
            <div class="w-3 h-3 border-r border-b border-theme-text/20 absolute -bottom-[6px]"
                 :style="{ backgroundColor: 'var(--theme-bg)', opacity: '1', ...stemStyle }"></div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  title: String,
  isDark: {
    type: Boolean,
    default: true
  },
  variant: {
    type: String,
    default: 'basic',
    validator: (v) => ['basic', 'tactical'].includes(v)
  },
  forceShow: {
    type: Boolean,
    default: false
  },
  scale: {
    type: Number,
    default: 1
  }
})

const isVisible = ref(false)
const triggerPos = ref({ x: 0, y: 0, width: 0, height: 0 })
const triggerRef = ref(null)

const handleMouseEnter = () => {
  if (triggerRef.value) {
    const rect = triggerRef.value.getBoundingClientRect()
    triggerPos.value = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    }
  }
  isVisible.value = true
}

const handleMouseLeave = () => isVisible.value = false

watch(() => props.forceShow, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      handleMouseEnter()
    }, 0)
  } else {
    handleMouseLeave()
  }
}, { immediate: true })

const tooltipStyle = computed(() => {
  // Center above the trigger element
  const centerX = triggerPos.value.x + (triggerPos.value.width / 2)
  const topY = triggerPos.value.y
  
  // Base width doubled (800 for tactical, 560 for basic)
  // Adjusted to 1.5x: 600 for tactical, 420 for basic
  const w = props.variant === 'tactical' ? 600 : 420
  const margin = 16
  
  // Center-align by default
  let left = centerX - (w / 2)
  
  // Strict viewport clamping
  if (left < margin) {
    left = margin
  } else if (left + w > window.innerWidth - margin) {
    left = window.innerWidth - w - margin
  }

  return {
    left: `${left}px`,
    top: `${topY}px`,
    width: `${w}px`,
    transform: `translateY(-100%) translateY(-20px) scale(${props.scale})`,
    transformOrigin: 'bottom center'
  }
})

const stemStyle = computed(() => {
  const centerX = triggerPos.value.x + (triggerPos.value.width / 2)
  const w = props.variant === 'tactical' ? 600 : 420
  const margin = 16
  let left = centerX - (w / 2)
  
  if (left < margin) {
    left = margin
  } else if (left + w > window.innerWidth - margin) {
    left = window.innerWidth - w - margin
  }

  const offset = centerX - left
  const clampedOffset = Math.max(16, Math.min(w - 16, offset))

  return {
    left: `${clampedOffset}px`,
    transform: 'translateX(-50%) rotate(45deg)'
  }
})
</script>

<style scoped>
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(-100%) translateY(-10px);
}
</style>
