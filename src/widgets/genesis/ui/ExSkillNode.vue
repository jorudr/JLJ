<template>
  <div class="skill-chip absolute cursor-pointer group pointer-events-auto" 
       :style="{ 
         left: (node.x) + 'px', 
         top: (node.y) + 'px',
         zIndex: isSelected ? 1000 : 1,
         width: node.type === 'image' ? (node.params?.width || 300) + 'px' : (isScenarioPanel ? (node.params?.width || scenarioPanelSize.width) + 'px' : (node.type === 'scaling-entry' || node.type === 'step' ? '56px' : '112px')),
         height: node.type === 'image' ? (node.params?.height || 200) + 'px' : (isScenarioPanel ? (node.params?.height || scenarioPanelSize.height) + 'px' : (node.type === 'scaling-entry' || node.type === 'step' ? '56px' : '112px'))
       }"
       @mousedown.stop="startDrag"
       @contextmenu.prevent="$emit('contextmenu', { x: $event.clientX, y: $event.clientY, nodeId: node.id })">
    
     <!-- NIER STYLE SKILL CHIP (Reified with Design System) -->
     <ExNTtooltip :title="node.type.toUpperCase()" class="w-full h-full">
       <template #trigger>
           <div class="relative w-full h-full border-[2px] backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-500"
                :class="[
                  (node.type === 'step' || node.type === 'scaling-entry') ? 'rounded-full bg-nier-text-light dark:bg-nier-text-dark' : 'bg-nier-white/10 dark:bg-nier-black/10',
                  node.type === 'placeholder' ? 'border-dashed border-[1px] opacity-80 bg-transparent' : '',
                  node.params?.needsConfig ? 'needs-config-pulse !bg-red-500/10' :
                    isSelected ? (node.type === 'risk-element' ? 'border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.3)]' : 'border-nier-text-light dark:border-nier-text-dark shadow-[0_0_60px_rgba(44,44,42,0.3)] dark:shadow-[0_0_60px_rgba(255,255,255,0.3)]') : (node.type === 'risk-element' ? 'border-red-500/40 group-hover:border-red-500' : 'border-nier-border-light dark:border-nier-border-dark group-hover:border-nier-text-light dark:group-hover:border-nier-text-dark group-hover:shadow-[0_0_60px_rgba(44,44,42,0.2)] dark:group-hover:shadow-[0_0_60px_rgba(255,255,255,0.2)]'),
                  node.type === 'image' ? 'border-none !bg-transparent shadow-none' : '',
                  node.params?.direction === 'LONG' ? '!bg-green-500/50' : '',
                  node.params?.direction === 'SHORT' ? '!bg-red-500/50' : '',
                  node.type === 'risk-element' ? '!bg-red-500/5' : ''
                ]"
                :style="node.params?.needsConfig ? {} : (displayColor ? { borderColor: displayColor, boxShadow: isSelected ? `0 0 60px ${displayColor}40` : `0 0 30px ${displayColor}20` } : {})"
                @dblclick.stop="$emit('doubleclick')">
           
           <!-- Selection Brackets -->
            <div v-if="isSelected" class="absolute -inset-4 pointer-events-none">
               <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-nier-text-light dark:border-nier-text-dark animate-pulse"></div>
               <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-nier-text-light dark:border-nier-text-dark animate-pulse"></div>
               <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-nier-text-light dark:border-nier-text-dark animate-pulse"></div>
               <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-nier-text-light dark:border-nier-text-dark animate-pulse"></div>
            </div>
           
           <!-- Skill Icon / Label / Image Content -->
           <div v-if="node.type === 'instrument' || ['indicator', 'pattern', 'smc', 'emotion-state', 'step', 'scaling-entry', 'risk-element'].includes(node.type)" 
                class="w-full h-full flex items-center justify-center overflow-hidden relative"
                :class="(node.type === 'step' || node.type === 'scaling-entry') ? 'p-0' : 'p-[15%]'">
              <img v-if="node.type === 'instrument' && node.params?.logo && !imageError" 
                   :src="node.params.logo" 
                   @error="imageError = true"
                   draggable="false"
                   class="w-full h-full object-contain opacity-100 grayscale transition-all duration-700 select-none pointer-events-none"
                   style="image-rendering: -webkit-optimize-contrast; transform: translateZ(0); will-change: transform, opacity;"
                   :class="{ 'opacity-100 grayscale-0': isSelected }" />
              <div v-else class="font-mono transition-all tracking-tighter text-center"
                    :class="[
                      (node.type === 'step' || node.type === 'scaling-entry') ? 'text-nier-white dark:text-nier-black opacity-100 font-light' : 'text-nier-text-light dark:text-nier-text-dark opacity-100 font-black',
                      isSelected ? 'opacity-100' : '',
                      node.type === 'emotion-state' ? 'text-[36px]' : 
                       (node.type === 'scaling-entry' || node.type === 'step') ? (node.label && node.label.length > 3 ? 'text-[12px]' : 'text-[24px]') :
                       'text-[24px]'
                    ]"
                    :style="displayColor ? { color: displayColor } : (node.type === 'risk-element' ? { color: '#ef4444' } : {})">
                {{ 
                   node.type === 'emotion-state' ? (node.label || 'EN').slice(0, 2).toUpperCase() : 
                   (node.type === 'step' || node.type === 'scaling-entry') ? (node.label || '') : 
                   node.type === 'risk-element' ? (node.params?.riskType === 'trade' ? 'RT' : node.params?.riskType === 'day' ? 'RD' : node.params?.riskType === 'style' ? (node.label || 'ST').slice(0, 2).toUpperCase() : 'RR') :
                   (node.label || 'NOD').slice(0, 3).toUpperCase() 
                }}
              </div>
           </div>

           <!-- Image Content Rendering -->
            <div v-if="node.type === 'image'" class="w-full h-full relative group/img overflow-visible">
               <div v-if="!node.params?.imageUrl" class="w-full h-full border-2 border-dashed border-nier-border-light dark:border-nier-border-dark flex flex-col items-center justify-center bg-nier-white/40 dark:bg-nier-black/40">
                  <div class="w-8 h-8 border border-nier-border-light dark:border-nier-border-dark mb-4 animate-pulse rotate-45 flex items-center justify-center">
                     <div class="w-2 h-2 bg-nier-text-light dark:bg-nier-text-dark"></div>
                  </div>
                  <ExText variant="telemetry" class="opacity-40">Awaiting_Visual_Protocol</ExText>
               </div>
                            <div v-else class="w-full h-full border-2 border-nier-border-light dark:border-nier-border-dark p-1 bg-nier-white dark:bg-nier-black relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                 <img :src="node.params.imageUrl" 
                      class="w-full h-full object-contain opacity-100 transition-all duration-700 select-none pointer-events-none"
                      style="image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges; transform: translateZ(0); will-change: transform, opacity;" />
                                  <!-- Scanning Lines overlay -->
                  <div class="absolute inset-0 pointer-events-none bg-scan-line opacity-5"></div>
                  <div class="absolute inset-0 border border-nier-text-light/5 dark:border-nier-text-dark/5 pointer-events-none"></div>

                  <!-- Mini Corners -->
                  <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-nier-text-light dark:border-nier-text-dark"></div>
                  <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-nier-text-light dark:border-nier-text-dark"></div>
               </div>

               <!-- Resize Handle -->
               <div class="absolute -bottom-3 -right-3 w-8 h-8 cursor-nwse-resize flex items-center justify-center group-hover/img:opacity-100 opacity-0 transition-opacity z-50 pointer-events-auto"
                    @mousedown.stop.prevent="startResize">
                  <div class="w-3 h-3 border-b-2 border-r-2 border-nier-text-light dark:border-nier-text-dark"></div>
               </div>
                            <!-- Outer floating frames -->
               <div class="absolute -inset-2 border border-nier-border-light dark:border-nier-border-dark opacity-50 pointer-events-none"></div>
               <div class="absolute -inset-4 border border-nier-border-light dark:border-nier-border-dark opacity-20 pointer-events-none"></div>
            </div>

           <!-- Scenario documentation panels -->
            <div v-if="isScenarioPanel"
                 class="w-full h-full flex flex-col bg-nier-white/70 dark:bg-nier-black/70 overflow-hidden">
               <div class="flex items-center justify-between px-3 py-2 border-b border-nier-border-light dark:border-nier-border-dark bg-nier-text-light/[0.03] dark:bg-nier-text-dark/[0.03]">
                  <span class="text-[8px] font-mono tracking-[0.35em] uppercase font-black opacity-60">{{ node.params?.menuLabel || node.label }}</span>
                  <span class="text-[8px] font-mono tracking-widest uppercase opacity-30">{{ node.params?.shortCode || node.type.slice(0, 3) }}</span>
               </div>

               <div v-if="isVisualScenarioPanel"
                    class="relative flex-1 m-3 border border-dashed border-nier-border-light dark:border-nier-border-dark bg-[linear-gradient(90deg,currentColor_1px,transparent_1px),linear-gradient(currentColor_1px,transparent_1px)] bg-[size:20px_20px] text-nier-text-light/10 dark:text-nier-text-dark/10 cursor-crosshair overflow-hidden"
                    @mousedown.stop.prevent="startScenarioDrawing"
                    @mousemove.stop.prevent="moveScenarioDrawing"
                    @mouseup.stop.prevent="finishScenarioDrawing"
                    @mouseleave.stop.prevent="finishScenarioDrawing">
                  <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                     <polyline v-for="stroke in node.params?.strokes || []"
                               :key="stroke.id"
                               :points="formatScenarioStroke(stroke)"
                               fill="none"
                               stroke="currentColor"
                               stroke-width="1.4"
                               stroke-linecap="round"
                               stroke-linejoin="round"
                               class="text-nier-text-light dark:text-nier-text-dark opacity-70" />
                  </svg>
                  <div v-if="!node.params?.strokes?.length" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <span class="text-[9px] font-mono tracking-[0.28em] uppercase text-nier-text-light/35 dark:text-nier-text-dark/35">{{ node.params?.protocol || 'VISUAL_PANEL' }}</span>
                  </div>
                  <div class="absolute top-2 left-2 w-6 h-6 border-t border-l border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                  <div class="absolute bottom-2 right-2 w-6 h-6 border-b border-r border-nier-text-light dark:border-nier-text-dark opacity-20"></div>
                  <button v-if="node.params?.strokes?.length"
                          @mousedown.stop
                          @click.stop="node.params.strokes = []"
                          class="absolute right-2 top-2 px-2 py-1 border border-nier-border-light dark:border-nier-border-dark bg-nier-white/80 dark:bg-nier-black/80 text-[7px] font-mono tracking-widest uppercase text-nier-text-light dark:text-nier-text-dark opacity-0 group-hover:opacity-80 hover:opacity-100 transition-opacity">
                     CLR
                  </button>
               </div>

               <textarea v-else
                         v-model="node.params.value"
                         @mousedown.stop
                         @click.stop
                         placeholder="ENTER_SCENARIO_DETAILS..."
                         class="flex-1 w-full min-h-0 resize-none bg-transparent px-3 py-2 text-[10px] leading-relaxed font-mono uppercase tracking-wide text-nier-text-light dark:text-nier-text-dark outline-none custom-scrollbar"></textarea>
            </div>

           <!-- Connection Points -->
            <div v-if="!node.isRoot" @mousedown.stop="$emit('pickup-input', node)" @mouseup.stop="$emit('drop', node)" 
                 @dblclick.stop="$emit('clear-input', node)"
                 :class="[
                   isClosest ? 'opacity-100 scale-125' : 'opacity-0 group-hover:opacity-100'
                 ]"
                 class="absolute top-1/2 -translate-y-1/2 w-[12px] h-[12px] -left-[6px] border-[2px] border-nier-text-light dark:border-nier-text-dark rotate-45 bg-nier-white dark:bg-nier-black transition-all shadow-[0_0_20px_rgba(44,44,42,0.3)] dark:shadow-[0_0_20px_rgba(255,255,255,0.3)]"></div>
            <div @mousedown.stop="$emit('start-output', node)" 
                 @dblclick.stop="$emit('clear-output', node)"
                 class="absolute top-1/2 -translate-y-1/2 w-[12px] h-[12px] -right-[6px] border-[2px] border-nier-text-light dark:border-nier-text-dark rotate-45 bg-nier-white dark:bg-nier-black opacity-0 group-hover:opacity-100 transition-all hover:bg-nier-text-light dark:hover:bg-nier-text-dark shadow-[0_0_20px_rgba(44,44,42,0.3)] dark:shadow-[0_0_20px_rgba(255,255,255,0.3)]"></div>
            
            <!-- Hover Fill -->
            <div class="absolute inset-x-0 bottom-0 bg-nier-text-light/10 dark:bg-nier-text-dark/10 h-0 group-hover:h-full transition-all duration-700 -z-10"></div>
           

            <!-- Placeholder / Empty Cell -->
            <div v-if="node.type === 'placeholder'" class="flex items-center justify-center">
               <div class="w-3 h-3 bg-nier-text-light dark:bg-nier-text-dark rotate-45"></div>
            </div>

           <!-- Default SVGs for other types -->
           <svg v-if="!isScenarioPanel && !['placeholder', 'risk-element', 'scaling-entry', 'step', 'instrument', 'indicator', 'pattern', 'smc', 'emotion-state', 'image'].includes(node.type)"
               class="w-[60%] h-[60%] opacity-60 group-hover:opacity-100 transition-opacity text-nier-text-light dark:text-nier-text-dark" 
               :class="{ 'opacity-100': isSelected }"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path v-if="node.type === 'strategy'" d="M12 4L20 18H4L12 4z" />
            <template v-else-if="node.type === 'scenario'">
              <rect v-if="!node.params?.phase || node.params.phase === 'NONE'" key="scenario-none" x="3" y="3" width="18" height="18" />
              <path v-else-if="node.params.phase === 'ENTRY'" key="scenario-entry" d="M12 5v14M19 12l-7 7-7-7" />
              <path v-else-if="node.params.phase === 'EXIT'" key="scenario-exit" d="M12 19V5M5 12l7-7 7 7" />
            </template>
            <circle v-else-if="node.type === 'condition'" cx="12" cy="12" r="9" />
            <path v-else-if="node.type === 'emotion'" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            <g v-else-if="node.type === 'risk'">
               <path d="M12 5v8M12 18v0.01" stroke-width="2.5" stroke-linecap="round" />
            </g>
            <path v-else-if="node.type === 'pyramiding'" d="M21 21H3M18 17H6M15 13H9M12 9V3" />
            <g v-else-if="node.type === 'averaging'">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
            </g>
            <path v-else d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
         </div>
       </template>
        <div class="flex flex-col space-y-2 p-1">
          <div v-if="node.params?.description || node.params?.value || node.type === 'scaling-entry'">
            <p class="text-[11px] leading-relaxed text-nier-text-light dark:text-nier-text-dark font-bold uppercase tracking-wide">
              <template v-if="node.type === 'scaling-entry'">
                 SCALING_PROTOCOL: {{ node.params.lots }} LOTS @ {{ node.params.step === 0 && node.params.unit === '$' ? 'ENTRY_PRICE' : `${node.params.step > 0 ? '+' : ''}${node.params.step}${node.params.unit}` }}
              </template>
              <template v-else>
                {{ node.params.description || node.params.value }}
              </template>
            </p>
          </div>
         <div class="flex items-center space-x-4 opacity-40 text-[8px] font-mono">
           <span>TYPE: {{ node.type.toUpperCase() }}</span>
           <span v-if="node.type === 'condition'">PRIORITY: {{ node.params?.priority || 'NONE' }}</span>
           <span>STATUS: {{ node.params?.needsConfig ? 'AWAITING_REIFICATION' : 'REIFIED' }}</span>
         </div>
       </div>
     </ExNTtooltip>

      <!-- MERGE BUTTON -->
      <div v-if="node.params?.canMerge" 
           class="absolute top-full left-1/2 -translate-x-1/2 mt-4 pointer-events-auto z-[2000]">
        <button @click.stop="$emit('merge', node.params.isIndicatorSide ? { fromId: node.id, toId: node.params.mergePartnerId } : { fromId: node.params.mergePartnerId, toId: node.id })"
                class="bg-nier-white dark:bg-nier-black border border-nier-text-light dark:border-nier-text-dark px-8 py-3 text-[10px] font-mono tracking-[0.3em] uppercase font-black hover:bg-nier-text-light dark:hover:bg-nier-text-dark hover:text-nier-white dark:hover:text-nier-black transition-all shadow-xl whitespace-nowrap">
          MERGE_PROTOCOL
        </button>
      </div>



      <!-- Scaling Entry Subtitle -->
       <div v-if="node.type === 'scaling-entry'" 
            class="absolute top-full left-1/2 -translate-x-1/2 mt-4 flex flex-col items-center pointer-events-none z-50">
         <div class="px-5 py-3 bg-nier-white dark:bg-nier-black border-[1.5px] border-nier-border-light dark:border-nier-border-dark flex flex-col items-center space-y-1 min-w-[130px] shadow-[0_15px_35px_rgba(0,0,0,0.4)] relative">
            <div class="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-nier-text-light dark:border-nier-text-dark opacity-40"></div>
            <div class="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-nier-text-light dark:border-nier-text-dark opacity-40"></div>
            
            <span class="text-[14px] font-mono font-black tracking-[0.1em] text-nier-text-light dark:text-nier-text-dark uppercase leading-none">{{ node.params.lots }} LOTS</span>
            <div class="w-full h-px bg-nier-border-light dark:bg-nier-border-dark opacity-20"></div>
            <span class="text-[12px] font-mono font-bold tracking-tight text-nier-text-light dark:text-nier-text-dark/60 uppercase leading-none">{{ node.params.step === 0 && node.params.unit === '$' ? 'ENTRY_PRICE' : `${node.params.step > 0 ? '+' : ''}${node.params.step}${node.params.unit}` }}</span>
         </div>
      </div>

      <!-- Risk Element Overlay -->
      <div v-if="node.type === 'risk-element' && node.params" 
           class="absolute top-full left-1/2 -translate-x-1/2 mt-3 flex flex-col items-center pointer-events-none min-w-max">
         <!-- Connector Line -->
         <div class="w-0.5 h-3 bg-red-500/40"></div>
         <div class="px-5 py-2 bg-red-500/10 border-2 border-red-500/40 backdrop-blur-md flex items-center shadow-[0_10px_30px_rgba(239,68,68,0.25)] relative overflow-hidden">
            <!-- Glitch Scanning Line -->
            <div class="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent h-1/2 animate-scan pointer-events-none"></div>
            <ExText variant="telemetry" class="!text-red-500 !opacity-100 font-black tracking-[0.2em] whitespace-nowrap !text-[12px]">{{ node.label }}</ExText>
            
            <!-- Technical corner accents -->
            <div class="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-500"></div>
            <div class="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-500"></div>
         </div>
      </div>

     <!-- Custom Identity Label -->
      <div v-if="['condition', 'scenario', 'strategy'].includes(node.type) && (node.params?.customName || node.params?.isEditingName)"
           class="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex flex-col items-center z-50">
       <!-- Editing Mode -->
       <div v-if="node.params?.isEditingName" class="min-w-full w-max pointer-events-auto relative">
          <ExInput 
            variant="terminal"
            :modelValue="node.params.customName"
            @update:modelValue="node.params.customName = $event.toUpperCase()"
            @blur="node.params.isEditingName = false"
            @keyup.enter="node.params.isEditingName = false"
            v-autofocus
            placeholder="ENTER_ID..."
            class="bg-nier-white dark:bg-nier-black"
          />
       </div>
        <!-- Display Mode -->
        <div v-else-if="node.params?.customName" 
             class="min-w-full w-max bg-nier-white dark:bg-nier-black border border-nier-border-light dark:border-nier-border-dark shadow-[0_5px_15px_rgba(0,0,0,0.5)] pointer-events-none relative text-center px-4 py-1.5 flex flex-col items-center">
           <ExText variant="telemetry" class="!opacity-100 font-black">{{ node.params.customName }}</ExText>
           <!-- Mini Corners -->
           <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-nier-border-light dark:border-nier-border-dark"></div>
           <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-nier-border-light dark:border-nier-border-dark"></div>
        </div>
     </div>

      <!-- Emotion State Label -->
       <div v-if="node.type === 'emotion-state' && node.label"
            class="absolute top-full left-1/2 -translate-x-1/2 mt-2 flex flex-col items-center z-50">
         <div class="min-w-full w-max bg-nier-text-light dark:bg-nier-text-dark border border-nier-white dark:border-nier-black shadow-[0_5px_15px_rgba(0,0,0,0.3)] pointer-events-none relative text-center px-4 py-1.5 flex flex-col items-center">
            <ExText variant="telemetry" class="!text-nier-white dark:!text-nier-black !opacity-100 font-black">{{ node.label }}</ExText>
            <!-- Mini Corners -->
            <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-nier-white/40 dark:border-nier-black/40"></div>
            <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-nier-white/40 dark:border-nier-black/40"></div>
         </div>
       </div>

      <!-- Priority Label -->
      <div v-if="node.type === 'condition' && node.params?.priority && node.params.priority !== 'NONE'"
           class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col items-center z-50 min-w-max">
         <div class="min-w-full w-max bg-nier-white dark:bg-nier-black border border-nier-border-light dark:border-nier-border-dark shadow-[0_5px_15px_rgba(0,0,0,0.5)] pointer-events-none relative text-center px-4 py-1 flex flex-col items-center"
              :class="node.params.priority === 'REQUIRED' ? 'border-t-2 !border-t-red-500/60' : 'border-t-2 !border-t-blue-500/60'">
            <ExText variant="telemetry" class="!opacity-100 font-black tracking-widest text-[10px]"
                    :class="node.params.priority === 'REQUIRED' ? '!text-red-500 dark:!text-red-400' : '!text-blue-500 dark:!text-blue-400'">
               {{ node.params.priority }}
            </ExText>
            <!-- Mini Corners -->
            <div class="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-nier-border-light dark:border-nier-border-dark"></div>
            <div class="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-nier-border-light dark:border-nier-border-dark"></div>
         </div>
      </div>



    <!-- TACTICAL COMMENTS -->
    <div v-if="isSelected && node.params?.comments?.length" 
         class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[500]"
         style="width: 2000px; height: 2000px;">
       
       <svg class="absolute inset-0 w-full h-full overflow-visible opacity-60">
          <g v-for="comment in node.params.comments" :key="'path-'+comment.id">
             <path :d="(() => {
               const origin = getEdgeOrigin(1000, 1000, 1000 + comment.x/2, 1000 + comment.y/2, node.type === 'step');
               return `M ${origin.x} ${origin.y} L ${1000 + comment.x/2} ${1000 + comment.y/2} L ${1000 + comment.x} ${1000 + comment.y}`;
             })()" 
                   fill="none" stroke="currentColor" stroke-width="2" class="text-nier-text-light dark:text-nier-text-dark" />
          </g>
       </svg>

        <div v-for="(comment, idx) in node.params.comments" :key="comment.id"
             class="absolute pointer-events-auto"
             :style="{
               left: (1000 + comment.x) + 'px',
               top: (1000 + comment.y) + 'px',
               zIndex: 1000 + Number(idx)
             }"
             @mousedown.stop="startCommentDrag($event, comment)"
             @click.stop>
          
          <Transition name="callout-pop" appear>
            <div class="bg-nier-white dark:bg-nier-black border border-nier-border-light dark:border-nier-border-dark relative group flex flex-col overflow-hidden"
                 :style="{
                    width: (comment.width || 450) + 'px',
                    height: comment.isEditing ? 'auto' : (comment.height || 280) + 'px',
                    minWidth: '450px',
                    minHeight: '280px'
                 }">
               
               <!-- ExPanel Corners -->
               <div class="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-nier-text-light dark:border-nier-text-dark opacity-30 pointer-events-none"></div>
               <div class="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-nier-text-light dark:border-nier-text-dark opacity-30 pointer-events-none"></div>

               <!-- Tactical Header -->
               <div class="flex-shrink-0 flex items-center justify-between bg-nier-black dark:bg-nier-white text-nier-white dark:text-nier-black px-4 py-2 cursor-move border-b border-nier-white/10">
                  <div class="flex items-center space-x-3">
                     <span class="text-[13px] font-black tracking-[0.4em] uppercase font-sans">Comment {{ Number(idx) + 1 }}</span>
                  </div>
                  <button @click.stop="removeComment(comment.id)" 
                          class="hover:scale-125 transition-transform p-1">
                     <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 1 L9 9 M9 1 L1 9" />
                     </svg>
                  </button>
               </div>

               <!-- Content Region -->
               <div class="flex-1 flex flex-col overflow-hidden">
                  <!-- Editing State -->
                  <div v-if="comment.isEditing" class="flex-1 p-6">
                     <textarea v-model="comment.text" 
                               @blur="comment.isEditing = false"
                               @keyup.enter.shift="comment.isEditing = false"
                               @input="adjustTextareaHeight($event)"
                               v-autofocus
                               placeholder="ENTRY_DATA_REQUIRED..."
                               class="w-full bg-transparent text-nier-text-light dark:text-nier-text-dark font-mono text-[22px] outline-none resize-none uppercase tracking-wide leading-relaxed p-0 overflow-hidden"
                               style="height: auto; min-height: 180px;"></textarea>
                  </div>
                  
                  <!-- Display State -->
                  <div v-else @click="comment.isEditing = true" 
                       class="flex-1 p-6 overflow-y-auto custom-scrollbar cursor-pointer">
                     <p class="text-[22px] font-mono text-nier-text-light dark:text-nier-text-dark uppercase tracking-wide whitespace-pre-wrap leading-relaxed">
                        {{ comment.text || '[ NO_DATA_AVAILABLE ]' }}
                     </p>
                  </div>

               </div>

               <!-- High-Visibility Resize Handle -->
               <div class="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize z-20 group-hover:opacity-100 opacity-0 transition-opacity flex items-end justify-end p-1.5"
                    @mousedown.stop="startCommentResize($event, comment)">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="text-nier-black dark:text-nier-white">
                     <path d="M16 0 L0 16 M16 8 L8 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"/>
                  </svg>
               </div>
            </div>
          </Transition>
       </div>
    </div>

    <!-- TACTICAL REMEDY CALLOUTS -->
    <div v-if="isSelected && node.type === 'emotion-state' && node.params?.remedies?.length" 
         class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[100]"
         style="width: 1200px; height: 1000px;">
       
       <svg class="absolute inset-0 w-full h-full overflow-visible opacity-30">
          <defs>
             <filter id="pointerGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                   <feMergeNode in="blur" />
                   <feMergeNode in="SourceGraphic" />
                </feMerge>
             </filter>
          </defs>
           <g v-for="(remedy, idx) in (node.params.remedies as string[]).slice(0, 4)" :key="'path-'+idx">
              <path :d="getRemedyPath(idx)" fill="none" stroke="currentColor" stroke-width="1.5" filter="url(#pointerGlow)" class="text-nier-text-light dark:text-nier-text-dark" />
           </g>
       </svg>

        <div v-for="(remedy, idx) in (node.params.remedies as string[]).slice(0, 4)" :key="remedy"
            class="absolute transition-all duration-300"
            :style="{
              top: getRemedyCoords(idx).styleTop + 'px',
              left: getRemedyCoords(idx).styleLeft + 'px',
              '--delay': `${idx * 150}ms`
            }">
          
          <Transition name="callout-pop" appear>
            <ExNTtooltip :title="'ANALYTICS_V.0' + (idx + 1)">
              <template #trigger>
                <ExPanel :title="'FIX_PROTOCOL_0' + (idx + 1)" class="min-w-[320px]">
                   <!-- Scanning Effect -->
                   <div class="absolute inset-0 bg-nier-text-light/5 dark:bg-nier-text-dark/5 opacity-5 animate-pulse"></div>
                   
                   <ExText variant="body" class="!text-nier-text-light dark:!text-nier-text-dark font-bold tracking-[0.1em] uppercase leading-tight">{{ remedy }}</ExText>

                   <div class="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col space-y-1 opacity-20">
                      <div v-for="i in 4" :key="i" class="w-1 h-1 bg-nier-text-light dark:bg-nier-text-dark"></div>
                   </div>
                </ExPanel>
              </template>
              <div class="flex flex-col space-y-2">
                 <div class="flex items-center space-x-2">
                    <div class="w-1.5 h-1.5 bg-red-500 rotate-45"></div>
                    <span class="text-[10px] font-black tracking-widest text-nier-text-light dark:text-nier-text-dark uppercase">{{ node.params.description || 'EMOTIONAL_STATE_DETECTED' }}</span>
                 </div>
                 <p class="text-[11px] leading-relaxed opacity-70 font-mono italic">{{ node.params.info || 'Establishing neural link to archive...' }}</p>
                 <div class="pt-2 border-t border-nier-border-light/20 dark:border-nier-border-dark/20">
                    <span class="text-[8px] font-mono tracking-widest opacity-40 uppercase">Recommended_Remediation_Protocol</span>
                 </div>
              </div>
            </ExNTtooltip>
          </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ExPanel from '~/shared/ui/ExPanel.vue'
