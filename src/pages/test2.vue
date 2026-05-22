<template>
  <div class="ethereal-void min-h-screen relative overflow-hidden transition-all duration-1000"
       :class="{ 'is-runified': isIdle, 'is-dark': isDark, 'dark': isDark }">
    
    <!-- Deep Aperture Background (f/2 blur) -->
    <div class="fixed inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-1000" 
         :style="{ 
           backgroundImage: 'url(\'/assets/white_ethereal_bg.png\')',
           filter: 'blur(30px) brightness(1.1) contrast(0.9)',
           opacity: isDark ? 0 : (isAssembled ? 0.35 : 0)
         }"></div>

    <!-- 5D Tesseract Canvas Background -->
    <canvas v-if="isTesseractEnabled" ref="tesseractCanvas" class="fixed inset-0 z-10 pointer-events-none opacity-[0.35] blur-[5px]"></canvas>

    <!-- Glass Reflection Light Sweep -->
    <div v-if="!isDark" class="fixed inset-0 z-5 pointer-events-none overflow-hidden">
      <div class="light-sweep"></div>
    </div>

    <!-- Sunlight Strike: Initial Bloom Overlay -->
    <Transition name="bloom-fade">
      <div v-if="showBloom" class="fixed inset-0 z-[100] bg-white pointer-events-none flex items-center justify-center">
        <div class="w-full h-full bg-gradient-radial from-white via-white/90 to-transparent blur-[120px] animate-pulse"></div>
      </div>
    </Transition>

    <!-- Subtle HUD Decoration -->
    <div class="fixed inset-0 z-1 pointer-events-none scanlines opacity-[0.03]"></div>
    <div class="fixed inset-0 z-1 pointer-events-none dot-grid opacity-[0.05]"></div>

    <!-- Enhanced Floating Header (Post-Bloom Reveal) -->
    <HeaderF v-model:activeTab="activeTab" v-model:isDark="isDark" v-model:isTesseractEnabled="isTesseractEnabled" :isAssembled="isAssembled" />

    <!-- Main Content: Focused Multi-Page Interface -->
    <main class="relative z-50 flex items-start justify-center min-h-screen p-16 pt-32">
      <Transition name="page-reify" mode="out-in">
        <div :key="activeTab" class="relative max-w-[65rem] w-full min-h-[35rem] p-12 focus-widget">
          
          <!-- Structural Anchors -->
          <div class="absolute top-0 left-0 w-12 h-12 border-t border-l border-current/10"></div>
          <div class="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-current/10"></div>

          <!-- Page Component Container -->
          <div class="grid grid-cols-12 gap-16 h-full">
            
            <!-- Left Info Pane (Reification Identity HUD) -->
            <div v-if="activeTab !== 'forum' || (activeTab === 'forum' && (forumContext !== 'view' && forumContext !== 'create'))" class="col-span-4 border-r border-current/5 pr-12 flex flex-col justify-between">
              <div class="space-y-12">
                <!-- Identity Core -->
                <div class="space-y-6">
                  <div class="flex items-center space-x-3">
                    <div class="w-2 h-2 rounded-full bg-current animate-pulse shadow-[0_0_8px_rgba(var(--text-primary-rgb),0.5)]"></div>
                    <span class="text-[9px] text-current/60 font-mono tracking-[0.4em] uppercase">Status: Reified</span>
                  </div>
                  
                  <div class="space-y-1">
                    <span class="text-[8px] text-current/20 font-bold tracking-[0.6em] uppercase">Auth_Session // ID</span>
                    <h2 class="text-xl font-serif italic text-current opacity-90 tracking-wide">{{ auth.user?.displayName || 'Unknown_Subject' }}</h2>
                  </div>

                  <div class="w-12 h-[1px] bg-current opacity-10"></div>
                </div>

                <!-- Temporal & System Flux (Regular Tabs) -->
                <div class="space-y-8">
                  <div class="flex flex-col space-y-2">
                    <span class="text-[7px] text-current/30 font-mono tracking-[0.4em] uppercase">Temporal_Flux</span>
                    <span class="text-xs font-mono text-current opacity-70 tracking-widest">{{ currentTimeReadout }}</span>
                  </div>

                  <div class="flex flex-col space-y-2">
                    <span class="text-[7px] text-current/30 font-mono tracking-[0.4em] uppercase">Module_Layer</span>
                    <div class="flex items-center space-x-4">
                      <div class="w-4 h-4 border border-current/20 flex items-center justify-center">
                        <div class="w-1 h-1 bg-current animate-spin-slow"></div>
                      </div>
                      <span class="text-xl font-serif lowercase italic text-current opacity-90">{{ activeTab }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Page-Specific Status Data (Consistency Pulse) -->
                <div class="space-y-6">
                  <div class="flex flex-col space-y-4">
                    <span class="text-[7px] text-current/30 font-mono tracking-[0.4em] uppercase">Consistency_Pulse</span>
                    <div class="flex items-end space-x-1 h-8">
                      <div v-for="i in 12" :key="i" 
                           class="flex-grow bg-current/20" 
                           :style="{ height: (20 + Math.random() * 80) + '%' }">
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between text-[8px] font-mono tracking-widest opacity-30">
                    <span>RES_0.00ms</span>
                    <span>SYNC_ACTIVE</span>
                  </div>
                </div>
            </div>

            <!-- Right Dynamic Pane (Main Content) -->
            <div :class="(activeTab === 'forum' && (forumContext === 'view' || forumContext === 'create')) ? 'col-span-12' : (activeTab === 'forum' && forumContext !== 'view' ? 'col-span-12' : 'col-span-8')" class="flex flex-col h-full scroll-minimal">
              
              <!-- PAGE: Archive (Existence Registry / Activity Log) -->
              <div v-show="activeTab === 'archive'" class="flex-grow flex flex-col min-w-0">
                <div class="px-12 py-8 border-b border-current/5 flex items-center justify-between">
                  <div>
                    <h2 class="text-base tracking-[0.4em] opacity-80 dark:opacity-100 uppercase font-bold text-current drop-shadow-sm leading-relaxed">
                      Log of <br /> Temporal Existence
                    </h2>
                    <p class="text-sm italic opacity-50 dark:opacity-80 text-current mt-1 lowercase-serif tracking-widest drop-shadow-sm">Session Consistency & Focus Registry</p>
                  </div>
                  <div class="flex items-center space-x-12">
                     <div class="text-right">
                        <span class="block text-[10px] uppercase tracking-widest opacity-80 dark:opacity-100 text-current font-bold mb-1 drop-shadow-sm">Streak</span>
                        <div class="flex items-center justify-end space-x-2">
                          <span class="text-2xl font-serif italic text-current leading-none drop-shadow-sm dark:opacity-100">{{ currentStreak }}</span>
                          <div class="w-4 h-4 text-current opacity-60 dark:opacity-90">
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.66 11.2c-.23-.3-.51-.56-.77-.82-.67-.6-1.41-1.09-2.12-1.61.12-.07.26-.14.37-.24.58-.51.85-1.29.58-2.03-.1-.31-.24-.59-.47-.83-.84-.9-2.28-1-3.37-.36-.4.23-.74.55-.99.94C10.15 7.42 10.02 8.7 10.3 9.6c.03.11.05.21.05.33 0 .22-.19.43-.45.43-.13 0-.27-.06-.34-.14-.23-.27-.33-.63-.44-.98-.18-.58-.3-1.15-.36-1.74 0-.17-.02-.34-.14-.46-.07-.07-.12-.13-.19-.13-.08 0-.15.06-.21.12-.47.45-.8 1.01-1.01 1.62-.25.7-.35 1.5-.08 2.22.06.18.15.36.26.52.27.42.59.81.95 1.14.73.66 1.57 1.2 2.3 1.89.7.67 1.34 1.45 1.57 2.4.08.33.12.68.12 1.02 0 .61-.13 1.23-.41 1.77-.32.61-.83 1.1-1.4 1.44-.09.05-.18.1-.25.17-.14.12-.11.23-.05.33.26.43.68.74 1.14.88.59.18 1.23.16 1.83.02.6-.14 1.18-.46 1.62-.91.49-.49.88-1.06 1.13-1.7.27-.68.32-1.44.25-2.18-.04-.61-.19-1.22-.49-1.76-.3-.54-.69-1.02-1.12-1.46-.37-.4-.78-.77-1.18-1.14-.14-.14-.26-.29-.41-.42-.07-.07-.1-.13-.05-.22.12-.22.42-.25.56-.05.81.82 1.65 1.62 2.29 2.58.11.17.38.2.53.07.13-.1.17-.25.16-.4-.05-.44-.31-.83-.54-1.21z" /></svg>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>

                <div class="flex-grow scroll-minimal overflow-y-auto p-12 space-y-12">
                  <!-- Temporal Matrix (Heatmap) -->
                  <div>
                    <div class="flex justify-between items-center mb-6 border-b border-current/5 pb-2">
                      <span class="text-sm uppercase tracking-[0.2em] font-bold opacity-60 dark:opacity-90 text-current drop-shadow-sm">Historical Consistency Matrix</span>
                    </div>
                    
                    <div ref="heatmapContainer" class="overflow-x-auto pb-6 scrollbar-hide">
                      <div class="grid grid-flow-col grid-rows-7 gap-1.5 min-w-max">
                        <div 
                          v-for="cell in heatmapCells" 
                          :key="cell.date"
                          class="w-4 h-4 rounded-[1px] transition-all duration-1000 relative group/cell hover:z-50"
                          :class="[
                            cell.active 
                              ? 'bg-zinc-800 dark:bg-white/50 shadow-[0_0_12px_rgba(var(--text-primary-rgb),0.2)]' 
                              : 'bg-zinc-800/10 dark:bg-white/10 border border-zinc-800/5 dark:border-white/5 hover:bg-zinc-800/20 dark:hover:bg-white/20',
                            cell.isFuture ? 'opacity-[0.02]' : ''
                          ]"
                          @mouseenter="e => handleMouseEnter(e, cell)"
                          @mouseleave="handleMouseLeave"
                        >
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Journal of Intent (Action) -->
                  <div class="pt-8 border-t border-current/5 flex items-start space-x-12">
                    <div class="flex-grow">
                      <textarea
                        v-model="todaysNote"
                        rows="2"
                        placeholder="scribe today's objective into the void..."
                        class="w-full bg-transparent border-b border-zinc-800/10 dark:border-zinc-300/10 py-2 text-lg text-current placeholder:opacity-40 focus:outline-none focus:border-zinc-800/30 dark:focus:border-zinc-300/30 transition-colors resize-none italic font-serif"
                      ></textarea>
                      <div class="mt-4 flex items-center space-x-3 opacity-40 dark:opacity-70">
                        <svg viewBox="0 0 24 24" fill="currentColor" class="w-3 h-3"><path d="M12 2C9.243 2 7 4.243 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm11 13H4v-8h16v8zm-8-5a2 2 0 100 4 2 2 0 000-4z"/></svg>
                        <span class="text-xs uppercase tracking-[0.4em] font-bold">REIFICATION_LOG // ENCRYPTION: ACTIVE</span>
                      </div>
                    </div>

                    <div class="shrink-0 pt-2 h-full flex items-center">
                      <button 
                        @click="handleCheckIn"
                        :disabled="isSubmittingActivity || checkInUsedToday"
                        class="existence-button relative group/btn overflow-hidden h-14 min-w-[200px] rounded-none transition-all duration-700 transform active:scale-[0.98] disabled:opacity-30 border border-zinc-800/10 dark:border-white/20"
                        :class="[
                          checkInUsedToday 
                            ? 'is-active bg-zinc-800 dark:bg-white/50 text-white dark:text-black shadow-[0_0_20px_rgba(var(--text-primary-rgb),0.1)]' 
                            : 'bg-transparent hover:border-zinc-800 dark:hover:border-white/50'
                        ]"
                      >
                        <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800/40 dark:border-white/50 transition-all duration-500 group-hover/btn:w-4 group-hover/btn:h-4"></div>
                        <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-800/40 dark:border-white/50 transition-all duration-500 group-hover/btn:w-4 group-hover/btn:h-4"></div>
                        <div class="absolute top-1 right-2 text-[6px] font-mono opacity-20 dark:opacity-60 tracking-widest uppercase transition-opacity group-hover/btn:opacity-60">SEQ_0x4A</div>
                        <div class="relative z-10 flex items-center justify-center space-x-4">
                          <span v-if="isSubmittingActivity" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                          <template v-else>
                            <span class="text-[10px] uppercase tracking-[0.3em] font-bold transition-all duration-700 group-hover/btn:tracking-[0.5em]" :class="checkInUsedToday ? 'text-white dark:text-black' : 'text-zinc-800 dark:text-white/50'">
                              {{ checkInUsedToday ? 'Sequence Active' : 'Initiate Session' }}
                            </span>
                          </template>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- PAGE: Forum (Methodology Repository) -->
              <div v-show="activeTab === 'forum'" class="flex-grow flex flex-col min-w-0 h-full overflow-hidden">
                
                <!-- 1. Persistent Top Technical Rail (Disciplines) -->
                <div class="px-16 pt-2 pb-6 border-b border-current/10 bg-current/[0.01]">
                   <div class="flex items-stretch space-x-4 h-24">
                       <div v-for="(section, idx) in mainSections" :key="section.id" 
                            @mouseenter="hoveredSectionId = section.id" 
                            @mouseleave="hoveredSectionId = null"
                            @click="selectedSectionId = section.id; forumContext = 'navigator'"
                            class="group relative flex-grow cursor-pointer transition-all duration-300 px-6 flex flex-col justify-center border border-transparent overflow-hidden"
                            :class="selectedSectionId === section.id ? '' : 'hover:bg-current/[0.03]'">
                         
                         <!-- Nier Background Slide Wipe -->
                         <div class="absolute inset-0 bg-zinc-900 dark:bg-zinc-100 transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] origin-left"
                              :class="selectedSectionId === section.id ? 'translate-x-0' : '-translate-x-full'"></div>

                         <!-- Corner Brackets -->
                         <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-current/40 group-hover:border-white/50 transition-colors z-10"></div>
                         <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current/40 group-hover:border-white/50 transition-colors z-10"></div>

                         <div class="relative z-10 flex flex-col transition-colors duration-500"
                              :class="selectedSectionId === section.id ? 'text-zinc-50 dark:text-zinc-900' : ''">
                           <div class="flex items-center justify-between mb-1">
                             <span class="text-[7px] font-mono tracking-[0.4em] opacity-30">{{ getNierID(idx) }}</span>
                             <span class="text-[7px] font-mono tracking-[0.2em] opacity-40 uppercase">{{ getModuleStatus(section.id) }}</span>
                           </div>
                           <h3 class="text-[11px] font-serif italic tracking-widest uppercase transition-colors"
                               :class="[
                                 selectedSectionId === section.id ? 'text-white dark:text-black font-bold' : 'text-current/80 dark:text-white/90 group-hover:text-current'
                               ]">{{ section.shortLabel }}</h3>
                           <div class="mt-2 h-[1px] bg-current/10 relative overflow-hidden">
                             <div class="absolute inset-y-0 left-0 bg-current/40 transition-all duration-1000" :style="{ width: selectedSectionId === section.id ? '100%' : '0%' }"></div>
                           </div>
                         </div>
                       </div>
                      
                      <!-- Decorative System Status Node -->
                      <div class="w-32 flex flex-col justify-center px-4 border-l border-current/10 opacity-20">
                         <span class="text-[6px] font-mono tracking-[0.4em] uppercase mb-1">SYS_LOAD</span>
                         <div class="flex space-x-1 h-2 items-end">
                            <div v-for="i in 8" :key="i" class="flex-grow bg-current" :style="{ height: (30 + Math.random() * 70) + '%' }"></div>
                         </div>
                      </div>
                   </div>
                </div>

                <Transition name="page-reify" mode="out-in">
                  <!-- 2. Dynamic Forum Content Layer -->
                  <div v-if="forumContext === 'navigator'" key="navigator" class="flex-grow flex flex-col min-h-0 items-center justify-center py-6">
                    <div class="w-full max-w-6xl px-16 h-full min-h-[400px]">
                      
                      <Transition name="fade" mode="out-in">
                        <!-- STATE A: No Selection — Tactical Knowledge Grid -->
                        <div v-if="!selectedSectionId" key="feed" class="h-full flex flex-col min-h-[500px]">

                          <!-- Tactical Header -->
                          <div class="flex items-center justify-between mb-8 gap-6 border-b border-current/10 pb-6">
                            <div class="flex flex-col">
                              <div class="flex items-center space-x-3 mb-1">
                                <div class="w-1.5 h-1.5 bg-current animate-pulse"></div>
                                <h3 class="text-xl font-serif italic text-current opacity-90 tracking-tight">Knowledge_Matrix</h3>
                              </div>
                              <span class="text-[8px] font-mono opacity-30 tracking-[0.5em] uppercase">Protocol: Scan_Modular_Intelligence // {{ allThreads.length }} Nodes</span>
                            </div>
                            
                            <div class="flex items-center gap-6">
                              <div class="relative group">
                                <div class="absolute inset-0 bg-current/5 blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                                <input v-model="forumSearchQuery" type="text" placeholder="FILTER_NODES..."
                                       class="relative bg-transparent border-b border-current/20 text-[10px] font-mono tracking-[0.2em] text-current outline-none px-4 py-2 focus:border-current/60 transition-all w-64 placeholder:opacity-20 uppercase" />
                              </div>
                              <button @click="forumContext = 'create'" class="px-6 py-2.5 border border-current/40 hover:bg-current hover:text-white dark:hover:text-black transition-all text-[9px] tracking-[0.4em] uppercase font-bold relative group/forge">
                                <span class="relative z-10">Deploy_New_Node</span>
                                <div class="absolute inset-0 bg-current/5 translate-y-full group-hover/forge:translate-y-0 transition-transform"></div>
                              </button>
                            </div>
                          </div>

                          <!-- Card Grid -->
                          <div class="flex-grow overflow-y-auto scroll-minimal grid grid-cols-1 xl:grid-cols-2 gap-8 pb-12">
                            
                            <div v-for="(thread, index) in allThreads" :key="thread.id"
                                 @click="selectThread(thread.id); forumContext = 'view'"
                                 class="knowledge-card group relative flex flex-col border border-current/10 bg-current/[0.02] transition-all duration-500 hover:border-current/30 overflow-hidden"
                                 :class="[`mode-${thread.mode}`, { 'is-featured': index === 0 }]">
                              
                              <!-- Scanline overlay -->
                              <div class="absolute inset-0 scanlines opacity-[0.03] pointer-events-none"></div>
                              
                              <!-- Mode Indicator Top Bar -->
                              <div class="h-1 w-full bg-current/10 relative overflow-hidden">
                                <div class="absolute inset-y-0 left-0 bg-current transition-all duration-700" :style="{ width: '100%' }"></div>
                                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                              </div>

                              <div class="p-6 flex flex-col h-full space-y-6">
                                <!-- Top: Identity & Mode -->
                                <div class="flex justify-between items-start">
                                  <div class="flex flex-col">
                                    <div class="flex items-center space-x-3 mb-1">
                                      <span class="text-[7px] font-mono tracking-[0.5em] uppercase opacity-40">NODE_0x{{ thread.id.slice(0, 4) }}</span>
                                      <div class="w-1 h-1 rounded-full bg-current/30"></div>
                                      <span class="text-[7px] font-mono tracking-[0.5em] uppercase opacity-80" :class="getModeColor(thread.mode)">{{ thread.mode }}</span>
                                    </div>
                                    <h4 class="text-base font-serif italic text-current opacity-90 group-hover:opacity-100 transition-all leading-tight">
                                      {{ thread.title }}
                                    </h4>
                                  </div>
                                  <div class="flex flex-col items-end opacity-20 group-hover:opacity-60 transition-opacity">
                                    <span class="text-[6px] font-mono tracking-widest uppercase mb-1">Confidence</span>
                                    <div class="flex space-x-0.5">
                                      <div v-for="i in 5" :key="i" class="w-2 h-0.5 bg-current" :class="{ 'opacity-20': i > (thread.confidence || 3) }"></div>
                                    </div>
                                  </div>
                                </div>

                                <!-- Center: Modular Blocks (Dynamic Render) -->
                                <div class="flex-grow space-y-4">
                                  
                                  <!-- Setup Block: Visual Telemetry -->
                                  <div v-if="thread.mode === 'SETUP'" class="grid grid-cols-2 gap-4 bg-current/[0.03] p-4 border border-current/5">
                                    <div class="flex flex-col space-y-2">
                                      <span class="text-[6px] font-mono opacity-30 uppercase tracking-widest">Pricing_Target</span>
                                      <div class="flex items-baseline space-x-2">
                                        <span class="text-lg font-mono text-current">{{ thread.setupLevels?.tp || '0.0000' }}</span>
                                        <span class="text-[7px] font-mono text-emerald-500/60 uppercase">▲ Bullish</span>
                                      </div>
                                    </div>
                                    <div class="flex flex-col space-y-2 border-l border-current/5 pl-4">
                                      <span class="text-[6px] font-mono opacity-30 uppercase tracking-widest">Risk_Barrier</span>
                                      <div class="flex items-baseline space-x-2">
                                        <span class="text-lg font-mono text-current">{{ thread.setupLevels?.sl || '0.0000' }}</span>
                                        <span class="text-[7px] font-mono text-rose-500/60 uppercase">▼ Stop</span>
                                      </div>
                                    </div>
                                  </div>

                                  <!-- Research Block: Data Metrics -->
                                  <div v-if="thread.mode === 'RESEARCH'" class="space-y-3">
                                    <div class="flex justify-between items-center text-[8px] font-mono opacity-40 px-2">
                                      <span>Variable</span>
                                      <span>Correlation</span>
                                    </div>
                                    <div class="space-y-1.5">
                                      <div v-for="metric in thread.metrics" :key="metric.label" class="flex items-center justify-between bg-current/[0.03] px-3 py-1.5 border-l-2 border-current/20">
                                        <span class="text-[9px] italic font-serif opacity-70">{{ metric.label }}</span>
                                        <div class="flex items-center space-x-3">
                                          <div class="w-16 h-1 bg-current/10 relative overflow-hidden">
                                            <div class="absolute inset-y-0 left-0 bg-current/40" :style="{ width: metric.value + '%' }"></div>
                                          </div>
                                          <span class="text-[8px] font-mono opacity-50">{{ metric.value }}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <!-- Lesson Block: Step Progression -->
                                  <div v-if="thread.mode === 'LESSON'" class="flex items-center space-x-2 py-2 overflow-x-auto scrollbar-hide">
                                    <div v-for="(step, sIdx) in (thread.steps || [])" :key="sIdx" class="shrink-0 flex items-center space-x-2">
                                      <div class="w-8 h-8 rounded-full border border-current/20 flex items-center justify-center text-[10px] font-mono opacity-40">
                                        {{ sIdx + 1 }}
                                      </div>
                                      <div v-if="(thread.steps || []).length > 0 && sIdx < (thread.steps || []).length - 1" class="w-4 h-px bg-current/10"></div>
                                    </div>
                                    <div class="flex-grow pl-4">
                                      <span class="text-[9px] italic font-serif opacity-50 block leading-tight">Module Activity:</span>
                                      <span class="text-[10px] font-serif italic text-current opacity-80 decoration-current/20 underline underline-offset-4">{{ (thread.steps || [])[0] }}...</span>
                                    </div>
                                  </div>

                                  <!-- Thesis Summary (Common to all) -->
                                  <p v-if="thread.thesis_brief" class="text-[10px] font-serif italic text-current/60 line-clamp-2 leading-relaxed tracking-wide mt-2">
                                    "{{ thread.thesis_brief }}"
                                  </p>

                                </div>

                                <!-- Bottom: Ecosystem & Telemetry -->
                                <div class="flex items-center justify-between pt-4 border-t border-current/5">
                                  <div class="flex flex-wrap gap-2">
                                    <span v-for="tag in thread.tags?.slice(0, 3)" :key="tag" 
                                          class="text-[6px] font-mono tracking-[0.2em] uppercase border border-current/10 px-2 py-0.5 opacity-40 group-hover:opacity-80 transition-opacity">
                                      #{{ tag }}
                                    </span>
                                  </div>
                                  
                                  <div class="flex items-center space-x-6 shrink-0">
                                    <div class="flex items-center space-x-2 group-hover:translate-y-[-2px] transition-transform">
                                      <span class="text-xs font-serif italic opacity-40">{{ thread.likesCount || 0 }}</span>
                                      <svg class="w-3 h-3 opacity-20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                    </div>
                                    <div class="flex items-center space-x-2 group-hover:translate-x-[2px] transition-transform">
                                      <span class="text-[7px] font-mono opacity-20 tracking-widest uppercase">SCAN_ARC</span>
                                      <span class="text-base opacity-20">→</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <!-- Decorative HUD Corner -->
                              <div class="absolute bottom-1 right-1 opacity-[0.05] pointer-events-none transition-opacity group-hover:opacity-20">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke-width="1"/></svg>
                              </div>
                            </div>
                          </div>

                          <!-- Technical Stats Rail -->
                          <div class="flex items-center justify-between border-t border-current/10 pt-6 mt-auto">
                            <div class="flex space-x-12">
                              <div class="flex flex-col">
                                <span class="text-[6px] font-mono opacity-30 tracking-[0.5em] uppercase">Matrix_Throughput</span>
                                <span class="text-[10px] font-mono text-current opacity-70">4.2 TB/SEC // PEAK</span>
                              </div>
                              <div class="flex flex-col">
                                <span class="text-[6px] font-mono opacity-30 tracking-[0.5em] uppercase">Node_Stability</span>
                                <span class="text-[10px] font-mono text-emerald-500/60">OPERATIONAL // 99.8%</span>
                              </div>
                            </div>
                            <div class="flex space-x-1 items-end h-8">
                               <div v-for="i in 20" :key="i" class="w-1 bg-current opacity-10" :style="{ height: (30 + Math.random() * 70) + '%' }"></div>
                            </div>
                          </div>
                        </div>

                        <!-- STATE B: Discipline Selected (Category Nodes) -->
                        <div v-else key="nodes" class="h-full space-y-10 animate-nier-glitch">
                           <div class="border-l border-current/10 pl-8 space-y-2">
                             <div class="flex items-center space-x-4">
                               <div class="w-1 h-3 bg-current"></div>
                               <h3 class="text-2xl font-serif italic tracking-tight text-current opacity-90 uppercase">{{ mainSections.find(s => s.id === selectedSectionId)?.name }}</h3>
                             </div>
                             <p class="text-[9px] font-mono opacity-30 tracking-[0.4em] uppercase">{{ mainSections.find(s => s.id === selectedSectionId)?.desc }}</p>
                           </div>

                           <div class="grid grid-cols-2 gap-6 border-white/50">
                             <button v-for="cat in currentCategories" :key="cat.id"
                                     @click="handleCategorySelect(cat)"
                                     class="group relative p-8 border border-current/10 dark:border-white/50 bg-current/[0.01] hover:bg-current/[0.05] transition-all text-left flex flex-col justify-between h-40 overflow-hidden">
                               
                               <!-- Corner Brackets (Categories) -->
                               <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-current/30 group-hover:border-white/50 transition-colors"></div>
                               <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current/30 group-hover:border-white/50 transition-colors"></div>

                               <div class="relative z-10">
                                 <div class="flex items-center justify-between mb-4">
                                   <span class="text-[7px] font-mono opacity-20 tracking-widest uppercase">NODE_{{ cat.id.slice(0, 4).toUpperCase() }}</span>
                                   <div class="w-1 h-1 bg-current opacity-20 group-hover:opacity-100 transition-all"></div>
                                 </div>
                                 <h4 class="text-base font-serif italic text-current dark:text-white/90 group-hover:translate-x-1 transition-transform leading-snug">{{ cat.name }}</h4>
                                 <p class="text-[11px] opacity-100 text-current/50 dark:text-white/60 mt-2 font-serif italic line-clamp-2 leading-relaxed">{{ cat.desc }}</p>
                               </div>

                               <div class="relative z-10 flex items-end justify-between">
                                 <span class="text-[7px] font-mono opacity-20 tracking-[0.3em] uppercase group-hover:opacity-60 transition-opacity">ACCESS // LAYER_0x{{ cat.id.length }}</span>
                                 <span class="text-xl opacity-20 group-hover:opacity-100 transition-all">→</span>
                               </div>

                               <!-- Scanning Laser Effect -->
                               <div class="absolute inset-y-0 left-0 w-px bg-current shadow-[0_0_10px_currentColor] opacity-0 group-hover:opacity-40 group-hover:animate-scan-laser h-full"></div>
                             </button>
                           </div>
                        </div>
                      </Transition>
                    </div>
                  </div>

                  <!-- 3. Registry List View (Thin Strips) -->
                  <div v-else-if="forumContext === 'list'" key="list" class="flex flex-col h-full">
                    <!-- Navigation Tool-rail -->
                    <div class="px-12 py-6 border-b border-current/10 flex items-center justify-between bg-current/[0.01]">
                      <button @click="forumContext = 'navigator'" class="flex items-center space-x-4 text-current/40 hover:text-current transition-all group">
                        <span class="text-xl opacity-30 group-hover:-translate-x-1 transition-transform">←</span>
                        <span class="text-[10px] tracking-[0.4em] uppercase">Return_to_Nexus</span>
                      </button>
                      
                      <div class="flex items-center space-x-12">
                        <div class="flex flex-col items-end">
                          <span class="text-[7px] font-mono opacity-20 tracking-widest uppercase">Registry_Layer</span>
                          <span class="text-xs font-serif italic text-current opacity-80">{{ selectedCategory }}</span>
                        </div>
                        <div class="w-px h-8 bg-current/10"></div>
                        <div class="relative group min-w-[200px]">
                          <input v-model="forumSearchQuery" type="text" placeholder="FILTER_PARAM..." 
                                 class="w-full bg-transparent border-b border-current/10 text-[10px] font-mono py-1 px-4 text-current outline-none focus:border-current/40 transition-all placeholder:opacity-20 uppercase tracking-[0.2em]" />
                        </div>
                        <button @click="forumContext = 'create'" class="px-6 py-3 border border-current/10 bg-current/[0.02] hover:bg-current/10 transition-all text-[9px] tracking-[0.4em] uppercase font-bold relative overflow-hidden group/forge">
                           <span class="relative z-10 transition-colors group-hover/forge:text-current">Forge_Knowledge</span>
                           <div class="absolute inset-x-0 bottom-0 h-0 bg-current/5 group-hover/forge:h-full transition-all duration-300"></div>
                        </button>
                      </div>
                    </div>

                    <!-- Technical Strip Repository -->
                    <div class="flex-grow scroll-minimal overflow-y-auto p-12 space-y-3">
                      <div v-for="(thread, index) in filteredThreads" :key="thread.id"
                           @click="selectThread(thread.id)"
                           class="intel-strip group relative border border-current/[0.06] bg-current/[0.01] backdrop-blur-[1px] px-10 py-5 cursor-pointer transition-all duration-300 hover:bg-current/[0.04] hover:border-current/25 flex items-center justify-between overflow-hidden">
                        
                        <!-- Sharp Brackets for Strips -->
                        <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-current/20 group-hover:border-white/50 transition-colors"></div>
                        <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-current/20 group-hover:border-white/50 transition-colors"></div>

                        <div class="flex items-center space-x-10 flex-grow min-w-0">
                          <div class="w-[2px] h-6 transition-all duration-1000"
                               :class="[
                                 thread.status === 'refined' ? 'bg-zinc-800 dark:bg-white/50 shadow-[0_0_15px_rgba(var(--text-primary-rgb),0.6)]' :
                                 thread.status === 'contradicted' ? 'bg-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-current/10'
                               ]"></div>
                          <div class="flex flex-col">
                            <h3 class="text-sm font-serif italic text-current opacity-80 group-hover:opacity-100 transition-all font-medium truncate max-w-xl">{{ thread.title }}</h3>
                            <span class="text-[7px] font-mono opacity-15 tracking-[0.4em] uppercase mt-1 group-hover:opacity-40 transition-opacity">SEQ//0x{{ thread.id.slice(0, 4).toUpperCase() }}</span>
                          </div>
                        </div>

                        <div class="flex items-center space-x-16 shrink-0 relative z-10">
                          <div class="flex space-x-10">
                            <div class="text-right">
                              <span class="block text-[6px] uppercase tracking-widest opacity-20 mb-1 leading-none">Echoes</span>
                              <span class="text-xs font-serif italic opacity-40 group-hover:opacity-100 transition-opacity">{{ thread.repliesCount || 0 }}</span>
                            </div>
                            <div class="text-right">
                              <span class="block text-[6px] uppercase tracking-widest opacity-20 mb-1 leading-none">Affinity</span>
                              <span class="text-xs font-serif italic opacity-40 group-hover:opacity-100 transition-opacity">{{ thread.likesCount || 0 }}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-if="filteredThreads.length === 0" class="h-64 flex flex-col items-center justify-center opacity-10 italic">
                        <span class="text-[11px] tracking-[1em] uppercase font-mono">Registry_Empty // Waiting_for_Data...</span>
                      </div>
                    </div>
                  </div>

                  <!-- 3. Thread Reader View -->
                  <div v-else-if="forumContext === 'view' && selectedThread" key="thread-view" class="flex flex-col h-full bg-white/5 dark:bg-black/5">
                    <div class="px-12 py-6 border-b border-current/5 flex items-center justify-between bg-current/[0.02]">
                       <button @click="forumContext = 'list'" class="flex items-center space-x-3 text-current/40 hover:text-current transition-all group">
                         <span class="text-[9px] tracking-[0.4em] uppercase">← Back_to_Registry</span>
                       </button>
                       <div class="flex items-center space-x-6">
                         <button @click="handleToggleLike(selectedThread)" class="flex items-center space-x-2 px-4 py-1.5 border border-current/10 hover:border-current/30 transition-all rounded-none">
                            <svg class="w-3 h-3" :class="selectedThread?.likedByMe ? 'text-current' : 'opacity-40'" viewBox="0 0 24 24" :fill="selectedThread?.likedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                            <span class="text-[10px] uppercase tracking-widest">{{ (selectedThread as any).likesCount || 0 }}</span>
                         </button>
                       </div>
                    </div>

                    <div class="flex-grow overflow-y-auto scroll-minimal p-12 space-y-12">
                      <div class="space-y-6">
                        <h2 class="text-4xl font-serif italic text-current tracking-wide leading-tight mb-4 uppercase">{{ selectedThread?.title }}</h2>
                        <div class="flex items-center space-x-4 mb-10">
                           <div class="w-12 h-[1px] bg-current opacity-20"></div>
                           <span class="text-[7px] font-mono tracking-[0.6em] opacity-30 uppercase">Node_Authorization // Verified</span>
                        </div>

                        <!-- 🧩 DYNAMIC BLOCK RENDERER -->
                        <div class="space-y-12">
                          
                          <!-- A. Setup / Tactical Analysis Block -->
                          <div v-if="selectedThread?.mode === 'SETUP'" class="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div class="p-8 border border-current/10 bg-current/[0.03] space-y-6">
                                <span class="text-[8px] font-mono opacity-30 uppercase tracking-[0.4em]">Tactical_Parameters</span>
                                <div class="space-y-4">
                                   <div class="flex justify-between items-center pb-2 border-b border-current/5">
                                      <span class="text-xs font-serif italic opacity-60">Buy_Limit / Entry</span>
                                      <span class="text-xl font-mono">{{ selectedThread?.setupLevels?.tp || '2354.20' }}</span>
                                   </div>
                                   <div class="flex justify-between items-center pb-2 border-b border-current/5">
                                      <span class="text-xs font-serif italic opacity-60">Invalidation / Stop</span>
                                      <span class="text-xl font-mono text-rose-500/60">{{ selectedThread?.setupLevels?.sl || '2312.80' }}</span>
                                   </div>
                                </div>
                             </div>
                             <div class="p-8 border border-current/10 bg-current/[0.01] space-y-4 flex flex-col justify-center">
                                <span class="text-[8px] font-mono opacity-30 uppercase tracking-[0.4em]">Core_Thesis</span>
                                <p class="text-lg font-serif italic text-current/80 leading-relaxed">
                                   "{{ selectedThread?.thesis_brief }}"
                                </p>
                             </div>
                          </div>

                          <!-- B. Research / Data Analytics Block -->
                          <div v-if="selectedThread?.mode === 'RESEARCH'" class="space-y-8">
                             <div class="grid grid-cols-3 gap-6">
                                <div v-for="metric in selectedThread?.metrics || []" :key="metric.label" 
                                     class="p-6 border border-current/10 bg-current/[0.03] flex flex-col items-center justify-center space-y-2">
                                   <span class="text-[7px] font-mono opacity-30 uppercase tracking-widest">{{ metric.label }}</span>
                                   <span class="text-3xl font-serif italic">{{ metric.value }}%</span>
                                </div>
                             </div>
                             <div class="p-10 border border-current/5 bg-current/[0.01]">
                                <span class="text-[8px] font-mono opacity-30 uppercase tracking-[0.4em] block mb-6">Analytical_Conclusion</span>
                                <p class="text-base font-serif italic text-current/70 leading-loose max-w-3xl">
                                   {{ selectedThread?.thesis_brief }}
                                </p>
                             </div>
                          </div>

                          <!-- C. Lesson / Educational Block -->
                          <div v-if="selectedThread?.mode === 'LESSON'" class="space-y-16 py-8">
                             <div class="relative flex justify-between">
                                <div class="absolute top-1/2 left-0 w-full h-px bg-current/10 -translate-y-1/2"></div>
                                <div v-for="(step, sIdx) in (selectedThread?.steps || [])" :key="sIdx" 
                                     class="relative z-10 flex flex-col items-center space-y-4 group/step">
                                   <div class="w-14 h-14 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-lg font-mono shadow-xl transition-transform group-hover/step:scale-110">
                                      {{ Number(sIdx) + 1 }}
                                   </div>
                                   <span class="text-[9px] font-serif italic uppercase tracking-widest opacity-60">{{ step }}</span>
                                </div>
                             </div>
                             <div class="max-w-2xl mx-auto text-center space-y-6">
                                <div class="w-8 h-8 mx-auto border border-current/20 flex items-center justify-center">
                                   <div class="w-1 h-1 bg-current animate-pulse"></div>
                                </div>
                                <p class="text-xl font-serif italic text-current/80 leading-relaxed">
                                   "{{ selectedThread?.thesis_brief }}"
                                </p>
                             </div>
                          </div>

                          <!-- D. Standard Content (Compatibility) -->
                          <div v-if="!selectedThread?.mode" class="space-y-4">
                            <template v-for="(block, idx) in selectedThread?.thesis?.blocks || []" :key="idx">
                              <p v-if="'text' in block" class="text-sm font-serif leading-relaxed text-current/70 italic">
                                {{ (block as any).text }}
                              </p>
                            </template>
                          </div>

                        </div>
                      </div>

                      <!-- Commentary Layer -->
                      <div class="pt-12 border-t border-current/5 space-y-8">
                        <div class="flex items-center justify-between">
                          <span class="text-[9px] tracking-[0.4em] uppercase opacity-40">Methodology_Commentary</span>
                          <span class="text-[8px] font-mono opacity-20">{{ threadReplies.length }} OBJECTS</span>
                        </div>

                        <div class="space-y-8">
                          <div v-for="reply in threadReplies" :key="reply.id" class="p-6 bg-current/[0.01] border-l border-current/10 space-y-3">
                            <div class="flex justify-between items-center text-[8px] font-mono opacity-30">
                              <span>AUTHOR_{{ reply.authorId.slice(0, 6) }}</span>
                              <span>{{ normalizeDate(reply.createdAt).toLocaleDateString() }}</span>
                            </div>
                            <p class="text-xs font-serif italic text-current/80">
                              {{ 'text' in (reply.content.blocks[0] || {}) ? (reply.content.blocks[0] as any).text : '' }}
                            </p>
                          </div>
                        </div>

                        <!-- Reply Input -->
                        <div class="pt-8 space-y-4">
                          <textarea 
                            v-model="replyText"
                            placeholder="input commentary into the ledger..."
                            class="w-full bg-transparent border border-current/5 p-6 text-sm font-serif italic text-current outline-none focus:border-current/20 transition-all placeholder:opacity-20 resize-none h-24"
                          ></textarea>
                          <div class="flex justify-end">
                             <button @click="submitReply" class="px-8 py-3 bg-zinc-800 dark:bg-white/50 text-white dark:text-black text-[9px] tracking-[0.3em] uppercase font-bold hover:shadow-xl transition-all">
                                Commit_Commentary
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 4. Thread Creation View -->
                  <div v-else-if="forumContext === 'create'" key="forum-create" class="flex flex-col h-full bg-white/5 dark:bg-black/5">
                     <div class="px-12 py-8 border-b border-current/5 flex items-center justify-between">
                       <div>
                         <h2 class="text-base tracking-[0.4em] opacity-80 uppercase font-bold text-current">
                           Reification <br /> Forge
                         </h2>
                         <p class="text-[10px] italic opacity-50 text-current mt-1 lowercase-serif tracking-widest">Structuring Methodology for the Matrix</p>
                       </div>
                       <button @click="forumContext = 'list'" class="text-[9px] tracking-[0.4em] opacity-40 hover:opacity-100 uppercase">Cancel_Operation</button>
                    </div>

                    <div class="p-12 space-y-12 overflow-y-auto scroll-minimal">
                       <div class="space-y-8">
                          <div class="space-y-2">
                            <span class="text-[7px] text-current/30 font-mono tracking-[0.4em] uppercase">Knowledge_Title</span>
                            <input v-model="newThreadTitle" type="text" placeholder="Title your methodology..." class="w-full bg-transparent border-b border-current/10 py-4 text-2xl font-serif italic text-current outline-none focus:border-current/30 transition-all font-bold" />
                          </div>

                          <div class="grid grid-cols-2 gap-12">
                             <div class="space-y-2">
                                <span class="text-[7px] text-current/30 font-mono tracking-[0.4em] uppercase">Classification</span>
                                <select v-model="newThreadCategory" class="w-full bg-transparent border-b border-current/10 py-2 text-xs font-serif italic text-current outline-none focus:border-current/30 appearance-none">
                                  <option v-for="cat in forumCategoriesList" :key="cat" :value="cat">{{ cat }}</option>
                                </select>
                             </div>
                          </div>

                          <div class="space-y-2">
                             <span class="text-[7px] text-current/30 font-mono tracking-[0.4em] uppercase">Core_Thesis</span>
                             <textarea v-model="newThreadDesc" placeholder="Scribe your core thesis here..." class="w-full bg-transparent border border-current/5 p-8 text-base font-serif italic text-current outline-none focus:border-current/15 transition-all h-64 resize-none leading-relaxed"></textarea>
                          </div>
                       </div>

                       <div class="flex justify-center pt-8">
                          <button @click="submitThread" :disabled="isSubmittingThread" class="relative group/btn overflow-hidden h-16 min-w-[300px] border border-zinc-800 dark:border-white/50 bg-transparent transition-all">
                             <div class="absolute inset-0 bg-zinc-800 dark:bg-white/50 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500"></div>
                             <span class="relative z-10 text-[10px] tracking-[0.5em] uppercase font-bold group-hover/btn:text-white dark:group-hover/btn:text-black">
                               {{ isSubmittingThread ? 'REIFYING...' : 'FORGE_KNOWLEDGE_STRUCTURE' }}
                             </span>
                          </button>
                       </div>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- PAGE: Genesis (Magic-Tech Forge) -->
              <div v-show="activeTab === 'genesis'" class="h-full flex flex-col items-center justify-center space-y-12">
                <div class="relative group">
                  <div class="w-24 h-24 border border-current/10 flex items-center justify-center transition-all duration-700 group-hover:rotate-90 group-hover:scale-110">
                    <div class="w-12 h-12 border-2 border-current/5 animate-spin-slow"></div>
                    <div class="absolute inset-0 bg-gradient-radial from-current/5 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
                <div class="w-full max-w-md space-y-6 text-center">
                  <input type="text" placeholder="input sacred inquiry..." class="w-full bg-transparent border-b border-current/10 py-4 text-center font-serif italic text-xl outline-none focus:border-current/30 transition-all placeholder:opacity-20" />
                  <p class="text-[9px] tracking-[0.5em] opacity-20 uppercase font-bold text-current/80">forge new reification</p>
                </div>
                <div class="grid grid-cols-4 gap-4 w-full px-12 opacity-20 group-hover:opacity-40 transition-opacity">
                  <div v-for="i in 4" :key="i" class="h-[2px] bg-current/20"></div>
                </div>
              </div>

              <!-- PAGE: Matrix (Structural Dashboard) -->
              <div v-show="activeTab === 'matrix'" class="space-y-12 h-full flex flex-col">
                <div class="grid grid-cols-2 gap-8 grow">
                  <div v-for="i in 4" :key="i" class="p-6 border border-current/5 bg-current/[0.01] flex flex-col justify-between">
                    <div class="flex justify-between items-start">
                      <span class="text-[8px] opacity-20">NODE_{{ i }} : ACTIVE</span>
                      <div class="w-2 h-2 rounded-full" :class="i % 2 === 0 ? 'bg-[#C5A059]' : 'bg-current/20'"></div>
                    </div>
                    <div class="h-24 w-full relative flex items-end space-x-1">
                      <div v-for="j in 10" :key="j" class="flex-grow bg-current opacity-10 hover:bg-current/20 transition-all" :style="{ height: (20 + Math.random() * 80) + '%' }"></div>
                    </div>
                    <span class="text-[7px] text-right font-mono opacity-20 text-current">LOAD_0{{ i * 15 }}%</span>
                  </div>
                </div>
                <div class="h-16 border-t border-current/5 flex items-center justify-between px-4">
                  <span class="text-[9px] font-mono opacity-20 uppercase tracking-[0.4em]">SYSTEM_LOG: DATA_MATRIX_STABLE</span>
                  <div class="flex space-x-4">
                    <div v-for="i in 8" :key="i" class="w-1 h-3 bg-current/10 rounded-full" :class="{ 'animate-pulse': i % 3 === 0 }"></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </Transition>
    </main>


    <!-- Nier Footer: Status (Depth of Field Blur) -->
    <Transition name="slide-bottom" appear>
      <footer v-if="isAssembled" class="fixed bottom-0 left-0 right-0 z-40 px-16 py-12 blur-[1.5px] opacity-30 hover:blur-0 hover:opacity-100 transition-all duration-700">
        <div class="max-w-7xl mx-auto flex justify-between items-center text-[8px] font-mono tracking-[0.4em]">
          <div class="flex space-x-16 items-center">
            <span class="flex items-center space-x-2">
              <span class="w-2 h-2 border border-current/20 rotate-45"></span>
              <span>REIFICATION: STABLE</span>
            </span>
            <span class="opacity-40 italic">0x48.F7_SEQ // VOID_PROTOCOL</span>
          </div>
          <span>MANA_RESERVE: 98.4% [ + ]</span>
        </div>
      </footer>
    </Transition>
    <!-- Optical Vignette & Cinematic Focus Fall-off -->
    <div class="fixed inset-0 z-[80] pointer-events-none focus-mask transition-all duration-1000"></div>
    <div class="fixed inset-0 z-[81] pointer-events-none cinematic-vignette transition-all duration-1000"></div>

  </div>

