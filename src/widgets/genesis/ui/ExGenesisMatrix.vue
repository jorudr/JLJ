<template>
  <div class="matrix-tree w-full h-screen relative flex flex-col overflow-hidden text-nier-text-light dark:text-nier-text-dark select-none shadow-[inset_0_0_100px_rgba(44,44,42,0.02)] dark:shadow-[inset_0_0_100px_rgba(255,255,255,0.02)]"
       @mousemove="updateMousePos">

    <!-- TACTICAL CORNER BRACKETS -->
    <div class="absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-black/10 dark:border-white/10 opacity-50 z-[100] pointer-events-none"></div>
    <div class="absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-black/10 dark:border-white/10 opacity-50 z-[100] pointer-events-none"></div>
    <div class="absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-black/10 dark:border-white/10 opacity-50 z-[100] pointer-events-none"></div>
    <div class="absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-black/10 dark:border-white/10 opacity-50 z-[100] pointer-events-none"></div>
    
    <!-- TACTICAL GRID OVERLAY (Stays Static with pan offset) -->
    <!-- TACTICAL GRID OVERLAY (Scales with View) -->
    <div class="absolute inset-0 pointer-events-none opacity-[0.01]" :style="gridTransform">
       <svg class="w-full h-full">
         <defs>
           <pattern id="grid" :width="100 * viewState.scale" :height="100 * viewState.scale" patternUnits="userSpaceOnUse">
             <path :d="`M ${100 * viewState.scale} 0 L 0 0 0 ${100 * viewState.scale}`" 
                   fill="none" 
                   stroke="currentColor" 
                   :stroke-width="Math.max(0.5, 0.5 / viewState.scale)"/>
           </pattern>
         </defs>
         <rect width="100%" height="100%" fill="url(#grid)" />
       </svg>
    </div>

    <!-- Navigation Backlink -->

    <!-- MAIN CANVAS -->
    <div class="flex-grow relative overflow-hidden cursor-move" 
         ref="canvasWrapper"
         @mousedown="startPan"
         @click="handleBackgroundClick"
         @mousemove="handleCanvasMouseMove"
         @mouseup="handleCanvasMouseUp">
      
      <!-- REIFICATION LAYER (Transformed) -->
      <div class="absolute inset-0 origin-top-left pointer-events-none" :style="contentTransform">
        <!-- Re-enable pointer events for specific children -->
        <div class="absolute inset-0 pointer-events-auto">
        
        <!-- TACTICAL ZONES (Back Layer) -->
        <div class="absolute inset-0 z-0">
           <!-- Render Sessions First (Bottom Depth) -->
           <ExZone v-for="zone in zones.filter((z: Zone) => z.type === 'session')" :key="zone.id"
                   :zone="zone" 
                   :scale="viewState.scale"
                   @remove="removeZone" 
                   @cycle-type="handleZoneCycle"
                   @drag-start="startZoneDrag($event, zone)"
                   @resize-start="startZoneResize($event, zone)" />

           <!-- Render Tactical Zones (Mid Depth) -->
           <ExZone v-for="zone in zones.filter((z: Zone) => z.type !== 'session')" :key="zone.id"
                   :zone="zone" 
                   :scale="viewState.scale"
                   @remove="removeZone" 
                   @cycle-type="handleZoneCycle"
                   @drag-start="startZoneDrag($event, zone)"
                   @resize-start="startZoneResize($event, zone)" />

           <!-- Zone Drawing Preview -->
           <div v-if="drawStart && drawCurrent" 
                class="absolute border border-current opacity-20 pointer-events-none"
                :style="drawPreviewStyle">
              <div class="absolute -top-6 left-0 text-[8px] font-mono tracking-widest uppercase italic opacity-40">
                Constructing_{{ selectedZoneType }}_Domain...
              </div>
           </div>
           <input type="file" ref="imageInput" class="hidden" accept="image/*" @change="handleImageUpload" />
           <input type="file" ref="fileInput" class="hidden" @change="handleGenericFileUpload" />
        </div>

        <!-- SVG CONNECTIONS (THE ROOTS) -->
        <svg class="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible">
          <defs>
            <filter id="matrixGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <g v-for="(group, gIdx) in bundleGroups" :key="group.id">
            <!-- SHARED MAIN STEM (Once per Parent) -->
            <path v-if="group.type === 'bundle' && group.isFirstForParent"
                  :d="getMainStemPath(group.fromId)"
                  stroke-width="1.2" fill="none"
                  vector-effect="non-scaling-stroke"
                  class="nier-conn-path pointer-events-none"
                  :class="{ 'nier-conn-neon': group.connections.some(isNeonHighlight) }" />

            <!-- SHARED BUNDLE STEM (Once per Bundle) -->
            <path v-if="group.type === 'bundle'"
                  :d="getBundleStemPath(group.fromId, group.bundleId)"
                  stroke-width="1.2" fill="none"
                  vector-effect="non-scaling-stroke"
                  class="nier-conn-path pointer-events-none"
                  :class="{ 'nier-conn-neon': group.connections.some(isNeonHighlight) }" />

            <!-- INDIVIDUAL BRANCHES OR SIMPLE CONNECTIONS -->
            <g v-for="line in (group.type === 'bundle' ? group.connections : [group.connection])" :key="line.toId" class="group/line">
              <!-- Interactive Hit Area (Always Full Path for easy clicking) -->
              <path :d="createRootPath(line.fromId, line.toId)" 
                    stroke="transparent" 
                    stroke-width="16"
                    fill="none"
                    class="pointer-events-auto cursor-pointer"
                    @click.stop="handleConnectionClick($event, line)" />

              <!-- Visual Path (Branch only if bundle, full path if simple) -->
              <path :d="group.type === 'bundle' ? getBranchPath(line) : createRootPath(line.fromId, line.toId)" 
                    stroke-width="1.2"
                    fill="none" 
                    vector-effect="non-scaling-stroke"
                    class="nier-conn-path pointer-events-none"
                    :class="{ 'nier-conn-neon': isNeonHighlight(line) }" />

              <circle v-if="getNode(line.toId)" 
                      :cx="getNode(line.toId)!.x - (['scaling-entry', 'step'].includes(getNode(line.toId)!.type) ? 30 : 62)" 
                      :cy="getNode(line.toId)!.y" 
                      r="2" fill="currentColor" class="opacity-40" />
            </g>
          </g>

          <!-- CONNECTION LABELS (Rendered last to ensure they are on top and capture clicks) -->
          <foreignObject v-for="line in connections.filter((c: any) => c.label && shouldShowLabel(c))" 
                         :key="'label-' + line.fromId + '-' + line.toId"
                         :x="getConnectionMidpoint(line).x - 60" 
                         :y="getConnectionMidpoint(line).y - 20" 
                         width="120" height="40" 
                         class="pointer-events-none select-none overflow-visible">
             <div class="w-full h-full flex items-center justify-center">
                <div class="cursor-pointer pointer-events-auto px-2 py-1 hover:bg-nier-white/10 dark:hover:bg-nier-black/10 transition-colors"
                     @mousedown.stop="handleLabelDrag($event, line)">
                    <div class="text-[16px] font-mono text-nier-text-light dark:text-nier-text-dark tracking-widest lowercase italic font-bold">
                       {{ locale === 'ru' ? t(line.label || '') : line.label }}
                    </div>
                </div>
             </div>
          </foreignObject>
 

          <!-- Active Drag Line -->
          <g v-if="activeWire">
            <path :d="createCurvedPath(activeWire.from, activeWire.to)" 
                  stroke="currentColor" 
                  stroke-width="2" 
                  stroke-dasharray="4 8"
                  fill="none" 
                  class="opacity-60" />
          </g>
        </svg>

        <!-- SKILL NODES -->
        <div class="absolute inset-0 z-10 pointer-events-none">
          <ExSkillNode v-for="node in nodes" :key="node.id"
                       :node="node" 
                       :scale="viewState.scale"
                       :is-selected="lastSelectedId === node.id"
                       :is-closest="closestNodeId === node.id"
                       :is-dark="isDark"
                       @click="selectNode(node.id)"
                       @doubleclick="handleNodeDive(node)"
                       @start-output="startWireDrag"
                       @pickup-input="handlePickupInput"
                       @drop="completeWireDrop"
                       @remove="removeNode"
                       @clear-input="clearNodeInputConnections"
                       @clear-output="clearNodeOutputConnections"
                       @contextmenu="handleNodeContextMenu"
                       @merge="mergeNodes($event.fromId, $event.toId)"
                       @moved="forceUpdate" />
        </div>
        </div>
      </div>

      <!-- NODE CONTEXT MENU Overlay (Screen Space) -->
      <Teleport to="body">
        <Transition name="nt-tooltip-fade">
          <div v-if="nodeContextMenu" 
               class="fixed z-[100000000] pointer-events-auto context-menu-container"
               :style="{ left: nodeContextMenu.x + 'px', top: nodeContextMenu.y + 'px' }"
                @click.stop>
              
              <div class="flex flex-col space-y-1.5">
                <!-- Anchor Point Indicator -->
                <div class="w-2 h-2 bg-nier-text-light dark:bg-nier-text-dark rotate-45 absolute -left-1 -top-1 animate-pulse"></div>

                <!-- Segmented Blades -->
                <div v-for="(btn, i) in [
                  { label: 'SET_IDENTITY', id: '0x01', condition: nodeContextMenu && ['condition', 'scenario', 'strategy'].includes(getNode(nodeContextMenu.nodeId)?.type || ''), action: () => nodeContextMenu && setNodeCustomName(nodeContextMenu.nodeId) },
                  { label: 'ADD_COMMENT', id: '0x02', action: () => nodeContextMenu && addCommentToNode(nodeContextMenu.nodeId) },
                  { 
                    label: nodeContextMenu && (function() {
                      const dir = getNode(nodeContextMenu.nodeId)?.params?.direction;
                      if (!dir || dir === 'NONE') return 'SET_LONG';
                      if (dir === 'LONG') return 'SET_SHORT';
                      return 'REMOVE_DIRECTION';
                    })(),
                    id: '0x03', 
                    condition: nodeContextMenu && getNode(nodeContextMenu.nodeId)?.type === 'scenario', 
                    action: () => nodeContextMenu && cycleNodeDirection(nodeContextMenu.nodeId) 
                  },
                  { 
                    label: 'UPDATE_VISUAL', 
                    id: '0x04', 
                    condition: nodeContextMenu && getNode(nodeContextMenu.nodeId)?.type === 'image', 
                    action: () => nodeContextMenu && triggerImageUpload(nodeContextMenu.nodeId) 
                  },
                  { 
                    label: nodeContextMenu && (function() {
                      const phase = getNode(nodeContextMenu.nodeId)?.params?.phase;
                      if (!phase || phase === 'NONE') return 'SET_ENTRY';
                      if (phase === 'ENTRY') return 'SET_EXIT';
                      return 'REMOVE_TYPE';
                    })(),
                    id: '0x05', 
                    condition: nodeContextMenu && getNode(nodeContextMenu.nodeId)?.type === 'scenario', 
                    action: () => nodeContextMenu && cycleNodePhase(nodeContextMenu.nodeId) 
                  },
                  { 
                    label: nodeContextMenu && (function() {
                      const prio = getNode(nodeContextMenu.nodeId)?.params?.priority;
                      if (!prio || prio === 'NONE') return 'SET_REQUIRED';
                      if (prio === 'REQUIRED') return 'SET_ADDITIONAL';
                      return 'REMOVE_PRIORITY';
                    })(),
                    id: '0x06', 
                    condition: nodeContextMenu && getNode(nodeContextMenu.nodeId)?.type === 'condition', 
                    action: () => nodeContextMenu && cycleNodePriority(nodeContextMenu.nodeId) 
                  }
                ].filter(b => b.condition !== false)" 
                     :key="btn.id"
                     :style="{ marginLeft: i * 12 + 'px' }"
                     class="group relative">
                  
                  <!-- Blade Fragment -->
                  <button @click="btn.action"
                          class="bg-nier-white dark:bg-nier-black border border-nier-border-light dark:border-nier-border-dark px-6 py-2.5 min-w-[180px] text-left transition-all duration-500 hover:border-nier-text-light dark:hover:border-nier-text-dark hover:translate-x-4 flex items-center justify-between relative overflow-hidden shadow-[10px_10px_0_rgba(0,0,0,0.1)]">
                    
                    <!-- Scanline Overlay -->
                    <div class="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
                    
                    <span class="text-[9px] font-mono tracking-[0.5em] uppercase font-black group-hover:tracking-[0.8em] transition-all duration-500 relative z-10 text-nier-text-light dark:text-nier-text-dark">{{ btn.label }}</span>
                    <span class="text-[7px] font-mono opacity-20 group-hover:opacity-100 transition-opacity relative z-10 text-nier-text-light dark:text-nier-text-dark">[{{ btn.id }}]</span>

                    <!-- Hover Fill Accent -->
                    <div class="absolute inset-y-0 left-0 w-0 bg-nier-text-light dark:bg-nier-text-dark group-hover:w-1.5 transition-all duration-500"></div>
                  </button>

                  <!-- Tactical Metadata Revealed on Hover -->
                  <div class="absolute -bottom-4 left-6 opacity-0 group-hover:opacity-40 transition-all duration-500 pointer-events-none">
                    <span class="text-[7px] font-mono uppercase tracking-[0.3em] text-nier-text-light dark:text-nier-text-dark">Protocol_Execution_Sequence // Ready</span>
                  </div>
                </div>

                <!-- Danger Blade (Staggered) -->
                <div v-if="nodeContextMenu.nodeId !== 'root'"
                     :style="{ marginLeft: 3 * 12 + 'px' }"
                     class="group relative pt-2">
                   <button @click="removeNode(nodeContextMenu.nodeId); nodeContextMenu = null"
                           class="bg-nier-white dark:bg-nier-black border border-red-500/30 px-6 py-3 min-w-[180px] text-left transition-all duration-500 hover:border-red-500 hover:bg-red-500/10 hover:translate-x-4 flex items-center justify-between relative overflow-hidden">
                     <span class="text-[9px] font-mono tracking-[0.5em] uppercase font-black text-red-500 group-hover:text-red-400">REMOVE_NODE</span>
                     <span class="text-[7px] font-mono text-red-500 opacity-40">[DEL]</span>
                     
                     <div class="absolute inset-y-0 left-0 w-0 bg-red-500 group-hover:w-1.5 transition-all duration-500"></div>
                   </button>
                   <div class="absolute -bottom-4 left-6 opacity-0 group-hover:opacity-40 transition-all duration-500 pointer-events-none">
                    <span class="text-[7px] font-mono uppercase tracking-[0.3em] text-red-500">Warning: Permanent_Archive_Erasure</span>
                  </div>
                </div>
              </div>
            </div>
        </Transition>
      </Teleport>

      <!-- CONNECTION CONTEXT MENU Overlay -->
      <Teleport to="body">
        <Transition name="nt-tooltip-fade">
           <div v-if="connectionContextMenu" 
                class="fixed z-[100000001] pointer-events-auto context-menu-container"
                :style="{ left: connectionContextMenu.x + 'px', top: connectionContextMenu.y + 'px' }"
                @click.stop>
              
              <div class="flex flex-col space-y-1.5">
                <!-- Segmented Blades -->
                <div v-for="(opt, idx) in ['IF', 'THEREFORE', 'AND', 'OR']" :key="opt"
                     :style="{ marginLeft: idx * 8 + 'px' }"
                     class="group relative">
                  
                  <button @click="setConnectionLabel(opt)"
                          class="bg-nier-white dark:bg-nier-black border border-nier-border-light dark:border-nier-border-dark px-6 py-2 min-w-[160px] text-left transition-all duration-500 hover:border-nier-text-light dark:hover:border-nier-text-dark hover:translate-x-4 flex items-center justify-between relative overflow-hidden shadow-[10px_10px_0_rgba(0,0,0,0.1)]">
                    <span class="text-[9px] font-mono tracking-[0.5em] uppercase font-black group-hover:tracking-[0.8em] transition-all duration-500 relative z-10 text-nier-text-light dark:text-nier-text-dark">{{ locale === 'ru' ? t(opt) : opt }}</span>
                    <span class="text-[7px] font-mono opacity-20 group-hover:opacity-100 transition-opacity relative z-10 text-nier-text-light dark:text-nier-text-dark">[0x0{{ idx + 1 }}]</span>
                    
                    <div class="absolute inset-y-0 left-0 w-0 bg-nier-text-light dark:bg-nier-text-dark group-hover:w-1.5 transition-all duration-500"></div>
                  </button>
                </div>

                <div class="group relative pt-2" :style="{ marginLeft: '32px' }">
                  <button @click="setConnectionLabel(null)"
                          class="bg-nier-white dark:bg-nier-black border border-red-500/30 px-6 py-2.5 min-w-[160px] text-left transition-all duration-500 hover:border-red-500 hover:bg-red-500/10 hover:translate-x-4 flex items-center justify-between relative overflow-hidden">
                    <span class="text-[9px] font-mono tracking-[0.5em] uppercase font-black text-red-500">CLEAR_LINK</span>
                    <span class="text-[7px] font-mono text-red-500 opacity-40">[CLR]</span>
                    
                    <div class="absolute inset-y-0 left-0 w-0 bg-red-500 group-hover:w-1.5 transition-all duration-500"></div>
                  </button>
                </div>
              </div>
           </div>
        </Transition>
      </Teleport>

      <!-- PERSONAL CONDITION CONTEXT MENU Overlay -->
      <Teleport to="body">
        <Transition name="nt-tooltip-fade">
           <div v-if="personalCondContextMenu" 
                class="fixed z-[100000001] pointer-events-auto context-menu-container"
                :style="{ left: personalCondContextMenu.x + 'px', top: personalCondContextMenu.y + 'px' }"
                @click.stop>
              
              <div class="flex flex-col space-y-1.5">
                <!-- Anchor Point Indicator -->
                <div class="w-2 h-2 bg-nier-text-light dark:bg-nier-text-dark rotate-45 absolute -left-1 -top-1 animate-pulse"></div>

                <div class="group relative">
                  <button @click="removePersonalCondition(personalCondContextMenu.indicator)"
                          class="bg-nier-white dark:bg-nier-black border border-red-500/30 px-6 py-2.5 min-w-[160px] text-left transition-all duration-500 hover:border-red-500 hover:bg-red-500/10 hover:translate-x-4 flex items-center justify-between relative overflow-hidden group">
                    <span class="text-[9px] font-mono tracking-[0.5em] uppercase font-black text-red-500 group-hover:text-red-400">
                      {{ locale === 'ru' ? 'УДАЛИТЬ' : 'REMOVE' }}
                    </span>
                    <span class="text-[7px] font-mono text-red-500 opacity-40">[DEL]</span>
                    
                    <div class="absolute inset-y-0 left-0 w-0 bg-red-500 group-hover:w-1.5 transition-all duration-500"></div>
                  </button>
                  <div class="absolute -bottom-4 left-6 opacity-0 group-hover:opacity-40 transition-all duration-500 pointer-events-none">
                    <span class="text-[7px] font-mono uppercase tracking-[0.3em] text-red-500">
                      {{ locale === 'ru' ? 'Внимание: Безвозвратное стирание' : 'Warning: Permanent_Erasure' }}
                    </span>
                  </div>
                </div>
              </div>
           </div>
        </Transition>
      </Teleport>

      <!-- SEQUENTIAL PROMPT (Nier Style) -->
      <div v-if="shouldShowInitializePrompt" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
         <div class="flex flex-col items-center space-y-4">
            <span class="text-[10px] font-mono tracking-[1em] uppercase">Initialize_First_Step</span>
            <div class="w-1 h-32 bg-current animate-pulse"></div>
         </div>
      </div>

      <!-- CONFIGURATION WARNING BANNER (Top Center, shown when needsConfig node is selected) -->
      <Transition name="slide-down">
        <div v-if="effectiveSelectedNode?.params?.needsConfig"
             class="absolute top-12 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
             style="animation: config-banner-pulse 2s ease-in-out infinite;">
          <!-- Main Banner -->
          <div class="tactical-corners relative flex items-center justify-center gap-4 px-6 py-3 bg-red-600 border-2 border-red-500 shadow-[0_10px_40px_rgba(239,68,68,0.45)] min-w-max">
            <!-- Scan line -->
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-scan-h pointer-events-none overflow-hidden"></div>
            <!-- Icon -->
            <div class="w-2 h-2 bg-white rotate-45 flex-shrink-0 animate-pulse"></div>
            <!-- Text -->
            <span class="text-[11px] font-mono font-black tracking-[0.4em] -mr-[0.4em] text-white uppercase whitespace-nowrap">
              INDICATOR_REQUIRES_CONFIGURATION — SELECT CONFIG TAB BELOW
            </span>
            <!-- Icon -->
            <div class="w-2 h-2 bg-white rotate-45 flex-shrink-0 animate-pulse"></div>
          </div>
        </div>
      </Transition>

      <!-- CENTERED NAVIGATION HUB -->
      <Transition name="hud-pop">
         <div v-if="navigationStack.length > 0" 
              class="absolute top-12 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center pointer-events-auto">
            <div class="flex items-center space-x-8 bg-nier-white dark:bg-nier-black border border-nier-border-light dark:border-nier-border-dark px-10 py-3 shadow-2xl relative">
               <!-- Decor Corners -->
               <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-nier-text-light/30 dark:border-nier-text-dark/30"></div>
               <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-nier-text-light/30 dark:border-nier-text-dark/30"></div>
               
               <div v-for="(crumb, idx) in breadcrumbs" :key="crumb.id || 'root'" class="flex items-center">
                  <button @click="jumpTo(idx === 0 ? null : idx - 1)" 
                          class="text-[10px] font-mono tracking-[0.4em] uppercase transition-all"
                          :class="idx === breadcrumbs.length - 1 ? 'opacity-100 font-black underline underline-offset-8 decoration-nier-text-light/30 dark:decoration-nier-text-dark/30' : 'opacity-30 hover:opacity-100'">
                     {{ crumb.label }}
                  </button>
                  <span v-if="idx < breadcrumbs.length - 1" class="mx-4 opacity-10 text-[10px]">/</span>
               </div>
            </div>
            <div class="mt-2 text-[7px] font-mono tracking-[0.6em] uppercase opacity-20 italic">
               Diagnostic_Neural_Path // Sub_Sequence_Active
            </div>
         </div>
      </Transition>


      <!-- VIEWPORT TELEMETRY -->
      <div v-if="!isScenarioContext" class="absolute top-32 left-12 flex flex-col space-y-8 z-[40]">

         <div class="flex items-center space-x-6">
            <div class="flex flex-col border-l border-nier-text-light/20 dark:border-nier-text-dark/20 pl-4 py-1">
               <span class="text-[8px] font-mono tracking-widest opacity-40 uppercase">
                 Viewport_Telemetry
               </span>
               <span class="text-[12px] font-mono tracking-widest opacity-80 uppercase">{{ (viewState.scale * 100).toFixed(0) }}% // FOCUS</span>
            </div>
            
             <button @click.stop="resetView" class="tactical-button w-8 h-8 border border-nier-text-light/20 dark:border-nier-text-dark/20 flex items-center justify-center hover:bg-nier-text-light/10 dark:hover:bg-nier-text-dark/10 transition-colors opacity-30 hover:opacity-100 italic text-[10px] font-mono">
               [R]
             </button>
         </div>

         <!-- FOCUS SELECTOR STRIP -->
         <div class="flex flex-col space-y-2 pl-4 border-l border-nier-text-light/10 dark:border-nier-text-dark/10">
            
            <div class="flex flex-col space-y-1">
               <button v-for="zoom in [25, 50, 75, 100, 150, 200]" :key="zoom"
                       @click.stop="viewState.scale = zoom / 100"
                       :class="[
                          Math.round(viewState.scale * 100) === zoom 
                            ? 'bg-nier-text-light dark:bg-nier-text-dark text-nier-white dark:text-nier-black opacity-100' 
                            : 'opacity-30 hover:opacity-100 hover:bg-nier-text-light/5 dark:hover:bg-nier-text-dark/5'
                       ]"
                       class="w-12 h-5 border border-nier-text-light/20 dark:border-nier-text-dark/20 text-[9px] font-mono tracking-tighter transition-all flex items-center justify-center relative overflow-hidden group/zoom">
                  <div v-if="Math.round(viewState.scale * 100) === zoom" class="absolute inset-0 bg-nier-text-light/10 dark:bg-nier-text-dark/10 animate-pulse"></div>
                  {{ zoom }}%
                  <div class="absolute right-0 top-0 w-1 h-1 bg-current opacity-20"></div>
               </button>
            </div>
         </div>
      </div>


        <Teleport to="body">
          <Transition name="hud-pop">
        
          <div v-if="!activeWire && activeTab === 'genesis'" 
               class="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center w-full max-w-3xl bg-nier-white/90 dark:bg-nier-black/90 backdrop-blur-xl border border-nier-border-light dark:border-nier-border-dark shadow-[0_30px_60px_rgba(0,0,0,0.4)] pointer-events-auto text-nier-text-light dark:text-nier-text-dark transition-colors duration-500"
               style="-webkit-backdrop-filter: blur(24px); backdrop-filter: blur(24px); transform: translateX(-50%) translateZ(0);">
            
            <!-- Corner Brackets -->
            <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-nier-text-light dark:border-nier-text-dark opacity-40"></div>
            <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-nier-text-light dark:border-nier-text-dark opacity-40"></div>

            <!-- Header Registry (Nier Style) -->
            <div class="w-full flex items-center justify-between px-6 py-2 border-b border-nier-border-light dark:border-nier-border-dark bg-nier-text-light/[0.03] dark:bg-nier-text-dark/[0.03]">
              <div class="flex items-center space-x-3">
                <div class="w-1.5 h-1.5 bg-nier-text-light dark:bg-nier-text-dark rotate-45 opacity-50"></div>
                <span class="text-[9px] font-mono tracking-[0.4em] uppercase font-black opacity-60">Command_Panel</span>
              </div>
              <div class="flex items-center space-x-4">

                 <div class="flex space-x-1">
                    <div v-for="i in 3" :key="i" class="w-1 h-2 border-r border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                 </div>
              </div>
            </div>

            <!-- Tier 2: Expansion Layer -->
            <div class="relative w-full flex px-6 transition-all duration-500"
                 :class="[activeMenuCategory ? 'pt-6 pb-6' : 'pt-0 pb-0', isScenarioContext ? 'overflow-visible' : 'overflow-hidden']">
                <div v-if="activeMenuCategory" class="w-full flex justify-center">

                <!-- TEXT FORMAT TOOLS -->
                  <div v-if="activeMenuCategory === 'TEXT_FORMAT' && activeTextNode" class="flex flex-wrap items-center justify-center gap-4 pointer-events-auto px-4 w-full">
                    <div class="flex items-center border border-nier-border-light dark:border-nier-border-dark">
                      <button v-for="preset in textFormatPresets"
                              :key="preset.id"
                              @mousedown.stop.prevent="applyTextBlock(preset.id)"
                              class="h-9 px-4 border-l first:border-l-0 border-nier-border-light dark:border-nier-border-dark text-[9px] font-mono font-black tracking-[0.25em] uppercase opacity-60 hover:opacity-100 transition-all">
                        {{ preset.label }}
                      </button>
                    </div>

                    <div class="h-9 px-3 border border-nier-border-light dark:border-nier-border-dark flex items-center gap-3">
                      <button @mousedown.stop.prevent="adjustTextCommandFontSize(-1)"
                              class="w-6 h-6 border border-nier-border-light dark:border-nier-border-dark flex items-center justify-center opacity-60 hover:opacity-100 text-[12px] font-mono">-</button>
                      <span class="text-[9px] font-mono font-black w-12 text-center">{{ activeTextFontSize }}px</span>
                      <button @mousedown.stop.prevent="adjustTextCommandFontSize(1)"
                              class="w-6 h-6 border border-nier-border-light dark:border-nier-border-dark flex items-center justify-center opacity-60 hover:opacity-100 text-[12px] font-mono">+</button>
                    </div>

                    <div class="flex items-center border border-nier-border-light dark:border-nier-border-dark">
                      <button @mousedown.stop.prevent="applyTextCommand('bold')"
                              class="h-9 w-11 flex items-center justify-center font-mono text-[13px] font-black opacity-60 hover:opacity-100 transition-all">B</button>
                      <button @mousedown.stop.prevent="applyTextCommand('italic')"
                              class="h-9 w-11 border-l border-nier-border-light dark:border-nier-border-dark flex items-center justify-center font-serif italic text-[15px] opacity-60 hover:opacity-100 transition-all">I</button>
                      <button @mousedown.stop.prevent="applyTextCommand('underline')"
                              class="h-9 w-11 border-l border-nier-border-light dark:border-nier-border-dark flex items-center justify-center font-mono text-[13px] underline opacity-60 hover:opacity-100 transition-all">U</button>
                    </div>

                    <div class="flex items-center border border-nier-border-light dark:border-nier-border-dark">
                      <button @mousedown.stop.prevent="applyTextCommand('insertUnorderedList')"
                              class="h-9 w-11 flex items-center justify-center font-mono text-[13px] font-black opacity-60 hover:opacity-100 transition-all">•</button>
                      <button @mousedown.stop.prevent="applyTextBlock('quote')"
                              class="h-9 w-11 border-l border-nier-border-light dark:border-nier-border-dark flex items-center justify-center font-serif text-[18px] opacity-60 hover:opacity-100 transition-all">“</button>
                    </div>

                    <label class="h-9 w-11 border border-nier-border-light dark:border-nier-border-dark flex items-center justify-center cursor-pointer relative overflow-hidden">
                      <span class="w-5 h-5 border border-nier-border-light dark:border-nier-border-dark"
                            :style="{ backgroundColor: activeTextColor }"></span>
                      <input :value="activeTextColor === 'currentColor' ? '#2c2c2a' : activeTextColor"
                             type="color"
                             class="absolute inset-0 opacity-0 cursor-pointer"
                             @mousedown.stop
                             @input="applyTextColor($event)" />
                    </label>
                    <button @mousedown.stop.prevent="resetTextColor"
                            class="h-9 w-11 border border-nier-border-light dark:border-nier-border-dark flex items-center justify-center opacity-60 hover:opacity-100 transition-all"
                            aria-label="Default text color">
                      <span class="w-5 h-5 border border-nier-border-light dark:border-nier-border-dark bg-nier-text-light dark:bg-nier-text-dark relative">
                        <span class="absolute left-1/2 top-[-3px] h-[26px] w-px bg-red-500 rotate-45 origin-center"></span>
                      </span>
                    </button>
                  </div>

                <!-- INDICATORS TOOLS (Universal Library) -->
                  <div v-if="activeMenuCategory === 'INDICATORS' && !isScenarioContext" class="flex flex-col items-center pointer-events-auto px-4 w-full">
                     
                      <!-- Indicator Categories -->
                      <div v-if="!indicatorSearchQuery" class="flex space-x-4 mb-3 border-b border-current/10 pb-2 w-full justify-center">
                         <button v-for="cat in indicatorData.categories" :key="cat.id"
                                 @click="activeIndicatorCategory = cat.id"
                                 :class="activeIndicatorCategory === cat.id ? 'opacity-100 text-current' : 'opacity-30'"
                                 class="text-[8px] font-mono tracking-[0.2em] uppercase hover:opacity-100 transition-all">
                           {{ cat.id }}
                         </button>
                         <div class="w-px h-3 bg-current opacity-10 mx-2"></div>
                         <button @click="activeIndicatorCategory = 'PERSONAL'"
                                 :class="activeIndicatorCategory === 'PERSONAL' ? 'opacity-100 text-current' : 'opacity-30'"
                                 class="text-[8px] font-mono tracking-[0.2em] uppercase hover:opacity-100 transition-all">
                           PERSONAL
                         </button>
                      </div>

                      <!-- Search Field & Action -->
                      <div class="flex items-center space-x-3 w-full max-w-sm mb-4">
                         <div class="relative flex-grow">
                            <ExInput v-model="indicatorSearchQuery"
                                     :prefix="`search`"
                                     placeholder="IDENTIFY_INDICATOR // FILTER..." />
                         </div>
                         <ExButton @click="isConditionCreatorOpen = true" variant="ghost" size="none" class="w-12 h-[34px] border-nier-border-light dark:border-nier-border-dark">
                            <span class="text-nier-text-light dark:text-nier-text-dark group-hover:text-nier-text-dark dark:group-hover:text-nier-text-light transition-colors font-black">+</span>
                         </ExButton>
                      </div>

                      <!-- Creator Component -->
                      <ExConditionCreator :is-open="isConditionCreatorOpen" 
                                          :is-dark="isDark"
                                          @close="isConditionCreatorOpen = false"
                                          @create="handleCreateCustomIndicator" />

                     <!-- Indicators Grid -->
                      <div class="flex space-x-4 overflow-x-auto pb-4 w-full max-w-full justify-start px-2 no-scrollbar scroll-smooth">
                        <div v-if="activeIndicatorCategory === 'PERSONAL' && indicatorTypes.length === 0" 
                             class="flex flex-col items-center justify-center w-full py-4 opacity-30">
                           <span class="text-[8px] font-mono tracking-[0.5em] uppercase">no personal conditions</span>
                        </div>
                        <ExNTtooltip v-for="type in indicatorTypes" :key="type.label" :title="type.label">
                          <template #trigger>
                            <button @click="addNode(type)"
                                    @contextmenu.prevent="activeIndicatorCategory === 'PERSONAL' && handlePersonalCondContextMenu($event, type)"
                                    class="group relative min-w-[48px] h-12 border border-nier-border-light dark:border-nier-border-dark flex flex-col items-center justify-center transition-all hover:border-nier-text-light dark:hover:border-nier-text-dark hover:scale-110 bg-nier-text-light/5 dark:bg-nier-text-dark/5 backdrop-blur-md px-4">
                               <span class="text-[8px] font-mono tracking-widest uppercase mb-1">{{ type.label }}</span>
                               <div class="text-[14px] font-mono font-black opacity-40 group-hover:opacity-100 transition-all tracking-tighter">
                                 {{ type.label.slice(0, 3).toUpperCase() }}
                               </div>
                               
                               <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                               <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                            </button>
                          </template>
                          <div class="flex flex-col gap-1 min-w-[180px]">
                            <span class="text-[8px] font-mono opacity-40 uppercase">TELEMETRY_DESCRIPTION</span>
                            <p class="text-[9px] font-mono leading-relaxed opacity-60 uppercase text-nier-text-light dark:text-nier-text-dark">{{ type.description || type.params?.description || 'INITIALIZE_SIGNAL_INDICATOR' }}</p>
                          </div>
                        </ExNTtooltip>
                      </div>
                   </div>
 
                 <!-- CONFIG TOOLS -->
                   <div v-if="activeMenuCategory === 'CONFIG' && !isScenarioContext" class="flex flex-col items-center pointer-events-auto px-4 w-full pt-4 pb-4">
                      <div class="flex flex-col items-center space-y-4">
                         <span class="text-[9px] font-mono tracking-[0.4em] uppercase font-black opacity-60">Configuration_Protocol_Required</span>
                         <div class="w-12 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-10"></div>
                         
                         <ExButton @click="isConfigSetterOpen = true" variant="ghost" class="w-12 h-12 border-nier-border-light dark:border-nier-border-dark flex items-center justify-center">
                            <span class="text-[20px] font-black">+</span>
                         </ExButton>
                         
                         <span class="text-[7px] font-mono tracking-widest uppercase opacity-20">Initialize_New_Configuration_Set</span>
                      </div>

                      <!-- Config Setter Component -->
                      <ExConfigSetter :is-open="isConfigSetterOpen" 
                                       :color="effectiveSelectedNode?.params?.color || undefined"
                                       @close="isConfigSetterOpen = false"
                                       @create="handleCreateConfig" />
                   </div>
 
                <!-- EMOTIONS TOOLS -->
                  <div v-if="activeMenuCategory === 'EMOTIONS' && !isScenarioContext" class="flex flex-col items-center pointer-events-auto px-4 w-full">
                    
                    <!-- Mode B: Emotion Selection -->
                    <div class="flex flex-col items-center w-full relative">
                       <div class="flex items-center space-x-6 mb-2">
                          <button v-for="tab in (['NEGATIVE', 'POSITIVE', 'NEUTRAL'] as const)" :key="tab"
                                  @click="activeEmotionTab = tab"
                                  class="relative py-2 px-1 text-[9px] font-mono tracking-[0.3em] transition-all"
                                  :class="activeEmotionTab === tab ? 'text-current font-black' : 'opacity-20 hover:opacity-100'">
                            {{ tab }}
                            <div v-if="activeEmotionTab === tab" class="absolute bottom-0 left-0 w-full h-[2px] bg-current"></div>
                          </button>
                       </div>
                       
                        <div class="flex space-x-3 overflow-x-auto pt-6 pb-8 w-full justify-start px-12 no-scrollbar scroll-smooth">
                          <ExNTtooltip v-for="emotion in emotionLibrary.filter((e: any) => e.type === activeEmotionTab.toLowerCase())" :key="emotion.label" :title="emotion.label">
                            <template #trigger>
                              <button @click="addNode({ label: emotion.label, type: 'emotion-state', params: { emotionType: emotion.type, remedies: emotion.remedies, info: emotion.info, description: emotion.description } })"
                                      :class="[
                                        emotion.type === 'negative' 
                                          ? 'bg-nier-black text-nier-white border-nier-text-light/40 dark:border-nier-text-dark/40 group-hover:border-nier-white' 
                                          : emotion.type === 'neutral'
                                          ? 'bg-nier-text-light/10 dark:bg-nier-text-dark/10 text-nier-text-light dark:text-nier-text-dark border-nier-text-light/20 dark:border-nier-text-dark/20 group-hover:border-nier-text-light dark:group-hover:border-nier-text-dark'
                                          : 'bg-nier-text-light/5 dark:bg-nier-text-dark/5 text-nier-text-light dark:text-nier-text-dark border-nier-text-light/20 dark:border-nier-text-dark/20 group-hover:border-nier-text-light dark:group-hover:border-nier-text-dark'
                                      ]"
                                      class="group relative w-12 h-12 border flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 backdrop-blur-md flex-shrink-0">
                                 
                                 <span class="text-[12px] font-mono font-black tracking-tighter uppercase leading-none">
                                   {{ emotion.label.slice(0, 2) }}
                                 </span>
                                 
                                 <!-- Corner decorations -->
                                 <div class="absolute top-0 left-0 w-1 h-1 border-t border-l border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                                 <div class="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                              </button>
                            </template>
                            <div class="flex flex-col gap-1 min-w-[180px]">
                              <span class="text-[8px] font-mono opacity-40 uppercase">PSYCH_TELEMETRY</span>
                              <p class="text-[9px] font-mono leading-relaxed opacity-60 uppercase text-nier-text-light dark:text-nier-text-dark">{{ emotion.description }}</p>
                            </div>
                          </ExNTtooltip>
                        </div>

                       <!-- Scroll Indicators (Optional visual hint) -->
                       <div class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 border-l border-current opacity-10 pointer-events-none"></div>
            <div class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-r border-current opacity-10 pointer-events-none"></div>
                    </div>
                  </div>
               
               <!-- STEPS TOOLS -->
                   <div v-if="activeMenuCategory === 'STEPS' && !isScenarioContext" class="flex flex-col items-center pointer-events-auto px-4 w-full">
                     
                     <!-- Pagination Wrapper -->
                     <div class="flex items-center space-x-12 mb-8 w-full justify-center">
                        <button @click="currentStepPage = (currentStepPage - 1 + stepPagesCount) % stepPagesCount"
                                class="opacity-20 hover:opacity-100 transition-opacity p-2 hover:scale-110">
                           <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M15 18L9 12L15 6" />
                           </svg>
                        </button>

                        <div class="flex flex-col items-center min-w-[300px]">
                           <!-- Page 0: Numeric -->
                           <div v-if="currentStepPage === 0" class="flex flex-col items-center animate-in fade-in slide-in-from-left-4 duration-500">
                              <div class="flex flex-col items-center mb-4">
                                 <span class="text-[7px] font-mono uppercase opacity-30 tracking-[0.3em] italic">Registry</span>
                                 <span class="text-[9px] font-mono uppercase font-black tracking-widest text-nier-text-light dark:text-nier-text-dark">01 // NUMERIC_PROTOCOL</span>
                              </div>
                              <div class="flex gap-3">
                                 <ExNTtooltip v-for="num in stepPresets.numeric" :key="num" :title="`Step ${num}`">
                                   <template #trigger>
                                     <button @click="addNode({ type: 'step', label: num })"
                                             class="group relative w-12 h-12 border border-nier-border-light dark:border-nier-border-dark flex flex-col items-center justify-center transition-all hover:scale-110 hover:border-nier-text-light dark:hover:border-nier-text-dark bg-nier-text-light dark:bg-nier-text-dark text-nier-white dark:text-nier-black backdrop-blur-md">
                                       <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20 dark:border-black/20 group-hover:border-white dark:group-hover:border-black opacity-20 group-hover:opacity-100 transition-opacity"></div>
                                       <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20 dark:border-black/20 group-hover:border-white dark:group-hover:border-black opacity-20 group-hover:opacity-100 transition-opacity"></div>
                                       <span class="text-[14px] font-mono font-black">{{ num }}</span>
                                     </button>
                                   </template>
                                   <span class="text-xs">Initialize numerical sequence step {{ num }}</span>
                                 </ExNTtooltip>
                              </div>
                           </div>

                           <!-- Page 1: Alpha -->
                           <div v-if="currentStepPage === 1" class="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500">
                              <div class="flex flex-col items-center mb-4">
                                 <span class="text-[7px] font-mono uppercase opacity-30 tracking-[0.3em] italic">Protocol</span>
                                 <span class="text-[9px] font-mono uppercase font-black tracking-widest text-nier-text-light dark:text-nier-text-dark">02 // ALPHA_PROTOCOL</span>
                              </div>
                              <div class="flex gap-3">
                                 <ExNTtooltip v-for="alpha in stepPresets.alpha" :key="alpha" :title="`Step ${alpha}`">
                                   <template #trigger>
                                     <button @click="addNode({ type: 'step', label: alpha })"
                                             class="group relative w-12 h-12 border border-nier-border-light dark:border-nier-border-dark flex flex-col items-center justify-center transition-all hover:scale-110 hover:border-nier-text-light dark:hover:border-nier-text-dark bg-nier-text-light dark:bg-nier-text-dark text-nier-white dark:text-nier-black backdrop-blur-md">
                                       <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20 dark:border-black/20 group-hover:border-white dark:group-hover:border-black opacity-20 group-hover:opacity-100 transition-opacity"></div>
                                       <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20 dark:border-black/20 group-hover:border-white dark:group-hover:border-black opacity-20 group-hover:opacity-100 transition-opacity"></div>
                                       <span class="text-[14px] font-mono font-black">{{ alpha }}</span>
                                     </button>
                                   </template>
                                   <span class="text-xs">Initialize alphabetic sequence step {{ alpha }}</span>
                                 </ExNTtooltip>
                              </div>
                           </div>

                           <!-- Page 2: Roman -->
                           <div v-if="currentStepPage === 2" class="flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500">
                              <div class="flex flex-col items-center mb-4">
                                 <span class="text-[7px] font-mono uppercase opacity-30 tracking-[0.3em] italic">System</span>
                                 <span class="text-[9px] font-mono uppercase font-black tracking-widest text-nier-text-light dark:text-nier-text-dark">03 // ROMAN_PROTOCOL</span>
                              </div>
                              <div class="flex gap-3">
                                 <ExNTtooltip v-for="rom in stepPresets.roman" :key="rom" :title="`Step ${rom}`">
                                   <template #trigger>
                                     <button @click="addNode({ type: 'step', label: rom })"
                                             class="group relative min-w-[48px] px-3 h-12 border border-nier-border-light dark:border-nier-border-dark flex flex-col items-center justify-center transition-all hover:scale-110 hover:border-nier-text-light dark:hover:border-nier-text-dark bg-nier-text-light dark:bg-nier-text-dark text-nier-white dark:text-nier-black backdrop-blur-md">
                                       <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20 dark:border-black/20 group-hover:border-white dark:group-hover:border-black opacity-20 group-hover:opacity-100 transition-opacity"></div>
                                       <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/20 dark:border-black/20 group-hover:border-white dark:group-hover:border-black opacity-20 group-hover:opacity-100 transition-opacity"></div>
                                       <span class="text-[12px] font-mono font-black tracking-widest">{{ rom }}</span>
                                     </button>
                                   </template>
                                   <span class="text-xs">Initialize roman sequence step {{ rom }}</span>
                                 </ExNTtooltip>
                              </div>
                           </div>
                        </div>

                        <button @click="currentStepPage = (currentStepPage + 1) % stepPagesCount"
                                class="opacity-20 hover:opacity-100 transition-opacity p-2 hover:scale-110">
                           <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M9 18L15 12L9 6" />
                           </svg>
                        </button>
                     </div>

                     <!-- Custom Step Input -->
                     <div class="flex items-center w-full max-w-sm space-x-2 border-t border-nier-text-light/5 dark:border-nier-text-dark/5 pt-6 justify-center">
                        <ExInput v-model="customStepInput"
                               @keyup.enter="customStepInput ? addNode({ type: 'step', label: customStepInput }) : null; customStepInput = ''"
                               placeholder="IDENTIFY_SEQUENCE_ID..."
                               class="flex-1 hide-spinners" />
                        <ExButton @click="customStepInput ? addNode({ type: 'step', label: customStepInput }) : null; customStepInput = ''"
                                  variant="ghost" size="none" class="w-12 h-[34px] border-nier-border-light dark:border-nier-border-dark">
                           <span class="text-nier-text-light dark:text-nier-text-dark group-hover:text-nier-text-dark dark:group-hover:text-nier-text-light transition-colors">+</span>
                        </ExButton>
                     </div>
                  </div>
               
               <!-- LOGIC TOOLS -->
                  <div v-if="activeMenuCategory === 'LOGIC' && !isScenarioContext" class="flex space-x-6 pointer-events-auto">
                    <ExNTtooltip v-for="type in skillTypes" :key="type.label" :title="type.label">
                      <template #trigger>
                        <button @click="addNode(type)"
                                class="group relative w-12 h-12 border border-nier-border-light dark:border-nier-border-dark flex items-center justify-center transition-all hover:border-nier-text-light dark:hover:border-nier-text-dark hover:scale-110 bg-nier-text-light/5 dark:bg-nier-text-dark/5 backdrop-blur-md">
                           <svg class="w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity text-nier-text-light dark:text-nier-text-dark" 
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                              <path v-if="type.type === 'strategy'" d="M12 4L20 18H4L12 4z" />
                              <rect v-else-if="type.type === 'scenario'" x="3" y="3" width="18" height="18" />
                              <circle v-else-if="type.type === 'condition'" cx="12" cy="12" r="9" />
                              <path v-else-if="type.type === 'emotion'" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                              <g v-else-if="type.type === 'risk'">
                                 <path d="M12 5v8M12 18v0.01" stroke-width="2.5" stroke-linecap="round" />
                              </g>
                              <rect v-else-if="type.type === 'image'" x="3" y="3" width="18" height="18" rx="2" />
                           </svg>
                           
                           <!-- Corner decorations -->
                           <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                           <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                        </button>
                      </template>
                      <div class="flex flex-col gap-1 min-w-[220px]">
                        <span class="text-[8px] font-mono opacity-40 uppercase">REIFY_SEQUENCE</span>
                        <template v-if="type.description">
                          <p class="text-[9px] font-mono leading-relaxed opacity-60 uppercase text-nier-text-light dark:text-nier-text-dark">{{ type.description }}</p>
                        </template>
                        <template v-else>
                          <p class="text-[9px] font-mono leading-relaxed opacity-60 uppercase text-nier-text-light dark:text-nier-text-dark">Establish high-level tactical logic node for strategic branch validation.</p>
                        </template>
                      </div>
                    </ExNTtooltip>
                  </div>

               <!-- LABELS TOOLS -->
                  <div v-if="activeMenuCategory === 'LABELS'" class="flex flex-col items-center pointer-events-auto px-4 w-full">
                    <div class="flex items-center gap-3 mb-5">
                      <div class="w-8 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-10"></div>
                      <span class="text-[8px] font-mono tracking-[0.45em] uppercase opacity-40">{{ t('Label_Sequence_Layer') }}</span>
                      <div class="w-8 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-10"></div>
                    </div>
                    <div class="flex space-x-4 overflow-visible px-2 py-2 max-w-full">
                      <ExNTtooltip v-for="type in labelTypes" :key="type.label" :title="t(type.label)">
                        <template #trigger>
                          <button @click="addNode(type)"
                                  class="group relative min-w-[64px] h-14 border border-nier-border-light dark:border-nier-border-dark flex flex-col items-center justify-center transition-all hover:border-nier-text-light dark:hover:border-nier-text-dark hover:scale-105 bg-nier-text-light/5 dark:bg-nier-text-dark/5 backdrop-blur-md px-3">
                            <span class="text-[8px] font-mono tracking-widest uppercase opacity-45 group-hover:opacity-100 transition-opacity">{{ type.params.shortCode }}</span>
                            <span class="text-[7px] font-mono tracking-[0.18em] uppercase mt-1 opacity-35 group-hover:opacity-80 transition-opacity whitespace-nowrap">{{ t(type.params.menuLabel) }}</span>
                            <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                            <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                          </button>
                        </template>
                        <div class="flex flex-col gap-1 min-w-[220px]">
                          <span class="text-[8px] font-mono opacity-40 uppercase">{{ t(type.params.protocol) }}</span>
                          <p class="text-[9px] font-mono leading-relaxed opacity-60 uppercase text-nier-text-light dark:text-nier-text-dark">{{ t(type.description) }}</p>
                        </div>
                      </ExNTtooltip>
                    </div>
                  </div>

               <!-- SCENARIO DOCUMENTATION TOOLS -->
                  <div v-if="activeMenuCategory === 'SCENARIO_DOCS'" class="flex flex-col items-center pointer-events-auto px-4 w-full">
                    <div class="flex items-center gap-3 mb-5">
                      <div class="w-8 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-10"></div>
                      <span class="text-[8px] font-mono tracking-[0.45em] uppercase opacity-40">Scenario_Explanation_Layer</span>
                      <div class="w-8 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-10"></div>
                    </div>
                    <div class="flex space-x-4 overflow-visible px-2 py-2 max-w-full">
                      <ExNTtooltip v-for="type in scenarioDocumentationTypes" :key="type.label" :title="type.label">
                        <template #trigger>
                          <button @click="addNode(type)"
                                  class="group relative min-w-[64px] h-14 border border-nier-border-light dark:border-nier-border-dark flex flex-col items-center justify-center transition-all hover:border-nier-text-light dark:hover:border-nier-text-dark hover:scale-105 bg-nier-text-light/5 dark:bg-nier-text-dark/5 backdrop-blur-md px-3">
                            <span class="text-[8px] font-mono tracking-widest uppercase opacity-45 group-hover:opacity-100 transition-opacity">{{ type.params.shortCode }}</span>
                            <span class="text-[7px] font-mono tracking-[0.18em] uppercase mt-1 opacity-35 group-hover:opacity-80 transition-opacity whitespace-nowrap">{{ type.params.menuLabel }}</span>
                            <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                            <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                          </button>
                        </template>
                        <div class="flex flex-col gap-1 min-w-[220px]">
                          <span class="text-[8px] font-mono opacity-40 uppercase">{{ type.params.protocol }}</span>
                          <p class="text-[9px] font-mono leading-relaxed opacity-60 uppercase text-nier-text-light dark:text-nier-text-dark">{{ type.description }}</p>
                        </div>
                      </ExNTtooltip>
                    </div>
                  </div>

               <!-- SCENARIO VISUAL TOOLS -->
                  <div v-if="activeMenuCategory === 'SCENARIO_VISUALS'" class="flex flex-col items-center pointer-events-auto px-4 w-full">
                    <div class="flex items-center gap-3 mb-5">
                      <div class="w-8 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-10"></div>
                      <span class="text-[8px] font-mono tracking-[0.45em] uppercase opacity-40">Evidence_And_Markup_Layer</span>
                      <div class="w-8 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-10"></div>
                    </div>
                    <div class="flex space-x-4 overflow-visible px-2 py-2 max-w-full">
                      <ExNTtooltip v-for="type in scenarioVisualTypes" :key="type.label" :title="type.label">
                        <template #trigger>
                          <button @click="addNode(type)"
                                  class="group relative min-w-[64px] h-14 border border-nier-border-light dark:border-nier-border-dark flex flex-col items-center justify-center transition-all hover:border-nier-text-light dark:hover:border-nier-text-dark hover:scale-105 bg-nier-text-light/5 dark:bg-nier-text-dark/5 backdrop-blur-md px-3">
                            <span class="text-[8px] font-mono tracking-widest uppercase opacity-45 group-hover:opacity-100 transition-opacity">{{ type.params.shortCode }}</span>
                            <span class="text-[7px] font-mono tracking-[0.18em] uppercase mt-1 opacity-35 group-hover:opacity-80 transition-opacity whitespace-nowrap">{{ type.params.menuLabel }}</span>
                            <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                            <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                          </button>
                        </template>
                        <div class="flex flex-col gap-1 min-w-[220px]">
                          <span class="text-[8px] font-mono opacity-40 uppercase">{{ type.params.protocol }}</span>
                          <p class="text-[9px] font-mono leading-relaxed opacity-60 uppercase text-nier-text-light dark:text-nier-text-dark">{{ type.description }}</p>
                        </div>
                      </ExNTtooltip>
                    </div>
                  </div>

               <!-- SCENARIO AUDIO TOOLS -->
                  <div v-if="activeMenuCategory === 'SCENARIO_AUDIO'" class="flex flex-col items-center pointer-events-auto px-4 w-full">
                    <div class="flex items-center gap-3 mb-5">
                      <div class="w-8 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-10"></div>
                      <span class="text-[8px] font-mono tracking-[0.45em] uppercase opacity-40">Audio_Note_Layer</span>
                      <div class="w-8 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-10"></div>
                    </div>
                    <div class="flex items-center gap-3 overflow-visible px-2 py-2 max-w-full">
                      <div v-if="matrixAudioErrorLabel" class="min-w-[180px] h-14 border border-red-500/40 bg-red-500/5 backdrop-blur-md flex flex-col justify-center px-4">
                        <span class="text-[7px] font-mono tracking-[0.12em] uppercase text-red-500 truncate">{{ matrixAudioErrorLabel }}</span>
                      </div>
                      <button v-if="matrixAudioRecordingState === 'idle'"
                              @click="startMatrixAudioRecording"
                              class="group relative min-w-[64px] h-14 border border-nier-border-light dark:border-nier-border-dark flex flex-col items-center justify-center transition-all hover:border-nier-text-light dark:hover:border-nier-text-dark hover:scale-105 bg-nier-text-light/5 dark:bg-nier-text-dark/5 backdrop-blur-md px-3">
                        <span class="w-3 h-3 rounded-full bg-red-500"></span>
                        <span class="text-[7px] font-mono tracking-[0.18em] uppercase mt-2 opacity-45 group-hover:opacity-80 transition-opacity whitespace-nowrap">START</span>
                        <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                        <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                      </button>
                      <button v-if="matrixAudioRecordingState === 'recording'"
                              @click="pauseMatrixAudioRecording"
                              class="group relative min-w-[64px] h-14 border border-nier-border-light dark:border-nier-border-dark flex flex-col items-center justify-center transition-all hover:border-nier-text-light dark:hover:border-nier-text-dark hover:scale-105 bg-nier-text-light/5 dark:bg-nier-text-dark/5 backdrop-blur-md px-3">
                        <span class="w-4 h-4 border-x-4 border-nier-text-light dark:border-nier-text-dark"></span>
                        <span class="text-[7px] font-mono tracking-[0.18em] uppercase mt-2 opacity-45 group-hover:opacity-80 transition-opacity whitespace-nowrap">PAUSE</span>
                      </button>
                      <button v-if="matrixAudioRecordingState === 'paused'"
                              @click="resumeMatrixAudioRecording"
                              class="group relative min-w-[64px] h-14 border border-nier-border-light dark:border-nier-border-dark flex flex-col items-center justify-center transition-all hover:border-nier-text-light dark:hover:border-nier-text-dark hover:scale-105 bg-nier-text-light/5 dark:bg-nier-text-dark/5 backdrop-blur-md px-3">
                        <span class="w-0 h-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-nier-text-light dark:border-l-nier-text-dark ml-1"></span>
                        <span class="text-[7px] font-mono tracking-[0.18em] uppercase mt-2 opacity-45 group-hover:opacity-80 transition-opacity whitespace-nowrap">RESUME</span>
                      </button>
                      <button v-if="matrixAudioRecordingState !== 'idle'"
                              @click="finishMatrixAudioRecording"
                              class="group relative min-w-[64px] h-14 border border-red-500/50 flex flex-col items-center justify-center transition-all hover:border-red-500 hover:scale-105 bg-red-500/5 backdrop-blur-md px-3">
                        <span class="w-3 h-3 bg-red-500"></span>
                                       <span class="text-[7px] font-mono tracking-[0.18em] uppercase mt-2 opacity-55 group-hover:opacity-90 transition-opacity whitespace-nowrap">FINISH</span>
                                     </button>
                                   </div>
                                 </div>

                              <!-- DOMAINS TOOLS -->
                                 <div v-if="activeMenuCategory === 'DOMAINS' && !isScenarioContext" class="flex space-x-6 pointer-events-auto">
                                   <ExNTtooltip v-for="zoneType in (['entry', 'in-trade', 'exit'] as const)" :key="zoneType" :title="locale === 'ru' && t(`${zoneType.toUpperCase()}_ZONE`) ? t(`${zoneType.toUpperCase()}_ZONE`) : `${zoneType.toUpperCase()}_ZONE`">
                                     <template #trigger>
                                       <button @click="activateZoneTool(zoneType)"
                                               :class="[
                                                 isZoneToolActive && selectedZoneType === zoneType ? 'border-nier-text-light dark:border-nier-text-dark bg-nier-text-light/10 dark:bg-nier-text-dark/10 scale-110' : 'border-nier-border-light dark:border-nier-border-dark'
                                               ]"
                                               class="group relative w-12 h-12 border flex items-center justify-center transition-all hover:border-nier-text-light dark:hover:border-nier-text-dark bg-nier-text-light/5 dark:bg-nier-text-dark/5 backdrop-blur-md">
                                          <div v-if="zoneType === 'entry'" class="w-4 h-4 border border-nier-text-light dark:border-nier-text-dark opacity-40 group-hover:opacity-100"></div>
                                          <div v-if="zoneType === 'in-trade'" class="w-4 h-4 border border-nier-text-light dark:border-nier-text-dark border-dashed opacity-40 group-hover:opacity-100"></div>
                                          <div v-if="zoneType === 'exit'" class="w-4 h-4 border-2 border-nier-text-light dark:border-nier-text-dark opacity-40 group-hover:opacity-100"></div>
                                       </button>
                                     </template>
                                     <span class="text-xs">{{ locale === 'ru' ? 'Создать поведенческую зону' : 'Construct behavioral domain' }}: {{ locale === 'ru' && t(zoneType) ? t(zoneType).toUpperCase() : zoneType.toUpperCase() }}</span>
                                   </ExNTtooltip>
                                   
                                   <div class="w-px h-12 bg-nier-text-light/10 dark:bg-nier-text-dark/10 mx-2"></div>

                                   <!-- New Session Tool -->
                                   <ExNTtooltip :title="locale === 'ru' && t('SESSION_ZONE') ? t('SESSION_ZONE') : 'SESSION_ZONE'">
                                     <template #trigger>
                                       <button @click="activateZoneTool('session')"
                                               :class="[
                                                 isZoneToolActive && selectedZoneType === 'session' ? 'border-nier-text-light dark:border-nier-text-dark bg-nier-text-light/10 dark:bg-nier-text-dark/10 scale-110' : 'border-nier-border-light dark:border-nier-border-dark'
                                               ]"
                                               class="group relative w-12 h-12 border flex items-center justify-center transition-all hover:border-nier-text-light dark:hover:border-nier-text-dark bg-nier-text-light/5 dark:bg-nier-text-dark/5 backdrop-blur-md">
                                          <svg class="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 6v6l4 2" />
                                          </svg>
                                       </button>
                                     </template>
                                     <span class="text-xs">{{ locale === 'ru' ? 'Создать временную зону сессии' : 'Establish temporal session domain' }}</span>
                                   </ExNTtooltip>
                                 </div>

                              <!-- METHODS TOOLS -->
                                 <div v-if="activeMenuCategory === 'METHODS' && !isScenarioContext" class="flex space-x-6 pointer-events-auto">
                    <ExNTtooltip v-for="type in methodTypes" :key="type.label" :title="type.label">
                      <template #trigger>
                        <button @click="addNode(type)"
                                class="group relative w-12 h-12 border border-nier-border-light dark:border-nier-border-dark flex items-center justify-center transition-all hover:border-nier-text-light dark:hover:border-nier-text-dark hover:scale-110 bg-nier-text-light/5 dark:bg-nier-text-dark/5 backdrop-blur-md">
                           <svg class="w-6 h-6 opacity-40 group-hover:opacity-100 transition-opacity text-nier-text-light dark:text-nier-text-dark" 
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                              <path v-if="type.type === 'pyramiding'" d="M21 21H3M18 17H6M15 13H9M12 9V3" />
                              <g v-else-if="type.type === 'averaging'">
                                <circle cx="12" cy="12" r="9" />
                                <circle cx="12" cy="12" r="5" />
                              </g>
                           </svg>

                           <!-- Corner decorations -->
                           <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                           <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                        </button>
                      </template>
                      <div class="flex flex-col gap-1 min-w-[220px]">
                        <span class="text-[8px] font-mono opacity-40 uppercase">EXECUTION_METHOD</span>
                        <p class="text-[11px] font-mono font-bold opacity-80">{{ type.description }}</p>
                      </div>
                    </ExNTtooltip>
                 </div>

               <!-- SCALING TOOLS ( Entry Configuration ) -->
                  <div v-if="activeMenuCategory === 'SCALING' && !isScenarioContext" class="flex flex-col items-center pointer-events-auto px-4 w-full">
                    <div class="flex flex-col items-center w-full space-y-3">
                       <span class="text-[8px] font-mono tracking-[0.4em] uppercase opacity-40">Configure_Scaling_Entry</span>
                       <div class="flex items-end space-x-2">

                          <!-- Size Mode + Value (combined) -->
                          <div class="flex flex-col items-center">
                             <!-- Mode Switcher -->
                             <div class="flex mb-1 border border-nier-border-light dark:border-nier-border-dark overflow-hidden">
                                <button @click="scalingMode = 'LOTS'"
                                        :class="scalingMode === 'LOTS' ? 'bg-nier-text-light dark:bg-nier-text-dark text-nier-white dark:text-nier-black' : 'bg-transparent text-nier-text-light dark:text-nier-text-dark opacity-40 hover:opacity-100'"
                                        class="px-2 py-0.5 text-[8px] font-mono font-black uppercase tracking-wider transition-all h-[18px]">
                                   LOTS
                                </button>
                                <button @click="scalingMode = 'PERCENT'"
                                        :class="scalingMode === 'PERCENT' ? 'bg-nier-text-light dark:bg-nier-text-dark text-nier-white dark:text-nier-black' : 'bg-transparent text-nier-text-light dark:text-nier-text-dark opacity-40 hover:opacity-100'"
                                        class="px-2 py-0.5 text-[8px] font-mono font-black uppercase tracking-wider transition-all h-[18px]">
                                   %CAP
                                </button>
                             </div>
                             <ExInput v-model.number="scalingLots" type="number" min="0.01" step="0.01"
                                    class="w-20 hide-spinners" />
                          </div>

                          <!-- "in" separator -->
                          <span class="text-[9px] font-mono opacity-30 pb-2">in</span>

                          <!-- Step value + Unit toggle -->
                          <div class="flex flex-col items-center">
                             <span class="text-[7px] font-mono uppercase opacity-40 mb-1">Distance</span>
                             <div class="flex">
                                <ExInput v-model.number="scalingStep" type="number" step="0.01"
                                       class="w-20 hide-spinners" />
                                <button @click="scalingUnit = scalingUnit === '%' ? '$' : '%'"
                                        class="px-3 py-2 border border-nier-border-light dark:border-nier-border-dark bg-nier-text-light/10 dark:bg-nier-text-dark/10 text-[12px] font-mono font-bold hover:bg-nier-text-light dark:hover:bg-nier-text-dark hover:text-nier-white dark:hover:text-nier-black transition-all h-[34px]">
                                   {{ scalingUnit }}
                                </button>
                             </div>
                          </div>

                          <!-- Action Button -->
                          <ExButton v-if="effectiveSelectedNode?.type === 'scaling-entry'" 
                                    @click="updateScalingEntry" variant="ghost" size="sm" class="h-[34px] border-nier-text-light/60 dark:border-nier-text-dark/60 px-4">
                             CHANGE <span class="ml-2 text-nier-text-light dark:text-nier-text-dark group-hover:text-nier-white dark:group-hover:text-nier-black transition-colors">⟳</span>
                          </ExButton>
                          <ExButton v-else @click="addScalingEntry" variant="ghost" size="sm" class="h-[34px] border-nier-text-light/60 dark:border-nier-text-dark/60 px-4">
                             ADD <span class="ml-2 text-nier-text-light dark:text-nier-text-dark group-hover:text-nier-white dark:group-hover:text-nier-black transition-colors">+</span>
                          </ExButton>
                       </div>
                    </div>
                 </div>

               <!-- RISK TOOLS ( Strategic Parameters ) -->
                  <div v-if="activeMenuCategory === 'RISK' && !isScenarioContext" class="flex flex-col items-center pointer-events-auto max-w-2xl px-4 w-full">
                    <div class="flex flex-col items-center w-full space-y-3">
                        <div class="flex items-center relative w-full px-16">
                           <!-- Left Navigation -->
                           <button @click="currentRiskStep = (currentRiskStep - 1 + riskStepsCount) % riskStepsCount"
                                   class="absolute left-0 top-1/2 -translate-y-1/2 p-4 opacity-30 hover:opacity-100 hover:scale-125 transition-all text-nier-text-light dark:text-nier-text-dark z-10">
                              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                 <path d="M15 18l-6-6 6-6" />
                              </svg>
                           </button>

                           <!-- Risk Step 0: Max Loss / Trade -->
                           <div v-if="currentRiskStep === 0" class="flex flex-col items-center w-full py-4 animate-in fade-in slide-in-from-left-8 duration-700">
                              <span class="text-[10px] font-mono uppercase tracking-[0.5em] font-black mb-6 text-nier-text-light dark:text-nier-text-dark">01 // MAX_LOSS_PER_TRADE</span>
                              <div class="relative space-x-4 w-full flex justify-center">
                                 <ExInput v-model.number="riskLossTrade" type="number" step="0.1"
                                        class="w-full hide-spinners text-center" />
                                 <!-- Actions -->
                                 <div class="flex items-center space-x-2">
                                    <button @click="riskLossTradeUnit = riskLossTradeUnit === '%' ? '$' : '%'"
                                            class="w-12 h-[34px] border border-nier-border-light dark:border-nier-border-dark bg-nier-text-light/5 dark:bg-nier-text-dark/5 text-[12px] font-mono font-bold hover:bg-nier-text-light dark:hover:bg-nier-text-dark hover:text-nier-white dark:hover:text-nier-black transition-all flex items-center justify-center">
                                       {{ riskLossTradeUnit }}
                                    </button>
                                    <ExButton @click="addRiskParameter('trade')" variant="ghost" size="none" class="w-12 h-[34px] border-nier-border-light/40 dark:border-nier-border-dark/40">
                                       <span class="text-nier-text-light dark:text-nier-text-dark group-hover:text-nier-white dark:group-hover:text-nier-black transition-colors">+</span>
                                    </ExButton>
                                 </div>
                              </div>
                           </div>

                           <!-- Risk Step 1: Max Loss / Day -->
                           <div v-if="currentRiskStep === 1" class="flex flex-col items-center w-full py-4 animate-in fade-in slide-in-from-right-8 duration-700">
                              <span class="text-[10px] font-mono uppercase tracking-[0.5em] font-black mb-6 text-nier-text-light dark:text-nier-text-dark">02 // MAX_LOSS_PER_SESSION</span>
                              <div class="relative space-x-4 w-full flex justify-center">
                                 <ExInput v-model.number="riskLossDay" type="number"
                                        class="w-full hide-spinners text-center" />
                                 <!-- Actions -->
                                 <div class="flex items-center space-x-2">
                                    <button @click="riskLossDayUnit = riskLossDayUnit === '%' ? '$' : '%'"
                                            class="w-12 h-[34px] border border-nier-border-light dark:border-nier-border-dark bg-nier-text-light/5 dark:bg-nier-text-dark/5 text-[12px] font-mono font-bold hover:bg-nier-text-light dark:hover:bg-nier-text-dark hover:text-nier-white dark:hover:text-nier-black transition-all flex items-center justify-center">
                                       {{ riskLossDayUnit }}
                                    </button>
                                    <ExButton @click="addRiskParameter('day')" variant="ghost" size="none" class="w-12 h-[34px] border-nier-border-light/40 dark:border-nier-border-dark/40">
                                       <span class="text-nier-text-light dark:text-nier-text-dark group-hover:text-nier-white dark:group-hover:text-nier-black transition-colors">+</span>
                                    </ExButton>
                                 </div>
                              </div>
                           </div>

                           <!-- Risk Step 2: R/R Ratio -->
                           <div v-if="currentRiskStep === 2" class="flex flex-col items-center w-full py-4 animate-in fade-in slide-in-from-right-8 duration-700">
                              <span class="text-[10px] font-mono uppercase tracking-[0.5em] font-black mb-6 text-nier-text-light dark:text-nier-text-dark">03 // RISK_REWARD_RATIO</span>
                              <div class="relative space-x-4 w-full flex justify-center">
                                 <div class="flex items-center space-x-3 bg-nier-white dark:bg-nier-black border border-nier-border-light dark:border-nier-border-dark px-6 h-[34px]">
                                    <span class="text-[11px] font-mono opacity-40 tracking-widest whitespace-nowrap">TARGET_RATIO 1:</span>
                                    <input v-model.number="riskRR" type="number" step="0.1"
                                           class="w-full bg-transparent border-none p-0 text-[12px] font-mono text-center outline-none focus:ring-0 text-nier-text-light dark:text-nier-text-dark hide-spinners font-bold" />
                                 </div>
                                 <!-- Actions -->
                                 <div class="flex items-center space-x-2">
                                    <div class="w-12 h-[34px] flex items-center justify-center border border-nier-text-light/5 dark:border-nier-text-dark/5 text-[12px] font-mono opacity-20">R</div>
                                    <ExButton @click="addRiskParameter('rr')" variant="ghost" size="none" class="w-12 h-[34px] border-nier-border-light/40 dark:border-nier-border-dark/40">
                                       <span class="text-nier-text-light dark:text-nier-text-dark group-hover:text-nier-white dark:group-hover:text-nier-black transition-colors">+</span>
                                    </ExButton>
                                 </div>
                              </div>
                           </div>

                           <!-- Risk Step 3: Trading Styles -->
                           <div v-if="currentRiskStep === 3" class="flex flex-col items-center justify-center w-full animate-in fade-in py-4 slide-in-from-right-8 duration-700">
                               <span class="text-[10px] font-mono uppercase tracking-[0.5em] font-black mb-6 text-nier-text-light dark:text-nier-text-dark text-center w-full">04 // TRADING_STYLE_ARCHIVE</span>
                               <div class="flex space-x-6 justify-center w-full">
                                  <ExNTtooltip v-for="(style, sIdx) in ['DAY_TRADING_STYLE', 'SWING_TRADING_STYLE', 'INVESTING_STYLE']" :key="style" :title="style.replace(/_/g, ' ')">
                                    <template #trigger>
                                      <button @click="addNode({ type: 'risk-element', label: style, params: { riskType: 'style', extraType: sIdx } })"
                                              class="group relative w-12 h-12 border border-nier-border-light dark:border-nier-border-dark flex items-center justify-center transition-all hover:scale-110 hover:border-red-500 bg-red-500/5 backdrop-blur-md">
                                         <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-red-500/20 group-hover:border-red-500/60 transition-colors"></div>
                                         <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-red-500/20 group-hover:border-red-500/60 transition-colors"></div>
                                         <span class="text-[14px] font-mono font-black text-red-500/60 group-hover:text-red-500 transition-colors">{{ style.slice(0, 2) }}</span>
                                      </button>
                                    </template>
                                    <span class="text-xs">Initialize {{ style.replace(/_/g, ' ') }} protocol</span>
                                  </ExNTtooltip>
                               </div>
                           </div>

                           <!-- Right Navigation -->
                           <button @click="currentRiskStep = (currentRiskStep + 1) % riskStepsCount"
                                   class="absolute right-0 top-1/2 -translate-y-1/2 p-4 opacity-30 hover:opacity-100 hover:scale-125 transition-all text-nier-text-light dark:text-nier-text-dark z-10">
                              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                 <path d="M9 18l6-6-6-6" />
                              </svg>
                           </button>
                        </div>

                        <!-- Pagination Dots (Tactical style) -->
                        <div class="flex space-x-2 mt-4">
                           <div v-for="i in riskStepsCount" :key="i"
                                @click="currentRiskStep = i - 1"
                                class="w-6 h-0.5 transition-all duration-500 cursor-pointer"
                                :class="currentRiskStep === i - 1 ? 'bg-nier-text-light dark:bg-nier-text-dark' : 'bg-nier-text-light/10 dark:bg-nier-text-dark/10'"></div>
                        </div>
                    </div>
                 </div>

               <!-- DATA TOOLS (Instrument Search) -->
                  <div v-if="activeMenuCategory === 'DATA' && !isScenarioContext" class="flex flex-col items-center pointer-events-auto max-w-lg w-full">
                    
                    <!-- Search Results -->
                    <div v-if="assetResults.length > 0" class="flex space-x-4 mb-4 overflow-x-auto pb-2 w-full max-w-full justify-start px-4 no-scrollbar">
                       <ExNTtooltip v-for="asset in assetResults" :key="asset.symbol" :title="asset.symbol">
                          <template #trigger>
                            <button @click="addAssetNode(asset)"
                                    class="group flex flex-col items-center space-y-1 min-w-[60px] transition-transform hover:scale-110">
                               <div class="w-10 h-10 border border-nier-border-light dark:border-nier-border-dark bg-nier-text-light/5 dark:bg-nier-text-dark/5 flex items-center justify-center relative overflow-hidden">
                                  <img v-if="asset.icon && !failedIcons.has(asset.symbol)" 
                                       :src="asset.icon" 
                                       @error="failedIcons.add(asset.symbol)"
                                       class="w-full h-full object-contain p-1 opacity-40 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all" />
                                  <span v-else class="text-[10px] font-bold opacity-40 uppercase">{{ asset.symbol.slice(0, 2) }}</span>
                                  <div class="absolute inset-x-0 bottom-0 h-0.5 bg-nier-text-light dark:bg-nier-text-dark opacity-20 transition-all group-hover:opacity-100"></div>
                               </div>
                               <span class="text-[7px] font-mono tracking-tighter opacity-40 group-hover:opacity-100 uppercase">{{ asset.symbol }}</span>
                            </button>
                          </template>
                          <div class="flex flex-col">
                            <span class="text-xs">Establish data link: {{ asset.name }}</span>
                            <span class="opacity-40 text-[9px] mt-1">ASSET_TICKER: {{ asset.symbol }}</span>
                          </div>
                        </ExNTtooltip>
                    </div>

                    <!-- Tactical Input -->
                    <div class="relative w-full max-w-sm">
                       <ExInput v-model="assetSearchQuery"
                               placeholder="ESTABLISH_DATA_LINK // ENTER_TICKER..."
                               @input="handleAssetSearch" />
                       <div class="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                          <div v-for="i in 3" :key="i" class="w-1 h-3 border-r border-nier-text-light dark:border-nier-text-dark opacity-10" :class="{ 'animate-pulse opacity-40': isSearchingAssets }"></div>
                       </div>
                    </div>
                  </div>

                <!-- SYSTEM TOOLS -->
                <div v-if="activeMenuCategory === 'SYSTEM' && !isScenarioContext" class="flex flex-col items-center justify-center pointer-events-auto px-4 w-full pt-6 pb-6">
                   <div class="flex flex-col items-center justify-center space-y-6">
                      <div class="flex flex-col items-center">
                         <span class="text-[9px] font-mono tracking-[0.4em] uppercase font-black opacity-60 mb-2">Registry_Maintenance</span>
                         <div class="w-12 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-10"></div>
                      </div>

                      <ExButton @click="isClearPanelOpen = true" variant="ghost" class="border-red-500/40 hover:border-red-500 min-w-[240px]">
                         <div class="flex items-center space-x-3 text-red-500">
                            <div class="w-1.5 h-1.5 bg-red-500 rotate-45"></div>
                            <span>CLEAR_ARCHIVE_DATA</span>
                         </div>
                      </ExButton>

                      <div class="flex flex-col items-center opacity-20">
                         <span class="text-[7px] font-mono tracking-widest uppercase">Warning: Permanent_System_Purge</span>
                         <span class="text-[7px] font-mono tracking-widest uppercase">Protocol_v1.07 // 0x44_ERASE</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div class="w-full flex items-center justify-center space-x-8 px-6 py-4 border-t border-nier-border-light dark:border-nier-border-dark bg-nier-text-light/[0.02] dark:bg-nier-dark/[0.02]">
               <button v-for="cat in commandLinkCategories" :key="cat"
                       v-show="shouldShowCommandCategory(cat)"
                       @click="toggleMenuCategory(cat)"
                       class="group relative flex flex-col items-center transition-all duration-300"
                       :class="activeMenuCategory === cat ? 'opacity-100' : 'opacity-30 hover:opacity-100'">
                  
                  <span class="text-[10px] font-mono tracking-[0.4em] uppercase font-black transition-all group-hover:tracking-[0.6em]"
                        :class="{ 'text-nier-text-light dark:text-nier-text-dark': activeMenuCategory === cat }">
                    {{ getCommandCategoryLabel(cat) }}
                  </span>
                  
                  <div class="h-0.5 mt-1 bg-nier-text-light dark:bg-nier-text-dark transition-all duration-500"
                       :class="activeMenuCategory === cat ? 'w-full' : 'w-0 group-hover:w-4'"></div>
               </button>
            </div>

          </div>
        </Transition>
      </Teleport>

      <!-- SYSTEM PURGE CONFIRMATION (Nier Style) -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="isClearPanelOpen" class="fixed inset-0 z-[10000000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
             <div class="w-full max-w-lg">
                <ExPanel title="SYSTEM_PURGE_PROTOCOL" telemetry="0x44_ERASE // ALERT">
                   <div class="flex flex-col space-y-6">
                      <div class="flex items-start space-x-6">
                         <div class="flex-shrink-0 w-12 h-12 border border-red-500/40 flex items-center justify-center text-red-500">
                            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                               <path d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                         </div>
                         <div class="flex flex-col space-y-2">
                            <span class="text-[14px] font-mono font-black tracking-widest text-nier-text-light dark:text-nier-text-dark uppercase">Critical_System_Alert</span>
                            <p class="text-[11px] font-mono text-nier-text-light/60 dark:text-nier-text-dark/60 leading-relaxed uppercase tracking-widest">
                               Initiating this protocol will result in the permanent erasure of all tactical nodes, connections, and archival domains within the current matrix. 
                               <br><br>
                               This action is <span class="text-red-500 font-black">irreversible</span>.
                            </p>
                         </div>
                      </div>

                      <div class="flex justify-end space-x-4 pt-4 border-t border-nier-border-light dark:border-nier-border-dark">
                         <ExButton @click="isClearPanelOpen = false" variant="ghost" size="md">
                            CANCEL
                         </ExButton>
                         <ExButton @click="clearBoard" variant="solid" size="md" class="!bg-red-500 !border-red-500 !text-white hover:!bg-red-600 transition-colors">
                            EXECUTE_PURGE
                         </ExButton>
                      </div>
                   </div>
                </ExPanel>
             </div>
          </div>
        </Transition>
      </Teleport>

      <!-- FULLSCREEN DRAWING PANEL -->
      <Teleport to="body">
        <Transition name="fade">
          <div v-if="activeDrawingNode"
               class="fixed inset-0 z-[2147483000] bg-nier-white dark:bg-nier-black text-nier-text-light dark:text-nier-text-dark p-8 pb-32 flex flex-col pointer-events-auto"
               @mousedown.stop
               @click.stop>
            <div ref="fullscreenDrawingBoard"
                 class="relative flex-1 border border-nier-border-light dark:border-nier-border-dark cursor-none overflow-hidden bg-[linear-gradient(90deg,currentColor_1px,transparent_1px),linear-gradient(currentColor_1px,transparent_1px)] bg-[size:48px_48px] text-nier-text-light/[0.04] dark:text-nier-text-dark/[0.04]"
                 @mousedown.stop.prevent="startFullscreenDrawing"
                 @mousemove.stop.prevent="moveFullscreenDrawing"
                 @mouseup.stop.prevent="finishFullscreenDrawing"
                 @mouseenter.stop="isDrawingCursorVisible = true"
                 @mouseleave.stop.prevent="finishFullscreenDrawing">
              <svg class="absolute inset-0 w-full h-full pointer-events-none text-nier-text-light dark:text-nier-text-dark"
                   viewBox="0 0 100 100"
                   preserveAspectRatio="none">
                <polyline v-for="stroke in activeDrawingNode.params?.strokes || []"
                          :key="stroke.id"
                          :points="formatDrawingStroke(stroke)"
                          fill="none"
                          :stroke="stroke.color || 'currentColor'"
                          :stroke-width="stroke.size || 2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          vector-effect="non-scaling-stroke"
                          class="opacity-90" />
              </svg>
              <div v-if="!activeDrawingNode.params?.strokes?.length"
                   class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span class="text-[10px] font-mono tracking-[0.45em] uppercase opacity-25">Press_And_Draw</span>
              </div>
              <div v-if="isDrawingCursorVisible"
                   class="absolute rounded-full border pointer-events-none z-20"
                   :class="drawingTool === 'eraser' ? 'border-red-500/80 bg-red-500/5' : 'border-nier-text-light/80 dark:border-nier-text-dark/80 bg-transparent'"
                   :style="drawingCursorStyle"></div>
              <div class="absolute top-4 left-4 w-10 h-10 border-t border-l border-nier-text-light dark:border-nier-text-dark opacity-20 pointer-events-none"></div>
              <div class="absolute bottom-4 right-4 w-10 h-10 border-b border-r border-nier-text-light dark:border-nier-text-dark opacity-20 pointer-events-none"></div>
            </div>

            <div class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2147483001] w-[calc(100%-4rem)] max-w-5xl bg-nier-white dark:bg-nier-black border border-nier-border-light dark:border-nier-border-dark shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
              <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-nier-text-light dark:border-nier-text-dark opacity-40 pointer-events-none"></div>
              <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-nier-text-light dark:border-nier-text-dark opacity-40 pointer-events-none"></div>
              <div class="flex items-center justify-between px-6 py-2 border-b border-nier-border-light dark:border-nier-border-dark bg-nier-text-light/[0.03] dark:bg-nier-text-dark/[0.03]">
                <div class="flex items-center gap-3">
                  <div class="w-1.5 h-1.5 bg-nier-text-light dark:bg-nier-text-dark rotate-45 opacity-50"></div>
                  <span class="text-[9px] font-mono tracking-[0.4em] uppercase font-black opacity-60">Matrix_Command_Link</span>
                </div>
                <span class="text-[8px] font-mono opacity-20 uppercase tracking-widest">{{ activeDrawingNode.label }}</span>
              </div>
              <div class="flex flex-wrap items-center justify-center gap-4 px-6 py-4">
                <div class="flex items-center border border-nier-border-light dark:border-nier-border-dark">
                  <button @mousedown.stop
                          @click.stop="drawingTool = 'brush'"
                          class="h-9 w-11 flex items-center justify-center transition-all"
                          :class="drawingTool === 'brush' ? 'bg-nier-text-light dark:bg-nier-text-dark text-nier-white dark:text-nier-black' : 'opacity-55 hover:opacity-100'">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M15.2 5.2l3.6 3.6" />
                      <path d="M4 20l4.2-1 10.1-10.1a2.5 2.5 0 0 0-3.5-3.5L4.7 15.5 4 20z" />
                    </svg>
                  </button>
                  <button @mousedown.stop
                          @click.stop="drawingTool = 'eraser'"
                          class="h-9 w-11 border-l border-nier-border-light dark:border-nier-border-dark flex items-center justify-center transition-all"
                          :class="drawingTool === 'eraser' ? 'bg-nier-text-light dark:bg-nier-text-dark text-nier-white dark:text-nier-black' : 'opacity-55 hover:opacity-100'">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M7 21h10" />
                      <path d="M20.5 8.5l-5-5a2.1 2.1 0 0 0-3 0L3.8 12.2a2.1 2.1 0 0 0 0 3l3.3 3.3h5.4l8-8a2.1 2.1 0 0 0 0-3z" />
                      <path d="M6.5 9.5l8 8" />
                    </svg>
                  </button>
                </div>
                <label v-if="drawingTool === 'brush'" class="h-9 w-11 border border-nier-border-light dark:border-nier-border-dark flex items-center justify-center cursor-pointer relative overflow-hidden">
                  <span class="w-5 h-5 border border-nier-border-light dark:border-nier-border-dark"
                        :style="{ backgroundColor: drawingColor }"></span>
                  <input v-model="drawingColor"
                         type="color"
                         class="absolute inset-0 opacity-0 cursor-pointer" />
                </label>
                <div class="h-9 px-3 border border-nier-border-light dark:border-nier-border-dark flex items-center gap-3">
                  <div class="w-5 h-5 flex items-center justify-center">
                    <div class="rounded-full border border-nier-text-light dark:border-nier-text-dark"
                         :style="{ width: `${Math.min(18, Math.max(5, drawingSize))}px`, height: `${Math.min(18, Math.max(5, drawingSize))}px` }"></div>
                  </div>
                  <div class="relative w-14 h-4 flex items-center cursor-pointer"
                       @mousedown.stop.prevent="startDrawingSizeDrag">
                    <div class="w-full h-px bg-nier-text-light/20 dark:bg-nier-text-dark/20"></div>
                    <div class="absolute left-0 h-px bg-nier-text-light dark:bg-nier-text-dark"
                         :style="{ width: `${drawingSizePercent}%` }"></div>
                    <div class="absolute top-1/2 w-2.5 h-2.5 -translate-y-1/2 -translate-x-1/2 rotate-45 border border-nier-text-light dark:border-nier-text-dark bg-nier-white dark:bg-nier-black"
                         :style="{ left: `${drawingSizePercent}%` }"></div>
                  </div>
                  <span class="text-[9px] font-mono font-black w-5 text-right">{{ drawingSize }}</span>
                </div>
                <button @mousedown.stop
                        @click.stop="clearDrawingFullscreen"
                        class="h-9 w-11 border border-nier-border-light dark:border-nier-border-dark flex items-center justify-center opacity-60 hover:opacity-100 hover:border-nier-text-light dark:hover:border-nier-text-dark transition-all">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 15H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
                <button @mousedown.stop
                        @click.stop="closeDrawingFullscreen"
                        class="h-9 w-11 border border-nier-text-light dark:border-nier-text-dark bg-nier-text-light dark:bg-nier-text-dark text-nier-white dark:text-nier-black flex items-center justify-center hover:opacity-80 transition-all">
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 6H6v12h4" />
                    <path d="M14 8l4 4-4 4" />
                    <path d="M8 12h10" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>


        <!-- MONOCHROMATIC NIER:AUTOMATA STYLE FLOATING TOOLTIP -->
         <Teleport to="body">
           <Transition name="fade">
             <div v-if="hoveredDescription" 
                  class="fixed z-[2147483647] pointer-events-none px-5 py-4 border-l-[3px] border-nier-text-light dark:border-nier-text-dark shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-md max-w-sm overflow-hidden text-nier-text-light dark:text-nier-text-dark bg-nier-white dark:bg-nier-black"
                  :style="tooltipStyles">
                 
                 <!-- Scanline Glitch Effect -->
                 <div class="absolute inset-0 pointer-events-none opacity-5 animate-scan">
                   <div class="w-full h-[1px] bg-white translate-y-[-100%]"></div>
                 </div>

                 <div class="flex flex-col space-y-3 relative">
                    <div class="flex items-center space-x-3">
                       <div class="w-1.5 h-1.5 bg-white rotate-45"></div>
                       <span class="text-[9px] font-mono tracking-[0.3em] text-white font-black uppercase">
                          [ SYSTEM_INTEL_v1.07 ]
                       </span>
                    </div>
                    
                    <div class="w-full h-[1px] bg-white/10"></div>
                    
                    <span class="text-[11px] font-mono tracking-widest text-[#dadada] uppercase leading-relaxed font-bold italic">
                       {{ hoveredDescription }}
                    </span>

                    <div class="flex items-center space-x-2 pt-2 opacity-20">
                       <div v-for="i in 5" :key="i" class="w-1 h-1 bg-white"></div>
                    </div>
                 </div>

                 <!-- Corner Brackets -->
                 <div class="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/40"></div>
                 <div class="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/40"></div>
                 <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/40"></div>
              </div>
           </Transition>
        </Teleport>

  
      

      <!-- BOOT OVERLAY -->
       <Transition name="fade">
        <div v-if="isInitializing" class="absolute inset-0 z-[1000] bg-nier-white dark:bg-nier-black flex flex-col items-center justify-center space-y-8 pointer-events-auto transition-colors duration-1000">
           <div class="flex flex-col items-center space-y-3">
              <div class="w-16 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-20"></div>
              <span class="text-[10px] font-mono tracking-[0.8em] uppercase font-black animate-pulse text-nier-text-light dark:text-nier-text-dark">Establishing_Neural_Link</span>
              <div class="w-16 h-px bg-nier-text-light dark:bg-nier-text-dark opacity-20"></div>
           </div>

           <div class="w-64 h-px bg-nier-text-light/10 dark:bg-nier-text-dark/10 relative overflow-hidden">
              <div class="absolute inset-y-0 left-0 bg-nier-text-light dark:bg-nier-text-dark transition-all duration-300" :style="{ width: `${bootProgress}%` }"></div>
              <!-- Glitch element -->
              <div class="absolute h-full w-4 bg-white/40 blur-sm animate-scan"></div>
           </div>

           <div class="flex flex-col items-center space-y-1 opacity-40 text-nier-text-light dark:text-nier-text-dark">
              <span class="text-[7px] font-mono tracking-widest uppercase">System_Code: 0x44_REIFY</span>
              <span class="text-[7px] font-mono tracking-widest uppercase">Matrix_Stability: {{ Math.min(100, Math.round(bootProgress)) }}%</span>
           </div>
           
           <!-- Scanline effect for boot -->
           <div class="absolute inset-0 pointer-events-none opacity-5 animate-scan bg-gradient-to-b from-transparent via-nier-text-light dark:via-nier-text-dark to-transparent h-[2px]"></div>
        </div>
      </Transition>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import ExSkillNode from './ExSkillNode.vue'
