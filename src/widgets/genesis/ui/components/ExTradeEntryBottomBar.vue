<script setup lang="ts">
defineProps<{
  isTradeEntryOpen: boolean
  isSimulatorOpen?: boolean
  isCloseModeActive: boolean
  activePanel: 'matrix' | 'journal' | 'method' | null
}>()

const emit = defineEmits<{
  (event: 'toggle-entry'): void
  (event: 'toggle-close-mode'): void
  (event: 'open-panel', panel: 'matrix' | 'journal' | 'method'): void
}>()
</script>

<template>
  <div
    v-if="!isSimulatorOpen"
    class="pointer-events-none absolute bottom-12 left-0 right-0 z-[2100] flex items-center justify-center"
  >
    <div class="pointer-events-auto flex items-center gap-1.5 rounded-sm border border-white/20 bg-[#0a0a0a]/90 p-1.5 shadow-2xl backdrop-blur-xl">
      <button
        type="button"
        class="group relative flex h-10 w-10 items-center justify-center border transition-all"
        :class="isTradeEntryOpen ? 'border-white bg-white text-black' : 'border-white bg-white text-black hover:bg-white/80'"
        :aria-label="isTradeEntryOpen ? 'Выйти из сделки' : 'Новая сделка'"
        :title="isTradeEntryOpen ? 'Выйти из сделки' : 'Новая сделка'"
        @click="emit('toggle-entry')"
      >
        <svg v-if="!isTradeEntryOpen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5" aria-hidden="true">
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
          <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
          <path d="M13 21h6a2 2 0 0 0 2-2" />
        </svg>
        <span class="pointer-events-none absolute bottom-full mb-2 whitespace-nowrap border border-white/20 bg-white px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-black opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
          {{ isTradeEntryOpen ? '[ ВЫЙТИ_ИЗ_СДЕЛКИ ]' : '[ НОВАЯ_СДЕЛКА ]' }}
        </span>
      </button>

      <template v-if="isTradeEntryOpen">
        <button
        type="button"
          class="group relative flex h-10 w-10 items-center justify-center border transition-all"
          :class="isCloseModeActive
            ? 'border-white/30 bg-white/10 text-white'
            : 'border-transparent text-white/45 hover:border-white/20 hover:bg-white/5 hover:text-white'"
          aria-label="Режим закрытия сделки"
          title="Режим закрытия сделки"
          @click="emit('toggle-close-mode')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter" class="h-5 w-5" aria-hidden="true">
            <path d="M5 12.5 9.5 17 19 7.5" />
          </svg>
          <span class="pointer-events-none absolute bottom-full mb-2 whitespace-nowrap border border-white/20 bg-white px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-black opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
            [ РЕЖИМ_ЗАКРЫТИЯ ]
          </span>
        </button>

        <button
          type="button"
          class="group relative flex h-10 w-10 items-center justify-center border transition-all"
          :class="activePanel === 'matrix'
            ? 'border-white/30 bg-white/10 text-white'
            : 'border-transparent text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white'"
          aria-label="Протокол Матрицы"
          title="Протокол Матрицы"
          @click="emit('open-panel', 'matrix')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          <span class="pointer-events-none absolute bottom-full mb-2 whitespace-nowrap border border-white/20 bg-white px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-black opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
            [ ПРОТОКОЛ_МАТРИЦЫ ]
          </span>
        </button>

        <button
          type="button"
          class="group relative flex h-10 w-10 items-center justify-center border transition-all"
          :class="activePanel === 'journal'
            ? 'border-white/30 bg-white/10 text-white'
            : 'border-transparent text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white'"
          aria-label="Открыть журнал"
          title="Открыть журнал"
          @click="emit('open-panel', 'journal')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5" aria-hidden="true">
            <path d="M6 4h12v16H6z" />
            <path d="M9 8h6M9 12h6M9 16h4" />
          </svg>
          <span class="pointer-events-none absolute bottom-full mb-2 whitespace-nowrap border border-white/20 bg-white px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-black opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
            [ ОТКРЫТЬ_ЖУРНАЛ ]
          </span>
        </button>

        <button
          type="button"
          class="group relative flex h-10 w-10 items-center justify-center border transition-all"
          :class="activePanel === 'method'
            ? 'border-white/30 bg-white/10 text-white'
            : 'border-transparent text-white/70 hover:border-white/20 hover:bg-white/5 hover:text-white'"
          aria-label="Метод входа"
          title="Метод входа"
          @click="emit('open-panel', 'method')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5" aria-hidden="true">
            <path d="M4 17 10 11l4 4 6-8" />
            <path d="M16 7h4v4" />
            <path d="M4 20h16" />
          </svg>
          <span class="pointer-events-none absolute bottom-full mb-2 whitespace-nowrap border border-white/20 bg-white px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-black opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
            [ МЕТОД_ВХОДА ]
          </span>
        </button>
      </template>
    </div>
  </div>
</template>
