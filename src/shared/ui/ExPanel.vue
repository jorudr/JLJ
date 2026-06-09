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
      'relative w-full border border-black/10 dark:border-white/10 flex flex-col',
      variant === 'light' ? 'bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-md' : 'bg-white dark:bg-[#0a0a0a]',
      { 'p-0': noPadding },
      noShadow ? 'shadow-none dark:shadow-none' : 'shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.4)]'
    ]"
    :style="variant === 'light'
      ? {
          backdropFilter: 'blur(16px) saturate(140%)',
          WebkitBackdropFilter: 'blur(16px) saturate(140%)'
        }
      : undefined"
  >
    <template v-if="showCorners">
      <ExGothicCorners :variant="variant" :opacity="0.9" />
    </template>
    
    <div v-if="title || $slots.header || $slots.telemetry || telemetry" :class="[
      'flex items-center justify-between border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]',
      variant === 'light' ? 'px-3 py-1.5' : 'px-6 py-3'
    ]">
      <div v-if="variant !== 'light'" :class="['flex items-center', variant === 'light' ? 'space-x-2' : 'space-x-4']">
        <div :class="['bg-black dark:bg-white rotate-45', variant === 'light' ? 'w-[3px] h-[3px]' : 'w-1.5 h-1.5']"></div>
        <span :class="[
          'font-mono tracking-[0.4em] uppercase font-black text-black dark:text-white',
          variant === 'light' ? 'text-[6px]' : 'text-[9px]'
        ]">
          <slot name="header">{{ title }}</slot>
        </span>
      </div>
      <div class="flex items-center gap-4">
        <slot name="telemetry">
          <span v-if="telemetry" :class="[
            'font-mono tracking-[0.2em] opacity-40 uppercase text-black dark:text-white',
            variant === 'light' ? 'text-[5px]' : 'text-[8px]'
          ]">
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
