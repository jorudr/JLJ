<template>
  <div class="w-64 border-r border-theme-border bg-theme-bg/60 backdrop-blur-md flex flex-col justify-between p-8 relative">
    
    <!-- Decorative Corner Top-Left -->
    <div class="absolute top-0 left-0 w-8 h-8 border-t border-l border-theme-text opacity-30 pointer-events-none"></div>

    <div class="flex flex-col space-y-12">
      <!-- Title Area -->
      <div class="flex flex-col space-y-2">
        <div class="flex items-center space-x-3">
          <div class="w-2 h-2 bg-theme-text shadow-[0_0_8px_rgba(255,255,255,0.4)] animate-pulse"></div>
          <ExHeading level="h2" variant="cinematic" class="!text-lg uppercase tracking-[0.3em] !mb-0 text-theme-text">{{ t('PROFILE') }}</ExHeading>
        </div>
        <div class="h-px w-12 bg-theme-border mt-2"></div>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex flex-col space-y-2">
        <button 
          @click="emit('update:activeTab', 'PROFILE')"
          class="flex items-center space-x-4 py-3 px-4 border text-[10px] font-mono uppercase tracking-[0.3em] transition-all duration-500 relative group overflow-hidden"
          :class="activeTab === 'PROFILE' ? 'border-theme-text text-theme-bg bg-theme-text font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-transparent text-theme-text opacity-50 hover:opacity-100 hover:border-theme-border'"
        >
          <span class="relative z-10">{{ t('PROFILE') }}</span>
        </button>

        <button 
          @click="emit('update:activeTab', 'APPEARANCE')"
          class="flex items-center space-x-4 py-3 px-4 border text-[10px] font-mono uppercase tracking-[0.3em] transition-all duration-500 relative group overflow-hidden"
          :class="activeTab === 'APPEARANCE' ? 'border-theme-text text-theme-bg bg-theme-text font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)]' : 'border-transparent text-theme-text opacity-50 hover:opacity-100 hover:border-theme-border'"
        >
          <span class="relative z-10">{{ t('APPEARANCE') }}</span>
        </button>
      </nav>
    </div>

    <!-- Bottom Actions -->
    <div class="flex flex-col space-y-4 pt-8 border-t border-theme-border">
      <button 
        @click="emit('navigate-back')"
        class="flex items-center space-x-3 text-[9px] font-mono uppercase tracking-widest text-theme-text opacity-50 hover:opacity-100 transition-opacity"
      >
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>{{ t('DASHBOARD') }}</span>
      </button>

      <button 
        @click="emit('sign-out')"
        class="flex items-center space-x-3 text-[9px] font-mono uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
      >
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>{{ t('SIGN_OUT') }}</span>
      </button>
    </div>

    <!-- Decorative Corner Bottom-Right -->
    <div class="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-theme-text opacity-30 pointer-events-none"></div>
  </div>
</template>

<script setup lang="ts">
import ExHeading from '~/shared/ui/ExHeading.vue'
import type { ProfileTab } from '../model/useProfile'
import { useI18n } from '~/shared/i18n/useI18n'

const props = defineProps<{
  activeTab: ProfileTab
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', tab: ProfileTab): void
  (e: 'sign-out'): void
  (e: 'navigate-back'): void
}>()

const { locale } = useI18n()

// Simple helper for translations since we don't know the exact keys
const t = (key: string) => {
  if (locale.value === 'ru') {
    switch(key) {
      case 'PROFILE': return 'ПРОФИЛЬ'
      case 'APPEARANCE': return 'ОФОРМЛЕНИЕ'
      case 'DASHBOARD': return 'ВЕРНУТЬСЯ НА БАЗУ'
      case 'SIGN_OUT': return 'ВЫЙТИ ИЗ СИСТЕМЫ'
      default: return key
    }
  }
  return key
}
</script>

<style scoped>
/* Inherit from parent ethereal-void */
</style>