import ExZone from './ExZone.vue'
import { initAssetService, searchAssets, type AssetInfo } from '@/shared/api/asset.service'
import indicatorData from '@/shared/assets/indicators.json'
import { saveToDisk, loadFromDisk } from '@/shared/diskStorage'
import ExInput from '@/shared/ui/ExInput.vue'
import ExNTtooltip from '@/shared/ui/ExNTtooltip.vue'
import ExPanel from '@/shared/ui/ExPanel.vue'
import ExButton from '@/shared/ui/ExButton.vue'
import ExConditionCreator from '@/widgets/genesis/ui/ExConditionCreator.vue'
import ExConfigSetter from '@/widgets/genesis/ui/ExConfigSetter.vue'
import { useThemeStore } from '@/features/store/useTheme'
import { useAppBootStore } from '~/features/store/useAppBoot'
import { useI18n } from '~/shared/i18n/useI18n'
import { useStrategyTradesStore } from '@/features/store/useStrategyTrades'

const { locale, t } = useI18n()
const themeStore = useThemeStore()

const STORAGE_KEY = 'genesis_matrix_v2'

interface Point { x: number; y: number }
interface Node {
  id: string
  label: string
  type: string
  x: number
  y: number
  color: string
  params: any
  isRoot?: boolean
  subGraph?: {
    nodes: Node[]
    connections: Connection[]
    zones: Zone[]
  }
}
interface Connection {
  fromId: string
  toId: string
  label?: string
  bundleId?: string
  bundleStemX?: number
  bundleStemY?: number
}
interface Zone {
  id: string
  type: 'entry' | 'in-trade' | 'exit' | 'session'
  x: number
  y: number
  width: number
  height: number
  label: string
}