<Teleport to="body">
  <div 
    v-if="tooltipState.show"
    class="sacred-tooltip fixed px-3 py-2 bg-black dark:bg-white/50 text-white dark:text-black text-[9px] italic font-serif rounded-sm pointer-events-none whitespace-nowrap uppercase tracking-[0.2em] shadow-2xl transition-all duration-300 z-[9999]"
    :style="{ 
      left: `${tooltipState.x}px`, 
      top: `${tooltipState.y}px`,
      transform: 'translate(-50%, -100%) translateY(-15px)'
    }"
  >
    {{ tooltipState.content }}
  </div>
</Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '~/entities/user/auth.store'
import { useForumStore } from '~/features/store/useForum'
import { useForumCategoryStore } from '~/features/store/useForumCategory'
import { normalizeDate } from '~/composables/normalizeDate'
import HeaderF from '~/widgets/header/ui/HeaderF.vue'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/shared/firebase.client'
import { likeThread, removeThreadLike, isThreadLikedByUser } from '~/entities/thread/model/likesManagement'

const auth = useAuthStore()
const forumCategory = useForumCategoryStore()
const forum = useForumStore()

const activeTab = ref('archive')
const isAssembled = ref(false)
const isTesseractEnabled = ref(true)

// Forum specific state
const forumContext = ref<'list' | 'view' | 'create' | 'navigator'>('navigator')
const selectedThreadId = ref<string | null>(null)
const forumSearchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const selectedSectionId = ref<string | null>(null)
const hoveredSectionId = ref<string | null>(null)

