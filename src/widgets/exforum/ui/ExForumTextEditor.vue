<template>
  <div class="relative flex flex-col w-full h-full bg-[#f8f8f7] text-[#2c2c2a] selection:bg-black selection:text-white overflow-hidden exforum-edge-shadows">
    <!-- Hidden File Input for Image Selection -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/svg+xml, image/*"
      multiple
      class="hidden"
      @change="handleImageFileSelect"
    />

    <!-- Top & Bottom Edge Gradient Shadow Overlays (Matching ExForum Edge Shadows) -->
    <div class="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/15 via-black/[0.04] to-transparent z-20"></div>
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/15 via-black/[0.04] to-transparent z-20"></div>

    <!-- Background Decorative Elements & Shadows -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
      <div class="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-black/[0.04] blur-3xl"></div>
      <div class="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-black/[0.05] blur-3xl"></div>
    </div>

    <!-- Static Header Row (Title is static at top, centered in max-w-4xl) -->
    <div class="relative z-20 w-full shrink-0 pt-10 sm:pt-14 px-6 sm:px-12 border-b border-black/10 pb-4">
      <div class="max-w-4xl mx-auto w-full">
        <span class="block text-[10px] font-mono uppercase tracking-[0.2em] text-black/40 mb-2 font-bold select-none">
          {{ locale === 'ru' ? 'Заголовок' : 'Title' }}
        </span>
        <input
          :value="title"
          type="text"
          class="w-full bg-transparent text-3xl sm:text-4xl md:text-5xl font-serif italic font-normal tracking-tight text-left text-black/90 outline-none placeholder:text-black/20"
          :placeholder="locale === 'ru' ? 'Заголовок статьи...' : 'Article Title...'"
          @input="emit('update:title', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- Full-Width Scroll Viewport (Scrollbar is at the rightmost edge of screen!) -->
    <div class="relative z-10 flex-1 min-h-0 w-full overflow-y-auto scrollbar-thin px-6 sm:px-12">
      <!-- Centered Document Body (Content stays centered in max-w-4xl) -->
      <div class="max-w-4xl mx-auto w-full flex flex-col pt-6 pb-28">
        <!-- Main Contenteditable Text Area -->
        <div class="relative w-full min-h-[300px] shrink-0 mb-6">
          <div
            :ref="setEditorRef"
            data-text-editor
            contenteditable="true"
            class="w-full h-full outline-none font-serif text-lg md:text-xl leading-relaxed text-black/85 break-words whitespace-pre-wrap cursor-text selection:bg-black selection:text-white editor-rich-content relative z-10"
            :data-placeholder="placeholder"
            @contextmenu="handleContextMenu"
            @input="syncContentFromDom"
          ></div>

          <!-- Placeholder Overlay -->
          <div
            v-if="isContentEmpty"
            class="pointer-events-none absolute left-0 top-0 z-0 font-serif text-lg md:text-xl italic text-black/30 select-none"
          >
            {{ placeholder }}
          </div>
        </div>

        <!-- Attached Images Horizontal Carousel (Moves down below text as text grows) -->
        <div v-if="attachedImages.length > 0" class="w-full shrink-0 pt-6 border-t border-black/10 relative z-20 mb-8">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-mono uppercase tracking-[0.2em] text-black/50 font-bold select-none flex items-center gap-2">
              <svg class="w-3.5 h-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              {{ locale === 'ru' ? 'Прикрепленные изображения' : 'Attached Images' }}
            </span>
            <span class="text-[10px] font-mono font-bold text-black/40">
              {{ attachedImages.length }} / 5
            </span>
          </div>

          <!-- Horizontal Scrollable Carousel -->
          <div class="flex items-center gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin">
            <div
              v-for="(imgSrc, index) in attachedImages"
              :key="index"
              class="group relative shrink-0 w-36 h-28 sm:w-44 sm:h-32 bg-black/5 border border-black/15 rounded overflow-hidden shadow-sm hover:border-black/40 transition-all cursor-pointer"
            >
              <img :src="imgSrc" alt="Attached preview" class="w-full h-full object-cover" />
              <!-- Delete Button Overlay -->
              <button
                type="button"
                class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                :title="locale === 'ru' ? 'Удалить изображение' : 'Remove image'"
                @click.stop="removeAttachedImage(index)"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <!-- Index Badge -->
              <span class="absolute bottom-2 left-2 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-black/70 text-white rounded">
                {{ index + 1 }}
              </span>
            </div>

            <!-- Add More Thumbnail Button if < 5 -->
            <button
              v-if="attachedImages.length < 5"
              type="button"
              class="shrink-0 w-28 h-28 sm:w-32 sm:h-32 border-2 border-dashed border-black/20 hover:border-black/50 rounded flex flex-col items-center justify-center gap-1.5 text-black/40 hover:text-black/80 transition-colors bg-white/50 hover:bg-white"
              @click="triggerImageUpload"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span class="text-[9px] font-mono uppercase tracking-widest font-bold">
                {{ locale === 'ru' ? 'ЕЩЕ' : 'ADD' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Left Vertical Side Toolbar (Image & Deal buttons) -->
    <div
      class="absolute left-6 top-1/2 -translate-y-1/2 z-50 flex items-center cursor-auto pointer-events-auto"
    >
      <ExGenesisHudPanel orientation="vertical">
        <!-- Add Image Button -->
        <ExGenesisHudButton
          :tooltip="locale === 'ru' ? 'Изображение' : 'Image'"
          tooltip-position="right"
          @click="triggerImageUpload"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="8.5" cy="8.5" r="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <polyline points="21 15 16 10 5 21" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </ExGenesisHudButton>

        <!-- Add Deal Button -->
        <ExGenesisHudButton
          :tooltip="locale === 'ru' ? 'Сделка' : 'Trade'"
          tooltip-position="right"
        >
          <span class="font-mono text-[10px] font-black uppercase tracking-wider text-current">
            {{ locale === 'ru' ? 'СДЛ' : 'TRD' }}
          </span>
        </ExGenesisHudButton>
      </ExGenesisHudPanel>
    </div>

    <!-- Bottom Left Actions (Back to Mode Select) -->
    <div
      class="absolute bottom-6 left-6 z-50 flex items-center gap-4 cursor-auto pointer-events-auto"
    >
      <button
        type="button"
        class="px-6 py-3 border border-black/20 bg-white/90 shadow-sm text-[10px] font-mono uppercase tracking-widest hover:border-black/50 hover:bg-white transition-colors"
        @click="emit('back')"
      >
        {{ locale === 'ru' ? 'НАЗАД К ВЫБОРУ РЕЖИМА' : 'BACK TO MODE SELECT' }}
      </button>
    </div>

    <!-- Bottom Right Actions (Save Draft & Continue) -->
    <div
      class="absolute bottom-6 right-6 z-50 flex items-center gap-4 cursor-auto pointer-events-auto"
    >
      <button
        type="button"
        class="px-6 py-3 border border-black/20 bg-white/90 shadow-sm text-[10px] font-mono uppercase tracking-widest hover:border-black/50 hover:bg-white transition-colors"
        @click="emit('saveDraft')"
      >
        {{ locale === 'ru' ? 'СОХРАНИТЬ ЧЕРНОВИК' : 'SAVE DRAFT' }}
      </button>
      <button
        type="button"
        class="px-8 py-3 border border-black/20 bg-black text-white shadow-sm text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-black/80 transition-colors"
        @click="emit('continue')"
      >
        {{ locale === 'ru' ? 'ПРОДОЛЖИТЬ' : 'CONTINUE' }}
      </button>
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

          <!-- Unordered List (LI) -->
          <ExGenesisHudButton
            :active="activeFormats.unorderedList"
            :tooltip="locale === 'ru' ? 'Список' : 'Bullet List'"
            @click="applyFormat('unorderedList')"
          >
            <span class="font-mono text-xs font-bold lowercase">li</span>
          </ExGenesisHudButton>

          <div class="w-px h-5 bg-white/15 my-auto"></div>

          <!-- Align Left -->
          <ExGenesisHudButton
            :active="activeFormats.alignLeft"
            :tooltip="locale === 'ru' ? 'По левому краю' : 'Align Left'"
            @click="applyFormat('alignLeft')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="17" y1="10" x2="3" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="17" y1="18" x2="3" y2="18" />
            </svg>
          </ExGenesisHudButton>

          <!-- Align Center -->
          <ExGenesisHudButton
            :active="activeFormats.alignCenter"
            :tooltip="locale === 'ru' ? 'По центру' : 'Align Center'"
            @click="applyFormat('alignCenter')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="10" x2="6" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="18" y1="18" x2="6" y2="18" />
            </svg>
          </ExGenesisHudButton>

          <!-- Align Right -->
          <ExGenesisHudButton
            :active="activeFormats.alignRight"
            :tooltip="locale === 'ru' ? 'По правому краю' : 'Align Right'"
            @click="applyFormat('alignRight')"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="21" y1="10" x2="7" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="21" y1="18" x2="7" y2="18" />
            </svg>
          </ExGenesisHudButton>
        </ExGenesisHudPanel>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRefs } from 'vue'
import { useExForumTextEditor } from '../model/useExForumTextEditor'
import ExGenesisHudPanel from '~/widgets/genesis/ui/common/ExGenesisHudPanel.vue'
import ExGenesisHudButton from '~/widgets/genesis/ui/common/ExGenesisHudButton.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    title?: string
    images?: string[]
    placeholder?: string
    locale?: 'ru' | 'en'
  }>(),
  {
    modelValue: '',
    title: '',
    images: () => [],
    placeholder: 'Текст статьи...',
    locale: 'ru'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'update:title', val: string): void
  (e: 'update:images', val: string[]): void
  (e: 'back'): void
  (e: 'saveDraft'): void
  (e: 'continue'): void
}>()

const { modelValue, title, images, placeholder, locale } = toRefs(props)

// Sync modelValue prop with v-model emit
const contentModel = computed({
  get: () => modelValue.value || '',
  set: (val: string) => emit('update:modelValue', val)
})

// File Input & Image Attachments State
const fileInputRef = ref<HTMLInputElement | null>(null)
const internalImages = ref<string[]>([])

const attachedImages = computed({
  get: () => (images.value && images.value.length > 0 ? images.value : internalImages.value),
  set: (val: string[]) => {
    internalImages.value = val
    emit('update:images', val)
  }
})

function triggerImageUpload() {
  if (attachedImages.value.length >= 5) {
    return
  }
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

function handleImageFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  const remainingSlots = 5 - attachedImages.value.length
  if (remainingSlots <= 0) return

  const filesToProcess = Array.from(files).slice(0, remainingSlots)

  filesToProcess.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (result && attachedImages.value.length < 5) {
        attachedImages.value = [...attachedImages.value, result]
      }
    }
    reader.readAsDataURL(file)
  })

  target.value = ''
}

function removeAttachedImage(index: number) {
  const updated = [...attachedImages.value]
  updated.splice(index, 1)
  attachedImages.value = updated
}

const {
  setEditorRef,
  content,
  isToolbarVisible,
  toolbarPosition,
  activeFormats,
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
</script>

<style scoped>
.exforum-edge-shadows {
  background-attachment: local, local, local, local;
  background-image:
    radial-gradient(ellipse 120% 86% at 50% 0%, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.08) 28%, rgba(0, 0, 0, 0.03) 58%, rgba(0, 0, 0, 0) 82%),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.04) 34%, rgba(0, 0, 0, 0.015) 68%, rgba(0, 0, 0, 0) 100%),
    radial-gradient(ellipse 120% 86% at 50% 100%, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.08) 28%, rgba(0, 0, 0, 0.03) 58%, rgba(0, 0, 0, 0) 82%),
    linear-gradient(to top, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.04) 34%, rgba(0, 0, 0, 0.015) 68%, rgba(0, 0, 0, 0) 100%);
  background-position: top, top, bottom, bottom;
  background-repeat: no-repeat;
  background-size: 100% 280px, 100% 280px, 100% 280px, 100% 280px;
}

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
  font-size: 2.25rem;
  font-weight: 400;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  line-height: 1.2;
}

:deep(.editor-rich-content h2) {
  font-size: 1.65rem;
  font-weight: 400;
  margin-top: 1rem;
  margin-bottom: 0.4rem;
  line-height: 1.25;
}

:deep(.editor-rich-content blockquote) {
  border-left: 3px solid #000;
  padding-left: 1.25rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  font-style: italic;
  opacity: 0.85;
}

:deep(.editor-rich-content pre) {
  background: #f4f4f5;
  border-radius: 4px;
  padding: 0.85rem 1.15rem;
  font-family: monospace;
  font-size: 0.95rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  overflow-x: auto;
}

:deep(.editor-rich-content ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