type MenuCategory =
  | 'LOGIC'
  | 'METHODS'
  | 'DATA'
  | 'DOMAINS'
  | 'INDICATORS'
  | 'EMOTIONS'
  | 'STEPS'
  | 'SCALING'
  | 'RISK'
  | 'SYSTEM'
  | 'CONFIG'
  | 'TEXT_FORMAT'
  | 'SCENARIO_DOCS'
  | 'SCENARIO_VISUALS'
  | 'SCENARIO_AUDIO'
  | 'LABELS'

// --- SYSTEM STATE --- //

const canvasWrapper = ref<HTMLElement | null>(null)
const isConditionCreatorOpen = ref(false)
const isConfigSetterOpen = ref(false)
const isInitializing = ref(true)
const bootProgress = ref(0)
const personalIndicators = ref<any[]>([])
const updateKey = ref(0)
const forceUpdate = () => updateKey.value++
const isClearPanelOpen = ref(false)

function clearBoard() {
  const strategyTradesStore = useStrategyTradesStore()
  strategyTradesStore.purgeAllStrategies()

  rootNodes.value = [
    { id: 'root', label: 'STRATEGY_CORE', type: 'strategy', x: 200, y: 300, color: 'currentColor', params: { value: 'System_Init' }, isRoot: true }
  ]
  rootConnections.value = []
  rootZones.value = []
  navigationStack.value = []
  savedScales.clear()
  lastSelectedId.value = 'root'
  isClearPanelOpen.value = false
  saveMatrixData()
}