import ExText from '~/shared/ui/ExText.vue'
import ExHeading from '~/shared/ui/ExHeading.vue'
import ExInput from '~/shared/ui/ExInput.vue'
import ExButton from '~/shared/ui/ExButton.vue'
import ExNTtooltip from '~/shared/ui/ExNTtooltip.vue'

const vAutofocus = {
  mounted: (el: HTMLElement) => el.focus()
}

const props = defineProps<{
  node: {
    id: string
    label: string
    type: string
    x: number
    y: number
    color: string
    params: any
    isRoot?: boolean
  }
  scale: number
  isClosest?: boolean
  isSelected?: boolean
  isDark?: boolean
}>()

const emit = defineEmits(['start-output', 'pickup-input', 'drop', 'remove', 'moved', 'doubleclick', 'clear-input', 'clear-output', 'contextmenu', 'merge'])

const displayColor = computed(() => {
  // Only apply custom color logic for personal instruments (custom nodes)
  if (props.node.params?.isCustom) {
    const baseColor = props.node.params?.color || props.node.color
    const hex = baseColor?.toLowerCase()
    
    // If they have default white/black colors, swap them based on theme
    if (hex === '#ffffff' || hex === '#000000') {
      return props.isDark ? '#ffffff' : '#000000'
    }
    return baseColor
  }
  
  // For system nodes, return null so they use theme-based CSS classes (text-theme-text, etc.)
  return null
})

