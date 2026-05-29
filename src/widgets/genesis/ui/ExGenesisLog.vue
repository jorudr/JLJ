<template>
  <div class="diary-3d-hub h-full w-full relative overflow-hidden bg-transparent text-white" ref="container">
    
    

    <div v-show="!showNodeMap" class="contents">

      <!-- CANVAS LAYER (Shared) -->
      <canvas v-show="viewType === 'cube'"
              ref="canvasRef"
              class="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-30"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
              @mouseleave="handleMouseUp"
              @dblclick="handleDoubleClick"
              @wheel="handleWheel">
      </canvas>

      <!-- CUBE LAYER (UI ONLY) -->
      <div v-if="viewType === 'cube'" class="w-full h-full absolute inset-0 transition-opacity duration-700 pointer-events-none opacity-100 z-40">
        
        <!-- HUD Telemetry -->
        <div class="absolute top-8 right-8 flex flex-col items-end space-y-1 opacity-20 pointer-events-none">
           <span class="text-[8px] font-mono tracking-widest uppercase text-slate-400">{{ t('genesis.virtualLog.cubeTelemetry') }}</span>
           <div class="h-px w-32 bg-slate-500/50"></div>
           <span class="text-[7px] font-mono tracking-widest uppercase text-slate-400">{{ t('genesis.virtualLog.facet') }}: {{ currentFace + 1 }} / {{ t('genesis.virtualLog.status') }}: {{ isTransitioning ? t('genesis.virtualLog.rotating') : t('genesis.virtualLog.locked') }}</span>
        </div>

        <!-- Facet Navigation -->
        <div v-if="activeFaceIndices.length > 1" class="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-6 pointer-events-auto">
           <div class="flex items-center space-x-12">
              <div class="flex flex-col items-center">
                 <div class="flex space-x-2 mt-2">
                    <div v-for="faceIdx in activeFaceIndices" :key="faceIdx"
                         class="w-1.5 h-1.5 border border-slate-500 transition-all rotate-45"
                         :class="faceIdx === currentFace ? 'bg-white border-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-transparent opacity-20'">
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <!-- LIST VIEW LAYER -->
      <div v-if="viewType === 'list'" class="absolute inset-0 z-40 flex flex-col overflow-hidden bg-white dark:bg-[#070707] backdrop-blur-3xl pointer-events-auto">
         <div class="w-full h-full overflow-y-auto custom-scrollbar px-12 md:px-24 py-24 md:py-32">
           <ExVerticalTradeList :trades="currentTrades" @open-note="handleOpenNote" />
         </div>
      </div>

      <!-- BOTTOM LEFT: VIEW TOGGLE -->
      <div class="absolute bottom-12 left-12 z-[10000] flex flex-col space-y-3 pointer-events-auto">
         <div class="flex items-center space-x-2 p-1.5 border border-black/10 dark:border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl relative">
            <!-- Brackets -->
            <div class="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-black/40 dark:border-white/40"></div>
            <div class="absolute -bottom-px -right-px w-1.5 h-1.5 border-b border-r border-black/40 dark:border-white/40"></div>

            <button @click="viewType = 'cube'" 
                    class="w-12 h-12 flex items-center justify-center transition-all duration-500 relative group overflow-hidden"
                    :class="viewType === 'cube' ? 'bg-black dark:bg-white shadow-[0_0_20px_rgba(0,0,0,0.1)]' : 'hover:bg-black/5 dark:hover:bg-white/5'">
               <div class="w-4 h-4 border-2 transition-all duration-700 relative flex items-center justify-center"
                    :class="viewType === 'cube' ? 'border-white dark:border-black rotate-[135deg] scale-110' : 'border-black/40 dark:border-white/40 group-hover:border-black dark:group-hover:border-white group-hover:rotate-45'">
                  <div class="w-1 h-1 bg-current rotate-45"></div>
               </div>
               <div v-if="viewType === 'cube'" class="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-black dark:bg-white opacity-50"></div>
            </button>

            <button @click="viewType = 'list'" 
                    class="w-12 h-12 flex items-center justify-center transition-all duration-500 relative group overflow-hidden"
                    :class="viewType === 'list' ? 'bg-black dark:bg-white shadow-[0_0_20px_rgba(0,0,0,0.1)]' : 'hover:bg-black/5 dark:hover:bg-white/5'">
               <div class="flex flex-col items-center space-y-1.5 transition-all duration-700"
                    :class="viewType === 'list' ? 'text-white dark:text-black scale-110' : 'text-black/40 dark:text-white/40 group-hover:text-black dark:group-hover:text-white group-hover:translate-y-[-1px]'">
                  <div class="w-5 h-[1.5px] bg-current"></div>
                  <div class="w-5 h-[1.5px] bg-current opacity-60"></div>
                  <div class="w-5 h-[1.5px] bg-current opacity-30"></div>
               </div>
               <div v-if="viewType === 'list'" class="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-black dark:bg-white opacity-50"></div>
            </button>
         </div>
      </div>
    </div>

    <!-- TACTICAL PROTOCOL INSIGHT (FIXED RIGHT - ARCHIVE) -->
    <Teleport to="body">
       <Transition name="panel-slide" mode="out-in">
          <div v-if="selectedTrade && !showExtraDetails && !showNodeMap" 
               key="trade-archive-insight"
               class="fixed right-12 top-1/2 -translate-y-1/2 w-[440px] z-[10005] transition-colors duration-500">
             
             <!-- CLOSE HANDLE (LEFT EDGE) -->
             <button @click="selectedTradeId = null"
                     class="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-40 bg-gray-100 dark:bg-[#070707] border-t border-l border-b border-black/20 dark:border-white/20 flex items-center justify-center group/close-tab cursor-pointer hover:bg-gray-200 dark:hover:bg-[#111] transition-colors">
               <div class="w-[1px] h-16 bg-black/10 dark:bg-white/10 group-hover/close-tab:bg-black/40 dark:group-hover/close-tab:bg-white/40 transition-all duration-300"></div>
               <span class="absolute text-[7px] font-mono tracking-[0.4em] uppercase text-black/10 dark:text-white/10 group-hover/close-tab:text-black/40 dark:group-hover/close-tab:text-white/40 -rotate-90 whitespace-nowrap">{{ t('genesis.virtualLog.closeArchive') }}</span>
             </button>
 
             <ExPanel 
               class="!bg-gray-50 dark:!bg-[#070707] !border-black/10 dark:!border-white/10 !shadow-[0_40px_100px_rgba(0,0,0,0.1)] dark:!shadow-[0_40px_100px_rgba(0,0,0,0.8)]"
               :title="t('genesis.virtualLog.archivalRecord')"
               :show-corners="true"
               variant="light"
             >
               <div class="flex flex-col space-y-6 p-6">
                 <div class="flex items-center space-x-6">
                   <div v-if="assetIcon" class="w-16 h-16 border border-black/10 dark:border-white/10 flex items-center justify-center bg-white p-2 shadow-inner">
                     <img :src="assetIcon" class="w-full h-full object-contain" />
                   </div>
                   <div v-else class="w-16 h-16 border border-black/10 dark:border-white/10 flex items-center justify-center bg-black/5 dark:bg-white/5 shadow-inner">
                     <span class="text-2xl font-black opacity-20 font-mono text-black dark:text-white">{{ selectedTrade?.asset?.slice(0, 1) }}</span>
                   </div>
                   <div class="flex flex-col">
                     <span class="text-[8px] font-mono opacity-40 uppercase tracking-[0.5em] text-black dark:text-white">{{ t('genesis.virtualLog.assetIdentifier') }}</span>
                     <h3 class="text-3xl font-light font-serif tracking-[0.2em] uppercase text-black dark:text-white mt-1 leading-none">
                       {{ selectedTrade?.asset }}
                     </h3>
                   </div>
                 </div>
                  <div class="h-px w-full bg-gradient-to-r from-black/10 via-transparent to-transparent dark:from-white/10"></div>

                  <!-- TACTICAL DATA GRID -->
                  <div class="grid grid-cols-2 gap-x-8 gap-y-8 px-6 pb-6 mt-4">
                    <!-- ENTRY -->
                    <div class="flex flex-col">
                      <span class="text-[8px] font-mono opacity-40 uppercase tracking-[0.4em] text-black dark:text-white">{{ t('genesis.virtualLog.entryPrice') }}</span>
                      <span class="text-xl font-mono font-bold text-black dark:text-white mt-2 leading-none">{{ selectedTrade?.entry }}</span>
                      <span class="text-[12px] font-mono opacity-50 text-black dark:text-white mt-2 leading-tight uppercase">{{ formatFullDate(selectedTrade?.date).replace('\n', ' // ') }}</span>
                    </div>

                    <!-- EXIT -->
                    <div class="flex flex-col">
                      <span class="text-[8px] font-mono opacity-40 uppercase tracking-[0.4em] text-black dark:text-white">{{ t('genesis.virtualLog.exitPrice') }}</span>
                      <span class="text-xl font-mono font-bold text-black dark:text-white mt-2 leading-none">{{ selectedTrade?.exit }}</span>
                      <span class="text-[12px] font-mono opacity-50 text-black dark:text-white mt-2 leading-tight uppercase">{{ formatFullDate(selectedTrade?.dateExit).replace('\n', ' // ') }}</span>
                    </div>

                    <!-- RISK MANAGEMENT -->
                    <div class="flex flex-col pt-4 border-t border-black/5 dark:border-white/5">
                      <span class="text-[8px] font-mono opacity-40 uppercase tracking-[0.4em] text-black dark:text-white">{{ t('genesis.virtualLog.riskExposure') }}</span>
                      <div class="flex flex-col mt-2 space-y-2">
                        <div class="flex items-baseline justify-between">
                          <span class="text-[8px] font-mono opacity-30 text-black dark:text-white uppercase">{{ t('genesis.virtualLog.stopLoss') }}</span>
                          <span class="text-sm font-mono font-bold text-black dark:text-white tracking-widest">{{ selectedTrade?.stopLoss }}</span>
                        </div>
                        <div class="flex items-baseline justify-between">
                          <span class="text-[8px] font-mono opacity-30 text-black dark:text-white uppercase">{{ t('genesis.virtualLog.takeProfit') }}</span>
                          <span class="text-sm font-mono font-bold text-black dark:text-white tracking-widest">{{ selectedTrade?.takeProfit }}</span>
                        </div>
                      </div>
                    </div>

                    <!-- PERFORMANCE -->
                    <div class="flex flex-col pt-4 border-t border-black/5 dark:border-white/5">
                      <span class="text-[8px] font-mono opacity-40 uppercase tracking-[0.4em] text-black dark:text-white">{{ t('genesis.virtualLog.tradeMetrics') }}</span>
                      <div class="flex flex-col mt-2 space-y-2">
                         <div class="flex items-baseline justify-between">
                           <span class="text-[8px] font-mono opacity-30 text-black dark:text-white uppercase">{{ t('genesis.virtualLog.rrRatio') }}</span>
                           <span class="text-sm font-mono font-bold text-black dark:text-white tracking-widest">1:{{ calculateRR(selectedTrade) }}</span>
                         </div>
                         <div class="flex items-baseline justify-between">
                           <span class="text-[8px] font-mono opacity-30 text-black dark:text-white uppercase">{{ t('genesis.virtualLog.duration') }}</span>
                           <span class="text-sm font-mono font-bold text-black dark:text-white tracking-widest">{{ calculateDuration(selectedTrade) }}</span>
                         </div>
                      </div>
                    </div>

                    <!-- COMMISSIONS -->
                    <div class="flex flex-col pt-4 border-t border-black/5 dark:border-white/5 col-span-2" v-if="selectedTrade?.entryFee || selectedTrade?.exitFee">
                      <span class="text-[8px] font-mono opacity-40 uppercase tracking-[0.4em] text-black dark:text-white">{{ locale === 'ru' ? 'КОМИССИИ' : 'COMMISSIONS' }}</span>
                      <div class="flex mt-2 space-x-8">
                         <div class="flex flex-col flex-1 space-y-1">
                            <span class="text-[8px] font-mono opacity-30 text-black dark:text-white uppercase">{{ locale === 'ru' ? 'ВХОДНАЯ' : 'ENTRY' }}</span>
                            <span class="text-sm font-mono font-bold text-amber-500/80 tracking-widest">{{ getEntryFeeDisplay(selectedTrade) }}</span>
                         </div>
                         <div class="flex flex-col flex-1 space-y-1">
                            <span class="text-[8px] font-mono opacity-30 text-black dark:text-white uppercase">{{ locale === 'ru' ? 'ВЫХОДНАЯ' : 'EXIT' }}</span>
                            <span class="text-sm font-mono font-bold text-amber-500/80 tracking-widest">{{ getExitFeeDisplay(selectedTrade) }}</span>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
                <template #footer>
                  <ExButton 
                    variant="ghost" 
                    class="w-full" 
                    @click="showNodeMap = true"
                  >
                     {{ t('genesis.virtualLog.showDetails') }}
                  </ExButton>
                </template>
              </ExPanel>
          </div>
       </Transition>
    </Teleport>
    
    <!-- NODE MAP VISUALIZATION OVERLAY -->
    <ExTacticalNodeMap 
      v-if="showNodeMap" 
      :is-open="showNodeMap" 
      :trade="mappedTradeForAnalysis"
      :is-dark="isDark"
      :initial-page="panelInitialPage"
      :initial-expanded-note-id="panelInitialNoteId"
      :open-analytics-on-mount="showExtraDetails"
      @close="showNodeMap = false; showExtraDetails = false" 
    />


    <!-- BOTTOM CENTER: PHANTOM PROTOCOL SELECT -->
    <div v-if="!showNodeMap" class="absolute bottom-8 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center pointer-events-none opacity-10 hover:opacity-100 transition-all duration-700">
       
       <!-- The Dropdown Menu -->
       <Transition name="protocol-slide">
         <div v-if="showStrategyMenu" class="relative mb-6 w-80 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border border-black/20 dark:border-white/20 shadow-[0_-30px_60px_rgba(0,0,0,0.4)] z-[200] overflow-hidden pointer-events-auto">
            <!-- Corner Brackets -->
            <div class="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-black dark:border-white opacity-40"></div>
            <div class="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-black dark:border-white opacity-40"></div>
            
            <!-- Header Registry -->
            <div class="flex items-center justify-between px-6 py-3 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
               <div class="flex items-center space-x-3">
                  <div class="w-1 h-1 bg-black dark:bg-white rotate-45"></div>
                  <span class="text-[8px] font-mono tracking-[0.4em] uppercase font-black text-black dark:text-white">{{ t('genesis.virtualLog.registryIndex') }}</span>
               </div>
               <span class="text-[7px] font-mono opacity-30 uppercase tracking-widest">{{ strategies.length }}_{{ t('genesis.virtualLog.protocols') }}</span>
            </div>

            <div class="max-h-80 overflow-y-auto custom-scrollbar py-2">
               <div v-for="s in strategies" :key="s.id" 
                    @click.stop="selectStrategy(s.id)" 
                    class="group/item relative px-8 py-4 cursor-pointer transition-all duration-300"
                    :class="selectedStrategyId === s.id ? 'bg-black dark:bg-white' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.03]'">
                  
                  <div v-if="selectedStrategyId === s.id" class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white dark:bg-black rotate-45 ml-4"></div>
                  
                  <span class="relative z-10 text-[10px] font-mono tracking-[0.3em] uppercase font-bold transition-colors duration-300"
                        :class="selectedStrategyId === s.id ? 'text-white dark:text-black' : 'text-black/50 dark:text-white/50 group-hover/item:text-black dark:group-hover/item:text-white'">
                     {{ s.name }}
                  </span>
                  <div class="absolute bottom-0 left-0 h-px bg-black dark:bg-white w-0 group-hover/item:w-full transition-all duration-500 opacity-20"></div>
               </div>
            </div>
         </div>
       </Transition>

       <!-- The Pagination + Protocol Select Button Row -->
       <div class="flex items-center space-x-4">
          <!-- Left Pagination Arrow -->
          <button @click="prevCubePage" class="w-12 h-12 bg-white/5 dark:bg-black/5 border border-black/10 dark:border-white/10 flex items-center justify-center backdrop-blur-md pointer-events-auto cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all group/arrow relative">
             <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-black/30 dark:border-white/30"></div>
             <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-black/30 dark:border-white/30"></div>
             <div class="w-2 h-2 border-t-2 border-l-2 border-black dark:border-white -rotate-45 group-hover/arrow:-translate-x-0.5 transition-transform"></div>
          </button>

          <!-- The Button -->
          <div class="flex items-center space-x-6 px-8 py-4 bg-white/5 dark:bg-black/5 border border-black/10 dark:border-white/10 relative group/hud backdrop-blur-md pointer-events-auto cursor-pointer"
               @click="showStrategyMenu = !showStrategyMenu">
             <!-- Corner Decor -->
             <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-black/30 dark:border-white/30"></div>
             <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-black/30 dark:border-white/30"></div>

             <div class="flex flex-col min-w-[220px] py-1">
                <span class="text-[7px] font-mono opacity-50 uppercase tracking-[0.5em] font-bold text-black dark:text-white">{{ t('genesis.virtualLog.systemProtocolSelect') }}</span>
                <div class="flex items-center justify-between mt-1">
                   <div class="flex items-center gap-3">
                      <div class="w-1.5 h-1.5 bg-black dark:bg-white rotate-45 animate-pulse"></div>
                      <span class="text-[11px] font-mono tracking-[0.3em] uppercase font-black leading-tight text-black dark:text-white" :class="isMatrixLoading ? 'animate-pulse' : ''">
                        {{ isMatrixLoading ? t('genesis.virtualLog.loadingProtocol') : selectedStrategyLabel }}
                      </span>
                   </div>
                   <div class="w-2 h-2 border-b-2 border-r-2 border-black/60 dark:border-white/60 rotate-45 ml-4 transition-transform duration-500" :class="showStrategyMenu ? '-rotate-[135deg] translate-y-1' : ''"></div>
                </div>
             </div>
          </div>

          <!-- Right Pagination Arrow -->
          <button @click="nextCubePage" class="w-12 h-12 bg-white/5 dark:bg-black/5 border border-black/10 dark:border-white/10 flex items-center justify-center backdrop-blur-md pointer-events-auto cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all group/arrow relative">
             <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-black/30 dark:border-white/30"></div>
             <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-black/30 dark:border-white/30"></div>
             <div class="w-2 h-2 border-t-2 border-r-2 border-black dark:border-white rotate-45 group-hover/arrow:translate-x-0.5 transition-transform"></div>
          </button>
       </div>
    </div>
  </div>

  <Transition name="page-reify">
     <ExTradeEntry v-if="isTradeEntryOpen" 
                   class="absolute inset-0 z-[1000]"
                   @close="isTradeEntryOpen = false" 
                   @addTrade="isTradeEntryOpen = false" />
  </Transition>

  <Teleport to="body">
    <Transition name="protocol-slide">
      <div v-if="isTemporalOpen" 
           class="fixed inset-0 z-[2000] flex items-center justify-center p-20 bg-black/40 dark:bg-black/80 backdrop-blur-md">
        <div class="relative w-full max-w-4xl bg-white dark:bg-black border border-black/40 dark:border-white/40 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto">
          
          <div class="flex items-center justify-between px-10 py-6 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
            <div class="flex items-center gap-4">
              <div class="w-2 h-2 bg-black dark:bg-white rotate-45"></div>
              <span class="text-xs uppercase tracking-[0.8em] font-black font-mono text-black dark:text-white">{{ t('genesis.virtualLog.temporalMatrixProtocol') }}</span>
            </div>

            <button @click="isTemporalOpen = false" 
                    class="group relative px-8 py-2 bg-black/5 dark:bg-white/5 border border-black/20 dark:border-white/20 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all duration-300 cursor-pointer font-mono font-bold">
              <span class="text-[9px] font-black uppercase tracking-[0.4em]">{{ t('genesis.virtualLog.accept') }}</span>
            </button>
          </div>

          <div class="grid grid-cols-2 divide-x divide-black/10 dark:divide-white/10 h-[450px]">
            <div class="flex flex-col p-10 gap-8 justify-center items-center">
              <div class="flex flex-col items-center gap-4 text-center max-w-xs">
                <div class="w-8 h-8 border border-black/20 dark:border-white/20 flex items-center justify-center rotate-45 mb-4">
                  <div class="w-2 h-2 bg-black dark:bg-white animate-pulse"></div>
                </div>
                <span class="text-xs uppercase tracking-widest font-mono font-bold text-black dark:text-white">{{ t('genesis.virtualLog.customTemporalLock') }}</span>
                <p class="text-[10px] font-mono text-black/40 dark:text-white/40 tracking-wider mb-4 leading-relaxed">
                  {{ t('genesis.virtualLog.temporalDescription') }}
                </p>
                <button @click="customDate = new Date(); syncTempParts()" 
                        class="w-full py-3 border border-black/10 dark:border-white/10 text-[9px] uppercase tracking-widest text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/10 font-mono cursor-pointer font-bold transition-all shadow-sm">
                  {{ t('genesis.virtualLog.syncToCurrentSystemTime') }}
                </button>
              </div>
            </div>

            <div class="flex flex-col p-10 justify-center">
              <div class="flex flex-col items-center gap-10 font-mono">
                <div class="flex items-center gap-4">
                  <div v-for="unit in ['day', 'month', 'year']" :key="unit" class="flex flex-col items-center gap-2">
                    <button @click="adjustDate(activeTemporalTarget, unit, 1); syncTempParts()" class="p-2 opacity-20 hover:opacity-100 transition-opacity cursor-pointer"><div class="w-4 h-px bg-black dark:bg-white"></div></button>
                    <input v-model="tempDateParts[unit as any]"
                           :maxlength="unit === 'year' ? 4 : 2"
                           @input="e => handleManualDate(activeTemporalTarget, unit, (e.target as any).value)"
                           class="w-24 bg-transparent text-center outline-none text-4xl font-mono font-bold tracking-tighter text-black dark:text-white" />
                    <button @click="adjustDate(activeTemporalTarget, unit, -1); syncTempParts()" class="p-2 opacity-20 hover:opacity-100 transition-opacity cursor-pointer"><div class="w-4 h-px bg-black dark:bg-white"></div></button>
                    <span class="text-[7px] uppercase tracking-widest text-black/40 dark:text-white/40">{{ translateTemporalUnit(unit) }}</span>
                  </div>
                </div>

                <div class="w-20 h-px bg-black/10 dark:bg-white/10"></div>

                <div class="flex items-center gap-6">
                  <div v-for="unit in ['hour', 'minute']" :key="unit" class="flex flex-col items-center gap-2">
                    <button @click="adjustDate(activeTemporalTarget, unit, 1); syncTempParts()" class="p-2 opacity-20 hover:opacity-100 transition-opacity cursor-pointer"><div class="w-4 h-px bg-black dark:bg-white"></div></button>
                    <input v-model="tempDateParts[unit as any]"
                           maxlength="2"
                           @input="e => handleManualDate(activeTemporalTarget, unit, (e.target as any).value)"
                           class="w-20 bg-transparent text-center outline-none text-4xl font-mono font-bold tracking-widest text-black dark:text-white" />
                    <button @click="adjustDate(activeTemporalTarget, unit, -1); syncTempParts()" class="p-2 opacity-20 hover:opacity-100 transition-opacity cursor-pointer"><div class="w-4 h-px bg-black dark:bg-white"></div></button>
                    <span class="text-[7px] uppercase tracking-widest text-black/40 dark:text-white/40">{{ translateTemporalUnit(unit) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, computed, watch } from 'vue'
import { useStrategyTradesStore } from '~/features/store/useStrategyTrades'
import { loadFromDisk } from '~/shared/diskStorage'
import { useThemeStore } from '~/features/store/useTheme'
import ExPanel from '~/shared/ui/ExPanel.vue'
import ExGothicCorners from '~/shared/ui/ExGothicCorners.vue'
import ExButton from '~/shared/ui/ExButton.vue'
import { calculateTacticalHistory } from '~/shared/utils/tacticalHistory'
import ExTradeAnalysisPanel from '~/widgets/genesis/ui/ExTradeAnalysisPanel.vue'
import globalAssets from '~/shared/data/global_assets.json'
import { getIconForAsset } from '~/shared/api/asset.service'
import ExTacticalNodeMap from '~/widgets/genesis/ui/ExTacticalNodeMap.vue'
import ExTradeEntry from '~/widgets/genesis/ui/ExTradeEntry.vue'
import ExVerticalTradeList from '~/widgets/genesis/ui/ExVerticalTradeList.vue'
import { useI18n } from '~/shared/i18n/useI18n'

const emit = defineEmits(['exit', 'nodeMapState'])

const themeStore = useThemeStore()
const isDark = computed(() => themeStore?.settings?.isDark ?? false)
const { t, locale } = useI18n()

const viewType = ref<'cube' | 'list'>('cube')
const selectedTradeId = ref<string | null>(null)
const showExtraDetails = ref(false)
const panelInitialPage = ref<number | undefined>(undefined)
const panelInitialNoteId = ref<string | undefined>(undefined)
const showNodeMap = ref(false)
const isTradeEntryOpen = ref(false)
const showAssetMenu = ref(false)

const handleOpenNote = (payload: { tradeId: string; noteId: string }) => {
   viewType.value = 'cube'
   selectedTradeId.value = payload.tradeId
   panelInitialPage.value = 5
   panelInitialNoteId.value = payload.noteId
   showExtraDetails.value = true
   showNodeMap.value = true
}

watch(showNodeMap, (val) => {
  emit('nodeMapState', val)
})

const formatFullDate = (d: any) => {
  if (!d) return t('genesis.virtualLog.notAvailable')
  const date = new Date(d)
  const datePart = date.toLocaleDateString(locale.value === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
  const timePart = date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  })
  return `${datePart}\n${timePart}`
}

