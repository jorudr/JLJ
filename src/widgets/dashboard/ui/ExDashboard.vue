<template>
  <div class="h-full flex flex-col p-12 max-w-7xl mx-auto space-y-12 relative">
    <!-- 1. Header / Global Status -->
    <header class="flex justify-between items-start z-[200] relative">
      <div class="flex flex-col space-y-2">
        <ExHeading level="h1" variant="cinematic" class="!text-3xl">{{ t('dashboard.title') }}</ExHeading>
        <div class="flex items-center space-x-4">
           <ExTag>v1.0.4_REIFIED</ExTag>
           <ExText variant="small" class="opacity-30 tracking-[0.4em]">{{ t('dashboard.subtitle') }}</ExText>
        </div>
      </div>

      <div class="flex items-center space-x-12">
        <!-- Language Selector -->
        <div class="flex items-center space-x-4 border-r border-theme-border pr-8">
          <button 
            v-for="l in ['en', 'ru']" 
            :key="l"
            @click="setLocale(l)"
            class="text-[10px] font-mono tracking-widest uppercase transition-all duration-300"
            :class="locale === l ? 'text-theme-text font-bold underline underline-offset-4' : 'opacity-30 hover:opacity-100'"
          >
            {{ l }}
          </button>
        </div>



        <!-- User Identity (clickable → sign-out popover) -->
        <div class="relative" ref="identityRef">
          <button @click="toggleMenu" class="focus:outline-none cursor-pointer">
            <ExIdentity
              :name="displayName"
              :avatar-url="authStore.user?.photoURL ?? undefined"
              rank="Operator"
            />
          </button>

          <!-- Teleport dropdown to body to escape any overflow:hidden ancestors -->
          <Teleport to="body">
            <Transition name="menu-drop">
              <div
                v-if="userMenuOpen"
                ref="menuRef"
                :style="menuStyle"
                class="fixed z-[9999] min-w-[200px] border border-theme-border bg-theme-bg shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
              >
                <!-- User info strip -->
                <div class="px-5 py-3 border-b border-theme-border">
                  <p class="text-[8px] font-mono uppercase tracking-[0.4em] opacity-40">{{ t('dashboard.ui.signedInAs') }}</p>
                  <p class="text-[10px] font-mono font-black uppercase tracking-widest truncate">{{ authStore.user?.email }}</p>
                </div>
                <!-- Sign out -->
                <button
                  @click="doSignOut"
                  class="w-full flex items-center space-x-3 px-5 py-3 text-[9px] font-mono uppercase tracking-[0.4em] hover:text-red-400 transition-all duration-300"
                >
                  <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span>{{ t('dashboard.ui.signOut') }}</span>
                </button>
              </div>
            </Transition>
          </Teleport>
        </div>

        <!-- Theme Toggle -->
        <button
          class="w-5 opacity-30 hover:opacity-100 transition-all duration-300"
          @click="themeStore.toggleDark"
        >
          <template v-if="themeStore.isReady">
            <img
              alt="Toggle Theme"
              :src="themeStore.settings.isDark ? '/assets/light-mode-switcher.svg' : '/assets/dark-mode-switcher.svg'"
              class="block"
            />
          </template>
        </button>

      </div>
    </header>

    <!-- 2. The Module Grid (Central Hub) -->
    <main class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-8 z-10">
      <div v-for="module in dashboardModules" :key="module.id" class="relative group h-full">
        <button 
          @click="$emit('navigate', module.id)"
          class="w-full h-full text-left flex flex-col p-8 border border-theme-border bg-theme-bg/40 backdrop-blur-sm transition-all duration-700 hover:border-theme-text/40 hover:bg-theme-bg/60 relative overflow-hidden"
        >
          <!-- Background Accents -->
          <div class="absolute -top-12 -right-12 w-32 h-32 border border-theme-text opacity-60 rotate-45 group-hover:rotate-[135deg] transition-transform duration-1000"></div>
          
          <div class="flex flex-col h-full space-y-8 relative z-10">
            <div class="flex justify-between items-start">
               <div class="w-10 h-10 border border-theme-border flex items-center justify-center group-hover:border-theme-text transition-colors">
                  <ExText variant="telemetry" class="opacity-40 group-hover:opacity-100">{{ module.code }}</ExText>
               </div>
               <div class="w-1.5 h-1.5 bg-theme-accent rotate-45 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            <div class="flex flex-col space-y-2">
              <ExHeading level="h3" variant="cinematic" class="!text-xl group-hover:opacity-100 opacity-50 transition-all duration-700 whitespace-pre-line">{{ t(module.titleKey) }}</ExHeading>
              <ExText variant="small" class="opacity-40 leading-relaxed">{{ t(module.descriptionKey) }}</ExText>
            </div>

            <div class="mt-auto pt-6 border-t border-theme-border opacity-0 group-hover:opacity-100 transition-opacity duration-700">
               <div class="flex items-center space-x-2">
                  <div class="w-1 h-1 bg-theme-text"></div>
                  <ExText variant="telemetry" class="tracking-widest">{{ t('dashboard.ui.accessProtocol') }}</ExText>
               </div>
            </div>
          </div>
          
          <!-- Hover Edge Slide -->
          <div class="absolute bottom-0 left-0 w-full h-0.5 bg-theme-text transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
        </button>
      </div>
    </main>

    <!-- 3. Bottom Utility Bar -->
    <footer class="flex justify-between items-center z-10 opacity-100 pt-8 border-t border-theme-border">
      <div class="flex space-x-12 items-center">
        <ExText variant="small" class="tracking-widest uppercase">{{ t('dashboard.ui.systemTime') }}</ExText>
        <ExText variant="small" class="tracking-widest uppercase">{{ t('dashboard.ui.encryption') }}</ExText>
      </div>
      <div class="flex space-x-4">
         <div v-for="i in 4" :key="i" class="w-1 h-1 border border-theme-text rotate-45"></div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { getAuth, signOut } from 'firebase/auth'