interface Comment { id: string, text: string, x: number, y: number, isEditing: boolean }

const isDragging = ref(false)
const imageError = ref(false)
const scenarioPanelTypes = [
  'text-panel',
  'rules-panel',
  'checklist-panel',
  'drawing-panel',
  'markup-panel',
  'variant-panel',
  'failure-panel',
  'invalidation-panel',
  'decision-gate',
  'playbook-step',
  'review-panel'
]
const visualScenarioPanelTypes = ['drawing-panel', 'markup-panel']
const isScenarioPanel = computed(() => scenarioPanelTypes.includes(props.node.type))
const isVisualScenarioPanel = computed(() => visualScenarioPanelTypes.includes(props.node.type))
const scenarioPanelSize = computed(() => (
  isVisualScenarioPanel.value
    ? { width: 300, height: 190 }
    : { width: 260, height: 180 }
))
const activeScenarioStrokeId = ref<string | null>(null)

function getScenarioDrawPoint(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
    y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
  }
}

function startScenarioDrawing(e: MouseEvent) {
  if (!isVisualScenarioPanel.value) return
  if (!props.node.params.strokes) props.node.params.strokes = []
  const stroke = {
    id: 's' + Date.now().toString(36),
    points: [getScenarioDrawPoint(e)]
  }
  props.node.params.strokes.push(stroke)
  activeScenarioStrokeId.value = stroke.id
}

