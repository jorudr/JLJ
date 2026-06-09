<template>
  <Teleport to="body">
    <Transition name="profile-overlay">
      <div
        v-if="open"
        class="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-black/45 profile-overlay-backdrop"
        @click.self="emit('close')"
      >
        <ExPanel
          variant="light"
          noPadding
          class="!w-full !max-w-6xl !h-[74vh] !overflow-visible !border-white/10 !bg-[#0a0a0a]/80 text-white"
        >
          <button
            @click="emit('close')"
            class="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-40 bg-[#070707] border-t border-r border-b border-white/20 flex items-center justify-center group/close-tab cursor-pointer hover:bg-[#111] transition-colors z-[100]"
          >
            <div class="w-[1px] h-16 bg-white/10 group-hover/close-tab:bg-white/40 transition-all duration-300"></div>
            <span class="absolute text-[7px] font-mono tracking-[0.4em] uppercase text-white/10 group-hover/close-tab:text-white/40 rotate-90 whitespace-nowrap">{{ locale === 'ru' ? 'ЗАКРЫТЬ_ПРОФИЛЬ' : 'Close_Profile' }}</span>
          </button>

          <template #telemetry>
            <span class="sr-only">{{ locale === 'ru' ? 'Панель настроек профиля' : 'Profile settings panel' }}</span>
          </template>
          <div class="grid grid-cols-1 lg:grid-cols-[240px_1fr] h-full min-h-0 overflow-hidden">
            <aside class="h-full border-b lg:border-b-0 lg:border-r border-white/10 p-6 lg:p-8 bg-white/[0.03] overflow-hidden">
              <div class="flex items-center gap-3 pb-6 border-b border-white/10">
                <div class="w-10 h-10 rounded-full border border-white/10 bg-white text-[#0a0a0a] flex items-center justify-center font-serif italic text-lg overflow-hidden">
                  <img
                    v-if="profileAvatarUrl"
                    :src="profileAvatarUrl"
                    alt="User avatar"
                    class="w-full h-full object-cover"
                    referrerpolicy="no-referrer"
                  />
                  <span v-else>{{ profileInitial }}</span>
                </div>
                <div class="flex flex-col min-w-0">
                  <span class="text-[9px] font-mono uppercase tracking-[0.35em] opacity-35">{{ locale === 'ru' ? 'Профиль' : 'Profile' }}</span>
                  <span class="text-[10px] font-mono uppercase tracking-[0.25em] opacity-50 truncate">{{ locale === 'ru' ? 'Настройки' : 'Settings' }}</span>
                </div>
              </div>

              <nav class="mt-6 flex flex-col gap-2">
                <button
                  v-for="tab in profileTabs"
                  :key="tab.key"
                  type="button"
                  @click="activeTab = tab.key"
                  class="flex items-center justify-between px-4 py-3 border text-left transition-colors duration-300 text-white"
                  :class="activeTab === tab.key ? 'border-white bg-white/10 shadow-[inset_3px_0_0_rgba(255,255,255,0.9)]' : 'border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.03]'"
                >
                  <span class="text-[10px] font-mono uppercase tracking-[0.3em] font-black text-white">{{ tab.label }}</span>
                  <span class="text-[8px] font-mono uppercase tracking-[0.22em] text-white" :class="activeTab === tab.key ? 'opacity-70' : 'opacity-35'">
                    {{ tab.note }}
                  </span>
                </button>
              </nav>

              <div class="mt-8 pt-6 border-t border-white/10 space-y-2">
                <div class="text-[8px] font-mono uppercase tracking-[0.35em] opacity-30">{{ locale === 'ru' ? 'Вы вошли как' : 'Signed in as' }}</div>
                <div class="text-[10px] font-mono tracking-[0.12em] text-white/85 break-all">
                  {{ profileEmail }}
                </div>
              </div>

              <div class="mt-6 pt-6 border-t border-white/10 space-y-2">
                <div class="text-[8px] font-mono uppercase tracking-[0.35em] opacity-30">{{ locale === 'ru' ? 'Тип аккаунта' : 'Account type' }}</div>
                <div class="text-[10px] font-mono uppercase tracking-[0.25em] text-white/85">
                  {{ profileAccountType }}
                </div>
              </div>
            </aside>

            <main class="h-full min-h-0 overflow-y-auto p-6 lg:p-10">
              <div class="flex items-start gap-6 border-b border-white/10 pb-6 mb-8">
                <div class="space-y-2">
                  <span class="text-[10px] font-mono uppercase tracking-[0.35em] opacity-35">
                    {{ activeTab === 'profile' ? (locale === 'ru' ? 'Аккаунт' : 'Account') : (locale === 'ru' ? 'Внешний вид' : 'Appearance') }}
                  </span>
                  <h2 class="text-3xl lg:text-4xl font-serif tracking-[0.05em] text-white leading-tight">
                    {{ activeTab === 'profile' ? (locale === 'ru' ? 'Личные данные' : 'Personal details') : (locale === 'ru' ? 'Тема приложения' : 'App theme') }}
                  </h2>
                  <p class="text-sm leading-7 text-white/65 max-w-lg">
                    {{ activeTab === 'profile' ? (locale === 'ru' ? 'Держите основные поля идентификации видимыми и ненавязчивыми.' : 'Keep the core identity fields visible and unobtrusive.') : (locale === 'ru' ? 'Минималистичное управление темой с несколькими сдержанными акцентами.' : 'Minimal theme controls with a few restrained accent choices.') }}
                  </p>
                </div>
              </div>

              <form v-if="activeTab === 'profile'" class="max-w-2xl space-y-8" @submit.prevent="saveProfile">
                <div class="space-y-5">
                  <div class="space-y-2">
                    <label for="profile-overlay-display-name" class="block text-[9px] font-mono uppercase tracking-[0.35em] opacity-35">{{ locale === 'ru' ? 'Отображаемое имя' : 'Display name' }}</label>
                    <input
                      id="profile-overlay-display-name"
                      v-model="displayName"
                      type="text"
                      autocomplete="name"
                      :placeholder="locale === 'ru' ? 'Оператор_0x4F' : 'Operator_0x4F'"
                      class="w-full px-4 py-3 border border-white/10 bg-white/[0.03] font-mono tracking-[0.12em] text-white placeholder:text-white/25 focus:outline-none focus:border-white/50"
                    />
                  </div>

                  <div class="space-y-2">
                    <label for="profile-overlay-email" class="block text-[9px] font-mono uppercase tracking-[0.35em] opacity-35">{{ locale === 'ru' ? 'Адрес электронной почты' : 'Email address' }}</label>
                    <div class="relative">
                      <input
                        id="profile-overlay-email"
                        :value="profileEmail"
                        type="email"
                        readonly
                        tabindex="-1"
                        class="w-full px-4 py-3 border border-white/10 bg-white/[0.03] font-mono tracking-[0.08em] text-white/90 break-all focus:outline-none"
                      />
                      <div class="absolute inset-0 flex items-center justify-end border border-white/10 bg-[#0a0a0a]/45 px-4 backdrop-blur-[1px] pointer-events-none">
                        <span class="text-[8px] font-mono uppercase tracking-[0.3em] text-white/55">
                          {{ emailLockedLabel }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <label for="profile-overlay-description" class="block text-[9px] font-mono uppercase tracking-[0.35em] opacity-35">{{ locale === 'ru' ? 'Описание' : 'Description' }}</label>
                    <textarea
                      id="profile-overlay-description"
                      v-model="description"
                      rows="6"
                      :placeholder="locale === 'ru' ? 'Краткое описание пользователя' : 'Short description about the user'"
                      class="w-full px-4 py-3 border border-white/10 bg-white/[0.03] text-[13px] leading-7 text-white placeholder:text-white/25 focus:outline-none focus:border-white/50 resize-none"
                    ></textarea>
                  </div>
                </div>

                <div class="flex items-center gap-4 border-t border-white/10 pt-6">
                  <button
                    type="submit"
                    :disabled="isSubmitting"
                    class="border border-white/15 bg-white text-[#0a0a0a] px-6 py-3 text-[9px] font-mono uppercase tracking-[0.35em] font-black transition-colors duration-300 hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {{ isSubmitting ? savingLabel : saveLabel }}
                  </button>
                  <div v-if="errorMessage || successMessage" class="text-[9px] font-mono uppercase tracking-[0.25em] text-white">
                    {{ errorMessage || successMessage }}
                  </div>
                </div>
              </form>

              <div v-else class="max-w-2xl space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    v-for="mode in appearanceModes"
                    :key="mode.key"
                    type="button"
                    class="p-4 border text-left transition-colors duration-300 text-white"
                    :class="mode.active ? 'border-white bg-white/10 shadow-[inset_3px_0_0_rgba(255,255,255,0.9)]' : 'border-white/10 bg-white/[0.03] hover:border-white/30'"
                  >
                    <span class="block text-[9px] font-mono uppercase tracking-[0.35em] font-black text-white">{{ mode.label }}</span>
                    <span class="block text-[8px] font-mono uppercase tracking-[0.25em] mt-2 text-white" :class="mode.active ? 'opacity-70' : 'opacity-40'">
                      {{ mode.note }}
                    </span>
                  </button>
                </div>

                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] opacity-40">{{ locale === 'ru' ? 'Акцент' : 'Accent' }}</span>
                    <span class="text-[8px] font-mono uppercase tracking-[0.25em] opacity-30">{{ locale === 'ru' ? 'Пресеты' : 'Presets' }}</span>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div v-for="tone in appearanceTones" :key="tone.name" class="flex flex-col gap-2">
                      <div class="h-12 border border-white/10 bg-[#0a0a0a]" :style="{ backgroundColor: tone.value }"></div>
                      <span class="text-[8px] font-mono uppercase tracking-[0.18em] text-white/55">{{ tone.name }}</span>
                    </div>
                  </div>
                </div>

                <div class="space-y-4 pt-2">
                  <div class="flex items-center justify-between">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] opacity-40">{{ locale === 'ru' ? 'Фоновое изображение' : 'Background image' }}</span>
                    <span class="text-[8px] font-mono uppercase tracking-[0.25em] opacity-30">{{ locale === 'ru' ? 'Загрузка' : 'Upload' }}</span>
                  </div>

                  <label class="block border border-white/10 bg-white/[0.03] px-4 py-4 cursor-pointer hover:border-white/30 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handleBackgroundUpload"
                    />
                    <div class="flex items-center justify-between gap-4">
                      <div class="flex flex-col space-y-1 min-w-0">
                        <span class="text-[10px] font-mono uppercase tracking-[0.3em] text-white font-black">{{ locale === 'ru' ? 'Выбрать изображение' : 'Choose image' }}</span>
                        <span class="text-[8px] font-mono uppercase tracking-[0.25em] opacity-35 truncate">
                          {{ backgroundFileName || (locale === 'ru' ? 'Файл не выбран' : 'No file selected') }}
                        </span>
                      </div>
                      <span class="px-3 py-1 border border-white/10 text-[8px] font-mono uppercase tracking-[0.25em] text-white/70 shrink-0">
                        {{ locale === 'ru' ? 'Обзор' : 'Browse' }}
                      </span>
                    </div>
                  </label>

                  <div class="border border-white/10 overflow-hidden bg-white/[0.03]">
                    <div class="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <span class="text-[9px] font-mono uppercase tracking-[0.35em] opacity-40">{{ locale === 'ru' ? 'Превью' : 'Preview' }}</span>
                      <span class="text-[8px] font-mono uppercase tracking-[0.25em] opacity-30">{{ locale === 'ru' ? 'Обои' : 'Wallpaper' }}</span>
                    </div>
                    <div class="h-28 bg-cover bg-center bg-[#0a0a0a]" :style="backgroundImageStyle">
                      <div class="h-full w-full bg-black/35"></div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </ExPanel>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount, watch } from 'vue'