// Navigator Logic (Nier: Automata Technical HUD)
const mainSections = forumCategory.mainSections
const categories = forumCategory.categories

const getNierID = (index: number) => `MOD_[0${index + 1}]`
const getSystemLoad = () => `${Math.floor(Math.random() * 40) + 60}%`
const getModuleStatus = (id: string) => id === selectedSectionId.value ? 'REIFIED' : 'STANDBY'

const currentCategories = computed(() => {
  if (!selectedSectionId.value) return []
  return categories[selectedSectionId.value] || []
})

function handleCategorySelect(cat: {id: string, name: string}) {
  selectedCategory.value = cat.name
  forumContext.value = 'list'
}

const replyText = ref('')
const newThreadTitle = ref('')
const newThreadDesc = ref('')
const newThreadCategory = ref('METHODOLOGY')
const isSubmittingThread = ref(false)
const isSubmittingActivity = ref(false)

const showBloom = ref(true)
const isIdle = ref(false)
const isDark = ref(false)
let idleTimer: ReturnType<typeof setTimeout> | null = null

const activeUserId = computed(() => auth.user?.uid)
const activeUser = computed(() => activeUserId.value ? forum.users.get(activeUserId.value) : null)

const getTodayDateString = () => {
    const d = new Date()
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0] || ''
}

