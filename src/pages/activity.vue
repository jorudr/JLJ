<template>
  <div class="ethereal-void h-full min-h-full relative overflow-hidden transition-all duration-1000"
       :class="[isDark ? 'is-dark dark theme-dark' : 'theme-light']">

    <Transition name="fade">
       <ExInitialization v-if="!hasInitialized" @initiate="handleInitializationComplete" />
    </Transition>

    <EtherealBackground :is-dark="isDark" :is-assembled="isAssembled" :show-bloom="showBloom" />
    <TesseractCanvas v-if="isTesseractEnabled" :is-dark="isDark" />
    <DesignVignette :is-dark="isDark" />



    <div
      class="relative z-10 flex items-center justify-center inset-0 h-full py-20"
    >
       <Transition name="page-reify" mode="out-in">
         <div v-if="isAssembled" key="activity" class="w-full h-full flex flex-col items-center justify-center">
            <ExActivityMonitor @exit="goToHub" />
         </div>
       </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import ExActivityMonitor from '~/shared/ui/components/ExActivityMonitor.vue'
import EtherealBackground from '~/widgets/style/ui/EtherealBackground.vue'
import TesseractCanvas from '~/widgets/style/ui/TesseractCanvas.vue'
import DesignVignette from '~/widgets/style/ui/DesignVignette.vue'
import ExInitialization from '~/shared/ui/components/ExInitialization.vue'
import { useThemeStore } from '~/features/store/useTheme'

definePageMeta({ layout: false })

const router = useRouter()
const themeStore = useThemeStore()

const isDark = ref(themeStore.settings.isDark)
watch(() => themeStore.settings.isDark, (val) => isDark.value = val)
watch(isDark, (val) => themeStore.settings.isDark = val)

const isAssembled = ref(false)
const hasInitialized = ref(false)

const showBloom = ref(false)
const isTesseractEnabled = ref(true)

const handleInitializationComplete = () => {
    hasInitialized.value = true
    setTimeout(() => {
        isAssembled.value = true
    }, 100)
}

const goToHub = () => {
    router.push('/')
}

onMounted(() => {
    // Check if already initialized before
    if (localStorage.getItem('initialization_complete')) {
        hasInitialized.value = true
        isAssembled.value = true
    } else {
        localStorage.setItem('initialization_complete', 'true')
    }
})
</script>