import { useAuthStore } from '~/entities/user/auth.store'
import { useProfile } from '~/widgets/profile/model/useProfile'
import ExPanel from '~/shared/ui/ExPanel.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const authStore = useAuthStore()
const {
  displayName,
  description,
  isSubmitting,
  errorMessage,
  successMessage,
  loadProfile,
  saveProfile,
  locale
} = useProfile()

const profileDisplayName = computed(() => displayName.value.trim() || authStore.user?.displayName?.trim() || 'Operator_0x4F')
const profileEmail = computed(() => authStore.user?.email?.trim() || 'operator@genesis.app')
const profileAvatarUrl = computed(() => authStore.user?.photoURL || '')
const profileInitial = computed(() => (profileDisplayName.value[0] || 'O').toUpperCase())
const profileAccountType = computed(() => String(authStore.user?.type || 'common').toUpperCase())
const emailLockedLabel = computed(() => locale.value === 'ru' ? 'ПОЧТА НЕИЗМЕНЯЕМА' : 'EMAIL LOCKED')
const saveLabel = computed(() => locale.value === 'ru' ? 'СОХРАНИТЬ' : 'SAVE')
const savingLabel = computed(() => locale.value === 'ru' ? 'СОХРАНЕНИЕ' : 'SAVING')

const activeTab = ref<'profile' | 'appearance'>('profile')