// Persistent Storage
const rootNodes = ref<Node[]>([
  { id: 'root', label: 'STRATEGY_CORE', type: 'strategy', x: 200, y: 300, color: 'currentColor', params: { value: 'System_Init' }, isRoot: true }
])
const rootConnections = ref<Connection[]>([])
const rootZones = ref<Zone[]>([])

// Fractal Context Control (Recursive Stack)
const navigationStack = ref<string[]>([])
const activeContextId = computed(() => navigationStack.value[navigationStack.value.length - 1] || null)

const savedScales = new Map<string, number>()

function navigateTo(newStack: string[]) {
  // Save current scale before mutating stack
  const currentKey = navigationStack.value.join('/') || 'root'
  savedScales.set(currentKey, viewState.value.scale)
  
  // Set the new stack
  navigationStack.value = newStack
  
  // Reset pan
  viewState.value.panX = 0
  viewState.value.panY = 0
  
  // Restore scale or default to 1
  const newKey = newStack.join('/') || 'root'
  if (savedScales.has(newKey)) {
    viewState.value.scale = savedScales.get(newKey)!
  } else {
    viewState.value.scale = 1
  }
}

const activeContextNode = computed(() => {
  if (!activeContextId.value) return null
  return findNodeById(rootNodes.value, activeContextId.value)
})
const isScenarioContext = computed(() => {
  const t = activeContextNode.value?.type
  return t && t !== 'strategy'
})