const todayStr = getTodayDateString()
const todaysNote = ref('')
const heatmapContainer = ref<HTMLElement | null>(null)

const tooltipState = ref({
    show: false,
    x: 0,
    y: 0,
    content: ''
})

const currentTimeReadout = ref("")
const updateTicker = () => {
    const now = new Date()
    const yr = now.getFullYear()
    const mo = String(now.getMonth() + 1).padStart(2, '0')
    const dy = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const mm = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')
    currentTimeReadout.value = `YR_${yr}.MO_${mo}.DY_${dy} // ${hh}:${mm}:${ss}`
}

let tickerTimer: ReturnType<typeof setInterval> | null = null

const handleMouseEnter = (event: MouseEvent, cell: any) => {
    const target = event.target as HTMLElement
    const rect = target.getBoundingClientRect()
    let statusText = cell.active ? 'Active Record' : 'Void'
    if (cell.isFuture) statusText = 'Temporal Unknown'

    tooltipState.value = {
        show: true,
        x: rect.left + rect.width / 2,
        y: rect.top,
        content: `${cell.label} • ${statusText}`
    }
}

const handleMouseLeave = () => {
    tooltipState.value.show = false
}

// Custom simple streak calculation for the UI
const calculateStreak = (activities: any[]) => {
  if (!activities.length) return 0
  const sorted = [...activities].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  let streak = 0
  let current = new Date()
  current.setHours(0,0,0,0)
  
  for (const act of sorted) {
    const actDate = new Date(act.date)
    actDate.setHours(0,0,0,0)
    const diff = (current.getTime() - actDate.getTime()) / (1000 * 60 * 60 * 24)
    if (diff <= 1) {
      streak++
      current = actDate
    } else break
  }
  return streak
}

