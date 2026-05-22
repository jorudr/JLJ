<template>
  <Transition name="slide-top" appear>
    <header v-if="isAssembled" class="fixed left-1/2 -translate-x-1/2 z-[60] w-full max-w-5xl px-8">
      <div class="glass-header flex justify-between items-center px-12 pt-10 pb-5 h-20">
        <div class="flex items-center space-x-6">
          <div class="w-10 h-10 border border-current/10 flex items-center justify-center relative group overflow-hidden">
            <span class="text-[9px] font-bold z-10">V.OS</span>
            <div class="absolute inset-0 bg-current/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
          </div>
          <div class="flex flex-col">
            <h1 class="text-sm font-serif tracking-[0.3em] font-medium italic text-current">Sacred Archive</h1>
            <span class="text-[7px] opacity-30 mt-1 tracking-[0.6em] text-current">System: 0x4A7F_REIFY</span>
          </div>
        </div>

        <nav class="flex space-x-12">
          <button v-for="link in links" :key="link" 
                  @click="$emit('update:activeTab', link)"
                  class="nav-tab-link relative py-1 transition-all duration-500 group"
                  :class="{ 'active': activeTab === link }">
            <span class="text-[10px] tracking-[0.4em] font-serif transition-colors" :class="activeTab === link ? 'text-current' : 'text-current/30 group-hover:text-current/60'">
              {{ link }}
            </span>
            <!-- Light Trail Underline -->
            <div class="absolute bottom-0 left-0 w-full h-[1px] bg-current opacity-10 overflow-hidden">
              <div class="h-full bg-current opacity-40 transition-transform duration-700 ease-out translate-x-[-100%]"
                   :class="{ 'translate-x-0': activeTab === link }"></div>
            </div>
          </button>
        </nav>

        <div class="flex items-center space-x-6">
           <div class="flex flex-col text-right">
              <span class="text-[10px] opacity-80 text-current">{{ auth.user?.displayName || 'guest' }}</span>
              <span class="text-[7px] opacity-40 tracking-widest font-mono text-current uppercase">ID: {{ auth.user?.uid?.slice(0, 8) || '00000000' }}</span>
           </div>
           
           <div class="w-8 h-8 rounded-full border border-current opacity-60 overflow-hidden">
              <img v-if="auth.user?.photoURL" :src="auth.user.photoURL" class="w-full h-full object-cover grayscale" />
              <div v-else class="w-full h-full bg-current opacity-20"></div>
           </div>

           <!-- Control Group -->
           <div class="flex items-center space-x-3 border-l border-current/10 pl-6 h-8">
              <!-- Reload Button -->
              <button @click="handleReload" 
                      class="flex items-center justify-center p-1.5 border border-current opacity-20 hover:opacity-100 transition-all group"
                      title="Reload System">
                <svg class="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 4v6h-6" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>

              <!-- Tesseract Toggle -->
              <button @click="$emit('update:isTesseractEnabled', !isTesseractEnabled)" 
                      class="flex items-center justify-center p-1.5 border border-current opacity-20 hover:opacity-100 transition-all group"
                      :title="isTesseractEnabled ? 'Disable Tesseract' : 'Enable Tesseract'">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M21 16.09v-8.18c0-1.02-.54-1.97-1.42-2.49L12.58 1.4c-.36-.21-.79-.21-1.15 0L4.41 5.42c-.88.52-1.42 1.47-1.42 2.49v8.18c0 1.02.54 1.97 1.42 2.49l7.01 4.02c.36.21.79.21 1.15 0l7.01-4.02c.88-.52 1.42-1.47 1.42-2.49z" />
                  <path d="M7.5 7L12 9.49 16.5 7M12 22V14.5M3.27 6.96L12 12.01l8.73-5.05" />
                </svg>
              </button>

              <!-- Theme Toggle -->
              <button @click="$emit('update:isDark', !isDark)" 
                      class="theme-toggle flex items-center justify-center p-1.5 border border-current dark:border-white/50 opacity-20 hover:opacity-100 transition-all">
                <svg v-if="isDark" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707" />
                  <circle cx="12" cy="12" r="5" />
                </svg>
                <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              </button>
           </div>
        </div>
      </div>
    </header>
  </Transition>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/entities/user/auth.store'

defineProps<{
  isAssembled: boolean
  activeTab: string
  isDark: boolean
  isTesseractEnabled: boolean
}>()

defineEmits<{
  (e: 'update:activeTab', value: string): void
  (e: 'update:isDark', value: boolean): void
  (e: 'update:isTesseractEnabled', value: boolean): void
}>()

const auth = useAuthStore()
const links = ['archive', 'forum', 'genesis', 'matrix']

const handleReload = () => {
  window.location.reload()
}
</script>

<style scoped>
.glass-header {
  background: rgba(var(--bg-primary-rgb), 0.05);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-primary);
}

.nav-tab-link.active .text-current { 
  font-weight: bold; 
}

.theme-toggle {
  cursor: pointer;
}

/* Slide Top Transition */
.slide-top-enter-active, 
.slide-top-leave-active {
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-top-enter-from, 
.slide-top-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
