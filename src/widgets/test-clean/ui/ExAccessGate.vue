<template>
  <section class="access-gate flex h-full w-full items-center justify-center px-5 py-10 sm:px-8 relative overflow-hidden ethereal-void" :class="{ 'is-dark': isDark }">
    <!-- Ethereal Background -->
    <EtherealBackground :is-dark="isDark" :is-assembled="true" :show-bloom="false" />
    <DesignVignette v-if="!isDark" :is-dark="isDark" />

    <ExPanel variant="light" no-padding no-shadow class="w-full max-w-[34rem] overflow-visible relative z-10">
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
            :disabled="isSubmitting || isLocked"
            :placeholder="isRussian ? 'EXG-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX' : 'EXG-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX'"
            @input="formatKey"
          >

          <p v-if="visibleError" class="access-gate__error mt-4" role="alert">{{ visibleError }}</p>

          <div class="access-gate__actions mt-6">
            <button
              type="submit"
              class="access-gate__submit"
              :disabled="isSubmitting || isLocked || !accessKey"
            >
              <span v-if="isSubmitting" class="access-gate__button-spinner" aria-hidden="true"></span>
              <span>{{ isSubmitting ? (isRussian ? 'АКТИВАЦИЯ...' : 'ACTIVATING...') : (isRussian ? 'АКТИВИРОВАТЬ' : 'ACTIVATE') }}</span>
            </button>
            <a
              :href="PATREON_URL"
              target="_blank"
              rel="noreferrer"
              class="access-gate__patreon"
              @click="openPatreon"
            >
              {{ isRussian ? 'НЕТ КЛЮЧА?' : 'NO KEY?' }}
            </a>
          </div>
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
import EtherealBackground from '~/widgets/style/ui/EtherealBackground.vue'
import DesignVignette from '~/widgets/style/ui/DesignVignette.vue'
import { useThemeStore } from '~/features/store/useTheme'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.settings.isDark)
const PATREON_URL = 'https://www.patreon.com/cw/jlgandr'

const props = withDefaults(defineProps<{
  state: AccessActivationState
  error?: string
  isSubmitting?: boolean
  lockRemainingSeconds?: number
  locale?: string
}>(), {
  error: '',
  isSubmitting: false,
  lockRemainingSeconds: 0,
  locale: 'en'
})

const emit = defineEmits<{
  activate: [key: string]
  retry: []
}>()

const accessKey = ref('')
const isRussian = computed(() => props.locale === 'ru')
const isLocked = computed(() => props.lockRemainingSeconds > 0)
const lockDurationText = computed(() => {
  const totalSeconds = Math.max(0, Math.ceil(props.lockRemainingSeconds))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})
const visibleError = computed(() => {
  if (isLocked.value) {
    return isRussian.value
      ? `Слишком много неверных попыток. Попробуйте снова через ${lockDurationText.value}.`
      : `Too many invalid attempts. Try again in ${lockDurationText.value}.`
  }

  const normalizedError = props.error.trim().toLowerCase()
  if (!normalizedError) return ''

  if (normalizedError.includes('too many activation attempts')) {
    return isRussian.value
      ? 'Слишком много попыток. Подождите и попробуйте снова.'
      : 'Too many attempts. Please wait and try again.'
  }

  return props.error
})

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
  if (props.isSubmitting || isLocked.value || !accessKey.value) return
  emit('activate', accessKey.value)
}

const openPatreon = async (event: MouseEvent) => {
  event.preventDefault()

  if (typeof window === 'undefined') return
  const isTauri = Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__)

  if (!isTauri) {
    const opened = window.open(PATREON_URL, '_blank', 'noopener,noreferrer')
    if (!opened) window.location.href = PATREON_URL
    return
  }

  try {
    const { open } = await import('@tauri-apps/plugin-shell')
    await open(PATREON_URL)
  } catch (error) {
    console.error('Failed to open Patreon link', error)
    const opened = window.open(PATREON_URL, '_blank', 'noopener,noreferrer')
    if (!opened) window.location.href = PATREON_URL
  }
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

.access-gate__actions {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(0, 1fr) auto;
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

.access-gate__patreon {
  align-items: center;
  background: transparent;
  border: 1px solid var(--theme-border-strong);
  color: var(--theme-text);
  display: inline-flex;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 9px;
  font-weight: 900;
  justify-content: center;
  letter-spacing: 0.16em;
  min-height: 2.85rem;
  padding: 0.75rem 1rem;
  transition: background-color 180ms ease, color 180ms ease, opacity 180ms ease, transform 180ms ease;
  white-space: nowrap;
}

.access-gate__submit:hover:not(:disabled) {
  opacity: 0.78;
  transform: translateY(-1px);
}

.access-gate__patreon:hover {
  background: var(--theme-text);
  color: var(--theme-bg);
  transform: translateY(-1px);
}

.access-gate__submit:disabled {
  cursor: default;
  opacity: 0.38;
}

@media (max-width: 520px) {
  .access-gate__actions {
    grid-template-columns: 1fr;
  }
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
