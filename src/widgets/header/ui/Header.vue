<template>
  <header
    :style="{ 
      backgroundColor: 'transparent',
      backdropFilter: isHeaderExpanded ? 'var(--header-blur)' : 'none',
      borderBottom: isHeaderExpanded ? 'var(--header-border)' : 'none',
      transition: 'all 0.5s ease-in-out'
    }"
  >
    <div 
      class="max-w-6xl w-full mx-auto px-8 transition-all duration-500 ease-in-out overflow-hidden"
      :style="{ 
        opacity: isHeaderExpanded ? 1 : 0, 
        pointerEvents: isHeaderExpanded ? 'auto' : 'none', 
        visibility: isHeaderExpanded ? 'visible' : 'hidden',
        paddingTop: isHeaderExpanded ? '32px' : '0px',
        paddingBottom: isHeaderExpanded ? '20px' : '0px',
        maxHeight: isHeaderExpanded ? '400px' : '0px'
      }"
    >
      <nav class="flex justify-between items-center">
        <NuxtLink to="/" class="w-20 h-8 flex items-center justify-center hover:opacity-80 transition" title="Home">
          <img src="/logo.svg" class="dark:hidden w-20"  alt="logo" />
          <img src="/logo-dark.svg" class="dark:flex hidden w-20" alt="logo" />
        </NuxtLink>

        <div class="hidden md:flex absolute left-1/2 -translate-x-1/2" v-if="authReady">
          <ul
            class="flex gap-8 items-center"
            style="color: var(--text-heading)"
          >
            <li>
              <NuxtLink to="/test_clean" class="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center opacity-40 hover:opacity-100" title="Forum">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </NuxtLink>
            </li>
            <li> 
              <NuxtLink to="/design2" class="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center opacity-40 hover:opacity-100" title="Creation">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="{ path: '/forum/diary', query: { uid: auth.user.uid } }" v-if="auth.user" class="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center opacity-40 hover:opacity-100" title="Diary">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </NuxtLink>
              <NuxtLink :to="{ path: '/login', query: { redirect: '/forum/main' } }" v-else class="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center opacity-40 hover:opacity-100" title="Diary">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/board" v-if="auth.user" class="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center opacity-40 hover:opacity-100" title="Board">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </NuxtLink>
              <NuxtLink :to="{ path: '/login', query: { redirect: '/board' } }" v-else class="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center opacity-40 hover:opacity-100" title="Board">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div class="space-x-4 flex items-center ">
          <button class="w-10 opacity-30 hover:opacity-100 transition-opacity duration-300 relative" @click="reloadPage">
            <template v-if="themeStore.isReady">
              <img :src="themeStore.settings.isDark ? '/assets/refresh-white.svg' : '/assets/refresh-black.svg'" alt="" class="w-6 block mx-auto">
            </template>
            <div v-else class="w-6 h-6"></div>
          </button>
          <Notifications v-if="auth.user" />
          

          <div v-if="!authReady">
              <div class="text-sm text-white/50 rounded-full flex justify-center items-center px-5 py-3">
                <div class="w-8 h-8 rounded-full">

                </div>
            </div>
          </div>
          <NuxtLink v-else-if="authReady && !auth.user" to="/register">
            <button class="text-[10px] uppercase tracking-widest font-bold text-white bg-black dark:bg-white dark:text-black px-4 py-2.5 rounded-full hover:opacity-80 transition shadow-sm">
              Sign In
            </button>
          </NuxtLink>
          <div v-else-if="authReady && auth.user" class="relative flex items-center">
              <button
                @click="showMethods"
                class="text-sm text-white rounded-full flex justify-center items-center px-2 py-2"
              >
                <img
                  v-if="auth.user?.photoURL"
                  :src="auth.user.photoURL"
                  class="w-8 h-8 rounded-full border border-black/5 dark:border-white/10"
                  alt="user's photo1"
                  loading="lazy"
                  decoding="async"
                  referrerpolicy="no-referrer"
                />
                <div v-else class="w-8 h-8 rounded-full bg-[#444] flex justify-center items-center border border-black/5 dark:border-white/10">
                  <span class="text-white text-sm">
                    {{ auth.user.email?.charAt(0).toUpperCase() }}
                  </span>
                </div>
              </button>
              <DropdownMenu />
          </div>
          <button
            class="w-6 opacity-30 hover:opacity-100 transition-all duration-300"
            @click="themeStore.toggleDark"
          >
            <template v-if="themeStore.isReady">
              <img
                alt=""
                :src="themeStore.settings.isDark ? '/assets/light-mode-switcher.svg' : '/assets/dark-mode-switcher.svg'"
                class="block"
              />
            </template>
            <div v-else class="w-6 h-6"></div>
          </button>
         
        </div>
      </nav>
    </div>

    <div 
      v-if="isDiaryPage"
      class="flex justify-center relative z-[60] transition-transform duration-500 ease-in-out"
      :style="{ transform: isHeaderExpanded ? 'translateY(20px)' : 'translateY(8px)' }"
    >
        <button 
            @click="isHeaderExpanded = !isHeaderExpanded"
            class="group w-10 h-3 flex items-center justify-center bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5 rounded-full shadow-sm transition-all duration-300"
            :title="isHeaderExpanded ? 'Collapse Navigation' : 'Expand Navigation'"
        >
          <div class="w-4 h-[2px] bg-black/10 dark:bg-white/10 rounded-full group-hover:bg-black/30 dark:group-hover:bg-white/30 transition-colors"></div>
        </button>
    </div>
    <div v-if="auth.error" class="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 animate-bounce">
      <span>{{ auth.error }}</span>
      <button @click="auth.setError(null)" class="hover:bg-red-700 rounded-full p-1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
    <Updater />
  </header>
</template>

<script setup> 
import { useAuthStore } from "~/entities/user/auth.store";
import { storeToRefs } from "pinia";
import { changeTheme } from "~/composables/changeTheme";
import Notifications from "~/widgets/notifications/ui/Notifications.vue";
import { useNotificationStore } from '~/features/store/useNotifications';
import { methods, showMethods, reloadPage, handleScroll, scrollY, isHeaderExpanded } from '~/widgets/header/model/useHeader';
import DropdownMenu from "./DropdownMenu.vue";
import Updater from "~/widgets/updater/Updater.vue";
import { useThemeStore } from "~/features/store/useTheme";
import { useSavedThreadsStore } from "~/features/store/useSavedThreads";
import { useRoute } from 'vue-router';

const route = useRoute();
const isDiaryPage = computed(() => route.path.includes('/forum/diary'));

const auth = useAuthStore();
const { user, authReady } = storeToRefs(auth);
const notification = useNotificationStore();
const themeStore = useThemeStore();
const savedThreads = useSavedThreadsStore();

watch(
  () => auth.user?.uid,
  (uid) => {
    if (!uid) {
      savedThreads.reset()
      return
    }

    notification.subscribe(uid)
    savedThreads.fetchSavedThreads(uid)
  },
  { immediate: true }
)

watch(isDiaryPage, (isDiary) => {
  if (!isDiary) {
    isHeaderExpanded.value = true;
  }
})
</script>

<style scoped>
/* Layout persists even when header is hidden to prevent content jumping */
</style>