function moveScenarioDrawing(e: MouseEvent) {
  if (!activeScenarioStrokeId.value || !props.node.params?.strokes) return
  const stroke = props.node.params.strokes.find((item: any) => item.id === activeScenarioStrokeId.value)
  if (!stroke) return
  stroke.points.push(getScenarioDrawPoint(e))
}

function finishScenarioDrawing() {
  activeScenarioStrokeId.value = null
}

function formatScenarioStroke(stroke: any) {
  return (stroke.points || []).map((point: any) => `${point.x},${point.y}`).join(' ')
}

const startDrag = (e: MouseEvent) => {
  if (isResizing.value) return
  isDragging.value = true
  const startX = e.clientX
  const startY = e.clientY
  const initialX = props.node.x
  const initialY = props.node.y
  
  const move = (mE: MouseEvent) => {
    if (!isDragging.value) return
    props.node.x = initialX + (mE.clientX - startX) / props.scale
    props.node.y = initialY + (mE.clientY - startY) / props.scale
    emit('moved')
  }
  
  const stop = () => {
    isDragging.value = false
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', stop)
  }
  
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', stop)
}

const startCommentResize = (e: MouseEvent, comment: any) => {
  e.stopPropagation()
  const startX = e.clientX
  const startY = e.clientY
  const initialWidth = comment.width || 300
  const initialHeight = comment.height || 160
  
  const move = (mE: MouseEvent) => {
    comment.width = Math.max(450, initialWidth + (mE.clientX - startX) / props.scale)
    comment.height = Math.max(280, initialHeight + (mE.clientY - startY) / props.scale)
    emit('moved')
  }
  
  const stop = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', stop)
  }
  
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', stop)
}

