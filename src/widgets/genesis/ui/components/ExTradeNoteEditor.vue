<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { useI18n } from '~/shared/i18n/useI18n'

const props = withDefaults(defineProps<{
  modelValue: string
  isPersisting?: boolean
}>(), {
  isPersisting: false
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
  (event: 'save'): void
  (event: 'cancel'): void
}>()

const { locale } = useI18n()
const editor = ref<HTMLElement | null>(null)
const savedSelection = ref<Range | null>(null)
const activeTextColor = ref('currentColor')

const syncEditor = () => {
  if (!editor.value) return
  emit('update:modelValue', editor.value.innerHTML)
}

const syncEditorFromModel = () => {
  if (!editor.value || editor.value.innerHTML === props.modelValue) return
  editor.value.innerHTML = props.modelValue
}

const saveSelection = () => {
  const selection = window.getSelection()
  if (!selection?.rangeCount || !editor.value) return
  const range = selection.getRangeAt(0)
  if (!editor.value.contains(range.commonAncestorContainer)) return
  savedSelection.value = range.cloneRange()
}

const restoreSelection = () => {
  if (!editor.value) return
  editor.value.focus()
  const selection = window.getSelection()
  if (!selection) return
  selection.removeAllRanges()
  if (savedSelection.value) selection.addRange(savedSelection.value)
}

const applyCommand = (command: string, value?: string) => {
  if (!editor.value) return
  restoreSelection()
  document.execCommand('styleWithCSS', false, 'true')
  document.execCommand(command, false, value)
  syncEditor()
  saveSelection()
}

const applyBlock = (block: 'h1' | 'h2' | 'h3' | 'blockquote') => {
  applyCommand('formatBlock', block)
}

const applyColor = (color: string) => {
  activeTextColor.value = color
  applyCommand('foreColor', color)
}

const handleBeforeInput = (event: InputEvent) => {
  if (event.inputType !== 'insertText' || !event.data || event.isComposing) return
  if (activeTextColor.value === 'currentColor') return

  const selection = window.getSelection()
  if (!editor.value || !selection?.rangeCount) return
  const range = selection.getRangeAt(0)
  if (!editor.value.contains(range.commonAncestorContainer)) return

  event.preventDefault()
  range.deleteContents()

  const span = document.createElement('span')
  span.style.color = activeTextColor.value
  span.appendChild(document.createTextNode(event.data))
  range.insertNode(span)

  const nextRange = document.createRange()
  nextRange.setStartAfter(span)
  nextRange.collapse(true)
  selection.removeAllRanges()
  selection.addRange(nextRange)
  syncEditor()
  saveSelection()
}

const handleCancel = () => {
  savedSelection.value = null
  emit('cancel')
}

onMounted(async () => {
  await nextTick()
  syncEditorFromModel()
  editor.value?.focus()
})
</script>

<template>
  <div class="relative flex w-full flex-col gap-4 border border-white/10 bg-white/[0.03] p-5">
    <button
      type="button"
      class="absolute right-3 top-3 z-10 border border-white/15 px-3 py-2 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/50 transition-colors hover:border-white/40 hover:text-white"
      @click="handleCancel"
    >
      {{ locale === 'ru' ? 'ОТМЕНА' : 'CANCEL' }}
    </button>

    <div class="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4 pr-24">
      <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyBlock('h1')">H1</button>
      <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyBlock('h2')">H2</button>
      <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyBlock('h3')">H3</button>
      <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] font-bold transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyCommand('bold')">B</button>
      <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] italic transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyCommand('italic')">I</button>
      <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] underline transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyCommand('underline')">U</button>
      <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyCommand('insertUnorderedList')">LIST</button>
      <button type="button" class="border border-white/10 px-3 py-2 font-mono text-[9px] transition-colors hover:bg-white hover:text-black" @mousedown.stop.prevent="applyBlock('blockquote')">QUOTE</button>
      <button type="button" class="h-7 w-7 bg-emerald-500" aria-label="Green text" @mousedown.stop.prevent="applyColor('#10b981')"></button>
      <button type="button" class="h-7 w-7 bg-rose-500" aria-label="Red text" @mousedown.stop.prevent="applyColor('#ef4444')"></button>
      <button type="button" class="h-7 w-7 bg-blue-500" aria-label="Blue text" @mousedown.stop.prevent="applyColor('#3b82f6')"></button>
    </div>

    <div
      ref="editor"
      contenteditable="true"
      data-text-editable="true"
      data-placeholder="WRITE_YOUR_TRADE_NOTE..."
      :placeholder="locale === 'ru' ? 'ЗАПИШИТЕ МЫСЛИ ПО СДЕЛКЕ...' : 'WRITE YOUR TRADE NOTE...'"
      class="trade-note-rich min-h-[320px] w-full resize-y overflow-y-auto bg-transparent p-4 font-mono text-sm leading-relaxed text-white outline-none"
      @beforeinput="handleBeforeInput"
      @input="syncEditor"
      @mouseup="saveSelection"
      @keyup="saveSelection"
      @focus="saveSelection"
    ></div>

    <div class="flex items-center justify-end gap-3">
      <button
        type="button"
        :disabled="!props.modelValue.replace(/<[^>]*>/g, '').trim() || props.isPersisting"
        class="border border-white bg-white px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.2em] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
        @click="emit('save')"
      >
        {{ locale === 'ru' ? 'СОХРАНИТЬ' : 'SAVE' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.trade-note-rich {
  line-height: 1.5;
  text-transform: none;
  user-select: text;
  cursor: text;
  white-space: normal;
}

.trade-note-rich:empty::before {
  content: attr(data-placeholder);
  opacity: 0.25;
}

.trade-note-rich :deep(h1) {
  margin: 0.4em 0 0.7em;
  font-size: 1.8em;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: 0.08em;
}

.trade-note-rich :deep(h2) {
  margin: 0.35em 0 0.6em;
  border-bottom: 1px solid rgb(255 255 255 / 0.2);
  padding-bottom: 0.25em;
  font-size: 1.45em;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0.08em;
}

.trade-note-rich :deep(h3) {
  margin: 0.3em 0 0.5em;
  font-size: 1.15em;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: 0.06em;
}

.trade-note-rich :deep(p) {
  margin: 0 0 0.55em;
}

.trade-note-rich :deep(blockquote) {
  margin: 0.45em 0;
  border-left: 2px solid currentColor;
  padding-left: 0.8em;
  opacity: 0.78;
}

.trade-note-rich :deep(ul),
.trade-note-rich :deep(ol) {
  margin: 0.35em 0;
  padding-left: 1.5em;
}

.trade-note-rich :deep(ul) {
  list-style-type: disc;
}

.trade-note-rich :deep(ol) {
  list-style-type: decimal;
}

.trade-note-rich :deep(li) {
  margin: 0.18em 0;
}
</style>
