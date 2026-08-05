<script setup>

import { inject } from 'vue';
import { useI18n } from '~/shared/i18n/useI18n';
const emit = defineEmits(['close']);
const { locale } = useI18n();
const isArchivalBriefingEnabled = false;

const getForexCurrencyPair = (symbol) => {
  const match = String(symbol || '').toUpperCase().replace(/[^A-Z]/g, '').match(/^([A-Z]{3})([A-Z]{3})$/);
  if (!match) return null;

  return {
    base: `https://wise.com/web-art/assets/flags/${match[1].toLowerCase()}.svg`,
    quote: `https://wise.com/web-art/assets/flags/${match[2].toLowerCase()}.svg`
  };
};

import ExEquityCurve2D from '~/widgets/genesis/ui/ExEquityCurve2D.vue';
import ExTradeEntryStudyMetricsPanel from './ExTradeEntryStudyMetricsPanel.vue';
import ExButton from '~/shared/ui/ExButton.vue';
import { computed, ref, watch } from 'vue';
const { themeStore, isDark, viewMode, archiveMode, journalEntries, notesList, getArchiveNodeName, addJournalEntry, removeJournalEntry, addNote, removeNote, addJournalEntryTag, removeJournalEntryTag, handleImageUpload, triggerUpload, showCmeNotice, rememberCmeNotice, closeCmeNotice, showAssetMenu, asset, assetSearch, filteredAssets, currentAssetData, selectAsset, matrixNodes, matrixConnections, matrixZones, isMatrixLoading, loadMatrixData, tradeStore, strategies, selectedStrategyId, selectedStrategy, findAllNodes, findAllConnections, findNodeById, activeRiskManagement, activeRiskPerTradeDollars, activeRiskSnapshot, actualRR, actualRiskPercent, violatesRR, violatesRiskPerTrade, riskViolationMessage, getReachableNodes, getNodeZoneType, showStrategyMenu, failedIcons, handleIconError, closeAssetMenu, selectedScenarioNode, getNodesForStrategy, DEFAULT_ENTRY_CONDITIONS, DEFAULT_ENTRY_SCENARIOS, DEFAULT_EXIT_CONDITIONS, DEFAULT_EXIT_SCENARIOS, entryConditions, entryScenarios, exitConditions, exitScenarios, miniExitScenarios, regularExitScenarios, filteredRegistryEntryScenarios, filteredRegistryExitScenarios, currentRegistryScenarioConditions, mismatchedNodeIds, hasVectorMismatch, activeConditions, isConditionActive, toggleCondition, showConditionLibrary, showEmotionSelector, showTradeStudyMetrics, registrySearchQuery, libraryFilter, filteredLibraryScenarios, flatLibraryConditions, selectedRegistryScenarioId, hoverTimeout, hoveredScenarioId, handleMouseEnterScenario, handleMouseLeaveScenario, handleMouseEnterInsight, getActiveConditionsInScenario, isScenarioSelected, handleMouseLeaveInsight, getScenarioConditions, getFlattenedScenarioConditions, activeSector, sectors, side, entry, exit, size, entryFee, exitFee, feeType, resultMode, showEntryMethod, activeProtocolTab, entryMethodType, pyramidingEntries, averagingDownEntries, activeMultipleEntries, entryMethodEnabled, hasActiveMethodNode, addMultipleEntry, exitEntries, exitMethodEnabled, totalExitSize, averageExit, addExitEntry, removeExitEntry, removeMultipleEntry, showAutoPrompt, autoEntryBasePrice, autoEntryBaseLots, toggleAutoPrompt, confirmAutoGenerate, totalSize, averageEntry, isForex, isManualEntryAsset, isFixedFeeAsset, overridePnl, liveRates, FALLBACK_RATES, fetchLiveRates, getRate, EMOTION_LIBRARY, emotionsByCategory, showEmotions, selectedEmotions, hoveredEmotion, mousePos, EMOTION_OPPOSITES, toggleEmotion, isEmotionDisabled, stopLoss, takeProfit, openDate, exitDate, cloneDate, adjustDate, formatPart, handleManualDate, projectedProfit, hasValidProjection, equityCurveTrades, isTemporalOpen, activeTemporalTarget, _now, tempDateParts, syncTempParts, openTemporal, scrollContainer, pnl, commitState, resetForm, submit } = inject('tradeState');
const tradeState = inject('tradeState');
const { showTradeSummary, savedTradeSummary } = tradeState;
const { sanitizeTradeNumberInput, isClosed, tradeTimeZone, tradeTimeZoneOffset, riskInputViolationMessage, actualRiskDollars, currentCapital, violatesTradingStyleDuration, actualTradeDurationLabel, requiredTradingStyleDurationLabel } = tradeState;

const formatRiskValue = (value) => Number.isFinite(Number(value)) ? Number(value).toFixed(2) : '--';

const isRiskMessageForField = (message, field) => {
  const normalized = String(message || '').toLowerCase();
  if (field === 'stopLoss') return normalized.includes('stop loss') || normalized.includes('стоп');
  return normalized.includes('take profit') || normalized.includes('тейк');
};

const buildRiskInputMessage = (field) => {
  const messages = [];
  const directionMessage = riskInputViolationMessage?.value;
  const isRu = locale.value === 'ru';

  if (isRiskMessageForField(directionMessage, field)) messages.push(directionMessage);

  if (field === 'stopLoss' && violatesRiskPerTrade.value) {
    const risk = activeRiskManagement.value;
    const isPercentLimit = risk.riskPerTradeUnit === '%';
    const actual = isPercentLimit ? `${formatRiskValue(actualRiskPercent.value)}%` : `$${formatRiskValue(actualRiskDollars.value)}`;
    const limit = isPercentLimit ? `${formatRiskValue(risk.riskPerTradeValue)}%` : `$${formatRiskValue(activeRiskPerTradeDollars.value)}`;
    messages.push(isRu
      ? `Риск на сделку превышен: ${actual} / ${limit}`
      : `Per-trade risk exceeded: ${actual} / ${limit}`);
  }

  if (field === 'takeProfit' && violatesRR.value) {
    const required = Number(activeRiskManagement.value.riskRewardRatio);
    messages.push(isRu
      ? `Соотношение R:R ниже установленного: ${formatRiskValue(actualRR.value)} / ${formatRiskValue(required)}`
      : `R:R is below the configured minimum: ${formatRiskValue(actualRR.value)} / ${formatRiskValue(required)}`);
  }

  return messages.join(' ');
};

const stopLossRiskMessage = computed(() => buildRiskInputMessage('stopLoss'));
const takeProfitRiskMessage = computed(() => buildRiskInputMessage('takeProfit'));
const tradeTimeStyleMessage = computed(() => {
  if (!violatesTradingStyleDuration.value) return '';
  const isRu = locale.value === 'ru';
  const actual = actualTradeDurationLabel.value;
  const required = requiredTradingStyleDurationLabel.value;
  return isRu
    ? `Длительность сделки не соответствует стилю торговли: ${actual} / требуется ${required}`
    : `Trade duration does not match the trading style: ${actual} / required ${required}`;
});

const isCreatingNote = ref(false);
const isPreviewMode = ref(false);
const noteText = ref("");
const noteTextArea = ref(null);
const editingContentNoteId = ref(null);
const expandedNoteIds = ref([]);
const editingNoteId = ref(null);
const editNoteTitle = ref("");
const activeProjectionMode = ref('core');
const activeEntryFormTab = ref('main');

watch(showTradeSummary, (isVisible) => {
  activeEntryFormTab.value = isVisible ? 'summary' : 'main';
});

const startEditContent = (note) => {
  editingContentNoteId.value = note.id;
  noteText.value = note.content || "";
  isCreatingNote.value = true;
  isPreviewMode.value = false;
};

const cancelNoteEdit = () => {
  isCreatingNote.value = false;
  editingContentNoteId.value = null;
  noteText.value = "";
};

const toggleNote = (id) => {
  const index = expandedNoteIds.value.indexOf(id);
  if (index === -1) {
    expandedNoteIds.value.push(id);
  } else {
    expandedNoteIds.value.splice(index, 1);
  }
};

const startEditNote = (note, event) => {
  event.stopPropagation();
  editingNoteId.value = note.id;
  editNoteTitle.value = note.title || (locale.value === 'ru' ? "АРХИВНАЯ_ЗАПИСЬ" : "ARCHIVED_RECORD");
};

const saveNoteTitle = (noteId) => {
  if (editingNoteId.value === noteId) {
    const n = notesList.value.find(n => n.id === noteId);
    if (n) n.title = editNoteTitle.value;
    editingNoteId.value = null;
  }
};

const insertFormatting = (prefix, suffix = "") => {
  if (!noteTextArea.value) return;
  const el = noteTextArea.value;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const text = el.value;
  const before = text.substring(0, start);
  const selection = text.substring(start, end);
  const after = text.substring(end);

  noteText.value = before + prefix + (selection || "") + suffix + after;
  
  setTimeout(() => {
    el.focus();
    const newCursorPos = start + prefix.length + (selection ? selection.length + suffix.length : 0);
    el.setSelectionRange(newCursorPos, newCursorPos);
  }, 0);
};