const isResizing = ref(false)
const startResize = (e: MouseEvent) => {
  isResizing.value = true
  const startX = e.clientX
  const startY = e.clientY
  const initialWidth = props.node.params?.width || 300
  const initialHeight = props.node.params?.height || 200
  
  const move = (mE: MouseEvent) => {
    if (!isResizing.value) return
    const dx = (mE.clientX - startX) / props.scale
    const dy = (mE.clientY - startY) / props.scale
    props.node.params.width = Math.max(100, initialWidth + dx)
    props.node.params.height = Math.max(100, initialHeight + dy)
    emit('moved')
  }
  
  const stop = () => {
    isResizing.value = false
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', stop)
  }
  
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', stop)
}

const startCommentDrag = (e: MouseEvent, comment: any) => {
  if (comment.isEditing) return
  
  const startX = e.clientX
  const startY = e.clientY
  const initialX = comment.x
  const initialY = comment.y
  
  const move = (mE: MouseEvent) => {
    comment.x = initialX + (mE.clientX - startX) / props.scale
    comment.y = initialY + (mE.clientY - startY) / props.scale
    emit('moved')
  }
  
  const stop = () => {
    window.removeEventListener('mousemove', move)
    window.removeEventListener('mouseup', stop)
  }
  
  window.addEventListener('mousemove', move)
  window.addEventListener('mouseup', stop)
}