const dailyActivityList = computed(() => activeUser.value?.dailyActivity || [])
const checkInUsedToday = computed(() => dailyActivityList.value.some((a: any) => a.date === todayStr))
const currentStreak = computed(() => calculateStreak(dailyActivityList.value))

const heatmapCells = computed(() => {
    const cells = []
    const now = new Date()
    const totalDays = 126 
    const dayOfWeek = now.getDay()
    const daysToEndOfWeek = 6 - dayOfWeek
    const totalVisible = totalDays + daysToEndOfWeek
    
    for (let i = totalVisible; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i + daysToEndOfWeek)
        const dateStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
        const isFuture = d > now
        const activity = !isFuture ? dailyActivityList.value.find((a: any) => a.date === dateStr) : null
        
        cells.push({
            date: dateStr,
            active: !!activity,
            isFuture,
            label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
        })
    }
    return cells
})

// Submission and Activity logic
const submitDailyActivity = async (userId: string, note: string, date: string) => {
  isSubmittingActivity.value = true
  try {
     // Mocking the update into the store as we don't have the specific composable here
     // In a real app this would call an API or update Firebase directly
     console.log('Submitting activity:', { userId, note, date })
  } finally {
     isSubmittingActivity.value = false
  }
}

const handleCheckIn = async () => {
    const userId = activeUserId.value
    if (!userId) return
    await submitDailyActivity(userId, todaysNote.value, todayStr)
}