watch(isScenarioContext, (isScenario) => {
  if (isScenario) viewState.value.scale = 1
})

// Current Reactive Viewport Data
const nodes = computed<Node[]>({
  get: () => {
    if (activeContextId.value && activeContextNode.value) {
       return activeContextNode.value.subGraph?.nodes || []
    }
    return rootNodes.value
  },
  set: (val) => {
    if (activeContextId.value && activeContextNode.value) {
      if (!activeContextNode.value.subGraph) activeContextNode.value.subGraph = { nodes: [], connections: [], zones: [] }
      activeContextNode.value.subGraph.nodes = val
    } else {
      rootNodes.value = val
    }
  }
})

const connections = computed<Connection[]>({
  get: () => {
    if (activeContextId.value && activeContextNode.value) {
       return activeContextNode.value.subGraph?.connections || []
    }
    return rootConnections.value
  },
  set: (val) => {
    if (activeContextId.value && activeContextNode.value) {
      if (!activeContextNode.value.subGraph) activeContextNode.value.subGraph = { nodes: [], connections: [], zones: [] }
      activeContextNode.value.subGraph.connections = val
    } else {
      rootConnections.value = val
    }
  }
})

const shouldShowInitializePrompt = computed(() => (
  isScenarioContext.value ? nodes.value.length === 0 : nodes.value.length === 1
))

const bundleGroups = computed(() => {
  const groups: any[] = []
  const processed = new Set<string>()
  const parentSeen = new Set<string>()
  
  connections.value.forEach(conn => {
    if (conn.bundleId) {
      const key = conn.fromId + '_b_' + conn.bundleId
      if (processed.has(key)) return
      const siblings = connections.value.filter(c => c.fromId === conn.fromId && c.bundleId === conn.bundleId)
      groups.push({
        type: 'bundle',
        id: key,
        fromId: conn.fromId,
        bundleId: conn.bundleId,
        connections: siblings,
        isFirstForParent: !parentSeen.has(conn.fromId)
      })
      parentSeen.add(conn.fromId)
      processed.add(key)
    } else {
      const key = conn.fromId + '_s_' + conn.toId
      groups.push({
        type: 'simple',
        id: key,
        connection: conn
      })
      processed.add(key)
    }
  })
  return groups
})

const zones = computed<Zone[]>({
  get: () => {
    if (activeContextId.value && activeContextNode.value) {
       return activeContextNode.value.subGraph?.zones || []
    }
    return rootZones.value
  },
  set: (val) => {
    if (activeContextId.value && activeContextNode.value) {
      if (!activeContextNode.value.subGraph) activeContextNode.value.subGraph = { nodes: [], connections: [], zones: [] }
      activeContextNode.value.subGraph.zones = val
    } else {
      rootZones.value = val
    }
  }
})

const contentTransform = computed(() => ({
  transform: `translate(${viewState.value.panX / viewState.value.scale}px, ${viewState.value.panY / viewState.value.scale}px)`,
  zoom: viewState.value.scale
}))

const gridTransform = computed(() => {
  const size = 100 * viewState.value.scale
  return {
    // transform: `translate(${viewState.value.panX % size}px, ${viewState.value.panY % size}px)`,
    opacity: 0.005
  }
})

const skillTypes = computed(() => {
  const selectedNode = effectiveSelectedNode.value
  const contextNode = activeContextId.value ? getNode(activeContextId.value) : null
  
  const isStrategyActive = (selectedNode?.type === 'strategy' || contextNode?.type === 'strategy')
  const isScenarioActive = (
    (selectedNode && ['scenario', 'condition', 'instrument', 'indicator', 'pattern', 'smc'].includes(selectedNode.type)) ||
    (contextNode && ['scenario', 'condition', 'instrument', 'indicator', 'pattern', 'smc'].includes(contextNode.type))
  )
  
  const base: { label: string; type: string; color: string; description?: string }[] = [
    { label: 'Strategy', type: 'strategy', color: 'currentColor' }
  ]
  
  if (isStrategyActive) {
    base.push({ label: 'Scenario', type: 'scenario', color: 'currentColor' })
  }

  if (isScenarioActive) {
    base.push({ label: 'Condition', type: 'condition', color: 'currentColor' })
  }
  
  base.push({ label: 'Emotion', type: 'emotion', color: 'currentColor' })
  base.push({ label: 'Risk', type: 'risk', color: 'currentColor', description: 'Risk management protocol defining loss constraints and exposure limits.' })
  base.push({ label: 'Visual', type: 'image', color: 'currentColor' })
  
  return base
})

const methodTypes = computed(() => [
  { label: 'Pyramiding', type: 'pyramiding', color: 'currentColor', description: 'Incremental position scaling in the direction of trend momentum.' },
  { label: 'Averaging', type: 'averaging', color: 'currentColor', description: 'Strategic entry distribution to optimize the aggregate cost basis.' }
])

const scenarioDocumentationTypes = [
  {
    label: 'TEXT_PANEL',
    type: 'text-panel',
    color: 'currentColor',
    description: 'Free-form scenario explanation panel for thesis, trigger logic, and execution notes.',
    params: {
      shortCode: 'TXT',
      menuLabel: 'TEXT',
      protocol: 'TEXT_INPUT_PANEL',
      description: 'Free-form scenario explanation panel for thesis, trigger logic, and execution notes.',
      value: 'Scenario thesis:\nTrigger:\nExecution notes:'
    }
  },
  {
    label: 'CHECKLIST_PANEL',
    type: 'checklist-panel',
    color: 'currentColor',
    description: 'Interactive checklist panel for scenario tasks and validation points.',
    params: {
      shortCode: 'CHK',
      menuLabel: 'CHECK',
      protocol: 'CHECKLIST_PANEL',
      description: 'Interactive checklist panel for scenario tasks and validation points.',
      items: [
        { id: 'c1', text: 'FIRST_CHECK', done: false },
        { id: 'c2', text: 'SECOND_CHECK', done: false }
      ]
    }
  },
  {
    label: 'TABLE_PANEL',
    type: 'table-panel',
    color: 'currentColor',
    description: 'Structured table panel with fixed full-cell inputs and auto sizing.',
    params: {
      shortCode: 'TBL',
      menuLabel: 'TABLE',
      protocol: 'STRUCTURED_TABLE_PANEL',
      description: 'Structured table panel with fixed full-cell inputs and auto sizing.',
      rows: 3,
      cols: 3,
      table: [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
      ]
    }
  },
  {
    label: 'EMBED_PANEL',
    type: 'embed-panel',
    color: 'currentColor',
    description: 'Embed panel for external URLs, references, and media links.',
    params: {
      shortCode: 'EMB',
      menuLabel: 'EMBED',
      protocol: 'EMBED_PANEL',
      description: 'Embed panel for external URLs, references, and media links.',
      embedUrl: ''
    }
  }
]

const scenarioVisualTypes = [
  {
    label: 'SCREENSHOT',
    type: 'image',
    color: 'currentColor',
    description: 'Screenshot evidence node for chart states, execution examples, and annotations.',
    params: {
      shortCode: 'IMG',
      menuLabel: 'SHOT',
      protocol: 'SCREENSHOT_EVIDENCE',
      description: 'Screenshot evidence node for chart states, execution examples, and annotations.',
      value: 'Attach screenshot evidence.'
    }
  },
  {
    label: 'DRAWING_PANEL',
    type: 'drawing-panel',
    color: 'currentColor',
    description: 'Fullscreen drawing panel for mapping scenario structure, paths, and notes.',
    params: {
      shortCode: 'DRW',
      menuLabel: 'DRAW',
      protocol: 'FULLSCREEN_DRAWING_BOARD',
      description: 'Fullscreen drawing panel for mapping scenario structure, paths, and notes.',
      value: 'Double click to open fullscreen drawing mode.',
      strokes: []
    }
  },
  {
    label: 'FILE_ATTACHMENT',
    type: 'file-attachment',
    color: 'currentColor',
    description: 'Attach a file to the scenario archive.',
    params: {
      shortCode: 'FIL',
      menuLabel: 'FILE',
      protocol: 'FILE_ATTACHMENT',
      description: 'Attach a file to the scenario archive.'
    }
  }
]

const labelTypes = [
  {
    label: 'TEXT_PANEL',
    type: 'text-panel',
    color: 'currentColor',
    description: 'Free-form text label for long labels or sentences.',
    params: {
      shortCode: 'LBL',
      menuLabel: 'LABEL',
      protocol: 'TEXT_INPUT_PANEL',
      description: 'Free-form text label for long labels or sentences.',
      value: ''
    }
  }
]

function getNode(id: string) {
  return nodes.value.find((n: Node) => n.id === id)
}

const lastSelectedId = ref<string | null>('root')

const effectiveSelectedNode = computed(() => {
  const node = lastSelectedId.value ? getNode(lastSelectedId.value) : null
  if (node?.type === 'placeholder') {
    const parentConn = connections.value.find(c => c.toId === node.id)
    return parentConn ? getNode(parentConn.fromId) : null
  }
  return node
})

const activeDrawingNodeId = ref<string | null>(null)
const activeTextNodeId = ref<string | null>(null)
const fullscreenDrawingBoard = ref<HTMLElement | null>(null)
const activeDrawingStrokeId = ref<string | null>(null)
const isDrawingPointerDown = ref(false)
const isDrawingCursorVisible = ref(false)
const drawingCursor = ref({ x: 0, y: 0 })
const drawingTool = ref<'brush' | 'eraser'>('brush')
const drawingColor = ref('#2c2c2a')
const drawingSize = ref(4)
const activeDrawingNode = computed(() => (
  activeDrawingNodeId.value ? findNodeById(rootNodes.value, activeDrawingNodeId.value) : null
))
const activeTextNode = computed(() => (
  activeTextNodeId.value ? findNodeById(rootNodes.value, activeTextNodeId.value) : null
))
const drawingCursorDiameter = computed(() => Math.max(10, drawingSize.value * (drawingTool.value === 'eraser' ? 2.8 : 2)))
const drawingSizePercent = computed(() => ((drawingSize.value - 1) / 23) * 100)
const drawingCursorStyle = computed(() => ({
  width: `${drawingCursorDiameter.value}px`,
  height: `${drawingCursorDiameter.value}px`,
  transform: `translate(${drawingCursor.value.x - drawingCursorDiameter.value / 2}px, ${drawingCursor.value.y - drawingCursorDiameter.value / 2}px)`
}))

type TextFormatPreset = 'h' | 'p' | 'quote'

const textFormatPresets: Array<{ id: TextFormatPreset; label: string; block: string }> = [
  { id: 'h', label: 'H', block: 'h2' },
  { id: 'p', label: 'P', block: 'p' }
]
const activeTextFontSize = ref(16)
const activeTextColor = ref('#2c2c2a')
const savedTextSelection = ref<Range | null>(null)

function ensureTextPanelParams(node: Node) {
  if (!node.params) node.params = {}
  if (typeof node.params.value !== 'string') node.params.value = ''
  if (typeof node.params.activeTextColor !== 'string') node.params.activeTextColor = ''
  if (typeof node.params.html !== 'string') {
    node.params.html = escapeTextHtml(node.params.value).replace(/\n/g, '<br>')
  }
}

function escapeTextHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function getActiveTextEditor() {
  if (!activeTextNode.value) return null
  return document.querySelector(`[data-text-node-id="${activeTextNode.value.id}"]`) as HTMLElement | null
}

function saveTextSelection() {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return
  const range = selection.getRangeAt(0)
  const editor = getActiveTextEditor()
  if (!editor || !editor.contains(range.commonAncestorContainer)) return
  savedTextSelection.value = range.cloneRange()
}

function restoreTextSelection() {
  const editor = getActiveTextEditor()
  if (!editor) return
  editor.focus()
  const selection = window.getSelection()
  if (!selection) return
  selection.removeAllRanges()
  if (savedTextSelection.value) {
    selection.addRange(savedTextSelection.value)
  }
}

function syncActiveTextHtml() {
  const node = activeTextNode.value
  const editor = getActiveTextEditor()
  if (!node || !editor) return
  ensureTextPanelParams(node)
  node.params.html = editor.innerHTML
  node.params.value = editor.innerText
  saveMatrixData()
  forceUpdate()
}

function openTextCommandLink(node: Node) {
  ensureTextPanelParams(node)
  activeTextNodeId.value = node.id
  activeTextColor.value = node.params.activeTextColor || 'currentColor'
  activeMenuCategory.value = 'TEXT_FORMAT'
}

function applyTextCommand(command: string, value?: string) {
  if (!activeTextNode.value) return
  restoreTextSelection()
  document.execCommand('styleWithCSS', false, 'true')
  document.execCommand(command, false, value)
  syncActiveTextHtml()
  saveTextSelection()
}

function applyTextBlock(preset: TextFormatPreset) {
  const block = preset === 'quote' ? 'blockquote' : textFormatPresets.find(item => item.id === preset)?.block
  if (!block) return
  applyTextCommand('formatBlock', block)
}

function applyTextFontSize() {
  const size = Math.max(10, Math.min(72, activeTextFontSize.value))
  activeTextFontSize.value = size
  applyTextCommand('fontSize', '7')
  getActiveTextEditor()?.querySelectorAll('font[size="7"]').forEach((font) => {
    const span = document.createElement('span')
    span.style.fontSize = `${size}px`
    span.innerHTML = font.innerHTML
    font.replaceWith(span)
  })
  syncActiveTextHtml()
}

function adjustTextCommandFontSize(delta: number) {
  activeTextFontSize.value = Math.max(10, Math.min(72, activeTextFontSize.value + delta))
  applyTextFontSize()
}

function applyTextColor(event?: Event) {
  activeTextColor.value = (event?.target as HTMLInputElement | undefined)?.value || activeTextColor.value
  if (activeTextNode.value) {
    ensureTextPanelParams(activeTextNode.value)
    activeTextNode.value.params.activeTextColor = activeTextColor.value
  }
  applyTextCommand('foreColor', activeTextColor.value)
}

function resetTextColor() {
  if (activeTextNode.value) {
    ensureTextPanelParams(activeTextNode.value)
    activeTextNode.value.params.activeTextColor = 'currentColor'
  }
  activeTextColor.value = 'currentColor'
  applyTextCommand('foreColor', 'var(--matrix-text-default-color)')
}

function ensureDrawingParams(node: Node) {
  if (!node.params) node.params = {}
  if (!Array.isArray(node.params.strokes)) node.params.strokes = []
}

function openDrawingFullscreen(node: Node) {
  ensureDrawingParams(node)
  activeDrawingNodeId.value = node.id
  activeMenuCategory.value = null
}

function closeDrawingFullscreen() {
  activeDrawingNodeId.value = null
  activeDrawingStrokeId.value = null
  isDrawingPointerDown.value = false
  isDrawingCursorVisible.value = false
  saveMatrixData()
}

function clearDrawingFullscreen() {
  if (!activeDrawingNode.value) return
  ensureDrawingParams(activeDrawingNode.value)
  activeDrawingNode.value.params.strokes = []
  saveMatrixData()
  forceUpdate()
}

function setDrawingSizeFromEvent(e: MouseEvent, track: HTMLElement) {
  const rect = track.getBoundingClientRect()
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)))
  drawingSize.value = Math.round(1 + ratio * 23)
}

function startDrawingSizeDrag(e: MouseEvent) {
  const track = e.currentTarget as HTMLElement
  setDrawingSizeFromEvent(e, track)

  const move = (moveEvent: MouseEvent) => {
    setDrawingSizeFromEvent(moveEvent, track)
  }
  const stop = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', stop)
  }

  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', stop)
}

function getFullscreenDrawingPoint(e: MouseEvent) {
  const board = fullscreenDrawingBoard.value
  if (!board) return { x: 0, y: 0 }
  const rect = board.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100)),
    y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100))
  }
}

function updateDrawingCursor(e: MouseEvent) {
  const board = fullscreenDrawingBoard.value
  if (!board) return
  const rect = board.getBoundingClientRect()
  drawingCursor.value = {
    x: Math.max(0, Math.min(rect.width, e.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, e.clientY - rect.top))
  }
  isDrawingCursorVisible.value = true
}

function startFullscreenDrawing(e: MouseEvent) {
  if (!activeDrawingNode.value) return
  ensureDrawingParams(activeDrawingNode.value)
  updateDrawingCursor(e)
  isDrawingPointerDown.value = true
  if (drawingTool.value === 'eraser') {
    eraseDrawingAtPoint(getFullscreenDrawingPoint(e))
    return
  }
  const stroke = {
    id: 's' + Date.now().toString(36),
    color: drawingColor.value,
    size: drawingSize.value,
    points: [getFullscreenDrawingPoint(e)]
  }
  activeDrawingNode.value.params.strokes.push(stroke)
  activeDrawingStrokeId.value = stroke.id
}

function moveFullscreenDrawing(e: MouseEvent) {
  if (!activeDrawingNode.value) return
  updateDrawingCursor(e)
  if (!isDrawingPointerDown.value) return
  if (drawingTool.value === 'eraser') {
    eraseDrawingAtPoint(getFullscreenDrawingPoint(e))
    return
  }
  if (!activeDrawingStrokeId.value) return
  const stroke = activeDrawingNode.value.params?.strokes?.find((item: any) => item.id === activeDrawingStrokeId.value)
  if (!stroke) return
  stroke.points.push(getFullscreenDrawingPoint(e))
}

function finishFullscreenDrawing() {
  if (!activeDrawingNode.value) return
  activeDrawingStrokeId.value = null
  isDrawingPointerDown.value = false
  isDrawingCursorVisible.value = false
  saveMatrixData()
  forceUpdate()
}

function formatDrawingStroke(stroke: any) {
  return (stroke.points || []).map((point: any) => `${point.x},${point.y}`).join(' ')
}

function eraseDrawingAtPoint(point: { x: number; y: number }) {
  if (!activeDrawingNode.value?.params?.strokes) return
  const boardRect = fullscreenDrawingBoard.value?.getBoundingClientRect()
  const thresholdPx = Math.max(6, drawingSize.value * 1.4)
  const nextStrokes: any[] = []

  activeDrawingNode.value.params.strokes.forEach((stroke: any) => {
    let currentSegment: any[] = []

    ;(stroke.points || []).forEach((strokePoint: any) => {
      const dx = ((strokePoint.x - point.x) / 100) * (boardRect?.width || 1000)
      const dy = ((strokePoint.y - point.y) / 100) * (boardRect?.height || 1000)
      const shouldErasePoint = Math.sqrt(dx * dx + dy * dy) <= thresholdPx

      if (shouldErasePoint) {
        if (currentSegment.length > 1) {
          nextStrokes.push({
            ...stroke,
            id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            points: currentSegment
          })
        }
        currentSegment = []
      } else {
        currentSegment.push(strokePoint)
      }
    })

    if (currentSegment.length > 1) {
      nextStrokes.push({
        ...stroke,
        id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        points: currentSegment
      })
    }
  })

  activeDrawingNode.value.params.strokes = nextStrokes
  forceUpdate()
}

// --- MENU STATE --- //
const defaultCommandCategories: MenuCategory[] = ['LOGIC', 'METHODS', 'DATA', 'DOMAINS', 'INDICATORS', 'EMOTIONS', 'STEPS', 'SCALING', 'RISK', 'SYSTEM', 'CONFIG', 'LABELS']
const scenarioCommandCategories: MenuCategory[] = ['SCENARIO_DOCS', 'SCENARIO_VISUALS', 'SCENARIO_AUDIO', 'TEXT_FORMAT', 'LABELS']
const commandCategoryLabels: Partial<Record<MenuCategory, string>> = {
  SCENARIO_DOCS: 'DOCS',
  SCENARIO_VISUALS: 'VISUALS',
  SCENARIO_AUDIO: 'AUDIO',
  TEXT_FORMAT: 'TEXT',
  LABELS: 'LABELS'
}
const activeMenuCategory = ref<MenuCategory | null>('LOGIC')
const activeEmotionTab = ref<'NEGATIVE' | 'POSITIVE' | 'NEUTRAL'>('NEGATIVE')
const customStepInput = ref('')
const currentStepPage = ref(0)
const stepPagesCount = 3
const scalingLots = ref(1)
const scalingStep = ref(0)
const scalingUnit = ref<'%' | '$'>('%')
const scalingMode = ref<'LOTS' | 'PERCENT'>('LOTS')
const riskLossTrade = ref(1)
const riskLossTradeUnit = ref<'%' | '$'>('%')
const riskLossDayUnit = ref<'%' | '$'>('$')
const riskLossDay = ref(5)
const riskRR = ref(3)
const matrixAudioRecordingState = ref<'idle' | 'recording' | 'paused'>('idle')
const matrixAudioError = ref('')
const matrixAudioRecorder = ref<MediaRecorder | null>(null)
const matrixAudioStream = ref<MediaStream | null>(null)
const isMatrixNativeAudioSession = ref(false)
let matrixAudioChunks: BlobPart[] = []

const matrixAudioErrorLabel = computed(() => {
  if (matrixAudioError.value === 'Secure_Context_Required') return 'Open_Through_Localhost_Or_HTTPS'
  if (matrixAudioError.value === 'Recorder_Not_Available') return 'Audio_Recorder_Not_Available'
  if (matrixAudioError.value === 'Microphone_Not_Available') return 'MacOS_Microphone_Permission_Required'
  return matrixAudioError.value
})

const commandLinkCategories = computed(() => {
  const categories = isScenarioContext.value ? scenarioCommandCategories : defaultCommandCategories
  if (activeTextNode.value) return categories
  return categories.filter(category => category !== 'TEXT_FORMAT')
})

function getCommandCategoryLabel(category: MenuCategory) {
  const labelKey = commandCategoryLabels[category] || category
  return t(labelKey)
}

