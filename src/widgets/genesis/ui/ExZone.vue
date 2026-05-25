<template>
  <div class="absolute border pointer-events-none group text-nier-text-light dark:text-nier-text-dark"
       :style="zoneStyle">
    
    <!-- Zone Content / Patterns -->
    <div class="absolute inset-0 overflow-hidden -z-10 transition-colors duration-500"
         :style="{ backgroundColor: zoneColors, opacity: 0.12 }">
       <div v-if="zone.type === 'in-trade'" class="w-full h-full diagonal-hatch opacity-20"></div>
       <div v-if="zone.type === 'exit'" class="w-full h-full grid-pattern opacity-20"></div>
       <div v-if="zone.type === 'session'" class="w-full h-full vertical-scan opacity-10"></div>
    </div>

    <!-- Telemetry Header & Controls (2x Buffer) -->
    <div class="absolute -top-[56px] left-0 flex items-center space-x-4 pointer-events-auto z-10">
       <button @click.stop="$emit('remove', zone.id)"
               class="tactical-button w-[48px] h-[48px] border-[2px] border-current/20 flex items-center justify-center hover:bg-nier-text-light dark:hover:bg-nier-text-dark hover:text-nier-white dark:hover:text-nier-black transition-all text-[16px] font-mono opacity-40 hover:opacity-100">
          X
       </button>
       
       <button @click.stop="$emit('cycle-type', zone.id)"
               class="tactical-button px-[24px] h-[48px] border-[2px] border-current/20 flex items-center justify-center hover:bg-nier-text-light dark:hover:bg-nier-text-dark hover:text-nier-white dark:hover:text-nier-black transition-all text-[16px] font-mono opacity-40 hover:opacity-100 uppercase tracking-widest whitespace-nowrap">
          {{ zone.type }}
       </button>

       <div class="w-[16px] h-[16px] rotate-45 border-[2px] border-current opacity-40 ml-4"></div>
       
       <!-- Temporal Icon -->
       <svg v-if="zone.type === 'session'" class="w-[24px] h-[24px] opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <circle cx="12" cy="12" r="10" />
         <path d="M12 6v6l4 2" />
       </svg>

       <span class="text-[18px] font-mono tracking-[0.4em] uppercase opacity-40 group-hover:opacity-100 transition-opacity whitespace-nowrap">
         {{ zone.type === 'session' ? localizedSessionLabel : zone.label }}
       </span>
    </div>

    <!-- Drag Handle -->
    <button class="tactical-button absolute top-2 left-2 w-6 h-6 cursor-move pointer-events-auto z-20 border border-current/25 bg-nier-white/70 dark:bg-nier-black/70 flex items-center justify-center opacity-45 hover:opacity-100 hover:bg-nier-text-light dark:hover:bg-nier-text-dark hover:text-nier-white dark:hover:text-nier-black transition-all"
            aria-label="Move zone with contents"
            @mousedown.stop.prevent="$emit('drag-start', $event)">
       <span class="grid grid-cols-2 gap-[3px]">
         <span v-for="i in 4" :key="i" class="w-[3px] h-[3px] bg-current"></span>
       </span>
    </button>

    <!-- Resize Handle -->
    <div class="tactical-button absolute bottom-0 right-0 w-[32px] h-[32px] cursor-nwse-resize pointer-events-auto flex items-end justify-end p-[2px] z-10"
         @mousedown.stop="$emit('resize-start', $event)">
       <div class="w-[12px] h-[12px] border-b-[2px] border-r-[2px] border-current opacity-60 hover:opacity-100 transition-opacity"></div>
    </div>

    <!-- Discard Button removed from here, moved to header -->

    <!-- Aesthetic Borders -->
    <div class="absolute top-0 left-0 w-[32px] h-[2px] bg-current opacity-20"></div>
    <div class="absolute top-0 left-0 w-[2px] h-[32px] bg-current opacity-20"></div>
    <div class="absolute bottom-0 right-0 w-[32px] h-[2px] bg-current opacity-20"></div>
    <div class="absolute bottom-0 right-0 w-[2px] h-[32px] bg-current opacity-20"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Zone {
  id: string
  type: 'entry' | 'in-trade' | 'exit' | 'session'
  x: number
  y: number
  width: number
  height: number
  label: string
}

const props = defineProps<{
  zone: Zone
  scale: number
}>()

defineEmits(['drag-start', 'resize-start', 'remove', 'cycle-type'])

const sessionReferences: Record<string, { start: number, end: number }> = {
  SYDNEY: { start: 21, end: 6 },
  TOKYO: { start: 0, end: 9 },
  LONDON: { start: 8, end: 17 },
  NEW_YORK: { start: 13, end: 22 }
}

const localizedSessionLabel = computed(() => {
  if (props.zone.type !== 'session') return props.zone.label
  
  const ref = sessionReferences[props.zone.label]
  if (!ref) return props.zone.label
  
  const offset = -new Date().getTimezoneOffset() / 60
  const formatTime = (hour: number) => {
    const localHour = (hour + (offset || 0) + 24) % 24
    const h = Math.floor(localHour)
    const m = Math.round((localHour - h) * 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }
  
  const offsetValue = offset || 0
  const offsetLabel = offsetValue === 0 ? 'GMT' : `GMT${offsetValue >= 0 ? '+' : ''}${offsetValue}`
  
  return `${props.zone.label} (${formatTime(ref.start)} - ${formatTime(ref.end)}) [${offsetLabel}]`
})

const sessionPalette = {
  SYDNEY: 'rgba(46, 204, 113, 0.15)',   // Soft Emerald
  TOKYO: 'rgba(155, 89, 182, 0.15)',    // Muted Amethyst
  LONDON: 'rgba(52, 152, 219, 0.15)',   // Sky Archive Blue
  NEW_YORK: 'rgba(230, 126, 34, 0.15)',  // Dust Orange
  DEFAULT: 'rgba(44, 44, 42, 0.05)'
}

const zoneColors = computed(() => {
  const isDark = document.documentElement.classList.contains('dark')
  const base = {
    entry: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(44, 44, 42, 0.05)',
    'in-trade': isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(44, 44, 42, 0.03)',
    exit: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(44, 44, 42, 0.08)'
  }
  
  if (props.zone.type === 'session') {
    return sessionPalette[props.zone.label as keyof typeof sessionPalette] || sessionPalette.DEFAULT
  }
  return base[props.zone.type as keyof typeof base]
})

const zoneStyle = computed(() => {
  const borderStyles = {
    entry: '2px dashed currentColor',
    'in-trade': '2px dashed currentColor',
    exit: '2px dashed currentColor',
    session: `1.6px solid ${zoneColors.value.replace('0.15', '0.4').replace('0.05', '0.4')}`
  }

  return {
    left: `${props.zone.x}px`,
    top: `${props.zone.y}px`,
    width: `${props.zone.width}px`,
    height: `${props.zone.height}px`,
    border: borderStyles[props.zone.type]
  }
})
</script>

<style scoped>
.diagonal-hatch {
  background: repeating-linear-gradient(
    45deg,
    currentColor,
    currentColor 1px,
    transparent 1px,
    transparent 10px
  );
}

.grid-pattern {
  background-image: radial-gradient(currentColor 0.5px, transparent 0.5px);
  background-size: 10px 10px;
}

.vertical-scan {
  background: repeating-linear-gradient(
    90deg,
    currentColor,
    currentColor 1px,
    transparent 1px,
    transparent 40px
  );
}
</style>
