<template>
  <div class="relative flex flex-col w-full h-full min-h-[400px] bg-white text-[#2c2c2a] selection:bg-black selection:text-white">
    <!-- Header / Stats Info Bar -->
    <div class="flex items-center justify-between border-b border-black/10 px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-black/50 select-none">
      <div class="flex items-center gap-4">
        <span class="flex items-center gap-1.5 font-bold text-black/70">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {{ locale === 'ru' ? 'ТЕКСТОВЫЙ РЕДАКТОР' : 'TEXT EDITOR' }}
        </span>
        <span class="opacity-30">|</span>
        <span>{{ wordCount }} {{ locale === 'ru' ? 'СЛОВ' : 'WORDS' }}</span>
        <span class="opacity-30">•</span>
        <span>{{ charCount }} {{ locale === 'ru' ? 'СИМВОЛОВ' : 'CHARS' }}</span>
      </div>

      <div class="flex items-center gap-4 text-black/40">
        <span>~{{ readingTimeMins }} {{ locale === 'ru' ? 'МИН ЧТЕНИЯ' : 'MIN READ' }}</span>
        <span class="opacity-30">|</span>
        <span class="text-[9px] text-black/30">
          {{ locale === 'ru' ? 'ВЫДЕЛИТЕ ТЕКСТ & ПРАВЫЙ КЛИК ДЛЯ ФОРМАТИРОВАНИЯ' : 'SELECT TEXT & RIGHT CLICK TO FORMAT' }}
        </span>
      </div>
    </div>

    <!-- Main Editor Text Area / Contenteditable Container -->
    <div class="relative flex-1 w-full overflow-y-auto p-8 sm:p-12">
      <div
        :ref="setEditorRef"
        data-text-editor
        contenteditable="true"
        class="w-full h-full min-h-[300px] outline-none font-serif text-lg leading-relaxed text-black/85 break-words whitespace-pre-wrap cursor-text selection:bg-black selection:text-white editor-rich-content"
        :data-placeholder="placeholder"
        @contextmenu="handleContextMenu"
        @input="syncContentFromDom"
      ></div>

      <!-- Empty State Placeholder Overlay -->
      <div
        v-if="isContentEmpty"
        class="pointer-events-none absolute left-8 sm:left-12 top-8 sm:top-12 font-serif text-lg italic text-black/30 select-none"
      >
        {{ placeholder }}
      </div>
    </div>

    <!-- Floating Context Formatting Panel (ExGenesis HUD style) -->
    <Transition name="hud-pop">
      <div
        v-if="isToolbarVisible"
        data-text-toolbar
        class="fixed z-[9999] -translate-x-1/2 cursor-auto pointer-events-auto"
        :style="{ left: `${toolbarPosition.x}px`, top: `${toolbarPosition.y}px` }"
        @click.stop
        @contextmenu.prevent.stop
      >
        <ExGenesisHudPanel orientation="horizontal" class="shadow-[0_20px_50px_rgba(0,0,0,0.35)] border-white/20">
          <!-- Bold -->
          <ExGenesisHudButton
            :active="activeFormats.bold"
            :tooltip="locale === 'ru' ? 'Жирный' : 'Bold'"
            @click="applyFormat('bold')"
          >
            <span class="font-black text-sm">B</span>
          </ExGenesisHudButton>

          <!-- Italic -->
          <ExGenesisHudButton
            :active="activeFormats.italic"
            :tooltip="locale === 'ru' ? 'Курсив' : 'Italic'"
            @click="applyFormat('italic')"
          >
            <span class="font-serif italic font-bold text-sm">I</span>
          </ExGenesisHudButton>

          <!-- Strikethrough -->
          <ExGenesisHudButton
            :active="activeFormats.strikethrough"
            :tooltip="locale === 'ru' ? 'Зачеркнутый' : 'Strikethrough'"
            @click="applyFormat('strikethrough')"
          >
            <span class="line-through text-sm font-bold">S</span>
          </ExGenesisHudButton>

          <!-- Underline -->
          <ExGenesisHudButton
            :active="activeFormats.underline"
            :tooltip="locale === 'ru' ? 'Подчеркнутый' : 'Underline'"
            @click="applyFormat('underline')"
          >
            <span class="underline text-sm font-bold">U</span>
          </ExGenesisHudButton>

          <div class="w-px h-5 bg-white/15 my-auto"></div>

          <!-- Heading 1 -->
          <ExGenesisHudButton
            :active="activeFormats.h1"
            :tooltip="locale === 'ru' ? 'Заголовок H1' : 'Heading 1'"
            @click="applyFormat('h1')"
          >
            <span class="font-mono text-xs font-bold">H1</span>
          </ExGenesisHudButton>

          <!-- Heading 2 -->
          <ExGenesisHudButton
            :active="activeFormats.h2"
            :tooltip="locale === 'ru' ? 'Заголовок H2' : 'Heading 2'"
            @click="applyFormat('h2')"
          >
            <span class="font-mono text-xs font-bold">H2</span>
          </ExGenesisHudButton>

          <!-- Code Snippet -->
          <ExGenesisHudButton
            :active="activeFormats.code"
            :tooltip="locale === 'ru' ? 'Код' : 'Code'"
            @click="applyFormat('code')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </ExGenesisHudButton>

          <!-- Blockquote -->
          <ExGenesisHudButton
            :active="activeFormats.blockquote"
            :tooltip="locale === 'ru' ? 'Цитата' : 'Quote'"
            @click="applyFormat('blockquote')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h3c0 4-2 6-4 6z" />
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2h-4c-1.25 0-2 .75-2 2v6c0 1.25.75 2 2 2h3c0 4-2 6-4 6z" />
            </svg>
          </ExGenesisHudButton>

          <!-- Unordered List -->
          <ExGenesisHudButton
            :active="activeFormats.unorderedList"
            :tooltip="locale === 'ru' ? 'Список' : 'Bullet List'"
            @click="applyFormat('unorderedList')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </ExGenesisHudButton>

          <div class="w-px h-5 bg-white/15 my-auto"></div>

          <!-- Color Preset Dropdown / Picker -->
          <div class="relative group/color">
            <ExGenesisHudButton
              :tooltip="locale === 'ru' ? 'Цвет текста' : 'Text Color'"
            >
              <div class="w-4 h-4 rounded-full border border-white/40" :style="{ backgroundColor: activeColor }"></div>
            </ExGenesisHudButton>
            
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/color:flex items-center gap-1.5 p-2 bg-black/95 border border-white/20 rounded shadow-xl backdrop-blur-xl">
              <button
                v-for="color in colorPresets"
                :key="color"
                class="w-4 h-4 rounded-full border border-white/20 hover:scale-125 transition-transform"
                :style="{ backgroundColor: color }"
                @click="applyFormat('color', color)"
              ></button>
            </div>
          </div>

          <!-- Clear Formatting -->
          <ExGenesisHudButton
            :tooltip="locale === 'ru' ? 'Сбросить формат' : 'Clear Formatting'"
            @click="applyFormat('clear')"
          >
            <svg class="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </ExGenesisHudButton>
        </ExGenesisHudPanel>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs } from 'vue'
