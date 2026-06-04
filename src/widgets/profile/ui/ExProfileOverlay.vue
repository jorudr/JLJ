<template>
  <Teleport to="body">
    <Transition name="profile-overlay">
      <div
        v-if="open"
        class="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 lg:p-10 bg-black/75"
        @click.self="emit('close')"
      >
        <div class="w-full max-w-6xl max-h-[92vh] overflow-y-auto border border-white/10 bg-[#0a0a0a] text-white shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
          <div class="grid grid-cols-1 lg:grid-cols-[240px_1fr] min-h-[720px]">
            <aside class="border-b lg:border-b-0 lg:border-r border-white/10 p-6 lg:p-8 bg-white/[0.03]">
              <div class="flex items-center gap-3 pb-6 border-b border-white/10">
                <div class="w-10 h-10 rounded-full border border-white/10 bg-white text-black flex items-center justify-center font-serif italic text-lg">
                  {{ profileInitial }}
                </div>
                <div class="flex flex-col">
                  <span class="text-[9px] font-mono uppercase tracking-[0.35em] opacity-40">Profile</span>
                  <span class="text-[10px] font-mono uppercase tracking-[0.25em] opacity-55">Settings</span>
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
                <div class="text-[8px] font-mono uppercase tracking-[0.35em] opacity-35">Signed in as</div>
                <div class="text-[10px] font-mono tracking-[0.12em] text-white/85 break-all">
                  {{ profileEmail }}
                </div>
              </div>
            </aside>

            <main class="p-6 lg:p-10 min-h-[720px]">
              <div class="flex items-center justify-between gap-4 border-b border-white/10 pb-5 mb-8">
                <div class="flex flex-col gap-1">
                  <h2 class="text-2xl lg:text-3xl font-serif tracking-[0.05em] text-white leading-tight">
                    {{ activeTab === 'profile' ? 'Personal details' : 'App theme' }}
                  </h2>
                  <p class="text-sm leading-7 text-white/65 max-w-lg">
                    {{ activeTab === 'profile' ? 'Keep the core identity fields visible and unobtrusive.' : 'Minimal theme controls with a few restrained accent choices.' }}
                  </p>
                </div>

                <button
                  type="button"
                  class="px-3 py-2 border border-white/10 text-[8px] font-mono uppercase tracking-[0.25em] opacity-65 hover:opacity-100 hover:border-white transition-colors"
                  @click="emit('close')"
                >
                  Close
                </button>
              </div>

              <div v-if="activeTab === 'profile'" class="max-w-2xl space-y-8">
                <div class="space-y-5">
                  <div class="space-y-2">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] opacity-35">Display name</span>
                    <div class="px-4 py-3 border border-white/10 bg-white/[0.03] font-mono tracking-[0.12em] text-white">
                      {{ profileDisplayName }}
                    </div>
                  </div>

                  <div class="space-y-2">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] opacity-35">Email address</span>
                    <div class="px-4 py-3 border border-white/10 bg-white/[0.03] font-mono tracking-[0.08em] text-white/90 break-all">
                      {{ profileEmail }}
                    </div>
                  </div>

                  <div class="space-y-2">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] opacity-35">Description</span>
                    <textarea
                      v-model="profileDescriptionDraft"
                      rows="6"
                      placeholder="Short description about the user"
                      class="w-full px-4 py-3 border border-white/10 bg-white/[0.03] text-[13px] leading-7 text-white placeholder:opacity-25 focus:outline-none focus:border-white/50 resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

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
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] opacity-40">Accent</span>
                    <span class="text-[8px] font-mono uppercase tracking-[0.25em] opacity-30">Presets</span>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div v-for="tone in appearanceTones" :key="tone.name" class="flex flex-col gap-2">
                      <div class="h-12 border border-white/10 bg-black" :style="{ backgroundColor: tone.value }"></div>
                      <span class="text-[8px] font-mono uppercase tracking-[0.18em] opacity-55">{{ tone.name }}</span>
                    </div>
                  </div>
                </div>

                <div class="space-y-4 pt-2">
                  <div class="flex items-center justify-between">
                    <span class="text-[9px] font-mono uppercase tracking-[0.35em] opacity-40">Background image</span>
                    <span class="text-[8px] font-mono uppercase tracking-[0.25em] opacity-30">Upload</span>
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
                        <span class="text-[10px] font-mono uppercase tracking-[0.3em] text-white font-black">Choose image</span>
                        <span class="text-[8px] font-mono uppercase tracking-[0.25em] opacity-35 truncate">
                          {{ backgroundFileName || 'No file selected' }}
                        </span>
                      </div>
                      <span class="px-3 py-1 border border-white/10 text-[8px] font-mono uppercase tracking-[0.25em] opacity-70 shrink-0">
                        Browse
                      </span>
                    </div>
                  </label>

                  <div class="border border-white/10 overflow-hidden bg-white/[0.03]">
                    <div class="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <span class="text-[9px] font-mono uppercase tracking-[0.35em] opacity-40">Preview</span>
                      <span class="text-[8px] font-mono uppercase tracking-[0.25em] opacity-30">Wallpaper</span>
                    </div>
                  <div class="h-28 bg-cover bg-center bg-black" :style="backgroundImageStyle">
                    <div class="h-full w-full bg-black/35"></div>
                  </div>
                </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import { useAuthStore } from '~/entities/user/auth.store'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const authStore = useAuthStore()

const profileDisplayName = computed(() => authStore.user?.displayName?.trim() || 'Operator_0x4F')
const profileEmail = computed(() => authStore.user?.email?.trim() || 'operator@genesis.app')
const profileInitial = computed(() => (profileDisplayName.value[0] || 'O').toUpperCase())

const activeTab = ref<'profile' | 'appearance'>('profile')

const profileTabs = [
  { key: 'profile', label: 'Profile', note: 'Core' },
  { key: 'appearance', label: 'Appearance', note: 'Theme' }
] as const

const profileDescriptionDraft = ref(
  authStore.user?.displayName
    ? `${authStore.user.displayName} keeps the profile minimal, readable, and aligned with the app's overall tone.`
    : 'Keep the profile minimal, readable, and aligned with the app\'s overall tone.'
)

const appearanceModes = [
  { key: 'dark', label: 'Dark', note: 'Active', active: true },
  { key: 'light', label: 'Light', note: 'Available', active: false },
  { key: 'system', label: 'System', note: 'Auto', active: false }
] as const

const appearanceTones = [
  { name: 'Ink', value: '#ffffff' },
  { name: 'Paper', value: '#111111' },
  { name: 'Sky', value: '#7dd3fc' },
  { name: 'Mint', value: '#6ee7b7' }
]

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

onBeforeUnmount(() => {
  if (backgroundImageUrl.value) {
    URL.revokeObjectURL(backgroundImageUrl.value)
  }
})
</script>

<style scoped>
.profile-overlay-enter-active,
.profile-overlay-leave-active {
  transition: opacity 0.25s ease;
}
.profile-overlay-enter-from,
.profile-overlay-leave-to {
  opacity: 0;
}
</style>
