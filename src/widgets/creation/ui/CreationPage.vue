<template>
   
    <transition name="fade">
        <div v-if="isUploadingImage" class="fixed inset-0 z-[99999] pointer-events-auto">
            <!-- Background Layer (Blur only) -->
            <div class="absolute inset-0 bg-white/20 dark:bg-black/40 backdrop-blur-xl"></div>
            
            <!-- Content Layer (Sharp) -->
            <div class="absolute inset-0 flex items-center justify-center px-4">
                <div class="bg-white dark:bg-[#050505] border border-black/10 dark:border-white/10 p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full relative">
                    <div class="relative w-16 h-16">
                        <div class="absolute inset-0 border-4 border-black/5 dark:border-white/5 rounded-full"></div>
                        <div class="absolute inset-0 border-4 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                    </div>
                    <div class="text-center w-full">
                        <h3 class="text-sm font-serif uppercase tracking-[0.2em] font-bold mb-2 text-[#050505] dark:text-white">Processing Image</h3>
                        <p class="text-[10px] text-[#777] uppercase tracking-widest leading-relaxed mb-6">Optimization and secure upload in progress...</p>
                        
                        <!-- Progress Bar Container -->
                        <div class="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden relative">
                            <div 
                                class="absolute inset-y-0 left-0 bg-black dark:bg-white transition-all duration-300 ease-out rounded-full"
                                :style="{ width: `${uploadProgress}%` }"
                            ></div>
                        </div>
                        <div class="mt-3 flex justify-between items-center px-1">
                            <span class="text-[9px] uppercase tracking-widest font-bold text-black/40 dark:text-white/40">Status</span>
                            <span class="text-[11px] font-mono font-bold text-black dark:text-white">{{ uploadProgress }}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </transition>

    <main class="flex justify-center px-4">
        <section class="w-full max-w-3xl py-24">
            
            <!-- Floating Error Notification -->
            <transition name="slide-up">
                <div v-if="creationError" class="fixed bottom-10 left-0 right-0 z-[100] flex justify-center pointer-events-none">
                    <div class="pointer-events-auto px-6 py-4 bg-red-500/90 dark:bg-red-600/90 backdrop-blur-md text-white rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] max-w-[90vw] border border-white/20">
                        <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <span class="text-sm font-medium tracking-wide">{{ creationError }}</span>
                        <button @click="creationError = null" class="ml-auto hover:opacity-70 transition">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </transition>

        
            <header v-if="status === 'idle' ||  status === 'loading'" class="mb-16">
            <h1 v-if="!route.query.thread && !route.query.contributesTo" class="text-3xl font-serif mb-4">
                Create new thread
            </h1>
            <h1 v-else-if="route.query.contributesTo" class="text-3xl font-serif mb-4">
                Add contribution
            </h1>
            <h1 v-else class="text-3xl font-serif mb-4">
                Edit thread
            </h1>
            <p class="text-sm leading-relaxed">
                A thread represents a coherent idea, hypothesis, or documented practice.
                Write clearly. Avoid repetition. Focus on substance.
            </p>

            <!-- Contributing-to banner -->
            <div
                v-if="contributingToThread"
                class="mt-6 border border-black/10 dark:border-white/10 px-5 py-4 space-y-4"
            >
                <div class="flex items-start gap-4">
                    <div class="flex-1 min-w-0">
                        <p class="text-[10px] uppercase tracking-widest mb-1">Contributing to</p>
                        <NuxtLink
                            :to="{ path: `/forum/thread/${contributingToThread.id}` }"
                            class="text-sm font-serif hover:opacity-70 transition line-clamp-2"
                            style="color: var(--text-heading)"
                        >
                            {{ contributingToThread.title }}
                        </NuxtLink>
                    </div>
                    <button
                        type="button"
                        @click="removeContribution"
                        class="flex-shrink-0 text-[11px] uppercase tracking-widest text-[#777] hover:text-red-500 dark:hover:text-red-400 transition"
                    >
                        Remove
                    </button>
                </div>

                <!-- Link type selector -->
                <div>
                    <p class="text-[10px] uppercase tracking-widest text-[#777] mb-3">Relation type</p>
                    <div class="flex flex-wrap gap-2">
                        <button
                            v-for="lt in linkTypes"
                            :key="lt.value"
                            type="button"
                            @click="contributionLinkType = lt.value"
                            :class="[
                                'text-[10px] uppercase tracking-widest px-3 py-1.5 border transition',
                                contributionLinkType === lt.value
                                    ? 'border-black dark:border-white text-[#050505] dark:text-white'
                                    : 'border-black/10 dark:border-white/10 text-[#777] hover:border-black/30 dark:hover:border-white/30'
                            ]"
                            :title="lt.description"
                        >
                            {{ lt.label }}
                        </button>
                    </div>
                </div>
            </div>

            </header>


            <form v-if="status === 'idle' ||  status === 'loading'" @submit.prevent="publish" class="space-y-16">


                <div
                    v-if="showConfirmCreation || showConfirmDeletion"
                    class="fixed inset-0 z-50 flex items-center justify-center"
                    >
                    <div
                        class="absolute inset-0 bg-black/40"
                    ></div>

                    <div
                        class="relative w-full max-w-md bg-white dark:bg-[#050505] rounded-xl shadow-xl px-8 py-6"
                    >
                        <h2 v-if="showConfirmCreation" class="text-lg font-serif text-[#050505] dark:text-white mb-4">
                        Publish thread?
                        </h2>

                        <h2 v-if="showConfirmDeletion" class="text-lg font-serif text-[#050505] dark:text-white mb-4">
                        Delete thread?
                        </h2>

                        <p v-if="showConfirmCreation" class="text-sm text-[#555] dark:text-[#aaa] mb-6 leading-relaxed">
                        After publishing, this thread will become visible to other users.
                        Make sure the structure and thesis blocks are complete.
                        </p>

                        <p v-if="showConfirmDeletion" class="text-sm text-[#555] dark:text-[#aaa] mb-6 leading-relaxed">
                        After deleting, this thread will become invisible to other users.
                        Make sure the structure and thesis blocks are complete.
                        </p>

                        <div class="flex justify-end gap-4">
                        <button
                            class="text-sm uppercase tracking-widest px-4 py-2 text-[#777]"
                            @click.prevent="showConfirmCreation = false; showConfirmDeletion = false"
                        >
                            Cancel
                        </button>

                        <button
                            v-if="showConfirmCreation"
                            :disabled="isSubmitting"
                            type="submit"
                            class="text-sm uppercase tracking-widest px-6 py-2 rounded-full border dark:text-white border-black dark:border-white"
                            @click="isConfirmedCreation = true"
                        >
                            Confirm
                        </button>

                        <button
                            v-if="showConfirmDeletion"
                            :disabled="isSubmitting"
                            type="submit"
                            class="text-sm uppercase tracking-widest px-6 py-2 rounded-full border dark:text-white border-black dark:border-white"
                            @click="isConfirmedDeletion = true"
                        >
                            Confirm
                        </button>
                        </div>
                    </div>
                </div>



            <!-- Step 1: Knowledge Domain Selector (UI Helper Only) -->
            <div>
                <label class="block text-[10px] uppercase tracking-[0.3em] text-[#777] mb-8">
                    Knowledge Domain
                </label>
                <div class="flex flex-wrap gap-3">
                    <button
                        v-for="section in forumCategory.mainSections"
                        :key="section.id"
                        type="button"
                        @click="selectedDomain = section.id; category = (forumCategory.getCategoriesBySection(section.id)[0]?.id || 'general')"
                        class="px-6 py-2.5 rounded-full border text-[11px] font-bold uppercase tracking-widest transition-all duration-300"
                        :class="selectedDomain === section.id 
                            ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-[1.05]' 
                            : 'border-black/10 dark:border-white/10 text-[#777] hover:border-black/30 dark:hover:border-white/30'"
                    >
                        {{ section.name }}
                    </button>
                </div>
            </div>

            <!-- Step 2: Topic Selector (Maps to 'category' field) -->
            <div v-if="selectedDomain" class="space-y-6">
                <div class="flex items-center justify-between">
                    <label class="block text-[10px] uppercase tracking-[0.3em] text-[#777]">
                        Refine Focus (Category)
                    </label>
                    <span class="text-[9px] uppercase tracking-widest text-[#aaa]">
                        {{ forumCategory.getCategoriesBySection(selectedDomain).length }} topics available
                    </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div
                        v-for="topic in forumCategory.getCategoriesBySection(selectedDomain)"
                        :key="topic.id"
                        @click="category = topic.id"
                        class="group p-5 rounded-2xl border transition-all duration-500 cursor-pointer flex flex-col justify-between min-h-[100px]"
                        :class="category === topic.id 
                            ? 'border-black dark:border-white ring-1 ring-black dark:ring-white bg-black/[0.02] dark:bg-white/[0.02]' 
                            : 'border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20'"
                    >
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="text-[11px] font-serif uppercase tracking-wider group-hover:tracking-[0.15em] transition-all duration-300" :class="{ 'font-bold': category === topic.id }">
                                    {{ topic.name }}
                                </h4>
                                <div v-if="category === topic.id" class="w-1.5 h-1.5 rounded-full bg-black dark:bg-white"></div>
                            </div>
                            <p class="text-[9px] leading-relaxed text-[#777] line-clamp-1">
                                {{ topic.desc }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 3: Thread Type Selector (Maps to 'subcategory' field) -->
            <div v-if="category" class="space-y-6">
                <div class="flex items-center justify-between">
                    <label class="block text-[10px] uppercase tracking-[0.3em] text-[#777]">
                        Thread Type (Subcategory)
                    </label>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                        @click="subcategory = 'theory'"
                        class="group p-6 rounded-2xl border transition-all duration-500 cursor-pointer flex items-center gap-4"
                        :class="subcategory === 'theory' 
                            ? 'border-black dark:border-white ring-1 ring-black dark:ring-white bg-black/[0.02] dark:bg-white/[0.02]' 
                            : 'border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20'"
                    >
                        <div class="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                            <svg class="w-5 h-5 text-[#555] dark:text-[#aaa]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l-.707-.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 21V19m0-11a5 5 0 015 5c0 1.201-.421 2.305-1.122 3.172l-.59.733A9.01 9.01 0 0111 21.41V19H9.41a3.001 3.001 0 01-1.59-5.122l.59-.733A5.002 5.002 0 0112 8z"/>
                            </svg>
                        </div>
                        <div>
                            <h4 class="text-sm font-serif" :class="{ 'font-bold': subcategory === 'theory' }">Theory / Assumption</h4>
                            <p class="text-[9px] text-[#777] uppercase tracking-widest mt-1">Conceptual Framework</p>
                        </div>
                    </div>

                    <div
                        @click="subcategory = 'practice'"
                        class="group p-6 rounded-2xl border transition-all duration-500 cursor-pointer flex items-center gap-4"
                        :class="subcategory === 'practice' 
                            ? 'border-black dark:border-white ring-1 ring-black dark:ring-white bg-black/[0.02] dark:bg-white/[0.02]' 
                            : 'border-black/5 dark:border-white/5 hover:border-black/20 dark:hover:border-white/20'"
                    >
                        <div class="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
                            <svg class="w-5 h-5 text-[#555] dark:text-[#aaa]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                        </div>
                        <div>
                            <h4 class="text-sm font-serif" :class="{ 'font-bold': subcategory === 'practice' }">Practice / Test</h4>
                            <p class="text-[9px] text-[#777] uppercase tracking-widest mt-1">Real-world Execution</p>
                        </div>
                    </div>
                </div>
            </div>


        
            <div>
                <label class="block text-xs uppercase tracking-widest text-[#777] mb-4">
                Thread title
                </label>
                <input
                type="text"
                required
                v-model="threadTitle"
                placeholder="Formulate a precise and falsifiable statement"
                class="w-full bg-transparent border-b border-black/20 dark:border-white/20
                        pb-3 text-lg font-serif focus:outline-none
                        placeholder:text-[#bbb] dark:text-white"
                />
            </div>

            
            <div>
                <label class="block text-xs uppercase tracking-widest text-[#777] mb-4">
                Short summary (Description)
                </label>
                <textarea
                rows="3"
                v-model="threadDescription"
                required
                placeholder="One or two sentences describing the core idea"
                class="w-full bg-transparent border border-black/10 dark:border-white/10
                        p-4 text-sm leading-relaxed focus:outline-none
                        placeholder:text-[#bbb] dark:text-white"
                ></textarea>
            </div>

        
                <!-- Editor Thesis Section -->
                <div class="space-y-6">
                    <label class="block text-[10px] uppercase tracking-[0.3em] text-[#777] font-serif">
                        Thesis (Research Narrative)
                    </label>

                    <!-- Editor Toolbar -->
                    <div class="flex flex-wrap items-center gap-1.5 px-4 py-3 bg-white/40 dark:bg-white/[0.02] backdrop-blur-md border border-b-0 border-black/10 dark:border-white/10 rounded-t-2xl text-[#444] dark:text-[#ccc]">
                    <button type="button" @click="formatDoc('formatBlock', '<h1>')" class="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-[#2d2d2d] border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition" title="Heading 1">H1</button>
                    <button type="button" @click="formatDoc('formatBlock', '<h2>')" class="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-[#2d2d2d] border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition" title="Heading 2">H2</button>
                    
                    <div class="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-1"></div>

                    <button type="button" @click="formatDoc('bold')" class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition" title="Bold">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 4h8a4 4 0 010 8H6zM6 12h9a4 4 0 010 8H6z"/></svg>
                    </button>
                    <button type="button" @click="formatDoc('italic')" class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition" title="Italic">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m-4 0h4m-4 16h4"/></svg>
                    </button>

                    <div class="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-1"></div>

                    <button type="button" @click="formatDoc('insertUnorderedList')" class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition" title="Bullet List">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                    </button>
                    <button type="button" @click="formatDoc('formatBlock', '<blockquote>')" class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition" title="Quote">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    </button>

                    <div class="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-1"></div>

                    <label class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer" title="Insert Image">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <input type="file" accept="image/*" class="hidden" @change="insertImageInHtml($event)" />
                    </label>
                </div>

                <!-- Unified Editor Canvas -->
                <div
                    ref="editorRef"
                    class="border border-black/10 dark:border-white/10 rounded-b-2xl p-8 bg-white/40 dark:bg-black/20 backdrop-blur-md min-h-[400px] outline-none prose dark:prose-invert max-w-none
                        [&_h1]:text-3xl [&_h1]:font-serif [&_h1]:mb-6
                        [&_h2]:text-xl [&_h2]:font-serif [&_h2]:mb-4
                        [&_p]:text-base [&_p]:leading-relaxed [&_p]:mb-4
                        [&_img]:rounded-xl [&_img]:shadow-lg [&_img]:border [&_img]:border-black/5
                        [&_blockquote]:border-l-4 [&_blockquote]:border-black/30 dark:[&_blockquote]:border-white/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-black/70 dark:[&_blockquote]:text-white/80
                        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
                        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
                        [&_li]:text-base [&_li]:leading-relaxed [&_li]:mb-1
                    "
                    contenteditable="true"
                    @input="onEditorInput"
                ></div>

                <p class="text-[10px] text-[#aaa] mt-4 font-serif italic tracking-widest uppercase">
                    Your thesis will be automatically structured into blocks for the methodology system.
                </p>
            </div>

            <TradesMenu/>


            <div class="border-l border-black/10 dark:border-white/10 pl-6">
                <p class="text-xs text-[#777] leading-relaxed">
                By publishing this thread, you agree to follow the forum’s code of conduct.
                Low-effort posts, unstructured opinions, and promotional content may be
                collapsed or removed.
                </p>
            </div>


            <div class="flex justify-end gap-6 pt-12">
             
                <NuxtLink class="text-center flex items-center" to="/forum/main">
                    <button
                
                    type="button"
                    class="text-sm text-[#777] hover:text-black dark:hover:text-white transition"
                    >
                    Cancel
                    </button>
                </NuxtLink>

                <button 
                    :disabled="isSubmitting"
                    v-if="isEditing"
                    @click="showConfirmDeletion = true"
                    type="button" 
                    class="text-sm text-red-500 hover:text-black dark:hover:text-white transition">
                    Delete thread
                </button>
              
                <button
                :disabled="isSubmitting"
                type="button"
                @click="showConfirmCreation = true"
                class="text-sm font-serif tracking-wide
                        border border-black/20 dark:border-white/20
                        px-6 py-3 hover:border-black dark:hover:border-white
                        transition dark:text-white"
                >
                <span v-if="!isEditing">Publish thread</span>
                <span v-else>Edit thread</span>
                </button>
            </div>

            </form>
            <div v-if=" status === 'success' && threadId">
                <CreationSuccess :url="threadId || ''" :threadTitle="threadTitle || ''" :threadSubTitle="threadDescription || ''" />
            </div>
           <div
                v-if="status === 'deleted'"
                class="mt-20 max-w-md mx-auto text-center"
                >
                <p
                    class="text-sm font-serif tracking-wide text-[#050505] dark:text-[#e5e5e5] mb-6"
                >
                    The thread has been deleted successfully.
                </p>

                <NuxtLink
                    to="/forum/main"
                    class="
                    inline-flex
                    items-center
                    justify-center
                    text-[11px]
                    uppercase
                    tracking-widest
                    font-serif

                    px-6
                    py-3
                    rounded-full

                    border
                    border-black/30
                    dark:border-white/30

                    text-[#050505]
                    dark:text-[#e5e5e5]

                    transition
                    duration-200

                    hover:text-[#777]
                    hover:border-black/50
                    dark:hover:text-[#aaa]
                    dark:hover:border-white/50
                    "
                >
                    Return to forum
                </NuxtLink>
                </div>

        </section>
    </main>
  
 
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { useAuthStore } from "~/entities/user/auth.store";
import CreationSuccess from "./CreationSuccess.vue";
import { 
    category,
    selectedDomain, 
    creationError,
    subcategory, 
    threadTitle, 
    threadDescription,
    blocks,
    thesisHtml,
    syncBlocksFromHtml,
    syncHtmlFromBlocks,
    insertImageInHtml,
    isUploadingImage,
    uploadProgress,
    createThread,
    status,
    threadId,
    isSubmitting,
    updateThread,
    deleteThread,
    selectedTrades,
    createThreadLink
} from "~/widgets/creation/model/useCreation";
import { useRoute, useRouter } from "vue-router";
import TradesMenu from "./TradesMenu.vue";
import { useForumStore } from "~/features/store/useForum";
import { useThemeStore } from "~/features/store/useTheme";
import { useForumCategoryStore } from "~/features/store/useForumCategory";
import type { Thread } from "~/entities/thread/model/thread.types";
import type { LinkType } from "~/entities/threadLink/model/threadLink.types";

const forum = useForumStore();
const themeStore = useThemeStore();
const forumCategory = useForumCategoryStore();

const route = useRoute();
const router = useRouter();

const auth = useAuthStore();

const editorRef = ref<HTMLDivElement | null>(null);
watch(isUploadingImage, (newVal) => {
    console.log('UI: isUploadingImage changed to:', newVal);
});

const isEditing = ref(false);
const thread = ref<Thread | null>(null);

const showConfirmCreation = ref(false);
const showConfirmDeletion = ref(false);
const isConfirmedCreation = ref(false);
const isConfirmedDeletion = ref(false);

// --- Contribution logic ---
const contributingToThread = ref<Thread | null>(null);
const contributionLinkType = ref<LinkType>('extends');

const linkTypes: { value: LinkType; label: string; description: string }[] = [
    { value: 'extends',     label: 'Extends',     description: 'This thread builds upon or expands the target' },
    { value: 'supports',    label: 'Supports',    description: 'This thread provides evidence for the target' },
    { value: 'contradicts', label: 'Contradicts', description: 'This thread argues against the target' },
    { value: 'applies',     label: 'Applies',     description: 'This thread applies the target idea in practice' },
    { value: 'references',  label: 'References',  description: 'This thread references the target for context' },
];

function removeContribution() {
    contributingToThread.value = null;
    router.replace({ query: { ...route.query, contributesTo: undefined } });
}

const publish = async () => {
    if(isConfirmedCreation.value){
        if(!isEditing.value){
            await createThread(auth.user?.uid || '00000011111');
            if(contributingToThread.value && threadId.value){
                await createThreadLink({
                    fromThreadId: (threadId.value || ''),
                    toThreadId: contributingToThread.value.id,
                    type: contributionLinkType.value
                });
            }
        }
        else{
            if(!threadId.value && route.query.thread) return;
            await updateThread(auth.user?.uid || '00000011111', (threadId.value || ''));
        }
        isConfirmedCreation.value = false;
    }

    if(isConfirmedDeletion.value){
        await deleteThread(auth.user?.uid || '00000011111', (threadId.value || ''));
        isConfirmedDeletion.value = false;
        if (threadId.value) forum.removeThread(threadId.value);
    }
}

function formatDoc(command: string, value?: string) {
    document.execCommand(command, false, value);
    onEditorInput();
}

function onEditorInput() {
    if (editorRef.value) {
        thesisHtml.value = editorRef.value.innerHTML;
        syncBlocksFromHtml(editorRef.value.innerHTML);
    }
}

// Keep editor UI in sync with state when NOT typing
watch(thesisHtml, (newVal) => {
    if (editorRef.value && document.activeElement !== editorRef.value) {
        editorRef.value.innerHTML = newVal;
    }
});

watch(
    () => auth.user?.uid,
  async (uid) => {
    if (!uid) return;
    
    if(route.query.thread){
        await forum.fetchThreadList();

        const threadsMap = forum.threads;
        const threadParam = Array.isArray(route.query.thread) ? route.query.thread[0] : route.query.thread;
        
        if (threadParam) {
            thread.value = threadsMap.get(threadParam) || null;
        }

        if(!thread.value || (thread.value.authorId !== uid)) return;

        category.value = thread.value.category;
        subcategory.value = thread.value.subcategory;
        threadTitle.value = thread.value.title;
        threadDescription.value = thread.value.description;
        threadId.value = thread.value.id;
        selectedTrades.value = thread.value.includedTrades || [];
        
        syncHtmlFromBlocks(thread.value.thesis.blocks);
        isEditing.value = true;
    }
    else{
        threadTitle.value = null;
        threadDescription.value = null;
        threadId.value = null;
        selectedTrades.value = [];
        blocks.value = [];
        thesisHtml.value = '';
        isEditing.value = false;
    }

    if(route.query.contributesTo){
        await forum.fetchThreadList();
        const contributesToId = Array.isArray(route.query.contributesTo) ? route.query.contributesTo[0] : route.query.contributesTo;
        if (contributesToId) {
            contributingToThread.value = forum.threads.get(contributesToId) ?? null;
            if(!contributingToThread.value){
                const fetched = await forum.fetchThread(contributesToId);
                contributingToThread.value = fetched;
            }
        }
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
    threadTitle.value = null;
    threadDescription.value = null;
    threadId.value = null;
    selectedTrades.value = [];
    blocks.value = [];
    thesisHtml.value = '';
    isEditing.value = false;
    status.value = 'idle';
    thread.value = null;
    showConfirmCreation.value = false;
    showConfirmDeletion.value = false;
    isConfirmedCreation.value = false;
    isConfirmedDeletion.value = false;
    contributingToThread.value = null;
    contributionLinkType.value = 'extends';
});
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