import { useExForumTextEditor } from '../model/useExForumTextEditor'
import ExGenesisHudPanel from '~/widgets/genesis/ui/common/ExGenesisHudPanel.vue'
import ExGenesisHudButton from '~/widgets/genesis/ui/common/ExGenesisHudButton.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    locale?: 'ru' | 'en'
  }>(),
  {
    modelValue: '',
    placeholder: 'Напишите здесь текст вашей статьи...',
    locale: 'ru'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const { modelValue, placeholder, locale } = toRefs(props)

// Sync modelValue prop with v-model emit
const contentModel = computed({
  get: () => modelValue.value || '',
  set: (val: string) => emit('update:modelValue', val)
})

const {
  setEditorRef,
  content,
  isToolbarVisible,
  toolbarPosition,
  activeFormats,
  activeColor,
  charCount,
  wordCount,
  readingTimeMins,
  handleContextMenu,
  applyFormat,
  syncContentFromDom
} = useExForumTextEditor({
  modelValue: contentModel,
  placeholder: placeholder.value,
  locale: locale.value
})

const isContentEmpty = computed(() => {
  const plainText = content.value.replace(/<[^>]*>/g, '').trim()
  return plainText.length === 0
})

const colorPresets = [
  '#000000',
  '#2563eb', // blue
  '#10b981', // emerald
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6'  // purple
]
</script>

<style scoped>
.hud-pop-enter-active,
.hud-pop-leave-active {
  transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
}

.hud-pop-enter-from,
.hud-pop-leave-to {
  opacity: 0;
  transform: translate(-50%, 8px) scale(0.95);
}

:deep(.editor-rich-content h1) {
  font-size: 2rem;
  font-weight: 800;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

:deep(.editor-rich-content h2) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 0.85rem;
  margin-bottom: 0.4rem;
  line-height: 1.25;
}

:deep(.editor-rich-content blockquote) {
  border-left: 3px solid #000;
  padding-left: 1rem;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  font-style: italic;
  opacity: 0.8;
}

:deep(.editor-rich-content pre) {
  background: #f4f4f5;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  font-family: monospace;
  font-size: 0.9rem;
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  overflow-x: auto;
}

:deep(.editor-rich-content ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