const formatNote = (content) => {
  if (!content) return "";
  
  let processedContent = content.replace(/\[VISUAL_REF:(\d+)\]/gim, (match, idxStr) => {
    const idx = parseInt(idxStr);
    const img = journalEntries.value?.[idx];
    if (img && img.image) {
      const name = img.name || `Visual_Node_${idx}`;
      return `<div class="my-4 bg-black/5 dark:bg-white/5 p-2 relative group"><img src="${img.image}" alt="${name}" class="max-w-full h-auto object-contain max-h-[400px] w-full" /><div class="absolute bottom-4 left-4 nier-bg-panel px-2 py-1 text-[8px] font-mono opacity-80 uppercase tracking-widest shadow-lg">${name}</div></div>`;
    }
    return match;
  });

  return processedContent
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-black uppercase tracking-widest mt-4 mb-2 nier-text-primary">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-black uppercase tracking-[0.2em] mt-6 mb-3 nier-text-primary border-b nier-border-primary pb-1">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black uppercase tracking-[0.4em] mt-8 mb-4 nier-text-primary border-b-2 border-black/20 dark:border-white/20 pb-2">$1</h1>')
    .replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-black/20 dark:border-white/20 pl-6 my-4 italic opacity-80">$1</blockquote>')
    .replace(/^\- (.*$)/gim, '<li class="ml-6 list-disc opacity-80">$1</li>')
    .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
    .replace(/\*(.*?)\*/gim, '<i>$1</i>')
    .replace(/\~\~(.*?)\~\~/gim, '<u>$1</u>')
    .replace(/\[color\=(.*?)\](.*?)\[\/color\]/gim, '<span style="color: $1">$2</span>')
    .replace(/\n/gim, '<br />');
};

const persistNote = () => {
  if (!noteText.value.trim()) return;
  if (editingContentNoteId.value) {
    const n = notesList.value.find(n => n.id === editingContentNoteId.value);
    if (n) n.content = noteText.value;
  } else {
    notesList.value.push({
      id: `note_${Date.now()}`,
      content: noteText.value,
      date: new Date().toISOString(),
      title: `SESSION_LOG_${notesList.value.length + 1}`
    });
  }
  noteText.value = "";
  isCreatingNote.value = false;
  editingContentNoteId.value = null;
};

const formatDateTactical = (dateStr) => {
  if (!dateStr) return 'DATE_UNASSIGNED';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'DATE_UNASSIGNED';

  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} // ${time}`;
};

const formatSummaryNumber = (value) => {
  if (value === undefined || value === null || value === '') return '--';
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString(locale.value === 'ru' ? 'ru-RU' : 'en-US', { maximumFractionDigits: 8 }) : String(value);
};

const formatSummaryMoney = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '--';
  const sign = number > 0 ? '+' : number < 0 ? '-' : '';
  return `${sign}$${Math.abs(number).toFixed(2)}`;
};

const formatSummaryPercent = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '--';
  const sign = number > 0 ? '+' : number < 0 ? '-' : '';
  return `${sign}${Math.abs(number).toFixed(2)}%`;
};

const summaryProfitPercent = (trade) => {
  if (!trade) return null;
  const profit = Number(trade.profitInCurrency);
  const capital = Number(trade.capitalBeforeTrade) > 0 ? Number(trade.capitalBeforeTrade) : Number(currentCapital.value);
  if (!Number.isFinite(profit) || !Number.isFinite(capital) || capital <= 0) return null;
  return (profit / capital) * 100;
};

const summaryDisplayTrade = computed(() => savedTradeSummary.value || {
  asset: asset.value,
  assetType: currentAssetData.value?.type,
  profitInCurrency: isClosed.value ? pnl.value : null,
  profitInPercent: null,
  capitalBeforeTrade: null,
  risk: actualRiskDollars.value,
  riskPercent: actualRiskPercent.value,
  riskReward: actualRR.value,
  tradeDuration: actualTradeDurationLabel.value
});

