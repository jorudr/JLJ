<template>
  <div class="ethereal-void h-full min-h-full relative overflow-hidden transition-all duration-1000"
       :class="[isDark ? 'is-dark dark theme-dark' : 'theme-light']">

    <Transition name="fade">
       <ExInitialization v-if="!hasInitialized" @initiate="handleInitializationComplete" />
    </Transition>

    <EtherealBackground :is-dark="isDark" :is-assembled="isAssembled" :show-bloom="showBloom" />
    <TesseractCanvas v-if="isTesseractEnabled" :is-dark="isDark" />
    <DesignVignette :is-dark="isDark" />

    <button v-if="!isNodeMapActive"
            @click="isDark = !isDark"
            class="fixed top-12 right-12 z-[5000] px-6 py-2 border-2 border-theme-border bg-theme-bg text-theme-text hover:bg-theme-text hover:text-theme-bg transition-all duration-500 group flex items-center space-x-4">
      <span class="text-[9px] font-mono tracking-[0.4em] uppercase font-black">{{ isDark ? 'SWT_LIGHT_MODE' : 'SWT_DARK_MODE' }}</span>
      <div class="w-2 h-2 border border-current rotate-45 transition-transform group-hover:rotate-[135deg]" :class="isDark ? 'bg-white' : 'bg-black'"></div>
    </button>

    <div
      class="relative z-10 flex inset-0 h-full"
      :class="activeTab === 'forum' ? 'items-start justify-center py-0' : 'items-center justify-center py-20'"
    >
       <Transition name="page-reify" mode="out-in">
         <!-- Dashboard Hub (No Tab) -->
         <div v-if="isAssembled && !activeTab" key="hub" class="w-full h-full">
            <ExDashboard @navigate="handleDashboardNavigate" />
         </div>

         <!-- Genesis Module -->
          <div v-else-if="isAssembled && activeTab === 'genesis'" key="genesis" class="w-full h-screen">
             <Transition name="page-reify" mode="out-in">
                <!-- Menu -->
                <div v-if="!currentGenesisMode" key="menu" class="w-full h-full pt-10">
                   <ExGenesisMenu @select="handleGenesisSelect" @back="goToHub" />
                </div>

                <!-- Matrix -->
                <div v-else-if="currentGenesisMode === 'matrix'" key="matrix" class="w-full h-screen">
                   <ExGenesisMatrix :active-tab="activeTab" :is-dark="isDark" @exit="clearMode" />
                </div>

                <!-- Diary -->
                <div v-else-if="currentGenesisMode === 'diary'" key="diary" class="w-full h-full">
                   <ExEquityCurve3D @exit="clearMode" />
                </div>

                <!-- Log -->
                <div v-else-if="currentGenesisMode === 'log'" key="log" class="w-full h-full">
                   <ExGenesisLog @exit="clearMode" @nodeMapState="isNodeMapActive = $event" />
                </div>

                <!-- Default Placeholder -->
                <div v-else key="fallback" class="w-full h-full flex flex-col items-center justify-center space-y-8">
                   <ExHeading level="h2" variant="cinematic" class="!text-3xl uppercase tracking-[0.2em]">Module_{{ currentGenesisMode }}_Reification</ExHeading>
                   <ExText class="opacity-40 italic">Structural matrix not yet stabilized in laboratory environment.</ExText>
                   <button @click="clearMode" class="mt-8 px-8 py-3 border border-theme-text/20 hover:border-theme-text transition-colors text-[10px] font-mono tracking-[0.4em] uppercase">
                     [ ESC_TO_MODULE_ORIGIN ]
                   </button>
                </div>
             </Transition>
          </div>

         <!-- Forum Module -->
         <div v-else-if="isAssembled && activeTab === 'forum'" key="forum" class="w-full h-full overflow-y-auto">
            <ExForum />
         </div>

         <!-- Activity Module -->
         <div v-else-if="isAssembled && activeTab === 'activity'" key="activity" class="w-full h-full flex flex-col items-center justify-center">
            <ExActivityMonitor @exit="goToHub" />
         </div>
       </Transition>
    </div>

     <!-- Global Bottom Center Label -->
     <div v-if="activeTab && !isNodeMapActive" class="fixed bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-widest uppercase opacity-40 pointer-events-none z-[5000]">
       Click Left Arrow to Go back
     </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExDashboard from '~/shared/ui/components/ExDashboard.vue'
import EtherealBackground from '~/widgets/style/ui/EtherealBackground.vue'
import TesseractCanvas from '~/widgets/style/ui/TesseractCanvas.vue'
import DesignVignette from '~/widgets/style/ui/DesignVignette.vue'
import ExHeading from '~/shared/ui/ExHeading.vue'
import ExText from '~/shared/ui/ExText.vue'
import ExGenesisMenu from '~/shared/ui/components/ExGenesisMenu.vue'
import ExInitialization from '~/shared/ui/components/ExInitialization.vue'

import ExGenesisMatrix from '~/widgets/genesis/ui/ExGenesisMatrix.vue'
import ExEquityCurve3D from '~/shared/ui/components/ExEquityCurve3D.vue'
import ExGenesisLog from '~/widgets/genesis/ui/ExGenesisLog.vue'
import ExForum from '~/widgets/exforum/ui/ExForum.vue'
import ExActivityMonitor from '~/shared/ui/components/ExActivityMonitor.vue'

import { useThemeStore } from '~/features/store/useTheme'

