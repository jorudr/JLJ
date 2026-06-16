<template>
  <div 
    v-show="!isFullscreen"
    @mousedown="startDrag"
    class="h-10 select-none flex justify-end items-center fixed top-0 left-0 right-0 z-[99999] transition-colors bg-black"
  >
    <div class="flex items-center h-full" @mousedown.stop>
      <div 
        @click="minimize" 
        class="inline-flex justify-center items-center w-12 h-full hover:bg-white/10 cursor-pointer transition-colors"
      >
        <Icon name="lucide:minus" class="w-4 h-4 text-white/90" />
      </div>
      <div 
        @click="toggleFullscreen" 
        class="inline-flex justify-center items-center w-12 h-full hover:bg-white/10 cursor-pointer transition-colors"
      >
        <Icon name="lucide:maximize" class="w-3.5 h-3.5 text-white/90" />
      </div>
      <div 
        @click="close" 
        class="inline-flex justify-center items-center w-12 h-full hover:bg-red-500 hover:text-white cursor-pointer group transition-colors"
      >
        <Icon name="lucide:x" class="w-4 h-4 text-white/90 group-hover:text-white" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const appWindow = ref(null)
const isFullscreen = useState('isFullscreen', () => false)
let unlistenResize = null

const handleKeydown = async (e) => {
  if (e.key === 'Escape' && isFullscreen.value && appWindow.value) {
    try {
      await appWindow.value.setFullscreen(false)
      isFullscreen.value = false
    } catch (err) {
      console.error("Escape fullscreen error:", err)
    }
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    appWindow.value = getCurrentWindow()
    isFullscreen.value = await appWindow.value.isFullscreen()
    
    // Automatically track fullscreen state changes
    unlistenResize = await appWindow.value.onResized(async () => {
      if (appWindow.value) {
        isFullscreen.value = await appWindow.value.isFullscreen()
      }
    })
  } catch (error) {
    console.error('Tauri API not available', error)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (unlistenResize) {
    unlistenResize()
  }
})

const startDrag = async (e) => {
  if (appWindow.value && e.buttons === 1) {
    try {
      await appWindow.value.startDragging()
    } catch (err) {
      console.error("Drag error: ", err)
    }
  }
}

const minimize = async () => {
  try {
    if (appWindow.value) await appWindow.value.minimize()
  } catch (e) {
    console.error("Minimize error: ", e)
  }
}

const toggleFullscreen = async () => {
  try {
    if (appWindow.value) {
      const current = await appWindow.value.isFullscreen()
      await appWindow.value.setFullscreen(!current)
      isFullscreen.value = !current
    }
  } catch (e) {
    console.error("Fullscreen error: ", e)
  }
}

const close = async () => {
  try {
    if (appWindow.value) await appWindow.value.close()
  } catch (e) {
    console.error("Close error: ", e)
  }
}
</script>

<style scoped>
</style>