const profileTabs = computed(() => [
  { key: 'profile' as const, label: locale.value === 'ru' ? 'Профиль' : 'Profile', note: locale.value === 'ru' ? 'Основа' : 'Core' },
  { key: 'appearance' as const, label: locale.value === 'ru' ? 'Внешний вид' : 'Appearance', note: locale.value === 'ru' ? 'Тема' : 'Theme' }
])

const appearanceModes = computed(() => [
  { key: 'dark', label: locale.value === 'ru' ? 'Темная' : 'Dark', note: locale.value === 'ru' ? 'Активна' : 'Active', active: true },
  { key: 'light', label: locale.value === 'ru' ? 'Светлая' : 'Light', note: locale.value === 'ru' ? 'Доступна' : 'Available', active: false },
  { key: 'system', label: locale.value === 'ru' ? 'Системная' : 'System', note: locale.value === 'ru' ? 'Авто' : 'Auto', active: false }
])

const appearanceTones = computed(() => [
  { name: locale.value === 'ru' ? 'Чернила' : 'Ink', value: '#ffffff' },
  { name: locale.value === 'ru' ? 'Бумага' : 'Paper', value: '#111111' },
  { name: locale.value === 'ru' ? 'Небо' : 'Sky', value: '#7dd3fc' },
  { name: locale.value === 'ru' ? 'Мята' : 'Mint', value: '#6ee7b7' }
])

const backgroundImageUrl = ref<string | null>(null)
const backgroundFileName = ref('')

const backgroundImageStyle = computed(() => ({
  backgroundImage: backgroundImageUrl.value ? `url(${backgroundImageUrl.value})` : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0))'
}))

const handleBackgroundUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (backgroundImageUrl.value) {
    URL.revokeObjectURL(backgroundImageUrl.value)
  }

  backgroundImageUrl.value = URL.createObjectURL(file)
  backgroundFileName.value = file.name
}

const hydrateProfile = async () => {
  await loadProfile()
  if (!displayName.value.trim()) {
    displayName.value = authStore.user?.displayName?.trim() || 'Operator_0x4F'
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    activeTab.value = 'profile'
    void hydrateProfile()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (backgroundImageUrl.value) {
    URL.revokeObjectURL(backgroundImageUrl.value)
  }
})
</script>

<style scoped>
.profile-overlay-backdrop {
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.profile-overlay-enter-active,
.profile-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.profile-overlay-enter-from,
.profile-overlay-leave-to {
  opacity: 0;
}
</style>