// Forum Actions
const forumCategoriesList = computed(() => Object.values(forumCategory.categories).flat().map(c => c.name))

const allThreads = computed(() => {
    // FAKE THREADS WITH BLOCKS & MODES
    const fakeData = [
      {
        id: 'node_001',
        mode: 'SETUP',
        title: 'XAUUSD: Tactical Reversal at Liquidity Ceiling',
        category: 'Price Action',
        confidence: 4,
        setupLevels: { tp: '2354.20', sl: '2312.80' },
        thesis_brief: 'Price swept the monthly high before exhibiting a clear H1 Displacement. Expecting a run towards the bearish FVG.',
        tags: ['gold', 'liquidity', 'smc'],
        likesCount: 142,
        repliesCount: 24,
        lastActivityAt: new Date().toISOString()
      },
      {
        id: 'node_002',
        mode: 'RESEARCH',
        title: 'Model: Inverse Correlation of DXY vs BTC in Q2',
        category: 'Macroeconomics',
        confidence: 5,
        metrics: [
          { label: 'Pearson_R', value: 88 },
          { label: 'Alpha_Yield', value: 14 },
          { label: 'Volatility_Skew', value: 42 }
        ],
        thesis_brief: 'Exhaustive analysis of the dollar index relative to crypto assets. The 0.88 negative correlation is reaching critical extreme.',
        tags: ['macro', 'btc', 'dxy', 'data'],
        likesCount: 567,
        repliesCount: 89,
        lastActivityAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'node_003',
        mode: 'LESSON',
        title: 'Mastering the Silver Bullet: A 5-Step Protocol',
        category: 'Technical Analysis',
        confidence: 3,
        steps: ['Liquidity Hunt', 'Market Structure Shift', 'FVG Entry', 'Partial Take Profit', 'Runner Management'],
        thesis_brief: 'Visualizing the core ICT silver bullet concept in modular steps. No fluff, only mechanics.',
        tags: ['education', 'ict', 'algorithm'],
        likesCount: 89,
        repliesCount: 14,
        lastActivityAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'node_004',
        mode: 'QUESTION',
        title: 'Seeking Advice: Position Sizing in Volatility Regimes',
        category: 'Risk Management',
        confidence: 2,
        thesis_brief: 'Is there a formula to scale position size based on ATR that actually works during Fed announcements?',
        tags: ['risk', 'help', 'volatility'],
        likesCount: 34,
        repliesCount: 156,
        lastActivityAt: new Date(Date.now() - 86400000).toISOString()
      }
    ]

    let list = [...fakeData]
    if (forumSearchQuery.value) {
        const q = forumSearchQuery.value.toLowerCase()
        list = list.filter(t => t.title.toLowerCase().includes(q) || t.thesis_brief?.toLowerCase().includes(q))
    }
    return list.sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
})

