<template>
  <div class="flex flex-col min-h-screen">
    <Header/>
    <main v-if="thread" class="flex grow justify-center px-4">
      
        <section class="w-full max-w-4xl min-h-screen py-20">
            
            <!-- Back to Navigator Button (Top Right) -->
            <div class="flex justify-end mb-8">
              <button 
                @click="$router.push({ path: '/forum/main', query: { restore: 'true' } })"
                class="group flex items-center gap-2.5 px-4 py-2 rounded-full border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] text-[10px] uppercase tracking-[0.2em] text-[#777] hover:text-black dark:hover:text-white hover:border-black/20 dark:hover:border-white/20 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all duration-500 shadow-sm"
              >
                <svg class="w-3 h-3 transform group-hover:-translate-x-1 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span class="font-medium">Back to {{ activeCategoryName || 'Navigator' }}</span>
              </button>
            </div>
            
           
            <div class="mb-14 p-6 border dark:border-white/10 border-black/10 text-sm text-[#666]">
            <p class="font-serif mb-2">
               {{ definedCategory(thread.category).title }} · {{ capitalize(thread.subcategory) }}
            </p>
            <p class="leading-relaxed">
                This thread focuses on structural explanations.
                Off-topic comments, signals, or unsubstantiated claims may be collapsed by moderators.
            </p>
            </div>

           
            <article class="mb-20 dark:text-white space-y-6">

           
          <NuxtLink
            v-if="auth.user.uid === thread.authorId"
            :to="{
                path: '/forum/creation',
            query: { thread: thread.id }
            }"
           
            >
            <button
          
            class="
                text-[11px]
                uppercase
                tracking-widest
                font-serif
                text-[#050505]
                dark:text-[#e5e5e5]

                border
                border-black/20
                dark:border-white/20

                px-5
                py-2.5
                rounded-full

                transition
                duration-200

                hover:text-[#777]
                hover:border-black/40
                dark:hover:text-[#aaa]
                dark:hover:border-white/40
            ">
                Change thread

            </button>
           
            </NuxtLink>



            <div class="flex justify-between items-start mb-6">
              <h1 class="text-3xl font-serif">
                  {{ thread.title }}
              </h1>
              <div class="flex items-center gap-3">
                <button 
                  v-if="auth.user"
                  @click="toggleThreadLike"
                  class="group flex items-center justify-center p-3 rounded-full border border-black/5 dark:border-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-500"
                  :title="isThreadLiked ? 'Unlike Thread' : 'Like Thread'"
                >
                  <svg 
                    class="w-5 h-5 transition-all duration-500" 
                    :class="isThreadLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'fill-none stroke-[#777] group-hover:stroke-rose-500 group-hover:scale-105'" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button 
                  v-if="auth.user"
                  @click="savedThreads.toggleSaveThread(auth.user.uid, threadId)"
                  class="group p-3 rounded-full border border-black/5 dark:border-white/5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-all duration-500"
                  :title="savedThreads.isSaved(threadId) ? 'Remove from Archive' : 'Save to Archive'"
                >
                  <svg 
                    class="w-5 h-5 transition-all duration-700" 
                    :class="savedThreads.isSaved(threadId) ? 'fill-emerald-500 stroke-emerald-500 scale-110' : 'fill-none stroke-[#777] group-hover:stroke-black dark:group-hover:stroke-white'" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="flex items-center gap-3 text-xs tracking-widest uppercase text-[#777] mb-6">
                <div class="flex items-center gap-2">
                    <div class="relative w-6 h-6 shrink-0">
                         <!-- Placeholder / Fallback -->
                        <div class="absolute inset-0 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[10px] font-sans border dark:border-white/5 border-black/5 select-none text-[#777]">
                            {{ displayName.charAt(0) }}
                        </div>
                        <!-- Actual Avatar -->
                        <img 
                            v-show="userAvatar && !imgError" 
                            :src="userAvatar" 
                            @error="imgError = true"
                            referrerpolicy="no-referrer" 
                            class="absolute inset-0 w-6 h-6 rounded-full object-cover shadow-sm" 
                            alt="author avatar" 
                        />
                    </div>
                </div>
                <div class="flex items-center">
                     <span>{{ thread.subcategory }} <span class="mx-1.5 opacity-50">·</span> by <NuxtLink class="hover:dark:text-white hover:text-black transition font-medium mr-2" :to="{ path: '/profile', query: { uid: thread.authorId } }">{{ displayName }}</NuxtLink></span>
                     <button v-if="auth.user && auth.user.uid !== thread.authorId" @click="toggleFollow" class="px-3 py-[2px] rounded-full border text-[9px] font-bold transition-all duration-300" :class="isFollowing ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : 'border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30'">
                        {{ isFollowing ? 'Following' : 'Follow' }}
                     </button>
                     <span class="mx-1.5 opacity-50">·</span> 
                     <span>Updated {{ timeAgo(thread.lastActivityAt) }}</span>
                </div>
            </div>

            <ThreadContentRenderer @textSelected="handleTextSelected" v-if="thread?.thesis?.blocks" :blocks="thread.thesis.blocks" :isQuote="isQuoting"  />
            <ThreadIncludedTrades  v-if="thread?.includedTrades?.length > 0" :trades="thread.includedTrades" />

            <div class="flex items-center gap-3 mt-12 pt-8 border-t dark:border-white/10 border-black/10">
                <button
                  @click="isReplying = true; isQuoting = false"
                  class="
                    text-[11px] uppercase tracking-widest font-serif
                    text-[#050505] dark:text-[#e5e5e5]
                    border border-black/20 dark:border-white/20
                    px-5 py-2.5 rounded-full
                    transition duration-200
                    hover:text-[#777] hover:border-black/40
                    dark:hover:text-[#aaa] dark:hover:border-white/40
                  "
                >Reply</button>
                <button
                  @click="isReplying = true; isQuoting = true"
                  class="
                    text-[11px] uppercase tracking-widest font-serif
                    text-[#050505] dark:text-[#e5e5e5]
                    border border-black/20 dark:border-white/20
                    px-5 py-2.5 rounded-full
                    transition duration-200
                    hover:text-[#777] hover:border-black/40
                    dark:hover:text-[#aaa] dark:hover:border-white/40
                  "
                >Quote</button>
            </div>

            </article>



            <form @submit.prevent="submitForm" v-show="isReplying && !isReplyingTo" class="w-full pt-8">

                <!-- Quote preview (prominent) -->
                <div v-if="selectQuotation && isQuoting" class="mb-8 p-5 rounded-sm border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
                  <p class="text-[10px] uppercase tracking-widest text-[#777] mb-3">Quoting from thread</p>
                  <p class="text-sm font-serif italic text-[#444] dark:text-[#bbb] leading-relaxed">"{{ selectQuotation.text }}"</p>
                  <button
                    type="button"
                    @click="isQuoting = false; selectQuotation = null"
                    class="mt-4 text-[10px] uppercase tracking-widest text-[#999] hover:text-[#050505] dark:hover:text-white transition"
                  >Remove quote</button>
                </div>

                <!-- Textarea -->
                <textarea ref="textarea" @input="autoGrow($event)"
                  v-model="replyText"
                  rows="1"
                  placeholder="Write your reply…"
                  class="overflow-hidden box-content resize-none border-b text-sm py-4 dark:border-white/30 border-black/20 bg-transparent w-full text-black dark:text-white focus:outline-none mb-6"></textarea>

                <!-- Type selector -->
                <p class="text-[10px] uppercase tracking-widest text-[#777] mb-3">Select reply type</p>
                <ReplyTypeSelector v-model="replyType" />

                <!-- Actions -->
                <div class="flex justify-end items-center gap-3 mt-6">
                  <button
                    type="button"
                    @click.prevent="isReplying = false; isQuoting = false; replyType = null"
                    class="text-[11px] uppercase tracking-widest font-serif text-[#777] hover:text-[#050505] dark:hover:text-white transition duration-200"
                  >Cancel</button>
                  <button
                    :disabled="forum.loading"
                    type="submit"
                    class="text-[11px] uppercase tracking-widest font-serif px-6 py-2.5 rounded-full border transition duration-200"
                    :class="replyText && replyText.trim() !== '' && replyType
                      ? 'border-black/40 dark:border-white/40 text-[#050505] dark:text-white hover:border-black/70 dark:hover:border-white/70'
                      : 'border-black/10 dark:border-white/10 text-[#aaa] cursor-not-allowed'"
                  >Submit</button>
                </div>

            </form>
        
            <div class="space-y-16 mt-10 ">
              
                <div v-if="replies.length > 0" class="border-t dark:border-white/10 border-black/10 pt-10 dark:text-white space-y-4">
                 
                    <Reply :class="index !== 0 ? 'border-t dark:border-white/10 border-black/10 pt-10' : ''" 
                            v-for="(reply, index) in replies
                            .filter(reply => !reply.parentId)" 
                            :data-reply-index="reply.id"
                            :key="reply.id" 
                            :reply="reply"
                            :allReplies="replies"
                            :depth="0"
                            :maxDepth="3"
                            :threadId="threadId"
                            :thread="thread"
                          
                             />

                </div>  
                

                <div v-else>
                    <span class="text-xs text-[#777] text-start italic">No replies yet</span>
                </div>
             

                
           

            </div>

            <!-- NEW BEAUTIFUL STATISTICS BLOCK -->
            <div v-if="thread.linkedTradesCount" class="mt-24 border-t dark:border-white/10 border-black/10 pt-10">
                <h3 class="text-[10px] tracking-[0.25em] uppercase text-[#777] mb-8">Knowledge Impact</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="p-6 rounded-2xl border border-black/5 dark:border-white/5 bg-[#fafafa] dark:bg-[#1f1f1f] flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
                        <span class="text-4xl font-serif text-[#050505] dark:text-white mb-2">{{ thread.linkedTradesCount }}</span>
                        <span class="text-[9px] uppercase tracking-widest text-[#666] dark:text-[#aaa]">Linked Trades</span>
                    </div>
                    <div v-if="thread.linkedTradesCount > 0" class="p-6 rounded-2xl border border-black/5 dark:border-white/5 bg-[#fafafa] dark:bg-[#1f1f1f] flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" :class="(thread.positiveTradesCount || 0) / thread.linkedTradesCount >= 0.5 ? 'bg-emerald-500' : 'bg-amber-500'"></div>
                        <span class="text-4xl font-serif mb-2 relative z-10 transition-colors" :class="(thread.positiveTradesCount || 0) / thread.linkedTradesCount >= 0.5 ? 'text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500' : 'text-[#050505] dark:text-white group-hover:text-amber-500'">
                            {{ Math.round((thread.positiveTradesCount || 0) / thread.linkedTradesCount * 100) }}%
                        </span>
                        <span class="text-[9px] uppercase tracking-widest text-[#666] dark:text-[#aaa] relative z-10">Win Rate</span>
                    </div>
                </div>
            </div>


            <div
            v-if="linkedThreads.length > 0"
            class="mt-24 border-t dark:border-white/10 border-black/10 pt-10"
            >
            <h3
                class="text-[10px] tracking-[0.25em] uppercase text-[#777] mb-6"
            >
                Contributions
            </h3>

            <ul class="space-y-4">
                <li
                v-for="item in linkedThreads"
                :key="item.thread.id"
                class="group"
                >
                <ThreadLink
                    :thread="item.thread"
                    :linkType="item.linkType"
                    @click="navigateTo(`/forum/thread/${item.thread.id}`)"
                />
                </li>
            </ul>
            </div>


          
            <div class="mt-16 border-t dark:border-white/10 border-black/10 pt-10">
            <NuxtLink
                :to="{
                    path: '/forum/creation',
                    query: { contributesTo: threadId }
                }"
                class="inline-block group"
            >
                <button class="
                    flex items-center gap-8 px-10 py-5 rounded-[2rem] 
                    bg-white dark:bg-[#0a0a0a] 
                    border border-black/[0.06] dark:border-white/[0.06]
                    shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)] 
                    hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.12)] 
                    hover:border-black/20 dark:hover:border-white/20
                    transition-all duration-700 ease-in-out 
                    relative overflow-hidden
                ">
                    <div class="flex flex-col items-start">
                        <span class="text-[9px] uppercase tracking-[0.4em] text-[#999] group-hover:text-black dark:group-hover:text-white transition-colors duration-700 font-medium">New Archive</span>
                        <span class="text-sm font-serif text-[#050505] dark:text-[#f0f0f0] tracking-wide">Add contribution</span>
                    </div>
                    
                    <div class="w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-md relative overflow-hidden">
                        <!-- Plus Icon -->
                        <svg class="w-4 h-4 text-white dark:text-black relative z-10 group-hover:rotate-90 transition-transform duration-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 4v16m8-8H4" />
                        </svg>
                        
                        <!-- Shine Effect -->
                        <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    </div>

                    <!-- Inner Glow (Subtle) -->
                    <div class="absolute inset-0 rounded-[2rem] border border-white/40 dark:border-white/5 pointer-events-none"></div>
                </button>
            </NuxtLink>
            </div>

        </section>
    </main>
    <div class="w-36 mx-auto grow min-h-96 my-auto flex items-center justify-center" v-else>
        <img src="/logo.svg" class="dark:hidden animate-spin" alt="" />
        <img src="/logo-dark.svg" class="dark:flex hidden animate-spin" alt="" />
    </div>
    <Footer/>
  </div>
</template>


<script setup>
import Header from "~/widgets/header/ui/Header.vue";
import ThreadContentRenderer from "~/entities/thread/ui/ThreadContentRenderer.vue";
import Footer from "~/widgets/footer/Footer.vue";
import { useRoute } from "vue-router";
import { timeAgo } from "~/composables/timeAgo";
import ThreadLink from "~/entities/threadLink/ui/ThreadLink.vue";
import { useAuthStore } from "~/entities/user/auth.store";
import ThreadIncludedTrades from "~/entities/thread/ui/ThreadIncludedTrades.vue";

import Reply from "~/entities/reply/ui/Reply.vue";
import ReplyTypeSelector from "~/entities/reply/ui/ReplyTypeSelector.vue";
import { definedCategory } from "../model/useCategory";
import { capitalize } from "~/shared/capitalise";
import { textarea, autoGrow } from "~/composables/autoGrow";

import { replyText, isReplying, replyType, submitReply, isQuoting, selectQuotation, isReplyingTo  } from "../model/useReply";
import { useForumStore } from "~/features/store/useForum";
import { useForumCategoryStore } from "~/features/store/useForumCategory";
import { ref, computed } from "vue";
import { sendNotification } from "~/features/notifications/api/sendNotification";

const forumCategory = useForumCategoryStore();

const activeCategoryName = computed(() => {
    if (!forumCategory.activeCategoryId) return null;
    for (const sectionId in forumCategory.categories) {
        const sectionCats = forumCategory.categories[sectionId];
        if (!sectionCats) continue;
        const cat = sectionCats.find(c => c.id === forumCategory.activeCategoryId);
        if (cat) return cat.name;
    }
    return null;
});
import { scrollToReply } from '~/entities/notification/model/scrollToReply';
import { isReplyLikedByUser } from '~/entities/reply/model/likesManagement';
import { useSavedThreadsStore } from "~/features/store/useSavedThreads";
import { useForumHistoryStore } from "~/features/store/useForumHistory";
import { isFollowingUser } from "~/entities/user/model/followManagement";
import { followUser, unfollowUser } from "~/widgets/profile/model/useProfile";

definePageMeta({
  public: true
})


const auth = useAuthStore()
const savedThreads = useSavedThreadsStore()


const route = useRoute();
const threadId = route.params.id;

const forum = useForumStore()
const historyStore = useForumHistoryStore()

const thread = ref(null)
const links = ref([])
const linkedThreads = ref([])

async function submitForm(){
    let reply = null;
    if(selectQuotation.value){
        reply = await submitReply(threadId, auth.user?.uid, null, selectQuotation.value) 
    }else{
        reply = await submitReply(threadId, auth.user?.uid)
    }

    await sendNotification({
        toUserId: thread.value.authorId,
        type: 'reply_to_thread',
        actorId: auth.user?.uid,
        actorLabel: auth.user?.displayName,
        target: {
            entity: 'thread',
            id: threadId
        },
        context: {
            threadId: threadId,
            threadTitle: thread.value.title,
            threadAuthor: displayName.value,
            threadAuthorId: thread.value.authorId
        }
    })
   
    forum.addReply(reply);
   
}

function reloadPage(){
    window.location.reload()
}

const author = computed(() => thread.value?.authorId ? forum.users.get(thread.value.authorId) : null);
const displayName = computed(() => author.value?.displayName || 'Anonymous'); 
const userAvatar = computed(() => author.value?.photoURL || author.value?.avatar || null);
const imgError = ref(false);
const isThreadLiked = ref(false);

const isFollowing = computed(() => {
  if (!auth.user?.uid || !thread.value?.authorId) return false;
  const currentAuthDbUser = forum.users.get(auth.user.uid);
  return (currentAuthDbUser?.followed?.includes(thread.value.authorId) || 
          auth.user?.followed?.includes(thread.value.authorId)) || false;
});

async function toggleFollow() {
    if (!auth.user || !thread.value?.authorId) return;
    
    const targetUserId = thread.value.authorId;
    const currentIsFollowing = isFollowing.value;
    
    // UI Update for the author's count (reflected in profile and lists)
    if (author.value) {
        author.value.followers = (author.value.followers || 0) + (currentIsFollowing ? -1 : 1);
    }
    
    try {
        if (currentIsFollowing) {
            await unfollowUser(auth.user.uid, targetUserId);
            // Synchronize across both state managers to ensure reactivity
            const updatedList = (auth.user.followed || []).filter(id => id !== targetUserId);
            auth.user.followed = updatedList;
            const currentAuthDbUser = forum.users.get(auth.user.uid);
            if(currentAuthDbUser) {
                currentAuthDbUser.followed = updatedList;
            }
        } else {
            await followUser(auth.user.uid, targetUserId);
            const updatedList = [...(auth.user.followed || []), targetUserId];
            auth.user.followed = updatedList;
            const currentAuthDbUser = forum.users.get(auth.user.uid);
            if(currentAuthDbUser) {
                currentAuthDbUser.followed = updatedList;
            }
        }
    } catch (e) {
        console.error("Follow toggling failed:", e);
        // Revert optimistic update
        isFollowing.value = currentIsFollowing;
        if (author.value) {
            author.value.followers = (author.value.followers || 0) + (currentIsFollowing ? 1 : -1);
        }
    }
}

async function toggleThreadLike() {
    if (!auth.user || !threadId) return;
    
    const currentIsLiked = isThreadLiked.value;
    
    // Optimistic update
    isThreadLiked.value = !currentIsLiked;
    if (thread.value) {
        if (!currentIsLiked) {
            thread.value.likesCount = (thread.value.likesCount || 0) + 1;
        } else {
            thread.value.likesCount = Math.max(0, (thread.value.likesCount || 0) - 1);
        }
    }
    
    try {
        if (currentIsLiked) {
            await removeThreadLike(threadId, auth.user.uid);
        } else {
            await likeThread(threadId, auth.user.uid);
        }
    } catch (e) {
        console.error("Like toggling failed:", e);
        // Revert
        isThreadLiked.value = currentIsLiked;
        if (thread.value) {
            if (!currentIsLiked) {
                thread.value.likesCount = Math.max(0, (thread.value.likesCount || 0) - 1);
            } else {
                thread.value.likesCount = (thread.value.likesCount || 0) + 1;
            }
        }
    }
}

onMounted(async () => {
  
  await forum.fetchThreadList()
  await forum.fetchReplies(threadId)




  const threadsMap = forum.threads
  thread.value = threadsMap.get(threadId)

  if (thread.value && thread.value.authorId) {
    // Await fetchUser to guarantee they are inside the forum.users cache before reading
    await forum.fetchUser(thread.value.authorId)

    // Add to local history with author name
    historyStore.addThreadToHistory(thread.value, displayName.value)
  }



  links.value = await forum.fetchThreadLinks(threadId)

  // Ensure all referenced threads are in the cache (they may not be in the recent 30)
  await Promise.all(
    links.value.map(link => {
      const otherId = link.fromThreadId === threadId ? link.toThreadId : link.fromThreadId
      if (!threadsMap.has(otherId)) {
        return forum.fetchThread(otherId)
      }
    })
  )

  // For each link, resolve the "other" thread (the one that is not the current thread)
  linkedThreads.value = links.value
    .map(link => {
      const otherId = link.fromThreadId === threadId ? link.toThreadId : link.fromThreadId
      const t = threadsMap.get(otherId)
      if (!t) return null
      return { thread: t, linkType: link.type }
    })
    .filter(Boolean)

    if(route.query.replyId){
        scrollToReply(route.query.replyId)
    }

    for (const reply of replies.value) {
        reply.likedByMe = await isReplyLikedByUser(reply.id, auth.user?.uid)
    }

    if (auth.user) {
        isThreadLiked.value = await isThreadLikedByUser(threadId, auth.user.uid);
    }
 


})

const replies = computed(() =>
    forum.replies.get(threadId) ?? []
)

function handleTextSelected(payload){
    payload.threadId = threadId
    selectQuotation.value = payload;
}



</script>
<style scoped>
textarea {
  resize: none; 
  overflow-y: hidden;
  box-sizing: border-box; 
}

</style>