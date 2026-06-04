<script setup>
import { computed } from 'vue'
import ExGothicCorners from './ExGothicCorners.vue'

const props = defineProps({
  title: String,
  telemetry: String,
  showCorners: {
    type: Boolean,
    default: true
  },
  noPadding: {
    type: Boolean,
    default: false
  },
  noShadow: {
    type: Boolean,
    default: false
  },
  variant: {
    type: String,
    default: 'standard',
    validator: (v) => ['standard', 'light'].includes(v)
  }
})

const cornerAsset = computed(() => 
  props.variant === 'light' 
    ? '/assets/ui/gothic_corners_light_mask.png' 
    : '/assets/ui/gothic_corners_mask.png'
)

const cornerSize = computed(() => 
  props.variant === 'light' ? 'w-12 h-12' : 'w-20 h-20'
)

const topLeftClasses = computed(() => 
  props.variant === 'light' ? '-top-4 -left-4' : '-top-8 -left-8'
)

const bottomRightClasses = computed(() => 
  props.variant === 'light' ? '-bottom-4 -right-4' : '-bottom-8 -right-8'
)
</script>

<template>
  <div 
    :class="[
      'relative w-full bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 flex flex-col',
      { 'p-0': noPadding },
      noShadow ? 'shadow-none dark:shadow-none' : 'shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)]'
    ]"
  >
    <template v-if="showCorners">
      <ExGothicCorners :variant="variant" :opacity="0.9" />
    </template>
    
    <div v-if="title || $slots.header" class="flex items-center justify-between px-6 py-3 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
      <div class="flex items-center space-x-4">
        <div class="w-1.5 h-1.5 bg-black dark:bg-white rotate-45"></div>
        <span class="text-[9px] font-mono tracking-[0.4em] uppercase font-black text-black dark:text-white">
          <slot name="header">{{ title }}</slot>
        </span>
      </div>
      <div class="flex items-center gap-4">
        <slot name="telemetry">
          <span v-if="telemetry" class="text-[8px] font-mono tracking-[0.2em] opacity-40 uppercase text-black dark:text-white">
            {{ telemetry }}
          </span>
        </slot>
      </div>
    </div>

    <!-- Content Area -->
    <div :class="['flex-grow min-h-0 min-w-0 relative flex flex-col', noPadding ? '' : 'p-8']">
      <slot></slot>
    </div>

    <div v-if="$slots.footer" class="shrink-0 px-8 py-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] min-h-[72px] flex flex-col justify-center">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