import { useI18n } from '~/shared/i18n/useI18n'
import ExHeading from "~/shared/ui/ExHeading.vue"
import ExText from "~/shared/ui/ExText.vue"
import ExTag from "~/shared/ui/ExTag.vue"
import ExIdentity from "~/shared/ui/ExIdentity.vue"
import { useAuthStore } from '~/entities/user/auth.store'
import { useThemeStore } from '~/features/store/useTheme'

const emit = defineEmits(['navigate', 'signed-out'])

const { t, locale, setLocale } = useI18n()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// User menu
const userMenuOpen = ref(false)
const identityRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

const toggleMenu = () => {
  if (!userMenuOpen.value && identityRef.value) {
    const rect = identityRef.value.getBoundingClientRect()
    const themeRoot = identityRef.value.closest('.theme-dark, .theme-light') as HTMLElement | null
    const themeStyle = themeRoot ? getComputedStyle(themeRoot) : null
    const themeBg = themeStyle?.getPropertyValue('--theme-bg').trim() || '#0a0a0a'
    const themeText = themeStyle?.getPropertyValue('--theme-text').trim() || 'rgba(255, 255, 255, 0.7)'
    const themeBorder = themeStyle?.getPropertyValue('--theme-border').trim() || 'rgba(255, 255, 255, 0.1)'

    menuStyle.value = {
      top: `${rect.bottom + 8}px`,
      right: `${window.innerWidth - rect.right}px`,
      backgroundColor: themeBg,
      color: themeText,
      borderColor: themeBorder,
      '--theme-bg': themeBg,
      '--theme-text': themeText,
      '--theme-border': themeBorder,
    }
  }
  userMenuOpen.value = !userMenuOpen.value
}

const doSignOut = async () => {
  userMenuOpen.value = false
  await signOut(getAuth())
  authStore.setUser(null as any)
  emit('signed-out')
}

// Close on outside click
const handleOutsideClick = (e: MouseEvent) => {
  const target = e.target as Node

  if (
    identityRef.value &&
    !identityRef.value.contains(target) &&
    !menuRef.value?.contains(target)
  ) {
    userMenuOpen.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))

const displayName = computed(() => {
  const u = authStore.user
  if (!u) return 'Operator'
  return u.displayName || u.email?.split('@')[0] || 'Operator'
})

const dashboardModules = [
  { 
    id: 'forum', 
    code: 'F1', 
    titleKey: 'dashboard.modules.knowledge_matrix', 
    descriptionKey: 'dashboard.descriptions.knowledge_matrix' 
  },
  { 
    id: 'activity', 
    code: 'A2', 
    titleKey: 'dashboard.modules.activity_monitor', 
    descriptionKey: 'dashboard.descriptions.activity_monitor' 
  },
  { 
    id: 'genesis', 
    code: 'G3', 
    titleKey: 'dashboard.modules.genesis_protocol', 
    descriptionKey: 'dashboard.descriptions.genesis_protocol' 
  }
]
</script>

<style scoped>
.menu-drop-enter-active,
.menu-drop-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.menu-drop-enter-from,
.menu-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
