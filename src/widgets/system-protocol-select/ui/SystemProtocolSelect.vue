<template>
  <div class="relative flex flex-col z-[200]">
    <!-- The Button -->
    <div class="flex items-center space-x-6 px-8 py-4 bg-white/5 dark:bg-black/5 border border-black/10 dark:border-white/10 relative group/hud backdrop-blur-md pointer-events-auto cursor-pointer"
         @click="showStrategyMenu = !showStrategyMenu">
       <!-- Corner Decor -->
       <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-black/30 dark:border-white/30"></div>
       <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-black/30 dark:border-white/30"></div>

       <div class="flex flex-col min-w-[220px] py-1">
          <span class="text-[7px] font-mono opacity-50 uppercase tracking-[0.5em] font-bold text-black dark:text-white">{{ t('genesis.virtualLog.systemProtocolSelect') || 'SYSTEM_PROTOCOL_SELECT' }}</span>
          <div class="flex items-center justify-between mt-1">
             <div class="flex items-center gap-3">
                <div class="w-1.5 h-1.5 bg-black dark:bg-white rotate-45 animate-pulse"></div>
                <span class="text-[11px] font-mono tracking-[0.3em] uppercase font-black leading-tight text-black dark:text-white" :class="isLoading ? 'animate-pulse' : ''">
                  {{ isLoading ? (t('genesis.virtualLog.loadingProtocol') || 'LOADING_PROTOCOL...') : (selectedStrategyName || 'MAIN_DIARY') }}
                </span>
             </div>
             <div class="w-2 h-2 border-b-2 border-r-2 border-black/60 dark:border-white/60 rotate-45 ml-4 transition-transform duration-500" :class="showStrategyMenu ? '-rotate-[135deg] translate-y-1' : ''"></div>
          </div>
       </div>
    </div>

    <!-- The Dropdown Menu -->
    <Transition name="protocol-slide">
      <div class="absolute w-80 z-[200] pointer-events-auto" :class="menuPositionClass" v-if="showStrategyMenu">
        <ExPanel variant="light" :no-padding="true" :no-shadow="true" :show-corners="true" class="!border-black/20 dark:!border-white/20">
         <!-- Topbar -->
         <div class="flex items-center justify-between px-3 py-1.5 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
         </div>

         <div class="max-h-80 overflow-y-auto custom-scrollbar py-2">
            <div v-for="s in strategies" :key="s.id" 
                 @click.stop="selectStrategy(s)" 
                 class="group/item relative px-8 py-4 cursor-pointer transition-all duration-300"
                 :class="modelValue === s.id ? 'bg-black dark:bg-white' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'">
               
               <div v-if="modelValue === s.id" class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white dark:bg-black rotate-45 ml-4"></div>
               
               <span class="relative z-10 text-[10px] font-mono tracking-[0.3em] uppercase font-bold transition-colors duration-300"
                     :class="modelValue === s.id ? 'text-white dark:text-black' : 'text-black/50 dark:text-white/50 group-hover/item:text-black dark:group-hover/item:text-white'">
                  {{ s.name }}
               </span>
               <div class="absolute bottom-0 left-0 h-px bg-black dark:bg-white w-0 group-hover/item:w-full transition-all duration-500 opacity-20"></div>
            </div>
         </div>
        </ExPanel>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from '~/shared/i18n/useI18n'
import ExPanel from '~/shared/ui/ExPanel.vue'
import type { Strategy } from '../models/types'

const props = withDefaults(defineProps<{
  modelValue: string | null
  strategies: Strategy[]
  isLoading?: boolean
  menuPosition?: 'top' | 'bottom'
}>(), {
  isLoading: false,
  menuPosition: 'bottom'
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const { t } = useI18n()
const showStrategyMenu = ref(false)

const selectedStrategyName = computed(() => {
  const strat = props.strategies.find(s => s.id === props.modelValue)
  return strat ? strat.name : null
})

const menuPositionClass = computed(() => {
  return props.menuPosition === 'top' ? 'bottom-full mb-6' : 'top-full mt-6'
})

const selectStrategy = (s: Strategy) => {
  emit('update:modelValue', s.id)
  showStrategyMenu.value = false
}
</script>