const removeComment = (id: string) => {
  props.node.params.comments = props.node.params.comments.filter((c: Comment) => c.id !== id)
  emit('moved')
}

const adjustTextareaHeight = (e: Event) => {
  const target = e.target as HTMLTextAreaElement
  target.style.height = 'auto'
  target.style.height = target.scrollHeight + 'px'
}

const getRemedyCoords = (idx: number) => {
  const repulsion = Math.max(0, (0.6 - props.scale) * 350)
  const isTop = idx < 2
  const isLeft = idx % 2 === 0
  const baseY = isTop ? 400 : 600
  const baseX = isLeft ? 320 : 880
  const baseStyleTop = isTop ? 360 : 560
  const baseStyleLeft = isLeft ? 0 : 880
  
  return {
    x: baseX + (isLeft ? -repulsion : repulsion),
    y: baseY + (isTop ? -repulsion : repulsion),
    styleTop: baseStyleTop + (isTop ? -repulsion : repulsion),
    styleLeft: baseStyleLeft + (isLeft ? -repulsion : repulsion)
  }
}

const getEdgeOrigin = (centerX: number, centerY: number, targetX: number, targetY: number, isCircle: boolean) => {
  const dx = targetX - centerX
  const dy = targetY - centerY
  const radius = 62 
  
  if (isCircle) {
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist === 0) return { x: centerX, y: centerY }
    return {
      x: centerX + (dx / dist) * radius,
      y: centerY + (dy / dist) * radius
    }
  } else {
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    if (absDx === 0 && absDy === 0) return { x: centerX, y: centerY }
    const t = radius / Math.max(absDx, absDy)
    return {
      x: centerX + dx * t,
      y: centerY + dy * t
    }
  }
}

const getRemedyPath = (idx: number) => {
  const coords = getRemedyCoords(idx)
  const midX = idx % 2 === 0 ? 500 : 700
  const origin = getEdgeOrigin(600, 500, midX, coords.y, props.node.type === 'step')
  return `M ${origin.x} ${origin.y} L ${midX} ${coords.y} L ${coords.x} ${coords.y}`
}
</script>

<style scoped>
.skill-chip {
  transform: translate(-50%, -50%);
  user-select: none;
}

.callout-pop-enter-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--delay, 0s);
}
.callout-pop-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
  filter: blur(10px);
}

@keyframes scan {
  from { transform: translateY(-100%); }
  to { transform: translateY(100%); }
}

.animate-scan {
  animation: scan 3s linear infinite;
}

@keyframes config-pulse {
  0%, 100% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.35); border-color: rgba(239, 68, 68, 0.7); }
  50%       { box-shadow: 0 0 28px rgba(239, 68, 68, 0.7);  border-color: rgba(239, 68, 68, 1);   }
}

.needs-config-pulse {
  border-color: rgba(239, 68, 68, 0.8);
  animation: config-pulse 1.8s ease-in-out infinite;
}
</style>
