<template>
  <div 
    class="flex h-full w-full relative overflow-hidden font-sans border border-white/10" 
    :class="{ 'select-none': isInteracting || isDrawingMode, 'drawing-mode': isDrawingMode }"
    ref="rootRef"
  >

    <!-- ═══════════════════ LEFT SIDEBAR ═══════════════════ -->
    <!-- Sidebar wrapper: always in the DOM so toggle button is always reachable -->
    <div
      class="relative shrink-0 flex h-full z-[999] transition-all duration-300 ease-in-out"
      :style="{ width: isResultListOpen ? '260px' : '0px' }"
    >
      <div class="absolute inset-0 overflow-hidden">
        <aside
          class="absolute inset-0 w-[260px] flex flex-col h-full backdrop-blur-xl  overflow-hidden transition-all duration-300 ease-in-out"
          :class="[
            isResultListOpen ? 'translate-x-0' : '-translate-x-full',
          
            { 'pointer-events-none opacity-30': isDrawingMode }
          ]"
        >
          <div class="px-4 pt-5 pb-3">
            <p class="text-[10px] uppercase tracking-widest mb-3 font-medium">Board Library</p>
            <!-- Tab switcher -->
            <div class="flex bg-black/5 dark:bg-white/5 rounded-lg p-0.5 mb-3">
              <button
                @click="sidebarTab = 'threads'"
                :class="sidebarTab === 'threads' ? 'bg-white dark:bg-[#2a2a2a] shadow text-[var(--text-heading)]' : 'hover:text-[var(--text-heading)] opacity-60'"
                class="flex-1 text-xs py-1.5 rounded-md transition font-medium"
              >Threads</button>
              <button
                @click="sidebarTab = 'trades'"
                :class="sidebarTab === 'trades' ? 'bg-white dark:bg-[#2a2a2a] shadow text-[var(--text-heading)]' : 'hover:text-[var(--text-heading)] opacity-60'"
                class="flex-1 text-xs py-1.5 rounded-md transition font-medium"
              >Trades</button>
            </div>
            <!-- Search -->
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa] dark:text-[#555]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input
                v-model="searchQuery"
                @input="onSearch"
                placeholder="Search…"
                class="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-[#f5f5f5] dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 transition bg-transparent focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
              />
            </div>
          </div>

          <div class="flex-1 overflow-y-auto py-2">
            <div v-if="isSearching" class="flex justify-center py-6">
              <div class="w-5 h-5 border-2 border-black/20 dark:border-white/20 border-t-black dark:border-t-white rounded-full animate-spin"></div>
            </div>

            <!-- Threads tab -->
            <template v-else-if="sidebarTab === 'threads'">
              <div v-if="searchResults.length === 0 && searchQuery" class="px-4 py-6 text-center text-xs">No threads found</div>
              <div v-else-if="searchResults.length === 0" class="px-4 py-6 text-center text-xs">Type to search threads</div>
              <div
                v-for="thread in searchResults"
                :key="thread.id"
                class="group flex items-start gap-2 mx-2 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-default transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium truncate leading-tight" style="color: var(--text-heading)">{{ thread.title }}</p>
                  <p class="text-[10px] mt-0.5 capitalize">{{ thread.category }} · {{ thread.subcategory }}</p>
                </div>
                <button
                  @click="addThreadNote(thread)"
                  class="opacity-0 group-hover:opacity-100 flex-shrink-0 w-6 h-6 rounded-md bg-black dark:bg-white text-white dark:text-black flex items-center justify-center transition"
                  title="Add to board"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                </button>
              </div>
            </template>

            <!-- Trades tab -->
            <template v-else>
              <div v-if="tradeResults.length === 0 && searchQuery" class="px-4 py-6 text-center text-xs">No trades match search</div>
              <div v-else-if="tradeResults.length === 0 && !auth.user" class="px-4 py-6 text-center text-xs">Login to see trades</div>
              <div v-else-if="tradeResults.length === 0" class="px-4 py-6 text-center text-xs">No trades in diary</div>
              <div
                v-for="(trade, idx) in tradeResults"
                :key="idx"
                class="group flex items-start gap-2 mx-2 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-default transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium text-[#050505] dark:text-white truncate">{{ trade.asset || 'Unknown' }}</p>
                  <p class="text-[10px] mt-0.5" :class="trade.side === 'Long' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'">
                    {{ trade.side }} · <span :class="(trade.result ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'">{{ (trade.result ?? 0) >= 0 ? '+' : '' }}{{ trade.result }}%</span>
                  </p>
                </div>
                <button
                  @click="addTradeNote(trade)"
                  class="opacity-0 group-hover:opacity-100 flex-shrink-0 w-6 h-6 rounded-md bg-black dark:bg-white text-white dark:text-black flex items-center justify-center transition"
                  title="Add to board"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                </button>
              </div>
            </template>
          </div>
        </aside>
      </div>

      <!-- ── Sidebar Toggle Button (always visible, sticks to right edge of sidebar slot) ── -->
      <button
        @click="isResultListOpen = !isResultListOpen"
        class="absolute top-1/2 -translate-y-1/2 right-0 translate-x-full flex items-center justify-center w-5 h-12 rounded-r-lg shadow-md transition-all duration-200 z-[1000] focus:outline-none"
        :class="isResultListOpen
          ? 'bg-white dark:bg-[#1d1d1d] border border-l-0 border-black/10 dark:border-white/10 text-[#888] dark:text-[#555] hover:text-[#050505] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
          : 'bg-white dark:bg-[#1d1d1d] border border-black/10 dark:border-white/10 text-[#888] dark:text-[#555] hover:text-[#050505] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'"
        :title="isResultListOpen ? 'Hide sidebar' : 'Show sidebar'"
      >
        <svg
          class="w-3 h-3 transition-transform duration-300"
          :class="isResultListOpen ? '' : 'rotate-180'"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
    </div>

    <!-- ═══════════════════ LAYERS PANEL ═══════════════════ -->
    <div
      class="relative shrink-0 flex h-full z-[998] transition-all duration-300 ease-in-out border-r border-black/10 dark:border-white/10 overflow-hidden"
      :style="{ width: isLayersPanelOpen ? '240px' : '0px' }"
    >
      <aside
        class="absolute inset-0 w-[240px] flex flex-col h-full backdrop-blur-xl border-l border-black/10 dark:border-white/10 overflow-hidden transition-all duration-300 ease-in-out"
        :class="[
          isLayersPanelOpen ? 'translate-x-0' : '-translate-x-full',
          themeStore.settings.isDark ? 'bg-black/20' : 'bg-white/20',
          { 'pointer-events-none opacity-30': isDrawingMode, 'select-none': isDraggingLayer }
        ]"
      >
        <div class="px-4 pt-5 pb-3 flex items-center justify-between border-b border-black/5 dark:border-white/5 pl-[48px]">
          <p class="text-[10px] uppercase tracking-widest text-[#999] dark:text-[#666] font-bold">Layers</p>
          <button 
            @click="folders = [...folders, { id: uid(), name: 'New Folder', isOpen: true }]"
            class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-indigo-500 transition-colors"
            title="New Folder"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto py-2 custom-scrollbar relative">
          <!-- Drop Indicator at the very top of Root -->
          <div v-if="isDraggingLayer && dragInsertIndex === 0 && !dragOverFolderId" 
               class="h-0.5 bg-indigo-500/50 mx-4 my-1 rounded-full animate-pulse relative z-[10]"></div>

          <!-- Root Nodes (No Folder) -->
          <div v-for="note in notes.filter(n => !n.folderId)" :key="note.id">
            <div :data-node-id="note.id"
                 class="group relative flex items-center gap-2 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing select-none"
                 :class="{ 'opacity-0': isDraggingLayer && draggedLayerId === note.id }"
                 @mousedown.left="startLayerDrag($event, note.id)"
                 @click="!isDraggingLayer && focusNode(note.id)">
              
              <div class="w-1.5 h-1.5 rounded-full shrink-0" :class="note.type === 'trade' ? 'bg-emerald-500' : note.type === 'thread' ? 'bg-indigo-500' : 'bg-amber-500'"></div>
              <span class="flex-1 text-[11px] font-medium text-[#444] dark:text-[#ccc] truncate">
                {{ note.type === 'thread' ? (note.threadData?.title || 'Thread') : (note.type === 'trade' ? (note.tradeData?.asset || 'Trade') : (note.strategyData?.name || 'Note')) }}
              </span>
            </div>
            <!-- Drop Indicator Line (Root) -->
            <div v-if="isDraggingLayer && dragInsertIndex === (notes.indexOf(note) + 1) && !dragOverFolderId" 
                 class="h-0.5 bg-indigo-500/50 mx-4 my-1 rounded-full animate-pulse relative z-[10]"></div>
          </div>

          <!-- Folders -->
          <div v-for="folder in folders" :key="folder.id" class="mt-2" :data-folder-id="folder.id">
            <div class="flex items-center gap-2 px-4 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 group transition-colors"
                 :class="{ 'bg-black/5 dark:bg-white/10 ring-1 ring-inset ring-white/20': dragOverFolderId === folder.id }">
              <button @click="folder.isOpen = !folder.isOpen" class="p-0.5 rounded transition hover:bg-black/10 dark:hover:bg-white/10">
                <svg class="w-3 h-3 text-[#999] transition-transform" :class="{ 'rotate-90': folder.isOpen }" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
              </button>
              <svg class="w-3.5 h-3.5 text-amber-500/70" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
              <input v-model="folder.name" @click.stop class="flex-1 min-w-0 bg-transparent border-none outline-none text-[11px] font-bold text-[#050505] dark:text-white shadow-none focus:ring-0" :class="{ 'pointer-events-none': isDraggingLayer }" />
              <button @click="folders = folders.filter(f => f.id !== folder.id); notes.filter(n => n.folderId === folder.id).forEach(n => n.folderId = undefined); saveBoardToLocal()" class="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-rose-500 transition-all">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
            
            <div v-if="folder.isOpen" class="ml-4 border-l border-black/5 dark:border-white/5">
              <div v-for="note in notes.filter(n => n.folderId === folder.id)" :key="note.id">
                <div :data-node-id="note.id"
                     class="group flex items-center gap-2 px-4 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing select-none"
                     :class="{ 'opacity-0': isDraggingLayer && draggedLayerId === note.id }"
                     @mousedown.left="startLayerDrag($event, note.id)"
                     @click="!isDraggingLayer && focusNode(note.id)">
                  <div class="w-1.5 h-1.5 rounded-full shrink-0" :class="note.type === 'trade' ? 'bg-emerald-500' : note.type === 'thread' ? 'bg-indigo-500' : 'bg-amber-500'"></div>
                  <span class="flex-1 text-[11px] text-[#555] dark:text-[#aaa] truncate">
                    {{ note.type === 'thread' ? (note.threadData?.title || 'Thread') : (note.type === 'trade' ? (note.tradeData?.asset || 'Trade') : (note.strategyData?.name || 'Note')) }}
                  </span>
                </div>
                <!-- Drop Indicator Line (Inside Folder) -->
                <div v-if="isDraggingLayer && dragInsertIndex === (notes.indexOf(note) + 1) && dragOverFolderId === folder.id" 
                     class="h-0.5 bg-indigo-500/50 mx-4 my-1 rounded-full animate-pulse relative z-[10]"></div>
              </div>
            </div>
          </div>

          <!-- Custom Drag Ghost -->
          <Teleport to="body">
            <div v-if="isDraggingLayer" 
                 class="fixed pointer-events-none z-[9999] flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#222] shadow-2xl rounded-lg border border-indigo-500/50 opacity-90"
                 :style="{ top: (dragMouseY - 15) + 'px', left: '100px', width: '200px' }">
              <div class="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
              <span class="text-[11px] font-medium text-[#444] dark:text-[#ccc] truncate">
                {{ notes.find(n => n.id === draggedLayerId)?.type === 'thread' ? (notes.find(n => n.id === draggedLayerId)?.threadData?.title || 'Thread') : (notes.find(n => n.id === draggedLayerId)?.type === 'trade' ? (notes.find(n => n.id === draggedLayerId)?.tradeData?.asset || 'Trade') : (notes.find(n => n.id === draggedLayerId)?.strategyData?.name || 'Note')) }}
              </span>
            </div>
          </Teleport>
        </div>
      </aside>
    </div>

    <!-- ═══════════════════ CANVAS AREA ═══════════════════ -->
    <div
      class="flex-1 relative overflow-hidden"
      :class="(isBrushActive || isEraserActive) ? 'cursor-none' : placingNodeType ? 'cursor-cell' : 'cursor-default'"
      ref="canvasWrapRef"
      @wheel.prevent="onWheel"
      @mousedown="onCanvasMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseLeave"
      @mouseenter="onMouseEnter"
    >
      <!-- ─── Board Tabs ─── -->
      <div 
        class="absolute top-4 left-6 flex items-center gap-2 z-[200] transition-opacity duration-300"
      >
        <div class="relative flex items-center gap-2">
          <!-- Toggle Layers Panel -->
          <button 
            @click="isLayersPanelOpen = !isLayersPanelOpen"
            class="w-9 h-9 flex items-center justify-center rounded-xl transition border border-black/5 dark:border-white/5 shadow-sm backdrop-blur-md z-[1001]"
            :class="[
              isLayersPanelOpen ? 'bg-indigo-500 text-white' : 'bg-white/80 dark:bg-[#1d1d1d]/80 text-[#444] dark:text-[#aaa] hover:bg-white dark:hover:bg-[#1d1d1d]',
              { 'pointer-events-auto opacity-100': isDrawingMode }
            ]"
            title="Toggle Layers"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          </button>

          <!-- Sliding Indicator Background -->
          <div 
            class="absolute h-full rounded-xl bg-indigo-500 shadow-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0"
            :style="{
              width: activeBoardTabWidth + 'px',
              left: activeBoardTabLeft + 'px',
              opacity: activeBoardId ? 1 : 0
            }"
          ></div>

          <div 
            v-for="board in boards" 
            :key="board.id"
            :ref="el => { if (el) boardTabRefs[board.id] = (el as HTMLElement) }"
            @click="setActiveBoard(board.id)"
            class="group relative flex items-center h-9 px-4 rounded-xl text-sm font-medium transition cursor-pointer z-10 whitespace-nowrap"
            :class="activeBoardId === board.id ? 'text-white' : 'bg-white/80 dark:bg-[#1d1d1d]/80 text-[#444] dark:text-[#aaa] hover:bg-white dark:hover:bg-[#1d1d1d] border border-black/5 dark:border-white/5 shadow-sm backdrop-blur-md'"
          >
            <span>{{ board.name }}</span>
            <button v-if="boards.length > 1" 
              class="ml-2 w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition absolute -top-1 -right-1 bg-rose-500 text-white shadow-sm"
              @click.stop="confirmDeleteBoard(board)"
            >
              <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <button v-if="boards.length < 5" 
          class="w-9 h-9 flex items-center justify-center rounded-xl bg-white/80 dark:bg-[#1d1d1d]/80 text-indigo-500 hover:bg-white dark:hover:bg-[#1d1d1d] border border-black/5 dark:border-white/5 shadow-sm backdrop-blur-md transition"
          @click="addNewBoard"
          title="New Board (Max 5)"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        </button>

        <!-- Save Status / Manual Save -->
        <div class="ml-4 flex items-center gap-2">
          <button 
            @click="centerOnNodes('strategy')" 
            class="flex items-center gap-2 px-3 h-9 rounded-xl text-[11px] font-bold uppercase tracking-wider transition border border-black/5 dark:border-white/5 shadow-sm backdrop-blur-md bg-white/80 dark:bg-[#1d1d1d]/80 text-[#666] dark:text-[#999] hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-[#1d1d1d]"
            title="Find and focus on your Strategy nodes"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Find Strategy
          </button>
          
          <button 
            @click="saveBoardToLocal(true)" 
            class="flex items-center gap-2 px-3 h-9 rounded-xl text-[11px] font-bold uppercase tracking-wider transition border border-black/5 dark:border-white/5 shadow-sm backdrop-blur-md"
            :class="isManualSaving ? 'bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 cursor-wait' : 'bg-white/80 dark:bg-[#1d1d1d]/80 text-[#666] dark:text-[#999] hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-[#1d1d1d]'"
            :disabled="isSaving"
          >
            <svg v-if="isManualSaving" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            <Transition name="fade" mode="out-in">
              <span :key="isManualSaving ? 'saving' : 'save'">{{ isManualSaving ? 'Saving...' : 'Save' }}</span>
            </Transition>
          </button>
        </div>
      </div>

      <Transition name="fade">
        <div v-if="showDeleteConfirm" class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @mousedown.stop>
          <Transition name="scale" appear>
            <div class="bg-white dark:bg-[#1d1d1d] rounded-2xl p-6 shadow-2xl border border-black/5 dark:border-white/10 max-w-sm w-full text-center">
              <h3 class="text-lg font-bold mb-2">Delete Board?</h3>
              <p class="text-sm mb-6">Are you sure you want to delete "{{ boardToDelete?.name }}"? All notes and connections on this board will be lost.</p>
              <div class="flex gap-3">
                <button @click="showDeleteConfirm = false" class="flex-1 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition font-medium text-[#444] dark:text-[#ccc]">Cancel</button>
                <button @click="deleteBoard" class="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition font-medium shadow-lg shadow-rose-500/20">Delete</button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="showStrategyLimitWarning" class="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @mousedown.stop>
          <Transition name="scale" appear>
            <div class="bg-white dark:bg-[#1d1d1d] rounded-2xl p-8 shadow-2xl border border-black/5 dark:border-white/10 max-w-md w-full text-center relative overflow-hidden">
              <!-- Background decoration -->
              <div class="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
              <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>

              <!-- Icon -->
              <div class="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>

              <h3 class="text-xl font-bold mb-3">Maximum Strategies Reached</h3>
              <p class="text-sm mb-8 leading-relaxed">
                To keep your strategy boards focused and effective, each board is limited to <span class="font-bold" style="color: var(--text-heading)">two strategy nodes</span> at once.
                <br/><br/>
                Please remove an existing strategy or <span class="italic">create a new board</span> to continue mapping your approach.
              </p>

              <div class="flex flex-col gap-3">
                <button 
                  @click="addNewBoard" 
                  class="w-full px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group"
                >
                  <span>Create New Board</span>
                  <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                </button>
                <button 
                  @click="showStrategyLimitWarning = false" 
                  class="w-full px-6 py-3 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition font-medium text-[#444] dark:text-[#ccc]"
                >
                  Close
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
      <!-- Global Condition Image Gallery -->
      <Transition 
        enter-active-class="transition duration-300 ease-out" 
        enter-from-class="opacity-0" 
        enter-to-class="opacity-100" 
        leave-active-class="transition duration-200 ease-in" 
        leave-from-class="opacity-100" 
        leave-to-class="opacity-0"
      >
        <div v-if="activeConditionImages && activeConditionImages.length > 0" class="fixed inset-0 z-[2000] flex items-center justify-center p-20 backdrop-blur-md bg-black/60" @click="activeConditionImages = null" @mousedown.stop>
          <Transition 
            appear
            enter-active-class="transition duration-500 cubic-out" 
            enter-from-class="scale-90 opacity-0 translate-y-4" 
            enter-to-class="scale-100 opacity-100 translate-y-0" 
          >
            <div class="flex flex-col items-center gap-6" @click.stop>
              <!-- Main Image Frame (Pure & Unobstructed) -->
              <div class="relative h-[60vh] aspect-video bg-black rounded-[24px] shadow-[0_64px_192px_rgba(0,0,0,0.9)] border border-white/5 overflow-hidden">
                <Transition name="gallery-fade" mode="out-in">
                  <img :key="activeGalleryIndex" :src="activeConditionImage!" class="w-full h-full object-contain select-none">
                </Transition>
              </div>
              
              <!-- Ghost Halo Control Panel (Enhanced Visibility) -->
              <div class="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#0a0a0a]/95 border border-white/20 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(255,255,255,0.02)] animate-in fade-in slide-in-from-bottom-4 duration-700">
                <!-- Navigation Arrows -->
                <div v-if="activeConditionImages.length > 1" class="flex items-center">
                  <button @click.stop="prevGalleryImage" class="p-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                    <svg class="w-5 h-5 stroke-[2.5px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
                  </button>
                  
                  <!-- Ghost Counter Display -->
                  <div class="px-5 text-[11px] font-black tracking-[0.25em] text-white/40 select-none">
                    {{ activeGalleryIndex + 1 }} <span class="mx-1.5 opacity-20 text-white">/</span> {{ activeConditionImages.length }}
                  </div>

                  <button @click.stop="nextGalleryImage" class="p-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-90">
                    <svg class="w-5 h-5 stroke-[2.5px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
                  </button>
                </div>

                <!-- Vertical Separator -->
                <div v-if="activeConditionImages.length > 1" class="w-[1px] h-5 bg-white/10 mx-2"></div>

                <!-- Pure Minimalist Close Button -->
                <button @click="activeConditionImages = null" class="p-2.5 rounded-xl text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all active:scale-90 group/close">
                  <svg class="w-5 h-5 stroke-[2.5px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>

      <!-- Infinite grid background -->
      <div 
        class="absolute inset-0 z-0 pointer-events-none [background-image:radial-gradient(circle,rgba(0,0,0,0.12)_1px,transparent_1px)] dark:[background-image:radial-gradient(circle,rgba(255,255,255,0.08)_1px,transparent_1px)]" 
        :style="gridStyle"
      ></div>

      <!-- Drawing Layer (behind notes, same transform as canvas) -->
      <div 
        class="absolute top-0 left-0 w-[4000px] h-[4000px] z-0 pointer-events-none"
        :style="{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`, transformOrigin: '0 0' }"
      >
        <svg class="w-full h-full overflow-visible">
          <path 
            v-for="path in getBoardDrawings()" 
            :key="path.id" 
            :d="getPathData(path.points)" 
            :stroke="path.color" 
            :stroke-width="path.thickness" 
            fill="none" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          />
          <path 
            v-if="currentPath" 
            :d="getPathData(currentPath.points)" 
            :stroke="currentPath.color" 
            :stroke-width="currentPath.thickness" 
            fill="none" 
            stroke-linecap="round" 
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <!-- Transformed canvas -->
      <div class="absolute top-0 left-0 w-[4000px] h-[4000px] z-[1] [will-change:transform] board-canvas" :style="canvasStyle">

        <!-- SVG connections layer -->
        <svg class="absolute top-0 left-0 w-full h-full z-[1] pointer-events-none overflow-visible">
          <g style="pointer-events:all">
            <line
              v-for="conn in connections"
              :key="conn.id"
              :x1="noteCenter(conn.fromId).x"
              :y1="noteCenter(conn.fromId).y"
              :x2="noteCenter(conn.toId).x"
              :y2="noteCenter(conn.toId).y"
              @click.stop="removeConnection(conn.id)"
              class="cursor-pointer hover:opacity-100 transition-opacity"
              style="stroke-width:2;stroke:#6366f1;opacity:0.7"
            />
            <!-- In-progress connection line -->
            <line
              v-if="connectingFrom && mousePos"
              :x1="noteCenter(connectingFrom).x"
              :y1="noteCenter(connectingFrom).y"
              :x2="(mousePos.x - transform.x) / transform.scale"
              :y2="(mousePos.y - transform.y) / transform.scale"
              style="stroke:#6366f1;stroke-width:1.5;stroke-dasharray:6 4;opacity:0.5;pointer-events:none"
            />
          </g>
        </svg>

        <!-- ─── Notes ─── -->
        <template v-for="note in notes" :key="note.id">

          <!-- Thread Note -->
          <div
            v-if="note.type === 'thread'"
            class="absolute rounded-[14px] border border-solid shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col z-10 [will-change:transform] transition-[box-shadow,ring,border-color] duration-150 select-none hover:shadow-[0_6px_28px_rgba(0,0,0,0.13),0_2px_6px_rgba(0,0,0,0.06)] hover:z-20 dark:bg-[#1d1d1d] bg-white dark:border-white/10 border-black/10 dark:text-white text-[#050505] board-note"
            :class="{ 
              'ring-2 ring-indigo-500': selectedNoteId === note.id && !connectingFrom, 
              'ring-4 ring-indigo-400 dark:ring-indigo-600': connectingFrom === note.id,
              'border-rose-500 ring-2 ring-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.35)]': isTradeViolatingRisk(note.id),
              'dragging': isDragging(note.id),
              'pointer-events-none opacity-30': isDrawingMode
            }"
            :style="noteStyle(note)"
            @mousedown.stop="startDrag($event, note)"
            @click.stop="onNoteClick(note)"
          >
            <div class="flex items-center justify-between px-3 pt-2.5 pb-2 cursor-grab active:cursor-grabbing shrink-0">
              <span class="text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase bg-[#e0e7ff] text-[#4338ca] dark:bg-[#312e81] dark:text-[#a5b4fc]">Thread</span>
              <div class="flex items-center gap-1">
                <a v-if="note.threadId" :href="`/forum/thread/${note.threadId}`" class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-[#4338ca] dark:hover:text-[#a5b4fc] transition" @mousedown.stop title="Open thread">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                </a>
                <div v-if="folders.length > 0" class="relative group/folder">
                  <button class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-amber-500 transition" @mousedown.stop title="Move to folder">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                  </button>
                  <div class="absolute top-full right-0 mt-1 hidden group-hover/folder:block bg-white dark:bg-[#1d1d1d] border border-black/10 dark:border-white/10 rounded-lg shadow-xl z-50 py-1 min-w-[120px]">
                    <div v-for="f in folders" :key="f.id" @click.stop="note.folderId = f.id" class="px-3 py-1.5 text-[10px] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full" :class="note.folderId === f.id ? 'bg-indigo-500' : 'bg-transparent border border-[#ccc]'"></div>
                      {{ f.name }}
                    </div>
                    <div class="border-t border-black/5 dark:border-white/5 mt-1 pt-1 px-3 py-1.5 text-[10px] text-rose-500 hover:bg-rose-500/5 cursor-pointer" @click.stop="note.folderId = undefined">Remove from folder</div>
                  </div>
                </div>
                <button class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-[#444] dark:hover:text-[#ccc] transition text-sm leading-none" @mousedown.stop @click.stop="removeNote(note.id)" title="Remove">×</button>
              </div>
            </div>
            <div class="px-3 pb-3 flex-1 overflow-hidden">
              <p class="text-[13px] font-semibold leading-tight mb-0.5 truncate">{{ note.threadData?.title }}</p>
              <p class="text-[10px] uppercase tracking-wider text-[#999] dark:text-[#555] mb-1.5">{{ note.threadData?.category }} · {{ note.threadData?.subcategory }}</p>
              <p v-if="note.threadData?.description" class="text-[11px] text-[#777] dark:text-[#666] leading-relaxed line-clamp-3">{{ note.threadData.description }}</p>
              <div v-if="note.threadData?.includedTrades?.length" class="mt-2 flex flex-wrap gap-1">
                <span v-for="(t, i) in note.threadData.includedTrades" :key="i" class="text-[9px] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#444] dark:text-[#ccc]">
                  {{ t.asset }} {{ t.side === 'Long' ? '▲' : '▼' }} {{ t.result !== undefined ? (t.result >= 0 ? '+' + t.result : t.result) + '%' : '' }}
                </span>
              </div>
            </div>
            <!-- Resize handles -->
            <div class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30" @mousedown.stop="startResize($event, note, 'nw')"></div>
            <div class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30" @mousedown.stop="startResize($event, note, 'ne')"></div>
            <div class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30" @mousedown.stop="startResize($event, note, 'sw')"></div>
            <div
              class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity z-30"
              @mousedown.stop="startResize($event, note, 'se')"
              title="Resize"
            >
              <svg class="w-2.5 h-2.5 text-black/40 dark:text-white/40" viewBox="0 0 8 8" fill="currentColor"><path d="M0 8L8 0M4 8L8 4"/></svg>
            </div>
          </div>

          <!-- Trade Note -->
          <div
            v-else-if="note.type === 'trade'"
            class="absolute rounded-[14px] border border-solid shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col z-10 [will-change:transform] transition-[box-shadow,ring,border-color] duration-150 select-none hover:shadow-[0_6px_28px_rgba(0,0,0,0.13),0_2px_6px_rgba(0,0,0,0.06)] hover:z-20 dark:bg-[#1d1d1d] bg-white dark:border-white/10 border-black/10 dark:text-white text-[#050505] board-note"
            :class="{ 
              'ring-2 ring-indigo-500': selectedNoteId === note.id && !connectingFrom, 
              'ring-4 ring-indigo-400 dark:ring-indigo-600': connectingFrom === note.id,
              'border-rose-500 ring-2 ring-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.35)]': isTradeViolatingRisk(note.id),
              'dragging': isDragging(note.id),
              'pointer-events-none opacity-30': isDrawingMode
            }"
            :style="noteStyle(note)"
            @mousedown.stop="startDrag($event, note)"
            @click.stop="onNoteClick(note)"
          >
            <div class="flex items-center justify-between px-3 pt-2.5 pb-2 cursor-grab active:cursor-grabbing shrink-0">
              <span class="text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase bg-[#d1fae5] text-[#065f46] dark:bg-[#064e3b] dark:text-[#6ee7b7]">Trade</span>
              <button class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-[#444] dark:hover:text-[#ccc] transition text-sm leading-none" @mousedown.stop @click.stop="removeNote(note.id)" title="Remove">×</button>
            </div>
            <div class="px-3 pb-3 flex-1">
              <p class="text-[13px] font-semibold leading-tight mb-0.5 truncate">{{ getLiveTradeData(note)?.asset }}</p>
              <p class="text-[10px] uppercase tracking-wider mb-1.5" :class="getLiveTradeData(note)?.side === 'Long' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'">{{ getLiveTradeData(note)?.side }}</p>
              <p class="text-2xl font-semibold mt-1" :class="(getLiveTradeData(note)?.result ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'">
                {{ (getLiveTradeData(note)?.result ?? 0) >= 0 ? '+' : '' }}{{ getLiveTradeData(note)?.result }}%
              </p>
              <div class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                <span class="text-[10px] text-[#888] dark:text-[#555]">Entry</span><span class="text-[10px]">{{ getLiveTradeData(note)?.entry }}</span>
                <span class="text-[10px] text-[#888] dark:text-[#555]">Exit</span><span class="text-[10px]">{{ getLiveTradeData(note)?.exit }}</span>
                <span v-if="getLiveTradeData(note)?.stopLoss" class="text-[10px] text-[#888] dark:text-[#555]">SL</span><span v-if="getLiveTradeData(note)?.stopLoss" class="text-[10px]">{{ getLiveTradeData(note)?.stopLoss }}</span>
                <span v-if="getLiveTradeData(note)?.takeProfit" class="text-[10px] text-[#888] dark:text-[#555]">TP</span><span v-if="getLiveTradeData(note)?.takeProfit" class="text-[10px]">{{ getLiveTradeData(note)?.takeProfit }}</span>
              </div>
              <p v-if="getLiveTradeData(note)?.notes" class="text-[11px] text-[#777] dark:text-[#666] leading-relaxed line-clamp-2 mt-2">{{ getLiveTradeData(note)?.notes }}</p>
            </div>
            <!-- Resize handles -->
            <div class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30" @mousedown.stop="startResize($event, note, 'nw')"></div>
            <div class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30" @mousedown.stop="startResize($event, note, 'ne')"></div>
            <div class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30" @mousedown.stop="startResize($event, note, 'sw')"></div>
            <div
              class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity z-30"
              @mousedown.stop="startResize($event, note, 'se')"
              title="Resize"
            >
              <svg class="w-2.5 h-2.5 text-black/40 dark:text-white/40" viewBox="0 0 8 8" fill="currentColor"><path d="M0 8L8 0M4 8L8 4"/></svg>
            </div>
          </div>

          <!-- Strategy Note -->
          <div
            v-else-if="note.type === 'strategy'"
            class="absolute rounded-[14px] border border-solid shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col z-10 [will-change:transform] transition-[box-shadow,ring] duration-150 select-none hover:shadow-[0_6px_28px_rgba(0,0,0,0.13),0_2px_6px_rgba(0,0,0,0.06)] hover:z-20 dark:bg-[#1d1d1d] bg-white dark:border-white/10 border-black/10 dark:text-white text-[#050505] board-note"
            :class="{ 
              'ring-2 ring-indigo-500': selectedNoteId === note.id && !connectingFrom,
              'dragging': isDragging(note.id),
              'pointer-events-none opacity-30': isDrawingMode
            }"
            :style="noteStyle(note)"
            @mousedown.stop="startDrag($event, note)"
            @click.stop="onNoteClick(note)"
          >
            <div class="flex items-center justify-between px-3 pt-2.5 pb-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-t-[14px] border-b border-emerald-500/20 shrink-0 cursor-grab active:cursor-grabbing">
              <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Strategy</span>
              <button class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-rose-500 transition text-sm leading-none" @mousedown.stop @click.stop="removeNote(note.id)" title="Remove">×</button>
            </div>
            <div class="px-3 py-3 flex-1 flex flex-col gap-2 overflow-hidden" @mousedown.stop>
              <input v-if="note.strategyData" v-model="note.strategyData.name" class="text-[13px] font-bold bg-transparent border-none outline-none placeholder-emerald-900/30 dark:placeholder-emerald-200/20 w-full" placeholder="Strategy Name..." @input="$forceUpdate()" />
              <textarea v-if="note.strategyData" v-model="note.strategyData.description" class="text-[11px] bg-transparent border-none outline-none resize-none flex-1 placeholder-emerald-900/20 dark:placeholder-emerald-200/10 leading-relaxed overflow-y-auto w-full" placeholder="Describe your strategy..." @input="$forceUpdate()"></textarea>
              
              <!-- Empty state -->
              <div v-if="getStrategyMetrics(note.id).total === 0" class="flex flex-col items-center justify-center py-4 gap-1.5 mt-1">
                <svg class="w-6 h-6 text-emerald-300 dark:text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span class="text-[10px] text-emerald-500/60 dark:text-emerald-700 text-center">No trades attached</span>
              </div>
              <div v-else class="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-black/5 dark:border-white/5 shrink-0">
                <div class="flex flex-col">
                  <span class="text-[8px] uppercase tracking-tighter text-[#999] dark:text-[#666]">Net Profit</span>
                  <span class="text-[12px] font-bold" :class="getStrategyMetrics(note.id).netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'">
                    {{ getStrategyMetrics(note.id).netProfit >= 0 ? '+' : '' }}{{ getStrategyMetrics(note.id).netProfit.toFixed(1) }}%
                  </span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[8px] uppercase tracking-tighter text-[#999] dark:text-[#666]">Win Rate</span>
                  <span class="text-[12px] font-bold text-[#050505] dark:text-white">{{ getStrategyMetrics(note.id).winRate.toFixed(1) }}%</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[8px] uppercase tracking-tighter text-[#999] dark:text-[#666]">Avg R/R</span>
                  <span class="text-[12px] font-bold text-[#050505] dark:text-white">{{ getStrategyMetrics(note.id).avgRR.toFixed(2) }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[8px] uppercase tracking-tighter text-[#999] dark:text-[#666]">Trades</span>
                  <span class="text-[12px] font-bold text-[#050505] dark:text-white">{{ getStrategyMetrics(note.id).total }}</span>
                </div>
              </div>
            </div>
            <!-- Resize handles -->
            <div class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30" @mousedown.stop="startResize($event, note, 'nw')"></div>
            <div class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30" @mousedown.stop="startResize($event, note, 'ne')"></div>
            <div class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30" @mousedown.stop="startResize($event, note, 'sw')"></div>
            <div class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity z-30" @mousedown.stop="startResize($event, note, 'se')" title="Resize">
              <svg class="w-2.5 h-2.5 text-black/40 dark:text-white/40" viewBox="0 0 8 8" fill="currentColor"><path d="M0 8L8 0M4 8L8 4"/></svg>
            </div>
          </div>

          <!-- Risk Management Note -->
          <div
            v-else-if="note.type === 'risk_management'"
            class="absolute rounded-[14px] border border-solid shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col z-10 [will-change:transform] transition-[box-shadow,ring] duration-150 select-none hover:shadow-[0_6px_28px_rgba(0,0,0,0.13),0_2px_6px_rgba(0,0,0,0.06)] hover:z-20 dark:bg-[#1d1d1d] bg-white dark:border-white/10 border-black/10 dark:text-white text-[#050505] board-note"
            :class="{ 
              'ring-2 ring-indigo-500': selectedNoteId === note.id && !connectingFrom,
              'dragging': isDragging(note.id),
              'pointer-events-none opacity-30': isDrawingMode
            }"
            :style="noteStyle(note)"
            @mousedown.stop="startDrag($event, note)"
            @click.stop="onNoteClick(note)"
          >
            <div class="flex items-center justify-between px-3 pt-2.5 pb-2 bg-amber-500/10 dark:bg-amber-500/20 rounded-t-[14px] border-b border-amber-500/20 shrink-0 cursor-grab active:cursor-grabbing">
              <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Risk Management</span>
              <button class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-rose-500 transition text-sm leading-none" @mousedown.stop @click.stop="removeNote(note.id)" title="Remove">×</button>
            </div>
            <div class="px-3 py-3 flex-1 flex flex-col gap-2.5 overflow-hidden" @mousedown.stop>
              <div v-if="note.riskData" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] text-[#888] dark:text-[#555]">Deposit $</span>
                  <div class="flex items-center bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden border border-black/5 dark:border-white/5 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
                    <button @mousedown.stop @click.stop="note.riskData.initialDeposit = Math.max(0, note.riskData.initialDeposit - 100); saveBoardToLocal()" class="px-1.5 py-1 text-[#bbb] hover:text-amber-500 hover:bg-amber-500/10 transition-colors">
                      <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4"/></svg>
                    </button>
                    <input v-model.number="note.riskData.initialDeposit" type="number" class="w-16 text-center text-[11px] bg-transparent outline-none py-0.5 font-bold" @input="$forceUpdate()" @mousedown.stop @keydown.stop />
                    <button @mousedown.stop @click.stop="note.riskData.initialDeposit += 100; saveBoardToLocal()" class="px-1.5 py-1 text-[#bbb] hover:text-amber-500 hover:bg-amber-500/10 transition-colors">
                      <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                    </button>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[10px] text-[#888] dark:text-[#555]">Risk %</span>
                  <div class="flex items-center bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden border border-black/5 dark:border-white/5 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
                    <button @mousedown.stop @click.stop="note.riskData.riskPerTrade = Math.max(0.1, +(note.riskData.riskPerTrade - 0.1).toFixed(1)); saveBoardToLocal()" class="px-1.5 py-1 text-[#bbb] hover:text-amber-500 hover:bg-amber-500/10 transition-colors">
                      <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4"/></svg>
                    </button>
                    <input v-model.number="note.riskData.riskPerTrade" type="number" step="0.1" class="w-10 text-center text-[11px] bg-transparent outline-none py-0.5 font-bold" @input="$forceUpdate()" @mousedown.stop @keydown.stop />
                    <button @mousedown.stop @click.stop="note.riskData.riskPerTrade = +(note.riskData.riskPerTrade + 0.1).toFixed(1); saveBoardToLocal()" class="px-1.5 py-1 text-[#bbb] hover:text-amber-500 hover:bg-amber-500/10 transition-colors">
                      <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                    </button>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[10px] text-[#888] dark:text-[#555]">Target Reward/Risk</span>
                  <div class="flex items-center bg-black/5 dark:bg-white/5 rounded-lg overflow-hidden border border-black/5 dark:border-white/5 focus-within:ring-1 focus-within:ring-amber-500/30 transition-all">
                    <button @mousedown.stop @click.stop="note.riskData.targetRR = Math.max(0.1, +(note.riskData.targetRR - 0.1).toFixed(1)); saveBoardToLocal()" class="px-1.5 py-1 text-[#bbb] hover:text-amber-500 hover:bg-amber-500/10 transition-colors">
                      <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4"/></svg>
                    </button>
                    <input v-model.number="note.riskData.targetRR" type="number" step="0.1" class="w-10 text-center text-[11px] bg-transparent outline-none py-0.5 font-bold" @input="$forceUpdate()" @mousedown.stop @keydown.stop />
                    <button @mousedown.stop @click.stop="note.riskData.targetRR = +(note.riskData.targetRR + 0.1).toFixed(1); saveBoardToLocal()" class="px-1.5 py-1 text-[#bbb] hover:text-amber-500 hover:bg-amber-500/10 transition-colors">
                      <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div v-if="note.riskData" class="mt-auto pt-2 border-t border-black/5 dark:border-white/5 flex flex-col gap-1.5 shrink-0">
                <div v-if="!getRiskNodeStats(note.id)" class="flex flex-col items-center justify-center py-3 gap-1.5">
                  <svg class="w-5 h-5 text-amber-300 dark:text-amber-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                  <span class="text-[10px] text-amber-500/60 dark:text-amber-700 text-center">No trades attached</span>
                </div>
                <div v-else class="bg-amber-500/5 dark:bg-amber-500/10 p-2 rounded-lg flex flex-col gap-1">
                  <div class="flex justify-between items-center text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-500">
                    <span>Risk per position</span>
                    <span class="font-bold font-mono">${{ (note.riskData.initialDeposit * (note.riskData.riskPerTrade / 100)).toFixed(0) }}</span>
                  </div>

                </div>
              </div>
            </div>
            <!-- Resize handles -->
            <div class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30" @mousedown.stop="startResize($event, note, 'nw')"></div>
            <div class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30" @mousedown.stop="startResize($event, note, 'ne')"></div>
            <div class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30" @mousedown.stop="startResize($event, note, 'sw')"></div>
            <div class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity z-30" @mousedown.stop="startResize($event, note, 'se')" title="Resize">
              <svg class="w-2.5 h-2.5 text-black/40 dark:text-white/40" viewBox="0 0 8 8" fill="currentColor"><path d="M0 8L8 0M4 8L8 4"/></svg>
            </div>
          </div>

          <!-- Comparison Node -->
          <div
            v-else-if="note.type === 'comparison'"
            class="absolute rounded-[14px] border border-solid shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col z-10 [will-change:transform] transition-[box-shadow,ring] duration-150 select-none hover:shadow-[0_6px_28px_rgba(0,0,0,0.13),0_2px_6px_rgba(0,0,0,0.06)] hover:z-20 dark:bg-[#1d1d1d] bg-white dark:border-white/10 border-black/10 dark:text-white text-[#050505] board-note"
            :class="{ 
              'ring-2 ring-indigo-500': selectedNoteId === note.id && !connectingFrom,
              'dragging': isDragging(note.id),
              'pointer-events-none opacity-30': isDrawingMode
            }"
            :style="noteStyle(note)"
            @mousedown.stop="startDrag($event, note)"
            @click.stop="onNoteClick(note)"
          >
            <div class="flex items-center justify-between px-3 pt-2.5 pb-2 bg-violet-500/10 dark:bg-violet-500/20 rounded-t-[14px] border-b border-violet-500/20 shrink-0 cursor-grab active:cursor-grabbing">
              <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider uppercase bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">Comparison</span>
              <button class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-rose-500 transition text-sm leading-none" @mousedown.stop @click.stop="removeNote(note.id)" title="Remove">×</button>
            </div>
            <div class="px-3 py-3 flex-1 flex flex-col gap-2 overflow-y-auto" @mousedown.stop>
              <!-- No strategies connected -->
              <div v-if="getComparisonData(note.id).length === 0" class="flex flex-col items-center justify-center py-6 gap-2">
                <svg class="w-7 h-7 text-violet-300 dark:text-violet-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                <span class="text-[10px] text-violet-400/70 dark:text-violet-700 text-center">Connect 2+ Strategy nodes</span>
              </div>
              <!-- Strategy columns -->
              <div v-else class="flex flex-col gap-3">
                <!-- Header row -->
                <div class="grid gap-1" :style="{ gridTemplateColumns: '90px ' + 'repeat(' + getComparisonData(note.id).length + ', 1fr)' }">
                  <div></div>
                  <div v-for="s in getComparisonData(note.id)" :key="s.id" class="text-center">
                    <span class="text-[9px] font-bold truncate block text-violet-600 dark:text-violet-400">{{ s.name }}</span>
                    <span class="text-[8px] text-[#999] dark:text-[#666]">{{ s.total }} trades</span>
                  </div>
                </div>
                <!-- Metrics rows -->
                <template v-for="metric in ['netProfit','winRate','avgRR']" :key="metric">
                  <div class="grid gap-1 items-center" :style="{ gridTemplateColumns: '90px ' + 'repeat(' + getComparisonData(note.id).length + ', 1fr)' }">
                    <span class="text-[8px] uppercase tracking-tighter text-[#999] dark:text-[#666]">
                      {{ metric === 'netProfit' ? 'Net Profit' : metric === 'winRate' ? 'Win Rate' : 'Avg R/R' }}
                    </span>
                    <div v-for="s in getComparisonData(note.id)" :key="s.id" class="text-center">
                      <span v-if="s.total === 0" class="text-[9px] text-[#999]">—</span>
                      <span v-else class="text-[11px] font-bold" :class="{
                        'text-emerald-600 dark:text-emerald-400': (s as any)[metric] >= 0 && metric !== 'avgRR',
                        'text-rose-500 dark:text-rose-400': (s as any)[metric] < 0 && metric !== 'avgRR',
                        'text-[#050505] dark:text-white': metric === 'avgRR'
                      }">
                        {{ metric === 'netProfit' ? ((s as any)[metric] >= 0 ? '+' : '') + (s as any)[metric].toFixed(1) + '%' : metric === 'winRate' ? (s as any)[metric].toFixed(1) + '%' : (s as any)[metric].toFixed(2) }}
                      </span>
                    </div>
                  </div>
                </template>
                <!-- Best performer badge -->
                <div v-if="getComparisonData(note.id).length >= 2" class="pt-2 border-t border-black/5 dark:border-white/5">
                  <span class="text-[8px] uppercase tracking-tighter text-[#999] dark:text-[#666]">Best Net Profit</span>
                  <div class="flex items-center gap-1 mt-0.5">
                    <span class="text-[10px] font-bold text-violet-600 dark:text-violet-400">
                      {{ getComparisonData(note.id).reduce((a, b) => a.netProfit >= b.netProfit ? a : b).name }}
                    </span>
                    <span class="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                      {{ getComparisonData(note.id).reduce((a, b) => a.netProfit >= b.netProfit ? a : b).netProfit >= 0 ? '+' : '' }}{{ getComparisonData(note.id).reduce((a, b) => a.netProfit >= b.netProfit ? a : b).netProfit.toFixed(1) }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <!-- Resize handles -->
            <div class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30" @mousedown.stop="startResize($event, note, 'nw')"></div>
            <div class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30" @mousedown.stop="startResize($event, note, 'ne')"></div>
            <div class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30" @mousedown.stop="startResize($event, note, 'sw')"></div>
            <div class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity z-30" @mousedown.stop="startResize($event, note, 'se')" title="Resize">
              <svg class="w-2.5 h-2.5 text-black/40 dark:text-white/40" viewBox="0 0 8 8" fill="currentColor"><path d="M0 8L8 0M4 8L8 4"/></svg>
            </div>
          </div>

          <!-- Entry Node -->
          <div
            v-else-if="note.type === 'entry_node'"
            class="absolute rounded-[14px] shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col z-10 [will-change:transform] transition-[box-shadow,ring] duration-150 select-none hover:shadow-[0_6px_28px_rgba(0,0,0,0.13),0_2px_6px_rgba(0,0,0,0.06)] hover:z-20 bg-white dark:bg-[#1d1d1d] text-[#050505] dark:text-white board-note overflow-hidden"
            :class="{ 
              'ring-2 ring-indigo-500/40': selectedNoteId === note.id && !connectingFrom,
              'ring-4 ring-indigo-400/40 dark:ring-indigo-600/40': connectingFrom === note.id,
              'dragging': isDragging(note.id),
              'pointer-events-none opacity-30': isDrawingMode
            }"
            :style="noteStyle(note)"
            @mousedown.stop="startDrag($event, note)"
            @click.stop="onNoteClick(note)"
          >
            <!-- Node Header -->
            <div class="flex items-center justify-between px-3 pt-2.5 pb-2 cursor-grab active:cursor-grabbing shrink-0 border-b border-black/5 dark:border-white/10">
              <div class="flex items-center gap-2">
                <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">Entry</span>
                <button 
                  class="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/20 transition-all border border-black/5 dark:border-white/5"
                  @mousedown.stop 
                  @click.stop="openDocEditor(note)"
                  title="Open Document Editor"
                >
                  <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  Edit
                </button>
              </div>
              <button class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-[#444] dark:hover:text-[#ccc] transition text-sm leading-none" @mousedown.stop @click.stop="removeNote(note.id)" title="Remove">×</button>
            </div>

            <!-- Preview Layer -->
            <div class="flex-1 overflow-hidden relative" style="min-height:20px;">
              <div 
                class="px-4 pb-4 pt-2 prose prose-sm dark:prose-invert max-w-none
                  prose-p:text-[12px] prose-p:leading-relaxed prose-p:my-1
                  prose-headings:my-2
                  prose-ul:my-2 prose-li:my-0.5
                  prose-img:rounded-lg prose-img:my-2"
                v-html="note.text || '<p class=\'text-[#ccc] dark:text-[#444] italic text-[11px]\'>No notes...</p>'"
              ></div>
              <!-- Fade out -->
              <div class="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white dark:from-[#1d1d1d] to-transparent pointer-events-none"></div>
            </div>

            <!-- Resize handles -->
            <div class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30" @mousedown.stop="startResize($event, note, 'nw')"></div>
            <div class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30" @mousedown.stop="startResize($event, note, 'ne')"></div>
            <div class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30" @mousedown.stop="startResize($event, note, 'sw')"></div>
            <div class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity z-30" @mousedown.stop="startResize($event, note, 'se')" title="Resize">
              <svg class="w-3 h-3 text-black/30 dark:text-white/30" viewBox="0 0 8 8" fill="currentColor"><path d="M0 8L8 0M4 8L8 4"/></svg>
            </div>
          </div>

          <!-- Exit Node -->
          <div
            v-else-if="note.type === 'exit_node'"
            class="absolute rounded-[14px] shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col z-10 [will-change:transform] transition-[box-shadow,ring] duration-150 select-none hover:shadow-[0_6px_28px_rgba(0,0,0,0.13),0_2px_6px_rgba(0,0,0,0.06)] hover:z-20 bg-white dark:bg-[#1d1d1d] text-[#050505] dark:text-white board-note overflow-hidden"
            :class="{ 
              'ring-2 ring-indigo-500/40': selectedNoteId === note.id && !connectingFrom,
              'ring-4 ring-indigo-400/40 dark:ring-indigo-600/40': connectingFrom === note.id,
              'dragging': isDragging(note.id),
              'pointer-events-none opacity-30': isDrawingMode
            }"
            :style="noteStyle(note)"
            @mousedown.stop="startDrag($event, note)"
            @click.stop="onNoteClick(note)"
          >
            <!-- Node Header -->
            <div class="flex items-center justify-between px-3 pt-2.5 pb-2 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-t-[14px] border-b border-black/5 dark:border-white/5 cursor-grab active:cursor-grabbing shrink-0">
              <div class="flex items-center gap-2">
                <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider uppercase bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">Exit</span>
                <button 
                  class="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/20 transition-all border border-black/5 dark:border-white/5"
                  @mousedown.stop 
                  @click.stop="openDocEditor(note)"
                  title="Open Document Editor"
                >
                  <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  Edit
                </button>
              </div>
              <button class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-[#444] dark:hover:text-[#ccc] transition text-sm leading-none" @mousedown.stop @click.stop="removeNote(note.id)" title="Remove">×</button>
            </div>

            <!-- Preview Layer -->
            <div class="flex-1 overflow-hidden relative" style="min-height:20px;">
              <div 
                class="px-4 pb-4 pt-2 prose prose-sm dark:prose-invert max-w-none
                  prose-p:text-[12px] prose-p:leading-relaxed prose-p:my-1
                  prose-headings:my-2
                  prose-ul:my-2 prose-li:my-0.5
                  prose-img:rounded-lg prose-img:my-2"
                v-html="note.text || '<p class=\'text-[#ccc] dark:text-[#444] italic text-[11px]\'>No notes...</p>'"
              ></div>
              <!-- Fade out -->
              <div class="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white dark:from-[#1d1d1d] to-transparent pointer-events-none"></div>
            </div>

            <!-- Resize handles -->
            <div class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30" @mousedown.stop="startResize($event, note, 'nw')"></div>
            <div class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30" @mousedown.stop="startResize($event, note, 'ne')"></div>
            <div class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30" @mousedown.stop="startResize($event, note, 'sw')"></div>
            <div class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity z-30" @mousedown.stop="startResize($event, note, 'se')" title="Resize">
              <svg class="w-3 h-3 text-black/30 dark:text-white/30" viewBox="0 0 8 8" fill="currentColor"><path d="M0 8L8 0M4 8L8 4"/></svg>
            </div>
          </div>

          <!-- Text Element (Annotation) -->
          <div
            v-else-if="note.type === 'text_element'"
            class="absolute flex flex-col z-10 [will-change:transform] board-note group rounded-xl transition-[shadow,ring] duration-150 select-none"
            :class="{ 
              'ring-2 ring-indigo-500 shadow-2xl bg-white dark:bg-[#1d1d1d]': selectedNoteId === note.id && !connectingFrom,
              'hover:ring-1 hover:ring-indigo-400/30': selectedNoteId !== note.id,
              'dragging': isDragging(note.id),
              'pointer-events-none opacity-30': isDrawingMode
            }"
            :style="noteStyle(note)"
            @mousedown.stop="startDrag($event, note)"
            @click.stop="onNoteClick(note)"
            @contextmenu.prevent="activeSTMenuId = note.id"
          >
            <!-- Minimalist Grab Header (Identical to other nodes' drag area) -->
            <div class="h-5 flex items-center justify-center cursor-grab active:cursor-grabbing shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div class="w-6 h-1 rounded-full bg-black/10 dark:bg-white/10"></div>
            </div>

            <div class="flex-1 flex items-center justify-center px-2 pb-2">
              <textarea 
                v-if="note.textElementData"
                v-model="note.textElementData.text"
                class="w-full h-full bg-transparent outline-none resize-none cursor-text text-center overflow-hidden border-none select-text leading-tight"
                spellcheck="false"
                @mousedown.stop
                @click.stop
                :style="{
                  color: note.textElementData.style.color,
                  fontWeight: note.textElementData.style.bold ? 'bold' : 'normal',
                  fontStyle: note.textElementData.style.italic ? 'italic' : 'normal',
                  fontSize: note.textElementData.style.fontSize + 'px'
                }"
              ></textarea>
            </div>

            <!-- Styling Menu (Floating) -->
            <div 
              v-if="activeSTMenuId === note.id && note.textElementData" 
              class="absolute -top-14 left-1/2 -translate-x-1/2 bg-white dark:bg-[#242424] border border-black/10 dark:border-white/10 rounded-xl shadow-2xl p-1.5 flex items-center gap-1.5 z-[300] min-w-max"
              :style="{ transform: `translateX(-50%) scale(${1 / transform.scale})`, transformOrigin: 'bottom center' }"
              @mousedown.stop
            >
              <button 
                class="w-7 h-7 rounded-lg flex items-center justify-center transition border border-transparent text-[#444] dark:text-[#ccc] hover:bg-black/5 dark:hover:bg-white/5"
                :class="{ 'bg-indigo-100 dark:bg-indigo-800/40 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300': note.textElementData.style.bold }"
                @mousedown.stop.prevent="note.textElementData.style.bold = !note.textElementData.style.bold"
                title="Bold"
              >
                <span class="font-bold text-xs">B</span>
              </button>
              <button 
                class="w-7 h-7 rounded-lg flex items-center justify-center transition border border-transparent text-[#444] dark:text-[#ccc] hover:bg-black/5 dark:hover:bg-white/5"
                :class="{ 'bg-indigo-100 dark:bg-indigo-800/40 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300': note.textElementData.style.italic }"
                @mousedown.stop.prevent="note.textElementData.style.italic = !note.textElementData.style.italic"
                title="Italic"
              >
                <span class="italic text-xs font-serif">I</span>
              </button>
              <div class="flex items-center gap-0.5 bg-black/5 dark:bg-white/5 rounded-lg px-1">
                <button @mousedown.stop.prevent="note.textElementData.style.fontSize = Math.max(8, note.textElementData.style.fontSize - 2)" class="p-1 text-[#555] dark:text-[#aaa] hover:text-black dark:hover:text-white transition text-xs font-bold leading-none">-</button>
                <span class="text-[9px] w-6 text-center font-mono text-[#333] dark:text-[#ccc]">{{ note.textElementData.style.fontSize }}</span>
                <button @mousedown.stop.prevent="note.textElementData.style.fontSize = Math.min(72, note.textElementData.style.fontSize + 2)" class="p-1 text-[#555] dark:text-[#aaa] hover:text-black dark:hover:text-white transition text-xs font-bold leading-none">+</button>
              </div>
              <div class="flex gap-1">
                <button 
                  v-for="color in textColors" 
                  :key="color"
                  class="w-4 h-4 rounded-full border-2 hover:scale-125 active:scale-95 transition-transform"
                  :style="{ backgroundColor: color }"
                  :class="note.textElementData!.style.color === color ? 'border-indigo-500' : 'border-black/10 dark:border-white/10'"
                  @mousedown.stop.prevent="note.textElementData!.style.color = color"
                ></button>
              </div>
              <div class="w-px h-4 bg-black/10 dark:bg-white/10 mx-0.5"></div>
              <button @mousedown.stop.prevent="removeNote(note.id)" class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition" title="Delete Label">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
              <div class="w-px h-4 bg-black/10 dark:bg-white/10 mx-0.5"></div>
              <button @mousedown.stop.prevent="activeSTMenuId = null" class="text-[10px] text-[#888] dark:text-[#666] hover:text-[#050505] dark:hover:text-white transition px-1.5 font-medium">Done</button>
            </div>

            <!-- Resize handles (only when selected) -->
            <template v-if="selectedNoteId === note.id">
              <div class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30" @mousedown.stop="startResize($event, note, 'nw')"></div>
              <div class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30" @mousedown.stop="startResize($event, note, 'ne')"></div>
              <div class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30" @mousedown.stop="startResize($event, note, 'sw')"></div>
              <div class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity z-30" @mousedown.stop="startResize($event, note, 'se')">
                <svg class="w-2.5 h-2.5 text-black/40 dark:text-white/40" viewBox="0 0 8 8" fill="currentColor"><path d="M0 8L8 0M4 8L8 4"/></svg>
              </div>
            </template>
          </div>

          <div
            v-else-if="note.type === 'text'"
            class="absolute rounded-[14px] border border-solid shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col z-10 [will-change:transform] transition-[box-shadow,ring] duration-150 select-none hover:shadow-[0_6px_28px_rgba(0,0,0,0.13),0_2px_6px_rgba(0,0,0,0.06)] hover:z-20 dark:bg-[#fef9c3]/10 bg-[#fef9c3] dark:border-yellow-400/20 border-yellow-300/60 dark:text-white text-[#050505] board-note overflow-hidden"
            :class="{ 
              'ring-2 ring-indigo-500': selectedNoteId === note.id,
              'dragging': isDragging(note.id),
              'pointer-events-none opacity-30': isDrawingMode
            }"
            :style="noteStyle(note)"
            @mousedown.stop="startDrag($event, note)"
            @click.stop="onNoteClick(note)"
            ref="textNoteRef"
          >
            <div class="flex items-center justify-between px-3 pt-2.5 pb-2 cursor-grab active:cursor-grabbing shrink-0">
              <div class="flex items-center gap-2">
                <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider uppercase bg-[#fef9c3] text-[#713f12] dark:bg-[#422006] dark:text-[#fde68a]">Text</span>
                <button 
                  class="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold tracking-wider uppercase bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/20 transition-all border border-black/5 dark:border-white/5"
                  @mousedown.stop 
                  @click.stop="openDocEditor(note)"
                  title="Open Document Editor"
                >
                  <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  Edit
                </button>
              </div>
              <button class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-[#444] dark:hover:text-[#ccc] transition text-sm leading-none" @mousedown.stop @click.stop="removeNote(note.id)" title="Remove">×</button>
            </div>
            <div
              class="flex-1 overflow-hidden relative group/preview"
              :data-note-id="note.id"
              @contextmenu.prevent.stop="showTextMenu($event, note)"
              @mousedown.stop
              style="min-height:100px;"
            >
              <!-- Content Layer -->
              <div 
                class="px-4 pb-4 prose prose-sm dark:prose-invert max-w-none
                  prose-p:text-[13px] prose-p:leading-relaxed prose-p:my-1
                  prose-headings:my-2 prose-headings:text-[#050505] dark:prose-headings:text-white
                  prose-ul:my-2 prose-li:my-0.5
                  prose-img:rounded-lg prose-img:my-2"
                v-html="note.text || '<p class=\'text-[#713f12]/40 dark:text-[#fde68a]/30 italic font-serif\'>Empty document...</p>'"
              ></div>

              <!-- Fade out effect for long text -->
              <div class="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#fef9c3] dark:from-[#1d1d1b] to-transparent pointer-events-none transition-opacity duration-300"></div>
            </div>
        
            <!-- Resize handles -->
            <div class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30" @mousedown.stop="startResize($event, note, 'nw')"></div>
            <div class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30" @mousedown.stop="startResize($event, note, 'ne')"></div>
            <div class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30" @mousedown.stop="startResize($event, note, 'sw')"></div>
            <div
              class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity z-30"
              @mousedown.stop="startResize($event, note, 'se')"
              title="Resize"
            >
              <svg class="w-3 h-3 text-black/30 dark:text-white/30" viewBox="0 0 8 8" fill="currentColor"><path d="M0 8L8 0M4 8L8 4"/></svg>
            </div>
          </div>

     
          <div
            v-else-if="note.type === 'image'"
            class="absolute rounded-[14px] border border-solid shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col z-10 [will-change:transform] transition-[box-shadow,ring] duration-150 select-none hover:shadow-[0_6px_28px_rgba(0,0,0,0.13),0_2px_6px_rgba(0,0,0,0.06)] hover:z-20 dark:bg-[#1d1d1d] bg-white dark:border-white/10 border-black/10 dark:text-white text-[#050505] board-note"
            :class="{ 'ring-2 ring-indigo-500': selectedNoteId === note.id }"
            :style="noteStyle(note)"
            @mousedown.stop="startDrag($event, note)"
            @click.stop="onNoteClick(note)"
          >
            <div class="flex items-center justify-between px-3 pt-2.5 pb-2 cursor-grab active:cursor-grabbing shrink-0">
              <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider uppercase bg-[#fce7f3] text-[#9d174d] dark:bg-[#500724] dark:text-[#fbcfe8]">Image</span>
              <button class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-[#444] dark:hover:text-[#ccc] transition text-sm leading-none" @mousedown.stop @click.stop="removeNote(note.id)" title="Remove">×</button>
            </div>
            <div class="px-3 pb-3 flex-1 flex flex-col min-h-0" @mousedown.stop>
              <div class="flex items-center gap-2 mb-2 shrink-0">
                <input
                  v-model="note.imageUrl"
                  placeholder="Paste URL or..."
                  class="flex-1 text-[10px] bg-transparent border-b border-black/10 dark:border-white/10 pb-1 focus:outline-none focus:border-indigo-400 transition placeholder-[#bbb] dark:placeholder-[#444]"
                  @mousedown.stop
                  @input="$forceUpdate()"
                />
                <label class="cursor-pointer bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 p-1.5 rounded-lg transition" title="Upload from PC">
                  <svg class="w-3.5 h-3.5 text-[#666] dark:text-[#aaa]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4-4m4 4v12"/></svg>
                  <input type="file" accept="image/*" class="hidden" @change="handleImageUpload($event, note.id)" />
                </label>
              </div>
              <div class="flex-1 min-h-0 rounded-lg overflow-hidden bg-black/3 dark:bg-white/3 flex items-center justify-center relative border border-black/5 dark:border-white/5">
                <img v-if="note.imageData || note.imageUrl" :src="note.imageData || note.imageUrl" class="max-w-full max-h-full object-contain block rounded-sm" alt="Note image" />
                <div v-if="!note.imageData && !note.imageUrl" class="text-center py-5 shrink-0">
                  <svg class="w-8 h-8 text-[#ccc] dark:text-[#444] mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <p class="text-[10px] text-[#bbb] dark:text-[#444]">Enter URL or upload</p>
                </div>
              </div>
            </div>
            <!-- Resize handles -->
            <div class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30" @mousedown.stop="startResize($event, note, 'nw')"></div>
            <div class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30" @mousedown.stop="startResize($event, note, 'ne')"></div>
            <div class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30" @mousedown.stop="startResize($event, note, 'sw')"></div>
            <div
              class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity z-30"
              @mousedown.stop="startResize($event, note, 'se')"
              title="Resize"
            >
              <svg class="w-2.5 h-2.5 text-black/40 dark:text-white/40" viewBox="0 0 8 8" fill="currentColor"><path d="M0 8L8 0M4 8L8 4"/></svg>
            </div>
          </div>

          <!-- Chart Note -->
          <div
            v-else-if="note.type === 'chart'"
            class="absolute rounded-[14px] border border-solid shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col z-10 [will-change:transform] transition-[box-shadow,ring] duration-150 select-none hover:shadow-[0_6px_28px_rgba(0,0,0,0.13),0_2px_6px_rgba(0,0,0,0.06)] hover:z-20 dark:bg-[#1d1d1d] bg-white dark:border-white/10 border-black/10 dark:text-white text-[#050505] board-note"
            :class="{ 
              'ring-2 ring-indigo-500': selectedNoteId === note.id && !connectingFrom,
              'ring-4 ring-indigo-400 dark:ring-indigo-600': connectingFrom === note.id,
              'dragging': isDragging(note.id),
              'pointer-events-none opacity-30': isDrawingMode
            }"
            :style="noteStyle(note)"
            @mousedown.stop="startDrag($event, note)"
            @click.stop="onNoteClick(note)"
          >
            <div class="flex items-center justify-between px-3 pt-2.5 pb-2 shrink-0 cursor-grab active:cursor-grabbing">
              <div class="flex items-center gap-2 flex-1">
                <span class="text-[9px] px-1.5 py-0.5 rounded-full font-bold tracking-wider uppercase bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300">Mini Chart</span>
                <input 
                  v-if="note.chartData?.symbol"
                  type="text" 
                  v-model.lazy="note.chartData.symbol" 
                  @change="saveBoardToLocal()"
                  @mousedown.stop 
                  @keydown.stop
                  @keydown.enter="($event.target as HTMLInputElement).blur()"
                  @blur="selectedNoteId = null"
                  placeholder="Symbol"
                  class="bg-black/5 dark:bg-white/10 text-xs uppercase font-bold px-3 py-1 rounded-md border border-transparent focus:border-cyan-500/50 outline-none w-32 shadow-sm text-[#050505] dark:text-[#fff] tracking-wide placeholder:text-black/30 dark:placeholder:text-white/30"
                />
              </div>
              <button class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-[#444] dark:hover:text-[#ccc] transition text-sm leading-none" @mousedown.stop @click.stop="removeNote(note.id)" title="Remove">×</button>
            </div>

            <div v-if="note.chartData && !note.chartData.symbol" class="flex-1 min-h-0 relative pointer-events-auto w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[#fafafa] dark:bg-[#0a0a0a] rounded-b-[14px]" @mousedown.stop>
              <span class="text-xs font-semibold text-[#888] dark:text-[#aaa] mb-3 tracking-wide">ENTER TICKER TO INITIALIZE</span>
              <input 
                type="text" 
                v-model.lazy="note.chartData.symbol" 
                @change="saveBoardToLocal()"
                @mousedown.stop 
                @keydown.stop
                @keydown.enter="($event.target as HTMLInputElement).blur()"
                @blur="selectedNoteId = null"
                placeholder="e.g. AAPL, BTCUSDT"
                class="bg-white dark:bg-[#222] text-sm uppercase font-bold px-4 py-2.5 rounded-lg border border-black/10 dark:border-white/10 focus:border-cyan-500/50 outline-none w-full max-w-[200px] shadow-sm text-[#050505] dark:text-[#fff] tracking-widest placeholder:text-black/20 dark:placeholder:text-white/20 text-center transition-all"
              />
            </div>
            <div v-else-if="note.chartData" class="flex-1 min-h-0 relative pointer-events-auto w-full h-full" @mousedown.stop>
              <TradingViewChart 
                :symbol="note.chartData.symbol" 
                @update:symbol="(sym: string) => { if(note.chartData) note.chartData.symbol = sym; saveBoardToLocal(); selectedNoteId = null; }"
              />
              <!-- Connection blocking overlay -->
              <div 
                v-if="connectingFrom" 
                class="absolute inset-0 z-50 cursor-pointer bg-transparent"
                @click.stop="onNoteClick(note)"
              ></div>
            </div>
            <!-- Resize handles -->
            <div class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30" @mousedown.stop="startResize($event, note, 'nw')"></div>
            <div class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30" @mousedown.stop="startResize($event, note, 'ne')"></div>
            <div class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30" @mousedown.stop="startResize($event, note, 'sw')"></div>
            <div
              class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity z-30"
              @mousedown.stop="startResize($event, note, 'se')"
              title="Resize"
            >
              <svg class="w-2.5 h-2.5 text-black/40 dark:text-white/40" viewBox="0 0 8 8" fill="currentColor"><path d="M0 8L8 0M4 8L8 4"/></svg>
            </div>
          </div>

          <!-- Conditions Node -->
          <div
            v-else-if="note.type === 'conditions'"
            class="absolute rounded-[14px] border border-solid shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col z-10 [will-change:transform] transition-[box-shadow,ring] duration-150 select-none hover:shadow-[0_6px_28px_rgba(0,0,0,0.13),0_2px_6px_rgba(0,0,0,0.06)] bg-white dark:bg-[#1d1d1d] border-black/10 dark:border-white/10 dark:text-white text-[#050505] board-note"
            :class="{ 
              'ring-2 ring-emerald-500': selectedNoteId === note.id && !connectingFrom,
              'ring-4 ring-indigo-400/40 dark:ring-indigo-600/40': connectingFrom === note.id,
              'dragging': isDragging(note.id),
              'pointer-events-none opacity-30': isDrawingMode
            }"
            :style="noteStyle(note)"
            @mousedown.stop="startDrag($event, note)"
            @click.stop="onNoteClick(note)"
          >
            <div class="flex items-center justify-between px-3.5 pt-3 pb-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-t-[14px] border-b border-black/5 dark:border-white/5 cursor-grab active:cursor-grabbing shrink-0">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <input 
                  v-model="note.conditionsName"
                  class="text-[10px] font-black uppercase tracking-[0.2em] text-[#888] dark:text-[#555] bg-transparent border-none outline-none focus:text-emerald-500 w-24 transition-colors"
                  @mousedown.stop
                  @keydown.stop
                  @blur="saveBoardToLocal()"
                  placeholder="Conditions"
                />
              </div>
              <button class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-[#444] dark:hover:text-[#ccc] transition text-sm leading-none" @mousedown.stop @click.stop="removeNote(note.id)" title="Remove">×</button>
            </div>

            <div class="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2.5">
              <div v-for="(cond, idx) in note.conditionsData" :key="cond.id" class="group relative flex items-start gap-3 p-2 rounded-xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-emerald-500/20">
                <!-- Label/Index -->
                <div class="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/20">
                  {{ idx + 1 }}
                </div>

                <!-- Name/Text Editor -->
                <div class="flex-1 min-w-0">
                  <textarea 
                    v-model="cond.text"
                    class="w-full text-xs font-semibold leading-relaxed outline-none break-all bg-transparent overflow-hidden resize-none focus:text-emerald-600 dark:focus:text-emerald-400 transition-colors"
                    placeholder="Enter condition..."
                    rows="1"
                    @input="($event.target as HTMLTextAreaElement).style.height = 'auto'; ($event.target as HTMLTextAreaElement).style.height = ($event.target as HTMLTextAreaElement).scrollHeight + 'px'"
                    @mousedown.stop
                    @keydown.stop
                    @blur="saveBoardToLocal()"
                  ></textarea>

                </div>

                <!-- Actions -->
                <div class="flex items-center gap-1 shrink-0">
                  <button 
                    @click.stop="openDocEditor(note, cond.id)"
                    class="p-1 rounded-md hover:bg-emerald-500/10 text-[#888] hover:text-emerald-500 transition-colors"
                    title="Edit Tactical Protocol"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <label class="cursor-pointer p-1 rounded-md hover:bg-emerald-500/10 transition-colors group/upload" title="Attach Image">
                    <svg class="w-3.5 h-3.5" :class="cond.imageData ? 'text-emerald-500' : 'text-[#888] group-hover/upload:text-emerald-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4-4m4 4v12"/></svg>
                    <input type="file" accept="image/*" class="hidden" @change="handleConditionImageUpload($event, note.id, cond.id)" />
                  </label>
                  <button v-if="cond.images?.length || cond.imageData" @click="openGallery(cond)" class="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors" title="View images">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    <span class="text-[10px] font-bold">{{ (cond.images?.length || 0) + (cond.imageData ? 1 : 0) }}</span>
                  </button>
                  <button @click="removeCondition(note.id, cond.id)" class="p-1 rounded-md hover:bg-rose-500/10 text-[#888] hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100" title="Remove Condition">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>

                <!-- (Removed Fixed Modal, now shows on board) -->
              </div>

              <button 
                @click="addCondition(note.id)"
                class="w-full py-2.5 rounded-xl border border-dashed border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/[0.03] transition-all flex items-center justify-center gap-2 group/add"
              >
                <div class="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover/add:bg-emerald-500 group-hover/add:text-white transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"/></svg>
                </div>
                <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70 group-hover/add:text-emerald-600 dark:group-hover/add:text-emerald-400">Add Condition</span>
              </button>
            </div>

            <!-- Resize handles -->
            <div class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30" @mousedown.stop="startResize($event, note, 'nw')"></div>
            <div class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30" @mousedown.stop="startResize($event, note, 'ne')"></div>
            <div class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30" @mousedown.stop="startResize($event, note, 'sw')"></div>
            <div
              class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity z-30"
              @mousedown.stop="startResize($event, note, 'se')"
              title="Resize"
            >
              <svg class="w-2.5 h-2.5 text-black/40 dark:text-white/40" viewBox="0 0 8 8" fill="currentColor"><path d="M0 8L8 0M4 8L8 4"/></svg>
            </div>
          </div>

          <!-- Scenario Node -->
          <div
            v-else-if="note.type === 'scenario'"
            class="absolute rounded-[14px] border border-solid shadow-[0_2px_16px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] flex flex-col z-10 [will-change:transform] transition-[box-shadow,ring] duration-150 select-none hover:shadow-[0_6px_28px_rgba(0,0,0,0.13),0_2px_6px_rgba(0,0,0,0.06)] bg-white dark:bg-[#1d1d1d] border-black/10 dark:border-white/10 dark:text-white text-[#050505] board-note"
            :class="{ 
              'ring-2 ring-indigo-500': selectedNoteId === note.id && !connectingFrom,
              'ring-4 ring-indigo-400/40 dark:ring-indigo-600/40': connectingFrom === note.id,
              'dragging': isDragging(note.id),
              'pointer-events-none opacity-30': isDrawingMode
            }"
            :style="noteStyle(note)"
            @mousedown.stop="startDrag($event, note)"
            @click.stop="onNoteClick(note)"
          >
            <div class="flex items-center justify-between px-3.5 pt-3 pb-2 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-t-[14px] border-b border-black/5 dark:border-white/5 cursor-grab active:cursor-grabbing shrink-0">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-500/20">
                  {{ note.scenarioData?.letter || '?' }}
                </div>
                <span class="text-[10px] font-black uppercase tracking-[0.2em] text-[#888] dark:text-[#555]">Scenario</span>
              </div>
              <button class="w-5 h-5 rounded-full flex items-center justify-center text-[#bbb] hover:bg-black/7 dark:hover:bg-white/10 hover:text-[#444] dark:hover:text-[#ccc] transition text-sm leading-none" @mousedown.stop @click.stop="removeNote(note.id)" title="Remove">×</button>
            </div>

            <div class="flex-1 flex flex-col p-4 custom-scrollbar">
              <input 
                v-if="note.scenarioData"
                v-model="note.scenarioData.name"
                @mousedown.stop
                @keydown.stop
                @blur="saveBoardToLocal()"
                placeholder="Scenario Name..."
                class="bg-transparent text-sm font-bold text-[#050505] dark:text-white mb-3 outline-none focus:text-indigo-500 transition-colors placeholder:text-black/20 dark:placeholder:text-white/20"
              />
              
              <div class="flex-1 min-h-0 flex flex-col gap-4">
                <!-- If Section -->
                <div class="flex-1 flex flex-col min-h-0">
                  <div class="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-500/60 dark:text-indigo-400/40 mb-2.5 flex items-center gap-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-indigo-500/40"></div>
                    If
                  </div>
                  <textarea 
                    v-if="note.scenarioData"
                    v-model="note.scenarioData.if"
                    @mousedown.stop
                    @keydown.stop
                    @blur="saveBoardToLocal()"
                    placeholder="Identify the trigger condition..."
                    class="flex-1 w-full bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 text-xs leading-relaxed outline-none border border-transparent focus:border-indigo-500/20 focus:bg-transparent transition-all resize-none font-medium text-[#444] dark:text-[#ccc] placeholder:text-[#bbb] dark:placeholder:text-[#444]"
                  ></textarea>
                </div>

                <!-- Then Section -->
                <div class="flex-1 flex flex-col min-h-0">
                  <div class="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-500/60 dark:text-indigo-400/40 mb-2.5 flex items-center gap-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-emerald-500/40"></div>
                    Then
                  </div>
                  <textarea 
                    v-if="note.scenarioData"
                    v-model="note.scenarioData.then"
                    @mousedown.stop
                    @keydown.stop
                    @blur="saveBoardToLocal()"
                    placeholder="Define the execution response..."
                    class="flex-1 w-full bg-black/[0.03] dark:bg-white/[0.03] rounded-xl p-3 text-xs leading-relaxed outline-none border border-transparent focus:border-indigo-500/20 focus:bg-transparent transition-all resize-none font-medium text-[#444] dark:text-[#ccc] placeholder:text-[#bbb] dark:placeholder:text-[#444]"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Resize handles -->
            <div class="absolute top-0 left-0 w-3 h-3 cursor-nw-resize z-30" @mousedown.stop="startResize($event, note, 'nw')"></div>
            <div class="absolute top-0 right-0 w-3 h-3 cursor-ne-resize z-30" @mousedown.stop="startResize($event, note, 'ne')"></div>
            <div class="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize z-30" @mousedown.stop="startResize($event, note, 'sw')"></div>
            <div
              class="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-30 hover:opacity-100 transition-opacity z-30"
              @mousedown.stop="startResize($event, note, 'se')"
              title="Resize"
            >
              <svg class="w-2.5 h-2.5 text-black/40 dark:text-white/40" viewBox="0 0 8 8" fill="currentColor"><path d="M0 8L8 0M4 8L8 4"/></svg>
            </div>
          </div>


        </template>
      </div>
    </div>


    <!-- ═══════════════════ TOOL INFO WIDGET ═══════════════════ -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-x-4 scale-95"
      enter-to-class="opacity-100 translate-x-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-x-0 scale-100"
      leave-to-class="opacity-0 translate-x-4 scale-95"
    >
      <div v-if="hoveredToolInfo" class="fixed top-24 right-8 z-[200] w-64 pointer-events-none">
        <div class="p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{{ hoveredToolInfo.title }}</span>
          </div>
          <p class="text-[11px] leading-relaxed text-white/40 font-medium">{{ hoveredToolInfo.desc }}</p>
        </div>
      </div>
    </Transition>

    <div
      v-if="textMenu.visible"
      class="fixed z-[99999] rounded-xl border border-solid shadow-[0_8px_32px_rgba(0,0,0,0.18)] flex items-center gap-0.5 p-1 dark:bg-[#222] bg-white dark:border-white/10 border-black/10 dark:text-white text-[#050505]"
      :style="{ left: textMenu.x + 'px', top: textMenu.y + 'px' }"
      @mousedown.prevent
    >
      <button @click="formatText('formatBlock', 'h1')" class="px-2.5 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition font-bold text-base">H1</button>
      <button @click="formatText('formatBlock', 'h2')" class="px-2.5 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition font-bold text-sm">H2</button>
      <div class="w-px h-4 bg-black/10 dark:bg-white/10 mx-0.5"></div>
      <button @click="formatText('bold')" class="px-2.5 py-1 text-xs rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition font-bold">B</button>
      <button @click="formatText('italic')" class="px-2.5 py-1 text-xs rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition italic">I</button>
    </div>


    <!-- ═══════════════════ BOTTOM TOOLBAR ═══════════════════ -->
    <div class="absolute bottom-0 right-0 h-14 border-t border-solid flex items-center justify-between px-6 z-[200] dark:bg-[#0a0a0a] bg-white dark:border-white/10 border-black/10 transition-all duration-300" :style="{ left: isResultListOpen ? '260px' : '0px' }">
      <div class="flex items-center gap-1.5">
        <button @click="addEmptyNote('text')" class="flex items-center justify-center p-2 rounded-xl text-[#444] hover:bg-black/5 hover:text-[#050505] dark:text-[#aaa] dark:hover:bg-white/7 dark:hover:text-white border border-transparent hover:border-black/10 dark:hover:border-white/10 transition" @mouseenter="hoveredToolInfo = { title: 'Text Note', desc: 'Add a rich text document for deep analysis, notes, or research.' }" @mouseleave="hoveredToolInfo = null">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        </button>
        <button @click="addEmptyNote('image')" class="flex items-center justify-center p-2 rounded-xl text-[#444] hover:bg-black/5 hover:text-[#050505] dark:text-[#aaa] dark:hover:bg-white/7 dark:hover:text-white border border-transparent hover:border-black/10 dark:hover:border-white/10 transition" @mouseenter="hoveredToolInfo = { title: 'Image Perspective', desc: 'Import screenshots, charts, or visual references from your device or URL.' }" @mouseleave="hoveredToolInfo = null">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </button>
        <button @click="addEmptyNote('chart')" class="flex items-center justify-center p-2 rounded-xl text-cyan-600 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-900/20 border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800/40 transition" @mouseenter="hoveredToolInfo = { title: 'Real-Time Chart', desc: 'Sync live TradingView charts directly onto your tactical board.' }" @mouseleave="hoveredToolInfo = null">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/></svg>
        </button>

        <div class="w-px h-6 bg-black/5 dark:bg-white/5 mx-1"></div>

        <button @click="addEmptyNote('strategy')" class="flex items-center justify-center p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/40 transition" @mouseenter="hoveredToolInfo = { title: 'Strategy Ledger', desc: 'Define your trading system rules. Connect to compare performance.' }" @mouseleave="hoveredToolInfo = null">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        </button>
        <button @click="addEmptyNote('risk_management')" class="flex items-center justify-center p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 dark:hover:border-blue-800/40 transition" @mouseenter="hoveredToolInfo = { title: 'Risk Calculator', desc: 'Manage position sizes and calculate target rewards dynamically.' }" @mouseleave="hoveredToolInfo = null">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
        </button>
        <button @click="addEmptyNote('comparison')" class="flex items-center justify-center p-2 rounded-xl text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20 border border-transparent hover:border-violet-200 dark:hover:border-violet-800/40 transition" @mouseenter="hoveredToolInfo = { title: 'Metric Comparator', desc: 'Analyze multiple strategy paths side-by-side to find the edge.' }" @mouseleave="hoveredToolInfo = null">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
        </button>
        <div class="w-px h-6 bg-black/5 dark:bg-white/5 mx-1"></div>

        <button @click="addEmptyNote('entry_node')" class="flex items-center justify-center p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/40 transition" @mouseenter="hoveredToolInfo = { title: 'Entry Trigger', desc: 'Define precise market entry points and logical confirmation signals.' }" @mouseleave="hoveredToolInfo = null">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
        </button>
        <button @click="addEmptyNote('exit_node')" class="flex items-center justify-center p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20 border border-transparent hover:border-rose-200 dark:hover:border-rose-800/40 transition" @mouseenter="hoveredToolInfo = { title: 'Exit Anchor', desc: 'Map out take-profit levels or invalidation zones for position removal.' }" @mouseleave="hoveredToolInfo = null">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </button>

        <div class="w-px h-6 bg-black/5 dark:bg-white/5 mx-1"></div>

        <button @click="addEmptyNote('conditions')" class="flex items-center justify-center p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800/40 transition" @mouseenter="hoveredToolInfo = { title: 'Condition List', desc: 'Create checklists with reference images for high-fidelity confirmation.' }" @mouseleave="hoveredToolInfo = null">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
        </button>
        <button @click="addEmptyNote('scenario')" class="flex items-center justify-center p-2 rounded-xl text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20 border border-transparent hover:border-violet-200 dark:hover:border-violet-800/40 transition" @mouseenter="hoveredToolInfo = { title: 'Tactical Scenario', desc: 'Build If-Then branches for complex multi-scenario planning.' }" @mouseleave="hoveredToolInfo = null">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 17v2m5-13l3 3m0 0l-3 3m3-3H9m0 0a2 2 0 01-2-2V5"/></svg>
        </button>

      </div>

      <div class="flex items-center gap-1.5 text-xs text-[#aaa] dark:text-[#555]">
        <svg v-if="connectingFrom" class="w-3.5 h-3.5 text-indigo-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        
        <span v-if="connectingFrom" class="text-indigo-500 dark:text-indigo-400 font-medium">Click another note to connect · <button @click="cancelConnect" class="underline">Cancel</button></span>
        <span v-else>Select a note, then click another to connect</span>
      </div>

      <div class="flex items-center gap-1.5">
        <button class="flex items-center justify-center p-2 rounded-xl text-[#444] hover:bg-black/5 hover:text-[#050505] dark:text-[#aaa] dark:hover:bg-white/7 dark:hover:text-white border border-transparent hover:border-black/10 dark:hover:border-white/10 transition" @click="exportBoard" title="Export board as JSON">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        </button>
        <button class="flex items-center justify-center p-2 rounded-xl text-[#444] hover:bg-black/5 hover:text-[#050505] dark:text-[#aaa] dark:hover:bg-white/7 dark:hover:text-white border border-transparent hover:border-black/10 dark:hover:border-white/10 transition" @click="triggerImport" title="Import board from JSON">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12"/></svg>
        </button>
      </div>
    </div>


    <input ref="importInputRef" type="file" accept=".json,.zip" class="hidden" @change="importBoard" />

    <!-- Graph Container (Hidden or used for secondary view) -->
    <div ref="graphContainer" class="hidden"></div>

    <!-- ═══════════════════ RIGHT ANNOTATION PANEL ═══════════════════ -->
    <div class="absolute top-1/2 -translate-y-1/2 right-6 flex items-center gap-3 z-[200]">
      <!-- Tool Settings Flyout (Slides out to the left) -->
      <transition 
        enter-active-class="transition duration-300 ease-out" 
        enter-from-class="opacity-0 translate-x-8 scale-95" 
        enter-to-class="opacity-100 translate-x-0 scale-100" 
        leave-active-class="transition duration-200 ease-in" 
        leave-from-class="opacity-100 translate-x-0 scale-100" 
        leave-to-class="opacity-0 translate-x-8 scale-95"
      >
        <div v-if="isDrawingMode && isToolSettingsOpen" 
             key="tool-settings-flyout"
             class="flex items-center gap-5 p-4 rounded-2xl bg-white/90 dark:bg-[#1d1d1d]/90 border border-black/5 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl">
          <!-- Color Switcher (Only for Brush) -->
          <div v-if="isBrushActive" class="flex flex-col gap-2.5 border-r border-black/5 dark:border-white/10 pr-5">
            <span class="text-[9px] font-black text-[#999] dark:text-[#555] uppercase tracking-[0.1em] text-center">Color</span>
            <div class="flex items-center gap-2">
              <button v-for="c in ['#6166f1', '#10b981', '#f59e0b', '#ef4444', '#ffffff']" 
                :key="c" @click="brushColor = c" 
                class="w-5 h-5 rounded-full border border-black/5 dark:border-white/10 shadow-sm transition-all hover:scale-125 active:scale-95"
                :class="{ 'ring-2 ring-indigo-500/50 ring-offset-2 dark:ring-offset-[#1d1d1d]': brushColor === c }"
                :style="{ backgroundColor: c }"
              ></button>
              <label class="relative cursor-pointer group">
                <div class="w-5 h-5 rounded-full border border-black/5 dark:border-white/10 shadow-sm transition-all group-hover:scale-125 bg-gradient-to-tr from-rose-400 via-indigo-500 to-emerald-400"></div>
                <input type="color" v-model="brushColor" class="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
              </label>
            </div>
          </div>

          <!-- Size Control -->
          <div class="flex flex-col gap-2 min-w-[110px]">
            <div class="flex justify-between items-center px-0.5">
              <span class="text-[9px] font-black text-[#999] dark:text-[#555] uppercase tracking-[0.1em]">{{ isEraserActive ? 'Eraser' : 'Size' }}</span>
              <span class="text-[10px] font-bold text-indigo-500">{{ isEraserActive ? eraserThickness : brushThickness }}px</span>
            </div>
            <input v-if="isEraserActive" type="range" 
              v-model.number="eraserThickness" 
              min="5" 
              max="100" 
              class="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 transition-all hover:bg-black/10 dark:hover:bg-white/20"
            />
            <input v-if="isBrushActive" type="range" 
              v-model.number="brushThickness" 
              min="1" 
              max="50" 
              class="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 transition-all hover:bg-black/10 dark:hover:bg-white/20"
            />
          </div>
        </div>
      </transition>

      <!-- Main Toolbar -->
      <div class="flex flex-col gap-2 p-2 rounded-2xl bg-white/80 dark:bg-[#1d1d1d]/80 border border-black/5 dark:border-white/10 shadow-xl backdrop-blur-md">
        <!-- Add Label -->
        <button 
          class="w-10 h-10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-black/5 dark:hover:bg-white/5 transition"
          @click="addEmptyNote('text_element')"
          title="Add Text Label"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
        </button>
        
        <div class="w-full h-px bg-black/5 dark:bg-white/5 mx-auto"></div>

        <!-- Brush Toggle -->
        <button 
          class="w-10 h-10 rounded-xl flex items-center justify-center transition"
          :class="isBrushActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#444] dark:text-[#aaa]'"
          @click="isBrushActive = !isBrushActive; if(isBrushActive) isEraserActive = false" 
          title="Toggle Brush Tool"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
        </button>

        <!-- Eraser Toggle -->
        <button 
          class="w-10 h-10 rounded-xl flex items-center justify-center transition"
          :class="isEraserActive ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-black/5 dark:hover:bg-white/5 text-[#444] dark:text-[#aaa]'"
          @click="isEraserActive = !isEraserActive; if(isEraserActive) isBrushActive = false" 
          title="Toggle Eraser Tool"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11L10 20l-7-7 9-9 7 7zm-5-5l5 5M2 22h20"/></svg>
        </button>

        <!-- Tool Settings Button -->
        <Transition name="fade">
          <button 
            v-if="isDrawingMode"
            class="w-10 h-10 rounded-xl flex items-center justify-center transition-all border-t border-black/5 dark:border-white/10 mt-1"
            :class="isToolSettingsOpen ? 'bg-indigo-500 text-white' : 'text-[#444] dark:text-[#aaa] hover:bg-black/5 dark:hover:bg-white/5'"
            @click="isToolSettingsOpen = !isToolSettingsOpen"
            title="Tool Settings"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
          </button>
        </Transition>

        <!-- Clear Drawings Button -->
        <Transition name="fade">
          <button 
            v-if="isDrawingMode"
            class="w-10 h-10 rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-500/10 active:bg-rose-500/20 transition-all border-t border-black/5 dark:border-white/10 mt-1"
            title="Clear All Drawings"
            @click="clearBoardDrawings()" 
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </Transition>
      </div>
    </div>

    <!-- ═══════════════════ CUSTOM TOOL CURSOR ═══════════════════ -->
    <div 
      v-if="(isBrushActive || isEraserActive) && mouseScreenPos"
      class="fixed pointer-events-none rounded-full border z-[9999] opacity-70"
      :class="isEraserActive ? 'border-black/50 dark:border-white/50 bg-black/10 dark:bg-white/10' : 'border-black/20 dark:border-white/20'"
      :style="{
        left: `${mouseScreenPos.x}px`,
        top: `${mouseScreenPos.y}px`,
        width: `${(isEraserActive ? eraserThickness : brushThickness) * transform.scale}px`,
        height: `${(isEraserActive ? eraserThickness : brushThickness) * transform.scale}px`,
        transform: 'translate(-50%, -50%)',
        backgroundColor: isEraserActive ? undefined : brushColor
      }"
    ></div>

    <!-- ═══════════════════ TOAST NOTIFICATIONS ═══════════════════ -->
    <div class="fixed top-6 left-1/2 -translate-x-1/2 z-[3000] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup 
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-[-100%] opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div 
          v-for="toast in toasts" 
          :key="toast.id"
          class="px-4 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-2.5 min-w-[280px] pointer-events-auto"
          :class="toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' : 'bg-white/90 dark:bg-[#1d1d1d]/90 border-black/5 dark:border-white/10 dark:text-white text-[#050505]'"
        >
          <div v-if="toast.type === 'success'" class="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
          </div>
          <div v-else class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
          </div>
          <span class="text-sm font-medium">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>

    <!-- ─── Document Editor Side Panel ─── -->
    <Transition
      enter-active-class="transition duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div v-if="isDocEditorOpen && docEditingNote" class="fixed top-0 right-0 h-full w-[600px] z-[2000] flex flex-col bg-white dark:bg-[#1d1d1d] shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-black/5 dark:border-white/10" @mousedown.stop>
        
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-black/5 dark:border-white/10 shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-600 dark:text-yellow-400 border border-yellow-400/20">
              <svg v-if="!docEditingConditionId" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              <div v-else class="text-xs font-black uppercase tracking-tighter">C{{ getConditionIndex(docEditingNote, docEditingConditionId) + 1 }}</div>
            </div>
            <div>
              <h2 class="text-sm font-bold text-[#050505] dark:text-white uppercase tracking-[0.1em]">
                {{ docEditingConditionId ? 'Item Specification' : 'Document Editor' }}
              </h2>
              <p class="text-[10px] text-[#888] font-medium uppercase tracking-[0.1em]">
                {{ docEditingConditionId ? ('Condition Item #' + (getConditionIndex(docEditingNote, docEditingConditionId) + 1)) : ('Editing note ' + docEditingNote?.id.slice(0, 8)) }}
              </p>
            </div>
          </div>
          <button @click="closeDocEditor" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-[#666] dark:text-[#aaa] transition">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Toolbar -->
        <div class="flex flex-wrap items-center gap-1.5 px-4 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/10 shrink-0 text-[#444] dark:text-[#ccc]">
          <!-- Headings -->
          <button @click="formatDoc('formatBlock', '<h1>')" class="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-[#2d2d2d] border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition" title="Heading 1">H1</button>
          <button @click="formatDoc('formatBlock', '<h2>')" class="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-[#2d2d2d] border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition" title="Heading 2">H2</button>
          <button @click="formatDoc('formatBlock', '<h3>')" class="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-white dark:bg-[#2d2d2d] border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition" title="Heading 3">H3</button>
          
          <div class="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-1"></div>

          <!-- Styles -->
          <button @click="formatDoc('bold')" class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition" title="Bold">
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 4h8a4 4 0 010 8H6zM6 12h9a4 4 0 010 8H6z"/></svg>
          </button>
          <button @click="formatDoc('italic')" class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition" title="Italic">
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 20l4-16m-4 0h4m-4 16h4"/></svg>
          </button>
          <button @click="formatDoc('underline')" class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition" title="Underline">
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 4v7a4 4 0 01-8 0V4M8 20h8"/></svg>
          </button>

          <div class="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-1"></div>

          <!-- Lists -->
          <button @click="formatDoc('insertUnorderedList')" class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition" title="Bullet List">
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <button @click="formatDoc('insertOrderedList')" class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition" title="Numbered List">
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
          </button>

          <!-- Image -->
          <label class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer" title="Insert Image" @mousedown="saveSelectionRange">
             <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
             <input ref="docImageInputRef" type="file" accept="image/*" class="hidden" @change="insertImageInDoc($event)" />
          </label>

          <div class="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-1"></div>

          <!-- Font Family -->
          <div class="relative">
            <button @click="isFontMenuOpen = !isFontMenuOpen" class="flex items-center gap-1.5 text-[10px] rounded-lg px-2 py-1.5 bg-white dark:bg-[#2d2d2d] border border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition outline-none font-bold relative z-20" title="Font Family">
              {{ selectedFontLabel }}
              <svg class="w-3 h-3 text-black/40 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <template v-if="isFontMenuOpen">
              <div class="fixed inset-0 z-10" @click="isFontMenuOpen = false"></div>
              <div class="absolute top-[calc(100%+4px)] left-0 w-28 bg-white dark:bg-[#2d2d2d] border border-black/10 dark:border-white/10 rounded-lg shadow-xl z-20 py-1">
                <button 
                  v-for="font in docFonts" 
                  :key="font.value"
                  @click="selectFont(font)"
                  class="w-full text-left px-3 py-1.5 text-[11px] font-bold hover:bg-black/5 dark:hover:bg-white/10 transition text-[#050505] dark:text-[#eee]"
                >{{ font.label }}</button>
              </div>
            </template>
          </div>

          <div class="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-1"></div>

          <!-- Color Picker -->
          <label class="relative w-5 h-5 rounded-full overflow-hidden border border-black/10 dark:border-white/20 shadow-sm cursor-pointer group flex items-center justify-center shrink-0" title="Custom Color">
            <div class="absolute inset-0 bg-gradient-to-tr from-rose-500 via-blue-500 to-emerald-500 opacity-90 group-hover:opacity-100 transition-opacity"></div>
            <input type="color" class="opacity-0 absolute inset-[-10px] w-[200%] h-[200%] cursor-pointer" @input="formatDoc('foreColor', ($event.target as HTMLInputElement).value)" />
          </label>
        </div>

        <div class="flex-1 overflow-y-auto p-12 bg-[#fafafa] dark:bg-[#050505]" @scroll="updateImageOverlay">
          
          <!-- Image Resize/Delete Overlay -->
          <div 
            v-if="activeDocImage" 
            class="fixed z-[2500] border-2 border-indigo-500 pointer-events-none"
            :style="{
              top: imageOverlayRect.top + 'px',
              left: imageOverlayRect.left + 'px',
              width: imageOverlayRect.width + 'px',
              height: imageOverlayRect.height + 'px',
            }"
          >
            <!-- Delete Button -->
            <button class="absolute -top-3 -right-3 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center pointer-events-auto hover:bg-rose-600 shadow-xl" @mousedown.stop.prevent="deleteActiveImage" title="Delete Image">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            
            <!-- Resize Handle Bottom-Right -->
            <div class="absolute -bottom-2 -right-2 w-4 h-4 bg-white dark:bg-black border-2 border-indigo-500 rounded-full cursor-nwse-resize pointer-events-auto shadow-sm" @mousedown.stop.prevent="startImageResize($event, 'se')"></div>
            <!-- Resize Handle Bottom-Left -->
            <div class="absolute -bottom-2 -left-2 w-4 h-4 bg-white dark:bg-black border-2 border-indigo-500 rounded-full cursor-nesw-resize pointer-events-auto shadow-sm" @mousedown.stop.prevent="startImageResize($event, 'sw')"></div>
          </div>

          <div 
            ref="docEditorRef"
            class="min-h-full max-w-2xl mx-auto outline-none select-text prose dark:prose-invert text-lg leading-relaxed focus:ring-0 break-words relative
              [&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mb-8 [&_h1]:tracking-tight [&_h1]:text-[#050505] dark:[&_h1]:text-white
              [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-[#050505] dark:[&_h2]:text-white
              [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-[#050505] dark:[&_h3]:text-white
              [&_p]:mb-6 [&_p]:text-[#444] dark:[&_p]:text-[#ccc]
              [&_img]:rounded-2xl [&_img]:shadow-2xl [&_img]:border [&_img]:border-black/5 dark:[&_img]:border-white/10 [&_img]:max-w-full
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6 [&_ul]:space-y-2 [&_ul]:text-[#444] dark:[&_ul]:text-[#ccc]
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6 [&_ol]:space-y-2 [&_ol]:text-[#444] dark:[&_ol]:text-[#ccc]
              [&_li]:marker:text-[#888] dark:[&_li]:marker:text-[#666]
            "
            contenteditable="true"
            @input="onDocInput"
            @mousedown="onDocEditorMouseDown"
            @dragstart.prevent="onDocDragStart"
            @keyup="onDocKeyUp"
          ></div>
        </div>

        <div class="px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/5 dark:border-white/10 flex items-center justify-between shrink-0">
          <span class="text-[10px] text-[#888] font-bold uppercase tracking-widest">Autosaving to local storage</span>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">Ready</span>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { collection, getDocs, query, orderBy, limit, getDoc, doc } from 'firebase/firestore'
import { db } from '~/shared/firebase.client'
import { useAuthStore } from '~/entities/user/auth.store'
import { useForumStore } from '~/features/store/useForum'
import type { Thread } from '~/entities/thread/model/thread.types'
import type { DiaryEntry } from '~/entities/diary/model/diary.types'
import { threadConverter } from '~/composables/typeConverters'
import JSZip from 'jszip'
import Graph from 'graphology'
import Sigma from 'sigma'
import TradingViewChart from './TradingViewChart.vue'
import { useThemeStore } from '~/features/store/useTheme'

const themeStore = useThemeStore()
import { 
  removeFromDisk 
} from '~/shared/diskStorage'
import { useBoardStore } from '~/features/store/useBoard'

const boardStore = useBoardStore()

// ─── Types ───────────────────────────────────────────────────────────────────

// BoardMeta and types are now in the store
import type { Board, BoardNote, Connection, DrawingPath, Folder } from '~/features/store/useBoard'

function getLiveTradeData(note: BoardNote) {
  if (note.type !== 'trade' || !note.tradeData) return null;
  const uid = auth.user?.uid;
  if (!uid) return note.tradeData;
  return forum.users.get(uid)?.diary?.find((t: DiaryEntry) => t.id === note.tradeData!.id) || note.tradeData;
}

// ─── State ───────────────────────────────────────────────────────────────────

const auth = useAuthStore()
const forum = useForumStore()
const rootRef = ref<HTMLElement>()
const canvasWrapRef = ref<HTMLElement>()
const importInputRef = ref<HTMLInputElement>()
const textNoteRef = ref()
const isResultListOpen = ref(true);
const hoveredToolInfo = ref<{ title: string; desc: string } | null>(null)

// Boards State (Moved to Store)
const boards = computed(() => boardStore.boards)
const activeBoardId = computed({
  get: () => boardStore.activeBoardId,
  set: (val) => boardStore.activeBoardId = val
})
const activeBoard = computed(() => boardStore.activeBoard)

// Proxies to active board state
const notes = computed({
  get: () => {
    const b = activeBoard.value
    return b ? b.notes : []
  },
  set: (val) => {
    const b = activeBoard.value
    if (b) b.notes = val
  }
})
const connections = computed({
  get: () => {
    const b = activeBoard.value
    return b ? b.connections : []
  },
  set: (val) => {
    const b = activeBoard.value
    if (b) b.connections = val
  }
})

// Transform - maintain reactive object but sync with active board
const transform = reactive({ x: 0, y: 0, scale: 1 })

watch(activeBoardId, (newId) => {
  const b = boards.value.find(x => x.id === newId)
  if (b) {
    transform.x = b.transform.x
    transform.y = b.transform.y
    transform.scale = b.transform.scale
  }
}, { immediate: true })

// Keep transform in sync with active board object for persistence
watch(transform, (newVal) => {
  const b = boards.value.find(x => x.id === activeBoardId.value)
  if (b) {
    b.transform.x = newVal.x
    b.transform.y = newVal.y
    b.transform.scale = newVal.scale
  }
}, { deep: true })

// Sidebar
const sidebarTab = ref<'threads' | 'trades'>('threads')
const searchQuery = ref('')
const allThreads = ref<Thread[]>([])
const allTrades = ref<DiaryEntry[]>([])
const isSearching = ref(false)
const activeSTMenuId = ref<string | null>(null)
const fontSizes = [12, 14, 16, 18, 24, 32, 48]
const textColors = ['#000000', '#FFFFFF', '#EF4444', '#22C55E', '#3B82F6', '#F59E0B', '#A855F7']

// Brush / Eraser / Drawing
const isBrushActive = ref(false)
const brushColor = ref('#3B82F6')
const brushThickness = ref(3)

const isEraserActive = ref(false)
const eraserThickness = ref(20)

const isDrawingMode = computed(() => isBrushActive.value || isEraserActive.value)
const isToolSettingsOpen = ref(false)
const activeConditionImages = ref<string[] | null>(null)
const activeGalleryIndex = ref(0)
const activeConditionImage = computed(() => activeConditionImages.value ? activeConditionImages.value[activeGalleryIndex.value] || null : null)
const isLayersPanelOpen = ref(false)
const activeLayerMenuId = ref<string | null>(null)

// Custom Drag and Drop State
const isDraggingLayer = ref(false)
const draggedLayerId = ref<string | null>(null)
const dragMouseY = ref(0)
const dragStartY = ref(0)
const dragCurrentY = ref(0)
const dragOverFolderId = ref<string | null>(null)
const dragOverNodeId = ref<string | null>(null)
const dragIsFolder = ref(false)
const dragInsertIndex = ref<number | null>(null)

const folders = computed({
  get: () => activeBoard.value?.folders || [],
  set: (val) => {
    if (activeBoard.value) activeBoard.value.folders = val
  }
})

watch(isDrawingMode, (newVal) => {
  if (!newVal) {
    isToolSettingsOpen.value = false
  }
})
const isDrawing = ref(false)
const currentPath = ref<DrawingPath | null>(null)
const mouseScreenPos = ref<{ x: number; y: number } | null>(null)

// Toast system
const toasts = ref<{ id: number; message: string; type: 'success' | 'error' }[]>([])
const showStrategyLimitWarning = ref(false)
let toastId = 0
function showToast(message: string, type: 'success' | 'error' = 'success') {
  const id = ++toastId
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 4000)
}

// Label placement
const placingNodeType = ref<BoardNote['type'] | null>(null)
const placingNodeData = ref<any>(null)

// Drawings helper – always mutate the board's array directly to avoid computed setter issues
function getBoardDrawings(): DrawingPath[] {
  const b = activeBoard.value
  if (!b) return []
  if (!b.drawings) b.drawings = []
  return b.drawings
}

function clearBoardDrawings() {
  const b = activeBoard.value
  if (b) {
    b.drawings = []
    saveBoardToLocal()
  }
}

// Filtered views (client-side)
const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return allThreads.value
  return allThreads.value.filter(t =>
    t.title?.toLowerCase().includes(q) ||
    t.description?.toLowerCase().includes(q) ||
    t.category?.toLowerCase().includes(q)
  )
})

const tradeResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return allTrades.value
  return allTrades.value.filter(t =>
    t.asset?.toLowerCase().includes(q) ||
    t.notes?.toLowerCase().includes(q)
  )
})

// Sessions
const dragSession = ref<{ noteId: string; startX: number; startY: number; initialX: number; initialY: number; moved: boolean } | null>(null)
const panSession = ref<{ startX: number; startY: number; initialOX: number; initialOY: number } | null>(null)
const resizeSession = ref<{ noteId: string; startX: number; startY: number; initialW: number; initialH: number; initialX: number; initialY: number; corner: 'nw' | 'ne' | 'sw' | 'se' } | null>(null)

// Connection
const connectingFrom = ref<string | null>(null)
const selectedNoteId = ref<string | null>(null)
const mousePos = ref<{ x: number; y: number } | null>(null)
const isInteracting = ref(false)

// Text menu
const textMenu = reactive({ visible: false, x: 0, y: 0, noteId: '' })
let activeTextNote: BoardNote | null = null

// Document Editor State
const isDocEditorOpen = ref(false)
const docEditingNote = ref<BoardNote | null>(null)
const docEditingConditionId = ref<string | null>(null)
const docEditorRef = ref<HTMLElement | null>(null)
const boardTabRefs = reactive<Record<string, HTMLElement>>({})

const activeBoardTabWidth = computed(() => {
  const activeId = activeBoardId.value
  if (!activeId || !boardTabRefs[activeId]) return 0
  return (boardTabRefs[activeId] as HTMLElement).offsetWidth
})

const activeBoardTabLeft = computed(() => {
  const activeId = activeBoardId.value
  if (!activeId || !boardTabRefs[activeId]) return 0
  return (boardTabRefs[activeId] as HTMLElement).offsetLeft
})

function setActiveBoard(id: string) {
  activeBoardId.value = id
}

function isDragging(noteId: string) {
  return dragSession.value?.noteId === noteId && dragSession.value?.moved
}
const isDark = ref(false)

const isFontMenuOpen = ref(false)
const selectedFontLabel = ref('Serif')
const docFonts = [
  { label: 'Serif', value: 'font-serif' },
  { label: 'Sans', value: 'font-sans' },
  { label: 'Mono', value: 'font-mono' },
  { label: 'Georgia', value: "'Georgia, serif'" },
  { label: 'Courier', value: "'Courier New, monospace'" },
]

// Graph state
const graph = new Graph()
let sigmaInstance = ref<Sigma | null>(null)
const sigmaReady = ref(false)
const graphContainer = ref<HTMLElement | null>(null)

function updateGraph() {
  if (!graph || !sigmaInstance.value) return
  graph.clear()
  
  // Add nodes
  notes.value.forEach(note => {
    let label = ''
    if (note.type === 'thread') label = note.threadData?.title || 'Thread'
    else if (note.type === 'trade') label = note.tradeData?.asset || 'Trade'
    else if (note.type === 'text') label = 'Note'
    else label = note.type
    
    graph.addNode(note.id, {
      label,
      x: Math.random(),
      y: Math.random(),
      size: 10,
      color: note.type === 'trade' ? '#10b981' : (note.type === 'thread' ? '#6366f1' : '#f59e0b')
    })
  })
  
  // Add edges
  connections.value.forEach(conn => {
    if (graph.hasNode(conn.fromId) && graph.hasNode(conn.toId)) {
      graph.addEdge(conn.fromId, conn.toId, { color: '#6366f1', size: 2 })
    }
  })
}

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
  const observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark')
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

function openDocEditor(note: BoardNote, conditionId?: string) {
  docEditingNote.value = note
  docEditingConditionId.value = conditionId || null
  isDocEditorOpen.value = true
  selectedNoteId.value = note.id
  
  nextTick(() => {
    if (docEditorRef.value) {
      if (conditionId && note.conditionsData) {
        const cond = note.conditionsData.find(c => c.id === conditionId)
        docEditorRef.value.innerHTML = cond?.description || ''
      } else {
        docEditorRef.value.innerHTML = note.text || ''
      }
    }
  })
}

function closeDocEditor() {
  isDocEditorOpen.value = false
  docEditingNote.value = null
  docEditingConditionId.value = null
  activeDocImage.value = null
  saveBoardToLocal()
}

function formatDoc(command: string, value: string | null = null) {
  document.execCommand(command, false, value || '')
  syncDocEditor()
  updateImageOverlay()
}

function syncDocEditor() {
  if (docEditingNote.value && docEditorRef.value) {
    if (docEditingConditionId.value && docEditingNote.value.conditionsData) {
      const cond = docEditingNote.value.conditionsData.find(c => c.id === docEditingConditionId.value)
      if (cond) cond.description = docEditorRef.value.innerHTML
    } else {
      docEditingNote.value.text = docEditorRef.value.innerHTML
    }
  }
}

function onDocInput() {
  syncDocEditor()
  updateImageOverlay()
}

function getConditionIndex(note: BoardNote | null, conditionId: string | null): number {
  if (!note || !conditionId || !note.conditionsData) return -1
  return note.conditionsData.findIndex(c => c.id === conditionId)
}

// ─── Document Editor Image Interactions ───

const activeDocImage = ref<HTMLImageElement | null>(null)
const imageOverlayRect = reactive({ top: 0, left: 0, width: 0, height: 0 })

function updateImageOverlay() {
  if (!activeDocImage.value) return
  // Hide if disconnected from DOM
  if (!document.contains(activeDocImage.value)) {
    activeDocImage.value = null
    return
  }
  const rect = activeDocImage.value.getBoundingClientRect()
  imageOverlayRect.top = rect.top
  imageOverlayRect.left = rect.left
  imageOverlayRect.width = rect.width
  imageOverlayRect.height = rect.height
}

let isDraggingDocImage = false
let dragDocImageStart = { x: 0, y: 0, initialLeft: 0, initialTop: 0 }
let dragSpacer: HTMLElement | null = null

function startImageDrag(e: MouseEvent) {
  if (!activeDocImage.value || !docEditorRef.value) return
  isDraggingDocImage = true
  
  const img = activeDocImage.value
  const style = window.getComputedStyle(img)
  const left = parseInt(style.left) || 0
  const top = parseInt(style.top) || 0
  
  dragDocImageStart = {
    x: e.clientX,
    y: e.clientY,
    initialLeft: left,
    initialTop: top
  }
  
  // 1. Create spacer
  dragSpacer = document.createElement('div')
  dragSpacer.style.width = img.offsetWidth + 'px'
  dragSpacer.style.height = img.offsetHeight + 'px'
  dragSpacer.style.display = 'block'
  dragSpacer.style.float = img.style.float || 'left'
  dragSpacer.style.margin = img.style.margin || '0 1.5rem 1rem 0'
  dragSpacer.style.background = 'transparent'
  dragSpacer.id = 'drag-spacer'
  
  // 2. Put spacer where image was
  img.after(dragSpacer)
  
  // 3. Make image absolute and semi-transparent
  const rect = img.getBoundingClientRect()
  const parentRect = docEditorRef.value.getBoundingClientRect()
  img.style.position = 'absolute'
  img.style.zIndex = '3000'
  img.style.opacity = '0.85'
  img.style.pointerEvents = 'none'
  img.style.left = (rect.left - parentRect.left + docEditorRef.value.scrollLeft) + 'px'
  img.style.top = (rect.top - parentRect.top + docEditorRef.value.scrollTop) + 'px'
  
  dragDocImageStart.initialLeft = parseInt(img.style.left)
  dragDocImageStart.initialTop = parseInt(img.style.top)

  document.addEventListener('mousemove', onImageDragMove)
  document.addEventListener('mouseup', onImageDragUp)
}

function onImageDragMove(e: MouseEvent) {
  if (!isDraggingDocImage || !activeDocImage.value || !docEditorRef.value) return
  
  const img = activeDocImage.value
  const editor = docEditorRef.value
  const dx = e.clientX - dragDocImageStart.x
  const dy = e.clientY - dragDocImageStart.y
  
  // SMOOTH PIXEL-PERFECT MOVEMENT BY Y (NO GRID SNAPPING)
  const smoothTop = dragDocImageStart.initialTop + dy
  
  img.style.left = (dragDocImageStart.initialLeft + dx) + 'px'
  img.style.top = smoothTop + 'px'
  
  // 1. Update Spacer Position & Zone in DOM
  const editorRect = editor.getBoundingClientRect()
  const relativeX = e.clientX - editorRect.left
  const zoneWidth = editorRect.width / 3
  
  let zone: 'left' | 'center' | 'right' = 'left'
  if (relativeX < zoneWidth) zone = 'left'
  else if (relativeX < zoneWidth * 2) zone = 'center'
  else zone = 'right'
  
  if (dragSpacer) {
    if (zone === 'center') {
      dragSpacer.style.float = 'none'
      dragSpacer.style.display = 'block'
      dragSpacer.style.margin = '1rem auto'
    } else {
      const isRight = zone === 'right'
      dragSpacer.style.float = isRight ? 'right' : 'left'
      dragSpacer.style.display = 'block'
      dragSpacer.style.margin = isRight ? '0 0 1rem 1.5rem' : '0 1.5rem 1rem 0'
    }
    
    img.style.display = 'none'
    dragSpacer.style.display = 'none'
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
    img.style.display = ''
    dragSpacer.style.display = 'block'
    
    if (target && editor.contains(target) && target !== dragSpacer) {
      const nearestBlock = target.closest('p, h1, h2, h3, li, img') as HTMLElement
      if (nearestBlock && nearestBlock !== dragSpacer) {
        const rect = nearestBlock.getBoundingClientRect()
        const midpoint = rect.top + rect.height / 2
        if (e.clientY < midpoint) {
          nearestBlock.before(dragSpacer)
        } else {
          nearestBlock.after(dragSpacer)
        }
      } else if (target === editor) {
        editor.appendChild(dragSpacer)
      } else {
        target.before(dragSpacer)
      }
    } else if (!target) {
      editor.appendChild(dragSpacer)
    }
  }
  
  const imgBottom = smoothTop + img.offsetHeight
  const currentHeight = parseInt(editor.style.minHeight) || 0
  if (imgBottom > (currentHeight - 100)) {
    editor.style.minHeight = (imgBottom + 200) + 'px'
  }
  
  updateImageOverlay()
}

function onImageDragUp(e: MouseEvent) {
  isDraggingDocImage = false
  document.removeEventListener('mousemove', onImageDragMove)
  document.removeEventListener('mouseup', onImageDragUp)
  
  if (activeDocImage.value && dragSpacer) {
    const img = activeDocImage.value
    
    img.style.position = 'relative'
    img.style.zIndex = '1'
    img.style.opacity = '1'
    img.style.pointerEvents = 'auto'
    img.style.left = '0'
    img.style.top = '0'
    
    img.style.float = dragSpacer.style.float
    img.style.display = dragSpacer.style.display
    
    // Calculate vertical offset from the parent block's top to drop position
    const spacerParent = dragSpacer.parentElement
    if (spacerParent && spacerParent !== docEditorRef.value) {
      const parentRect = spacerParent.getBoundingClientRect()
      const dropY = e.clientY - parentRect.top
      // SMOOTH DROP WITHOUT MATH JUMP
      const smoothOffset = Math.max(0, dropY)
      
      if (img.style.float === 'none') {
        img.style.margin = `${smoothOffset}px auto 1rem`
      } else {
        const isRight = img.style.float === 'right'
        img.style.margin = isRight 
          ? `${smoothOffset}px 0 1rem 1.5rem` 
          : `${smoothOffset}px 1.5rem 1rem 0`
      }
    } else {
      img.style.margin = dragSpacer.style.margin
    }
    
    dragSpacer.after(img)
    dragSpacer.remove()
    dragSpacer = null
  }
  
  onDocInput()
}

function onDocEditorMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.tagName === 'IMG') {
    if (target.getAttribute('draggable') === 'true') {
      target.setAttribute('draggable', 'false')
    }
    activeDocImage.value = target as HTMLImageElement
    startImageDrag(e)
    nextTick(() => updateImageOverlay())
  } else {
    activeDocImage.value = null
  }
}

function onDocDragStart() {
  // Hide overlay during native drag so it doesn't float disconnected
  activeDocImage.value = null
}

function onDocKeyUp(e: KeyboardEvent) {
  if (activeDocImage.value) {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      activeDocImage.value.remove()
      activeDocImage.value = null
      onDocInput()
      return
    } else {
      updateImageOverlay()
    }
  }
  onDocInput()
}

let isResizingDocImage = false
let resizeDocImageStart = { x: 0, w: 0, corner: 'se' }

function startImageResize(e: MouseEvent, corner: 'se' | 'sw' = 'se') {
  if (!activeDocImage.value) return
  isResizingDocImage = true
  resizeDocImageStart = {
    x: e.clientX,
    w: activeDocImage.value.offsetWidth,
    corner
  }
  document.addEventListener('mousemove', onImageResizeMove)
  document.addEventListener('mouseup', onImageResizeUp)
}

function onImageResizeMove(e: MouseEvent) {
  if (!isResizingDocImage || !activeDocImage.value || !docEditorRef.value) return
  
  const dx = e.clientX - resizeDocImageStart.x
  const effectiveDx = resizeDocImageStart.corner === 'se' ? dx : -dx
  const newWidth = Math.max(50, resizeDocImageStart.w + effectiveDx)
  
  activeDocImage.value.style.width = newWidth + 'px'
  activeDocImage.value.style.maxWidth = '100%'
  activeDocImage.value.style.height = 'auto'
  
  // Dynamic Height Adjustment during resize
  const img = activeDocImage.value
  const editor = docEditorRef.value
  const rect = img.getBoundingClientRect()
  const editorRect = editor.getBoundingClientRect()
  const imgBottom = rect.bottom - editorRect.top + editor.scrollTop
  const currentHeight = parseInt(editor.style.minHeight) || 0
  if (imgBottom > (currentHeight - 50)) {
    editor.style.minHeight = (imgBottom + 150) + 'px'
  }

  updateImageOverlay()
}

function onImageResizeUp() {
  isResizingDocImage = false
  document.removeEventListener('mousemove', onImageResizeMove)
  document.removeEventListener('mouseup', onImageResizeUp)
  onDocInput()
}

function deleteActiveImage() {
  if (activeDocImage.value) {
    activeDocImage.value.remove()
    activeDocImage.value = null
    onDocInput()
  }
}

let savedSelectionRange: Range | null = null

function saveSelectionRange() {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0)
    // Only save if the selection is inside the document editor
    if (docEditorRef.value?.contains(range.commonAncestorContainer)) {
      savedSelectionRange = range
    } else {
      savedSelectionRange = null
    }
  }
}

const compressImageLocally = (file: File, maxWidth = 1600, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            if (!e.target?.result) return reject("No result");
            const img = new Image();
            img.src = e.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject("No ctx");
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject("Image load error");
        };
        reader.onerror = (error) => reject(error);
    });
};

async function insertImageInDoc(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const editor = docEditorRef.value
  if (!editor) return

  // Ensure editor is focused
  editor.focus()

  const sel = window.getSelection()
  if (sel) {
    if (savedSelectionRange && editor.contains(savedSelectionRange.commonAncestorContainer)) {
      sel.removeAllRanges()
      sel.addRange(savedSelectionRange)
    } else {
      // If no valid saved range, move cursor to the end of the editor
      const range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  try {
    const dataUrl = await compressImageLocally(file)
    // Floating image aligned to grid by default
    const imgHtml = `<img src="${dataUrl}" draggable="false" style="float:left; margin:0 1.5rem 1rem 0; width:300px; border-radius:8px; cursor:grab; position:relative; z-index:1;" alt="Inserted image"/>`
    document.execCommand('insertHTML', false, imgHtml)
    onDocInput()
  } catch (err) {
    console.error("Local compression failed", err)
  }

  // Reset the input so the same file can be re-inserted
  input.value = ''
}

function selectFont(font: {label: string, value: string}) {
  selectedFontLabel.value = font.label
  isFontMenuOpen.value = false
  if (!docEditorRef.value) return
  // font-serif / font-sans / font-mono are Tailwind classes, so map to actual CSS families
  const fontMap: Record<string, string> = {
    'font-serif': 'Georgia, "Times New Roman", serif',
    'font-sans': 'system-ui, -apple-system, sans-serif',
    'font-mono': '"Courier New", Courier, monospace',
    "'Georgia, serif'": 'Georgia, serif',
    "'Courier New, monospace'": '"Courier New", Courier, monospace',
  }
  const fontFamily = fontMap[font.value] || font.value
  document.execCommand('fontName', false, fontFamily)
  onDocInput()
}

// ─── Computed ─────────────────────────────────────────────────────────────────

const canvasStyle = computed(() => ({
  transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
  transformOrigin: '0 0',
}))

const gridStyle = computed(() => ({
  backgroundPosition: `${transform.x % (24 * transform.scale)}px ${transform.y % (24 * transform.scale)}px`,
  backgroundSize: `${24 * transform.scale}px ${24 * transform.scale}px`,
}))

const hasTradeNotes = computed(() => {
  return notes.value.some(n => {
    if (n.type === 'trade') return true
    if (n.type === 'thread' && n.threadData?.includedTrades?.length) return true
    return false
  })
})

const boardStats = computed(() => {
  const tradeSources: DiaryEntry[] = []

  for (const note of notes.value) {
    if (note.type === 'trade' && note.tradeData) {
      tradeSources.push(note.tradeData)
    }
    if (note.type === 'thread' && note.threadData?.includedTrades) {
      tradeSources.push(...note.threadData.includedTrades)
    }
  }

  if (tradeSources.length === 0) return { winRate: 0, avgNetProfit: 0, avgRR: 0, totalTrades: 0 }

  const results = tradeSources.map(t => t.result ?? 0)
  const wins = results.filter(r => r > 0)
  const losses = results.filter(r => r < 0)

  const winRate = (wins.length / results.length) * 100
  const avgNetProfit = results.reduce((a, b) => a + b, 0) / results.length

  const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0
  const avgRR = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0

  return { winRate, avgNetProfit, avgRR: isFinite(avgRR) ? avgRR : 99.9, totalTrades: tradeSources.length }
})

// ─── Analytical Helpers ───────────────────────────────────────────────────────



function getStrategyTrades(strategyId: string): DiaryEntry[] {
  const uid = auth.user?.uid;
  const diaryList: DiaryEntry[] = uid ? (forum.users.get(uid)?.diary || []) : [];
  return diaryList.filter((t: DiaryEntry) => t.strategyId === strategyId);
}

function calculateTradeRR(trade: DiaryEntry) {
  if (!trade.entry || !trade.stopLoss || !trade.exit) return 0

  if (trade.side === 'Short') {
    // Valid short: exit < entry < SL
    const risk   = trade.stopLoss - trade.entry  // SL above entry → positive
    const reward = trade.entry    - trade.exit   // exit below entry → positive
    if (risk <= 0 || reward <= 0) return 0
    return reward / risk
  }

  // Long: valid setup is SL < entry < exit
  const risk   = trade.entry - trade.stopLoss  // SL below entry → positive
  const reward = trade.exit  - trade.entry     // exit above entry → positive
  if (risk <= 0 || reward <= 0) return 0
  return reward / risk
}

function getStrategyMetrics(strategyId: string) {
  const trades = getStrategyTrades(strategyId)
  if (trades.length === 0) return { netProfit: 0, winRate: 0, avgRR: 0, total: 0 }
  
  const profits = trades.map(t => t.result ?? 0)
  const wins = profits.filter(p => p > 0)
  const netProfit = profits.reduce((a, b) => a + b, 0)
  const winRate = (wins.length / trades.length) * 100
  
  const rrs = trades.map(t => calculateTradeRR(t)).filter(rr => rr > 0)
  const avgRR = rrs.length > 0 ? rrs.reduce((a, b) => a + b, 0) / rrs.length : 0
  
  return { netProfit, winRate, avgRR, total: trades.length }
}

function getRiskNodeForStrategy(strategyId: string) {
  const connectedIds = connections.value
    .filter(c => c.fromId === strategyId || c.toId === strategyId)
    .map(c => c.fromId === strategyId ? c.toId : c.fromId)
  
  return notes.value.find(n => n.type === 'risk_management' && connectedIds.includes(n.id))
}

function isTradeViolatingRisk(tradeId: string) {
  const strategyIds = connections.value
    .filter(c => c.fromId === tradeId || c.toId === tradeId)
    .map(c => c.fromId === tradeId ? c.toId : c.fromId)
    .filter(id => notes.value.find(n => n.id === id && n.type === 'strategy'))
  
  for (const sId of strategyIds) {
    const riskNode = getRiskNodeForStrategy(sId)
    if (riskNode && riskNode.type === 'risk_management' && riskNode.riskData) {
      const tradeNote = notes.value.find(n => n.id === tradeId)
      if (tradeNote && (tradeNote.type === 'trade' || tradeNote.type === 'thread') && tradeNote.tradeData) {
        const liveData = getLiveTradeData(tradeNote);
        if (liveData) {
          const rr = calculateTradeRR(liveData)
          if (rr < riskNode.riskData.targetRR) return true
        }
      }
    }
  }
  return false
}

function getRiskNodeStats(riskNodeId: string) {
  const riskNote = notes.value.find(n => n.id === riskNodeId)
  if (!riskNote || !riskNote.riskData) return null
  
  // Find connected strategies
  const strategyIds = connections.value
    .filter(c => c.fromId === riskNodeId || c.toId === riskNodeId)
    .map(c => c.fromId === riskNodeId ? c.toId : c.fromId)
    .filter(id => notes.value.find(n => n.id === id && n.type === 'strategy'))
  
  const allTrades: DiaryEntry[] = []
  for (const sId of strategyIds) {
    allTrades.push(...getStrategyTrades(sId))
  }
  
  if (allTrades.length === 0) return null
  
  const results = allTrades.map(t => t.result ?? 0)
  const avgResult = results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0
  
  return {
    avgResult,
    totalTrades: allTrades.length
  }
}

function getComparisonData(comparisonId: string) {
  // Find all connected strategy nodes
  const connectedStrategyIds = connections.value
    .filter(c => c.fromId === comparisonId || c.toId === comparisonId)
    .map(c => c.fromId === comparisonId ? c.toId : c.fromId)
    .filter(id => notes.value.find(n => n.id === id && n.type === 'strategy'))

  return connectedStrategyIds.map(sId => {
    const stratNote = notes.value.find(n => n.id === sId)
    const metrics = getStrategyMetrics(sId)
    return {
      id: sId,
      name: stratNote?.strategyData?.name || 'Unnamed Strategy',
      ...metrics,
    }
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function noteCenter(noteId: string) {
  const n = notes.value.find(n => n.id === noteId)
  if (!n) return { x: 0, y: 0 }
  return { x: n.x + n.width / 2, y: n.y + n.height / 2 }
}

function noteStyle(note: BoardNote) {
  return {
    transform: `translate(${note.x}px, ${note.y}px)`,
    width: note.width + 'px',
    minHeight: note.height + 'px',
  }
}

// Returns canvas coordinate from mouse event
function toCanvas(e: MouseEvent) {
  const wrap = canvasWrapRef.value!
  const rect = wrap.getBoundingClientRect()
  return {
    x: (e.clientX - rect.left - transform.x) / transform.scale,
    y: (e.clientY - rect.top - transform.y) / transform.scale,
  }
}

function centerCanvas() {
  const wrap = canvasWrapRef.value
  return {
    x: (wrap?.clientWidth ?? 800) / 2 / transform.scale - 100,
    y: (wrap?.clientHeight ?? 600) / 2 / transform.scale - 80,
  }
}

// ─── Canvas pan & zoom ────────────────────────────────────────────────────────

function onWheel(e: WheelEvent) {
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const wrap = canvasWrapRef.value!
  const rect = wrap.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top

  const newScale = Math.min(1.5, Math.max(0.15, transform.scale * delta))
  const scaleRatio = newScale / transform.scale

  transform.x = mouseX - (mouseX - transform.x) * scaleRatio
  transform.y = mouseY - (mouseY - transform.y) * scaleRatio
  transform.scale = newScale
}

function focusNode(nodeId: string) {
  const note = notes.value.find(n => n.id === nodeId)
  if (!note) return

  const wrap = canvasWrapRef.value
  if (!wrap) return

  const viewW = wrap.clientWidth
  const viewH = wrap.clientHeight

  // Center the node in the view
  const centerX = note.x + note.width / 2
  const centerY = note.y + note.height / 2

  transform.x = viewW / 2 - centerX * transform.scale
  transform.y = viewH / 2 - centerY * transform.scale
}

function startLayerDrag(e: MouseEvent, nodeId: string, isFolder: boolean = false) {
  isDraggingLayer.value = true
  draggedLayerId.value = nodeId
  dragIsFolder.value = isFolder
  dragStartY.value = e.clientY
  dragCurrentY.value = e.clientY
  dragMouseY.value = e.clientY
  
  window.addEventListener('mousemove', handleLayerDrag)
  window.addEventListener('mouseup', endLayerDrag)
}

function handleLayerDrag(e: MouseEvent) {
  if (!isDraggingLayer.value) return
  dragCurrentY.value = e.clientY
  dragMouseY.value = e.clientY

  // Find what we are hovering over in the layers list
  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
  if (!el) return

  const folderEl = el.closest('[data-folder-id]')
  const nodeEl = el.closest('[data-node-id]')

  dragOverFolderId.value = folderEl ? folderEl.getAttribute('data-folder-id') : null
  dragOverNodeId.value = nodeEl ? nodeEl.getAttribute('data-node-id') : null

  // Calculate insert index for the line indicator
  if (dragOverNodeId.value && activeBoard.value) {
    const allNotes = activeBoard.value.notes
    const targetIdx = allNotes.findIndex(n => n.id === dragOverNodeId.value)
    if (targetIdx !== -1) {
      const rect = nodeEl!.getBoundingClientRect()
      const midpoint = rect.top + rect.height / 2
      // If mouse is in upper half, insert before; if lower half, insert after.
      dragInsertIndex.value = dragMouseY.value < midpoint ? targetIdx : targetIdx + 1
    }
  } else {
    dragInsertIndex.value = null
  }
}

function endLayerDrag() {
  if (!isDraggingLayer.value || !activeBoard.value) {
    cleanupDrag()
    return
  }

  const nodeId = draggedLayerId.value
  const targetFolderId = dragOverFolderId.value
  const targetNodeId = dragOverNodeId.value

  if (nodeId && !dragIsFolder.value) {
    const allNotes = activeBoard.value.notes
    const note = allNotes.find(n => n.id === nodeId)
    
    if (note) {
      // 1. Handle moving to folder OR root
      if (targetFolderId) {
        note.folderId = targetFolderId
      } else {
        // Find if we are still inside the layers list area but NOT over a folder
        const layersList = document.querySelector('.custom-scrollbar')
        const rect = layersList?.getBoundingClientRect()
        if (rect && 
            dragMouseY.value > rect.top && 
            dragMouseY.value < rect.bottom && 
            !targetFolderId && 
            !targetNodeId) {
           // Dropped in the general list area but not over a folder => Move to Root
           note.folderId = undefined
        }
      }

      // 2. Handle reordering if over another node
      if (dragInsertIndex.value !== null) {
        const fromIndex = allNotes.findIndex(n => n.id === nodeId)
        let toIndex = dragInsertIndex.value
        
        if (fromIndex !== -1) {
          // If we are moving forward, the removal of the item shifts the target index
          if (fromIndex < toIndex) toIndex--
          
          const [removed] = allNotes.splice(fromIndex, 1)
          allNotes.splice(toIndex, 0, removed!)

          // Inherit folder if dropped near a folder node
          const neighbor = allNotes[toIndex + 1] || allNotes[toIndex - 1]
          if (neighbor) note.folderId = neighbor.folderId
        }
      }
    }
  }

  saveBoardToLocal()
  cleanupDrag()
}

function cleanupDrag() {
  isDraggingLayer.value = false
  draggedLayerId.value = null
  dragOverFolderId.value = null
  dragOverNodeId.value = null
  dragInsertIndex.value = null
  window.removeEventListener('mousemove', handleLayerDrag)
  window.removeEventListener('mouseup', endLayerDrag)
}

function reorderLayer(nodeId: string, direction: 'up' | 'down') {
  if (!activeBoard.value) return
  const allNotes = activeBoard.value.notes
  const index = allNotes.findIndex(n => n.id === nodeId)
  if (index === -1) return

  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= allNotes.length) return

  const [removed] = allNotes.splice(index, 1)
  allNotes.splice(newIndex, 0, removed!)
  saveBoardToLocal()
}

function onCanvasMouseDown(e: MouseEvent) {
  const el = e.target as HTMLElement
  
  // If middle mouse button or Alt + left click, start panning
  if (e.button === 1 || (e.button === 0 && e.altKey)) {
    panSession.value = { startX: e.clientX, startY: e.clientY, initialOX: transform.x, initialOY: transform.y }
    isInteracting.value = true
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    hideTextMenu()
    selectedNoteId.value = null
    connectingFrom.value = null
    return
  }

  // Blur any focused input if clicking the canvas background
  if (document.activeElement instanceof HTMLInputElement) {
    document.activeElement.blur()
  }

  // --- Node placement mode ---
  if (placingNodeType.value) {
    if (el.closest('.board-note') || el.closest('aside') || el.closest('button')) return
    const type = placingNodeType.value
    const data = placingNodeData.value
    placingNodeType.value = null
    placingNodeData.value = null

    if (type === 'thread' && data) {
      addThreadNote(data, toCanvas(e))
    } else if (type === 'trade' && data) {
      addTradeNote(data, toCanvas(e))
    } else {
      addEmptyNote(type, toCanvas(e))
    }
    return
  }

  // --- Brush / Eraser mode ---
  if (isBrushActive.value || isEraserActive.value) {
    if (el.closest('.board-note') || el.closest('aside') || el.closest('button') || el.closest('.stats-panel')) return
    
    isDrawing.value = true
    const pos = toCanvas(e)
    if (isBrushActive.value) {
      currentPath.value = {
        id: uid(),
        color: brushColor.value,
        thickness: brushThickness.value,
        points: [pos]
      }
    } else {
      erasePathsAt(pos)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return
  }

  // Ignore clicks on notes (they handle own drag), sidebar, menus, or stats
  if (el.closest('.board-note') || el.closest('aside') || el.closest('button') || el.closest('.stats-panel')) return

  // Start pan if clicking anywhere inside the canvas wrap
  if (canvasWrapRef.value && canvasWrapRef.value.contains(el)) {
    panSession.value = { startX: e.clientX, startY: e.clientY, initialOX: transform.x, initialOY: transform.y }
    isInteracting.value = true
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    hideTextMenu()
    selectedNoteId.value = null
    connectingFrom.value = null
  }
}

function getPathData(points: { x: number; y: number }[]) {
  if (!points || points.length === 0) return ''
  const [first, ...rest] = points
  if (!first || rest.length === 0) return ''
  return `M ${first.x} ${first.y} ` + rest.map(p => `L ${p.x} ${p.y}`).join(' ')
}

function onMouseEnter(e: MouseEvent) {
  mouseScreenPos.value = { x: e.clientX, y: e.clientY }
}

function onMouseLeave(e: MouseEvent) {
  mouseScreenPos.value = null
  onMouseUp(e)
}

function erasePathsAt(pos: { x: number; y: number }) {
  const b = activeBoard.value
  if (!b) return
  let changed = false
  const newDrawings: DrawingPath[] = []
  
  for (const path of b.drawings) {
    let currentSegment: {x: number, y: number}[] = []
    const rSq = Math.pow(eraserThickness.value / 2 + path.thickness / 2, 2)
    
    for (const p of path.points) {
      const dx = p.x - pos.x
      const dy = p.y - pos.y
      if (dx * dx + dy * dy > rSq) {
        currentSegment.push(p)
      } else {
        if (currentSegment.length > 1) { // Only keep segments with at least 2 points
          newDrawings.push({
            id: uid(),
            color: path.color,
            thickness: path.thickness,
            points: currentSegment
          })
        }
        currentSegment = []
        changed = true
      }
    }
    if (currentSegment.length === path.points.length) {
      newDrawings.push(path)
    } else if (currentSegment.length > 1) {
      newDrawings.push({
         id: uid(),
         color: path.color,
         thickness: path.thickness,
         points: currentSegment
      })
    }
  }
  
  if (changed) {
    b.drawings = newDrawings
    saveBoardToLocal()
  }
}

let lastMouseMoveEvent: MouseEvent | null = null
let rafId: number | null = null

function onMouseMove(e: MouseEvent) {
  mouseScreenPos.value = { x: e.clientX, y: e.clientY }
  lastMouseMoveEvent = e
  
  if (rafId) return
  
  rafId = requestAnimationFrame(() => {
    if (lastMouseMoveEvent) handleMouseMoveFrame(lastMouseMoveEvent)
    rafId = null
  })
}

function handleMouseMoveFrame(e: MouseEvent) {
  const wrap = canvasWrapRef.value!
  const rect = wrap.getBoundingClientRect()
  mousePos.value = { x: e.clientX - rect.left, y: e.clientY - rect.top }

  if (isDrawing.value && isEraserActive.value) {
    erasePathsAt(toCanvas(e))
    return
  }

  if (isDrawing.value && currentPath.value && isBrushActive.value) {
    // Occlusion: don't draw if over a note
    const target = e.target as HTMLElement
    if (target.closest('.board-note')) return

    const pos = toCanvas(e)
    currentPath.value.points.push(pos)
    return
  }

  if (panSession.value) {
    const s = panSession.value
    transform.x = s.initialOX + (e.clientX - s.startX)
    transform.y = s.initialOY + (e.clientY - s.startY)
  } else if (dragSession.value) {
    const s = dragSession.value
    const dx = (e.clientX - s.startX) / transform.scale
    const dy = (e.clientY - s.startY) / transform.scale
    if (!s.moved && (Math.abs(e.clientX - s.startX) > 5 || Math.abs(e.clientY - s.startY) > 5)) {
      s.moved = true
    }
    const note = notes.value.find(n => n.id === s.noteId)
    if (note && s.moved) {
      note.x = s.initialX + dx
      note.y = s.initialY + dy
    }
  } else if (resizeSession.value) {
    const s = resizeSession.value
    const dx = (e.clientX - s.startX) / transform.scale
    const dy = (e.clientY - s.startY) / transform.scale
    const note = notes.value.find(n => n.id === s.noteId)
    if (note) {
      const minW = 180
      const minH = 120

      if (s.corner === 'se') {
        note.width = Math.max(minW, s.initialW + dx)
        note.height = Math.max(minH, s.initialH + dy)
      } else if (s.corner === 'sw') {
        const newW = Math.max(minW, s.initialW - dx)
        note.x = s.initialX + (s.initialW - newW)
        note.width = newW
        note.height = Math.max(minH, s.initialH + dy)
      } else if (s.corner === 'ne') {
        note.width = Math.max(minW, s.initialW + dx)
        const newH = Math.max(minH, s.initialH - dy)
        note.y = s.initialY + (s.initialH - newH)
        note.height = newH
      } else if (s.corner === 'nw') {
        const newW = Math.max(minW, s.initialW - dx)
        note.x = s.initialX + (s.initialW - newW)
        note.width = newW
        const newH = Math.max(minH, s.initialH - dy)
        note.y = s.initialY + (s.initialH - newH)
        note.height = newH
      }
    }
  }
}

function onMouseUp(e: MouseEvent) {
  // Finish brush/eraser stroke
  if (isDrawing.value) {
    isDrawing.value = false
    if (isBrushActive.value && currentPath.value) {
      const path = currentPath.value
      currentPath.value = null
      if (path && path.points.length > 1) {
        getBoardDrawings().push(path)
        saveBoardToLocal()
      }
    }
  }

  // Clean up all sessions
  panSession.value = null
  resizeSession.value = null
  isInteracting.value = false
  setTimeout(() => { dragSession.value = null }, 20)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

// ─── Note drag ────────────────────────────────────────────────────────────────

function startDrag(e: MouseEvent, note: BoardNote) {
  const el = e.target as HTMLElement
  if (el.closest('button') || el.closest('a') || el.closest('textarea') || el.closest('input') || el.closest('[contenteditable="true"]')) return

  dragSession.value = {
    noteId: note.id,
    startX: e.clientX,
    startY: e.clientY,
    initialX: note.x,
    initialY: note.y,
    moved: false,
  }
  isInteracting.value = true
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function startResize(e: MouseEvent, note: BoardNote, corner: 'nw' | 'ne' | 'sw' | 'se' = 'se') {
  resizeSession.value = {
    noteId: note.id,
    startX: e.clientX,
    startY: e.clientY,
    initialW: note.width || 200,
    initialH: note.height || 150,
    initialX: note.x,
    initialY: note.y,
    corner,
  }
  isInteracting.value = true
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// ─── Note click / connect ─────────────────────────────────────────────────────

function onNoteClick(note: BoardNote) {
  if (dragSession.value?.moved) return
  // reset on click session
  const moves = dragSession.value?.moved || false
  dragSession.value = null
  if (moves) return

  if (connectingFrom.value) {
    if (connectingFrom.value === note.id) {
      connectingFrom.value = null
      selectedNoteId.value = null
      return
    }
    // Create connection
    const exists = connections.value.find(
      c => (c.fromId === connectingFrom.value && c.toId === note.id) ||
           (c.fromId === note.id && c.toId === connectingFrom.value)
    )
    if (!exists) {
      const sourceNote = notes.value.find(n => n.id === connectingFrom.value)
      const targetNote = note
      
      const checkComparisonLimit = (compNode: BoardNote, stratNode: BoardNote) => {
        if (compNode.type === 'comparison' && stratNode.type === 'strategy') {
          const currentStrats = connections.value.filter(c => c.fromId === compNode.id || c.toId === compNode.id)
            .map(c => c.fromId === compNode.id ? c.toId : c.fromId)
            .filter(id => notes.value.find(n => n.id === id && n.type === 'strategy'))
          if (currentStrats.length >= 2) return true
        }
        return false
      }

      const limitReached = sourceNote && (
        checkComparisonLimit(sourceNote, targetNote) || 
        checkComparisonLimit(targetNote, sourceNote)
      )

      // Connection Validation for Conditions & Scenarios
      const isTactical = (n: BoardNote) => n.type === 'conditions' || n.type === 'scenario'
      const isTargetValid = (n: BoardNote) => n.type === 'entry_node' || n.type === 'exit_node'
      
      let connectionAllowed = !limitReached
      
      if (sourceNote && (isTactical(sourceNote) || isTactical(targetNote))) {
        if (isTactical(sourceNote) && !isTargetValid(targetNote)) {
          connectionAllowed = false
          showToast('Conditions/Scenarios can only connect to Entry/Exit nodes', 'error')
        } else if (isTactical(targetNote) && !isTargetValid(sourceNote)) {
          connectionAllowed = false
          showToast('Conditions/Scenarios can only connect to Entry/Exit nodes', 'error')
        }
      }

      if (connectionAllowed) {
        connections.value.push({ id: uid(), fromId: connectingFrom.value!, toId: note.id })
        saveBoardToLocal()
      }
    }
    connectingFrom.value = null
    selectedNoteId.value = null
    return
  }

  if (selectedNoteId.value === note.id) {
    // Second click on same → start connecting
    connectingFrom.value = note.id
    return
  }
  selectedNoteId.value = note.id
}

function cancelConnect() {
  connectingFrom.value = null
  selectedNoteId.value = null
}

function removeConnection(id: string) {
  connections.value = connections.value.filter(c => c.id !== id)
}

// ─── Add notes ───────────────────────────────────────────────────────────────

function addThreadNote(thread: Thread, position?: { x: number; y: number }) {
  if (!position) {
    placingNodeType.value = 'thread'
    placingNodeData.value = thread
    return
  }

  notes.value.push({
    id: uid(),
    type: 'thread',
    x: position.x,
    y: position.y,
    width: 260,
    height: 160,
    threadId: thread.id,
    threadData: thread,
  })
}

function addTradeNote(trade: DiaryEntry, position?: { x: number; y: number }) {
  if (!position) {
    placingNodeType.value = 'trade'
    placingNodeData.value = trade
    return
  }

  notes.value.push({
    id: uid(),
    type: 'trade',
    x: position.x,
    y: position.y,
    width: 220,
    height: 180,
    tradeData: trade,
  })
}

function addEmptyNote(type: BoardNote['type'], position?: { x: number; y: number }, initialData?: Partial<BoardNote>) {
  if (type === 'thread' || type === 'trade') return // These have dedicated adders

  const getNextScenarioLetter = () => {
    const existing = notes.value.filter(n => n.type === 'scenario')
    return String.fromCharCode(65 + (existing.length % 26))
  }
  
  // Enforce strategy limit (max 2 per board)
  if (type === 'strategy') {
    const strategyCount = notes.value.filter(n => n.type === 'strategy').length
    if (strategyCount >= 2) {
      showStrategyLimitWarning.value = true
      return
    }
  }

  // Switch to click-to-place if no position provided and no initial data
  if (!position && !initialData) {
    placingNodeType.value = type
    placingNodeData.value = null
    return
  }

  const pos = position || { x: initialData?.x ?? 0, y: initialData?.y ?? 0 }
  const baseNote: Partial<BoardNote> = {
    id: uid(),
    type,
    x: pos.x,
    y: pos.y,
    width: type === 'strategy' ? 280 : (type === 'risk_management' ? 300 : (type === 'comparison' ? 340 : (type === 'chart' ? 360 : (type === 'entry_node' || type === 'exit_node' ? 180 : (type === 'scenario' ? 300 : (type === 'conditions' ? 260 : 240)))))),
    height: type === 'image' ? 220 : (type === 'strategy' ? 240 : (type === 'risk_management' ? 200 : (type === 'comparison' ? 260 : (type === 'chart' ? 280 : (type === 'entry_node' || type === 'exit_node' ? 100 : (type === 'scenario' ? 320 : (type === 'conditions' ? 300 : 160))))))),
  }

  if (type === 'text' || type === 'entry_node' || type === 'exit_node') {
    baseNote.text = ''
  } else if (type === 'image') {
    baseNote.imageUrl = ''
  } else if (type === 'strategy') {
    baseNote.strategyData = { name: 'Untitled Strategy', description: '' }
  } else if (type === 'risk_management') {
    baseNote.riskData = { initialDeposit: 10000, riskPerTrade: 1, targetRR: 2 }
  } else if (type === 'chart') {
    baseNote.chartData = { symbol: '' }
  } else if (type === 'text_element') {
    baseNote.textElementData = { 
      text: 'Label', 
      style: { color: '#000000', bold: false, italic: false, fontSize: 16 } 
    }
    baseNote.width = 100
    baseNote.height = 40
  } else if (type === 'conditions') {
    baseNote.conditionsName = 'Conditions'
    baseNote.conditionsData = [{ id: uid(), text: 'New Condition' }]
  } else if (type === 'scenario') {
    const letter = getNextScenarioLetter()
    baseNote.scenarioData = { 
      name: 'Scenario ' + letter, 
      letter: letter, 
      if: '',
      then: ''
    }
  }

  // comparison has no data fields — it reads from connected strategy nodes

  // Apply initial data if provided
  if (initialData) {
    Object.assign(baseNote, initialData)
  }

  notes.value.push(baseNote as BoardNote)
  saveBoardToLocal()
}

async function handleImageUpload(event: Event, noteId: string) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const base64 = await compressImageLocally(file)
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      note.imageData = base64
      note.imageUrl = ''
      saveBoardToLocal()
    }
  } catch(err) {
    console.error("Board image local compression failed", err)
  }
}

async function handleConditionImageUpload(event: Event, noteId: string, conditionId: string) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const base64 = await compressImageLocally(file)
    const note = notes.value.find(n => n.id === noteId)
    if (note && note.conditionsData) {
      const cond = note.conditionsData.find(c => c.id === conditionId)
      if (cond) {
        if (!cond.images) cond.images = []
        cond.images.push(base64)
        saveBoardToLocal()
      }
    }
  } catch(err) {
    console.error("Condition image compression failed", err)
  }
}

function openGallery(cond: any) {
  const images = [...(cond.images || [])]
  if (cond.imageData) images.unshift(cond.imageData)
  activeConditionImages.value = images
  activeGalleryIndex.value = 0
}

function nextGalleryImage() {
  if (!activeConditionImages.value) return
  activeGalleryIndex.value = (activeGalleryIndex.value + 1) % activeConditionImages.value.length
}

function prevGalleryImage() {
  if (!activeConditionImages.value) return
  activeGalleryIndex.value = (activeGalleryIndex.value - 1 + activeConditionImages.value.length) % activeConditionImages.value.length
}

function addCondition(noteId: string) {
  const note = notes.value.find(n => n.id === noteId)
  if (note && note.conditionsData) {
    note.conditionsData.push({ id: uid(), text: 'New Condition', description: '' })
    saveBoardToLocal()
  }
}

function removeCondition(noteId: string, conditionId: string) {
  const note = notes.value.find(n => n.id === noteId)
  if (note && note.conditionsData) {
    note.conditionsData = note.conditionsData.filter(c => c.id !== conditionId)
    saveBoardToLocal()
  }
}

// ─── Board Management ───────────────────────────────────────────────────────

const boardToDelete = ref<Board | null>(null)
const showDeleteConfirm = ref(false)

function confirmDeleteBoard(board: Board) {
  boardToDelete.value = board
  showDeleteConfirm.value = true
}

function deleteBoard() {
  if (!boardToDelete.value) return
  boardStore.removeBoard(boardToDelete.value.id)
  showDeleteConfirm.value = false
  boardToDelete.value = null
}

function addNewBoard() {
  if (boards.value.length >= 5) return
  showStrategyLimitWarning.value = false
  const name = 'Board ' + (boards.value.length + 1)
  const id = boardStore.addBoard(name)
  if (id) {
    activeBoardId.value = id
    showToast('Successfully added a new board!')
  }
}

watch(() => notes.value.length, () => {
  if (!sigmaInstance.value) return;
  updateGraph()
})

watch(() => connections.value.length, () => {
  if (!sigmaInstance.value) return;
  updateGraph()
})

function removeNote(id: string) {
  notes.value = notes.value.filter(n => n.id !== id)
  connections.value = connections.value.filter(c => c.fromId !== id && c.toId !== id)
  if (selectedNoteId.value === id) selectedNoteId.value = null
  if (connectingFrom.value === id) connectingFrom.value = null
}

// ─── Text formatting ─────────────────────────────────────────────────────────

function onTextInput(e: Event, note: BoardNote) {
  note.text = (e.target as HTMLElement).innerHTML
}

function showTextMenu(e: MouseEvent, note: BoardNote) {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) return
  activeTextNote = note
  textMenu.x = e.clientX
  textMenu.y = e.clientY - 50
  textMenu.noteId = note.id
  textMenu.visible = true
}

function hideTextMenu() {
  textMenu.visible = false
  activeTextNote = null
}

function formatText(command: string, value?: string) {
  document.execCommand(command, false, value)
  // Save updated html
  if (activeTextNote) {
    const el = document.querySelector(`[data-note-id="${activeTextNote.id}"]`)
    if (el) activeTextNote.text = el.innerHTML
  }
  hideTextMenu()
}

// ─── Search ───────────────────────────────────────────────────────────────────

// Typing just filters client-side — no Firestore call needed
function onSearch() {
  // filtering is reactive via computed searchResults / tradeResults
}

async function loadAllThreads() {
  if (allThreads.value.length > 0) return // already loaded
  isSearching.value = true
  try {
    const snap = await getDocs(
      query(
        collection(db, 'threads').withConverter(threadConverter),
        orderBy('lastActivityAt', 'desc'),
        limit(100)
      )
    )
    allThreads.value = snap.docs.map(d => d.data())
  } catch {
    allThreads.value = []
  } finally {
    isSearching.value = false
  }
}

async function loadAllTrades() {
  if (!auth.user) return
  isSearching.value = true
  try {
    const userData = await forum.fetchUser(auth.user.uid)
    allTrades.value = userData?.diary || []
  } catch {
    allTrades.value = []
  } finally {
    isSearching.value = false
  }
}

// ─── Export / Import ──────────────────────────────────────────────────────────

async function exportBoard() {
  const current = activeBoard.value
  if (!current) return

  const zip = new JSZip()
  const assetsFolder = zip.folder('assets')
  
  // Clone board to avoid mutating live state
  const exportedBoard = JSON.parse(JSON.stringify(current)) as Board
  
  for (const note of exportedBoard.notes) {
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

  zip.file('board.json', JSON.stringify(exportedBoard, null, 2))
  
  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = `board_${current.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

function triggerImport() {
  importInputRef.value?.click()
}

async function processImportedBoard(data: any, zip?: JSZip) {
  // Handle single board or array of boards
  const rawBoards = Array.isArray(data) ? data : [data]
  
  const processed: Board[] = []
  
  for (const b of rawBoards) {
    if (!b.id || !b.name) continue
    
    // Generate new ID to avoid collisions
    const oldId = b.id
    b.id = uid()
    
    // Restore assets if from ZIP
    if (zip && b.notes) {
      for (const note of b.notes) {
        if (note.imageData && note.imageData.startsWith('assets/')) {
          const assetFile = zip.file(note.imageData)
          if (assetFile) {
            const base64 = await assetFile.async('base64')
            const extension = note.imageData.split('.').pop()?.toLowerCase()
            const mimeType = extension === 'png' ? 'image/png' : 
                             (extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 
                             (extension === 'gif' ? 'image/gif' : 'image/png'))
                             
            note.imageData = `data:${mimeType};base64,${base64}`
          }
        }
      }
    }
    processed.push(b)
  }
  
  if (processed.length > 0) {
    boards.value.push(...processed)
    activeBoardId.value = processed[0]!.id
    saveBoardToLocal()
    showToast(`Successfully imported ${processed.length} board(s).`)
  }
}

async function importBoard(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    if (file.name.endsWith('.json')) {
      const text = await file.text()
      const data = JSON.parse(text)
      await processImportedBoard(data)
    } else if (file.name.endsWith('.zip')) {
      const zip = await JSZip.loadAsync(file)
      // Support both 'board.json' (single) or 'boards.json' (legacy collection)
      const jsonFile = zip.file('board.json') || zip.file('boards.json')
      if (!jsonFile) throw new Error('No board JSON found in zip')
      const jsonText = await jsonFile.async('string')
      const data = JSON.parse(jsonText)
      await processImportedBoard(data, zip)
    }
  } catch (err) {
    console.error('Import failed:', err)
    showToast('Import failed. Make sure it is a valid board export.', 'error')
  }
  
  if (importInputRef.value) importInputRef.value.value = ''
}

// ─── Global click to close text menu ─────────────────────────────────────────

function onDocClick(e: MouseEvent) {
  const el = e.target as HTMLElement
  if (!el.closest('.text-menu')) hideTextMenu()
}

// ─── Persistence Logic ───────────────────────────────────────────────────────

// Persistence Logic handled by store
const isLoadingPersistence = computed(() => boardStore.isLoadingPersistence)
const isSaving = computed(() => boardStore.isSaving)
const isManualSaving = ref(false)

async function saveBoardToLocal(isManual = false) {
  if (isManual) isManualSaving.value = true
  await boardStore.saveBoardToLocal(isManual)
  if (isManual) {
    setTimeout(() => {
      isManualSaving.value = false
    }, 1000)
  }
}

async function loadBoardFromLocal() {
  await boardStore.loadBoardFromLocal()
}

watch(() => auth.user?.uid, (uid) => {
  if (uid) loadAllTrades()
  else allTrades.value = []
}, { immediate: true })

function centerOnNodes(type?: BoardNote['type']) {
  // If a type is specified, try to find those first (e.g. 'strategy')
  let targetNotes = type ? notes.value.filter(n => n.type === type) : notes.value
  
  // If no specific notes or typed notes found, fall back to all notes
  if (targetNotes.length === 0) targetNotes = notes.value
  if (targetNotes.length === 0) {
    transform.x = 0
    transform.y = 0
    transform.scale = 1
    return
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  targetNotes.forEach(n => {
    minX = Math.min(minX, n.x)
    minY = Math.min(minY, n.y)
    maxX = Math.max(maxX, n.x + n.width)
    maxY = Math.max(maxY, n.y + n.height)
  })

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  const wrap = canvasWrapRef.value
  if (!wrap) return

  const viewW = wrap.clientWidth
  const viewH = wrap.clientHeight

  // Center the bounding box in the view at current scale
  transform.x = viewW / 2 - centerX * transform.scale
  transform.y = viewH / 2 - centerY * transform.scale
}

function onKeyDown(e: KeyboardEvent) {
 
  if (e.key === 'Escape') {
    e.preventDefault();
    placingNodeType.value = null
  }

  // Handle node deletion via keyboard
  if ((e.key === 'Backspace' || e.key === 'Delete') && selectedNoteId.value) {
    const target = e.target as HTMLElement
    // Prevent deletion if user is typing
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
      e.preventDefault()
      removeNote(selectedNoteId.value)
    }
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeyDown)
  // Restore state
  loadBoardFromLocal()
  // Load initial data
  loadAllThreads()

  // Initialize graph
  if (graphContainer.value) {
    sigmaInstance.value = new Sigma(graph, graphContainer.value, {
      renderLabels: true,
      defaultEdgeColor: '#6366f1',
      allowInvalidContainer: true,
    })
    sigmaReady.value = true
    updateGraph()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeyDown)
  
  // Final save
  saveBoardToLocal(false)
})
</script>

<style scoped>
/* Hide number input spin buttons */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* ═══════════════════ TRANSITIONS ═══════════════════ */

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.scale-enter-active, .scale-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-enter-from, .scale-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(10px);
}

.board-note.dragging {
  z-index: 100 !important;
  transform: scale(1.02);
  box-shadow: 0 20px 40px rgba(0,0,0,0.2) !important;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.dark .board-note.dragging {
  box-shadow: 0 20px 40px rgba(0,0,0,0.4) !important;
}

.drawing-mode .board-note,
.drawing-mode .board-note * {
  pointer-events: none !important;
}

aside {
  pointer-events: auto !important;
}

.drawing-mode .connection-dot,
.drawing-mode .connection-line {
  pointer-events: none !important;
}
</style>