function shouldShowCommandCategory(category: MenuCategory) {
  if (category === 'TEXT_FORMAT') return !!activeTextNode.value
  if (isScenarioContext.value) return scenarioCommandCategories.includes(category)
  const selected = effectiveSelectedNode.value
  return (
    (category !== 'INDICATORS' && category !== 'EMOTIONS' && category !== 'SCALING' && category !== 'RISK' && category !== 'CONFIG') ||
    (!!selected && ['condition', 'indicator', 'pattern', 'smc'].includes(selected.type || '') && category === 'INDICATORS' && !selected.params?.needsConfig) ||
    (!!selected && selected.params?.needsConfig && category === 'CONFIG') ||
    (!!selected && (selected.type === 'emotion' || selected.type === 'emotion-state') && category === 'EMOTIONS') ||
    (!!selected && (selected.type === 'pyramiding' || selected.type === 'averaging') && category === 'SCALING') ||
    (!!selected && selected.type === 'risk' && category === 'RISK')
  )
}

watch(isScenarioContext, (insideScenario) => {
  if (insideScenario && !scenarioCommandCategories.includes(activeMenuCategory.value as MenuCategory)) {
    activeMenuCategory.value = 'SCENARIO_DOCS'
  } else if (!insideScenario && activeMenuCategory.value && scenarioCommandCategories.includes(activeMenuCategory.value)) {
    activeMenuCategory.value = 'LOGIC'
  }
}, { immediate: true })

// Sync Selected Node to Risk refs (Read-only initialization for menu)
watch(lastSelectedId, (newId) => {
  if (!newId) return
  const node = getNode(newId)
  if (node?.type === 'risk') {
    // Keep internal refs for menu inputs
    riskLossTrade.value = 1
    riskLossDay.value = 5
    riskRR.value = 3
  } else if (node?.type === 'scaling-entry') {
    scalingLots.value = node.params.lots || 1
    scalingStep.value = node.params.step || 0
    scalingUnit.value = node.params.unit || '%'
    scalingMode.value = node.params.lotsMode || 'LOTS'
  }
})
const stepPresets = {
  numeric: ['1', '2', '3', '4', '5'],
  alpha: ['a', 'b', 'c', 'd', 'e'],
  roman: ['I', 'II', 'III', 'IV', 'V']
}
const emotionLibrary = [
  { label: 'FOMO', type: 'negative', description: 'FEAR_OF_MISSING_OUT', info: 'Entering trades based on price momentum rather than predefined logic.', remedies: ['Check HTF Structure', 'Wait for 15m Retest', 'Review Trading Plan'] },
  { label: 'Revenge', type: 'negative', description: 'COMPULSIVE_RECOVERY', info: 'Attempting to "win back" losses after a failed trade, usually with excessive size.', remedies: ['Terminate Session', 'Walk Away for 1h', 'Verify Logic vs Bias'] },
  { label: 'Greed', type: 'negative', description: 'OVER_EXPECTATION', info: 'Overstaying in a trade or over-leveraging due to unreasonable profit targets.', remedies: ['Set Technical Exit', 'Lock 50% Profit', 'Scale Out Immediately'] },
  { label: 'Fear', type: 'negative', description: 'EXECUTION_PARALYSIS', info: 'Hesitation or premature exits due to over-sensitivity to market fluctuations.', remedies: ['Reduce Pos. Size', 'Verify Hard Stop', 'Recalculate R:R'] },
  { label: 'Tilt', type: 'negative', description: 'SYSTEM_OVERRIDE', info: 'Complete loss of emotional control. Critical session termination required.', remedies: ['Emergency Shutdown', 'Execute Breach Log', 'Reset Environment'] },
  { label: 'Anxiety', type: 'negative', description: 'COGNITIVE_FRICTION', info: 'Low-level psychological stress reducing decision-making quality.', remedies: ['Box Breathing', 'Step Away from M1', 'Verify Risk Max'] },
  { label: 'Calmness', type: 'positive', description: 'NEURAL_STABILITY', info: 'High mental clarity. Objective market observation without bias.', remedies: [] },
  { label: 'Discipline', type: 'positive', description: 'PROTOCOL_ADHERENCE', info: 'Strict adherence to the pre-trade plan and risk parameters.', remedies: [] },
  { label: 'Focus', type: 'positive', description: 'SENSORY_AWARENESS', info: 'High logical concentration and high-fidelity market reading.', remedies: [] },
  { label: 'Patience', type: 'positive', description: 'TEMPORAL_RESILIENCE', info: 'Waiting for high-probability setups without impulse interaction.', remedies: [] },
  { label: 'Confidence', type: 'positive', description: 'EXECUTION_CERTAINTY', info: 'Clear conviction backed by backtested logic and data.', remedies: [] },
  { label: 'Hope', type: 'neutral', description: 'LOGIC_GAP', info: 'Relying on "luck" or "feel" instead of hard technical triggers.', remedies: ['Exit immediately', 'Verify hard stop'] },
  { label: 'Boredom', type: 'neutral', description: 'STIMULUS_VOID', info: 'Impulse to trade due to lack of market action. High risk of overtrading.', remedies: ['Step away', 'Set alerts'] },
  { label: 'Fatigue', type: 'neutral', description: 'BIOLOGICAL_DECAY', info: 'Reduced reaction time and logic due to extended session duration.', remedies: ['Terminate session', 'Sleep'] }
]
const activeIndicatorCategory = ref(indicatorData.categories[0]?.id || 'TREND')
const indicatorSearchQuery = ref('')
const currentRiskStep = ref(0)
const riskStepsCount = 4
const hoveredDescription = ref('')
const mousePos = ref({ x: 0, y: 0 })

const updateMousePos = (e: MouseEvent) => {
  mousePos.value = { x: e.clientX, y: e.clientY }
}

const tooltipStyles = computed(() => {
  const xOffset = 24
  const yOffset = 24
  
  // Dynamic repositioning to avoid bottom clipping
  const isBottom = mousePos.value.y > window.innerHeight * 0.7
  
  return {
    left: `${mousePos.value.x + xOffset}px`,
    top: isBottom ? 'auto' : `${mousePos.value.y + yOffset}px`,
    bottom: isBottom ? `${window.innerHeight - mousePos.value.y + 10}px` : 'auto'
  }
})

function toggleMenuCategory(category: MenuCategory) {
  if (activeMenuCategory.value === category) {
    activeMenuCategory.value = null
  } else {
    activeMenuCategory.value = category
  }
}

// Viewport State
const viewState = ref({
  panX: window.innerWidth / 2,
  panY: window.innerHeight / 2,
  scale: 0.5,
  isPanning: false
})

// --- ASSET DATA STATE --- //
const assetSearchQuery = ref('')
const assetResults = ref<AssetInfo[]>([])
const isSearchingAssets = ref(false)
const failedIcons = ref<Set<string>>(new Set())
let searchTimeout: any = null

async function handleAssetSearch() {
  if (!assetSearchQuery.value) {
    assetResults.value = []
    return
  }
  
  isSearchingAssets.value = true
  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(async () => {
    try {
      assetResults.value = await searchAssets(assetSearchQuery.value)
    } finally {
      isSearchingAssets.value = false
    }
  }, 300)
}

function addAssetNode(asset: AssetInfo) {
  addNode({
    label: asset.symbol,
    type: 'instrument',
    color: 'currentColor',
    description: asset.description || `${asset.name} // ${asset.type}`,
    params: {
      symbol: asset.symbol,
      name: asset.name,
      logo: asset.icon,
      type: asset.type,
      info: asset.description
    }
  })
  assetSearchQuery.value = ''
  assetResults.value = []
}

onMounted(async () => {
  initAssetService()
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener('click', handleGlobalClick)
  document.addEventListener('selectionchange', saveTextSelection)

  // Start Boot Animation Sequence
  const bootInterval = setInterval(() => {
    bootProgress.value += Math.random() * 15
    if (bootProgress.value >= 100) {
      bootProgress.value = 100
      clearInterval(bootInterval)
    }
  }, 100)

  // Load Persisted Matrix Data
  try {
    const appBootStore = useAppBootStore()
    const saved = appBootStore.genesisMatrixCache || await loadFromDisk<any>(STORAGE_KEY)
    if (saved && saved.nodes?.length > 0) {
      // Migration: Ensure old 'system' nodes (like the legacy root) are converted to 'strategy'
      rootNodes.value = saved.nodes.map((n: any) => {
        if (n.type === 'system') return { ...n, type: 'strategy' }
        return n
      })
      
      if (saved.connections) rootConnections.value = saved.connections
      if (saved.zones) rootZones.value = saved.zones
      if (saved.view) {
        viewState.value.panX = saved.view.panX ?? viewState.value.panX
        viewState.value.panY = saved.view.panY ?? viewState.value.panY
        viewState.value.scale = saved.view.scale ?? viewState.value.scale
      }
      if (saved.personalIndicators) {
        personalIndicators.value = saved.personalIndicators
      }
      console.log('[GenesisPersistence] Data restored from disk.')
    } else {
      throw new Error('No saved nodes found')
    }
  } catch (err) {
    console.warn('[GenesisPersistence] Initialization fallback:', err)
    // NO LOCAL DATA OR ERROR - INITIALIZE DEFAULT STATE
    rootNodes.value = [{
      id: 'root-strategy',
      label: 'GENESIS_PROTOCOL',
      type: 'strategy',
      x: 400,
      y: 400,
      color: 'currentColor',
      params: { phase: 'NONE' },
      isRoot: true
    }]
    rootConnections.value = []
    rootZones.value = []
  }

  // Artificial delay for high-fidelity transition
  setTimeout(() => {
    isInitializing.value = false
    clearInterval(bootInterval)
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('click', handleGlobalClick)
  document.removeEventListener('selectionchange', saveTextSelection)
  cleanupMatrixAudioRecording()
})

function handleGlobalKeydown(e: KeyboardEvent) {
  // Ignore if user is typing in an input or textarea
  const target = e.target as HTMLElement
  const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

  if (activeDrawingNodeId.value) {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeDrawingFullscreen()
    }
    return
  }

  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (!isInput) {
      e.preventDefault() // Prevent browser back navigation
      if (lastSelectedId.value) {
        const node = getNode(lastSelectedId.value)
        if (node && !node.isRoot) {
          removeNode(lastSelectedId.value)
        }
      }
    }
  }
}

// --- MENU STATE --- //
const nodeContextMenu = ref<{ x: number, y: number, nodeId: string } | null>(null)

function handleNodeContextMenu(payload: { x: number, y: number, nodeId: string }) {
  nodeContextMenu.value = payload
}

const connectionContextMenu = ref<{ x: number, y: number, connection: Connection } | null>(null)

function handleConnectionClick(e: MouseEvent, connection: Connection) {
  connectionContextMenu.value = {
    x: e.clientX,
    y: e.clientY,
    connection
  }
}

const personalCondContextMenu = ref<{ x: number, y: number, indicator: any } | null>(null)

function handlePersonalCondContextMenu(e: MouseEvent, indicator: any) {
  personalCondContextMenu.value = {
    x: e.clientX,
    y: e.clientY,
    indicator
  }
}

function removePersonalCondition(indicator: any) {
  personalIndicators.value = personalIndicators.value.filter(
    (ind: any) => ind.label !== indicator.label
  )
  personalCondContextMenu.value = null
  saveMatrixData()
}

function setConnectionLabel(label: string | null) {
  if (connectionContextMenu.value) {
    const conn = connectionContextMenu.value.connection
    if (label === null) {
      delete conn.label
      delete conn.bundleId
    } else {
      const lowerLabel = label.toLowerCase()
      const isLogic = lowerLabel === 'and' || lowerLabel === 'or'
      const oldLabel = conn.label
      const wasLogic = oldLabel === 'and' || oldLabel === 'or'

      if (isLogic) {
        if (oldLabel === lowerLabel) {
          // RULE: If clicking the SAME logic label, add a new branch to THIS bundle
          const bundleId = conn.bundleId || ('b' + Date.now().toString(36))
          conn.bundleId = bundleId
          
          const id = 'n' + Date.now().toString(36)
          const fromNode = getNode(conn.fromId)
          const toNode = getNode(conn.toId)
          const offset = 120
          
          const newNode: Node = {
            id,
            label: 'EMPTY',
            type: 'placeholder',
            x: toNode ? toNode.x : (fromNode ? fromNode.x + 200 : 200),
            y: toNode ? toNode.y + offset : (fromNode ? fromNode.y + offset : 200),
            color: 'currentColor',
            params: {}
          }
          
          nodes.value.push(newNode)
          connections.value.push({
            fromId: conn.fromId,
            toId: id,
            label: lowerLabel,
            bundleId: bundleId,
            bundleStemX: conn.bundleStemX,
            bundleStemY: conn.bundleStemY
          })
        } else if (wasLogic) {
          // RULE: If clicking a DIFFERENT logic label, convert the whole bundle
          const bundleId = conn.bundleId
          const bundleConns = connections.value.filter(c => c.fromId === conn.fromId && c.bundleId === bundleId)
          bundleConns.forEach(c => {
            c.label = lowerLabel
          })
        } else {
          // RULE: If adding logic to a connection without prior logic, create a NEW bundle
          const bundleId = 'b' + Date.now().toString(36)
          conn.label = lowerLabel
          conn.bundleId = bundleId
          conn.bundleStemX = 0
          conn.bundleStemY = 0
          
          // Add a second branch automatically to complete the initial "bundle"
          const id = 'n' + Date.now().toString(36)
          const fromNode = getNode(conn.fromId)
          const toNode = getNode(conn.toId)
          const offset = 120
          
          const newNode: Node = {
            id,
            label: 'EMPTY',
            type: 'placeholder',
            x: toNode ? toNode.x : (fromNode ? fromNode.x + 200 : 200),
            y: toNode ? toNode.y + offset : (fromNode ? fromNode.y + offset : 200),
            color: 'currentColor',
            params: {}
          }
          
          nodes.value.push(newNode)
          connections.value.push({
            fromId: conn.fromId,
            toId: id,
            label: lowerLabel,
            bundleId: bundleId,
            bundleStemX: 0,
            bundleStemY: 0
          })
          forceUpdate()
        }
      } else {
        // Standard non-logic label assignment
        conn.label = lowerLabel
        delete conn.bundleId
      }
    }
    saveMatrixData()
  }
  connectionContextMenu.value = null
  forceUpdate()
}

function getConnectionMidpoint(line: Connection) {
  const from = getNode(line.fromId)
  const to = getNode(line.toId)
  if (!from || !to) return { x: 0, y: 0 }
  
  if (line.bundleId) {
     const parentBundles = [...new Set(connections.value.filter(c => c.fromId === from.id && c.bundleId).map(c => c.bundleId))]
     const bundleIndex = parentBundles.indexOf(line.bundleId)
     const totalBundles = parentBundles.length
     
     const fromRadius = (from.type === 'scaling-entry' || from.type === 'step') ? 28 : 56
     const fromGap = (from.type === 'scaling-entry' || from.type === 'step') ? 2 : 6
     const startX = from.x + (fromRadius + fromGap)
     
     // REPLICATE DYNAMIC STEM CALCULATION
     const minChildX = getMinChildX(from.id)
     const totalDx = Math.max(0, minChildX - startX)
     
     const mainStemLen = Math.max(120, totalDx * 0.25)
     const bundleStemLen = Math.max(160, totalDx * 0.35) + (line.bundleStemX || 0)
     
     const verticalSpread = 100
     const bundleYOffset = (totalBundles > 1 ? (bundleIndex - (totalBundles - 1) / 2) * verticalSpread : 0) + (line.bundleStemY || 0)
     
     return { 
       x: startX + mainStemLen + bundleStemLen, 
       y: from.y + bundleYOffset 
     }
  }
  
  return {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2
  }
}

function shouldShowLabel(line: Connection) {
  if (!line.label || !line.bundleId) return true
  
  // For logic labels, only show for the "first" sibling in the bundle to avoid overlap on the bundle junction
  const siblings = connections.value.filter(c => c.fromId === line.fromId && c.bundleId === line.bundleId)
  return siblings[0] === line
}

function handleLabelDrag(e: MouseEvent, line: Connection) {
  if (!line.bundleId) return
  
  const startX = e.clientX
  const startY = e.clientY
  
  const bundleConns = connections.value.filter(c => c.fromId === line.fromId && c.bundleId === line.bundleId)
  const initialStemX = line.bundleStemX || 0
  const initialStemY = line.bundleStemY || 0

  const move = (mE: MouseEvent) => {
    const deltaX = (mE.clientX - startX) / viewState.value.scale
    const deltaY = (mE.clientY - startY) / viewState.value.scale
    
    bundleConns.forEach(c => {
      c.bundleStemX = initialStemX + deltaX
      c.bundleStemY = initialStemY + deltaY
    })
  }
  
  const stop = () => {
    saveMatrixData()
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', stop)
  }
  
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', stop)
}

function addCommentToNode(nodeId: string) {
  const node = getNode(nodeId)
  if (node) {
    if (!node.params.comments) node.params.comments = []
    node.params.comments.push({
      id: 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      text: '[ LOG_INITIALIZED ]',
      x: 300,
      y: 0,
      width: 450,
      height: 280,
      isEditing: false
    })
    selectNode(nodeId)
    forceUpdate()
  }
  nodeContextMenu.value = null
}

function setNodeCustomName(nodeId: string) {
  const node = getNode(nodeId)
  if (node) {
    if (!node.params) node.params = {}
    node.params.isEditingName = true
    forceUpdate()
  }
  nodeContextMenu.value = null
}

function isNeonHighlight(line: Connection) {
  const label = line.label?.toLowerCase()
  if (label === 'if') {
    // Highlight if this 'if' leads to a node that has an outgoing 'therefore'
    return connections.value.some(c => 
      c.fromId === line.toId && 
      c.label?.toLowerCase() === 'therefore'
    )
  }
  if (label === 'therefore') {
    // Highlight if this 'therefore' comes from a node that has an incoming 'if'
    return connections.value.some(c => 
      c.toId === line.fromId && 
      c.label?.toLowerCase() === 'if'
    )
  }
  return false
}

function isThereforeHighlight(line: Connection) {
  if (line.label?.toLowerCase() !== 'therefore') return false
  
  // Check if the node this connection starts from has an incoming 'if' connection
  return connections.value.some(c => 
    c.toId === line.fromId && 
    c.label?.toLowerCase() === 'if'
  )
}

function cycleNodeDirection(nodeId: string) {
  const node = getNode(nodeId)
  if (node) {
    if (!node.params) node.params = {}
    if (!node.params.direction || node.params.direction === 'NONE') {
      node.params.direction = 'LONG'
    } else if (node.params.direction === 'LONG') {
      node.params.direction = 'SHORT'
    } else {
      node.params.direction = 'NONE'
    }
    forceUpdate()
    saveMatrixData()
  }
  nodeContextMenu.value = null
}

function setNodePhase(nodeId: string, phase: 'ENTRY' | 'EXIT' | 'NONE') {
  const node = getNode(nodeId)
  if (node) {
    if (!node.params) node.params = {}
    node.params.phase = phase
    saveMatrixData()
    forceUpdate()
  }
  nodeContextMenu.value = null
}

function cycleNodePhase(nodeId: string) {
  const node = getNode(nodeId)
  if (node) {
    if (!node.params) node.params = {}
    const phases = ['NONE', 'ENTRY', 'EXIT']
    const currentPhase = node.params.phase || 'NONE'
    const nextPhase = phases[(phases.indexOf(currentPhase) + 1) % phases.length]
    node.params.phase = nextPhase
    saveMatrixData()
    forceUpdate()
  }
  nodeContextMenu.value = null
}

function cycleNodePriority(nodeId: string) {
  const node = getNode(nodeId)
  if (node) {
    if (!node.params) node.params = {}
    const priorities = ['NONE', 'REQUIRED', 'ADDITIONAL']
    const currentPriority = node.params.priority || 'NONE'
    const nextPriority = priorities[(priorities.indexOf(currentPriority) + 1) % priorities.length]
    node.params.priority = nextPriority
    saveMatrixData()
    forceUpdate()
  }
  nodeContextMenu.value = null
}

// --- DRAWING STATE --- //
const isZoneToolActive = ref(false)
const selectedZoneType = ref<'entry' | 'in-trade' | 'exit' | 'session'>('entry')
const drawStart = ref<Point | null>(null)
const drawCurrent = ref<Point | null>(null)

// --- COMPUTED SYSTEM --- //

const indicatorTypes = computed(() => {
  const query = indicatorSearchQuery.value.toUpperCase()
  if (query) {
    const system = indicatorData.categories.flatMap(c => c.indicators)
    const personal = personalIndicators.value
    return [...system, ...personal].filter((i: any) => 
      i.label.includes(query) || (i.description || '').toUpperCase().includes(query)
    )
  }
  
  if (activeIndicatorCategory.value === 'PERSONAL') {
    return personalIndicators.value
  }
  
  return indicatorData.categories.find(c => c.id === activeIndicatorCategory.value)?.indicators || []
})

const drawPreviewStyle = computed(() => {
  if (!drawStart.value || !drawCurrent.value) return {}
  const x = Math.min(drawStart.value.x, drawCurrent.value.x)
  const y = Math.min(drawStart.value.y, drawCurrent.value.y)
  const w = Math.abs(drawStart.value.x - drawCurrent.value.x)
  const h = Math.abs(drawStart.value.y - drawCurrent.value.y)
  return {
    left: `${x}px`,
    top: `${y}px`,
    width: `${w}px`,
    height: `${h}px`
  }
})

// --- LOGIC HANDLERS --- //


const closestNodeId = computed(() => {
  if (!activeWireRaw.value) return null
  
  const { x: mx, y: my } = activeWireRaw.value.current
  let closestId = null
  let minDistance = 300 // Proximity Threshold in Pixels
  
  nodes.value.forEach(node => {
     // Don't target the source node
     if (node.id === activeWireRaw.value!.fromId) return
     if (node.isRoot) return

     const dist = Math.sqrt(Math.pow(node.x - mx, 2) + Math.pow(node.y - my, 2))
     if (dist < minDistance) {
       minDistance = dist
       closestId = node.id
     }
  })
  
  return closestId
})

function findNodeById(list: Node[], id: string): Node | null {
  for (const node of list) {
    if (node.id === id) return node
    if (node.subGraph) {
      const found = findNodeById(node.subGraph.nodes, id)
      if (found) return found
    }
  }
  return null
}

function handleNodeDive(node: Node) {
  const divableTypes = ['strategy', 'scenario', 'condition', 'instrument', 'indicator', 'pattern', 'smc']
  if (divableTypes.includes(node.type)) {
    if (!node.subGraph) {
       node.subGraph = { nodes: [], connections: [], zones: [] }
    }
    navigateTo([...navigationStack.value, node.id])
  } else if (node.type === 'image') {
    triggerImageUpload(node.id)
  } else if (node.type === 'text-panel') {
    selectNode(node.id)
    openTextCommandLink(node)
  } else if (node.type === 'drawing-panel') {
    openDrawingFullscreen(node)
  } else if (node.type === 'file-attachment') {
    triggerGenericFileUpload(node.id)
  }
}

type LegacyNavigatorWithMedia = Navigator & {
  getUserMedia?: (constraints: MediaStreamConstraints, success: (stream: MediaStream) => void, error: (error: Error) => void) => void
  webkitGetUserMedia?: (constraints: MediaStreamConstraints, success: (stream: MediaStream) => void, error: (error: Error) => void) => void
  mozGetUserMedia?: (constraints: MediaStreamConstraints, success: (stream: MediaStream) => void, error: (error: Error) => void) => void
}