const translateTemporalUnit = (unit: string) => t(`genesis.virtualLog.units.${unit}`)


const currentTrades = computed(() => {
  return tradeStore.getTradesForStrategy(selectedStrategyId.value)
})

const calculateRR = (trade: any) => {
  if (!trade || !trade.entry || !trade.stopLoss || !trade.takeProfit) return '0.00'
  const entry = +trade.entry
  const sl = +trade.stopLoss
  const tp = +trade.takeProfit
  const risk = Math.abs(entry - sl)
  const reward = Math.abs(tp - entry)
  if (risk === 0) return '∞'
  return (reward / risk).toFixed(2)
}

const getEntryFeeDisplay = (trade: any) => {
  if (!trade || (!trade.entryFee && trade.entryFee !== 0)) return '0.00$'
  if (trade.feeType === '%') {
    return ((+trade.entry * +trade.entryFee) / 100).toFixed(2) + '$'
  }
  return (+trade.entryFee).toFixed(2) + '$'
}

const getExitFeeDisplay = (trade: any) => {
  if (!trade || (!trade.exitFee && trade.exitFee !== 0)) return '0.00$'
  if (trade.feeType === '%') {
    return ((+trade.exit * +trade.exitFee) / 100).toFixed(2) + '$'
  }
  return (+trade.exitFee).toFixed(2) + '$'
}

