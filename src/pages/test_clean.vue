<template>
  <div class="ethereal-void h-full min-h-full relative overflow-hidden transition-all duration-1000"
       :class="[isDark ? 'is-dark dark theme-dark' : 'theme-light']">

    <EtherealBackground :is-dark="isDark" :is-assembled="isAssembled" :show-bloom="showBloom" />
    <TesseractCanvas v-if="isTesseractEnabled" :is-dark="isDark" />
    <DesignVignette :is-dark="isDark" />

    <button v-if="!isNodeMapActive" 
            @click="isDark = !isDark" 
            class="fixed top-12 right-12 z-[5000] px-6 py-2 border-2 border-theme-border bg-theme-bg text-theme-text hover:bg-theme-text hover:text-theme-bg transition-all duration-500 group flex items-center space-x-4">
      <span class="text-[9px] font-mono tracking-[0.4em] uppercase font-black">{{ isDark ? 'SWT_LIGHT_MODE' : 'SWT_DARK_MODE' }}</span>
      <div class="w-2 h-2 border border-current rotate-45 transition-transform group-hover:rotate-[135deg]" :class="isDark ? 'bg-white' : 'bg-black'"></div>
    </button>

    <div class="relative z-10 flex items-center justify-center inset-0 h-full py-20">
       <Transition name="page-reify" mode="out-in">
         <!-- Dashboard Hub (No Tab) -->
                   <div v-if="isAssembled && !activeTab" key="hub" class="w-full h-full">
            <ExDashboard @navigate="activeTab = $event" />
         </div>

         <!-- Genesis Module -->
          <div v-else-if="isAssembled && activeTab === 'genesis'" key="genesis" class="w-full h-screen">
             <Transition name="page-reify" mode="out-in">
                <!-- Menu -->
                <div v-if="!route.query.mode" key="menu" class="w-full h-full pt-10">
                   <ExGenesisMenu @select="handleGenesisSelect" @back="activeTab = ''" />
                </div>
                
                <!-- Matrix -->
                <div v-else-if="route.query.mode === 'matrix'" key="matrix" class="w-full h-screen">
                   <ExGenesisMatrix :active-tab="activeTab" :is-dark="isDark" @exit="clearMode" />
                </div>

                <!-- Diary -->
                <div v-else-if="route.query.mode === 'diary'" key="diary" class="w-full h-full">
                   <ExEquityCurve3D @exit="clearMode" />
                </div>

                <!-- Log -->
                <div v-else-if="route.query.mode === 'log'" key="log" class="w-full h-full">
                   <ExGenesisLog @exit="clearMode" @nodeMapState="isNodeMapActive = $event" />
                </div>

                <!-- Default Placeholder -->
                <div v-else key="fallback" class="w-full h-full flex flex-col items-center justify-center space-y-8">
                   <ExHeading level="h2" variant="cinematic" class="!text-3xl uppercase tracking-[0.2em]">Module_{{ route.query.mode }}_Reification</ExHeading>
                   <ExText class="opacity-40 italic">Structural matrix not yet stabilized in laboratory environment.</ExText>
                   <button @click="clearMode" class="mt-8 px-8 py-3 border border-theme-text/20 hover:border-theme-text transition-colors text-[10px] font-mono tracking-[0.4em] uppercase">
                     [ ESC_TO_MODULE_ORIGIN ]
                   </button>
                </div>
             </Transition>
          </div>

         <!-- Forum Module -->
         <div v-else-if="isAssembled && activeTab === 'forum'" key="forum" class="w-full h-full flex flex-col items-center justify-center">
            <ExHeading level="h2" variant="cinematic" class="!text-4xl">KNOWLEDGE_MATRIX</ExHeading>
            <button @click="activeTab = ''" class="mt-8 opacity-40 hover:opacity-100 transition-opacity font-mono text-[10px] tracking-[0.4em]">[ ESC_TO_HUB ]</button>
         </div>

         <!-- Activity Module -->
         <div v-else-if="isAssembled && activeTab === 'activity'" key="activity" class="w-full h-full flex flex-col items-center justify-center">
            <ExHeading level="h2" variant="cinematic" class="!text-4xl">ACTIVITY_MONITOR</ExHeading>
            <button @click="activeTab = ''" class="mt-8 opacity-40 hover:opacity-100 transition-opacity font-mono text-[10px] tracking-[0.4em]">[ ESC_TO_HUB ]</button>
         </div>
       </Transition>
    </div>
   
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ExDashboard from '~/shared/ui/components/ExDashboard.vue'
import EtherealBackground from '~/widgets/style/ui/EtherealBackground.vue'
import TesseractCanvas from '~/widgets/style/ui/TesseractCanvas.vue'
import DesignVignette from '~/widgets/style/ui/DesignVignette.vue'
import ExHeading from '~/shared/ui/ExHeading.vue'
import ExText from '~/shared/ui/ExText.vue'
import ExGenesisMenu from '~/shared/ui/components/ExGenesisMenu.vue'

import ExGenesisMatrix from '~/widgets/genesis/ui/ExGenesisMatrix.vue'
import ExEquityCurve3D from '~/shared/ui/components/ExEquityCurve3D.vue'
import ExGenesisLog from '~/widgets/genesis/ui/ExGenesisLog.vue'

import { useThemeStore } from '~/features/store/useTheme'

const themeStore = useThemeStore()
const isDark = computed({
  get: () => themeStore.settings.isDark,
  set: (val) => themeStore.toggleDark()
})
const isAssembled = ref(false);
const showBloom = ref(true);
const isTesseractEnabled = ref(false);

const route = useRoute()
const router = useRouter()
const activeTab = ref(route.query.tab?.toString() || '');
const isNodeMapActive = ref(false);



const handleGenesisSelect = (moduleId) => {
    const modeMap = {
        'diary': 'log',
        'genesis-diary': 'diary',
        'matrix': 'matrix'
    }
    const mode = modeMap[moduleId] || moduleId
    router.push({ query: { ...route.query, mode } })
}

const clearMode = () => {
    const query = { ...route.query }
    delete query.mode
    router.replace({ query })
}

watch(activeTab, (newTab) => {
    const query = { ...route.query }
    if (!newTab) {
        delete query.tab
        delete query.mode // Clear mode when going back to origin
    } else {
        query.tab = newTab
    }
    router.replace({ query })

    // System-Level Scroll Lock
    if (newTab === 'genesis') {
        document.body.style.overflow = 'hidden'
        document.body.style.height = '100vh'
    } else {
        document.body.style.overflow = ''
        document.body.style.height = ''
    }
})

watch(() => route.query.tab, (newQueryTab) => {
    if (newQueryTab && typeof newQueryTab === 'string') {
        const validTabs = ['activity', 'forum', 'genesis', 'matrix']
        if (validTabs.includes(newQueryTab)) {
            activeTab.value = newQueryTab
        }
    } else {
        activeTab.value = ''
    }
}, { immediate: true })


onMounted(() => {
  // Assembly Sequence Logic
  setTimeout(() => { 
    showBloom.value = false; 
    setTimeout(() => {
      isAssembled.value = true;
    }, 400);
  }, 1500);
});
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

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--theme-border-strong); }
</style>