function canRequestMatrixMicrophone() {
  if (typeof navigator === 'undefined') return false
  const legacyNavigator = navigator as LegacyNavigatorWithMedia
  return !!navigator.mediaDevices?.getUserMedia ||
    !!legacyNavigator.getUserMedia ||
    !!legacyNavigator.webkitGetUserMedia ||
    !!legacyNavigator.mozGetUserMedia
}

function isTauriRuntime() {
  return typeof window !== 'undefined' && (
    '__TAURI__' in (window as any) ||
    '__TAURI_INTERNALS__' in (window as any) ||
    navigator.userAgent.includes('Tauri')
  )
}

function shouldUseNativeMatrixAudioRecorder() {
  return isTauriRuntime() && !canRequestMatrixMicrophone()
}

function requestMatrixAudioStream() {
  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia({ audio: true })
  }

  const legacyNavigator = navigator as LegacyNavigatorWithMedia
  const legacyGetUserMedia = legacyNavigator.getUserMedia ||
    legacyNavigator.webkitGetUserMedia ||
    legacyNavigator.mozGetUserMedia

  if (!legacyGetUserMedia) {
    return Promise.reject(new Error('MICROPHONE_API_UNAVAILABLE'))
  }

  return new Promise<MediaStream>((resolve, reject) => {
    legacyGetUserMedia.call(navigator, { audio: true }, resolve, reject)
  })
}

function getMatrixMicrophoneUnavailableReason() {
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return 'Secure_Context_Required'
  }
  if (typeof MediaRecorder === 'undefined') {
    return 'Recorder_Not_Available'
  }
  return 'Microphone_Not_Available'
}

function getSupportedMatrixAudioMimeType() {
  const options = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4'
  ]
  return options.find(type => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) || ''
}

function createAudioNodeFromRecording(params: { audioName: string; audioType: string; audioDataUrl: string }) {
  addNode({
    label: 'AUDIO_NOTE',
    type: 'audio-note',
    color: 'currentColor',
    description: 'Recorded audio note for scenario archive.',
    params: {
      shortCode: 'AUD',
      menuLabel: 'AUDIO',
      protocol: 'AUDIO_NOTE',
      description: 'Recorded audio note for scenario archive.',
      ...params
    }
  })
}

async function startMatrixAudioRecording() {
  matrixAudioError.value = ''
  if (shouldUseNativeMatrixAudioRecorder()) {
    await startNativeMatrixAudioRecording()
    return
  }
  if (typeof MediaRecorder === 'undefined') {
    matrixAudioError.value = 'Recorder_Not_Available'
    return
  }
  if (!canRequestMatrixMicrophone()) {
    matrixAudioError.value = getMatrixMicrophoneUnavailableReason()
    return
  }

  try {
    cleanupMatrixAudioRecording()
    matrixAudioChunks = []
    const stream = await requestMatrixAudioStream()
    const mimeType = getSupportedMatrixAudioMimeType()
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    matrixAudioStream.value = stream
    matrixAudioRecorder.value = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) matrixAudioChunks.push(event.data)
    }
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || 'audio/webm'
      const blob = new Blob(matrixAudioChunks, { type })
      const extension = type.includes('mp4') ? 'mp4' : 'webm'
      const reader = new FileReader()
      reader.onload = (event) => {
        createAudioNodeFromRecording({
          audioName: `audio-note-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`,
          audioType: type,
          audioDataUrl: event.target?.result as string
        })
        cleanupMatrixAudioRecording()
      }
      reader.readAsDataURL(blob)
    }

    recorder.start()
    matrixAudioRecordingState.value = 'recording'
  } catch {
    matrixAudioError.value = 'Microphone_Access_Denied'
    cleanupMatrixAudioRecording()
  }
}

function pauseMatrixAudioRecording() {
  if (isMatrixNativeAudioSession.value) {
    pauseNativeMatrixAudioRecording()
    return
  }
  if (matrixAudioRecorder.value?.state !== 'recording') return
  matrixAudioRecorder.value.pause()
  matrixAudioRecordingState.value = 'paused'
}

function resumeMatrixAudioRecording() {
  if (isMatrixNativeAudioSession.value) {
    resumeNativeMatrixAudioRecording()
    return
  }
  if (matrixAudioRecorder.value?.state !== 'paused') return
  matrixAudioRecorder.value.resume()
  matrixAudioRecordingState.value = 'recording'
}

function finishMatrixAudioRecording() {
  if (isMatrixNativeAudioSession.value) {
    stopNativeMatrixAudioRecording()
    return
  }
  if (!matrixAudioRecorder.value || matrixAudioRecorder.value.state === 'inactive') return
  matrixAudioRecorder.value.stop()
  matrixAudioRecordingState.value = 'idle'
}

function cleanupMatrixAudioRecording() {
  if (isMatrixNativeAudioSession.value) {
    invoke('native_audio_stop').catch(() => {})
    isMatrixNativeAudioSession.value = false
  }
  if (matrixAudioRecorder.value && matrixAudioRecorder.value.state !== 'inactive') {
    matrixAudioRecorder.value.onstop = null
    try {
      matrixAudioRecorder.value.stop()
    } catch {
      // Recorder may already be closing after its tracks were revoked.
    }
  }
  matrixAudioStream.value?.getTracks().forEach(track => track.stop())
  matrixAudioStream.value = null
  matrixAudioRecorder.value = null
  matrixAudioRecordingState.value = 'idle'
}

async function startNativeMatrixAudioRecording() {
  try {
    await invoke('native_audio_start')
    isMatrixNativeAudioSession.value = true
    matrixAudioRecordingState.value = 'recording'
    matrixAudioError.value = ''
  } catch (error) {
    matrixAudioError.value = String(error || 'Native_Audio_Start_Failed')
    isMatrixNativeAudioSession.value = false
    matrixAudioRecordingState.value = 'idle'
  }
}

async function pauseNativeMatrixAudioRecording() {
  try {
    await invoke('native_audio_pause')
    matrixAudioRecordingState.value = 'paused'
  } catch (error) {
    matrixAudioError.value = String(error || 'Native_Audio_Pause_Failed')
  }
}

async function resumeNativeMatrixAudioRecording() {
  try {
    await invoke('native_audio_resume')
    matrixAudioRecordingState.value = 'recording'
  } catch (error) {
    matrixAudioError.value = String(error || 'Native_Audio_Resume_Failed')
  }
}

async function stopNativeMatrixAudioRecording() {
  try {
    const result = await invoke<{
      data_url: string
      mime_type: string
      file_name: string
    }>('native_audio_stop')
    createAudioNodeFromRecording({
      audioName: result.file_name,
      audioType: result.mime_type,
      audioDataUrl: result.data_url
    })
  } catch (error) {
    matrixAudioError.value = String(error || 'Native_Audio_Stop_Failed')
  } finally {
    isMatrixNativeAudioSession.value = false
    matrixAudioRecordingState.value = 'idle'
  }
}

// --- PERSISTENCE --- //

const buildLogicalStructure = (parentId: string, allNodes: any[], allConnections: any[]) => {
  const conns = allConnections.filter(c => c.fromId === parentId)
  const bundles: Record<string, any> = {}
  const structure: any[] = []

  conns.forEach(c => {
    const toNode = allNodes.find(n => n.id === c.toId)
    if (!toNode || toNode.type === 'placeholder') return

    if (c.bundleId) {
      if (!bundles[c.bundleId]) {
        bundles[c.bundleId] = { 
          id: c.bundleId, 
          type: 'bundle', 
          logic: (c.label || 'AND').toUpperCase(), 
          nodeIds: [] 
        }
        structure.push(bundles[c.bundleId])
      }
      bundles[c.bundleId].nodeIds.push(toNode.id)
    } else {
      structure.push({ 
        id: toNode.id, 
        type: 'single' 
      })
    }
  })
  return structure
}

const processNodeTree = (node: any, allNodes: any[], allConnections: any[]): any => {
  // 1. Calculate structure for this node
  const structure = buildLogicalStructure(node.id, allNodes, allConnections)
  
  // 2. Deep clone and update params
  const newNode = {
    ...node,
    params: {
      ...node.params,
      logicalStructure: structure
    }
  }

  // 3. Recursively process subgraph if it exists
  if (newNode.subGraph && newNode.subGraph.nodes) {
    newNode.subGraph.nodes = newNode.subGraph.nodes
      .map((n: any) => processNodeTree(n, newNode.subGraph!.nodes, newNode.subGraph!.connections))
      .filter((n: any) => n.type !== 'placeholder')
  }

  return newNode
}

let saveTimeout: any = null
const saveMatrixData = async () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    // Process the entire root tree
    const processedNodes = rootNodes.value
      .map(n => processNodeTree(n, rootNodes.value, rootConnections.value))
      .filter(n => n.type !== 'placeholder')

    const data = {
      nodes: processedNodes,
      connections: rootConnections.value,
      zones: rootZones.value,
      view: {
        panX: viewState.value.panX,
        panY: viewState.value.panY,
        scale: viewState.value.scale
      },
      personalIndicators: personalIndicators.value
    }
    const appBootStore = useAppBootStore()
    appBootStore.genesisMatrixCache = data
    await saveToDisk(STORAGE_KEY, data)
  }, 1000)
}

// Watch for any data changes
watch([rootNodes, rootConnections, rootZones, personalIndicators], () => {
  saveMatrixData()
}, { deep: true })

// Watch for viewport changes separately (to preserve focus state)
watch([() => viewState.value.panX, () => viewState.value.panY, () => viewState.value.scale], () => {
  if (isScenarioContext.value && viewState.value.scale !== 1) {
    viewState.value.scale = 1
    return
  }
  saveMatrixData()
})

function goBack() {
  navigateTo(navigationStack.value.slice(0, -1))
}

function jumpTo(index: number | null) {
  if (index === null) {
    navigateTo([])
    return
  }
  navigateTo(navigationStack.value.slice(0, index + 1))
}

function handleCreateCustomIndicator(indicator: any) {
  personalIndicators.value.push(indicator)
  activeIndicatorCategory.value = 'PERSONAL'
  addNode(indicator)
}

const breadcrumbs = computed(() => {
  const list = navigationStack.value.map(id => {
    const node = findNodeById(rootNodes.value, id)
    return { id, label: node?.params?.customName || node?.label || 'SCENARIO' }
  })
  return [{ id: null, label: 'MAIN' }, ...list]
})

function activateZoneTool(type: 'entry' | 'in-trade' | 'exit' | 'session') {
  isZoneToolActive.value = true
  selectedZoneType.value = type
}

function addNode(type: any) {
  const lastSelected = lastSelectedId.value ? getNode(lastSelectedId.value) : null
  
  // Technical categories that require configuration
  const techCategories = ['TREND', 'MOMENTUM', 'VOLATILITY', 'VOLUME']
  const needsConfig = type.type === 'indicator' && techCategories.includes(activeIndicatorCategory.value)

  if (lastSelected?.type === 'placeholder') {
     // REPLACE PLACEHOLDER IN-PLACE
     lastSelected.type = type.type
     lastSelected.label = type.type === 'step' ? (type.label || '1') : (type.label || 'CHIP').toUpperCase()
     lastSelected.color = type.color || '#FFF'
     lastSelected.params = {
       ...(type.params || {}),
       needsConfig,
       description: type.params?.description || type.description || ({
         'strategy': 'High-level tactical objective defining the overarching market approach.',
         'scenario': 'Specific market condition sequence required for protocol activation.',
         'condition': 'Individual technical trigger or state validation required within a scenario.',
         'risk': 'Risk management protocol defining loss constraints and exposure limits.',
         'emotion': 'Psychological state monitoring to ensure execution discipline.',
         'pyramiding': 'Incremental position scaling protocol for trend momentum capitalization.',
         'averaging': 'Strategic cost-basis optimization through distributed entry execution.',
         'image': 'Visual documentation of market structure for archival verification.'
       }[type.type as string] || 'Standard tactical protocol for Matrix operations.'),
       value: type.params?.value || type.description || type.params?.info || ('0x' + lastSelected.id.slice(-4)),
       ...( (type.type === 'pyramiding' || type.type === 'averaging') ? {
         scalingProtocol: [
           { id: 'p1', value: 5, unit: '%', size: 1 },
           { id: 'p2', value: 15, unit: '%', size: 1.5 }
         ]
       } : {} ),
       ...( type.type === 'risk' ? {
         riskLossTrade: riskLossTrade.value,
         riskLossTradeUnit: riskLossTradeUnit.value,
         riskLossDay: riskLossDay.value,
         riskRR: riskRR.value
       } : {} )
     }
     
     saveMatrixData()
     // Re-select to update menu
     selectNode(lastSelected.id)
     return
  }

  const id = 'n' + Date.now().toString(36)
  const lastNode = lastSelected || nodes.value[nodes.value.length - 1]
  
  const newNode: Node = {
    id,
    label: type.type === 'step' ? (type.label || '1') : (type.label || 'CHIP').toUpperCase(),
    type: type.type,
    x: (lastNode?.x || 100) + 160,
    y: (lastNode?.y || 100) + (Math.random() * 80 - 40),
    color: type.color || '#FFF',
    params: { 
      ...(type.params || {}),
      needsConfig,
      description: type.params?.description || type.description || ({
        'strategy': 'High-level tactical objective defining the overarching market approach.',
        'scenario': 'Specific market condition sequence required for protocol activation.',
        'condition': 'Individual technical trigger or state validation required within a scenario.',
        'risk': 'Risk management protocol defining loss constraints and exposure limits.',
        'emotion': 'Psychological state monitoring to ensure execution discipline.',
        'pyramiding': 'Incremental position scaling protocol for trend momentum capitalization.',
        'averaging': 'Strategic cost-basis optimization through distributed entry execution.',
        'image': 'Visual documentation of market structure for archival verification.'
      }[type.type as string] || 'Standard tactical protocol for Matrix operations.'),
      value: type.params?.value || type.description || type.params?.info || ('0x' + id.slice(-4)),
      ...( (type.type === 'pyramiding' || type.type === 'averaging') ? {
        scalingProtocol: [
          { id: 'p1', value: 5, unit: '%', size: 1 },
           { id: 'p2', value: 15, unit: '%', size: 1.5 }
        ]
      } : {} ),
      ...( type.type === 'risk' ? {
        riskLossTrade: riskLossTrade.value,
        riskLossTradeUnit: riskLossTradeUnit.value,
        riskLossDay: riskLossDay.value,
        riskRR: riskRR.value
      } : {} )
    }
  }
  
  if (activeContextId.value && activeContextNode.value) {
    if (!activeContextNode.value.subGraph) activeContextNode.value.subGraph = { nodes: [], connections: [], zones: [] }
    activeContextNode.value!.subGraph!.nodes.push(newNode)
    if (lastNode) activeContextNode.value!.subGraph!.connections.push({ fromId: lastNode.id, toId: id })
  } else {
    rootNodes.value.push(newNode)
    if (lastNode) rootConnections.value.push({ fromId: lastNode.id, toId: id })
  }
 
  saveMatrixData()
  selectNode(id)
}

const imageInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadingNodeId = ref<string | null>(null)
const uploadingFileNodeId = ref<string | null>(null)

function triggerImageUpload(nodeId: string) {
  uploadingNodeId.value = nodeId
  imageInput.value?.click()
}

function triggerGenericFileUpload(nodeId: string) {
  uploadingFileNodeId.value = nodeId
  fileInput.value?.click()
}

function handleImageUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !uploadingNodeId.value) return
  
  const reader = new FileReader()
  reader.onload = (event) => {
    const node = getNode(uploadingNodeId.value!)
    if (node) {
      if (!node.params) node.params = {}
      node.params.imageUrl = event.target?.result as string
      node.params.width = 300
      node.params.height = 200
    }
    uploadingNodeId.value = null
  }
  reader.readAsDataURL(file)
}

function handleGenericFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !uploadingFileNodeId.value) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const node = getNode(uploadingFileNodeId.value!)
    if (node) {
      if (!node.params) node.params = {}
      node.params.fileName = file.name
      node.params.fileSize = file.size
      node.params.fileType = file.type || 'application/octet-stream'
      node.params.fileDataUrl = event.target?.result as string
    }
    uploadingFileNodeId.value = null
    ;(e.target as HTMLInputElement).value = ''
  }
  reader.readAsDataURL(file)
}

function getMenuCategoryForNode(node: Node | null): MenuCategory | null {
  if (!node) return null
  if (isScenarioContext.value) {
    if (node.type === 'text-panel') return 'TEXT_FORMAT'
    if (['checklist-panel', 'embed-panel', 'table-panel', 'image', 'drawing-panel', 'file-attachment', 'audio-note'].includes(node.type)) return null
    return 'SCENARIO_DOCS'
  }
  if (node.type === 'text-panel') return 'TEXT_FORMAT'
  if (node.params?.needsConfig) return 'CONFIG'
  if (node.type === 'condition' || node.type === 'indicator' || node.type === 'pattern' || node.type === 'smc') {
    return 'INDICATORS'
  } else if (node.type === 'emotion') {
    return 'EMOTIONS'
  } else if (node.type === 'emotion-state') {
    return null
  } else if (node.type === 'pyramiding' || node.type === 'averaging' || node.type === 'scaling-entry') {
    return 'SCALING'
  } else if (node.type === 'risk') {
    return 'RISK'
  }
  return 'LOGIC'
}

function selectNode(id: string | null) {
  lastSelectedId.value = id
  nodeContextMenu.value = null
  if (!id) {
    activeMenuCategory.value = null
    activeTextNodeId.value = null
    drawCurrent.value = null
    return
  }
  const node = getNode(id)
  
  if (node?.type === 'placeholder') {
    activeTextNodeId.value = null
    // Find parent node
    const parentConn = connections.value.find(c => c.toId === id)
    const parentNode = parentConn ? getNode(parentConn.fromId) : null
    activeMenuCategory.value = getMenuCategoryForNode(parentNode || null)
  } else {
    if (node?.type !== 'text-panel') activeTextNodeId.value = null
    activeMenuCategory.value = getMenuCategoryForNode(node || null)
    if (node?.type === 'text-panel') openTextCommandLink(node)
  }
}

function addScalingEntry() {
  const parentId = lastSelectedId.value
  const parentNode = parentId ? getNode(parentId) : null
  if (!parentNode || (parentNode.type !== 'pyramiding' && parentNode.type !== 'averaging')) return

  // Count existing scaling-entry children from this parent to assign a sequential number
  const connList = activeContextId.value && activeContextNode.value?.subGraph
    ? activeContextNode.value.subGraph.connections
    : rootConnections.value
  const siblingCount = connList.filter(c => c.fromId === parentId && getNode(c.toId)?.type === 'scaling-entry').length
  const posNumber = siblingCount + 1

  const id = 'se' + Date.now().toString(36)
  const newNode: Node = {
    id,
    label: String(posNumber),
    type: 'scaling-entry',
    x: parentNode.x + 180 + (siblingCount % 3) * 160,
    y: parentNode.y - 80 + siblingCount * 80,
    color: '#FFF',
    params: {
      posNumber,
      lots: scalingLots.value,
      step: scalingStep.value,
      unit: scalingUnit.value,
      lotsMode: scalingMode.value,
      parentType: parentNode.type
    }
  }

  if (!parentId) return

  if (activeContextId.value && activeContextNode.value) {
    if (!activeContextNode.value.subGraph) activeContextNode.value.subGraph = { nodes: [], connections: [], zones: [] }
    activeContextNode.value.subGraph.nodes.push(newNode)
    activeContextNode.value.subGraph.connections.push({ fromId: parentId as string, toId: id })
  } else {
    rootNodes.value.push(newNode)
    rootConnections.value.push({ fromId: parentId as string, toId: id })
  }
  // Re-select parent so user can add more entries
  selectNode(parentId)
}

function updateScalingEntry() {
  const node = effectiveSelectedNode.value
  if (!node || node.type !== 'scaling-entry') return
  
  node.params.lots = scalingLots.value
  node.params.step = scalingStep.value
  node.params.unit = scalingUnit.value
  node.params.lotsMode = scalingMode.value
  
  saveMatrixData()
  forceUpdate()
}

function handleCreateConfig(config: { label: string, description: string }) {
  const lastSelected = lastSelectedId.value ? getNode(lastSelectedId.value) : null
  if (!lastSelected) return

  const id = 'cfg' + Date.now().toString(36)
  const newNode: Node = {
    id,
    label: config.label,
    type: 'condition',
    x: lastSelected.x + 200,
    y: lastSelected.y,
    color: '#FFF',
    params: {
      isConfig: true,
      description: config.description
    }
  }

  if (activeContextId.value && activeContextNode.value) {
    if (!activeContextNode.value.subGraph) activeContextNode.value.subGraph = { nodes: [], connections: [], zones: [] }
    activeContextNode.value!.subGraph!.nodes.push(newNode)
    activeContextNode.value!.subGraph!.connections.push({ fromId: lastSelected.id, toId: id })
  } else {
    rootNodes.value.push(newNode)
    rootConnections.value.push({ fromId: lastSelected.id, toId: id })
  }
  
  isConfigSetterOpen.value = false
  saveMatrixData()
  selectNode(id)
}

function refreshMergeStatus() {
  const currentNodes = nodes.value
  const currentConns = connections.value
  
  if (!currentNodes) return

  // Clear old flags for all nodes in current view
  currentNodes.forEach(node => {
    if (node.params) {
      delete node.params.canMerge
      delete node.params.mergePartnerId
      delete node.params.isIndicatorSide
    }
  })

  // Set new flags based on current connections
  currentConns.forEach(conn => {
    const from = currentNodes.find(n => n.id === conn.fromId)
    const to = currentNodes.find(n => n.id === conn.toId)
    
    if (from?.params?.needsConfig && to?.params?.isConfig) {
      from.params.canMerge = true
      from.params.mergePartnerId = to.id
      from.params.isIndicatorSide = true
      
      to.params.canMerge = true
      to.params.mergePartnerId = from.id
      to.params.isIndicatorSide = false
    }
  })
}

// Watch for structural changes to update merge status
watch([connections, () => nodes.value.length], () => {
  refreshMergeStatus()
}, { deep: true, immediate: true })

function mergeNodes(indicatorId: string, configId: string) {
  const indicator = getNode(indicatorId)
  const config = getNode(configId)
  if (!indicator || !config) return

  // Update indicator
  const originalIndicatorLabel = indicator.label
  indicator.label = `${indicator.label} + ${config.label}`
  indicator.params.needsConfig = false
  
  // Clean up merge flags immediately to avoid stale UI
  delete indicator.params.canMerge
  delete indicator.params.mergePartnerId
  delete indicator.params.isIndicatorSide

  // Update description with the requested format
  indicator.params.description = `${originalIndicatorLabel} : ${config.params.description || 'REIFIED_PROTOCOL'}`

  // Remove config node and connection
  removeNode(configId)
  
  saveMatrixData()
  selectNode(indicatorId)
}