const calculateDuration = (trade: any) => {
  if (!trade || !trade.date || !trade.dateExit) return t('genesis.virtualLog.notAvailable')
  const start = new Date(trade.date).getTime()
  const end = new Date(trade.dateExit).getTime()
  const diff = end - start
  if (diff < 0) return '0M'
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}D ${hours % 24}H`
  if (hours > 0) return `${hours}H ${minutes % 60}M`
  return `${minutes}M`
}

const filterSide = ref<'ALL' | 'Long' | 'Short'>('ALL')
const filterAsset = ref<string>('ALL')
const filterPnL = ref<'ALL' | 'PROFIT' | 'LOSS'>('ALL')
const filterRR = ref<'ALL' | '> 2R' | '> 3R' | '< 1R'>('ALL')
const filterDate = ref<'ALL' | 'TODAY' | '7D' | '30D' | 'CUSTOM'>('ALL')
const filterTime = ref<'ALL' | 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'CUSTOM'>('ALL')
const searchQuery = ref<string>('')

// Temporal Filter State
const customDate = ref(new Date())
const isTemporalOpen = ref(false)
const activeTemporalTarget = ref('open') // Reused for modal title/mode consistency
const tempDateParts = ref<Record<string, string>>({ day: '01', month: '01', year: '2024', hour: '00', minute: '00' })

const formatPart = (date: any, unit: string) => {
  const d = new Date(date)
  if (unit === 'year') return d.getFullYear()
  if (unit === 'month') return (d.getMonth() + 1).toString().padStart(2, '0')
  if (unit === 'day') return d.getDate().toString().padStart(2, '0')
  if (unit === 'hour') return d.getHours().toString().padStart(2, '0')
  if (unit === 'minute') return d.getMinutes().toString().padStart(2, '0')
  return ''
}

const syncTempParts = () => {
  const d = customDate.value
  const parts: Record<string, string> = {
    day: formatPart(d, 'day') as string,
    month: formatPart(d, 'month') as string,
    year: formatPart(d, 'year').toString(),
    hour: formatPart(d, 'hour') as string,
    minute: formatPart(d, 'minute') as string
  }
  Object.keys(parts).forEach(k => {
    if (parseInt(tempDateParts.value[k]!) !== parseInt(parts[k]!)) {
      tempDateParts.value[k] = parts[k]!
    }
  })
}

const openTemporal = (target = 'open') => {
  activeTemporalTarget.value = target
  syncTempParts()
  isTemporalOpen.value = true
}

const adjustDate = (target: string, unit: string, delta: number) => {
  const d = new Date(customDate.value)
  if (unit === 'year') d.setFullYear(d.getFullYear() + delta)
  if (unit === 'month') {
    let m = d.getMonth() + delta
    if (m > 11) m = 0
    if (m < 0) m = 11
    const currentDay = d.getDate()
    d.setDate(1)
    d.setMonth(m)
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    d.setDate(Math.min(currentDay, lastDay))
  }
  if (unit === 'day') {
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    let day = d.getDate() + delta
    if (day > lastDay) day = 1
    if (day < 1) day = lastDay
    d.setDate(day)
  }
  if (unit === 'hour') {
    let h = d.getHours() + delta
    if (h > 23) h = 0
    if (h < 0) h = 23
    d.setHours(h)
  }
  if (unit === 'minute') {
    let m = d.getMinutes() + delta
    if (m > 59) m = 0
    if (m < 0) m = 59
    d.setMinutes(m)
  }
  customDate.value = new Date(d)
  syncTempParts()
}

const handleManualDate = (target: string, unit: string, val: string) => {
  let processedVal = val
  let v = parseInt(val)

  if (!isNaN(v)) {
    if (unit === 'month') {
      if (v > 12) { v = 12; processedVal = '12' }
    }
    if (unit === 'day') {
      const p = tempDateParts.value as any
      const year = parseInt(p.year) || new Date().getFullYear()
      const month = parseInt(p.month) || 1
      const lastDay = new Date(year, month, 0).getDate()
      if (v > lastDay) { v = lastDay; processedVal = lastDay.toString().padStart(2, '0') }
    }
    if (unit === 'hour') { if (v > 23) { v = 23; processedVal = '23' } }
    if (unit === 'minute') { if (v > 59) { v = 59; processedVal = '59' } }
  }

  (tempDateParts.value as any)[unit] = processedVal
  
  const p = tempDateParts.value as any
  const year = parseInt(p.year)
  const month = parseInt(p.month)
  const day = parseInt(p.day)
  const hour = parseInt(p.hour)
  const minute = parseInt(p.minute)
  
  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) return
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) return

  const d = new Date(year, month - 1, 1, hour, minute)
  const lastDay = new Date(year, month, 0).getDate()
  d.setDate(Math.min(day, lastDay))

  customDate.value = d
}

const availableAssets = computed(() => {
  const assets = new Set(currentTrades.value.map(t => t.asset).filter((a): a is string => Boolean(a)))
  return ['ALL', ...Array.from(assets)]
})

const filteredTrades = computed(() => {
  return currentTrades.value.filter(t => {
    // Side Filter
    if (filterSide.value !== 'ALL' && t.side !== filterSide.value) return false
    
    // Asset Filter
    if (filterAsset.value !== 'ALL' && t.asset !== filterAsset.value) return false
    
    // PnL Filter
    const pnl = t.profitInCurrency || 0
    if (filterPnL.value === 'PROFIT' && pnl < 0) return false
    if (filterPnL.value === 'LOSS' && pnl >= 0) return false

    // R:R Filter
    if (filterRR.value !== 'ALL') {
      const rrVal = parseFloat(calculateRR(t))
      if (!isNaN(rrVal)) {
        if (filterRR.value === '> 2R' && rrVal <= 2) return false
        if (filterRR.value === '> 3R' && rrVal <= 3) return false
        if (filterRR.value === '< 1R' && rrVal >= 1) return false
      } else {
        return false
      }
    }

    // Date Horizon Filter
    if (filterDate.value !== 'ALL') {
      if (!t.date) return false
      const tradeDate = new Date(t.date)
      if (filterDate.value === 'CUSTOM') {
        const custom = customDate.value
        if (tradeDate.getFullYear() !== custom.getFullYear() ||
            tradeDate.getMonth() !== custom.getMonth() ||
            tradeDate.getDate() !== custom.getDate()) {
          return false
        }
      } else {
        const now = new Date()
        const diffTime = now.getTime() - tradeDate.getTime()
        const diffDays = diffTime / (1000 * 3600 * 24)
        
        if (filterDate.value === 'TODAY' && diffDays > 1) return false
        if (filterDate.value === '7D' && diffDays > 7) return false
        if (filterDate.value === '30D' && diffDays > 30) return false
      }
    }

    // Time of Day Filter (based on execution hour)
    if (filterTime.value !== 'ALL') {
      if (!t.date) return false
      const hour = new Date(t.date).getHours()
      if (filterTime.value === 'CUSTOM') {
        const customHour = customDate.value.getHours()
        if (hour !== customHour) return false
      } else {
        if (filterTime.value === 'MORNING' && (hour < 6 || hour >= 12)) return false
        if (filterTime.value === 'AFTERNOON' && (hour < 12 || hour >= 18)) return false
        if (filterTime.value === 'NIGHT' && (hour >= 6 && hour < 18)) return false
      }
    }

    // Search Query
    if (searchQuery.value.trim() !== '') {
      const q = searchQuery.value.toLowerCase()
      const assetMatch = (t.asset || '').toLowerCase().includes(q)
      const notesMatch = (t.notes || '').toLowerCase().includes(q)
      if (!assetMatch && !notesMatch) return false
    }

    return true
  })
})

const hasActiveFilters = computed(() => {
  return filterSide.value !== 'ALL' || 
         filterAsset.value !== 'ALL' || 
         filterPnL.value !== 'ALL' || 
         filterRR.value !== 'ALL' || 
         filterDate.value !== 'ALL' || 
         filterTime.value !== 'ALL' || 
         searchQuery.value.trim() !== ''
})

const resetAllFilters = () => {
  filterSide.value = 'ALL'
  filterAsset.value = 'ALL'
  filterPnL.value = 'ALL'
  filterRR.value = 'ALL'
  filterDate.value = 'ALL'
  filterTime.value = 'ALL'
  searchQuery.value = ''
}

const selectedTrade = computed(() => {
  if (!selectedTradeId.value) return null
  return currentTrades.value.find(t => t.id === selectedTradeId.value) || null
})

const assetIcon = computed(() => {
  const trade = selectedTrade.value
  if (!trade) return null
  
  const assetName = trade.asset || ""
  const assetData = (globalAssets as any[]).find(a => 
    a.symbol.toUpperCase() === assetName.toUpperCase() ||
    a.name.toUpperCase() === assetName.toUpperCase()
  )
  
  if (assetData?.icon) return assetData.icon
  return getIconForAsset(assetName, trade.assetType || 'Crypto')
})

// --- 3D MATH TYPES --- //
interface Point3D { x: number; y: number; z: number }
interface Point2D { x: number; y: number; opacity: number; depth: number }

interface TradeNode {
  id: string
  label: string
  faceIndex: number
  localPos: { x: number; y: number } // -100 to 100
  worldPos: Point3D
  neighbors?: number[]
  date?: string | Date
  isNote?: boolean
  parentId?: string
}

// --- STATE --- //
const canvasRef = ref<HTMLCanvasElement | null>(null)
const currentFace = ref(0)
const isTransitioning = ref(false)

// Cube rotation state
const targetRotation = ref({ x: 0, y: 0 }) 
const currentRotation = ref({ x: 0, y: 0 })

// Trade mapping
const facesTrades = ref<TradeNode[][]>([[], [], [], [], [], []])
const internalNodes = ref<TradeNode[]>([])

const revealProgress = ref(0)
const tradeStore = useStrategyTradesStore()
const selectedStrategyId = computed({
  get: () => tradeStore.selectedStrategyId,
  set: (val) => { tradeStore.selectedStrategyId = val }
})

const formatCubeTradeAssetLabel = (asset?: string) => {
  return String(asset || '').toUpperCase()
}

const matrixNodes = shallowRef<any[]>([])
const matrixConnections = shallowRef<any[]>([])
const isMatrixLoading = ref(true)
const showStrategyMenu = ref(false)

const getStats = (id: string, allTrades: any[]) => {
  const presentIn = allTrades.filter(tr => 
    tr.boardScenarioEntry?.id === id || 
    tr.boardScenarioExit?.id === id ||
    tr.boardConditions?.some((c: any) => (typeof c === 'string' ? c === id : c.id === id)) ||
    tr.boardScenarioEntry?.info?.conditions?.some((c: any) => c.id === id) ||
    tr.boardScenarioExit?.info?.conditions?.some((c: any) => c.id === id) ||
    (tr.emotions && Array.isArray(tr.emotions) && tr.emotions.includes(id))
  )
  const count = presentIn.length
  const freq = allTrades.length > 0 ? count / allTrades.length : 0
  
  let gProf = 0, gLoss = 0
  presentIn.forEach(tr => {
    const p = tr.profitInCurrency || 0
    if (p > 0) gProf += p
    else gLoss += Math.abs(p)
  })
  const pf = gLoss === 0 ? (gProf > 0 ? 5.0 : 1.0) : gProf / gLoss
  return { freq, pf }
}

const getHistory = (id: string, allTrades: any[]) => {
  return calculateTacticalHistory(id, allTrades)
}




const loadMatrixData = async () => {
  isMatrixLoading.value = true
  try {
    const data = await loadFromDisk('genesis_matrix_v2') as any
    if (data) {
      const allNodes: any[] = []
      const allConns: any[] = []
      
      const flatten = (nodesList: any[], connsList: any[]) => {
        nodesList.forEach(n => {
          allNodes.push(n)
          if (n.subGraph) {
            flatten(n.subGraph.nodes || [], n.subGraph.connections || [])
          }
        })
        connsList.forEach(c => allConns.push(c))
      }
      
      flatten(data.nodes || [], data.connections || [])
      
      matrixNodes.value = allNodes
      matrixConnections.value = allConns
    }
  } catch (err) {
    console.error('Failed to load matrix data:', err)
  } finally {
    isMatrixLoading.value = false
  }
}

const selectStrategy = (id: string) => {
  selectedStrategyId.value = id
  showStrategyMenu.value = false
  
  // Find style node recursively in flattened data
  const findStyleRecursive = (targetId: string, depth: number): any => {
    if (depth > 3) return null
    const directConnections = matrixConnections.value.filter(c => c.fromId === targetId)
    const connectedNodes = directConnections.map(c => matrixNodes.value.find(n => n.id === c.toId)).filter(Boolean)
    
    const styleNode = connectedNodes.find(n => 
      (n.type === 'risk-element' && n.params?.riskType === 'style') || 
      (n.label && n.label.toLowerCase().includes('style'))
    )
    if (styleNode) return styleNode
    
    for (const node of connectedNodes) {
      const result = findStyleRecursive(node.id, depth + 1)
      if (result) return result
    }
    return null
  }

  const styleNode = findStyleRecursive(id, 0)
  console.log(`[GENESIS_LOG] Protocol Selection: ${id} | Resolved Trading Style: ${styleNode?.label || 'UNDEFINED'}`)
}

const strategies = computed(() => tradeStore.strategies)
const selectedStrategy = computed(() => {
  return tradeStore.strategies.find(s => s.id === selectedStrategyId.value) || tradeStore.strategies[0] || { id: 'MAIN_DIARY', name: 'MAIN_DIARY' }
})
const selectedStrategyLabel = computed(() => {
  const name = selectedStrategy.value?.name || 'MAIN_DIARY'
  return name === 'MAIN_DIARY' ? t('genesis.virtualLog.mainDiary') : name
})

const mappedTradeForAnalysis = computed(() => {
  const t = selectedTrade.value as any
  if (!t) return undefined
  
  const allTrades = currentTrades.value
  const totalCount = allTrades.length

  // Calculate Percentile Rank (PnL based)
  const allPnls = allTrades.map(tr => tr.profitInCurrency || 0).sort((a, b) => a - b)
  const currentPnl = t.profitInCurrency || 0
  const lowerPnls = allPnls.filter(p => p < currentPnl).length
  const percentileRank = totalCount > 0 ? Math.round((lowerPnls / totalCount) * 100) : 0

  return {
    ...t,
    percentileRank,
    pnl: t.profitInCurrency || 0,
    scenarios: [
      ...(t.boardScenarioEntry ? [{ ...t.boardScenarioEntry, type: 'entry' }] : []),
      ...(t.boardScenarioExit ? [{ ...t.boardScenarioExit, type: 'exit' }] : [])
    ].map(s => {
      const sStats = getStats(s.id, allTrades)
      const sHistory = getHistory(s.id, allTrades)
      return {
        id: s.id,
        name: (s as any).info?.name || 'Unknown Protocol',
        type: (s as any).type as 'entry' | 'exit',
        frequency: sStats.freq,
        profitability: sStats.pf,
        history: sHistory,
        conditions: ((s as any).info?.conditions || []).map((c: any) => {
          const cId = typeof c === 'object' ? c.id : String(c)
          const cStats = getStats(cId, allTrades)
          const cHistory = getHistory(cId, allTrades)
          return {
            id: cId,
            name: typeof c === 'object' ? c.info?.name : String(c),
            frequency: cStats.freq,
            profitability: cStats.pf,
            history: cHistory
          }
        })
      }
    }),
    emotions: (t.emotions || []).map((name: string) => {
      const stats = getStats(name, allTrades)
      const history = getHistory(name, allTrades)
      return {
        name,
        frequency: stats.freq,
        profitability: stats.pf,
        history
      }
    }),
    rr: +calculateRR(t)
  }
})

const handleRemoveTrade = async (tradeId: string) => {
  if (!selectedStrategyId.value) return
  await tradeStore.removeTrade(selectedStrategyId.value, tradeId)
  if (selectedTradeId.value === tradeId) {
    selectedTradeId.value = null
  }
}

watch([matrixNodes, () => tradeStore.isLoading], ([nodes, loading]) => {
  if (loading) return
  const cores = (nodes as any[])
    .filter(n => n.type === 'strategy' || n.type === 'system')
    .map(n => ({
      id: n.id,
      name: (n.params?.customName || n.label).toUpperCase()
    }))
  tradeStore.syncStrategies(cores)
}, { immediate: true, deep: true })

const activeFaceIndices = computed(() => {
  return facesTrades.value
    .map((face, index) => face.some(n => !n.id.startsWith('ghost_')) ? index : -1)
    .filter(index => index !== -1)
})


// Immediate update when trades are added, strategy changes, or filters are modified
watch([selectedStrategyId, filteredTrades], () => {
  initTrades()
}, { deep: true })

const viewScale = ref(2.2) 
const isPanning = ref(false)
const draggedNode = ref<TradeNode | null>(null)
const lastMousePos = ref({ x: 0, y: 0 })
const viewOffset = ref({ x: 0, y: 0 })

// --- INITIALIZATION --- //
const calculateWorldPos = (faceIndex: number, localX: number, localY: number): Point3D => {
  const S = 100
  switch(faceIndex) {
    case 0: return { x: localX, y: localY, z: -S } // Front
    case 1: return { x: S, y: localY, z: localX }  // Right
    case 2: return { x: -localX, y: localY, z: S } // Back
    case 3: return { x: -S, y: localY, z: -localX } // Left
    case 4: return { x: localX, y: -S, z: localY } // Top
    case 5: return { x: localX, y: S, z: -localY } // Bottom
    default: return { x: 0, y: 0, z: 0 }
  }
}

const switchFace = (newIndex: number) => {
  currentFace.value = newIndex
  isTransitioning.value = true
  
  const orientation = ((newIndex % 6) + 6) % 6
  switch(orientation) {
    case 0: targetRotation.value.x = 0; targetRotation.value.y = 0; break;
    case 1: targetRotation.value.x = 0; targetRotation.value.y = Math.PI / 2; break;
    case 2: targetRotation.value.x = 0; targetRotation.value.y = Math.PI; break;
    case 3: targetRotation.value.x = 0; targetRotation.value.y = -Math.PI / 2; break;
    case 4: targetRotation.value.x = Math.PI / 2; targetRotation.value.y = 0; break;
    case 5: targetRotation.value.x = -Math.PI / 2; targetRotation.value.y = 0; break;
  }
  
  setTimeout(() => { isTransitioning.value = false }, 800)
}

const prevCubePage = () => {
  const totalPages = facesTrades.value.length || 1
  const newIndex = (currentFace.value - 1 + totalPages) % totalPages
  switchFace(newIndex)
}

const nextCubePage = () => {
  const totalPages = facesTrades.value.length || 1
  const newIndex = (currentFace.value + 1) % totalPages
  switchFace(newIndex)
}

const initTrades = () => {
  // --- CUBE INITIALIZATION --- //
  const tradesForCube = [...filteredTrades.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  // Build pages based on the 30-node maximum limit rule
  const cubePages: any[][] = []
  let currentCubePageTrades: any[] = []
  let currentNodeCount = 0

  for (const t of tradesForCube) {
    const noteCount = t.notesList ? t.notesList.length : 0
    const nodesForTrade = 1 + noteCount

    currentCubePageTrades.push(t)
    currentNodeCount += nodesForTrade

    if (currentNodeCount >= 30) {
      cubePages.push(currentCubePageTrades)
      currentCubePageTrades = []
      currentNodeCount = 0
    }
  }
  if (currentCubePageTrades.length > 0) {
    cubePages.push(currentCubePageTrades)
  }
  if (cubePages.length === 0) {
    cubePages.push([])
  }

  facesTrades.value = []
  cubePages.forEach((realTradesForThisFace, i) => {
    const nodes: TradeNode[] = []
    
    realTradesForThisFace.forEach((t) => {
      let localX = 0
      let localY = 0
      let attempts = 0
      const minDistance = 25

      while (attempts < 100) {
         localX = (Math.random() - 0.5) * 160
         localY = (Math.random() - 0.5) * 160
         
         let collision = false
         for (const existingNode of nodes) {
            const dist = Math.sqrt((localX - existingNode.localPos.x) ** 2 + (localY - existingNode.localPos.y) ** 2)
            if (dist < minDistance) {
               collision = true
               break
            }
         }
         
         if (!collision) break
         attempts++
      }

      nodes.push({
        id: t.id!,
        label: `${formatCubeTradeAssetLabel(t.asset)} [${(t.profitInCurrency ?? 0) >= 0 ? '+' : ''}${t.profitInCurrency ?? 0}$]`,
        faceIndex: i,
        localPos: { x: localX, y: localY },
        worldPos: calculateWorldPos(i, localX, localY),
        date: t.date,
        isNote: false
      })

      // Add child nodes for notes
      if (t.notesList && t.notesList.length > 0) {
        t.notesList.forEach((note: any, noteIdx: number) => {
          const offsetRadius = 25 + Math.random() * 10
          const angle = (Math.PI * 2 / t.notesList!.length) * noteIdx
          
          const nLocalX = localX + Math.cos(angle) * offsetRadius
          const nLocalY = localY + Math.sin(angle) * offsetRadius

          nodes.push({
             id: `note_${t.id}_${note.id}`,
             label: note.title || 'POST_MORTEM',
             faceIndex: i,
             localPos: { x: nLocalX, y: nLocalY },
             worldPos: calculateWorldPos(i, nLocalX, nLocalY),
             isNote: true,
             parentId: t.id
          })
        })
      }
    })

    facesTrades.value[i] = nodes
  })

  // --- INTERNAL NEURAL CORE NETWORK --- //
  const innerNodes: TradeNode[] = []
  for (let i = 0; i < 60; i++) {
    const rx = (Math.random() - 0.5) * 140
    const ry = (Math.random() - 0.5) * 140
    const rz = (Math.random() - 0.5) * 140
    innerNodes.push({
      id: `inner_${i}`,
      label: `CORE_VULT_${i}`,
      faceIndex: -1,
      localPos: { x: 0, y: 0 },
      worldPos: { x: rx, y: ry, z: rz },
      neighbors: []
    })
  }

  innerNodes.forEach((node, i) => {
    const distances = innerNodes
      .map((other, idx) => ({ 
        idx, 
        dist: i === idx ? Infinity : Math.sqrt(
          (node.worldPos.x - other.worldPos.x)**2 + 
          (node.worldPos.y - other.worldPos.y)**2 + 
          (node.worldPos.z - other.worldPos.z)**2
        ) 
      }))
      .sort((a, b) => a.dist - b.dist)
    node.neighbors = distances.slice(0, 3).map(d => d.idx)
  })
  
  internalNodes.value = innerNodes



  if (activeFaceIndices.value.length > 0 && !activeFaceIndices.value.includes(currentFace.value)) {
    currentFace.value = activeFaceIndices.value[0]!
    switchFace(currentFace.value)
  }
}

// --- 3D ENGINE --- //
const rotateX = (p: Point3D, angle: number): Point3D => {
  const cos = Math.cos(angle), sin = Math.sin(angle)
  return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos }
}

const rotateY = (p: Point3D, angle: number): Point3D => {
  const cos = Math.cos(angle), sin = Math.sin(angle)
  return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos }
}

const project = (p: Point3D, width: number, height: number): Point2D => {
  const focalLength = 1000
  const z = Math.max(-999, p.z)
  const scale = focalLength / (focalLength + z)
  return {
    x: p.x * scale + width / 2 + viewOffset.value.x,
    y: p.y * scale + height / 2 + viewOffset.value.y,
    opacity: Math.max(0.1, (1000 - z) / 1500),
    depth: p.z
  }
}

const navigateFace = (dir: number) => {
  if (isTransitioning.value || activeFaceIndices.value.length === 0) return
  const currentIndex = activeFaceIndices.value.indexOf(currentFace.value)
  const nextIndex = (currentIndex + dir + activeFaceIndices.value.length) % activeFaceIndices.value.length
  switchFace(activeFaceIndices.value[nextIndex]!)
}

// Extract expensive path computation out of RAF loop
const chronologicalPathNodes = computed(() => {
  const currentTrades = tradeStore.getTradesForStrategy(selectedStrategyId.value)
  const allTradeNodes = facesTrades.value.flat().filter(n => !n.isNote)
  const nodeMap = new Map(allTradeNodes.map(n => [n.id, n]))
  
  // Use exact diary order
  return currentTrades.map(t => nodeMap.get(t.id!)).filter(Boolean) as TradeNode[]
})

let rafId: number
const update = () => {
  const canvas = canvasRef.value
  if (!canvas) {
    rafId = requestAnimationFrame(update)
    return
  }
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    rafId = requestAnimationFrame(update)
    return
  }

  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }
  }

  const w = canvas.width, h = canvas.height
  if (w === 0 || h === 0) {
    rafId = requestAnimationFrame(update)
    return
  }

  ctx.clearRect(0, 0, w, h)

  if (revealProgress.value < 1) {
    revealProgress.value += 0.015
  }
  
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'

  currentRotation.value.x += (targetRotation.value.x - currentRotation.value.x) * 0.08
  currentRotation.value.y += (targetRotation.value.y - currentRotation.value.y) * 0.08

  // --- RENDER CUBE STRUCTURE (ETHEREAL TESSERACT) --- //
  const S = 140
  const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]
  const cubeVertices: Point3D[] = [
    {x:-S, y:-S, z:-S}, {x:S, y:-S, z:-S}, {x:S, y:S, z:-S}, {x:-S, y:S, z:-S},
    {x:-S, y:-S, z:S}, {x:S, y:-S, z:S}, {x:S, y:S, z:S}, {x:-S, y:S, z:S}
  ]
  const transformedCube = cubeVertices.map(v => {
    let p = rotateY(v, currentRotation.value.y)
    p = rotateX(p, currentRotation.value.x)
    p.x *= viewScale.value; p.y *= viewScale.value; p.z *= viewScale.value
    return project(p, w, h)
  })

  // --- CHRONOLOGICAL TRADE PATH REMOVED PER USER REQUEST --- //

  // Draw Full Borders with 50% opacity for structure
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)'
  ctx.lineWidth = 0.5
  edges.forEach(edge => {
    const v1 = transformedCube[edge[0]!]!; const v2 = transformedCube[edge[1]!]!
    if (v1.depth < -850 || v2.depth < -850) return
    ctx.beginPath(); ctx.moveTo(v1.x, v1.y); ctx.lineTo(v2.x, v2.y); ctx.stroke()
  })

  // Draw Tactical Corner Brackets (High visibility)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)'
  ctx.lineWidth = 1.4
  edges.forEach(edge => {
    const v1 = transformedCube[edge[0]!]!; const v2 = transformedCube[edge[1]!]!
    if (v1.depth < -850 || v2.depth < -850) return
    
    const bracketSize = 0.15
    ctx.beginPath()
    ctx.moveTo(v1.x, v1.y); ctx.lineTo(v1.x + (v2.x - v1.x) * bracketSize, v1.y + (v2.y - v1.y) * bracketSize)
    ctx.moveTo(v2.x, v2.y); ctx.lineTo(v2.x + (v1.x - v2.x) * bracketSize, v2.y + (v1.y - v2.y) * bracketSize)
    ctx.stroke()
  })


  // --- RENDER INTERNAL NEURAL CORE --- //
  const pulse = (Math.sin(Date.now() * 0.002) + 1) * 0.5
  const sweepY = Math.sin(Date.now() * 0.0004) * 140 
  
  ctx.lineWidth = 0.4
  internalNodes.value.forEach((node, idx) => {
     const p1_orig = rotateY(node.worldPos, currentRotation.value.y)
     const p1_rot = rotateX(p1_orig, currentRotation.value.x)
     const p1 = { x: p1_rot.x * viewScale.value, y: p1_rot.y * viewScale.value, z: p1_rot.z * viewScale.value }
     const pr1 = project(p1, w, h)

     const distToSweep = Math.abs(p1_rot.y - (sweepY / viewScale.value))
     const isSwept = distToSweep < 15
     const sweepIntensity = isSwept ? (1 - distToSweep / 15) : 0

     if (node.neighbors) {
       node.neighbors.forEach(nIdx => {
         const other = internalNodes.value[nIdx]!
         let p2_orig = rotateY(other.worldPos, currentRotation.value.y)
         let p2_rot = rotateX(p2_orig, currentRotation.value.x)
         let p2 = { x: p2_rot.x * viewScale.value, y: p2_rot.y * viewScale.value, z: p2_rot.z * viewScale.value }
         const pr2 = project(p2, w, h)

         const edgeOpacity = Math.min(pr1.opacity, pr2.opacity) * (0.05 + pulse * 0.1 + sweepIntensity * 0.2)
         ctx.globalAlpha = edgeOpacity
         ctx.strokeStyle = isSwept ? (isDark.value ? '#ffffff' : '#0f172a') : (isDark.value ? '#475569' : '#64748b')
         ctx.beginPath(); ctx.moveTo(pr1.x, pr1.y); ctx.lineTo(pr2.x, pr2.y); ctx.stroke()
       })
     }

     ctx.shadowBlur = isSwept ? 12 : 4
     ctx.shadowColor = isSwept ? (isDark.value ? '#ffffff' : '#000000') : (isDark.value ? '#334155' : '#64748b')
     ctx.globalAlpha = Math.min(1, pr1.opacity * (0.3 + pulse * 0.4 + sweepIntensity * 0.3))
     ctx.fillStyle = isSwept ? (isDark.value ? '#ffffff' : '#0f172a') : (isDark.value ? '#475569' : '#64748b')
     const nodeSize = 1.5 + sweepIntensity * 0.8
     ctx.beginPath(); ctx.arc(pr1.x, pr1.y, nodeSize, 0, Math.PI * 2); ctx.fill()
     ctx.shadowBlur = 0
  })



  facesTrades.value.forEach((face, fIdx) => {
    const isCurrentFace = fIdx === currentFace.value
    if (!isCurrentFace) return

    // Pass 1: Draw connections for notes
    face.forEach(node => {
      if (node.isNote && node.parentId) {
        const parentNode = face.find(n => n.id === node.parentId)
        if (parentNode) {
           let p1 = rotateY(node.worldPos, currentRotation.value.y)
           p1 = rotateX(p1, currentRotation.value.x)
           p1.x *= viewScale.value; p1.y *= viewScale.value; p1.z *= viewScale.value
           const proj1 = project(p1, w, h)

           let p2 = rotateY(parentNode.worldPos, currentRotation.value.y)
           p2 = rotateX(p2, currentRotation.value.x)
           p2.x *= viewScale.value; p2.y *= viewScale.value; p2.z *= viewScale.value
           const proj2 = project(p2, w, h)

           if (p1.z >= -850 && p2.z >= -850) {
             ctx.beginPath()
             ctx.moveTo(proj1.x, proj1.y)
             ctx.lineTo(proj2.x, proj2.y)
             ctx.strokeStyle = isDark.value ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'
             ctx.lineWidth = 1 * (viewScale.value / 2.2)
             ctx.stroke()
           }
        }
      }
    })

    // Pass 2: Draw nodes
    face.forEach(node => {
      let p = rotateY(node.worldPos, currentRotation.value.y)
      p = rotateX(p, currentRotation.value.x)
      p.x *= viewScale.value; p.y *= viewScale.value; p.z *= viewScale.value
      if (p.z < -850) return

      const proj = project(p, w, h); const isCurrentFace = fIdx === currentFace.value
      const focusMultiplier = viewScale.value / 2.2 // Smooth linear scaling based on initial viewScale (2.2)

      if (node.isNote) {
        if (isCurrentFace) {
           ctx.globalAlpha = Math.min(1, proj.opacity)
           const radius = 3 * focusMultiplier
           ctx.fillStyle = isDark.value ? '#ffffff' : '#000000'
           ctx.beginPath()
           ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2)
           ctx.fill()
           
           if (proj.opacity > 0.5) {
             ctx.globalAlpha = 1; ctx.fillStyle = isDark.value ? '#94a3b8' : '#475569'
             const dynamicFontSize = Math.floor(8 * focusMultiplier)
             ctx.font = `${dynamicFontSize}px Inter`
             ctx.fillText(node.label, proj.x + (6 * focusMultiplier), proj.y + (3 * focusMultiplier))
           }
        } else {
           ctx.globalAlpha = proj.opacity * 0.3
           ctx.fillStyle = isDark.value ? '#ffffff' : '#000000'
           ctx.beginPath()
           ctx.arc(proj.x, proj.y, 1.5 * focusMultiplier, 0, Math.PI * 2)
           ctx.fill()
        }
      } else {
        if (isCurrentFace) {
          ctx.globalAlpha = Math.min(1, proj.opacity * 1.5)
          const baseSize = 8 * focusMultiplier
          const thinWidth = baseSize * 0.6
          
          // Add tactical glow
          ctx.shadowBlur = 20 * focusMultiplier
          ctx.shadowColor = isDark.value ? '#ffffff' : 'rgba(15, 23, 42, 0.6)' // Darker gray glow for light theme
          
          ctx.fillStyle = isDark.value ? '#ffffff' : '#334155' 
          ctx.beginPath()
          ctx.moveTo(proj.x, proj.y - baseSize)
          ctx.lineTo(proj.x + thinWidth, proj.y)
          ctx.lineTo(proj.x, proj.y + baseSize)
          ctx.lineTo(proj.x - thinWidth, proj.y)
          ctx.closePath()
          ctx.fill()
          
          ctx.shadowBlur = 0 // Reset glow
          
          ctx.fillStyle = isDark.value ? '#94a3b8' : '#94a3b8'
          ctx.beginPath()
          const offX = proj.x + 1
          ctx.moveTo(offX, proj.y - baseSize)
          ctx.lineTo(offX + thinWidth, proj.y)
          ctx.lineTo(offX, proj.y + baseSize)
          ctx.lineTo(offX - thinWidth, proj.y)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.globalAlpha = proj.opacity * 0.4; ctx.fillStyle = isDark.value ? '#64748b' : '#334155'
          const baseSize = 4 * focusMultiplier
          const thinWidth = baseSize * 0.6
          ctx.beginPath()
          ctx.moveTo(proj.x, proj.y - baseSize)
          ctx.lineTo(proj.x + thinWidth, proj.y)
          ctx.lineTo(proj.x, proj.y + baseSize)
          ctx.lineTo(proj.x - thinWidth, proj.y)
          ctx.closePath()
          ctx.fill()
        }
        
        if (isCurrentFace && proj.opacity > 0.5) {
          ctx.globalAlpha = 1; ctx.fillStyle = isDark.value ? '#ffffff' : '#1e293b'
          const dynamicFontSize = Math.floor(12 * focusMultiplier)
          ctx.font = `bold ${dynamicFontSize}px Inter`
          ctx.fillText(node.label, proj.x + (14 * focusMultiplier), proj.y + (5 * focusMultiplier))
        }
      }
    })
  })

  rafId = requestAnimationFrame(update)
}

const handleMouseDown = (e: MouseEvent) => {
  // 3D Point Selection Logic
  if (viewType.value === 'cube' && !isTransitioning.value) {
     const rect = canvasRef.value?.getBoundingClientRect()
     if (rect) {
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        // Find nearest point on current face
        let nearest: { id: string, dist: number, node: TradeNode } | null = null
        const currentFaceNodes = facesTrades.value[currentFace.value] || []
        
        for (const node of currentFaceNodes) {
           let p = rotateY(node.worldPos, currentRotation.value.y)
           p = rotateX(p, currentRotation.value.x)
           p.x *= viewScale.value; p.y *= viewScale.value; p.z *= viewScale.value
           const proj = project(p, rect.width, rect.height)
           
           const d = Math.sqrt((proj.x - mouseX)**2 + (proj.y - mouseY)**2)
           if (d < 15 * (viewScale.value / 2.2)) {
              if (!nearest || d < nearest.dist) nearest = { id: node.id, dist: d, node }
           }
        }
        
        if (nearest) {
           if (nearest.node.isNote && nearest.node.parentId) {
              selectedTradeId.value = nearest.node.parentId
              const noteId = nearest.node.id.split('_').slice(2).join('_')
              panelInitialPage.value = 5
              panelInitialNoteId.value = noteId
              showExtraDetails.value = true
              showNodeMap.value = true
           } else {
              selectedTradeId.value = nearest.id
              showExtraDetails.value = false
           }
           draggedNode.value = nearest.node
           lastMousePos.value = { x: e.clientX, y: e.clientY }
           return // Don't start panning if we clicked a point
        }
     }
  }

  isPanning.value = true; lastMousePos.value = { x: e.clientX, y: e.clientY }
}

const handleDoubleClick = (e: MouseEvent) => {
  if (viewType.value === 'cube' && !isTransitioning.value) {
     const rect = canvasRef.value?.getBoundingClientRect()
     if (rect) {
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        
        let nearest: { id: string, dist: number, node: TradeNode } | null = null
        const currentFaceNodes = facesTrades.value[currentFace.value] || []
        
        for (const node of currentFaceNodes) {
           let p = rotateY(node.worldPos, currentRotation.value.y)
           p = rotateX(p, currentRotation.value.x)
           p.x *= viewScale.value; p.y *= viewScale.value; p.z *= viewScale.value
           const proj = project(p, rect.width, rect.height)
           
           const d = Math.sqrt((proj.x - mouseX)**2 + (proj.y - mouseY)**2)
           if (d < 15 * (viewScale.value / 2.2)) {
              if (!nearest || d < nearest.dist) nearest = { id: node.id, dist: d, node }
           }
        }
        
        if (nearest && nearest.node.isNote && nearest.node.parentId) {
           selectedTradeId.value = nearest.node.parentId
           // Extract actual note ID from the composed string "note_tradeId_noteId"
           const noteId = nearest.node.id.split('_').slice(2).join('_')
           panelInitialPage.value = 5
           panelInitialNoteId.value = noteId
           showExtraDetails.value = true
        }
     }
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (draggedNode.value) {
    const dx = e.clientX - lastMousePos.value.x
    const dy = e.clientY - lastMousePos.value.y
    
    let p = rotateY(draggedNode.value.worldPos, currentRotation.value.y)
    p = rotateX(p, currentRotation.value.x)
    p.x *= viewScale.value; p.y *= viewScale.value; p.z *= viewScale.value
    const z = Math.max(-999, p.z)
    
    const scale = 1000 / (1000 + z)
    
    const adjustedDx = (dx / scale) / viewScale.value
    const adjustedDy = (dy / scale) / viewScale.value
    
    let inv = rotateX({ x: adjustedDx, y: adjustedDy, z: 0 }, -currentRotation.value.x)
    inv = rotateY(inv, -currentRotation.value.y)
    
    draggedNode.value.worldPos.x += inv.x
    draggedNode.value.worldPos.y += inv.y
    draggedNode.value.worldPos.z += inv.z
    
    lastMousePos.value = { x: e.clientX, y: e.clientY }
    return
  }

  if (isPanning.value) {
    const dx = e.clientX - lastMousePos.value.x; const dy = e.clientY - lastMousePos.value.y
    
    if (e.shiftKey) {
      viewOffset.value.x += dx
      viewOffset.value.y += dy
    } else {
      targetRotation.value.y += dx * 0.005; targetRotation.value.x += dy * 0.005
    }
    
    lastMousePos.value = { x: e.clientX, y: e.clientY }
  }
}
const handleMouseUp = () => { 
  isPanning.value = false 
  draggedNode.value = null
}
const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  viewScale.value = Math.max(0.5, Math.min(6, viewScale.value - e.deltaY * 0.001))
}

onMounted(() => {
  loadMatrixData()
  tradeStore.init().then(() => {
    initTrades()
    switchFace(0)
    update()
  })
})
onUnmounted(() => { cancelAnimationFrame(rafId) })
</script>

<style scoped>
.diary-3d-hub { font-family: 'Inter', sans-serif; }
canvas { image-rendering: pixelated; }

.protocol-slide-enter-active, .protocol-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.protocol-slide-enter-from, .protocol-slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.protocol-slide-enter-to, .protocol-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.panel-slide-enter-active, .panel-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.panel-slide-enter-from, .panel-slide-leave-to {
  transform: translateX(100%) translateY(-50%);
  opacity: 0;
}
.panel-slide-enter-to, .panel-slide-leave-from {
  transform: translateX(0) translateY(-50%);
  opacity: 1;
}
</style>
