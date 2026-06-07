<template>
  <div class="absolute inset-0 z-50 overflow-hidden pointer-events-auto touch-none"
       :class="isPanning ? 'cursor-grabbing' : 'cursor-grab'"
       @pointerdown="startPan"
       @pointermove="movePan"
       @pointerup="endPan"
       @pointercancel="endPan">
    <div class="absolute inset-0" :style="panLayerStyle">
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
      <svg class="overflow-visible" width="2" height="2">
        <path :d="connectorPath(1, 1, strategyNodePositions, 'x', 'y')"
              fill="none"
              stroke="#333333"
              stroke-width="1" />
        <path :d="connectorPath(1, 1, highlightedStrategies, 'x', 'y')"
              fill="none"
              stroke="#ffffff"
              stroke-width="1.3" />
        <template v-for="node in strategyNodePositions" :key="'line-group-'+(node.treeKey || node.id)">
          <path :d="connectorPath(node.x + 1, node.y + 1, node.scenarios, 'globalX', 'globalY')"
                fill="none"
                stroke="#333333"
                stroke-dasharray="2 2"
                stroke-width="1" />
          <path :d="connectorPath(node.x + 1, node.y + 1, highlightedScenarios(node), 'globalX', 'globalY')"
                fill="none"
                stroke="#ffffff"
                stroke-width="1.3" />
          <template v-for="sc in node.scenarios" :key="'line-content-group-'+(sc.treeKey || sc.id)">
            <path :d="conditionRowsPath(sc.globalX + 1, sc.globalY + 1, sc.contents || [])"
                  fill="none"
                  stroke="#2e2e2e"
                  stroke-width="1" />
            <path :d="conditionRowsPath(sc.globalX + 1, sc.globalY + 1, highlightedContents(sc))"
                  fill="none"
                  stroke="#ffffff"
                  stroke-width="1.3" />
          </template>
        </template>
      </svg>
    </div>

    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
      <ExNTtooltip>
        <template #trigger>
          <div class="relative w-16 h-16 border flex items-center justify-center cursor-pointer transition-all duration-500 group/node border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white shadow-[0_0_40px_rgba(0,0,0,0.05)] backdrop-blur-md"
               :class="isRootHighlighted ? 'bg-white border-white shadow-[0_0_18px_rgba(255,255,255,0.35)]' : 'bg-zinc-100 dark:bg-[#0a0a0a]'"
               @pointerdown.stop>
            <div v-if="!isHeatmapActive" class="absolute -bottom-1 -right-1 w-2.5 h-2.5 rotate-45 border border-white/70 bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.35)]"></div>
            <div class="absolute left-1 top-1 h-1.5 w-1.5 border-l border-t transition-colors duration-500"
                 :class="isRootHighlighted ? 'border-black' : 'border-black/20 dark:border-white/20 group-hover/node:border-black dark:group-hover/node:border-white'"></div>

            <span class="text-[16px] font-mono font-black tracking-tighter uppercase transition-colors"
                  :class="isRootHighlighted ? 'text-black' : 'text-black/40 dark:text-white/40 group-hover/node:text-black dark:group-hover/node:text-white'">
              USR
            </span>
          </div>
        </template>
        <div class="flex flex-col gap-1 min-w-[120px] p-1">
          <div class="flex flex-col space-y-1 font-mono leading-relaxed uppercase text-black dark:text-white">
            <span class="font-black text-[14px] tracking-widest pb-0.5">{{ authStore.user?.displayName || authStore.user?.email || 'Operator_0x4F' }}</span>
            <div class="w-full h-[1px] bg-black/10 dark:bg-white/10 mb-1"></div>
            <span class="text-[9px] opacity-60">ID. {{ authStore.user?.uid?.slice(0, 10) || 'UNKNOWN' }}</span>
            <span class="text-[9px] opacity-60">TYPE. {{ authStore.user?.type || 'COMMON' }}</span>
            <span class="text-[9px] opacity-60">EST. {{ formatCreationDate(authStore.user?.joinedAt) }}</span>
          </div>
        </div>
      </ExNTtooltip>
    </div>

    <template v-for="node in strategyNodePositions" :key="'strat-'+(node.treeKey || node.id)">
      <div class="absolute top-1/2 left-1/2 transition-all duration-1000 z-[5]"
           :style="{ transform: `translate(calc(-50% + ${node.x}px), calc(-50% + ${node.y}px))` }">
        <ExNTtooltip>
          <template #trigger>
            <div class="relative w-12 h-12 border flex items-center justify-center cursor-pointer transition-all duration-500 group/node backdrop-blur-md border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white"
               :class="nodeSurfaceClass(node)"
               @pointerdown.stop
               @click.stop="selectTreeNode(node, 'strategy')">
              <div v-if="!isHeatmapActive" class="absolute -bottom-1 -right-1 w-2 h-2 rotate-45 border border-white/70 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.35)]"></div>
              <div class="absolute left-1 top-1 h-1.5 w-1.5 border-l border-t transition-colors duration-500"
                   :class="isNodeHighlighted(node) ? 'border-black' : 'border-black/10 dark:border-white/10 group-hover/node:border-black dark:group-hover/node:border-white'"></div>

              <span class="text-[12px] font-mono font-black tracking-tighter uppercase transition-colors"
                    :class="isNodeHighlighted(node) ? 'text-black' : 'text-black/40 dark:text-white/40 group-hover/node:text-black dark:group-hover/node:text-white'">
                {{ (node.name || '').slice(0, 3) }}
              </span>
            </div>
          </template>
          <div class="flex min-w-[140px] flex-col gap-2">
            <p class="text-[13px] font-mono font-black leading-snug uppercase tracking-wide text-black dark:text-white">
              {{ node.name }}
            </p>
            <div class="h-px w-full bg-white/25"></div>
            <div class="grid grid-cols-3 gap-3 pt-1 font-mono uppercase">
              <div class="flex flex-col gap-0.5">
                <span class="text-[8px] font-bold tracking-wide text-black/35 dark:text-white/35">{{ t('genesis.tree.tooltip.frequency') }}</span>
                <span class="text-[13px] font-black tracking-wide" :class="node.frequencyColorClass || 'text-rose-400'">{{ node.frequencyLabel || '0%' }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-[8px] font-bold tracking-wide text-black/35 dark:text-white/35">{{ t('genesis.tree.tooltip.pfRatio') }}</span>
                <span class="text-[13px] font-black tracking-wide" :class="node.profitFactorRatioColorClass || 'text-amber-400'">{{ node.profitFactorRatioLabel || '0.00' }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-[8px] font-bold tracking-wide text-black/35 dark:text-white/35">{{ t('genesis.tree.tooltip.winrate') }}</span>
                <span class="text-[13px] font-black tracking-wide" :class="node.winrateColorClass || 'text-rose-400'">{{ node.winrateLabel || '0%' }}</span>
              </div>
            </div>
            <div class="border-t border-white/10 pt-2 font-mono text-[9px] font-bold uppercase tracking-widest text-black/45 dark:text-white/45">
              {{ t('genesis.tree.tooltip.trades') }}: {{ node.tradeCountLabel || '0' }}
            </div>
          </div>
        </ExNTtooltip>
      </div>

      <div v-for="sc in node.scenarios" :key="'sc-'+(sc.treeKey || sc.id)"
           class="absolute top-1/2 left-1/2 transition-all duration-1000 z-[4]"
           :style="{ transform: `translate(calc(-50% + ${sc.globalX}px), calc(-50% + ${sc.globalY}px))` }">
        <ExNTtooltip>
          <template #trigger>
            <div class="relative w-12 h-12 border flex items-center justify-center cursor-pointer transition-all duration-500 group/node backdrop-blur-md border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white"
                 :class="nodeSurfaceClass(sc)"
                 @pointerdown.stop
                 @click.stop="selectTreeNode(sc, 'scenario')">
              <div v-if="!isHeatmapActive" class="absolute -bottom-1 -right-1 w-2 h-2 rotate-45 border border-white/70 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.35)]"></div>
              <div class="absolute left-1 top-1 h-1.5 w-1.5 border-l border-t transition-colors duration-500"
                   :class="isNodeHighlighted(sc) ? 'border-black' : 'border-black/10 dark:border-white/10 group-hover/node:border-black dark:group-hover/node:border-white'"></div>
              <span class="px-1 text-[10px] font-mono font-black tracking-[0.16em] uppercase leading-tight text-center transition-colors break-words"
                    :class="isNodeHighlighted(sc) ? 'text-black' : 'text-black/45 dark:text-white/45 group-hover/node:text-black dark:group-hover/node:text-white'">
                {{ sc.shortName || sc.displayName || sc.label || sc.name || 'SCN' }}
              </span>
            </div>
          </template>
          <div class="flex min-w-[150px] flex-col gap-2">
            <p class="text-[13px] font-mono font-black leading-snug uppercase tracking-wide text-black dark:text-white">
              {{ sc.displayName || sc.label || sc.name || t('genesis.tree.tooltip.scenario') }}
            </p>
            <div class="h-px w-full bg-white/25"></div>
            <p class="text-[9px] font-mono font-bold uppercase tracking-wide text-black/60 dark:text-white/60">
              {{ t('genesis.tree.tooltip.type') }}: {{ translateTooltipType(sc.typeLabel || 'ENTRY SCENARIO') }}
            </p>
            <div class="grid grid-cols-3 gap-3 pt-1 font-mono uppercase">
              <div class="flex flex-col gap-0.5">
                <span class="text-[8px] font-bold tracking-wide text-black/35 dark:text-white/35">{{ t('genesis.tree.tooltip.frequency') }}</span>
                <span class="text-[13px] font-black tracking-wide" :class="sc.frequencyColorClass || 'text-rose-400'">{{ sc.frequencyLabel || '0%' }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-[8px] font-bold tracking-wide text-black/35 dark:text-white/35">{{ t('genesis.tree.tooltip.pfRatio') }}</span>
                <span class="text-[13px] font-black tracking-wide" :class="sc.profitFactorRatioColorClass || 'text-amber-400'">{{ sc.profitFactorRatioLabel || '0.00' }}</span>
              </div>
              <div class="flex flex-col gap-0.5">
                <span class="text-[8px] font-bold tracking-wide text-black/35 dark:text-white/35">{{ t('genesis.tree.tooltip.winrate') }}</span>
                <span class="text-[13px] font-black tracking-wide" :class="sc.winrateColorClass || 'text-rose-400'">{{ sc.winrateLabel || '0%' }}</span>
              </div>
            </div>
            <div class="border-t border-white/10 pt-2 font-mono text-[9px] font-bold uppercase tracking-widest text-black/45 dark:text-white/45">
              {{ t('genesis.tree.tooltip.trades') }}: {{ sc.tradeCountLabel || '0' }}
            </div>
          </div>
        </ExNTtooltip>
      </div>

      <template v-for="sc in node.scenarios" :key="'content-group-'+(sc.treeKey || sc.id)">
        <div v-for="content in (sc.contents || [])" :key="'content-'+(content.treeKey || content.id)"
             class="absolute top-1/2 left-1/2 transition-all duration-1000 z-[2]"
             :style="{ transform: `translate(calc(-50% + ${content.globalX}px), calc(-50% + ${content.globalY}px))` }">
          <ExNTtooltip>
            <template #trigger>
              <div class="relative w-12 h-12 border flex items-center justify-center cursor-pointer transition-all duration-500 group/node backdrop-blur-md border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white"
                   :class="nodeSurfaceClass(content)"
                   @pointerdown.stop
                   @click.stop="selectTreeNode(content, 'condition')">
                <div v-if="!isHeatmapActive" class="absolute -bottom-1 -right-1 w-2 h-2 rotate-45 border border-white/70 bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.35)]"></div>
                <div class="absolute left-1 top-1 h-1.5 w-1.5 border-l border-t transition-colors duration-500"
                     :class="isNodeHighlighted(content) ? 'border-black' : 'border-black/10 dark:border-white/10 group-hover/node:border-black dark:group-hover/node:border-white'"></div>
                <span class="px-1 text-[10px] font-mono font-black tracking-[0.16em] uppercase leading-tight text-center transition-colors break-words"
                      :class="isNodeHighlighted(content) ? 'text-black' : 'text-black/45 dark:text-white/45 group-hover/node:text-black dark:group-hover/node:text-white'">
                  {{ content.shortName || content.displayName || content.label || content.name || 'CNT' }}
                </span>
              </div>
            </template>
            <div class="flex min-w-[140px] flex-col gap-2">
              <p class="text-[13px] font-mono font-black leading-snug uppercase tracking-wide text-black dark:text-white">
                {{ content.displayName || content.label || content.name || t('genesis.tree.tooltip.condition') }}
              </p>
              <div class="h-px w-full bg-white/25"></div>
              <p class="text-[9px] font-mono font-bold uppercase tracking-wide text-black/60 dark:text-white/60">
                {{ t('genesis.tree.tooltip.type') }}: {{ translateTooltipType(content.typeLabel || 'CONDITION') }}
              </p>
              <div class="grid grid-cols-3 gap-3 pt-1 font-mono uppercase">
                <div class="flex flex-col gap-0.5">
                  <span class="text-[8px] font-bold tracking-wide text-black/35 dark:text-white/35">{{ t('genesis.tree.tooltip.frequency') }}</span>
                  <span class="text-[13px] font-black tracking-wide" :class="content.frequencyColorClass || 'text-rose-400'">{{ content.frequencyLabel || '0%' }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[8px] font-bold tracking-wide text-black/35 dark:text-white/35">{{ t('genesis.tree.tooltip.pfRatio') }}</span>
                  <span class="text-[13px] font-black tracking-wide" :class="content.profitFactorRatioColorClass || 'text-amber-400'">{{ content.profitFactorRatioLabel || '0.00' }}</span>
                </div>
                <div class="flex flex-col gap-0.5">
                  <span class="text-[8px] font-bold tracking-wide text-black/35 dark:text-white/35">{{ t('genesis.tree.tooltip.winrate') }}</span>
                  <span class="text-[13px] font-black tracking-wide" :class="content.winrateColorClass || 'text-rose-400'">{{ content.winrateLabel || '0%' }}</span>
                </div>
              </div>
              <div class="border-t border-white/10 pt-2 font-mono text-[9px] font-bold uppercase tracking-widest text-black/45 dark:text-white/45">
                {{ t('genesis.tree.tooltip.trades') }}: {{ content.tradeCountLabel || '0' }}
              </div>
            </div>
          </ExNTtooltip>
        </div>
      </template>
    </template>
    </div>

    <div class="absolute left-8 top-8 z-[90] pointer-events-auto"
         @pointerdown.stop
         @pointermove.stop
         @click.stop>
      <button class="relative flex h-11 w-11 items-center justify-center border border-white/10 bg-[#0a0a0a]/90 text-white/55 transition-colors hover:border-white/35 hover:text-white"
              :title="t('genesis.tree.controls.resetView')"
              @click="resetView">
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
          <path d="M4 4v6h6"></path>
          <path d="M20 20v-6h-6"></path>
          <path d="M20 9A8 8 0 0 0 6.3 5.3L4 7.5"></path>
          <path d="M4 15a8 8 0 0 0 13.7 3.7L20 16.5"></path>
        </svg>
        <div class="absolute left-1 top-1 h-1 w-1 border-l border-t border-white/30"></div>
        <div class="absolute bottom-1 right-1 h-1 w-1 border-b border-r border-white/30"></div>
      </button>
    </div>

    <div class="absolute left-8 top-1/2 z-[80] -translate-y-1/2 pointer-events-auto"
         @pointerdown.stop
         @pointermove.stop
         @click.stop>
      <div class="relative h-[620px] transition-[width] duration-500"
           :class="isPresetPanelCollapsed ? 'w-0' : 'w-80'">
      <aside class="absolute left-0 top-0 h-[620px] w-80 border border-white/10 bg-[#0a0a0a]/90 p-4 backdrop-blur-xl transition-all duration-500"
             :class="isPresetPanelCollapsed ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'">
        <div class="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <span class="font-mono text-[10px] font-black uppercase tracking-[0.32em] text-white/80">{{ t('genesis.tree.presets.title') }}</span>
          <button class="font-mono text-[9px] font-bold uppercase tracking-widest text-white/35 transition-colors hover:text-white"
                  @click="activePresetId = null">
            {{ t('genesis.tree.presets.clear') }}
          </button>
        </div>
        <input v-model="presetSearch"
               class="mb-3 h-10 w-full border border-white/10 bg-white/[0.03] px-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white outline-none transition-colors placeholder:text-white/25 focus:border-white/45"
               :placeholder="t('genesis.tree.presets.searchPlaceholder')"
               @keydown.stop />
        <div class="mb-3 border border-white/10 bg-white/[0.02] p-3">
          <div class="mb-2 font-mono text-[7px] font-black uppercase tracking-[0.3em] text-white/35">
            {{ t('genesis.tree.controls.heatmap') }}
          </div>
          <div class="grid grid-cols-4 gap-1">
            <button v-for="mode in heatmapModes"
                    :key="mode.id"
                    class="relative overflow-hidden border px-2 py-2 font-mono text-[7px] font-black uppercase tracking-[0.12em] transition-all duration-300"
                    :class="heatmapMode === mode.id ? heatmapButtonClass(mode.id) : 'border-white/10 bg-[#050505] text-white/35 hover:border-white/30 hover:text-white'"
                    @click="heatmapMode = mode.id">
              <span class="relative z-10">{{ t(mode.labelKey) }}</span>
            </button>
          </div>
        </div>
        <div class="mb-3 grid grid-cols-3 border border-white/10">
          <button v-for="tab in presetTabs"
                  :key="tab.id"
                  class="border-r border-white/10 px-2 py-2 font-mono text-[8px] font-black uppercase tracking-[0.14em] transition-colors last:border-r-0"
                  :class="activePresetTab === tab.id ? 'bg-white text-black' : 'bg-white/[0.02] text-white/35 hover:text-white'"
                  @click="activePresetTab = tab.id">
            {{ t(tab.labelKey) }}
          </button>
        </div>
        <div class="flex h-[374px] flex-col gap-2 overflow-y-auto pr-1">
          <button v-for="preset in filteredPresetOptions"
                  :key="preset.id"
                  class="group relative border px-4 py-3 text-left transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30"
                  :class="activePresetId === preset.id ? 'border-white bg-white text-black' : 'border-white/10 text-white/50 hover:border-white/35 hover:text-white'"
                  :disabled="preset.empty"
                  @click="activePresetId = activePresetId === preset.id ? null : preset.id">
            <span class="block font-mono text-[10px] font-black uppercase tracking-[0.16em]">{{ translatePresetLabel(preset.label) }}</span>
            <span class="mt-1 block font-mono text-[8px] font-bold uppercase tracking-widest opacity-45">
              {{ translatePresetType(preset.typeLabel) }} / {{ preset.empty ? t('genesis.tree.presets.noData') : `${preset.targetNodeIds.length} ${t('genesis.tree.presets.nodes')}` }}
            </span>
          </button>
          <div v-if="filteredPresetOptions.length === 0"
               class="border border-white/10 px-4 py-5 text-center font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
            {{ t('genesis.tree.presets.noPresetsFound') }}
          </div>
        </div>
      </aside>
      <button class="absolute top-1/2 z-[100] flex h-40 w-6 -translate-y-1/2 cursor-pointer items-center justify-center border-t border-r border-b border-white/20 bg-[#070707] transition-colors hover:bg-[#111] group/preset-tab"
              :class="isPresetPanelCollapsed ? 'right-0' : '-right-6'"
              @click="isPresetPanelCollapsed = !isPresetPanelCollapsed">
        <div class="h-16 w-[1px] bg-white/10 transition-all duration-300 group-hover/preset-tab:bg-white/40"></div>
        <span class="absolute rotate-90 whitespace-nowrap font-mono text-[7px] uppercase tracking-[0.4em] text-white/10 transition-colors group-hover/preset-tab:text-white/40">
          {{ isPresetPanelCollapsed ? t('genesis.tree.presets.handle.open') : t('genesis.tree.presets.handle.close') }}
        </span>
      </button>
      </div>
    </div>

    <div v-if="selectedTreeNode"
         class="absolute right-8 top-1/2 z-[90] w-[360px] -translate-y-1/2 border border-white/10 bg-[#0a0a0a]/95 p-5 text-white shadow-[0_0_40px_rgba(0,0,0,0.35)] pointer-events-auto"
         @pointerdown.stop
         @pointermove.stop
         @click.stop>
      <button class="absolute -left-6 top-1/2 flex h-40 w-6 -translate-y-1/2 cursor-pointer items-center justify-center border-t border-l border-b border-white/20 bg-[#070707] transition-colors hover:bg-[#111] group/node-detail"
              @click="closeSelectedTreeNode">
        <div class="h-16 w-[1px] bg-white/10 transition-all duration-300 group-hover/node-detail:bg-white/40"></div>
        <span class="absolute -rotate-90 whitespace-nowrap font-mono text-[7px] uppercase tracking-[0.4em] text-white/10 transition-colors group-hover/node-detail:text-white/40">
          {{ t('genesis.tree.details.close') }}
        </span>
      </button>

      <div class="mb-5 border-b border-white/10 pb-4">
        <div class="mb-2 flex items-center justify-between">
          <span class="font-mono text-[8px] font-black uppercase tracking-[0.32em] text-white/35">
            {{ selectedTreeNodeTypeLabel }}
          </span>
          <span class="font-mono text-[8px] font-black uppercase tracking-[0.22em]"
                :class="Number(selectedTreeNode.netPnlValue || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'">
            {{ selectedTreeNode.netPnlLabel || '$0.00' }}
          </span>
        </div>
        <h3 class="font-mono text-[18px] font-black uppercase leading-tight tracking-wide text-white">
          {{ selectedTreeNodeTitle }}
        </h3>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="border border-white/10 bg-white/[0.025] p-3">
          <span class="font-mono text-[7px] font-bold uppercase tracking-widest text-white/30">{{ t('genesis.tree.details.trades') }}</span>
          <p class="mt-2 font-mono text-[20px] font-black text-white">{{ selectedTreeNode.tradeCountLabel || '0' }}</p>
        </div>
        <div class="border border-white/10 bg-white/[0.025] p-3">
          <span class="font-mono text-[7px] font-bold uppercase tracking-widest text-white/30">{{ t('genesis.tree.details.winrate') }}</span>
          <p class="mt-2 font-mono text-[20px] font-black" :class="selectedTreeNode.winrateColorClass || 'text-rose-400'">{{ selectedTreeNode.winrateLabel || '0%' }}</p>
        </div>
        <div class="border border-white/10 bg-white/[0.025] p-3">
          <span class="font-mono text-[7px] font-bold uppercase tracking-widest text-white/30">{{ t('genesis.tree.details.pf') }}</span>
          <p class="mt-2 font-mono text-[20px] font-black" :class="selectedTreeNode.profitFactorRatioColorClass || 'text-amber-400'">{{ selectedTreeNode.profitFactorRatioLabel || '0.00' }}</p>
        </div>
        <div class="border border-white/10 bg-white/[0.025] p-3">
          <span class="font-mono text-[7px] font-bold uppercase tracking-widest text-white/30">{{ t('genesis.tree.details.netPnl') }}</span>
          <p class="mt-2 font-mono text-[20px] font-black" :class="Number(selectedTreeNode.netPnlValue || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'">{{ selectedTreeNode.netPnlLabel || '$0.00' }}</p>
        </div>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <div class="border border-white/10 p-3">
          <span class="font-mono text-[7px] font-bold uppercase tracking-widest text-white/30">{{ t('genesis.tree.details.bestTrade') }}</span>
          <p class="mt-2 font-mono text-[11px] font-black uppercase text-white">{{ selectedTreeNode.bestTrade?.asset || 'N/A' }}</p>
          <p class="mt-1 font-mono text-[10px] font-bold" :class="tradePnlClass(selectedTreeNode.bestTrade)">{{ selectedTreeNode.bestTrade?.pnlLabel || '$0.00' }}</p>
        </div>
        <div class="border border-white/10 p-3">
          <span class="font-mono text-[7px] font-bold uppercase tracking-widest text-white/30">{{ t('genesis.tree.details.worstTrade') }}</span>
          <p class="mt-2 font-mono text-[11px] font-black uppercase text-white">{{ selectedTreeNode.worstTrade?.asset || 'N/A' }}</p>
          <p class="mt-1 font-mono text-[10px] font-bold" :class="tradePnlClass(selectedTreeNode.worstTrade)">{{ selectedTreeNode.worstTrade?.pnlLabel || '$0.00' }}</p>
        </div>
      </div>

      <div class="mt-5 border-t border-white/10 pt-4">
        <div class="mb-3 font-mono text-[8px] font-black uppercase tracking-[0.3em] text-white/45">
          {{ t('genesis.tree.details.recentTrades') }}
        </div>
        <div class="flex flex-col gap-2">
          <div v-for="trade in (selectedTreeNode.recentTrades || [])"
               :key="trade.id || `${trade.asset}-${trade.date}-${trade.pnl}`"
               class="flex items-center justify-between border border-white/10 bg-white/[0.02] px-3 py-2">
            <div>
              <p class="font-mono text-[10px] font-black uppercase tracking-wide text-white">{{ trade.asset }}</p>
              <p class="font-mono text-[8px] font-bold uppercase tracking-widest text-white/30">{{ trade.date }}</p>
            </div>
            <span class="font-mono text-[10px] font-black" :class="tradePnlClass(trade)">{{ trade.pnlLabel }}</span>
          </div>
          <div v-if="!(selectedTreeNode.recentTrades || []).length"
               class="border border-white/10 px-3 py-4 text-center font-mono text-[9px] font-bold uppercase tracking-widest text-white/25">
            {{ t('genesis.tree.details.noTrades') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ExNTtooltip from '~/shared/ui/ExNTtooltip.vue'
import { useGenesisTree } from '../model/useGenesisTree'
import { useI18n } from '~/shared/i18n/useI18n'

const {
  authStore,
  formatCreationDate,
  strategyNodePositions,
  treePresetOptions
} = useGenesisTree()
const { t } = useI18n()

const pan = ref({ x: 0, y: 0 })
const lastPointer = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const activePresetId = ref<string | null>(null)
const presetSearch = ref('')
const activePresetTab = ref<'strategy' | 'scenario' | 'condition'>('strategy')
const isPresetPanelCollapsed = ref(false)
const heatmapMode = ref<'none' | 'winrate' | 'pf' | 'frequency'>('none')
const selectedTreeNode = ref<any | null>(null)
const selectedTreeNodeType = ref<'strategy' | 'scenario' | 'condition' | null>(null)

const presetTabs = [
  { id: 'strategy', labelKey: 'genesis.tree.presets.tabs.strategy' },
  { id: 'scenario', labelKey: 'genesis.tree.presets.tabs.scenario' },
  { id: 'condition', labelKey: 'genesis.tree.presets.tabs.condition' }
] as const

const heatmapModes = [
  { id: 'none', labelKey: 'genesis.tree.heatmap.none' },
  { id: 'winrate', labelKey: 'genesis.tree.heatmap.winrate' },
  { id: 'pf', labelKey: 'genesis.tree.heatmap.pf' },
  { id: 'frequency', labelKey: 'genesis.tree.heatmap.frequency' }
] as const

const panLayerStyle = computed(() => ({
  transform: `translate3d(${pan.value.x}px, ${pan.value.y}px, 0)`
}))

const isHeatmapActive = computed(() => heatmapMode.value !== 'none')

const filteredPresetOptions = computed(() => {
  const query = presetSearch.value.trim().toLowerCase()
  const tabbedPresets = treePresetOptions.value.filter((preset) => {
    if (activePresetTab.value === 'strategy') return preset.typeLabel === 'Strategies'
    if (activePresetTab.value === 'scenario') return preset.typeLabel === 'Scenarios'
    return preset.typeLabel === 'Conditions' || preset.typeLabel === 'Combinations'
  })

  if (!query) return tabbedPresets

  return tabbedPresets.filter((preset) => {
    return `${preset.label} ${preset.typeLabel}`.toLowerCase().includes(query)
  })
})

const translatePresetLabel = (label: string) => {
  return t(`genesis.tree.presets.labels.${label}`)
}

const translatePresetType = (typeLabel: string) => {
  return t(`genesis.tree.presets.types.${typeLabel}`)
}

const translateTooltipType = (typeLabel: string) => {
  const key = `genesis.tree.tooltip.types.${typeLabel}`
  const translatedType = t(key)
  return translatedType === key ? typeLabel : translatedType
}

const resetView = () => {
  pan.value = { x: 0, y: 0 }
}

const selectTreeNode = (node: any, type: 'strategy' | 'scenario' | 'condition') => {
  selectedTreeNode.value = node
  selectedTreeNodeType.value = type
}

const closeSelectedTreeNode = () => {
  selectedTreeNode.value = null
  selectedTreeNodeType.value = null
}

const selectedTreeNodeTitle = computed(() => {
  const node = selectedTreeNode.value
  if (!node) return ''

  return node.displayName || node.label || node.name || node.id || ''
})

const selectedTreeNodeTypeLabel = computed(() => {
  if (!selectedTreeNodeType.value) return ''
  return t(`genesis.tree.details.types.${selectedTreeNodeType.value}`)
})

const getNodeMetricValue = (node: any) => {
  if (heatmapMode.value === 'winrate') return Number(node?.winrateValue || 0)
  if (heatmapMode.value === 'pf') return Math.min(Number(node?.profitFactorRatioValue || 0) / 2, 1)
  if (heatmapMode.value === 'frequency') return Number(node?.frequencyValue || 0)
  return 0
}

const getHeatmapClass = (node: any) => {
  if (heatmapMode.value === 'none') return ''

  const value = getNodeMetricValue(node)
  if (value >= 0.66) {
    return 'border-teal-200/80 bg-[#0a0a0a] text-teal-100 shadow-[0_0_0_1px_rgba(94,234,212,0.22),0_0_24px_rgba(20,184,166,0.18),inset_0_0_18px_rgba(20,184,166,0.16)]'
  }
  if (value >= 0.33) {
    return 'border-sky-200/70 bg-[#0a0a0a] text-sky-100 shadow-[0_0_0_1px_rgba(125,211,252,0.18),0_0_22px_rgba(56,189,248,0.14),inset_0_0_18px_rgba(56,189,248,0.12)]'
  }
  return 'border-rose-200/70 bg-[#0a0a0a] text-rose-100 shadow-[0_0_0_1px_rgba(253,164,175,0.18),0_0_22px_rgba(244,63,94,0.14),inset_0_0_18px_rgba(244,63,94,0.12)]'
}

const heatmapButtonClass = (mode: string) => {
  if (mode === 'winrate') return 'border-teal-200/50 bg-teal-300/10 text-teal-100 shadow-[inset_0_0_14px_rgba(20,184,166,0.12)]'
  if (mode === 'pf') return 'border-sky-200/50 bg-sky-300/10 text-sky-100 shadow-[inset_0_0_14px_rgba(56,189,248,0.12)]'
  if (mode === 'frequency') return 'border-rose-200/50 bg-rose-300/10 text-rose-100 shadow-[inset_0_0_14px_rgba(244,63,94,0.12)]'
  return 'border-white bg-white text-black'
}

const nodeSurfaceClass = (node: any) => {
  if (isNodeHighlighted(node)) return 'bg-white border-white shadow-[0_0_18px_rgba(255,255,255,0.35)]'
  if ((node?.treeKey || node?.id) === (selectedTreeNode.value?.treeKey || selectedTreeNode.value?.id)) {
    return 'bg-white/15 border-white/70 shadow-[0_0_18px_rgba(255,255,255,0.18)]'
  }

  return getHeatmapClass(node) || 'bg-zinc-100 dark:bg-[#0a0a0a]'
}

const tradePnlClass = (trade: any) => {
  const pnl = Number(trade?.pnl || 0)
  if (pnl > 0) return 'text-emerald-400'
  if (pnl < 0) return 'text-rose-400'
  return 'text-white/45'
}

const activePreset = computed(() => {
  return treePresetOptions.value.find(preset => preset.id === activePresetId.value) || null
})

const targetNodeIds = computed(() => {
  return new Set(activePreset.value?.targetNodeIds || [])
})

const highlightedNodeIds = computed(() => {
  const highlighted = new Set<string>()
  if (targetNodeIds.value.size === 0) return highlighted

  strategyNodePositions.value.forEach((strategy: any) => {
    if (isTargetNode(strategy)) {
      highlighted.add(strategy.treeKey || strategy.id)
    }

    strategy.scenarios.forEach((scenario: any) => {
      const hasScenarioTarget = isTargetNode(scenario)
      const targetContents = (scenario.contents || []).filter((content: any) => isTargetNode(content))

      if (hasScenarioTarget || targetContents.length > 0) {
        highlighted.add(strategy.treeKey || strategy.id)
        highlighted.add(scenario.treeKey || scenario.id)
      }

      targetContents.forEach((content: any) => {
        highlighted.add(content.treeKey || content.id)
      })
    })
  })

  return highlighted
})

const isRootHighlighted = computed(() => targetNodeIds.value.size > 0)

const isTargetNode = (node: any) => {
  return targetNodeIds.value.has(node?.treeKey || '') || targetNodeIds.value.has(node?.id || '')
}

const isNodeHighlighted = (node: any) => {
  if (typeof node === 'string') return highlightedNodeIds.value.has(node)

  return highlightedNodeIds.value.has(node?.treeKey || '') || highlightedNodeIds.value.has(node?.id || '')
}

const strategyHasHighlight = (strategy: any) => {
  return isNodeHighlighted(strategy) ||
    strategy.scenarios.some((scenario: any) => scenarioHasHighlight(scenario))
}

const scenarioHasHighlight = (scenario: any) => {
  return isNodeHighlighted(scenario) ||
    (scenario.contents || []).some((content: any) => isNodeHighlighted(content))
}

const highlightedStrategies = computed(() => {
  return strategyNodePositions.value.filter(strategyHasHighlight)
})

const highlightedScenarios = (strategy: any) => {
  return (strategy.scenarios || []).filter((scenario: any) => scenarioHasHighlight(scenario))
}

const highlightedContents = (scenario: any) => {
  return (scenario.contents || []).filter((content: any) => isNodeHighlighted(content))
}

const startPan = (event: PointerEvent) => {
  if (event.button !== 0) return

  isPanning.value = true
  lastPointer.value = { x: event.clientX, y: event.clientY }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

const movePan = (event: PointerEvent) => {
  if (!isPanning.value) return

  const dx = event.clientX - lastPointer.value.x
  const dy = event.clientY - lastPointer.value.y

  pan.value = {
    x: pan.value.x + dx,
    y: pan.value.y + dy
  }
  lastPointer.value = { x: event.clientX, y: event.clientY }
}

const endPan = (event: PointerEvent) => {
  if (!isPanning.value) return

  isPanning.value = false

  if ((event.currentTarget as HTMLElement).hasPointerCapture(event.pointerId)) {
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  }
}

const connectorPath = (
  parentX: number,
  parentY: number,
  children: Array<Record<string, any>>,
  childXKey: string,
  childYKey: string
) => {
  if (!children.length) return ''

  const points = children.map(child => ({
    x: Number(child[childXKey]) + 1,
    y: Number(child[childYKey]) + 1
  }))
  const childY = points[0].y
  const busY = parentY + ((childY - parentY) / 2)
  const minX = Math.min(...points.map(point => point.x))
  const maxX = Math.max(...points.map(point => point.x))
  const busStartX = Math.min(parentX, minX)
  const busEndX = Math.max(parentX, maxX)
  const childDrops = points.map(point => `M ${point.x} ${busY} V ${point.y}`)

  return [
    `M ${parentX} ${parentY} V ${busY}`,
    `M ${busStartX} ${busY} H ${busEndX}`,
    ...childDrops
  ].join(' ')
}

const conditionRowsPath = (
  scenarioX: number,
  scenarioY: number,
  contents: Array<Record<string, any>>
) => {
  if (!contents.length) return ''

  const points = contents.map(content => ({
    x: Number(content.globalX) + 1,
    y: Number(content.globalY) + 1
  }))
  const rowMap = new Map<number, Array<{ x: number, y: number }>>()

  points.forEach((point) => {
    rowMap.set(point.y, [...(rowMap.get(point.y) || []), point])
  })

  const rows = Array.from(rowMap.entries())
    .sort(([rowA], [rowB]) => rowA - rowB)
    .map(([, row]) => row.sort((a, b) => a.x - b.x))
  const firstRow = rows[0]
  const firstRowY = firstRow[0].y
  const rootBusY = scenarioY + ((firstRowY - scenarioY) / 2)
  const rootMinX = Math.min(scenarioX, ...firstRow.map(point => point.x))
  const rootMaxX = Math.max(scenarioX, ...firstRow.map(point => point.x))
  const paths = [
    `M ${scenarioX} ${scenarioY} V ${rootBusY}`,
    `M ${rootMinX} ${rootBusY} H ${rootMaxX}`,
    ...firstRow.map(point => `M ${point.x} ${rootBusY} V ${point.y}`)
  ]

  rows.slice(1).forEach((row, rowIndex) => {
    const previousRow = rows[rowIndex]
    const parentPoint = previousRow[Math.min(1, previousRow.length - 1)]
    const rowY = row[0].y
    const rowBusY = parentPoint.y + ((rowY - parentPoint.y) / 2)
    const minX = Math.min(...row.map(point => point.x))
    const maxX = Math.max(...row.map(point => point.x))
    const childDrops = row.map(point => `M ${point.x} ${rowBusY} V ${point.y}`)

    paths.push(`M ${parentPoint.x} ${parentPoint.y} V ${rowBusY}`)
    paths.push(`M ${Math.min(parentPoint.x, minX)} ${rowBusY} H ${Math.max(parentPoint.x, maxX)}`)
    paths.push(...childDrops)
  })

  return paths.join(' ')
}

</script>