const getModeColor = (mode: string) => {
  switch(mode) {
    case 'SETUP': return 'text-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
    case 'RESEARCH': return 'text-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
    case 'LESSON': return 'text-violet-500/80 shadow-[0_0_10px_rgba(139,92,246,0.3)]'
    case 'QUESTION': return 'text-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
    default: return 'text-current/40'
  }
}

const filteredThreads = computed(() => {
    let list = Array.from(forum.threads.values())
    if (forumSearchQuery.value) {
        const q = forumSearchQuery.value.toLowerCase()
        list = list.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    }
    if (selectedCategory.value) {
        list = list.filter(t => t.category === selectedCategory.value)
    }
    return list.sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime())
})

const selectedThread = computed(() => {
  const fake = allThreads.value.find(t => t.id === selectedThreadId.value)
  return (fake || (selectedThreadId.value ? forum.threads.get(selectedThreadId.value) : null)) as any
})
const threadReplies = computed(() => selectedThreadId.value ? (forum.replies.get(selectedThreadId.value) || []) : [])

const selectThread = async (id: string) => {
    selectedThreadId.value = id
    forumContext.value = 'view'
    await forum.fetchThread(id)
    await forum.fetchReplies(id)
}

const handleToggleLike = async (thread: any) => {
    if (!auth.user?.uid) return
    const isLiked = await isThreadLikedByUser(thread.id, auth.user.uid)
    if (isLiked) {
        await removeThreadLike(thread.id, auth.user.uid)
        thread.likesCount = (thread.likesCount || 1) - 1
    } else {
        await likeThread(thread.id, auth.user.uid)
        thread.likesCount = (thread.likesCount || 0) + 1
    }
}

const submitReply = async () => {
    if (!replyText.value || !selectedThreadId.value || !auth.user?.uid) return
    const replyData = {
        threadId: selectedThreadId.value,
        authorId: auth.user.uid,
        content: { blocks: [{ type: 'paragraph', text: replyText.value }] },
        createdAt: new Date().toISOString(),
        meaningful: true,
        type: 'data'
    }
    await addDoc(collection(db, 'replies'), {
        ...replyData,
        createdAt: serverTimestamp()
    })
    await forum.fetchReplies(selectedThreadId.value)
    replyText.value = ''
}

const submitThread = async () => {
    if (!newThreadTitle.value || !auth.user?.uid) return
    isSubmittingThread.value = true
    try {
        const threadData = {
            title: newThreadTitle.value,
            description: newThreadDesc.value,
            category: newThreadCategory.value,
            authorId: auth.user.uid,
            createdAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
            lastMeaningfulAt: new Date().toISOString(),
            repliesCount: 0,
            status: 'active',
            thesis: { blocks: [{ type: 'paragraph', text: newThreadDesc.value }] },
            likesCount: 0
        }
        const docRef = await addDoc(collection(db, 'threads'), {
            ...threadData,
            createdAt: serverTimestamp(),
            lastActivityAt: serverTimestamp(),
            lastMeaningfulAt: serverTimestamp()
        })
        await forum.addThread({ id: docRef.id, ...threadData } as any)
        newThreadTitle.value = ''
        newThreadDesc.value = ''
        forumContext.value = 'list'
    } finally {
        isSubmittingThread.value = false
    }
}
const initializeArchive = async () => {
    if (!activeUserId.value) return
    await forum.fetchUser(activeUserId.value)
    await forum.fetchThreadList()
    setTimeout(() => {
      if (heatmapContainer.value) {
        (heatmapContainer.value as HTMLElement).scrollLeft = (heatmapContainer.value as HTMLElement).scrollWidth
      }
    }, 500)
}

watch(activeUserId, (newVal) => {
    if (newVal) initializeArchive()
}, { immediate: true })

watch(isTesseractEnabled, (enabled) => {
    if (enabled) {
        nextTick(() => {
            if (tesseractCanvas.value) {
                ctx = tesseractCanvas.value.getContext('2d')
                handleResize()
                draw()
            }
        })
    } else {
        if (animationId) cancelAnimationFrame(animationId)
    }
})

// Tesseract & Idle Logic
// (Porting complete logic for 5D Tesseract)
const vertices: number[][] = []
for (let i = 0; i < 32; i++) {
  const v = []
  for (let j = 0; j < 5; j++) v.push((i & (1 << j)) ? 100 : -100)
  vertices.push(v)
}
const edges: number[][] = []
for (let i = 0; i < 32; i++) {
  for (let j = i + 1; j < 32; j++) {
    let diff = 0
    for (let k = 0; k < 5; k++) if ((i & (1 << k)) !== (j & (1 << k))) diff++
    if (diff === 1) edges.push([i, j])
  }
}
const angles = Array(10).fill(0).map(() => Math.random() * Math.PI * 2)
const speeds = Array(10).fill(0).map(() => (Math.random() - 0.5) * 0.01)

const rotate5D = (v: number[], planeIdx: number, angle: number) => {
  const p1 = [0, 0, 0, 0, 1, 1, 1, 2, 2, 3][planeIdx]!
  const p2 = [1, 2, 3, 4, 2, 3, 4, 3, 4, 4][planeIdx]!
  const v1 = v[p1]!, v2 = v[p2]!
  const cos = Math.cos(angle), sin = Math.sin(angle)
  const newV = [...v]
  newV[p1] = v1 * cos - v2 * sin
  newV[p2] = v1 * sin + v2 * cos
  return newV
}

