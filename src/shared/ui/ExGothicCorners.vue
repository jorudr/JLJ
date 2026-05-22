<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'light',
    validator: (v) => ['standard', 'light'].includes(v)
  },
  opacity: {
    type: [Number, String],
    default: 0.5
  }
})

// Generate a unique ID to avoid mask collisions
const instanceId = Math.random().toString(36).substring(2, 9)

const cornerAsset = computed(() => 
  props.variant === 'light' 
    ? '/assets/ui/gothic_corners_light_mask.png' 
    : '/assets/ui/gothic_corners_mask.png'
)

const cornerSize = computed(() => 
  props.variant === 'light' ? 'w-8 h-8' : 'w-16 h-16'
)

const offsetClasses = computed(() => 
  props.variant === 'light' ? '-m-2' : '-m-6'
)
</script>

<template>
  <div class="absolute inset-0 pointer-events-none overflow-visible z-50">
    <!-- Top-Left -->
    <div :class="['absolute top-0 left-0 text-current', cornerSize, offsetClasses]" :style="{ opacity }">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <mask :id="`corner-tl-${instanceId}`">
            <image :href="cornerAsset" x="0" y="0" width="200%" height="200%" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="currentColor" :mask="`url(#corner-tl-${instanceId})`" />
      </svg>
    </div>

    <!-- Bottom-Right -->
    <div :class="['absolute bottom-0 right-0 text-current rotate-180', cornerSize, offsetClasses]" :style="{ opacity }">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <mask :id="`corner-br-${instanceId}`">
            <image :href="cornerAsset" x="-100%" y="-100%" width="200%" height="200%" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="currentColor" :mask="`url(#corner-br-${instanceId})`" />
      </svg>
    </div>
  </div>
</template>