function addRiskParameter(type: 'trade' | 'day' | 'rr') {
  const parentId = lastSelectedId.value
  const parentNode = parentId ? getNode(parentId) : null
  if (!parentNode || parentNode.type !== 'risk') return

  const connList = activeContextId.value && activeContextNode.value?.subGraph
    ? activeContextNode.value.subGraph.connections
    : rootConnections.value
  const siblingCount = connList.filter(c => c.fromId === parentId && getNode(c.toId)?.type === 'risk-element').length

  const id = 're' + Date.now().toString(36)
  let label = ''
  let params: any = { riskType: type }

  if (type === 'trade') {
    label = `RISK_PER_TRADE: ${riskLossTrade.value}${riskLossTradeUnit.value}`
    params.value = riskLossTrade.value
    params.unit = riskLossTradeUnit.value
  } else if (type === 'day') {
    const unitPrefix = riskLossDayUnit.value === '$' ? '$' : ''
    const unitSuffix = riskLossDayUnit.value === '%' ? '%' : ''
    label = `RISK_PER_SESSION: ${unitPrefix}${riskLossDay.value}${unitSuffix}`
    params.value = riskLossDay.value
    params.unit = riskLossDayUnit.value
  } else if (type === 'rr') {
    label = `RISK_REWARD_RATIO: 1:${riskRR.value}`
    params.value = riskRR.value
  }

  const newNode: Node = {
    id,
    label,
    type: 'risk-element',
    x: parentNode.x + 180,
    y: parentNode.y - 120 + (siblingCount * 80),
    color: '#FF3333',
    params
  }

  if (!parentId) return

  if (activeContextId.value && activeContextNode.value) {
    if (!activeContextNode.value.subGraph) activeContextNode.value.subGraph = { nodes: [], connections: [], zones: [] }
    activeContextNode.value.subGraph.nodes.push(newNode)
    activeContextNode.value.subGraph.connections.push({ fromId: parentId as string, toId: id })
  } else {
    rootNodes.value.push(newNode)
    rootConnections.value.push({ fromId: parentId as string, toId: id })
  }
  selectNode(parentId)
}

function handleGlobalClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.context-menu-container')) {
    nodeContextMenu.value = null
    connectionContextMenu.value = null
    personalCondContextMenu.value = null
  }
}

function handleBackgroundClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  
  // Clear context menus first
  nodeContextMenu.value = null
  connectionContextMenu.value = null
  personalCondContextMenu.value = null

  // If we clicked an interactive element, do nothing else
  if (target.closest('.skill-chip') || 
      target.closest('.tactical-button') || 
      target.closest('.zone-card') ||
      target.closest('.pointer-events-auto:not(.absolute.inset-0)')) {
    return
  }
  
  selectNode(null)
}

// Keep as utility for potential manual adjustments
function assignEmotion(emotion: any) {
  if (!lastSelectedId.value) return
  const node = getNode(lastSelectedId.value)
  if (!node) return
  
  node.label = emotion.label
  node.params = {
    ...node.params,
    emotionType: emotion.type,
    remedies: emotion.remedies || []
  }
  forceUpdate()
}

function removeZone(id: string) {
  zones.value = zones.value.filter(z => z.id !== id)
}

function handleZoneCycle(id: string) {
  const zone = zones.value.find(z => z.id === id)
  if (!zone) return
  
  if (zone.type === 'session') {
    const sessions = ['SYDNEY', 'TOKYO', 'LONDON', 'NEW_YORK']
    const currentIndex = sessions.indexOf(zone.label)
    zone.label = sessions[(currentIndex + 1) % sessions.length]!
  } else {
    const types: Array<Zone['type']> = ['entry', 'in-trade', 'exit']
    const currentIndex = types.indexOf(zone.type)
    zone.type = types[(currentIndex + 1) % types.length]!
    zone.label = `SECTOR_${zone.type.toUpperCase()}`
  }
  forceUpdate()
}

function removeNode(id: string) {
  const nodeToRemove = getNode(id)
  if (nodeToRemove?.type === 'condition' && activeMenuCategory.value === 'INDICATORS') {
    activeMenuCategory.value = null
  }
  if (lastSelectedId.value === id) {
    lastSelectedId.value = null
    activeMenuCategory.value = null
  }

  if (activeContextId.value && activeContextNode.value?.subGraph) {
    activeContextNode.value.subGraph.nodes = activeContextNode.value.subGraph.nodes.filter(n => n.id !== id)
    activeContextNode.value.subGraph.connections = activeContextNode.value.subGraph.connections.filter(c => c.fromId !== id && c.toId !== id)
  } else {
    rootNodes.value = rootNodes.value.filter(n => n.id !== id)
    rootConnections.value = rootConnections.value.filter(c => c.fromId !== id && c.toId !== id)
  }
  cleanupLogicBundles()
  saveMatrixData()
}

function clearNodeInputConnections(node: Node) {
  if (activeContextId.value && activeContextNode.value?.subGraph) {
    activeContextNode.value.subGraph.connections = activeContextNode.value.subGraph.connections.filter(c => c.toId !== node.id)
  } else {
    rootConnections.value = rootConnections.value.filter(c => c.toId !== node.id)
  }
  cleanupLogicBundles()
  saveMatrixData()
}

function cleanupLogicBundles() {
  // Identify all unique (parent, bundleId) pairs
  const bundles = new Map<string, Connection[]>()
  
  connections.value.forEach(c => {
    if (c.bundleId) {
      const key = `${c.fromId}_${c.bundleId}`
      if (!bundles.has(key)) bundles.set(key, [])
      bundles.get(key)!.push(c)
    }
  })
  
  // For each bundle group, if it has 1 or 0 connections remaining, strip logic
  bundles.forEach((conns, key) => {
    if (conns.length <= 1) {
      conns.forEach(c => {
        delete c.bundleId
        if (c.label?.toLowerCase() === 'and' || c.label?.toLowerCase() === 'or') {
          delete c.label
        }
        delete c.bundleStemX
        delete c.bundleStemY
      })
    }
  })
  forceUpdate()
}

function clearNodeOutputConnections(node: Node) {
  if (activeContextId.value && activeContextNode.value?.subGraph) {
    activeContextNode.value.subGraph.connections = activeContextNode.value.subGraph.connections.filter(c => c.fromId !== node.id)
  } else {
    rootConnections.value = rootConnections.value.filter(c => c.fromId !== node.id)
  }
}

// --- NAVIGATION --- //

function screenToWorld(clientX: number, clientY: number) {
  if (!canvasWrapper.value) return { x: 0, y: 0 }
  const rect = canvasWrapper.value.getBoundingClientRect()
  return {
    x: (clientX - rect.left - viewState.value.panX) / viewState.value.scale,
    y: (clientY - rect.top - viewState.value.panY) / viewState.value.scale
  }
}



function startPan(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.skill-chip') || 
      (e.target as HTMLElement).closest('.tactical-button') ||
      (e.target as HTMLElement).closest('.pointer-events-auto:not(.absolute.inset-0)')) return

  if (isZoneToolActive.value) {
    const worldPos = screenToWorld(e.clientX, e.clientY)
    drawStart.value = worldPos
    drawCurrent.value = worldPos
    return
  }

  viewState.value.isPanning = true
  const startX = e.clientX
  const startY = e.clientY
  const initialPanX = viewState.value.panX
  const initialPanY = viewState.value.panY
  const moveWindow = (mE: MouseEvent) => {
    if (!viewState.value.isPanning) return
    viewState.value.panX = initialPanX + (mE.clientX - startX)
    viewState.value.panY = initialPanY + (mE.clientY - startY)
  }
  const stopPan = () => {
    viewState.value.isPanning = false
    window.removeEventListener('mousemove', moveWindow)
    window.removeEventListener('mouseup', stopPan)
  }
  window.addEventListener('mousemove', moveWindow)
  window.addEventListener('mouseup', stopPan)
}

function resetView() {
  viewState.value.panX = 0
  viewState.value.panY = 0
  viewState.value.scale = 1
}

function focusRoot() {
  const rootNode = nodes.value.find(n => n.isRoot) || nodes.value[0]
  if (rootNode && canvasWrapper.value) {
    const rect = canvasWrapper.value.getBoundingClientRect()
    viewState.value.scale = 1
    viewState.value.panX = (rect.width / 2) - rootNode.x
    viewState.value.panY = (rect.height / 2) - rootNode.y
    lastSelectedId.value = rootNode.id
  }
}

// --- WIRING --- //

const activeWireRaw = ref<{ fromId: string, current: Point } | null>(null)

function startWireDrag(node: Node) {
  activeWireRaw.value = { fromId: node.id, current: { x: node.x, y: node.y } }
}

function handlePickupInput(targetNode: Node) {
  // Find an existing connection to this node
  let connList = activeContextId.value && activeContextNode.value?.subGraph 
    ? activeContextNode.value.subGraph.connections 
    : rootConnections.value
    
  const connIndex = connList.findLastIndex(c => c.toId === targetNode.id)
  if (connIndex !== -1) {
    const conn = connList[connIndex]
    if (conn) {
      // Start "unplugged" drag from the parent
      activeWireRaw.value = { fromId: conn.fromId, current: { x: targetNode.x, y: targetNode.y } }
      // Remove it from the list
      connList.splice(connIndex, 1)
      cleanupLogicBundles()
      saveMatrixData()
    }
  } else {
    // Optional: Start a new connection from the left point if empty?
    // User said "click on the left point and starts dragging it creating a connection"
    // But since it's "passive", maybe we just do nothing if empty, 
    // OR it could be an "inverse" connection. For now, let's keep it simple.
  }
}

function handleCanvasMouseMove(e: MouseEvent) {
  const worldPos = screenToWorld(e.clientX, e.clientY)
  const worldX = worldPos.x
  const worldY = worldPos.y

  if (drawStart.value) {
    drawCurrent.value = { x: worldX, y: worldY }
    return
  }

  if (activeWireRaw.value) {
    activeWireRaw.value.current = { x: worldX, y: worldY }
    return
  }
}

function completeWireDrop(targetNode: Node) {
  if (!activeWireRaw.value) return
  if (activeWireRaw.value.fromId !== targetNode.id) {
    if (activeContextId.value && activeContextNode.value?.subGraph) {
      activeContextNode.value.subGraph.connections.push({ fromId: activeWireRaw.value.fromId, toId: targetNode.id })
    } else {
      rootConnections.value.push({ fromId: activeWireRaw.value.fromId, toId: targetNode.id })
    }
  }
  activeWireRaw.value = null
}

function handleCanvasMouseUp() { 
  if (drawStart.value && drawCurrent.value) {
    const x = Math.min(drawStart.value.x, drawCurrent.value.x)
    const y = Math.min(drawStart.value.y, drawCurrent.value.y)
    const w = Math.abs(drawStart.value.x - drawCurrent.value.x)
    const h = Math.abs(drawStart.value.y - drawCurrent.value.y)
    
    if (w > 10 && h > 10) {
      const newZone: Zone = {
        id: 'z' + Date.now().toString(36),
        type: selectedZoneType.value,
        x, y, width: w, height: h,
        label: selectedZoneType.value === 'session' ? 'SYDNEY' : `SECTOR_${selectedZoneType.value.toUpperCase()}`
      }
      zones.value = [...zones.value, newZone]
    }
  }
  
  drawStart.value = null
  drawCurrent.value = null
  isZoneToolActive.value = false
  activeWireRaw.value = null 
}

// --- ZONE INTERACTIONS --- //

function startZoneDrag(e: MouseEvent, zone: Zone) {
  const startX = e.clientX
  const startY = e.clientY
  const initialX = zone.x
  const initialY = zone.y
  
  // Identify nodes inside the zone at the start of the drag
  const capturedNodes = nodes.value.filter(node => {
     return node.x >= zone.x && 
            node.x <= zone.x + zone.width && 
            node.y >= zone.y && 
            node.y <= zone.y + zone.height
  })
  
  const nodeInitPos = capturedNodes.map(n => ({ id: n.id, x: n.x, y: n.y }))

  const move = (mE: MouseEvent) => {
    const dx = (mE.clientX - startX) / viewState.value.scale
    const dy = (mE.clientY - startY) / viewState.value.scale
    
    zone.x = initialX + dx
    zone.y = initialY + dy
    
    // Move contained nodes with the zone
    nodeInitPos.forEach(p => {
       const node = getNode(p.id)
       if (node) {
          node.x = p.x + dx
          node.y = p.y + dy
       }
    })
    
    forceUpdate()
  }
  const stop = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', stop)
    saveMatrixData()
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', stop)
}

function startZoneResize(e: MouseEvent, zone: Zone) {
  const startX = e.clientX
  const startY = e.clientY
  const initialW = zone.width
  const initialH = zone.height
  
  const move = (mE: MouseEvent) => {
    zone.width = Math.max(20, initialW + (mE.clientX - startX) / viewState.value.scale)
    zone.height = Math.max(20, initialH + (mE.clientY - startY) / viewState.value.scale)
    forceUpdate()
  }
  const stop = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', stop)
  }
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', stop)
}

const activeWire = computed(() => {
  if (!activeWireRaw.value) return null
  const from = getNode(activeWireRaw.value.fromId)
  if (!from) return null
  return { 
    from: { x: from.x + 62, y: from.y }, 
    to: activeWireRaw.value.current
  }
})

// --- PATH MATH --- //

function getMinChildX(fromId: string) {
  const from = getNode(fromId)
  if (!from) return 0
  const allLogicConns = connections.value.filter(c => c.fromId === fromId && c.bundleId)
  const allChildren = allLogicConns.map(c => getNode(c.toId)).filter(Boolean) as Node[]
  if (allChildren.length === 0) return from.x + 362
  
  return Math.min(...allChildren.map(n => {
    const radius = (n.type === 'scaling-entry' || n.type === 'step') ? 28 : 56
    const gap = (n.type === 'scaling-entry' || n.type === 'step') ? 2 : 6
    return n.x - (radius + gap)
  }))
}

function getMainStemPath(fromId: string) {
  const from = getNode(fromId)
  if (!from) return ""
  const fromRadius = (from.type === 'scaling-entry' || from.type === 'step') ? 28 : 56
  const fromGap = (from.type === 'scaling-entry' || from.type === 'step') ? 2 : 6
  const startX = from.x + (fromRadius + fromGap)
  
  const minChildX = getMinChildX(fromId)
  const totalDx = Math.max(0, minChildX - startX)
  const mainStemLen = Math.max(120, totalDx * 0.25)
  
  return `M ${startX} ${from.y} L ${startX + mainStemLen} ${from.y}`
}

function getBundleStemPath(fromId: string, bundleId: string) {
  const from = getNode(fromId)
  if (!from) return ""
  const refConn = connections.value.find(c => c.fromId === fromId && c.bundleId === bundleId)
  if (!refConn) return ""

  const fromRadius = (from.type === 'scaling-entry' || from.type === 'step') ? 28 : 56
  const fromGap = (from.type === 'scaling-entry' || from.type === 'step') ? 2 : 6
  const startX = from.x + (fromRadius + fromGap)
  
  const minChildX = getMinChildX(fromId)
  const totalDx = Math.max(0, minChildX - startX)
  const mainStemLen = Math.max(120, totalDx * 0.25)
  const bundleStemLen = Math.max(160, totalDx * 0.35) + (refConn.bundleStemX || 0)
  
  const parentBundles = [...new Set(connections.value.filter(c => c.fromId === fromId && c.bundleId).map(c => c.bundleId))]
  const bundleIndex = parentBundles.indexOf(bundleId)
  const totalBundles = parentBundles.length
  const verticalSpread = 100
  const bundleYOffset = (totalBundles > 1 ? (bundleIndex - (totalBundles - 1) / 2) * verticalSpread : 0) + (refConn.bundleStemY || 0)
  
  const j1x = startX + mainStemLen
  const j2x = j1x + bundleStemLen
  const j2y = from.y + bundleYOffset
  
  const dx2 = j2x - j1x
  const cp1 = { x: j1x + dx2 * 0.5, y: from.y }
  const cp2 = { x: j1x + dx2 * 0.5, y: j2y }
  
  return `M ${j1x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${j2x} ${j2y}`
}

function getBranchPath(line: Connection) {
  const from = getNode(line.fromId)
  const to = getNode(line.toId)
  if (!from || !to) return ""
  const fromRadius = (from.type === 'scaling-entry' || from.type === 'step') ? 28 : 56
  const fromGap = (from.type === 'scaling-entry' || from.type === 'step') ? 2 : 6
  const startX = from.x + (fromRadius + fromGap)
  
  const minChildX = getMinChildX(line.fromId)
  const totalDx = Math.max(0, minChildX - startX)
  const mainStemLen = Math.max(120, totalDx * 0.25)
  const bundleStemLen = Math.max(160, totalDx * 0.35) + (line.bundleStemX || 0)
  
  const parentBundles = [...new Set(connections.value.filter(c => c.fromId === from.id && c.bundleId).map(c => c.bundleId))]
  const bundleIndex = parentBundles.indexOf(line.bundleId!)
  const totalBundles = parentBundles.length
  const verticalSpread = 100
  const bundleYOffset = (totalBundles > 1 ? (bundleIndex - (totalBundles - 1) / 2) * verticalSpread : 0) + (line.bundleStemY || 0)
  
  const j2x = startX + mainStemLen + bundleStemLen
  const j2y = from.y + bundleYOffset
  
  const toRadius = (to.type === 'scaling-entry' || to.type === 'step') ? 28 : 56
  const toGap = (to.type === 'scaling-entry' || to.type === 'step') ? 2 : 6
  const endPoint = { x: to.x - (toRadius + toGap), y: to.y }
  
  const dx3 = endPoint.x - j2x
  const cp3 = { x: j2x + dx3 * 0.5, y: j2y }
  const cp4 = { x: j2x + dx3 * 0.5, y: endPoint.y }
  
  return `M ${j2x} ${j2y} C ${cp3.x} ${cp3.y}, ${cp4.x} ${cp4.y}, ${endPoint.x} ${endPoint.y}`
}

function createRootPath(fromId: string, toId: string) {
  const from = getNode(fromId)
  const to = getNode(toId)
  if (!from || !to) return ""
  
  const conn = connections.value.find(c => c.fromId === fromId && c.toId === toId)
  
  const fromRadius = (from.type === 'scaling-entry' || from.type === 'step') ? 28 : 56
  const toRadius = (to.type === 'scaling-entry' || to.type === 'step') ? 28 : 56
  const fromGap = (from.type === 'scaling-entry' || from.type === 'step') ? 2 : 6
  const toGap = (to.type === 'scaling-entry' || to.type === 'step') ? 2 : 6

  const startPoint = { x: from.x + (fromRadius + fromGap), y: from.y }
  const endPoint = { x: to.x - (toRadius + toGap), y: to.y }

  if (conn?.bundleId) {
     const parentBundles = [...new Set(connections.value.filter(c => c.fromId === fromId && c.bundleId).map(c => c.bundleId))]
     const bundleIndex = parentBundles.indexOf(conn.bundleId)
     const totalBundles = parentBundles.length
     
     // DYNAMIC STEM CALCULATION
     const minChildX = getMinChildX(fromId)
     const totalDx = Math.max(0, minChildX - startPoint.x)
     
     // Stems scale with distance, with a robust minimum
     const mainStemLen = Math.max(120, totalDx * 0.25)
     const bundleStemLen = Math.max(160, totalDx * 0.35) + (conn.bundleStemX || 0)
     
     const verticalSpread = 100
     const bundleYOffset = (totalBundles > 1 ? (bundleIndex - (totalBundles - 1) / 2) * verticalSpread : 0) + (conn.bundleStemY || 0)
     
     return createDoubleForkPath(startPoint, endPoint, mainStemLen, bundleStemLen, startPoint.y + bundleYOffset)
  }

  return createCurvedPath(startPoint, endPoint)
}

function createDoubleForkPath(f: Point, t: Point, mainStemLen: number, bundleStemLen: number, bundleY: number) {
  const j1x = f.x + mainStemLen
  const j1y = f.y
  
  const j2x = j1x + bundleStemLen
  const j2y = bundleY
  
  // Segment 1: Main stem (Horizontal)
  const segment1 = `M ${f.x} ${f.y} L ${j1x} ${j1y}`
  
  // Segment 2: Bundle stem (Curved from main junction to bundle Y level)
  const dx2 = j2x - j1x
  const cp1 = { x: j1x + dx2 * 0.5, y: j1y }
  const cp2 = { x: j1x + dx2 * 0.5, y: j2y }
  const segment2 = `C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${j2x} ${j2y}`
  
  // Segment 3: Branch to child (Curved from bundle junction to child Y level)
  const dx3 = t.x - j2x
  const cp3 = { x: j2x + dx3 * 0.5, y: j2y }
  const cp4 = { x: j2x + dx3 * 0.5, y: t.y }
  const segment3 = `C ${cp3.x} ${cp3.y}, ${cp4.x} ${cp4.y}, ${t.x} ${t.y}`
  
  return `${segment1} ${segment2} ${segment3}`
}

function createForkPath(f: Point, t: Point, stemLength: number) {
  const junctionX = f.x + stemLength
  const dx = t.x - junctionX
  const cp1 = { x: junctionX + dx * 0.5, y: f.y }
  const cp2 = { x: junctionX + dx * 0.5, y: t.y }
  return `M ${f.x} ${f.y} L ${junctionX} ${f.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${t.x} ${t.y}`
}

function createCurvedPath(f: Point, t: Point) {
  const dx = t.x - f.x
  const cp1 = { x: f.x + dx * 0.5, y: f.y }
  const cp2 = { x: f.x + dx * 0.5, y: t.y }
  return `M ${f.x} ${f.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${t.x} ${t.y}`
}

defineProps<{ activeTab: string, isDark?: boolean }>()
defineEmits(['exit', 'back'])
</script>

<style scoped>
.matrix-tree {
  image-rendering: -webkit-optimize-contrast;
  -webkit-font-smoothing: subpixel-antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: geometricPrecision;
}

.animate-draw {
  stroke-dasharray: 5000;
  stroke-dashoffset: 5000;
  animation: draw 4s ease-in-out infinite alternate;
}

.nier-conn-path {
  stroke: #505050; /* Solid color equivalent to white/30 on dark background */
  transition: stroke 0.3s ease;
}

.nier-conn-neon {
  stroke: #ffffff !important;
  filter: url(#matrixGlow);
  stroke-width: 1.5px !important;
}

html:not(.dark) .nier-conn-neon {
  stroke: #000000 !important;
}

.group\/line:hover .nier-conn-path {
  stroke: #9b9b9b; /* Solid color equivalent to white/60 on dark background */
}

html:not(.dark) .nier-conn-path {
  stroke: #d0d0d0; /* Solid grey for light mode */
}

html:not(.dark) .group\/line:hover .nier-conn-path {
  stroke: #a0a0a0;
}

@keyframes draw {
  0% { stroke-dashoffset: 5000; }
  100% { stroke-dashoffset: 0; }
}

.hud-pop-enter-active, .hud-pop-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.hud-pop-enter-from { opacity: 0; transform: translateY(20px); }
.hud-pop-leave-to { opacity: 0; transform: translateY(20px); }

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-leave-active {
  position: absolute;
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@keyframes scan {
  from { transform: translateY(-100%); }
  to { transform: translateY(200%); }
}

.animate-scan {
  animation: scan 4s linear infinite;
}

/* Slide-down transition for the config warning banner */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-200%);
}
.slide-down-enter-to, .slide-down-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

@keyframes config-banner-pulse {
  0%, 100% { box-shadow: 0 8px 30px rgba(239, 68, 68, 0.25); }
  50%       { box-shadow: 0 8px 50px rgba(239, 68, 68, 0.55); }
}

.tactical-corners::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: 
    linear-gradient(to right, white 2px, transparent 2px) 0 0,
    linear-gradient(to bottom, white 2px, transparent 2px) 0 0,
    linear-gradient(to left, white 2px, transparent 2px) 100% 0,
    linear-gradient(to bottom, white 2px, transparent 2px) 100% 0,
    linear-gradient(to right, white 2px, transparent 2px) 0 100%,
    linear-gradient(to top, white 2px, transparent 2px) 0 100%,
    linear-gradient(to left, white 2px, transparent 2px) 100% 100%,
    linear-gradient(to top, white 2px, transparent 2px) 100% 100%;
  background-repeat: no-repeat;
  background-size: 12px 12px;
  pointer-events: none;
}
</style>
