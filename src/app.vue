<template>
  <div
    class="relative h-full min-h-full bg-center bg-cover transition-colors duration-500"
    :style="{ backgroundColor: 'var(--content-bg)' }"
  >
    <!-- Ambient Background Layer -->
    <div 
      v-if="themeStore.settings.isImageBg && themeStore.settings.bgImage"
      class="fixed inset-0 pointer-events-none transition-all duration-[800ms] ease-in-out bg-center bg-cover"
      :style="{ 
        backgroundImage: 'var(--bg-image)', 
        filter: 'blur(var(--bg-image-blur)) brightness(var(--bg-image-brightness))',
        opacity: 'var(--bg-image-opacity)',
        zIndex: 0
      }"
    ></div>

    <div class="relative z-10 h-full min-h-full flex flex-col transition-all duration-300" :class="isFullscreen ? '' : 'pt-10'">
      <CustomTitleBar />
      <NuxtPage />
    </div>
    
 

    <Transition name="settings">
      <SettingsModal v-if="isSettingsOpen" />
    </Transition>
  </div>
</template>

<script setup>
import { ref, watchEffect, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/entities/user/auth.store'
import { useAuthInit } from '~/features/auth/useAuthInit'
import { useRoute } from 'vue-router'
import { useThemeStore } from '~/features/store/useTheme'
import SettingsModal from '~/widgets/settings/ui/SettingsModal.vue'
import { isSettingsOpen } from '~/widgets/settings/model/useSettings'
import CustomTitleBar from '~/widgets/titlebar/ui/CustomTitleBar.vue'
import { useBoardStore } from '~/features/store/useBoard'

const route = useRoute()
const auth = useAuthStore()
const themeStore = useThemeStore()
const boardStore = useBoardStore()
const isFullscreen = useState('isFullscreen', () => false)

// Initialize theme
themeStore.init()

const updaterDone = ref(false)

useAuthInit()

watchEffect(() => {
  if (!auth.authReady) return
  
  if (auth.isAuthenticated) {
    boardStore.loadBoardFromLocal()
  }

  if (route.meta.public) return

  // if (!auth.isAuthenticated) {
  //   navigateTo({
  //     path: '/login',
  //     query: { redirect: route.fullPath }
  //   })
  // }
})

// Disable backspace navigation globally
const handleGlobalBackspace = (event) => {
  if (event.key === 'Backspace') {
    const target = event.target;
    const isEditable = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable;
    
    const supportsTextSelection = target.tagName === 'INPUT' && 
      /^(text|password|search|email|number|tel|url)$/i.test(target.type);

    if (!isEditable || (target.tagName === 'INPUT' && !supportsTextSelection)) {
      event.preventDefault();
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleGlobalBackspace);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalBackspace);
});
</script>

<style>
:root {
  --header-bg: transparent;
  --footer-bg: transparent;
  --content-bg: #f7f5fa;
  --text-heading: #050505;
  --text-description: rgba(18, 18, 18, 0.45);
  --icon-color-mode: black;
}

html.dark {
  --header-bg: transparent;
  --footer-bg: transparent;
  --content-bg: #050505;
  --text-heading: rgba(255, 255, 255, 0.95);
  --text-description: rgba(255, 255, 255, 0.45);
  --icon-color-mode: white;
}

* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  color: var(--text-heading);
  transition: color 0.5s ease;
}

::placeholder {
  color: var(--text-description);
  opacity: 0.6;
}

html, body, #__nuxt {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: var(--content-bg);
  color: var(--text-description);
  transition: all 0.5s ease;
  overflow: hidden; /* Prevent accidental document-level scrolling */
}

html.dark body {
  background-color: var(--content-bg);
}

*::-webkit-scrollbar {
  width: 0px;
  height: 0px;
}

* {
  scrollbar-width: none;
}

* {
  -ms-overflow-style: none;
}

/* Hide Native Number Spinners */
.hide-spinners::-webkit-outer-spin-button,
.hide-spinners::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}
.hide-spinners {
  -moz-appearance: textfield;
  appearance: textfield;
}

.settings-enter-active,
.settings-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.settings-enter-from,
.settings-leave-to {
  opacity: 0;
  filter: blur(8px);
  transform: translateY(15px);
}
</style>
