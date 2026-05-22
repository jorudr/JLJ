<template>
  <div class="profile-menu-container">
    <Teleport to="body">
      <Transition name="menu-fade">
        <div v-if="!showLogoutModal && methods" 
             key="profile-menu-overlay"
             class="fixed inset-0 z-[100001] flex flex-col items-center justify-center 
                    bg-white/60 dark:bg-black/80 backdrop-blur-[100px]">
          
          <button 
            @click="methods = false" 
            class="absolute top-12 right-12 group p-4 transition-all hover:rotate-90 duration-500"
          >
            <svg class="w-6 h-6 text-[#999] group-hover:text-black dark:group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="mb-16 text-center flex flex-col items-center menu-content-header">
            <div class="w-20 h-20 rounded-full border border-black/[0.05] dark:border-white/[0.1] p-1 mb-6 shadow-xl shadow-black/5">
              <img
                v-if="auth.user?.photoURL"
                :src="auth.user.photoURL"
                class="w-full h-full rounded-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-700"
                alt="User"
              />
              <div v-else class="w-full h-full rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-lg font-serif">
                {{ auth.user?.email?.charAt(0).toUpperCase() }}
              </div>
            </div>
            <p class="text-[8px] uppercase tracking-[0.6em] text-[#999] dark:text-[#555] font-black mb-3 leading-none opacity-80">The Portfolio of</p>
            <h2 class="text-2xl font-serif italic text-[#050505] dark:text-white leading-tight">
              {{ auth.user?.displayName || auth.user?.email?.split('@')[0] }}
            </h2>
          </div>

          <div class="flex flex-col gap-8 items-center menu-content-actions">
            <NuxtLink 
              :to="{ path: '/profile', query: { uid: auth.user?.uid } }"
              @click="methods = false"
              class="group flex flex-col items-center"
            >
              <span class="text-base font-serif uppercase tracking-[0.4em] text-[#444] dark:text-[#aaa] group-hover:text-emerald-500 transition-all duration-500 hover:italic">My Profile</span>
              <div class="w-0 group-hover:w-12 h-px bg-emerald-500/30 transition-all duration-700 mt-2"></div>
            </NuxtLink>

            <button 
              @click="handleSettingsOpen"
              class="group flex flex-col items-center"
            >
              <span class="text-base font-serif uppercase tracking-[0.4em] text-[#444] dark:text-[#aaa] group-hover:text-amber-500 transition-all duration-500 hover:italic">Settings</span>
              <div class="w-0 group-hover:w-12 h-px bg-amber-500/30 transition-all duration-700 mt-2"></div>
            </button>

            <button 
              @click="handleLogoutClick"
              class="group flex flex-col items-center"
            >
              <span class="text-base font-serif uppercase tracking-[0.4em] text-[#777] dark:text-[#666] group-hover:text-rose-500 transition-all duration-500 hover:italic font-medium">Sign Out</span>
              <div class="w-0 group-hover:w-12 h-px bg-rose-500/30 transition-all duration-700 mt-2"></div>
            </button>
          </div>

          <div class="absolute bottom-12 text-[8px] uppercase tracking-[0.5em] text-[#bbb] dark:text-[#333] font-bold">
            Market Intelligence Systems &middot; MMXXVI
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showLogoutModal" class="fixed inset-0 z-[100002] flex items-center justify-center bg-black/50 dark:bg-black/80 px-4 text-center">
          <div class="bg-white dark:bg-[#111] border border-black/[0.05] dark:border-white/[0.08] rounded-[2.5rem] p-12 shadow-[0_50px_120px_-20px_rgba(0,0,0,0.5)] max-w-sm w-full mx-auto relative transform transition-all">
            <div class="inline-flex items-center justify-center mb-10">
              <div class="w-px h-10 bg-black/10 dark:bg-white/10"></div>
            </div>
            <p class="text-[8px] uppercase tracking-[0.6em] text-[#999] dark:text-[#555] font-black mb-5">Securing Architecture</p>
            <h3 class="text-2xl font-serif italic mb-5 text-[#050505] dark:text-white leading-tight">Keep Workspace?</h3>
            <p class="text-[13px] text-[#666] dark:text-[#aaa] mb-12 leading-relaxed font-serif italic px-2">
              "Your workspace is evolved and unique. We highly recommend a structural export before signing out."
            </p>
            <div class="flex flex-col gap-4">
              <button @click="confirmLogout(true)" class="w-full py-3.5 px-6 border border-emerald-500/30 hover:bg-emerald-500/[0.03] text-emerald-600 dark:text-emerald-400 rounded-full transition-all text-[10px] uppercase tracking-[0.3em] font-bold">
                Secure ZIP Export
              </button>
              <button @click="confirmLogout(false)" class="w-full py-3.5 px-6 text-[#999] hover:text-[#050505] dark:hover:text-white transition-all text-[10px] uppercase tracking-[0.3em] font-bold opacity-70 hover:opacity-100">
                Immediate Logout
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '~/entities/user/auth.store';
import { methods } from '~/widgets/header/model/useHeader';
import JSZip from 'jszip';
import { loadFromDisk } from '~/shared/diskStorage';
import { openSettings } from '~/widgets/settings/model/useSettings';

