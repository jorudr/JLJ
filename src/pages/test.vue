<template>
  <div class="ethereal-void min-h-screen relative transition-all duration-1000"
       :class="{ 'is-runified': isIdle, 'is-dark': isDark, 'dark': isDark, 'overflow-hidden': activeTab === 'genesis' }">
    
    <EtherealBackground :is-dark="isDark" :is-assembled="isAssembled" :show-bloom="showBloom" />
    <TesseractCanvas v-if="isTesseractEnabled" :is-dark="isDark" />
    <DesignVignette :is-dark="isDark" />

    <!-- PHANTOM HEADER SYSTEM -->
    <div v-show="activeTab === 'genesis' && route.query.mode !== 'matrix' && route.query.mode !== 'genesis-diary'" 
         class="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl px-8 h-16 z-[90] pointer-events-auto"
         @mouseenter="isHeaderHovered = true">
    </div>

    <div v-if="activeTab !== 'genesis' || (route.query.mode !== 'matrix' && route.query.mode !== 'genesis-diary')" 
         class="transition-all duration-700 fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl px-8 z-[100]"
         :class="[
           activeTab === 'genesis' ? (isHeaderHovered && route.query.mode !== 'matrix' && route.query.mode !== 'genesis-diary' ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0') : 'relative translate-y-0 opacity-100'
         ]"
         @mouseenter="activeTab === 'genesis' && route.query.mode !== 'matrix' && route.query.mode !== 'genesis-diary' ? (isHeaderHovered = true) : null"
         @mouseleave="isHeaderHovered = false">
      <HeaderF v-model:activeTab="activeTab" 
               v-model:isDark="isDark" 
               v-model:isTesseractEnabled="isTesseractEnabled" 
               :isAssembled="isAssembled" />
    </div>

    <MainWidget :activeTab="activeTab" @exit="activeTab = 'archive'" />

    <Transition name="slide-bottom" appear>
      <footer v-if="isAssembled" class="fixed bottom-0 left-0 right-0 z-40 px-16 py-12 blur-[1.5px] opacity-30 hover:blur-0 hover:opacity-100 transition-all duration-700">
        <div class="max-w-7xl mx-auto flex justify-between items-center text-[8px] font-mono tracking-[0.4em]">
          <div class="flex space-x-16 items-center">
            <span class="flex items-center space-x-2">
              <span class="w-2 h-2 border border-current/20 rotate-45"></span>
              <span>REIFICATION: STABLE</span>
            </span>
            <span class="opacity-40 italic">0x48.F7_SEQ // VOID_PROTOCOL</span>
          </div>
          <span>MANA_RESERVE: 98.4% [ + ]</span>
        </div>
      </footer>
    </Transition>


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '~/entities/user/auth.store'
import HeaderF from '~/widgets/header/ui/HeaderF.vue'
import MainWidget from '~/widgets/main-widget/ui/MainWidget.vue'
import EtherealBackground from '~/widgets/style/ui/EtherealBackground.vue'
import TesseractCanvas from '~/widgets/style/ui/TesseractCanvas.vue'
import DesignVignette from '~/widgets/style/ui/DesignVignette.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const activeTab = ref('archive')

const setDocumentScrollMode = (tab: string) => {
  if (typeof document === 'undefined') return

  const shouldLock = tab === 'genesis'
  const nuxtRoot = document.getElementById('__nuxt')

  document.documentElement.style.overflow = shouldLock ? 'hidden' : 'auto'
  document.documentElement.style.height = shouldLock ? '100%' : 'auto'
  document.body.style.overflow = shouldLock ? 'hidden' : 'auto'
  document.body.style.height = shouldLock ? '100vh' : 'auto'

  if (nuxtRoot) {
    nuxtRoot.style.overflow = shouldLock ? 'hidden' : 'visible'
    nuxtRoot.style.height = shouldLock ? '100%' : 'auto'
    nuxtRoot.style.minHeight = '100%'
  }
}

watch(activeTab, (newTab) => {
    const query = { ...route.query }
    if (newTab === 'archive') {
        delete query.tab
    } else {
        query.tab = newTab
    }
    router.replace({ query })

    setDocumentScrollMode(newTab)
})

watch(() => route.query.tab, (newQueryTab) => {
    if (newQueryTab && typeof newQueryTab === 'string') {
        const validTabs = ['archive', 'forum', 'genesis', 'matrix']
        if (validTabs.includes(newQueryTab)) {
            activeTab.value = newQueryTab
        }
    }
})
const isAssembled = ref(false)
const isTesseractEnabled = ref(true)
const isHeaderHovered = ref(false)

const showBloom = ref(true)
const isIdle = ref(false)
const isDark = ref(false)
let idleTimer: ReturnType<typeof setTimeout> | null = null

const activeUserId = computed(() => auth.user?.uid)


const resetIdleTimer = () => {
  if (isIdle.value) isIdle.value = false
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => isIdle.value = true, 30000)
}

onMounted(() => {
  if (route.query.tab && typeof route.query.tab === 'string') {
    activeTab.value = route.query.tab
  }
  setDocumentScrollMode(activeTab.value)
  
  window.addEventListener('mousemove', resetIdleTimer)
  window.addEventListener('keydown', resetIdleTimer)
  resetIdleTimer()
  setTimeout(() => { showBloom.value = false; setTimeout(() => isAssembled.value = true, 400) }, 1500)
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    const nuxtRoot = document.getElementById('__nuxt')

    document.documentElement.style.overflow = ''
    document.documentElement.style.height = ''
    document.body.style.overflow = ''
    document.body.style.height = ''

    if (nuxtRoot) {
      nuxtRoot.style.overflow = ''
      nuxtRoot.style.height = ''
      nuxtRoot.style.minHeight = ''
    }
  }

  window.removeEventListener('mousemove', resetIdleTimer)
  window.removeEventListener('keydown', resetIdleTimer)
  if (idleTimer) clearTimeout(idleTimer)
})

definePageMeta({ layout: false })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Noto+Sans+Runic&display=swap');

.ethereal-void {
  --bg-primary: #FFFFFF;
  --text-primary: #2C3E50;
  --text-secondary: rgba(44, 62, 80, 0.3);
  --border-primary: rgba(44, 62, 80, 0.1);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Cormorant Garamond', serif;
}

.ethereal-void h1, .ethereal-void h2, .ethereal-void h3, .ethereal-void h4 {
  color: inherit;
}

.ethereal-void.is-dark {
  --bg-primary: #000000;
  --text-primary: rgba(255, 255, 255, 0.5);
  --border-primary: rgba(255, 255, 255, 0.1);
}


.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