const project = (v: number[], width: number, height: number) => {
  const d = 400
  const w1 = d / (d + v[4]!)
  let v4 = [v[0]! * w1, v[1]! * w1, v[2]! * w1, v[3]! * w1]
  const w2 = d / (d + v4[3]!)
  let v3 = [v4[0]! * w2, v4[1]! * w2, v4[2]! * w2]
  const w3 = d / (d + v3[2]!)
  return { x: v3[0]! * w3 + width / 2, y: v3[1]! * w3 + height / 2 }
}

const draw = () => {
  if (!ctx || !tesseractCanvas.value) return
  const { width, height } = tesseractCanvas.value
  ctx.clearRect(0, 0, width, height)
  const time = Date.now() * 0.0005
  for (let i = 0; i < 10; i++) angles[i] = (angles[i]!) + (speeds[i]!) * (1.2 + Math.sin(time * (i + 1) * 0.7) * 0.8)
  let currentVertices = vertices.map(v => {
    let rotated = v
    for (let i = 0; i < 10; i++) rotated = rotate5D(rotated, i, angles[i]!)
    const depth = ((rotated[2] ?? 0) + (rotated[3] ?? 0) + (rotated[4] ?? 0)) / 3
    const proj = project(rotated, width, height)
    return { ...proj, z: depth }
  })
  const strokeColor = isDark.value ? '255, 255, 255' : '44, 62, 80'
  edges.forEach(([i, j]) => {
    const v1 = currentVertices[i!]!, v2 = currentVertices[j!]!
    const avgZ = (v1.z + v2.z) / 2
    const opacity = 0.25 + (avgZ + 175) / 350 * 0.75
    if (ctx) {
      ctx.beginPath(); ctx.moveTo(v1.x, v1.y); ctx.lineTo(v2.x, v2.y)
      ctx.strokeStyle = `rgba(${strokeColor}, ${opacity})`; ctx.lineWidth = 0.8 + (avgZ + 175) / 350 * 1.2; ctx.stroke()
    }
  })
  animationId = requestAnimationFrame(draw)
}

const tesseractCanvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animationId: number | null = null

const handleResize = () => {
  if (tesseractCanvas.value) {
    tesseractCanvas.value.width = window.innerWidth
    tesseractCanvas.value.height = window.innerHeight
  }
}

const resetIdleTimer = () => {
  if (isIdle.value) isIdle.value = false
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => isIdle.value = true, 30000)
}

onMounted(() => {
  window.addEventListener('mousemove', resetIdleTimer)
  window.addEventListener('keydown', resetIdleTimer)
  resetIdleTimer()
  if (tesseractCanvas.value) ctx = tesseractCanvas.value.getContext('2d')
  window.addEventListener('resize', handleResize); handleResize(); draw()
  initializeArchive()
  updateTicker()
  tickerTimer = setInterval(updateTicker, 1000)
  setTimeout(() => { showBloom.value = false; setTimeout(() => isAssembled.value = true, 400) }, 1500)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', resetIdleTimer)
  window.removeEventListener('keydown', resetIdleTimer)
  if (idleTimer) clearTimeout(idleTimer)
  if (animationId) cancelAnimationFrame(animationId)
  if (tickerTimer) clearInterval(tickerTimer)
})

definePageMeta({ layout: false })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Noto+Sans+Runic&display=swap');

.ethereal-void {
  --bg-primary: #FFFFFF;
  --text-primary: #2C3E50;
  --text-secondary: rgba(44, 62, 80, 0.3);
  --border-primary: rgba(44, 62, 80, 0.1);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Cormorant Garamond', serif;
}

.ethereal-void h1, .ethereal-void h2, .ethereal-void h3, .ethereal-void h4 {
  color: inherit;
}

.ethereal-void.is-dark {
  --bg-primary: #000000;
  --text-primary: rgba(255, 255, 255, 0.5);
  --border-primary: rgba(255, 255, 255, 0.1);
}



.scanlines {
  background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.02) 50%);
  background-size: 100% 4px;
}

.dot-grid {
  background-image: radial-gradient(var(--text-primary) 0.5px, transparent 0.5px);
  background-size: 30px 30px;
}

.scroll-minimal::-webkit-scrollbar { display: none; }
.scroll-minimal { scrollbar-width: none; }

.page-reify-enter-active, .page-reify-leave-active {
  transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.page-reify-enter-from { opacity: 0; transform: scale(1.01); filter: blur(30px) brightness(1.5); }
.page-reify-leave-to { opacity: 0; transform: scale(0.99); filter: blur(15px) brightness(1.2); }

.fade-enter-active, .fade-leave-active { transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateX(10px); filter: blur(10px); }

/* Nier HUD Animations */
@keyframes scan-laser {
  0% { transform: translateX(0); opacity: 0; }
  10% { opacity: 0.6; }
  90% { opacity: 0.6; }
  100% { transform: translateX(100%); opacity: 0; }
}
.animate-scan-laser {
  width: 100% !important;
  animation: scan-laser 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}

@keyframes nier-glitch {
  0% { opacity: 1; transform: translateX(0); }
  10% { opacity: 0.8; transform: translateX(-2px); filter: hue-rotate(90deg); }
  20% { opacity: 1; transform: translateX(2px); filter: hue-rotate(0deg); }
  30% { opacity: 0.9; transform: translateX(-1px); }
  100% { opacity: 1; transform: translateX(0); }
}
.animate-nier-glitch {
  animation: nier-glitch 0.4s cubic-bezier(0.16, 1, 0.3, 1) once;
}

.animate-spin-slow { animation: spin 20s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.cinematic-vignette {
  background: radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.3) 100%);
  position: fixed; inset: 0; pointer-events: none;
}

.light-sweep {
  position: absolute; top: -100%; left: -50%; width: 20%; height: 300%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
  transform: rotate(-35deg);
  animation: sweep 10s linear infinite;
}
@keyframes sweep { from { transform: rotate(-35deg) translateX(-100%); } to { transform: rotate(-35deg) translateX(500%); } }

/* Tactical Knowledge Matrix - Advanced HUD Aesthetics */
.knowledge-matrix-grid {
  perspective: 1000px;
}

.knowledge-card {
  height: 400px;
  background: rgba(var(--text-primary-rgb), 0.03);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(var(--text-primary-rgb), 0.1);
  border-radius: 4px;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.knowledge-card:hover {
  transform: translateY(-8px) scale(1.02);
  background: rgba(var(--text-primary-rgb), 0.05);
  border-color: rgba(var(--text-primary-rgb), 0.3);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Holographic Edge Glow */
.knowledge-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid transparent;
  background: linear-gradient(135deg, rgba(var(--text-primary-rgb), 0.2), transparent) border-box;
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.knowledge-card:hover::after {
  opacity: 1;
}

/* Mode Specific HUD Accents */
.mode-SETUP { 
  border-left: 4px solid #10b981;
  box-shadow: -15px 0 30px -15px rgba(16, 185, 129, 0.2);
}
.mode-RESEARCH { 
  border-left: 4px solid #06b6d4;
  box-shadow: -15px 0 30px -15px rgba(6, 182, 212, 0.2);
}
.mode-LESSON { 
  border-left: 4px solid #8b5cf6;
  box-shadow: -15px 0 30px -15px rgba(139, 92, 246, 0.2);
}
.mode-QUESTION { 
  border-left: 4px solid #f59e0b;
  box-shadow: -15px 0 30px -15px rgba(245, 158, 11, 0.2);
}

/* Internal Block Styling */
.metric-bar-bg {
  background: rgba(var(--text-primary-rgb), 0.05);
}

.setup-block-grid {
  background: linear-gradient(to bottom right, rgba(var(--text-primary-rgb), 0.05), transparent);
}

/* Scannable Glitch Effect */
.knowledge-card:hover .scanlines {
  animation: scan-glitch 2s linear infinite;
  opacity: 0.1;
}

@keyframes scan-glitch {
  0% { transform: translateY(0); }
  50% { transform: translateY(2px); }
  100% { transform: translateY(0); }
}

.animate-shimmer {
  animation: shimmer 3s infinite linear;
}

@keyframes shimmer {
  0% { transform: translateX(-200%); }
  100% { transform: translateX(200%); }
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.thread-card {
  border-radius: 0;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.thread-card:hover {
  transform: translateX(3px);
  box-shadow: -3px 0 0 0 rgba(var(--text-primary-rgb), 0.15);
}

.shimmer-overlay {
  background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%);
  background-size: 200% 100%;
  animation: shimmer-sweep 1.5s ease-in-out infinite;
}
@keyframes shimmer-sweep {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

</style>