const formatSummaryRatio = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(2)}R` : '--';
};

const summaryProtocolGroups = computed(() => {
  const trade = savedTradeSummary.value;
  if (!trade) return [];

  return [
    { label: 'ВХОД', scenario: trade.boardScenarioEntry },
    { label: 'ВЫХОД', scenario: trade.boardScenarioExit }
  ].filter(group => group.scenario?.info).map(group => ({
    label: group.label,
    name: group.scenario.info.name || '--',
    conditions: Array.isArray(group.scenario.info.conditions) ? group.scenario.info.conditions : []
  }));
});
</script>

<template>
<!-- MIDDLE SECTION: TACTICAL MENUS OR JOURNAL -->
    <div class="w-full flex justify-center">
      <div class="w-full min-w-0 max-w-none pt-8 pb-12">
        <Transition name="sector-swap" mode="out-in">
          <div key="middle" class="flex flex-col space-y-12">
            <div v-if="viewMode === 'tactical'" class="contents">
            <div v-if="false" class="flex min-h-[calc(100dvh-4rem)] items-center justify-center text-white">
              <div class="w-full max-w-3xl px-6 sm:px-10 md:px-12 xl:px-16">
                <div class="flex flex-col gap-8">
                  <div class="flex items-end justify-between border-b border-white/10 pb-4">
                    <div>
                      <span class="block text-[9px] font-mono uppercase tracking-[0.45em] text-white/45">СОХРАНЕНО</span>
                      <h1 class="mt-2 text-2xl font-mono font-black uppercase tracking-[0.22em] text-white md:text-3xl">РЕЗЮМЕ СДЕЛКИ</h1>
                    </div>
                    <span class="text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">{{ savedTradeSummary.status || '--' }}</span>
                  </div>

                  <div class="flex flex-col divide-y divide-white/10 border-y border-white/10">
                    <div class="flex items-center justify-between gap-6 py-4">
                      <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">АКТИВ</span>
                      <span class="text-right text-sm font-mono font-black uppercase tracking-[0.18em] text-white">{{ savedTradeSummary.asset || '--' }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-6 py-4">
                      <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">НАПРАВЛЕНИЕ</span>
                      <span class="text-right text-sm font-mono font-black uppercase tracking-[0.18em] text-white">{{ savedTradeSummary.side || '--' }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-6 py-4">
                      <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">ТОЧКА ВХОДА</span>
                      <span class="text-right text-sm font-mono font-black tracking-[0.12em] text-white">{{ formatSummaryNumber(savedTradeSummary.entry) }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-6 py-4">
                      <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">ТОЧКА ВЫХОДА</span>
                      <span class="text-right text-sm font-mono font-black tracking-[0.12em] text-white">{{ formatSummaryNumber(savedTradeSummary.exit) }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-6 py-4">
                      <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">РАЗМЕР ПОЗИЦИИ</span>
                      <span class="text-right text-sm font-mono font-black tracking-[0.12em] text-white">{{ formatSummaryNumber(savedTradeSummary.size) }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-6 py-4">
                      <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">СТОП ЛОСС</span>
                      <span class="text-right text-sm font-mono font-black tracking-[0.12em] text-white">{{ formatSummaryNumber(savedTradeSummary.stopLoss) }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-6 py-4">
                      <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">ТЕЙК ПРОФИТ</span>
                      <span class="text-right text-sm font-mono font-black tracking-[0.12em] text-white">{{ formatSummaryNumber(savedTradeSummary.takeProfit) }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-6 py-4">
                      <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">ВРЕМЯ ВХОДА</span>
                      <span class="text-right text-sm font-mono font-black tracking-[0.12em] text-white">{{ formatDateTactical(savedTradeSummary.date) }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-6 py-4">
                      <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">ВРЕМЯ ВЫХОДА</span>
                      <span class="text-right text-sm font-mono font-black tracking-[0.12em] text-white">{{ savedTradeSummary.dateExit ? formatDateTactical(savedTradeSummary.dateExit) : '--' }}</span>
                    </div>
                    <div class="flex items-center justify-between gap-6 py-4">
                      <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">ЧАСОВОЙ ПОЯС</span>
                      <span class="text-right text-sm font-mono font-black tracking-[0.12em] text-white">{{ savedTradeSummary.timeZone || '--' }}</span>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="border border-white/10 p-5">
                      <span class="block text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">РЕЗУЛЬТАТ В $</span>
                      <span class="mt-3 block text-2xl font-mono font-black tracking-[0.12em]" :class="Number(savedTradeSummary.profitInCurrency) >= 0 ? 'text-white' : 'text-rose-400'">{{ formatSummaryMoney(savedTradeSummary.profitInCurrency) }}</span>
                    </div>
                    <div class="border border-white/10 p-5">
                      <span class="block text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">РЕЗУЛЬТАТ В %</span>
                      <span class="mt-3 block text-2xl font-mono font-black tracking-[0.12em]" :class="summaryProfitPercent(savedTradeSummary) >= 0 ? 'text-white' : 'text-rose-400'">{{ formatSummaryPercent(summaryProfitPercent(savedTradeSummary)) }}</span>
                    </div>
                  </div>

                  <div class="flex flex-col gap-4 border-t border-white/10 pt-6">
                    <div class="flex items-center justify-between gap-4">
                      <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">ПРОТОКОЛЫ И УСЛОВИЯ</span>
                      <span class="text-[9px] font-mono uppercase tracking-[0.18em] text-white/35">{{ selectedStrategy?.label || selectedStrategy?.name || savedTradeSummary.strategyId || '--' }}</span>
                    </div>
                    <div v-if="summaryProtocolGroups.length" class="flex flex-col gap-4">
                      <div v-for="group in summaryProtocolGroups" :key="group.label" class="flex flex-col gap-2">
                        <span class="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-white">{{ group.label }} // {{ group.name }}</span>
                        <div v-if="group.conditions.length" class="flex flex-col gap-1 pl-4">
                          <span v-for="condition in group.conditions" :key="condition.id" class="text-[9px] font-mono uppercase tracking-[0.12em] text-white/55">
                            {{ condition.info?.name || condition.name || condition.label || condition.id }}
                          </span>
                        </div>
                        <span v-else class="pl-4 text-[9px] font-mono uppercase tracking-[0.12em] text-white/35">УСЛОВИЯ НЕ ВЫБРАНЫ</span>
                      </div>
                    </div>
                    <span v-else class="text-[9px] font-mono uppercase tracking-[0.12em] text-white/35">ПРОТОКОЛЫ НЕ ВЫБРАНЫ</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="contents">
            <!-- CONDITION CONFIGURATION PANEL (LEGACY DESCRIPTION AESTHETIC) -->
            <div v-if="isArchivalBriefingEnabled && selectedRegistryScenarioId && selectedRegistryScenarioId !== 'default-exit-system'" class="flex flex-col space-y-12 animate-in fade-in zoom-in-95 duration-1000 max-w-5xl mx-auto">
               
               <!-- Protocol Briefing Header -->
               <div class="flex flex-col space-y-6 border-b border-black/5 dark:border-white/5 pb-10">
                  <div class="flex items-center gap-4">
                     <div class="w-2 h-2 nier-bg-inverted rotate-45"></div>
                     <span class="text-[9px] font-mono tracking-[0.6em] text-black/80 dark:text-white/80 uppercase">Archival_Briefing_Protocol</span>
                  </div>
                  
                  <div class="flex items-start justify-between">
                      <div class="flex flex-col space-y-4 max-w-2xl relative">
                        <!-- CINEMATIC ACCENT -->
                        <div class="absolute -left-10 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-black/20 dark:via-white/20 to-transparent"></div>
                        
                        <h1 class="text-3xl font-light font-serif tracking-[0.4em] drop-shadow-sm leading-relaxed">
                          {{ (entryScenarios.find(s => s.id === selectedRegistryScenarioId) || regularExitScenarios.find(s => s.id === selectedRegistryScenarioId))?.params?.customName || 'UNKNOWN_PROTOCOL' }}
                      </h1>
                        <p class="text-[11px] font-mono leading-relaxed opacity-60 uppercase tracking-[0.2em] max-w-xl">
                           {{ (entryScenarios.find(s => s.id === selectedRegistryScenarioId) || regularExitScenarios.find(s => s.id === selectedRegistryScenarioId))?.params?.description || 'No specialized mission description available for this protocol branch.' }}
                        </p>
                     </div>

                     <div class="flex flex-col items-end gap-6">
                        <div class="flex flex-col items-end">
                           <span class="text-[7px] font-mono opacity-20 uppercase tracking-widest">Protocol_Hash</span>
                           <span class="text-[9px] font-mono text-black/70 dark:text-white/80 uppercase tracking-tighter">0x{{ selectedRegistryScenarioId.slice(0, 8).toUpperCase() }}</span>
                        </div>
                        <button @click="showConditionLibrary = true; selectedRegistryScenarioId = null" 
                                class="group/save relative h-14 px-12 nier-bg-inverted dark:text-black  font-black border hover:border-black dark:hover:border-white dark:hover:bg-black hover:bg-white text-white dark:hover:text-white hover:text-black transition-all duration-500 ease-in-out">
                           <span class="relative z-10 text-[11px] uppercase tracking-[0.8em]">Accept </span>
                        </button>
                     </div>
                  </div>
               </div>

               <!-- Conditions Matrix (Hierarchical Tree) -->
               <div class="flex flex-col space-y-12">
                  <div class="flex items-center justify-between">
                     <span class="text-[10px] font-mono tracking-[0.4em] text-black/80 dark:text-white/75 uppercase">Tactical_Requirements_Chain</span>
                     <span class="text-[10px] font-mono text-black/80 dark:text-white/80 uppercase tracking-widest">{{ currentRegistryScenarioConditions.length }}_Root_Nodes</span>
                  </div>

                  <div v-if="currentRegistryScenarioConditions.length > 0" class="flex flex-col space-y-10">
                    <!-- Root Level: Conditions -->
                    <div v-for="cond in currentRegistryScenarioConditions" :key="cond.id"
                         class="flex flex-col space-y-4 group/cond">
                       
                       <!-- Condition Header (Non-clickable structural guide) -->
                       <div class="relative flex items-center justify-between p-4 border transition-all duration-500 overflow-hidden"
                            :class="[
                              'border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]',
                              mismatchedNodeIds.has(cond.id) ? '!border-red-500/30 !bg-red-500/5' : ''
                            ]">
                          
                          <div class="flex items-center gap-4 relative z-10">
                             <div class="flex flex-col items-center">
                                <div class="w-1.5 h-1.5 rotate-45 transition-colors duration-500"
                                     :class="mismatchedNodeIds.has(cond.id) ? 'bg-red-500' : 'bg-black/20 dark:bg-white/20'"></div>
                                <div class="w-px h-8 bg-black/5 dark:bg-white/5 mt-2"></div>
                             </div>
                             
                             <div class="flex flex-col">
                                <div class="flex items-center gap-3">
                                   <span class="text-xl font-serif italic tracking-[0.1em] uppercase transition-colors"
                                         :class="mismatchedNodeIds.has(cond.id) ? 'text-red-500' : 'text-black/80 dark:text-white/80'">
                                      {{ cond.name }}
                                   </span>
                                   <div v-if="cond.direction" 
                                        class="px-1.5 py-0.5 border text-[6px] font-mono tracking-widest uppercase transition-colors"
                                        :class="mismatchedNodeIds.has(cond.id) ? 'border-red-500/50 text-red-500' : 'nier-border-primary text-black/80 dark:text-white/80'">
                                      {{ cond.direction }}
                                   </div>
                                   <div v-if="cond.priority && cond.priority !== 'NONE'" 
                                        class="px-1.5 py-0.5 border text-[6px] font-mono tracking-widest uppercase transition-colors"
                                        :class="cond.priority === 'REQUIRED' ? 'border-red-500/50 text-red-500' : 'border-blue-500/50 text-blue-500'">
                                      {{ cond.priority }}
                                   </div>
                                </div>
                                <p class="text-[10px] font-mono uppercase tracking-widest opacity-40 max-w-xl transition-colors"
                                   :class="mismatchedNodeIds.has(cond.id) ? '!text-red-500/40' : ''">
                                   {{ mismatchedNodeIds.has(cond.id) ? '[ PROTOCOL_INCOMPATIBLE: DIRECTIONAL_VECTOR_MISMATCH ]' : (cond.description || 'Tactical requirement group.') }}
                                </p>
                             </div>
                          </div>

                          <div class="flex items-center gap-4 relative z-10 opacity-20">
                             <span class="text-[8px] font-mono font-black uppercase tracking-widest transition-colors"
                                   :class="mismatchedNodeIds.has(cond.id) ? 'text-red-500' : 'text-black/20 dark:text-white/75'">
                                {{ mismatchedNodeIds.has(cond.id) ? 'LOCKED' : 'CLUSTER_ROOT' }}
                             </span>
                          </div>
                       </div>

                          <!-- SELECTION GLOW -->
                          <div v-if="isConditionActive(cond.id, selectedRegistryScenarioId)" class="absolute inset-0 bg-black/[0.02] animate-pulse"></div>


                       <!-- Second Level: Logic Clusters & Indicators -->
                       <div v-if="cond.indicatorUnits && cond.indicatorUnits.length > 0" class="pl-12 flex flex-col space-y-3 border-l border-black/5 dark:border-white/5 ml-5">
                          <div v-for="(unit, uIdx) in cond.indicatorUnits" :key="uIdx" class="flex flex-col space-y-2">
                             
                             <!-- Logic Bundle Header -->
                             <template v-if="unit.type === 'bundle'">
                                <div class="flex items-center gap-2">
                                   <div class="w-1.5 h-[1px] bg-black/20 dark:bg-white/20"></div>
                                   <span class="text-[7px] font-mono tracking-[0.3em] text-black/80 dark:text-white/75 uppercase">{{ unit.logic }}_CLUSTER</span>
                                </div>
                                
                                <!-- Third Level: Nested Indicators -->
                                <div class="pl-6 grid grid-cols-2 gap-3">
                                   <div v-for="item in unit.items" :key="item.id"
                                        @click="toggleCondition(item.id, selectedRegistryScenarioId)"
                                        class="flex items-start gap-3 p-3 border transition-all cursor-pointer group/item overflow-hidden relative"
                                        :class="[
                                          isConditionActive(item.id, selectedRegistryScenarioId) ? 'nier-bg-inverted border-black dark:border-white' : 'bg-black/[0.01] dark:bg-white/[0.01] border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10',
                                          mismatchedNodeIds.has(item.id) ? '!border-red-500/20 !bg-red-500/5 !pointer-events-none' : ''
                                        ]">
                                      <div class="w-1 h-1 border rotate-45 mt-1.5 transition-colors"
                                           :class="[
                                             isConditionActive(item.id, selectedRegistryScenarioId) ? 'nier-bg-panel border-white dark:border-black' : 'border-black/20 dark:border-white/20 group-hover/item:bg-black/40 dark:group-hover/item:bg-white/40',
                                             mismatchedNodeIds.has(item.id) ? '!bg-red-500 !border-red-500' : ''
                                           ]"></div>
                                      <div class="flex flex-col relative z-10">
                                         <div class="flex items-center gap-2">
                                            <span class="text-[9px] font-mono font-bold tracking-widest uppercase transition-colors"
                                                  :class="[
                                                    isConditionActive(item.id, selectedRegistryScenarioId) ? 'nier-text-primary' : 'text-black/80 dark:text-white/90 group-hover/item:text-black dark:group-hover/item:text-white',
                                                    mismatchedNodeIds.has(item.id) ? '!text-red-500' : ''
                                                  ]">{{ item.label }}</span>
                                            <span v-if="item.priority && item.priority !== 'NONE'" 
                                                  class="px-1 py-0.5 text-[6px] font-mono tracking-widest uppercase border"
                                                  :class="item.priority === 'REQUIRED' ? 'border-red-500/50 text-red-500' : 'border-blue-500/50 text-blue-500'">
                                              {{ item.priority }}
                                            </span>
                                         </div>
                                         <span class="text-[9px] font-mono uppercase tracking-tighter truncate transition-colors"
                                               :class="isConditionActive(item.id, selectedRegistryScenarioId) ? 'text-white/40 dark:text-black/40' : 'text-black/60 dark:text-white/75'">{{ item.description || 'No telemetry.' }}</span>
                                      </div>
                                      <div v-if="isConditionActive(item.id, selectedRegistryScenarioId)" class="absolute inset-0 bg-black/[0.02] animate-pulse"></div>
                                   </div>
                                </div>
                             </template>

                             <!-- Isolated Indicator -->
                             <template v-else>
                                <div @click="toggleCondition(unit.item.id, selectedRegistryScenarioId)"
                                     class="flex items-start gap-3 p-3 border transition-all cursor-pointer group/item w-1/2 overflow-hidden relative"
                                     :class="[
                                       isConditionActive(unit.item.id, selectedRegistryScenarioId) ? 'nier-bg-inverted border-black dark:border-white' : 'bg-black/[0.01] dark:bg-white/[0.01] border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10',
                                       mismatchedNodeIds.has(unit.item.id) ? '!border-red-500/20 !bg-red-500/5 !pointer-events-none' : ''
                                     ]">
                                   <div class="w-1 h-1 border rotate-45 mt-1.5 transition-colors"
                                        :class="[
                                          isConditionActive(unit.item.id, selectedRegistryScenarioId) ? 'nier-bg-panel border-white dark:border-black' : 'border-black/20 dark:border-white/20 group-hover/item:bg-black/40 dark:group-hover/item:bg-white/40',
                                          mismatchedNodeIds.has(unit.item.id) ? '!bg-red-500 !border-red-500' : ''
                                        ]"></div>
                                   <div class="flex flex-col flex-1 min-w-0 relative z-10">
                                      <div class="flex items-center justify-between w-full">
                                         <div class="flex items-center gap-2">
                                            <span class="text-[9px] font-mono font-black tracking-widest uppercase transition-colors"
                                                  :class="[
                                                    isConditionActive(unit.item.id, selectedRegistryScenarioId) ? 'nier-text-primary' : 'text-black/80 dark:text-white/90 group-hover/item:text-black dark:group-hover/item:text-white',
                                                    mismatchedNodeIds.has(unit.item.id) ? '!text-red-500' : ''
                                                  ]">{{ unit.item.label }}</span>
                                            <span v-if="unit.item.priority && unit.item.priority !== 'NONE'" 
                                                  class="px-1 py-0.5 text-[6px] font-mono tracking-widest uppercase border"
                                                  :class="unit.item.priority === 'REQUIRED' ? 'border-red-500/50 text-red-500' : 'border-blue-500/50 text-blue-500'">
                                              {{ unit.item.priority }}
                                            </span>
                                         </div>
                                         <span v-if="unit.item.direction" class="text-[6px] font-mono uppercase tracking-widest transition-colors"
                                               :class="isConditionActive(unit.item.id, selectedRegistryScenarioId) ? 'text-white/40 dark:text-black/40' : 'text-amber-500/30'">{{ unit.item.direction }}</span>
                                      </div>
                                      <span class="text-[9px] font-mono uppercase tracking-tighter truncate mt-0.5 transition-colors"
                                            :class="isConditionActive(unit.item.id, selectedRegistryScenarioId) ? 'text-white/40 dark:text-black/40' : 'text-black/60 dark:text-white/75'">{{ unit.item.description || 'Primary indicator.' }}</span>
                                   </div>
                                   <div v-if="isConditionActive(unit.item.id, selectedRegistryScenarioId)" class="absolute inset-0 bg-black/[0.02] animate-pulse"></div>
                                </div>
                             </template>

                          </div>
                       </div>
                    </div>
                  </div>
                  <div v-else class="flex flex-col items-center justify-center py-24 border border-dashed border-white/5 opacity-20">
                     <span class="text-[10px] font-mono tracking-[0.4em] uppercase">No_Checkpoints_Detected</span>
                  </div>
               </div>

               <!-- Footer Metadata -->
               <div class="flex items-center justify-between pt-10 border-t border-white/5 opacity-20">
                  <span class="text-[7px] font-mono tracking-widest uppercase">System_State: {{ viewMode.toUpperCase() }}</span>
                  <div class="flex gap-4">
                     <span class="text-[7px] font-mono tracking-widest uppercase">Encryption: AES_256</span>
                     <span class="text-[7px] font-mono tracking-widest uppercase">Lattice: v1.0.42</span>
                     <!-- DEBUG UI -->
                     <span class="text-[7px] font-mono tracking-widest uppercase text-red-400">DEBUG_STRAT: {{ selectedStrategyId }} | HIST: {{ equityCurveTrades.length }}</span>
                  </div>
               </div>
            </div>

             <!-- TACTICAL EQUITY PROJECTION (Replaced Void) -->
             <div v-else class="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
                <div class="relative mx-auto flex h-[clamp(600px,69.6vh,768px)] w-full max-w-[1560px] flex-col items-center justify-center border-transparent bg-transparent group z-10">
                <div v-show="activeProjectionMode === 'core'" class="absolute inset-0 flex items-start justify-start overflow-y-auto overflow-x-hidden custom-scrollbar p-10 text-left text-white">
                  <div class="w-full px-6 sm:px-10 md:px-12 xl:px-16 2xl:px-20">
                    <div class="flex w-full max-w-4xl flex-col items-start gap-14">
                    <div class="flex w-full items-center justify-start gap-2 border-b border-white/10 pb-3">
                      <button
                        type="button"
                        class="border px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] transition-colors"
                        :class="activeEntryFormTab === 'main' ? 'border-white bg-white text-black' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'"
                        @click="activeEntryFormTab = 'main'"
                      >
                        ОСНОВНЫЕ
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 border px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] transition-colors"
                        :class="activeEntryFormTab === 'risk' ? 'border-white bg-white text-black' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'"
                        @click="activeEntryFormTab = 'risk'"
                      >
                        РИСК-МЕНЕДЖМЕНТ
                        <span v-if="stopLossRiskMessage || takeProfitRiskMessage" class="shrink-0 font-mono text-[13px] font-black leading-none text-rose-500" aria-label="Есть ошибка риск-менеджмента">!</span>
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 border px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] transition-colors"
                        :class="activeEntryFormTab === 'time' ? 'border-white bg-white text-black' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'"
                        @click="activeEntryFormTab = 'time'"
                      >
                        ВРЕМЯ
                        <span v-if="tradeTimeStyleMessage" class="shrink-0 font-mono text-[13px] font-black leading-none text-rose-500" aria-label="Есть ошибка длительности сделки">!</span>
                      </button>
                      <button
                        type="button"
                        class="border px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] transition-colors"
                        :class="activeEntryFormTab === 'summary' ? 'border-white bg-white text-black' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'"
                        @click="activeEntryFormTab = 'summary'"
                      >
                        РЕЗЮМЕ
                      </button>
                    </div>

                    <section v-if="activeEntryFormTab === 'main'" class="flex flex-col items-start gap-5">
                      <div class="text-[10px] font-mono font-black uppercase tracking-[0.6em] text-white/45">I.</div>
                      <h1 class="text-2xl font-mono font-black uppercase tracking-[0.22em] text-white md:text-3xl">Актив и направление</h1>
                      <div class="grid w-full max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2">
                        <div class="asset-select-container relative flex w-full flex-col items-start gap-2">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">Актив</span>
                          <button type="button" class="flex h-10 w-full items-center gap-3 border-b border-white/20 bg-transparent text-left font-mono text-sm uppercase tracking-[0.18em] text-white outline-none transition-colors hover:border-white/80" @click="showAssetMenu = true">
                            <span v-if="asset && currentAssetData?.type === 'Forex' && getForexCurrencyPair(currentAssetData.symbol)" class="relative flex h-6 w-6 shrink-0 items-center">
                              <img :src="getForexCurrencyPair(currentAssetData.symbol).base" alt="" class="absolute left-0 top-0 z-10 h-[68%] w-[68%] rounded-full object-cover" />
                              <img :src="getForexCurrencyPair(currentAssetData.symbol).quote" alt="" class="absolute bottom-0 right-0 h-[68%] w-[68%] rounded-full object-cover" />
                            </span>
                            <span v-else-if="asset && currentAssetData?.icon && !failedIcons.has(currentAssetData.symbol)" class="flex h-5 w-5 shrink-0 items-center justify-center">
                              <img :src="currentAssetData.icon" :alt="currentAssetData.symbol" class="h-full w-full object-contain" @error="handleIconError(currentAssetData.symbol)" />
                            </span>
                            <span v-else-if="asset" class="flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-black" :class="isDark ? 'text-white' : 'text-black'">
                              {{ currentAssetData?.symbol?.[0] || asset?.[0] || '' }}
                            </span>
                            <span :class="asset ? 'text-white' : 'text-white/40'">{{ asset || 'Выберите актив' }}</span>
                          </button>

                          <Teleport to="body">
                            <Transition name="nier-fade">
                              <div v-if="showAssetMenu" class="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 px-6" @click.self="showAssetMenu = false">
                                <div class="flex h-[500px] max-h-[80vh] w-[800px] max-w-[95vw] flex-col bg-[#0a0a0a] text-white shadow-2xl" @click.stop>
                                  <div class="shrink-0 border-b border-white/10 p-6">
                                    <input v-model="assetSearch" type="search" placeholder="ПОИСК_АКТИВОВ..." class="w-full bg-transparent text-xl font-black uppercase tracking-widest text-white outline-none placeholder:text-white/20" autofocus />
                                  </div>
                                  <div class="flex-1 overflow-y-auto custom-scrollbar">
                                    <button v-for="assetOption in filteredAssets" :key="assetOption.symbol" type="button" class="grid w-full grid-cols-[9rem_minmax(0,1fr)] items-center gap-4 border-b border-white/5 px-6 py-4 text-left transition-colors hover:bg-white/10" @click="selectAsset(assetOption)">
                                      <span class="flex min-w-0 items-center gap-3">
                                        <span v-if="assetOption.type === 'Forex' && getForexCurrencyPair(assetOption.symbol)" class="relative flex h-7 w-7 shrink-0 items-center">
                                          <img :src="getForexCurrencyPair(assetOption.symbol).base" alt="" class="absolute left-0 top-0 z-10 h-[68%] w-[68%] rounded-full object-cover" />
                                          <img :src="getForexCurrencyPair(assetOption.symbol).quote" alt="" class="absolute bottom-0 right-0 h-[68%] w-[68%] rounded-full object-cover" />
                                        </span>
                                        <span v-else-if="assetOption.icon && !failedIcons.has(assetOption.symbol)" class="flex h-7 w-7 shrink-0 items-center justify-center">
                                          <img :src="assetOption.icon" :alt="assetOption.symbol" class="h-full w-full object-contain" @error="handleIconError(assetOption.symbol)" />
                                        </span>
                                        <span v-else class="flex h-7 w-7 shrink-0 items-center justify-center border text-xs font-black" :class="isDark ? 'border-white/20 text-white' : 'border-black/20 text-black'">
                                          {{ assetOption.symbol?.[0] || '' }}
                                        </span>
                                        <span class="truncate text-sm font-black tracking-widest">{{ assetOption.symbol }}</span>
                                      </span>
                                      <span class="min-w-0">
                                        <span class="block truncate text-[10px] uppercase tracking-widest text-white/80">{{ assetOption.name }}</span>
                                        <span class="block truncate text-[8px] uppercase tracking-widest text-white/35">{{ assetOption.description }}</span>
                                      </span>
                                    </button>
                                    <div v-if="filteredAssets.length === 0" class="flex h-full items-center justify-center text-[10px] uppercase tracking-widest text-white/30">Активы не найдены</div>
                                  </div>
                                </div>
                              </div>
                            </Transition>
                          </Teleport>
                        </div>
                        <div class="flex flex-col items-start gap-2">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">Направление</span>
                          <div class="flex">
                            <button
                              type="button"
                              class="border border-white/20 px-5 py-2 font-mono text-[11px] font-black uppercase tracking-[0.2em] transition-colors"
                              :class="side === 'long' ? 'bg-white text-black' : 'text-white/50 hover:text-white'"
                              @click="side = 'long'"
                            >
                              LONG
                            </button>
                            <button
                              type="button"
                              class="-ml-px border border-white/20 px-5 py-2 font-mono text-[11px] font-black uppercase tracking-[0.2em] transition-colors"
                              :class="side === 'short' ? 'bg-white text-black' : 'text-white/50 hover:text-white'"
                              @click="side = 'short'"
                            >
                              SHORT
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section v-if="activeEntryFormTab === 'main'" class="flex flex-col items-start gap-5">
                      <div class="text-[10px] font-mono font-black uppercase tracking-[0.6em] text-white/45">II.</div>
                      <h2 class="text-2xl font-mono font-black uppercase tracking-[0.22em] text-white md:text-3xl">Точка входа, выхода и размер позиции</h2>
                      <div class="grid w-full max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
                        <label class="flex flex-col items-start gap-2">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">Точка входа</span>
                          <input v-model="entry" type="text" inputmode="decimal" placeholder="0.00" class="w-full border-b border-white/20 bg-transparent px-0 py-2 font-mono text-sm tracking-[0.18em] text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/80" @input="sanitizeTradeNumberInput($event, 'entry')" />
                        </label>
                        <label class="flex flex-col items-start gap-2">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">Точка выхода</span>
                          <input v-model="exit" type="text" inputmode="decimal" placeholder="0.00" :disabled="!isClosed" class="w-full border-b border-white/20 bg-transparent px-0 py-2 font-mono text-sm tracking-[0.18em] text-white outline-none transition-colors placeholder:text-white/30 disabled:cursor-not-allowed disabled:opacity-30 focus:border-white/80" @input="sanitizeTradeNumberInput($event, 'exit')" />
                        </label>
                        <label class="flex flex-col items-start gap-2">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">Размер позиции</span>
                          <input v-model="size" type="text" inputmode="decimal" placeholder="0.00" class="w-full border-b border-white/20 bg-transparent px-0 py-2 font-mono text-sm tracking-[0.18em] text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/80" @input="sanitizeTradeNumberInput($event, 'size')" />
                        </label>
                      </div>
                    </section>

                    <section v-if="activeEntryFormTab === 'risk'" class="flex flex-col items-start gap-5">
                      <div class="text-[10px] font-mono font-black uppercase tracking-[0.6em] text-white/45">III.</div>
                      <h2 class="text-2xl font-mono font-black uppercase tracking-[0.22em] text-white md:text-3xl">Стоп лосс и тейк профит</h2>
                      <div class="grid w-full max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2">
                        <label class="group/risk relative flex flex-col items-start gap-2">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">Стоп лосс</span>
                          <input v-model="stopLoss" type="text" inputmode="decimal" placeholder="0.00" :aria-invalid="!!stopLossRiskMessage" class="w-full border-b border-white/20 bg-transparent px-0 py-2 font-mono text-sm tracking-[0.18em] text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/80" :class="stopLossRiskMessage ? '!border !border-rose-500/80 !pl-3 !text-rose-300 placeholder:!text-rose-300/30 focus:!border-rose-400' : ''" @input="sanitizeTradeNumberInput($event, 'stopLoss')" />
                          <span v-if="stopLossRiskMessage" class="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden max-w-[320px] border border-rose-500/40 bg-[#0a0a0a] py-2 pl-4 pr-3 font-mono text-[8px] font-bold uppercase leading-relaxed tracking-[0.12em] text-rose-300 shadow-lg group-hover/risk:block group-focus-within/risk:block">{{ stopLossRiskMessage }}</span>
                        </label>
                        <label class="group/risk relative flex flex-col items-start gap-2">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">Тейк профит</span>
                          <input v-model="takeProfit" type="text" inputmode="decimal" placeholder="0.00" class="w-full border-b border-white/20 bg-transparent px-0 py-2 font-mono text-sm tracking-[0.18em] text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/80" :class="takeProfitRiskMessage ? '!border !border-rose-500/80 !pl-3 !text-rose-300 placeholder:!text-rose-300/30 focus:!border-rose-400' : ''" @input="sanitizeTradeNumberInput($event, 'takeProfit')" />
                          <span v-if="takeProfitRiskMessage" class="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden max-w-[320px] border border-rose-500/40 bg-[#0a0a0a] py-2 pl-4 pr-3 font-mono text-[8px] font-bold uppercase leading-relaxed tracking-[0.12em] text-rose-300 shadow-lg group-hover/risk:block group-focus-within/risk:block">{{ takeProfitRiskMessage }}</span>
                        </label>
                      </div>
                    </section>

                    <section v-if="activeEntryFormTab === 'time'" class="flex flex-col items-start gap-5">
                      <div class="text-[10px] font-mono font-black uppercase tracking-[0.6em] text-white/45">IV.</div>
                      <h2 class="text-2xl font-mono font-black uppercase tracking-[0.22em] text-white md:text-3xl">Время входа и выхода, часовой пояс</h2>
                      <div class="grid w-full max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
                        <label class="group/risk relative flex flex-col items-start gap-2">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">Время входа</span>
                          <input readonly type="text" :value="`${formatPart(openDate, 'year')}.${formatPart(openDate, 'month')}.${formatPart(openDate, 'day')} ${formatPart(openDate, 'hour')}:${formatPart(openDate, 'minute')}`" class="w-full cursor-pointer border-b border-white/20 bg-transparent px-0 py-2 font-mono text-sm tracking-[0.18em] text-white outline-none transition-colors focus:border-white/80" :class="tradeTimeStyleMessage ? '!border !border-rose-500/80 !pl-3 !text-rose-300 focus:!border-rose-400' : ''" @click="openTemporal('open')" />
                          <span v-if="tradeTimeStyleMessage" class="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden max-w-[320px] border border-rose-500/40 bg-[#0a0a0a] py-2 pl-4 pr-3 font-mono text-[8px] font-bold uppercase leading-relaxed tracking-[0.12em] text-rose-300 shadow-lg group-hover/risk:block group-focus-within/risk:block">{{ tradeTimeStyleMessage }}</span>
                        </label>
                        <label class="group/risk relative flex flex-col items-start gap-2">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">Время выхода</span>
                          <input readonly type="text" :value="isClosed ? `${formatPart(exitDate, 'year')}.${formatPart(exitDate, 'month')}.${formatPart(exitDate, 'day')} ${formatPart(exitDate, 'hour')}:${formatPart(exitDate, 'minute')}` : '--'" :disabled="!isClosed" class="w-full cursor-pointer border-b border-white/20 bg-transparent px-0 py-2 font-mono text-sm tracking-[0.18em] text-white outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-30 focus:border-white/80" :class="tradeTimeStyleMessage ? '!border !border-rose-500/80 !pl-3 !text-rose-300 focus:!border-rose-400' : ''" @click="isClosed && openTemporal('exit')" />
                          <span v-if="tradeTimeStyleMessage" class="pointer-events-none absolute left-0 top-full z-50 mt-2 hidden max-w-[320px] border border-rose-500/40 bg-[#0a0a0a] py-2 pl-4 pr-3 font-mono text-[8px] font-bold uppercase leading-relaxed tracking-[0.12em] text-rose-300 shadow-lg group-hover/risk:block group-focus-within/risk:block">{{ tradeTimeStyleMessage }}</span>
                        </label>
                        <label class="flex flex-col items-start gap-2">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">Часовой пояс</span>
                          <input readonly type="text" :value="`${tradeTimeZone} ${tradeTimeZoneOffset || ''}`.trim()" class="w-full cursor-pointer border-b border-white/20 bg-transparent px-0 py-2 font-mono text-sm tracking-[0.18em] text-white outline-none transition-colors focus:border-white/80" @click="openTemporal('open')" />
                        </label>
                      </div>
                    </section>

                    <section v-if="activeEntryFormTab === 'summary'" class="flex flex-col items-start gap-8">
                      <div class="text-[10px] font-mono font-black uppercase tracking-[0.6em] text-white/45">V.</div>
                      <h2 class="text-2xl font-mono font-black uppercase tracking-[0.22em] text-white md:text-3xl">Резюме</h2>
                      <div class="flex w-full max-w-none flex-wrap gap-y-6">
                        <div class="basis-1/2 min-w-0 pr-6 sm:basis-1/4">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">Актив</span>
                          <span class="mt-2 flex items-center gap-3 text-xl font-mono font-black uppercase tracking-[0.16em] text-white">
                            <span v-if="summaryDisplayTrade.assetType === 'Forex' && getForexCurrencyPair(summaryDisplayTrade.asset)" class="relative flex h-7 w-7 shrink-0 items-center">
                              <img :src="getForexCurrencyPair(summaryDisplayTrade.asset).base" alt="" class="absolute left-0 top-0 z-10 h-[68%] w-[68%] rounded-full object-cover" />
                              <img :src="getForexCurrencyPair(summaryDisplayTrade.asset).quote" alt="" class="absolute bottom-0 right-0 h-[68%] w-[68%] rounded-full object-cover" />
                            </span>
                            <span v-else-if="currentAssetData?.icon && !failedIcons.has(summaryDisplayTrade.asset)" class="flex h-6 w-6 shrink-0 items-center justify-center">
                              <img :src="currentAssetData.icon" :alt="summaryDisplayTrade.asset" class="h-full w-full object-contain" />
                            </span>
                            <span v-else class="flex h-6 w-6 shrink-0 items-center justify-center text-sm">
                              {{ summaryDisplayTrade.asset?.[0] || '' }}
                            </span>
                            {{ summaryDisplayTrade.asset || '--' }}
                          </span>
                        </div>
                        <div class="basis-1/2 min-w-0 pr-6 sm:basis-1/4">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">Результат по сделке</span>
                          <span class="mt-2 block text-xl font-mono font-black tracking-[0.12em]" :class="Number(summaryDisplayTrade.profitInCurrency) >= 0 ? 'text-white' : 'text-rose-400'">
                            {{ formatSummaryMoney(summaryDisplayTrade.profitInCurrency) }} / {{ formatSummaryPercent(summaryProfitPercent(summaryDisplayTrade)) }}
                          </span>
                        </div>
                        <div class="basis-1/2 min-w-0 pr-6 sm:basis-1/4">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">ДЛИТЕЛЬНОСТЬ СДЕЛКИ</span>
                          <span class="mt-2 block text-xl font-mono font-black tracking-[0.12em] text-white">{{ summaryDisplayTrade.tradeDuration || '--' }}</span>
                        </div>
                        <div class="basis-1/2 min-w-0 pr-6 sm:basis-1/4">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">РИСК / КАПИТАЛ</span>
                          <span class="mt-2 block text-xl font-mono font-black tracking-[0.12em] text-white">{{ formatSummaryPercent(summaryDisplayTrade.riskPercent) }}</span>
                        </div>
                        <div class="basis-1/2 min-w-0 pr-6 sm:basis-1/4">
                          <span class="text-[9px] font-mono uppercase tracking-[0.35em] text-white/45">RISK / REWARD</span>
                          <span class="mt-2 block text-xl font-mono font-black tracking-[0.12em] text-white">{{ formatSummaryRatio(summaryDisplayTrade.riskReward) }}</span>
                        </div>
                      </div>
                    </section>
                    </div>
                  </div>
                </div>

                <div
                  v-show="activeProjectionMode === 'chart'"
                  class="absolute inset-0 h-full w-full"
                  :class="activeProjectionMode === 'chart' ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'"
                >
                  <div class="h-full w-full p-10">
                    <div class="relative h-full w-full px-6 sm:px-10 md:px-12 xl:px-16 2xl:px-20">
                      <ExTradeEntryStudyMetricsPanel surface="chart" :visible="activeProjectionMode === 'chart'" />
                    </div>
                  </div>
                </div>

                <div
                  v-show="activeProjectionMode === 'projection'"
                  class="absolute inset-0 h-full w-full transition-opacity duration-300"
                  :class="activeProjectionMode === 'projection' ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'"
                >
                  <div class="h-full w-full p-10">
                    <div class="relative h-full w-full px-6 sm:px-10 md:px-12 xl:px-16 2xl:px-20">
                      <div v-if="hasValidProjection" class="absolute inset-0 h-full w-full">
                        <ExEquityCurve2D :trades="equityCurveTrades" :initial-balance="1000" />
                      </div>
                      <div v-else class="flex h-full flex-col items-center justify-center py-20 opacity-20">
                        <div class="w-16 h-px nier-bg-inverted mb-8 group-hover:w-24 transition-all duration-700"></div>
                        <span class="text-[9px] font-mono tracking-[0.6em] uppercase nier-text-primary">NOT_ENOUGH_DATA_FOR_PROJECTION</span>
                        <div class="mt-8 flex gap-2">
                          <div v-for="i in 3" :key="i" class="w-1 h-1 bg-black/20 dark:bg-white/20 rotate-45"></div>
                        </div>
                     </div>
                    </div>
                  </div>
                </div>

                <div class="absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 items-center border border-black/10 bg-theme-bg shadow-[0_12px_30px_rgba(0,0,0,0.08)] dark:border-white/10">
                  <button
                    type="button"
                    :aria-label="locale === 'ru' ? 'Основные данные сделки' : 'Trade details'"
                    class="grid h-11 w-12 place-items-center border-r border-black/10 transition-colors dark:border-white/10"
                    :class="activeProjectionMode === 'core' ? 'nier-bg-inverted nier-text-primary' : 'nier-text-primary opacity-45 hover:opacity-100'"
                    @click="activeProjectionMode = 'core'"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" stroke-width="1.7" />
                      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    :aria-label="locale === 'ru' ? 'Проекция' : 'Projection'"
                    class="grid h-11 w-12 place-items-center border-r border-black/10 transition-colors dark:border-white/10"
                    :class="activeProjectionMode === 'projection' ? 'nier-bg-inverted nier-text-primary' : 'nier-text-primary opacity-45 hover:opacity-100'"
                    @click="activeProjectionMode = 'projection'"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M4 17l4-5 4 3 5-8 3 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter" />
                      <path d="M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    :aria-label="locale === 'ru' ? 'График' : 'Chart'"
                    class="grid h-11 w-12 place-items-center transition-colors"
                    :class="activeProjectionMode === 'chart' ? 'nier-bg-inverted nier-text-primary' : 'nier-text-primary opacity-45 hover:opacity-100'"
                    @click="activeProjectionMode = 'chart'"
                  >
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M7 4v16M17 4v16" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" />
                      <path d="M5 8h4v7H5zM15 6h4v10h-4z" fill="currentColor" />
                    </svg>
                  </button>
                </div>
               </div>
             </div>
            </div>
          </div>

          <div v-else key="journal" class="flex min-h-[calc(100dvh-4rem)] items-center justify-center">
            <div class="relative mx-auto flex h-[clamp(600px,69.6vh,768px)] w-full max-w-[1560px] flex-col border-transparent bg-transparent">
              <div class="absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 items-center border border-black/10 bg-theme-bg shadow-[0_12px_30px_rgba(0,0,0,0.08)] dark:border-white/10">
                <button type="button" disabled aria-disabled="true" aria-label="Основные данные сделки" class="grid h-11 w-12 cursor-not-allowed place-items-center border-r border-black/10 transition-colors dark:border-white/10" :class="activeProjectionMode === 'core' ? 'nier-bg-inverted nier-text-primary' : 'nier-text-primary opacity-45'">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" stroke-width="1.7" />
                    <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" />
                  </svg>
                </button>
                <button type="button" disabled aria-disabled="true" aria-label="Проекция" class="grid h-11 w-12 cursor-not-allowed place-items-center border-r border-black/10 transition-colors dark:border-white/10" :class="activeProjectionMode === 'projection' ? 'nier-bg-inverted nier-text-primary' : 'nier-text-primary opacity-45'">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 17l4-5 4 3 5-8 3 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="miter" />
                    <path d="M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" />
                  </svg>
                </button>
                <button type="button" disabled aria-disabled="true" aria-label="График" class="grid h-11 w-12 cursor-not-allowed place-items-center transition-colors" :class="activeProjectionMode === 'chart' ? 'nier-bg-inverted nier-text-primary' : 'nier-text-primary opacity-45'">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 4v16M17 4v16" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" />
                    <path d="M5 8h4v7H5zM15 6h4v10h-4z" fill="currentColor" />
                  </svg>
                </button>
              </div>
              <div class="flex h-full w-full flex-col space-y-8 overflow-y-auto custom-scrollbar p-10 nier-text-primary">
                <div class="w-full px-6 sm:px-10 md:px-12 xl:px-16 2xl:px-20">
              <div class="flex w-full items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div class="flex items-center space-x-4">
                <div class="flex items-center gap-2">
                   <button @click="archiveMode = 'notes'" 
                           class="border px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] transition-colors"
                           :class="archiveMode === 'notes' ? 'border-white bg-white text-black' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'">
                      {{ locale === 'ru' ? 'ЗАМЕТКИ' : 'NOTES' }}
                   </button>
                   <button @click="archiveMode = 'images'" 
                           class="border px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] transition-colors"
                           :class="archiveMode === 'images' ? 'border-white bg-white text-black' : 'border-white/15 text-white/45 hover:border-white/40 hover:text-white'">
                      {{ locale === 'ru' ? 'ИЗОБРАЖЕНИЯ' : 'IMAGES' }}
                   </button>
                </div>
              </div>
              <div class="flex items-center space-x-6">
                 <button v-if="!isCreatingNote" @click="archiveMode === 'notes' ? (isCreatingNote = true) : addJournalEntry()" type="button" :aria-label="archiveMode === 'notes' ? (locale === 'ru' ? 'Добавить заметку' : 'Add note') : (locale === 'ru' ? 'Добавить изображение' : 'Add image')" class="group grid h-8 w-8 place-items-center border nier-border-primary hover:bg-black dark:hover:bg-white transition-all">
                    <svg class="h-4 w-4 text-black/40 dark:text-white/80 group-hover:text-white dark:group-hover:text-black" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" />
                    </svg>
                 </button>
              </div>
            </div>

            <!-- NOTES TAB CONTENT -->
            <div v-if="archiveMode === 'notes'" class="flex flex-col space-y-8 nier-text-primary">
               <!-- NEW NOTE TEXTAREA -->
               <div v-if="isCreatingNote" class="flex flex-col space-y-4 bg-black/[0.03] dark:bg-white/[0.03] p-8 relative nier-text-primary">
                    <div class="absolute top-4 right-4 flex space-x-4">
                       <button @click="cancelNoteEdit" class="text-[10px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100">{{ locale === 'ru' ? 'Отмена' : 'Cancel' }}</button>
                    </div>
                 
                    <!-- FORMATTING TOOLBAR -->
                    <div class="flex items-center flex-wrap gap-2 pb-4 border-b border-black/5 dark:border-white/5 mb-4">
                       <div class="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-sm mr-4">
                          <button @click="isPreviewMode = false" 
                                  :class="['px-4 py-2 text-[10px] font-mono transition-all', !isPreviewMode ? 'nier-bg-inverted nier-text-primary' : 'opacity-40']">
                             {{ locale === 'ru' ? 'РЕДАКТОР' : 'EDITOR' }}
                          </button>
                          <button @click="isPreviewMode = true" 
                                  :class="['px-4 py-2 text-[10px] font-mono transition-all', isPreviewMode ? 'nier-bg-inverted nier-text-primary' : 'opacity-40']">
                             {{ locale === 'ru' ? 'ПРОСМОТР' : 'PREVIEW' }}
                          </button>
                       </div>

                       <div v-if="!isPreviewMode" class="flex items-center flex-wrap gap-2">
                         <button @click="insertFormatting('# ', '')" class="px-4 py-2 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[10px] font-mono transition-all">H1</button>
                         <button @click="insertFormatting('## ', '')" class="px-4 py-2 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[10px] font-mono transition-all">H2</button>
                         <button @click="insertFormatting('### ', '')" class="px-4 py-2 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[10px] font-mono transition-all">H3</button>
                         <div class="w-px h-5 bg-black/10 dark:bg-white/10 mx-1"></div>
                         <button @click="insertFormatting('**', '**')" class="px-4 py-2 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[10px] font-mono font-bold transition-all">B</button>
                         <button @click="insertFormatting('*', '*')" class="px-4 py-2 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[10px] font-mono italic transition-all">I</button>
                         <button @click="insertFormatting('~~', '~~')" class="px-4 py-2 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[10px] font-mono underline transition-all">U</button>
                         <div class="w-px h-5 bg-black/10 dark:bg-white/10 mx-1"></div>
                         <button @click="insertFormatting('- ', '')" class="px-4 py-2 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[10px] font-mono transition-all">LIST</button>
                         <button @click="insertFormatting('> ', '')" class="px-4 py-2 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[10px] font-mono transition-all">QUOTE</button>
                         <div class="w-px h-5 bg-black/10 dark:bg-white/10 mx-1"></div>
                         <button @click="insertFormatting('[color=#10b981]', '[/color]')" class="px-3 py-2 hover:scale-110 transition-all"><div class="w-4 h-4 bg-emerald-500 rounded-full"></div></button>
                         <button @click="insertFormatting('[color=#ef4444]', '[/color]')" class="px-3 py-2 hover:scale-110 transition-all"><div class="w-4 h-4 bg-rose-500 rounded-full"></div></button>
                         <button @click="insertFormatting('[color=#3b82f6]', '[/color]')" class="px-3 py-2 hover:scale-110 transition-all"><div class="w-4 h-4 bg-blue-500 rounded-full"></div></button>
                         <div class="w-px h-5 bg-black/10 dark:bg-white/10 mx-1"></div>
                         
                         <!-- Visual Attach Dropdown -->
                         <div class="relative group/visuals inline-block">
                           <button class="px-4 py-2 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[10px] font-mono transition-all flex items-center gap-2">
                             {{ locale === 'ru' ? 'ПРИКРЕПИТЬ' : 'ATTACH' }}
                             <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                           </button>
                           <div class="absolute top-full left-0 hidden group-hover/visuals:flex flex-col nier-bg-panel border nier-border-primary shadow-xl z-50 min-w-[150px]">
                             <div v-if="!journalEntries?.length" class="px-3 py-2 text-[8px] font-mono opacity-50 uppercase whitespace-nowrap">{{ locale === 'ru' ? 'НЕТ_СОХРАНЕННЫХ_МАТЕРИАЛОВ' : 'NO_VISUALS_ARCHIVED' }}</div>
                             <button v-else v-for="(img, idx) in journalEntries" :key="img.id" @click.prevent="insertFormatting(`[VISUAL_REF:${idx}]`, '')" class="px-3 py-2 text-[9px] font-mono text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors truncate max-w-[200px]">
                               {{ img.name || `Visual_Node_${idx}` }}
                             </button>
                           </div>
                         </div>
                       </div>
                    </div>

                    <div class="relative min-h-[200px]">
                       <textarea 
                          v-if="!isPreviewMode"
                          ref="noteTextArea"
                          v-model="noteText" 
                          :placeholder="locale === 'ru' ? 'МАТЕРИАЛИЗУЙТЕ СВОИ МЫСЛИ...' : 'REIFY SESSION THOUGHTS HERE...'"
                          class="w-full h-full bg-transparent border-0 font-mono text-[13px] leading-relaxed tracking-wider outline-none resize-none placeholder:opacity-20 min-h-[200px]"
                          autofocus
                       ></textarea>
                       <div v-else 
                            class="w-full h-full font-mono text-[13px] leading-relaxed tracking-wider overflow-y-auto custom-scrollbar min-h-[200px]"
                            v-html="formatNote(noteText || (locale === 'ru' ? 'НЕТ_КОНТЕНТА_ДЛЯ_ОТОБРАЖЕНИЯ' : 'NO_CONTENT_TO_PREVIEW'))">
                       </div>
                    </div>
                    <div class="flex justify-end">
                       <ExButton variant="solid" size="sm" @click="persistNote">
                         {{ locale === 'ru' ? 'СОХРАНИТЬ' : 'SAVE' }}
                       </ExButton>
                    </div>
                 </div>
               
               <div v-if="notesList.length === 0 && !isCreatingNote" class="flex flex-col items-center justify-center py-32 opacity-30">
                 <div class="w-12 h-px nier-bg-inverted mb-6 animate-pulse"></div>
                 <span class="text-[9px] font-mono tracking-[0.6em] uppercase nier-text-primary">{{ locale === 'ru' ? 'НЕТ ЗАПИСЕЙ' : 'NO NOTES' }}</span>
               </div>

               <!-- EXISTING NOTES LIST -->
               <div v-else class="flex flex-col space-y-6">
                  <div v-for="note in notesList.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())" :key="note.id" 
                       class="flex flex-col p-6 bg-black/[0.01] dark:bg-white/[0.01] relative group/note cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
                       @click="toggleNote(note.id)"
                       @dblclick="startEditContent(note)">
                     <div class="flex items-center justify-between mb-2 pb-2" :class="expandedNoteIds.includes(note.id) ? 'border-b border-black/5 dark:border-white/5' : ''">
                        <div class="flex items-center space-x-4">
                           <div v-if="editingNoteId === note.id" @click.stop class="flex items-center gap-2">
                             <input 
                               v-model="editNoteTitle" 
                               @keydown.enter.prevent="saveNoteTitle(note.id)" 
                               @blur="saveNoteTitle(note.id)"
                               class="bg-transparent border-b border-black/30 dark:border-white/30 outline-none text-[9px] font-mono font-black uppercase tracking-[0.2em] nier-text-primary"
                               autofocus
                             />
                             <span class="text-[7px] font-mono opacity-40 uppercase tracking-widest">{{ locale === 'ru' ? '(ENTER_ДЛЯ_СОХРАНЕНИЯ)' : '(ENTER_TO_SAVE)' }}</span>
                           </div>
                           <span v-else @click.stop="startEditNote(note, $event)" class="text-[9px] font-mono font-black uppercase tracking-[0.2em] hover:opacity-50 transition-opacity cursor-text">{{ note.title || (locale === 'ru' ? 'АРХИВНАЯ_ЗАПИСЬ' : 'ARCHIVED_RECORD') }}</span>
                        </div>
                        <div class="flex items-center space-x-4">
                           <span class="text-[10px] font-mono font-bold opacity-60 tracking-wider nier-text-primary">{{ formatDateTactical(note.date) }}</span>
                           <button type="button" @click.stop="removeNote(note.id)" class="opacity-0 group-hover/note:opacity-40 hover:!opacity-100 transition-opacity text-rose-500">
                              <span class="text-[9px] font-mono font-black uppercase tracking-widest">{{ locale === 'ru' ? '[Удалить]' : '[Delete]' }}</span>
                           </button>
                        </div>
                     </div>
                     <div v-if="expandedNoteIds.includes(note.id)" class="text-[12px] font-mono leading-relaxed opacity-70 whitespace-pre-wrap mt-2 animate-fade-in" v-html="formatNote(note.content)"></div>
                  </div>
               </div>
            </div>

            <!-- IMAGES TAB CONTENT -->
            <div v-else-if="archiveMode === 'images'" class="nier-text-primary">
              <div v-if="journalEntries.length === 0" class="flex flex-col items-center justify-center py-32 opacity-30">
              <div class="w-12 h-px nier-bg-inverted mb-6 animate-pulse"></div>
              <span class="text-[9px] font-mono tracking-[0.6em] uppercase nier-text-primary">{{ locale === 'ru' ? 'НЕТ ИЗОБРАЖЕНИЙ' : 'NO IMAGES' }}</span>
            </div>

            <div v-else class="grid grid-cols-2 gap-4 nier-text-primary md:grid-cols-4">
                 <div v-for="entry in journalEntries" :key="entry.id"
                       class="group relative flex flex-col bg-black/[0.01] transition-all duration-500 dark:bg-white/[0.01] nier-text-primary">
                    
                    <!-- Remove Button -->
                    <button @click.stop="removeJournalEntry(entry.id)" 
                            class="absolute top-0 right-0 z-30 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500/80 hover:text-white nier-text-primary border-l border-b nier-border-primary">
                       <span class="text-[10px] font-mono">✕</span>
                    </button>
 
                    <!-- Image Upload Area -->
                    <div @click="triggerUpload(entry.id)" 
                         class="relative aspect-video cursor-pointer overflow-hidden bg-black/5 dark:bg-white/5 group/img">
                       <input :id="`file-input-${entry.id}`" type="file" class="hidden" accept="image/*" @change="e => handleImageUpload(entry.id, e)" />
                       
                       <div v-if="entry.image" class="w-full h-full">
                          <img :src="entry.image" class="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                          <div class="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                             <span class="text-[8px] font-mono tracking-widest uppercase text-white font-black bg-black/60 px-4 py-2">{{ locale === 'ru' ? 'ЗАМЕНИТЬ' : 'REPLACE' }}</span>
                          </div>
                       </div>
                       <div v-else class="w-full h-full flex flex-col items-center justify-center space-y-4">
                          <span class="text-[8px] font-mono tracking-[0.4em] uppercase opacity-30 group-hover/img:opacity-100 nier-text-primary">{{ locale === 'ru' ? 'ЗАГРУЗИТЬ' : 'UPLOAD' }}</span>
                       </div>
 
                       <!-- SCANNING LINE -->
                       <div class="absolute inset-0 pointer-events-none opacity-[0.05] overflow-hidden">
                          <div class="w-full h-px nier-bg-inverted animate-scan"></div>
                       </div>
                    </div>
 
                    <!-- Controls & Info -->
                    <div class="p-3 flex flex-col space-y-3 nier-text-primary">
                       <!-- Visual metadata aligned with Trade Analytics Visuals -->
                       <div class="relative">
                          <input v-model="entry.name"
                                 type="text"
                                 :placeholder="locale === 'ru' ? 'НАЗВАНИЕ' : 'NAME'"
                                 class="w-full bg-transparent border border-black/5 dark:border-white/5 px-2 py-2 text-[9px] font-mono tracking-[0.15em] font-black focus:outline-none transition-all nier-text-primary uppercase placeholder:opacity-20 focus:border-black/20 dark:focus:border-white/20" />
                       </div>

                       <div class="flex flex-col gap-3">
                          <div class="flex flex-wrap gap-2 min-h-7">
                             <span v-for="tag in entry.tags" :key="tag"
                                   class="flex items-center gap-2 border nier-border-primary px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-black/60 dark:text-white/70">
                                {{ tag }}
                                <button @click="removeJournalEntryTag(entry, tag)"
                                        class="text-[9px] leading-none opacity-40 hover:opacity-100 hover:text-red-500 transition-all">
                                   x
                                </button>
                             </span>
                             <span v-if="!entry.tags?.length" class="text-[8px] font-mono uppercase tracking-[0.3em] opacity-20 self-center nier-text-primary">
                                {{ locale === 'ru' ? 'ТЭГОВ НЕТ' : 'NO TAGS' }}
                             </span>
                          </div>

                          <div class="flex items-center gap-2">
                             <input v-model="entry.tagInput"
                                    @keyup.enter="addJournalEntryTag(entry)"
                                    type="text"
                                    placeholder="Custom_Tag..."
                                    class="flex-1 bg-transparent border border-black/5 dark:border-white/5 px-3 py-2 text-[9px] font-mono uppercase tracking-widest focus:outline-none transition-all nier-text-primary placeholder:opacity-20 focus:border-black/20 dark:focus:border-white/20" />
                             <button @click="addJournalEntryTag(entry)"
                                     class="px-3 py-2 border nier-border-primary text-[8px] font-mono uppercase tracking-widest opacity-50 hover:opacity-100 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                                Add_Tag
                             </button>
                          </div>
                       </div>
 
                    </div>
                 </div>
              </div>
            </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </Transition>
      </div>
    </div>

</template>
