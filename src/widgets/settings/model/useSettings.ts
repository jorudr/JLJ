import { ref, watch } from 'vue'

export const isSettingsOpen = ref(false)

export function openSettings() {
  isSettingsOpen.value = true
}

export function closeSettings() {
  isSettingsOpen.value = false
}

if (typeof window !== 'undefined') {
  watch(isSettingsOpen, (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  })
}
