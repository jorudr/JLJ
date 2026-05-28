<template>
  <div class="w-full h-full flex flex-col items-center justify-center px-6 text-center space-y-8">
    <div class="flex flex-col items-center justify-center space-y-8 max-w-2xl">
      
      <svg class="w-16 h-16 text-theme-text opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      
      <ExHeading level="h2" variant="cinematic" class="!text-3xl md:!text-4xl uppercase tracking-[0.2em] text-theme-text opacity-80">
        {{ t('forum.moduleLocked') }}
      </ExHeading>
      
      <ExText variant="body" class="leading-relaxed opacity-60 text-theme-text whitespace-pre-wrap">
        {{ t('forum.description') }}
      </ExText>
      
      <div class="mt-8 px-8 py-3 border border-theme-border text-[10px] font-mono tracking-[0.4em] uppercase text-theme-text opacity-40">
        {{ t('forum.awaitingDeployment') }}
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import ExHeading from '~/shared/ui/ExHeading.vue'
import ExText from '~/shared/ui/ExText.vue'
import { useI18n } from '~/shared/i18n/useI18n'

const { t } = useI18n()
</script>
