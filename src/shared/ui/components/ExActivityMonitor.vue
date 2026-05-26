<template>
  <div class="w-full h-full flex items-center justify-center p-8 md:p-16 relative">

    <!-- Activity Matrix Container -->
    <div class="w-full h-full bg-theme-bg/50 p-6 md:p-12 flex flex-col items-center justify-center overflow-hidden">
      
      <!-- The Grid Aspect Ratio Wrapper -->
      <div 
        class="grid grid-flow-col grid-rows-7 gap-[2px] md:gap-[4px]" 
        style="aspect-ratio: 52 / 7; width: 100%; max-height: 100%; height: auto;"
      >
        <ExTooltip v-for="n in 364" :key="n" position="top" :is-dark="isDark">
          <template #trigger>
            <div 
              class="w-full h-full border transition-all duration-700 rounded-[1px] md:rounded-sm bg-theme-text/5 border-black/15 dark:border-white/10 hover:bg-theme-text/20"
            ></div>
          </template>
          <template #default>
            <div class="flex flex-col space-y-1">
              <span class="font-black">Activity_Level: 0%</span>
              <span class="opacity-50">Archive_Date: --.--.----</span>
            </div>
          </template>
        </ExTooltip>
      </div>

    </div>

    <!-- Action Button (Absolute Bottom) -->
    <div class="absolute bottom-8 md:bottom-12 left-0 w-full flex justify-center pointer-events-none">
      <div class="pointer-events-auto">
        <ExButton variant="tactical">Initialize_Session</ExButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ExTooltip from '~/shared/ui/ExTooltip.vue'
import ExButton from '~/shared/ui/ExButton.vue'
import { useThemeStore } from '~/features/store/useTheme'

const emit = defineEmits(['exit'])

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.settings.isDark)

// Format function
</script>

<style scoped>
</style>
