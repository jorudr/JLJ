<template>
  <div class="flex flex-col h-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="mb-12">
      <h3 class="text-[10px] font-mono tracking-[0.4em] uppercase text-theme-text opacity-40 mb-2">
        {{ locale === 'ru' ? '// Личные Данные' : '// Personal Data' }}
      </h3>
      <ExHeading level="h1" variant="cinematic" class="!text-4xl text-theme-text mb-4">
        {{ locale === 'ru' ? 'Идентификация' : 'Identification' }}
      </ExHeading>
      <div class="w-24 h-px bg-theme-text opacity-30"></div>
    </div>

    <form @submit.prevent="emit('save')" class="flex flex-col space-y-10 flex-grow">
      
      <!-- Nickname Field -->
      <div class="flex flex-col space-y-4 group">
        <label class="flex items-center space-x-3 text-[10px] font-mono tracking-widest uppercase text-theme-text opacity-50 group-hover:opacity-100 transition-opacity">
          <div class="w-1.5 h-1.5 border border-theme-text"></div>
          <span>{{ locale === 'ru' ? 'Позывной (Никнейм)' : 'Callsign (Nickname)' }}</span>
        </label>
        <div class="relative">
          <input 
            :value="displayName"
            @input="emit('update:displayName', ($event.target as HTMLInputElement).value)"
            type="text" 
            required 
            :placeholder="locale === 'ru' ? 'Введите позывной...' : 'Enter callsign...'"
            class="w-full bg-black/5 dark:bg-white/5 border border-theme-border p-5 pl-12 text-[14px] font-mono tracking-widest focus:outline-none focus:border-theme-text transition-all duration-300 text-theme-text placeholder:opacity-20 uppercase"
            :disabled="isSubmitting"
          />
          <div class="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">
            <svg class="w-4 h-4 text-theme-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
      </div>

      <!-- Description Field -->
      <div class="flex flex-col space-y-4 group">
        <label class="flex items-center space-x-3 text-[10px] font-mono tracking-widest uppercase text-theme-text opacity-50 group-hover:opacity-100 transition-opacity">
          <div class="w-1.5 h-1.5 bg-theme-text"></div>
          <span>{{ locale === 'ru' ? 'Досье (Описание)' : 'Dossier (Description)' }}</span>
        </label>
        <textarea 
          :value="description"
          @input="emit('update:description', ($event.target as HTMLTextAreaElement).value)"
          rows="6"
          :placeholder="locale === 'ru' ? 'Краткая сводка...' : 'Brief summary...'"
          class="w-full bg-black/5 dark:bg-white/5 border border-theme-border p-5 text-[13px] font-mono tracking-widest focus:outline-none focus:border-theme-text transition-all duration-300 text-theme-text placeholder:opacity-20 resize-none"
          :disabled="isSubmitting"
        ></textarea>
      </div>

      <!-- Feedback Messages -->
      <div class="min-h-[40px]">
        <Transition name="fade-quick">
          <div v-if="errorMessage" class="border border-red-500/40 bg-red-500/10 px-5 py-4 flex items-center space-x-3">
             <div class="w-2 h-2 bg-red-500 animate-pulse"></div>
            <span class="text-[10px] font-mono text-red-400 tracking-widest uppercase">{{ errorMessage }}</span>
          </div>
        </Transition>
        <Transition name="fade-quick">
          <div v-if="successMessage" class="border border-emerald-500/40 bg-emerald-500/10 px-5 py-4 flex items-center space-x-3">
             <div class="w-2 h-2 bg-emerald-500"></div>
            <span class="text-[10px] font-mono text-emerald-400 tracking-widest uppercase">{{ successMessage }}</span>
          </div>
        </Transition>
      </div>

      <!-- Actions -->
      <div class="mt-auto pt-8 flex items-center justify-end border-t border-theme-border">
        <button 
          type="submit" 
          :disabled="isSubmitting || !displayName.trim()"
          class="relative px-12 py-4 bg-theme-text text-theme-bg text-[10px] font-bold font-mono uppercase tracking-[0.3em] overflow-hidden group/btn hover:bg-theme-text/90 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <div class="absolute inset-0 bg-theme-bg/10 transform scale-x-0 group-hover/btn:scale-x-100 transition-transform duration-500 origin-left"></div>
          <span class="relative z-10 flex items-center space-x-3">
            <span>{{ isSubmitting ? (locale === 'ru' ? 'ОБРАБОТКА...' : 'PROCESSING...') : (locale === 'ru' ? 'ПРИНЯТЬ ИЗМЕНЕНИЯ' : 'APPLY CHANGES') }}</span>
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import ExHeading from '~/shared/ui/ExHeading.vue'
import { useI18n } from '~/shared/i18n/useI18n'

const props = defineProps<{
  displayName: string
  description: string
  isSubmitting: boolean
  errorMessage: string
  successMessage: string
}>()

const emit = defineEmits<{
  (e: 'update:displayName', val: string): void
  (e: 'update:description', val: string): void
  (e: 'save'): void
}>()

const { locale } = useI18n()
</script>

<style scoped>
.fade-quick-enter-active, .fade-quick-leave-active {
  transition: opacity 0.3s ease;
}
.fade-quick-enter-from, .fade-quick-leave-to { opacity: 0; }
</style>
