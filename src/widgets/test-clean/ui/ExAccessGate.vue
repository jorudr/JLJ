<template>
  <section class="access-gate flex h-full w-full items-center justify-center px-5 py-10 sm:px-8">
    <ExPanel variant="light" no-padding no-shadow class="w-full max-w-[34rem] overflow-visible">
      <div class="px-7 py-9 sm:px-11 sm:py-12">

      <div v-if="state === 'checking'" class="flex min-h-48 flex-col items-center justify-center text-center">
        <span class="access-gate__spinner mb-6" aria-hidden="true"></span>
        <p class="access-gate__eyebrow">{{ isRussian ? 'ПРОВЕРКА ДОСТУПА' : 'VERIFYING ACCESS' }}</p>
      </div>

      <div v-else class="text-center">
        <p class="access-gate__eyebrow mb-5">EXGENESIS // ACCESS PROTOCOL</p>
        <ExHeading level="h1" variant="cinematic" class="access-gate__title">
          {{ isRussian ? 'АКТИВАЦИЯ ДОСТУПА' : 'ACCESS ACTIVATION' }}
        </ExHeading>
        <p class="access-gate__description">
          {{ isRussian
            ? 'Введите ключ активации'
            : 'Enter your activation key.' }}
        </p>

        <form class="mt-9" @submit.prevent="submit">
          <label class="sr-only" for="access-key-input">
            {{ isRussian ? 'Ключ доступа' : 'Access key' }}
          </label>
          <input
            id="access-key-input"
            v-model="accessKey"
            class="access-gate__input"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            maxlength="48"
            :disabled="isSubmitting"
            :placeholder="isRussian ? 'EXG-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX' : 'EXG-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX'"
            @input="formatKey"
          >

          <p v-if="error" class="access-gate__error mt-4" role="alert">{{ error }}</p>

          <button
            type="submit"
            class="access-gate__submit mt-6"
            :disabled="isSubmitting || !accessKey"
          >
            <span v-if="isSubmitting" class="access-gate__button-spinner" aria-hidden="true"></span>
            <span>{{ isSubmitting ? (isRussian ? 'АКТИВАЦИЯ...' : 'ACTIVATING...') : (isRussian ? 'АКТИВИРОВАТЬ' : 'ACTIVATE') }}</span>
          </button>
        </form>

        <button
          v-if="state === 'error'"
          type="button"
          class="access-gate__retry mt-5"
          @click="$emit('retry')"
        >
          {{ isRussian ? 'ПОВТОРИТЬ ПРОВЕРКУ' : 'RETRY CHECK' }}
        </button>
      </div>
      </div>
    </ExPanel>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ExHeading from '~/shared/ui/ExHeading.vue'
import ExPanel from '~/shared/ui/ExPanel.vue'
import type { AccessActivationState } from '~/features/access/model/useAccessActivation'

const props = withDefaults(defineProps<{
  state: AccessActivationState
  error?: string
  isSubmitting?: boolean
  locale?: string
}>(), {
  error: '',
  isSubmitting: false,
  locale: 'en'
})

const emit = defineEmits<{
  activate: [key: string]
  retry: []
}>()

const accessKey = ref('')
const isRussian = computed(() => props.locale === 'ru')

const formatKey = () => {
  const normalized = accessKey.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!normalized.startsWith('EXG')) {
    accessKey.value = normalized.slice(0, 35)
    return
  }

  const chunks = normalized.slice(3, 35).match(/.{1,8}/g) || []
  accessKey.value = `EXG${chunks.length ? `-${chunks.join('-')}` : ''}`
}

const submit = () => {
  if (props.isSubmitting || !accessKey.value) return
  emit('activate', accessKey.value)
}
</script>

<style scoped>
.access-gate__eyebrow,
.access-gate__retry,
.access-gate__error {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.22em;
}

.access-gate__eyebrow {
  color: var(--theme-text);
  opacity: 0.5;
}

.access-gate__title {
  color: var(--theme-text) !important;
  font-size: clamp(2rem, 7vw, 3.5rem) !important;
  letter-spacing: 0.1em !important;
  line-height: 1.04 !important;
}

.access-gate__description {
  color: var(--theme-muted);
  font-size: 12px;
  line-height: 1.8;
  margin: 1.4rem auto 0;
  max-width: 25rem;
}

.access-gate__input {
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--theme-border-strong);
  color: var(--theme-text);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  outline: none;
  padding: 1rem 0;
  text-align: center;
  transition: border-color 180ms ease;
  width: 100%;
}

.access-gate__input::placeholder {
  color: var(--theme-muted);
  font-size: 8px;
  letter-spacing: 0.04em;
  opacity: 0.42;
}

.access-gate__input:focus {
  border-color: var(--theme-text);
}

.access-gate__submit {
  align-items: center;
  background: var(--theme-text);
  border: 1px solid var(--theme-text);
  color: var(--theme-bg);
  display: inline-flex;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  font-weight: 900;
  gap: 0.55rem;
  justify-content: center;
  letter-spacing: 0.2em;
  min-height: 2.85rem;
  padding: 0.75rem 1.6rem;
  transition: opacity 180ms ease, transform 180ms ease;
  width: 100%;
}

.access-gate__submit:hover:not(:disabled) {
  opacity: 0.78;
  transform: translateY(-1px);
}

.access-gate__submit:disabled {
  cursor: default;
  opacity: 0.38;
}

.access-gate__error {
  color: #d05a5a;
  line-height: 1.55;
}

.access-gate__retry {
  color: var(--theme-text);
  opacity: 0.55;
  transition: opacity 180ms ease;
}

.access-gate__retry:hover {
  opacity: 1;
}

.access-gate__spinner,
.access-gate__button-spinner {
  animation: access-gate-spin 800ms linear infinite;
  border: 1px solid var(--theme-border-strong);
  border-top-color: var(--theme-text);
  border-radius: 999px;
  display: inline-block;
  height: 1.4rem;
  width: 1.4rem;
}

.access-gate__button-spinner {
  border-color: color-mix(in srgb, var(--theme-bg) 45%, transparent);
  border-top-color: var(--theme-bg);
  height: 0.9rem;
  width: 0.9rem;
}

@keyframes access-gate-spin {
  to { transform: rotate(360deg); }
}
</style>