const themeStore = useThemeStore()
const isDark = computed({
  get: () => themeStore.settings.isDark,
  set: () => themeStore.toggleDark()
})

const route = useRoute()
const router = useRouter()

const genesisBasePath = '/test_clean/genesis'
const validTabs = ['activity', 'forum', 'genesis', 'matrix']
const modeMap = {
  diary: 'log',
  'genesis-diary': 'diary',
  matrix: 'matrix'
}

const hasInitialized = ref(false)
const isAssembled = ref(false)
const showBloom = ref(true)
const isTesseractEnabled = ref(false)
const isNodeMapActive = ref(false)
const activeTab = ref('')

const isGenesisPath = computed(() => route.path === genesisBasePath || route.path.startsWith(`${genesisBasePath}/`))

const getRouteMode = () => {
  const routeMode = route.params.mode
  const modeFromPath = Array.isArray(routeMode) ? routeMode[0] : routeMode
  if (typeof modeFromPath === 'string' && modeFromPath) return modeFromPath

  const queryMode = route.query.mode
  return typeof queryMode === 'string' ? queryMode : ''
}

const currentGenesisMode = computed(() => getRouteMode())

const getRouteTab = () => {
  const queryTab = route.query.tab
  if (typeof queryTab === 'string' && validTabs.includes(queryTab)) return queryTab
  if (isGenesisPath.value || currentGenesisMode.value) return 'genesis'
  return ''
}

const setScrollLock = (tab) => {
  if (tab === 'genesis') {
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100vh'
  } else {
    document.body.style.overflow = ''
    document.body.style.height = ''
  }
}

const canonicalizeGenesisRoute = () => {
  if (activeTab.value !== 'genesis') return

  const mode = currentGenesisMode.value
  const targetPath = mode ? `${genesisBasePath}/${mode}` : genesisBasePath
  const query = { ...route.query, tab: 'genesis' }

  if (mode) {
    query.mode = mode
  } else {
    delete query.mode
  }

  if (route.path !== targetPath || route.query.tab !== 'genesis' || route.query.mode !== query.mode) {
    router.replace({ path: targetPath, query })
  }
}

const syncTabFromRoute = () => {
  activeTab.value = getRouteTab()
  canonicalizeGenesisRoute()
}

const handleDashboardNavigate = (tab) => {
  if (!tab) {
    goToHub()
    return
  }

  activeTab.value = tab
  const query = { ...route.query, tab }
  delete query.mode

  const path = tab === 'genesis'
    ? genesisBasePath
    : '/test_clean'

  router.push({
    path,
    query
  })
}

const handleGenesisSelect = (moduleId) => {
  const mode = modeMap[moduleId] || moduleId
  router.push({
    path: `${genesisBasePath}/${mode}`,
    query: {
      ...route.query,
      tab: 'genesis',
      mode
    }
  })
}

const clearMode = () => {
  const query = { ...route.query, tab: 'genesis' }
  delete query.mode

  router.push({
    path: genesisBasePath,
    query
  })
}

const goToHub = () => {
  activeTab.value = ''
  const query = { ...route.query }
  delete query.tab
  delete query.mode

  router.push({
    path: '/test_clean',
    query
  })
}

watch(() => [route.path, route.params.mode, route.query.tab, route.query.mode], syncTabFromRoute, { immediate: true })

watch(activeTab, (newTab) => {
  setScrollLock(newTab)
}, { immediate: true })

const handleGlobalKeydown = (e) => {
  // Prevent back navigation if user is typing in an input field
  if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
    return
  }
  
  if (e.key === 'ArrowLeft') {
    if (currentGenesisMode.value) {
      clearMode()
    } else if (activeTab.value) {
      goToHub()
    }
  }
}

const handleInitializationComplete = () => {
  hasInitialized.value = true
  
  setTimeout(() => {
    showBloom.value = false
    setTimeout(() => {
      isAssembled.value = true
    }, 400)
  }, 500)
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  document.body.style.overflow = ''
  document.body.style.height = ''
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');

/* THEME DEFINITIONS - SYNCED WITH TEST.VUE */
.theme-dark {
  --theme-bg: #0a0a0a;
  --theme-text: rgba(255, 255, 255, 0.7);
  --theme-border: rgba(255, 255, 255, 0.1);
  --theme-border-strong: rgba(255, 255, 255, 0.25);
}

.theme-light {
  --theme-bg: #FFFFFF;
  --theme-text: #2C3E50;
  --theme-border: rgba(44, 62, 80, 0.1);
  --theme-border-strong: rgba(44, 62, 80, 0.25);
}

.ethereal-void {
  background-color: var(--theme-bg);
  color: var(--theme-text);
  font-family: 'Cormorant Garamond', serif;
  transition: background-color 1s ease, color 1s ease;
}

/* Base resets using theme tokens */
body {
  background-color: var(--theme-bg);
  margin: 0;
  -webkit-font-smoothing: antialiased;
}

.bg-theme-bg { background-color: var(--theme-bg); }
.text-theme-text { color: var(--theme-text); }
.border-theme-border { border-color: var(--theme-border); }
.border-theme-text { border-color: var(--theme-text); }

/* Animation: Page Reify */
.page-reify-enter-active,
.page-reify-leave-active {
  transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.page-reify-enter-from,
.page-reify-leave-to {
  opacity: 0;
  transform: translateY(20px);
  filter: blur(10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--theme-border-strong); }
</style>
