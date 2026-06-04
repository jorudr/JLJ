<template>
  <div class="flex flex-col h-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="mb-12">
      <h3 class="text-[10px] font-mono tracking-[0.4em] uppercase text-theme-text opacity-40 mb-2">
        {{ locale === 'ru' ? '// Интерфейс' : '// Interface' }}
      </h3>
      <ExHeading level="h1" variant="cinematic" class="!text-4xl text-theme-text mb-4">
        {{ locale === 'ru' ? 'Оформление' : 'Appearance' }}
      </ExHeading>
      <div class="w-24 h-px bg-theme-text opacity-30"></div>
    </div>

    <div class="flex flex-col flex-grow items-center justify-center opacity-40">
      <div class="flex flex-col items-center space-y-6">
        <div class="relative w-16 h-16">
          <div class="absolute inset-0 border border-theme-text rotate-45 group-hover:rotate-90 transition-transform duration-1000"></div>
          <div class="absolute inset-2 border border-theme-text/50 rotate-45 group-hover:rotate-0 transition-transform duration-1000"></div>
          <div class="absolute inset-[18px] bg-theme-text/20 rotate-45"></div>
        </div>
        <div class="text-[10px] font-mono tracking-[0.4em] uppercase text-center max-w-xs leading-relaxed">
          {{ locale === 'ru' ? 'Настройки оформления временно недоступны. Ожидание обновления протокола.' : 'Appearance settings are temporarily unavailable. Awaiting protocol update.' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ExHeading from '~/shared/ui/ExHeading.vue'
import { useI18n } from '~/shared/i18n/useI18n'

const { locale } = useI18n()
</script>
