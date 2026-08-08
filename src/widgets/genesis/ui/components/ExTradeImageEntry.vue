<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '~/shared/i18n/useI18n'

const props = withDefaults(defineProps<{
  image: Record<string, any>
  index: number
  tagDraft?: string
  canEdit?: boolean
  isPersisting?: boolean
}>(), {
  tagDraft: '',
  canEdit: false,
  isPersisting: false
})

const emit = defineEmits<{
  (event: 'upload', index: number, payload: Event): void
  (event: 'remove', index: number): void
  (event: 'name-change', index: number, payload: Event): void
  (event: 'tag-draft', index: number, payload: Event): void
  (event: 'add-tag', index: number): void
  (event: 'remove-tag', index: number, tag: string): void
}>()

const { locale } = useI18n()
const fileInput = ref<HTMLInputElement | null>(null)
const tagColors = ref<Record<string, string>>({})

const TAG_COLORS = [
  '#7c3aed',
  '#2563eb',
  '#0891b2',
  '#0f766e',
  '#15803d',
  '#ca8a04',
  '#c2410c',
  '#be123c',
  '#9333ea',
  '#0369a1',
  '#4338ca',
  '#9f1239'
]

const getTagColor = (tag: string) => {
  if (tagColors.value[tag]) return tagColors.value[tag]

  const usedColors = new Set(Object.values(tagColors.value))
  const availableColors = TAG_COLORS.filter(color => !usedColors.has(color))
  const color = availableColors.length
    ? availableColors[Math.floor(Math.random() * availableColors.length)]
    : `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`

  tagColors.value[tag] = color
  return color
}

const triggerUpload = () => {
  fileInput.value?.click()
}
</script>

<template>
  <figure class="group relative flex h-fit self-start flex-col bg-black/[0.01] transition-all duration-500 dark:bg-white/[0.01]">
    <button
      type="button"
      :disabled="!props.canEdit || props.isPersisting"
      class="absolute right-0 top-0 z-30 flex h-8 w-8 items-center justify-center border-b border-l border-white/10 bg-transparent font-mono text-[10px] text-white opacity-0 transition-all duration-300 hover:bg-red-500/80 hover:text-white group-hover:opacity-100 disabled:cursor-default disabled:opacity-20"
      :aria-label="locale === 'ru' ? 'Удалить изображение' : 'Remove image'"
      @click="emit('remove', props.index)"
    >
      ✕
    </button>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="emit('upload', props.index, $event)" />
    <button type="button" class="group/img relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden bg-black/5 dark:bg-white/5" @click="triggerUpload">
      <div v-if="props.image.url" class="h-full w-full">
        <img :src="props.image.url" :alt="props.image.name || `Trade image ${props.index + 1}`" class="h-full w-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
        <div class="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover/img:opacity-100">
          <span class="bg-black/60 px-4 py-2 text-[8px] font-mono font-black uppercase tracking-widest text-white">
            {{ locale === 'ru' ? 'ЗАМЕНИТЬ' : 'REPLACE' }}
          </span>
        </div>
      </div>
      <div v-else class="flex h-full w-full flex-col items-center justify-center space-y-4">
        <span class="text-[8px] font-mono uppercase tracking-[0.4em] text-white/30 transition-opacity group-hover/img:text-white">
          {{ locale === 'ru' ? 'ЗАГРУЗИТЬ' : 'UPLOAD' }}
        </span>
      </div>
    </button>

    <div class="flex flex-col space-y-3 p-3">
      <div class="relative">
        <input
          :value="props.image.name || ''"
          type="text"
          :placeholder="locale === 'ru' ? 'НАЗВАНИЕ' : 'NAME'"
          class="w-full border border-white/10 bg-transparent px-2 py-2 text-[9px] font-mono font-black uppercase tracking-[0.15em] text-white outline-none transition-all placeholder:text-white/20 focus:border-white/30"
          @change="emit('name-change', props.index, $event)"
        />
      </div>

      <div class="flex flex-col gap-3">
        <div class="flex min-h-7 flex-wrap gap-2">
          <span
            v-for="tag in (props.image.tags || [])"
            :key="tag"
            class="flex items-center gap-2 border px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-white"
            :style="{ backgroundColor: `${getTagColor(tag)}26`, borderColor: `${getTagColor(tag)}99` }"
          >
            {{ tag }}
            <button type="button" class="text-[9px] leading-none opacity-40 transition-all hover:text-red-500 hover:opacity-100" @click="emit('remove-tag', props.index, tag)">
              x
            </button>
          </span>
          <span v-if="!(props.image.tags || []).length" class="self-center text-[8px] font-mono uppercase tracking-[0.3em] text-white/20">
            {{ locale === 'ru' ? 'ТЭГОВ НЕТ' : 'NO TAGS' }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <input
            :value="props.tagDraft"
            type="text"
            :placeholder="locale === 'ru' ? 'Пользовательский тег...' : 'Custom tag...'"
            class="min-w-0 flex-1 border border-white/10 bg-transparent px-3 py-2 text-[9px] font-mono uppercase tracking-widest text-white outline-none placeholder:text-white/20 focus:border-white/30"
            @input="emit('tag-draft', props.index, $event)"
            @keyup.enter="emit('add-tag', props.index)"
          />
          <button
            type="button"
            class="grid h-8 w-8 shrink-0 place-items-center border border-white/15 text-white/60 transition-all hover:bg-white hover:text-black"
            :aria-label="locale === 'ru' ? 'Добавить тег' : 'Add tag'"
            :title="locale === 'ru' ? 'Добавить тег' : 'Add tag'"
            @click="emit('add-tag', props.index)"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </figure>
</template>
