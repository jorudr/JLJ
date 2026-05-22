<template>
      
        <main 
          v-if="!forum.loading" 
          class="mt-6 rounded-xl max-w-6xl w-full mx-auto px-8 py-12 transition-all duration-500"
          :class="{ 'dark:bg-[#050505] bg-[#f7f5fa]': themeStore.settings.themeName === 'Default' }"
        >
        
            <section class="flex flex-col md:flex-row gap-10 mb-14">

                <div class="flex-shrink-0 relative">
                  <div class="w-28 h-28 rounded-full flex justify-center items-center bg-black/10 dark:bg-white/10 relative">
                    <img v-if="avatar !== '/base-ava.svg'" :src="avatar" :key="avatar" alt="user's photo"  :class="[
                      'rounded-full',
                      avatar === '/base-ava.svg' ? 'w-16 h-16' : 'w-full h-full'
                    ]"
                    referrerpolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    @error="onImgError" />
                    <div v-else class="w-full h-full rounded-full bg-[#444] flex justify-center items-center">
                      <span class="text-white text-[4rem]">
                        {{ user?.email?.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                  </div>
                  <!-- Activity Indicator -->
                  <div
                    v-if="isUserActiveToday"
                    class="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-slate-200 dark:bg-white border-4 border-[var(--content-bg)] z-10 shadow-lg flex items-center justify-center group"
                  >
                    <!-- Inner Pulse -->
                    <div class="absolute inset-0 rounded-full bg-slate-400 dark:bg-white animate-ping opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    
                    <!-- Tooltip -->
                    <div class="absolute w-max bg-[#050505] dark:bg-slate-200 text-white dark:text-[#050505] text-[9px] uppercase font-bold tracking-widest px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 -top-10 scale-90 group-hover:scale-100 pointer-events-none shadow-xl border border-white/10 dark:border-black/5">
                      Authenticated Session
                    </div>
                  </div>
                </div>

                <div class="flex-1">
                <div class="flex items-center gap-4 mb-2 w-full">
                  <h1 class="text-3xl font-serif tracking-wide text-[var(--text-heading)] flex-1 min-w-0 flex items-center gap-3">
                    <span v-if="!editName" class="truncate">{{ user?.displayName }}</span>
                    <input
                      v-else
                      class="
                        text-3xl
                        font-serif
                        tracking-wide
                        text-[#050505]
                        dark:text-white
                        bg-transparent
                        w-full
                        focus:outline-none
                        border-b border-black/20 dark:border-white/20
                        focus:border-black/50 dark:focus:border-white/50
                        pb-1
                        -mb-1
                      "
                      v-model="currentName"
                      @keyup.enter="submitName"
                      @keyup.esc="cancelEditName"
                      autofocus
                    />
                    
                    <button 
                      @click="editName = true" 
                      v-if="auth.user?.uid === route.query.uid && !editName" 
                      class="flex items-center transition-opacity flex-shrink-0"
                    >
                      <img src="/assets/edit.svg" alt="edit" class="w-4 h-4 inline-block" />
                    </button>
                  </h1>
                  
                  <div v-if="auth.user?.uid === route.query.uid && editName" class="flex space-x-2 flex-shrink-0 mt-1">
                    <button
                      @click="cancelEditName"
                      class="
                        text-[10px] uppercase tracking-widest font-serif
                        text-[#777] dark:text-[#aaa]
                        border border-black/20 dark:border-white/20
                        px-4 py-2 rounded-full min-w-16
                        transition duration-200
                        hover:text-[#050505] dark:hover:text-white
                        hover:border-black/40 dark:hover:border-white/40
                      "
                    >
                      Cancel
                    </button>
                    <button
                      @click="submitName"
                      :disabled="isSubmitting"
                      class="
                        text-[10px] uppercase tracking-widest font-serif
                        text-[#777] dark:text-[#aaa]
                        border border-black/20 dark:border-white/20
                        px-4 py-2 rounded-full min-w-16
                        transition duration-200
                        hover:text-[#050505] dark:hover:text-white
                        hover:border-black/40 dark:hover:border-white/40
                      "
                    >
                      Save
                    </button>
                  </div>
                </div>

                <!-- Minimalist Header Stats -->
                <div class="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-[var(--text-description)] mt-2 mb-4">
                  <span>{{ user?.followers || 0 }} Followers</span>
                  <span class="opacity-30">•</span>
                  <span>Joined {{ joinedDate }}</span>
                  <span class="opacity-10 dark:opacity-20 ml-2">/</span>
                  <span class="italic font-serif normal-case tracking-wide opacity-60 ml-1">
                    {{ (user?.type?.charAt(0).toUpperCase() + user?.type?.slice(1)) || 'Participant' }}
                  </span>

                  <!-- Action Buttons (Reverted to Pill Design) -->
                  <div v-if="auth.isAuthenticated && auth.user?.uid !== route.query.uid" class="ml-auto">
                    <button 
                      v-if="isFollowing"
                      @click="handleUnfollow"
                      :disabled="isSubmitting"
                      class="text-[10px] uppercase tracking-widest font-serif text-[#050505] dark:text-white bg-transparent border border-black/20 dark:border-white/20 px-6 py-2.5 rounded-full transition duration-500 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      Unfollow
                    </button>
                    <button 
                      v-else
                      @click="handleFollow"
                      :disabled="isSubmitting"
                      class="text-[10px] uppercase tracking-widest font-serif text-white dark:text-[#050505] bg-[#050505] dark:bg-white px-8 py-3 rounded-full shadow-2xl shadow-black/20 transition-all duration-500 hover:tracking-[0.2em]"
                    >
                      Follow
                    </button>
                  </div>
                </div>


               
                <div class="max-w-full flex justify-between items-center pr-2 py-1 space-x-4">
                  <p 
                  v-if="!editBio"
                    class="
                      text-sm
                      font-serif
                      italic
                      leading-relaxed
                      text-[var(--text-heading)]
                      opacity-80
                      pr-24
                    "
                  >
                    "{{ user?.bio || 'No bio yet.' }}"
                  </p>

                  <textarea
                    v-else
                    placeholder="Enter your bio here"
                    class="
                      text-sm
                      font-serif
                      italic
                      leading-relaxed
                      text-[#555]
                      dark:text-[#bdbdbd]
                      bg-transparent
                      w-full
                      resize-none
                      focus:outline-none
                    "
                    v-model="currentBio"
                  ></textarea>


                  <button
                  v-if="editBio"
                    @click="cancelEditBio"
                    class="
                        text-[10px]
                        uppercase
                        tracking-widest
                        font-serif

                        text-[#777]
                        dark:text-[#aaa]

                        border
                        border-black/20
                        dark:border-white/20

                        px-4
                        py-2
                        rounded-full
                        min-w-24

                        transition
                        duration-200

                        hover:text-[#050505]
                        dark:hover:text-white
                        hover:border-black/40
                        dark:hover:border-white/40
                      "
                    >Cancel
                  </button>

                  <button
                    v-if="auth.user?.uid === route.query.uid "
                    @click="submitBio"
                    :disabled="isSubmitting"
                    class="
                      text-[10px]
                      uppercase
                      tracking-widest
                      font-serif
                      bg-[#050505]
                      text-white
                      dark:bg-white
                      dark:text-[#050505]
                      px-6
                      py-2.5
                      rounded-full
                      min-w-24
                      transition
                      duration-200
                      hover:opacity-80
                      font-bold
                    "
                  >
                   {{ editBio ? 'Save' : 'Edit bio' }}
                  </button>
                
                  </div>

                </div>

            </section>
        
            <section class="mb-14">
                <h2 class="text-sm uppercase tracking-widest font-serif text-[#050505] dark:text-white mb-4">
                Thread network
                </h2>
                
                <div  ref="container" class="w-full min-h-[30rem] rounded-lg border border-black/10 dark:border-white/10 bg-[#fafafa]/50 dark:bg-[#181818]/50 relative overflow-hidden">
                  
                </div>
            </section>
            

            <section class="grid grid-cols-1 md:grid-cols-3 gap-10 mb-14">

                <div class="p-6 rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]">
                    <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold mb-4 text-[#777]">
                        Threads
                    </h3>
                    <p class="text-2xl font-serif text-[#050505] dark:text-white">
                        {{ user?.threads ? user.threads : 0 }}
                    </p>
                    <p class="text-[9px] uppercase tracking-widest text-[#999] mt-1">published discussions</p>
                </div>

                <div class="p-6 rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] transition-all duration-500">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold text-[#777]">
                            Focus
                        </h3>
                        <div v-if="auth.user?.uid === route.query.uid" class="flex gap-3">
                             <button v-if="editFocus" @click="cancelEditFocus" class="text-[9px] uppercase tracking-widest text-[#777] hover:text-black dark:hover:text-white transition-colors">Cancel</button>
                             <button @click="submitFocus" :disabled="isSubmitting" class="text-[9px] uppercase tracking-widest text-[#050505] dark:text-white font-bold hover:opacity-70 transition-opacity">
                                {{ editFocus ? 'Save' : 'Change' }}
                             </button>
                        </div>
                    </div>
                    
                    <div v-if="!editFocus" class="flex flex-wrap gap-2">
                        <template v-if="user?.focus?.length > 0">
                            <span v-for="tag in user.focus" :key="tag" class="px-3 py-1 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] text-[9px] uppercase tracking-[0.1em] text-[#050505] dark:text-[#f0f0f0] font-medium">
                                {{ tag }}
                            </span>
                        </template>
                        <p v-else class="text-[11px] text-[#999] italic font-serif">Deep structural focus not defined</p>
                    </div>

                    <div v-else class="flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-top-1 duration-500">
                        <button 
                            v-for="option in FOCUS_OPTIONS" 
                            :key="option"
                            @click="toggleFocus(option)"
                            class="px-2.5 py-1.5 rounded-full border text-[9px] uppercase tracking-widest transition-all duration-500"
                            :class="currentFocus.includes(option) 
                                ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-md scale-105' 
                                : 'border-black/5 dark:border-white/5 text-[#777] hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'"
                        >
                            {{ option }}
                        </button>
                    </div>
                </div>

                <div class="p-6 rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] transition-all duration-500">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold text-[#777]">
                            Activity
                        </h3>
                        <div v-if="auth.user?.uid === route.query.uid" class="flex gap-3">
                             <button v-if="editActivity" @click="cancelEditActivity" class="text-[9px] uppercase tracking-widest text-[#777] hover:text-black dark:hover:text-white transition-colors">Cancel</button>
                             <button @click="submitActivity" :disabled="isSubmitting" class="text-[9px] uppercase tracking-widest text-[#050505] dark:text-white font-bold hover:opacity-70 transition-opacity">
                                {{ editActivity ? 'Save' : 'Change' }}
                             </button>
                        </div>
                    </div>

                    <div v-if="!editActivity" class="flex flex-wrap gap-2">
                        <template v-if="user?.activity?.length > 0">
                            <span v-for="tag in user.activity" :key="tag" class="px-3 py-1 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] text-[9px] uppercase tracking-[0.1em] text-[#050505] dark:text-[#f0f0f0] font-medium">
                                {{ tag }}
                            </span>
                        </template>
                        <p v-else class="text-[11px] text-[#999] italic font-serif">Contribution patterns not categorized</p>
                    </div>

                    <div v-else class="flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-top-1 duration-500">
                        <button 
                            v-for="option in ACTIVITY_OPTIONS" 
                            :key="option"
                            @click="toggleActivity(option)"
                            class="px-2.5 py-1.5 rounded-full border text-[9px] uppercase tracking-widest transition-all duration-500"
                            :class="currentActivity.includes(option) 
                                ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-md scale-105' 
                                : 'border-black/5 dark:border-white/5 text-[#777] hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'"
                        >
                            {{ option }}
                        </button>
                    </div>
                </div>

            </section>

            <section class="border-t border-black/5 dark:border-white/5 pt-12 mb-14">
                <div class="flex items-center justify-between mb-12">
                    <div>
                        <h2 class="text-xs uppercase tracking-[0.2em] font-bold text-[#050505] dark:text-white mb-1">Consistency History</h2>
                        <p class="text-[9px] uppercase tracking-widest text-[#888] dark:text-[#555] font-semibold italic">User authenticated focus sessions</p>
                    </div>
                    <div class="text-right">
                         <span class="block text-[9px] uppercase tracking-widest text-[#888] dark:text-[#555] font-bold mb-0.5">Current Streak</span>
                         <span class="text-2xl font-serif text-[#050505] dark:text-white">{{ userStreak }} Days</span>
                    </div>
                </div>
              
                <div v-for="yearData in activityYears" :key="yearData.year" class="mb-12 last:mb-0">
                    <div class="flex items-center gap-4 mb-4">
                        <span class="text-[9px] uppercase tracking-[0.3em] font-bold text-[#aaa] dark:text-[#333]">{{ yearData.year }}</span>
                        <div class="h-[1px] flex-1 bg-black/5 dark:bg-white/5"></div>
                    </div>

                    <div class="flex flex-wrap gap-1.5 w-full">
                        <div 
                        v-for="cell in yearData.cells" 
                        :key="cell.date"
                        class="w-3.5 h-3.5 rounded-[3px] transition-all duration-700 relative group/tile hover:z-50"
                        :class="[
                        cell.active 
                            ? 'bg-[#050505] dark:bg-white shadow-[0_0_8px_rgba(255,255,255,0.05)]' 
                            : 'bg-black/5 dark:bg-white/[0.03] hover:bg-black/10 dark:hover:bg-white/[0.07]',
                        cell.isFuture ? 'opacity-20 pointer-events-none' : ''
                        ]"
                        >
                            <!-- Tooltip -->
                            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-[#050505] dark:bg-white text-white dark:text-[#050505] text-[8px] rounded-md opacity-0 group-hover/tile:opacity-100 transition-all duration-300 scale-90 group-hover/tile:scale-100 pointer-events-none whitespace-nowrap z-50 uppercase tracking-widest font-bold shadow-2xl">
                                {{ cell.label }} • {{ cell.active ? 'Active Session' : (cell.isFuture ? 'Upcoming' : 'No Activity') }}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
           
      

            <section class="border-t border-black/10 dark:border-white/10 pt-8">
                <p class="text-sm text-[#666] dark:text-[#aaa] max-w-xl">
                Profiles reflect a trader’s thinking over time.
                The network grows through shared research and technical analysis.
                </p>
            </section>

        </main>
        <div class="w-36 mx-auto grow min-h-96 my-auto flex items-center justify-center" v-else>
          <img src="/logo.svg" class="dark:hidden animate-spin" alt="" />
          <img src="/logo-dark.svg" class="dark:flex hidden animate-spin" alt="" />
      </div>
</template>


<script lang="ts" setup>

definePageMeta({
    public: true
})

import { useForumStore } from "~/features/store/useForum";
import { computed, onMounted, onBeforeUnmount, watch, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Timestamp } from 'firebase/firestore'
import type { ThreadLink } from '~/entities/threadLink/model/threadLink.types'
import { randomOffset } from '~/utils/random'
import { isDark } from "~/composables/changeTheme";
import { useAuthStore } from "~/entities/user/auth.store";
import { isSubmitting, followUser, unfollowUser, updateProfileFields, changeBio, changeName, FOCUS_OPTIONS, ACTIVITY_OPTIONS } from "../model/useProfile";
import { methods } from '~/widgets/header/model/useHeader';
import Graph from 'graphology';
import Sigma from 'sigma';
import { calculateStreak } from "~/widgets/dashboard/model/useActivity";
import { normalizeDate } from "~/composables/normalizeDate";
import { useThemeStore } from '~/features/store/useTheme';

const auth = useAuthStore();
const themeStore = useThemeStore();

const editBio = ref(false);
const editName = ref(false);
const editFocus = ref(false);
const editActivity = ref(false);

const currentBio = ref<string | null>(null);
const currentName = ref<string | null>(null);
const currentFocus = ref<string[]>([]);
const currentActivity = ref<string[]>([]);


const forum = useForumStore();

const route = useRoute();
const router = useRouter();

const user = computed(() => forum.users.get(route.query.uid as string));

const isUserActiveToday = computed(() => {
   if (!user.value?.dailyActivity) return false;
   const d = new Date()
   const todayStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
   return user.value.dailyActivity.some((a: any) => a.date === todayStr);
});

const avatar = computed(() => user.value?.photoURL || '/base-ava.svg');

const isFollowing = computed(() => {
  const currentAuthDbUser = forum.users.get(auth.user?.uid as string);
  return currentAuthDbUser?.followed?.includes(route.query.uid as string) || auth.user?.followed?.includes(route.query.uid as string) || false;
});

const userStreak = computed(() => {
  if (!user.value?.dailyActivity) return 0;
  return calculateStreak(user.value.dailyActivity);
});

const joinedDate = computed(() => {
  const join = user.value?.joinedAt;
  if (!join) return '—';
  const d = normalizeDate(join);
  return d.toLocaleDateString('ru-RU');
});

const activityYears = computed(() => {
    const list = user.value?.dailyActivity || []
    const now = new Date()
    const currentYear = now.getFullYear()
    
    // Find the first year of activity
    let startYear = currentYear
    if (list.length > 0) {
        const sorted = [...list].sort((a: any, b: any) => a.date.localeCompare(b.date))
        startYear = new Date(sorted[0].date).getFullYear()
    } else {
        // Fallback to joined year if available
        const joined = user.value?.joinedAt 
        const joinedDate = joined?.toDate ? joined.toDate() : (joined ? new Date(joined) : null)
        if (joinedDate && !isNaN(joinedDate.getTime())) {
            startYear = joinedDate.getFullYear()
        }
    }

    const years = []
    for (let year = currentYear; year >= startYear; year--) {
        const yearCells = []
        
        // Find the boundary: Jan 1st of this year
        const startOfShowingYear = new Date(year, 0, 1)
        
        // Find the end: Dec 31st of this year (or current date if current year)
        // Actually, let's show the whole year grid
        const endOfShowingYear = new Date(year, 11, 31)
        
        // Standard Heatmap loop for this year
        const d = new Date(startOfShowingYear)
        while (d <= endOfShowingYear) {
            const dateStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
            const hasActivity = list.some((a: any) => a.date === dateStr)
            const isFuture = d > now

            yearCells.push({
                date: dateStr,
                active: hasActivity,
                isFuture,
                label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
            })
            
            d.setDate(d.getDate() + 1)
        }
        
        years.push({
            year,
            cells: yearCells
        })
    }
    return years
})

const handleFollow = async () => {
    if (!auth.user?.uid || !route.query.uid) return;
    await followUser(auth.user.uid, route.query.uid as string);
    // Optimistic UI update for the auth state and profile state
    if(auth.user) {
       auth.user.followed = [...(auth.user.followed || []), route.query.uid as string]
    }
    const currentAuthDbUser = forum.users.get(auth.user.uid);
    if(currentAuthDbUser) {
       currentAuthDbUser.followed = [...(currentAuthDbUser.followed || []), route.query.uid as string]
    }
    if (user.value) {
       user.value.followers = (user.value.followers || 0) + 1;
    }
}

const handleUnfollow = async () => {
    if (!auth.user?.uid || !route.query.uid) return;
    await unfollowUser(auth.user.uid, route.query.uid as string);
    // Optimistic UI update
    if(auth.user) {
       auth.user.followed = (auth.user.followed || []).filter(id => id !== route.query.uid as string)
    }
    const currentAuthDbUser = forum.users.get(auth.user.uid);
    if(currentAuthDbUser) {
       currentAuthDbUser.followed = (currentAuthDbUser.followed || []).filter((id: string) => id !== route.query.uid as string)
    }
    if (user.value) {
       user.value.followers = Math.max(0, (user.value.followers || 0) - 1);
    }
}


const submitBio = async () => {

  if (!editBio.value ){
    editBio.value = !editBio.value
    return;
  } else{
    if(!auth.user?.uid) return;
    await changeBio(auth.user?.uid, route.query.uid as string, currentBio.value as string);
    user.value.bio = currentBio.value;
    editBio.value = !editBio.value;
  }
 
 
}

const onImgError = (e: any) => {
  e.target.src = '/base-ava.svg';
};

const submitName = async () => {
  if (!editName.value ){
    editName.value = !editName.value
    return;
  } else {
    if (!auth.user?.uid) return;
    await changeName(auth.user?.uid, route.query.uid as string, currentName.value as string);
    if(user.value) {
      user.value.displayName = currentName.value;
    }
    editName.value = false;
  }
}

const toggleFocus = (option: string) => {
  const index = currentFocus.value.indexOf(option);
  if (index > -1) {
    currentFocus.value.splice(index, 1);
  } else {
    if (currentFocus.value.length < 3) {
      currentFocus.value.push(option);
    }
  }
};

const toggleActivity = (option: string) => {
  const index = currentActivity.value.indexOf(option);
  if (index > -1) {
    currentActivity.value.splice(index, 1);
  } else {
    if (currentActivity.value.length < 3) {
      currentActivity.value.push(option);
    }
  }
};

const submitFocus = async () => {
  if (!editFocus.value) {
    editFocus.value = true;
    return;
  }
  if (!auth.user?.uid) return;
  await updateProfileFields(auth.user.uid, route.query.uid as string, { focus: currentFocus.value });
  if (user.value) {
    user.value.focus = [...currentFocus.value];
  }
  editFocus.value = false;
};

const submitActivity = async () => {
  if (!editActivity.value) {
    editActivity.value = true;
    return;
  }
  if (!auth.user?.uid) return;
  await updateProfileFields(auth.user.uid, route.query.uid as string, { activity: currentActivity.value });
  if (user.value) {
    user.value.activity = [...currentActivity.value];
  }
  editActivity.value = false;
};

const cancelEditFocus = () => {
  currentFocus.value = user.value?.focus ? [...user.value.focus] : [];
  editFocus.value = false;
};

const cancelEditActivity = () => {
  currentActivity.value = user.value?.activity ? [...user.value.activity] : [];
  editActivity.value = false;
};

const cancelEditName = () => {
  currentName.value = user.value?.displayName || ''
  editName.value = false
}

const cancelEditBio = () => {
  currentBio.value = user.value?.bio || ''
  editBio.value = false
}



const threads = computed(() => {
  return Array.from(forum.threads.values())
})

const container = ref<HTMLDivElement | null>(null);
let sigmaInstance: Sigma | null = null;
const sigmaReady = ref(false);

const links = ref<ThreadLink[]>([]);



// trades entriesList removed

const initProfile = async () => {
  if (!container.value) return;


  if (sigmaInstance) {
    sigmaInstance.kill();
    sigmaInstance = null;
    sigmaReady.value = false;
  }
    
  await forum.fetchUser(route.query.uid as string);
  await forum.fetchThreadList();
  links.value = await forum.fetchAllThreadLinks() 

  if (auth.user?.uid) {
    await forum.fetchUser(auth.user.uid);
  }

  const graph = new Graph()

  threads.value.filter(thread => thread.authorId === route.query.uid).forEach((thread, index) => {
    graph.addNode(thread.id, {
      label: thread.title,
      x: randomOffset(5),
      y: randomOffset(5),
      size: 10,
      color: '#555',
      url: `/forum/thread/${thread.id}`
    })
  })

  links.value.forEach(link => {
    if(threads.value.filter(t => t.authorId === route.query.uid).find(thread => thread.id === link.fromThreadId) && threads.value.filter(t => t.authorId === route.query.uid).find(thread => thread.id === link.toThreadId)){
      graph.addEdge(link.fromThreadId, link.toThreadId)
    }
    
  })


  sigmaInstance = new Sigma(graph, container.value, {
    renderLabels: true,
  
    defaultDrawNodeHover: (context, data, settings) => {

    const size = data.size;
    const x = data.x;
    const y = data.y;
    const color = '#666'

  
    context.fillStyle = color;
    context.beginPath();
   
    context.closePath();
    context.fill();
  
  },
  })


  sigmaInstance.on('enterNode', () => {
    if(!container.value) return
    container.value.style.cursor = 'pointer'
  })

  sigmaInstance.on('leaveNode', () => {
    if(!container.value) return
    container.value.style.cursor = 'default'
  })

  // DRAG AND DROP LOGIC
  let draggedNode: string | null = null;
  let isDragging = false;
  let lastDragAt = 0;

  sigmaInstance.on("downNode", (e) => {
    isDragging = true;
    draggedNode = e.node;
    sigmaInstance?.getCamera().disable();
  });

  sigmaInstance.getMouseCaptor().on("mousemove", (e) => {
    if (!isDragging || !draggedNode || !sigmaInstance) return;

    lastDragAt = Date.now();
    const pos = sigmaInstance.viewportToGraph(e);
    graph.setNodeAttribute(draggedNode, "x", pos.x);
    graph.setNodeAttribute(draggedNode, "y", pos.y);

    e.preventSigmaDefault();
    e.original.preventDefault();
    e.original.stopPropagation();
  });

  sigmaInstance.getMouseCaptor().on("mouseup", () => {
    if (draggedNode) {
      sigmaInstance?.getCamera().enable();
    }
    isDragging = false;
  });

  sigmaInstance.on('doubleClickNode', ({ node }) => {
    const nodeData = graph.getNodeAttributes(node)

    if (nodeData.url) {
      router.push(nodeData.url)
    }
  })
  sigmaReady.value = true
}

onMounted(async () => {
  methods.value = false;
  isDark.value = document.documentElement.classList.contains('dark');
  await initProfile();
})


onBeforeUnmount(() => {
  sigmaInstance?.kill();
})

watch(() => route.query.uid, async (newUid) => {
    if (newUid) {
        await initProfile();
    }
});

watch([() => themeStore.settings.isDark, sigmaReady], ([newIsDark]) => {
  if (!sigmaInstance || !sigmaReady.value) return;

  sigmaInstance.setSettings({
    labelColor: {
      color: newIsDark ? '#ffffff' : '#000000'
    },
    defaultEdgeColor: newIsDark ? '#333333' : '#777777'
  })

  sigmaInstance.refresh()
}, { immediate: true })


watch(
  user,
  (newUser) => {
    if (!newUser) return


    if (!editBio.value) {
      currentBio.value = newUser.bio || ''
    }
    if (!editName.value) {
      currentName.value = newUser.displayName || ''
    }
    if (!editFocus.value) {
      currentFocus.value = newUser.focus ? [...newUser.focus] : []
    }
    if (!editActivity.value) {
      currentActivity.value = newUser.activity ? [...newUser.activity] : []
    }
  },
  { immediate: true }
)

</script>