const auth = useAuthStore()
const showLogoutModal = ref(false)

function handleSettingsOpen() {
  methods.value = false
  openSettings()
}

const PERSISTENCE_META_KEY = 'trading_boards_meta_v3'
const PERSISTENCE_CONTENT_PREFIX = 'trading_board_content_'

async function handleLogoutClick() {
  const savedMeta = await loadFromDisk<any[]>(PERSISTENCE_META_KEY)
  if (savedMeta && savedMeta.length > 0) {
    showLogoutModal.value = true
  } else {
    await confirmLogout(false)
  }
}

async function confirmLogout(shouldExport: boolean) {
  if (shouldExport) {
    try {
      const meta = await loadFromDisk<any[]>(PERSISTENCE_META_KEY)
      if (meta && Array.isArray(meta) && meta.length > 0) {
        const loadedBoards: any[] = []
        for (const m of meta) {
          const savedContent = await loadFromDisk<any>(`${PERSISTENCE_CONTENT_PREFIX}${m.id}`)
          let content: any = { notes: [], connections: [], drawings: [] }
          if (savedContent) {
            content = savedContent
          }
          loadedBoards.push({
            id: m.id,
            name: m.name,
            transform: m.transform,
            notes: content.notes || [],
            connections: content.connections || [],
            drawings: content.drawings || []
          })
        }

          if (loadedBoards.length > 0) {
            const zip = new JSZip()
            const assetsFolder = zip.folder('assets')
            for (const board of loadedBoards) {
              if (board.notes) {
                for (const note of board.notes) {
                  if (note.imageData && note.imageData.startsWith('data:')) {
                    const mimeTypeMatch = note.imageData.match(/data:([^;]+);/)
                    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png'
                    const extension = mimeType?.split('/')[1]?.split('+')[0] || 'png'
                    const base64Data = note.imageData.split(',')[1]
                    if (base64Data) {
                      const fileName = `image_${note.id}.${extension}`
                      assetsFolder?.file(fileName, base64Data, { base64: true })
                      note.imageData = `assets/${fileName}`
                    }
                  }
                }
              }
            }
            zip.file('boards.json', JSON.stringify(loadedBoards, null, 2))
            const zipContent = await zip.generateAsync({ type: 'blob' })
            const url = URL.createObjectURL(zipContent)
            const a = document.createElement('a')
            a.href = url
            a.download = `all_boards_export_${new Date().toISOString().slice(0, 10)}.zip`
            a.click()
            URL.revokeObjectURL(url)
            await new Promise(r => setTimeout(r, 500))
          }
        }
      } catch (err) {
        console.error("Failed to export boards before logout", err)
      }
    }

  showLogoutModal.value = false
  auth.clearUser()
  methods.value = !methods.value
}
</script>

<style scoped>
/* Cinematic Menu Fading */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), 
              backdrop-filter 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

/* Staggered Content Animation */
.menu-fade-enter-active .menu-content-header {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
}
.menu-fade-enter-active .menu-content-actions {
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s;
}

.menu-fade-enter-from .menu-content-header,
.menu-fade-leave-to .menu-content-header {
  transform: translateY(-20px);
  opacity: 0;
}

.menu-fade-enter-from .menu-content-actions,
.menu-fade-leave-to .menu-content-actions {
  transform: translateY(20px);
  opacity: 0;
}

/* Sophisticated Modal Fading */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
</style>