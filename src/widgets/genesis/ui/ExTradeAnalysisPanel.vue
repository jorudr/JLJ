<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useStrategyTradesStore } from '~/features/store/useStrategyTrades'
import { useThemeStore } from '~/features/store/useTheme'
import ExPanel from "~/shared/ui/ExPanel.vue"
import ExHeading from "~/shared/ui/ExHeading.vue"
import ExText from "~/shared/ui/ExText.vue"
import ExButton from "~/shared/ui/ExButton.vue"
import DrawingModal from '@/widgets/diary/ui/Thoughts/DrawingModal.vue'
import ExImageArchiveSlot from './ExImageArchiveSlot.vue'
import ExImageEditor from './ExImageEditor.vue'
import ExEfficiencyLattice from "~/shared/ui/ExEfficiencyLattice.vue"
import { useDomI18n } from '~/shared/i18n/useDomI18n'
import { useI18n } from '~/shared/i18n/useI18n'
import { resolveRiskManagementForStrategy } from '~/widgets/genesis/model/riskManagement'
import { tradeMatchesProtocol } from '~/shared/utils/scenarioConditionScope'
import { useMatrixState } from '~/widgets/genesis/model/matrix/useMatrixState'
import {
  filterTradesBySelectedStrategyVersion,
  getSelectedStrategyVersionSnapshot
} from '~/shared/utils/strategyVersionScope'
import { buildTradeProfitabilityScoreIndex } from '~/widgets/genesis/model/tradeProfitabilityScore'
import { getTradeCashPnl, isClosedTradeForMetrics } from '~/widgets/genesis/model/tradePnl'
import globalAssets from '~/shared/data/global_assets.json'

interface Condition {
  id: string;
  name: string;
  frequency: number;
  prevFrequency?: number;
  profitability: number;
  prevProfitability?: number;
}

interface Scenario {
  id: string;
  name: string;
  type: 'entry' | 'exit';
  frequency: number;
  prevFrequency?: number;
  profitability: number;
  prevProfitability?: number;
  conditions: Condition[];
}

interface Trade {
  id: string;
  entryTime: string;
  exitTime: string;
  date?: string;
  dateExit?: string;
  strategyId?: string;
  pnl: number;
  scenarios: Scenario[];
  emotions: string[];
  percentileRank?: number;
  rr?: number;
  side?: 'Long' | 'Short';
  notes?: string;
  notesList?: { id: string; content: string; date: string; title?: string }[];
  images?: { url?: string; context?: string; name?: string; tags?: string[]; createdAt?: string; timestamp?: string; date?: string }[];
}

interface TradeAnalysisProps {
  trade?: Trade;
  globalStability?: number; // 0 to 100
  initialPage?: number;
  initialExpandedNoteId?: string;
  embedded?: boolean;
  embeddedBrief?: boolean;
}

const props = withDefaults(defineProps<TradeAnalysisProps>(), {
  trade: () => ({
    id: 'TRD-08X-42',
    entryTime: '2024-05-01T10:00:00Z',
    exitTime: '2024-05-03T18:30:00Z',
    strategyId: 'GENESIS-PROT',
    pnl: 1250,
    scenarios: [],
    emotions: ['Confidence', 'Slight Anxiety', 'Patience'],
    rr: 2.8
  }),
  globalStability: 64,
  embedded: false,
  embeddedBrief: false
})

const analysisPanelContainer = computed(() => props.embeddedBrief ? 'div' : ExPanel)
const analysisPanelContainerProps = computed(() => props.embeddedBrief
  ? {}
  : { title: '', telemetry: '', variant: 'light', noPadding: true })

const emit = defineEmits(['close', 'requestEmotionEdit']);

const styleLimits: Record<number, { label: string, max?: number, min?: number, maxExclusive?: boolean, desc: string }> = {
  0: { label: 'Day Trading Style', max: 1, maxExclusive: true, desc: '(<24h)' },
  1: { label: 'Swing Trading', min: 1, desc: '(from 1 day to unlimited)' },
  2: { label: 'Investing', min: 90, desc: '(from 3 month - to unlimited)' }
};

const themeStore = useThemeStore();
const isDark = computed(() => themeStore.settings.isDark);
const analysisPanelRoot = ref<HTMLElement | null>(null);
useDomI18n(analysisPanelRoot, 'genesis.dom');
const { locale } = useI18n();
const formatDisplayLabel = (value: unknown) => String(value ?? '').replace(/_/g, ' ');
const localizedTradingStyleLabel = (label: string) => {
  if (locale.value !== 'ru') return formatDisplayLabel(label)
  return {
    'Day Trading Style': 'Стиль дневной торговли',
    'Swing Trading': 'Свинг-трейдинг',
    Investing: 'Инвестирование'
  }[label] || formatDisplayLabel(label)
}

const tradeStore = useStrategyTradesStore();
const {
  nodes: matrixStateNodes,
  connections: matrixStateConnections,
  strategyVersions,
  selectedStrategyVersionId,
  ensureMatrixDataRestored
} = useMatrixState();

const selectedMatrixSnapshot = computed(() => {
  return getSelectedStrategyVersionSnapshot(strategyVersions.value || [], selectedStrategyVersionId.value);
});

const matrixNodes = computed(() => {
  const allNodes: any[] = [];
  const flatten = (nodes: any[]) => {
    nodes.forEach(node => {
      allNodes.push(node);
      if (node.subGraph?.nodes) flatten(node.subGraph.nodes);
    });
  };

  flatten(selectedMatrixSnapshot.value?.nodes || matrixStateNodes.value || []);
  return allNodes;
});

const matrixConnections = computed(() => {
  const allConnections: any[] = [];
  const flatten = (nodes: any[], connections: any[]) => {
    allConnections.push(...connections);
    nodes.forEach(node => {
      if (node.subGraph) {
        flatten(node.subGraph.nodes || [], node.subGraph.connections || []);
      }
    });
  };

  flatten(
    selectedMatrixSnapshot.value?.nodes || matrixStateNodes.value || [],
    selectedMatrixSnapshot.value?.connections || matrixStateConnections.value || []
  );
  return allConnections;
});

const showEmotionSelector = ref(false);
const selectedEmotions = ref<string[]>([]);
const hoveredEmotion = ref<string | null>(null);
const selectedDeepDiveProtocol = ref<{ id: string, name: string } | null>(null);
const EXCLUDED_PROTOCOLS = ['TAKE_PROFIT', 'STOP_LOSS', 'FULL_LIQUIDATION', 'BREAK_EVEN', 'PARTIAL_EXIT', 'TP', 'SL'];

const isDefaultProtocol = (name: string) => {
  return EXCLUDED_PROTOCOLS.includes(name.toUpperCase());
};

const EMOTION_LIBRARY = [
  { label: 'FOMO', type: 'negative', description: 'Entering a trade late due to fear of missing a move, ignoring technical criteria.' },
  { label: 'Revenge', type: 'negative', description: 'Over-leveraging or over-trading to recover losses from a previous failed session.' },
  { label: 'Greed', type: 'negative', description: 'Holding positions past technical targets or over-leveraging for excessive profit.' },
  { label: 'Fear', type: 'negative', description: 'Hesitation to execute valid entries or exiting winning trades early due to loss aversion.' },
  { label: 'Tilt', type: 'negative', description: 'Total loss of emotional control leading to repeated violations of the core trading plan.' },
  { label: 'Anxiety', type: 'negative', description: 'Hyper-fixation on short-term price fluctuations causing cognitive stress.' },
  { label: 'Calmness', type: 'positive', description: 'Maintaining a stable physiological state regardless of market volatility.' },
  { label: 'Discipline', type: 'positive', description: 'Strict adherence to execution protocols and predefined risk management rules.' },
  { label: 'Focus', type: 'positive', description: 'High situational awareness and concentration on technical data streams.' },
  { label: 'Patience', type: 'positive', description: 'Waiting for high-probability setups without forcing low-quality entries.' },
  { label: 'Confidence', type: 'positive', description: 'Trust in the statistical edge of the strategy during execution.' },
  { label: 'Hope', type: 'neutral', description: 'Relying on luck or irrational bias to save a losing position instead of following stops.' },
  { label: 'Boredom', type: 'neutral', description: 'Lack of stimulus leading to low-quality trades to feel "active" in the market.' },
  { label: 'Fatigue', type: 'neutral', description: 'Reduced cognitive performance due to long session duration or biological exhaustion.' }
];

const emotionsByCategory = computed(() => {
  const groups: Record<string, any[]> = { NEGATIVE: [], NEUTRAL: [], POSITIVE: [] };
  EMOTION_LIBRARY.forEach(emotion => {
    const cat = emotion.type.toUpperCase();
    if (groups[cat]) groups[cat].push(emotion);
  });
  return groups;
});

const EMOTION_OPPOSITES: Record<string, string> = {
  'FOMO': 'Patience', 'Patience': 'FOMO',
  'Fear': 'Confidence', 'Confidence': 'Fear',
  'Tilt': 'Calmness', 'Calmness': 'Tilt',
  'Greed': 'Discipline', 'Discipline': 'Greed',
  'Boredom': 'Focus', 'Focus': 'Boredom',
  'Anxiety': 'Calmness'
};

const toggleEmotion = (label: string) => {
  const index = selectedEmotions.value.indexOf(label);
  if (index > -1) {
    selectedEmotions.value.splice(index, 1);
  } else {
    const opposite = EMOTION_OPPOSITES[label];
    if (opposite && selectedEmotions.value.includes(opposite)) return;
    selectedEmotions.value.push(label);
  }
};

const isEmotionDisabled = (label: string) => {
  const opposite = EMOTION_OPPOSITES[label];
  return opposite && selectedEmotions.value.includes(opposite);
};

const saveEmotions = async () => {
  if (props.trade?.strategyId && props.trade?.id) {
    await tradeStore.updateTrade(props.trade.strategyId, props.trade.id, {
      emotions: [...selectedEmotions.value]
    });
    // Update local props to reflect immediately without full reload if necessary
    if (props.trade) props.trade.emotions = [...selectedEmotions.value];
    showEmotionSelector.value = false;
  }
};

const noteText = ref("");
const noteTextArea = ref<HTMLTextAreaElement | null>(null);
const isCreatingNote = ref(false);
const isPreviewMode = ref(false);
const editingContentNoteId = ref<string | null>(null);

const startEditContent = (note: any) => {
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

const expandedNoteIds = ref<string[]>(props.initialExpandedNoteId ? [props.initialExpandedNoteId] : []);
watch(() => props.initialExpandedNoteId, (newId) => {
  if (newId && !expandedNoteIds.value.includes(newId)) {
    expandedNoteIds.value.push(newId);
  }
}, { immediate: true });

const toggleNote = (id: string) => {
  const index = expandedNoteIds.value.indexOf(id);
  if (index === -1) {
    expandedNoteIds.value.push(id);
  } else {
    expandedNoteIds.value.splice(index, 1);
  }
};

const editingNoteId = ref<string | null>(null);
const editNoteTitle = ref("");

const startEditNote = (note: any, event: Event) => {
  event.stopPropagation();
  editingNoteId.value = note.id;
  editNoteTitle.value = note.title || "ARCHIVED_RECORD";
};

const saveNoteTitle = async (noteId: string) => {
  if (editingNoteId.value === noteId) {
    if (props.trade && props.trade.strategyId && props.trade.id) {
      const currentNotes = enrichedTrade.value?.notesList || [];
      const updatedNotes = currentNotes.map(n => 
        n.id === noteId ? { ...n, title: editNoteTitle.value } : n
      );
      await tradeStore.updateTrade(props.trade.strategyId, props.trade.id, {
        notesList: updatedNotes
      });
    }
    editingNoteId.value = null;
  }
};

const activeContextMenu = ref<{ x: number, y: number, idx: number } | null>(null);

const isEditorOpen = ref(false);
const editorMode = ref<'preview' | 'edit'>('preview');
const editorImageSrc = ref('');
const currentAnnotations = ref<any>(null);
const currentEditIdx = ref<number | null>(null);

const handleSlotContextMenu = (idx: number, event: MouseEvent) => {
  activeContextMenu.value = {
    x: event.clientX,
    y: event.clientY,
    idx
  };
};

const closeContextMenu = () => {
  activeContextMenu.value = null;
};

onMounted(() => {
  window.addEventListener('click', closeContextMenu);
});


const insertFormatting = (prefix: string, suffix: string = "") => {
  if (!noteTextArea.value) return;
  const el = noteTextArea.value;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const text = el.value;
  const before = text.substring(0, start);
  const selection = text.substring(start, end);
  const after = text.substring(end);

  noteText.value = before + prefix + (selection || "") + suffix + after;
  
  // Restore focus and selection
  setTimeout(() => {
    el.focus();
    const newCursorPos = start + prefix.length + (selection ? selection.length + suffix.length : 0);
    el.setSelectionRange(newCursorPos, newCursorPos);
  }, 0);
};

const formatNote = (content: string) => {
  if (!content) return "";
  
  // Replace visual references with actual images
  let processedContent = content.replace(/\[VISUAL_REF:(\d+)\]/gim, (match, idxStr) => {
    const idx = parseInt(idxStr);
    const img = enrichedTrade.value?.images?.[idx];
    if (img && img.url) {
      const name = formatDisplayLabel(img.name || `Visual_Node_${idx}`);
      return `<div class="my-4 border nier-border-primary bg-black/5 dark:bg-white/5 p-2 relative group"><img src="${img.url}" alt="${name}" class="max-w-full h-auto object-contain max-h-[400px] w-full" /><div class="absolute bottom-4 left-4 nier-bg-panel px-2 py-1 text-[8px] font-mono opacity-80 uppercase tracking-widest border nier-border-primary shadow-lg">${name}</div></div>`;
    }
    return match;
  });

  // Simple markdown-ish to HTML conversion
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

const syncNotes = () => {
  // We keep this for backward compatibility if needed, 
  // but now we mainly use notesList
};

const addNote = async () => {
  if (!noteText.value.trim()) return;
  
  if (props.trade?.strategyId && props.trade?.id) {
    const currentNotes = enrichedTrade.value?.notesList || [];
    let newNotes = [];
    
    if (editingContentNoteId.value) {
       newNotes = currentNotes.map(n => 
          n.id === editingContentNoteId.value ? { ...n, content: noteText.value } : n
       );
    } else {
       const newNote = {
         id: `note_${Date.now()}`,
         content: noteText.value,
         date: new Date().toISOString(),
         title: `SESSION_LOG_${currentNotes.length + 1}`
       };
       newNotes = [...currentNotes, newNote];
    }
    
    noteText.value = "";
    isCreatingNote.value = false;
    editingContentNoteId.value = null;

    await tradeStore.updateTrade(props.trade.strategyId, props.trade.id, {
      notesList: newNotes
    });
  }
};

const formatDateTactical = (dateStr?: string | Date | null) => {
  const fallbackDate = props.trade?.date || props.trade?.dateExit || props.trade?.entryTime || props.trade?.exitTime;
  const d = new Date(dateStr || fallbackDate || Date.now());
  if (Number.isNaN(d.getTime())) return 'DATE_UNASSIGNED';

  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} // ${time}`;
};

const formatImageSlotDate = (dateStr?: string | Date | null) => {
  if (!dateStr) return 'DATE_UNASSIGNED';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'DATE_UNASSIGNED';

  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} // ${time}`;
};

const showImageFullscreen = (idx: number) => {
  const img = enrichedTrade.value?.images?.[idx];
  if (img?.url) {
    currentEditIdx.value = idx;
    editorImageSrc.value = img.url;
    try {
       currentAnnotations.value = img.context ? JSON.parse(img.context) : null;
    } catch {
       currentAnnotations.value = null;
    }
    editorMode.value = 'preview';
    isEditorOpen.value = true;
  } else {
    console.warn("[Visuals] No image URL found for slot", idx);
  }
};

const editImage = (idx: number) => {
  const img = enrichedTrade.value?.images?.[idx];
  if (img?.url) {
    currentEditIdx.value = idx;
    editorImageSrc.value = img.url;
    try {
       currentAnnotations.value = img.context ? JSON.parse(img.context) : null;
    } catch {
       currentAnnotations.value = null;
    }
    editorMode.value = 'edit';
    isEditorOpen.value = true;
  } else {
    console.warn("[Visuals] No image URL found for slot", idx);
  }
};

const onDrawingSave = async (annotations: any) => {
  const idx = currentEditIdx.value;
  if (idx !== null && props.trade?.strategyId && props.trade?.id) {
    const currentImages = [...(enrichedTrade.value?.images || [])];
    if (currentImages[idx]) {
      currentImages[idx].context = JSON.stringify(annotations);
      await tradeStore.updateTrade(props.trade.strategyId, props.trade.id, {
        images: currentImages
      });
    }
  }
  isEditorOpen.value = false;
};

const deleteNote = async (noteId: string) => {
  if (props.trade?.strategyId && props.trade?.id) {
    const currentNotes = enrichedTrade.value?.notesList || [];
    const newNotes = currentNotes.filter(n => n.id !== noteId);
    
    await tradeStore.updateTrade(props.trade.strategyId, props.trade.id, {
      notesList: newNotes
    });
  }
};

const addImageSlot = async () => {
  if (props.trade?.strategyId && props.trade?.id) {
    const currentImages = enrichedTrade.value?.images || [];
    const newImages = [...currentImages, { url: "", context: "", createdAt: new Date().toISOString() }];
    await tradeStore.updateTrade(props.trade.strategyId, props.trade.id, {
      images: newImages
    });
  }
};

const triggerUpload = (idx: number) => {
  const el = document.getElementById(`visual-upload-${idx}`);
  if (el) el.click();
};

const handleImageUpload = async (event: any, index: number) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const url = e.target?.result as string;
    if (url && props.trade?.strategyId && props.trade?.id) {
      const currentImages = [...(enrichedTrade.value?.images || [])];
      if (currentImages[index]) {
        currentImages[index].url = url;
        currentImages[index].createdAt = currentImages[index].createdAt || new Date().toISOString();
        await tradeStore.updateTrade(props.trade.strategyId, props.trade.id, {
          images: currentImages
        });
      }
    }
  };
  reader.readAsDataURL(file);
};

const updateImageContext = async (index: number, context: string | undefined) => {
  if (props.trade?.strategyId && props.trade?.id) {
    const currentImages = [...(enrichedTrade.value?.images || [])];
    if (currentImages[index]) {
      currentImages[index].context = context || "";
      await tradeStore.updateTrade(props.trade.strategyId, props.trade.id, {
        images: currentImages
      });
    }
  }
};

const removeImage = async (idx: number) => {
  if (props.trade?.strategyId && props.trade?.id) {
    const currentImages = [...(enrichedTrade.value?.images || [])];
    currentImages.splice(idx, 1);
    await tradeStore.updateTrade(props.trade.strategyId, props.trade.id, {
      images: currentImages
    });
  }
};

const updateImageName = async (idx: number, newName: string) => {
  if (props.trade?.strategyId && props.trade?.id) {
    const currentImages = [...(enrichedTrade.value?.images || [])];
    if (currentImages[idx]) {
      currentImages[idx].name = newName;
      await tradeStore.updateTrade(props.trade.strategyId, props.trade.id, {
        images: currentImages
      });
    }
  }
};

const updateImageTags = async (idx: number, newTags: string[]) => {
  if (props.trade?.strategyId && props.trade?.id) {
    const currentImages = [...(enrichedTrade.value?.images || [])];
    if (currentImages[idx]) {
      currentImages[idx].tags = newTags;
      await tradeStore.updateTrade(props.trade.strategyId, props.trade.id, {
        images: currentImages
      });
    }
  }
};

// Sync local selection when opening
watch(showEmotionSelector, (newVal) => {
  if (newVal && props.trade) {
    selectedEmotions.value = [...props.trade.emotions];
  }
});

// Watch for trade changes to sync notes
watch(() => props.trade?.id, () => {
  syncNotes();
}, { immediate: true });

const allTrades = computed(() => {
  if (!props.trade?.strategyId) return [];
  const trades = tradeStore.getTradesForStrategy(props.trade.strategyId);
  if (props.trade.strategyId === 'MAIN_DIARY') return trades;

  return filterTradesBySelectedStrategyVersion(
    trades,
    strategyVersions.value || [],
    selectedStrategyVersionId.value
  );
});

function isClosedAnalysisTrade(trade: any) {
  return isClosedTradeForMetrics(trade);
}

const closedAllTrades = computed(() => allTrades.value.filter(isClosedAnalysisTrade));

const getNormalizedPnl = (tr: any) => {
  return getTradeCashPnl(tr, initialBalance.value);
};

const currentTradePnl = computed(() => props.trade ? getNormalizedPnl(props.trade) : 0);

const tradeScoreSourceTrades = computed(() => {
  const list = [...closedAllTrades.value];
  if (!props.trade?.id || !isClosedAnalysisTrade(props.trade)) return list;

  const idx = list.findIndex(t => t.id === props.trade?.id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...props.trade } as any;
  } else {
    list.push(props.trade as any);
  }
  return list;
});

const tradeProfitabilityScoreIndex = computed(() => {
  return buildTradeProfitabilityScoreIndex(tradeScoreSourceTrades.value, initialBalance.value || 1000);
});

const getUnifiedTradeScore = (trade: any) => {
  if (!trade) return null;
  return tradeProfitabilityScoreIndex.value.get(String(trade.id || '')) ?? tradeProfitabilityScoreIndex.value.get(trade) ?? null;
};

const percentileRank = computed(() => {
  const score = getUnifiedTradeScore(props.trade);
  return score?.score ?? 0;
});

const advancedMetricCopy = computed(() => {
  const isRu = locale.value === 'ru';
  const labels: Record<string, string> = {
    required_adherence: isRu ? 'Соблюдение required' : 'Required Adherence',
    additional_alpha: isRu ? 'Дополнительная alpha' : 'Additional Alpha',
    protocol_strictness: isRu ? 'Строгость протокола' : 'Protocol Strictness',
    conditional_pnl_ratio: isRu ? 'PnL на условие' : 'Conditional PnL Ratio',
    setup_complexity: isRu ? 'Сложность setup' : 'Setup Complexity',
    cognitive_stability: isRu ? 'Когнитивная стабильность' : 'Cognitive Stability',
    dominant_bias: isRu ? 'Главный bias' : 'Dominant Bias',
    emotional_pnl_drag: isRu ? 'Эмоциональный PnL drag' : 'Emotional PnL Drag',
    friction_density: isRu ? 'Плотность friction' : 'Friction Density',
    net_result_variance: isRu ? 'Отклонение результата' : 'Net Result Variance',
    yield_efficiency: isRu ? 'Эффективность доходности' : 'Yield Efficiency',
    profit_velocity: isRu ? 'Скорость прибыли' : 'Profit Velocity',
    actual_vs_target_rr: isRu ? 'Факт против target R/R' : 'Actual vs Target R/R',
    planned_vs_realized_risk: isRu ? 'Плановый и факт. риск' : 'Planned vs Realized Risk',
    temporal_exposure: isRu ? 'Временная экспозиция' : 'Temporal Exposure',
    asset_protocol: isRu ? 'Протокол актива' : 'Asset Protocol',
    stop_loss_distance: isRu ? 'Дистанция stop loss' : 'Stop Loss Distance',
    take_profit_distance: isRu ? 'Дистанция take profit' : 'Take Profit Distance',
    sl_execution_drag: isRu ? 'Проскальзывание stop loss' : 'Stop Loss Execution Drag',
    risk_budget_adherence: isRu ? 'Соблюдение risk budget' : 'Risk Budget Adherence',
    tp_capture_ratio: isRu ? 'Захват take profit' : 'TP Capture Ratio',
    edge_capture_quotient: isRu ? 'Коэффициент edge capture' : 'Edge Capture Quotient',
    unrealized_alpha_left: isRu ? 'Незабранная alpha' : 'Unrealized Alpha Left',
    horizon_sync_rating: isRu ? 'Синхронизация горизонта' : 'Horizon Sync Rating',
    velocity_variance_index: isRu ? 'Индекс отклонения скорости' : 'Velocity Variance Index',
    conditional_alpha_decay: isRu ? 'Угасание alpha условий' : 'Conditional Alpha Decay',
    execution_confidence_index: isRu ? 'Индекс уверенности исполнения' : 'Execution Confidence Index'
  };

  const descriptions: Record<string, string> = {
    net_result_variance: isRu ? 'Насколько результат сделки отличается от среднего результата стратегии.' : 'How far this trade result deviates from the strategy average result.',
    yield_efficiency: isRu ? 'Доходность сделки относительно баланса перед входом.' : 'Trade return relative to balance before entry.',
    profit_velocity: isRu ? 'Скорость получения PnL за час удержания.' : 'PnL earned per hour of holding time.',
    actual_vs_target_rr: isRu ? 'Фактическое R/R относительно запланированной цели.' : 'Realized R/R compared with the target R/R.',
    planned_vs_realized_risk: isRu ? 'Максимум между плановым stop-риск и фактическим убытком.' : 'The larger of planned stop risk and realized loss.',
    temporal_exposure: isRu ? 'Длительность сделки от входа до выхода.' : 'Trade duration from entry to exit.',
    asset_protocol: isRu ? 'Сторона сделки и инструмент.' : 'Trade side and traded instrument.',
    stop_loss_distance: isRu ? 'Расстояние от entry до stop loss в процентах.' : 'Percent distance from entry to stop loss.',
    take_profit_distance: isRu ? 'Расстояние от entry до take profit в процентах.' : 'Percent distance from entry to take profit.',
    sl_execution_drag: isRu ? 'Показывает, насколько фактический выход в убыточной сделке оказался хуже расчетной зоны stop loss.' : 'Shows how much a losing exit exceeded the calculated stop-loss zone.',
    risk_budget_adherence: isRu ? 'Насколько риск сделки укладывается в risk budget.' : 'How well trade risk fits inside the risk budget.',
    tp_capture_ratio: isRu ? 'Какая часть планового target была забрана выходом.' : 'Share of the planned target captured by the exit.',
    edge_capture_quotient: isRu ? 'Фактическое R/R относительно ожидаемого edge стратегии.' : 'Realized R/R relative to the strategy expected edge.',
    unrealized_alpha_left: isRu ? 'Сколько потенциальной прибыли осталось незабранной до target.' : 'Potential profit left uncaptured before target.',
    horizon_sync_rating: isRu ? 'Позиция длительности сделки внутри исторического диапазона сценария.' : 'Position of trade duration inside the historical scenario range.',
    velocity_variance_index: isRu ? 'Скорость PnL сделки относительно средней скорости стратегии.' : 'Trade PnL velocity relative to the strategy average velocity.'
  };

  const formulas: Record<string, string> = {
    net_result_variance: 'Trade PnL - Avg Strategy PnL',
    yield_efficiency: '(Trade PnL / Balance Before Trade) * 100',
    profit_velocity: 'Trade PnL / Duration Hours',
    actual_vs_target_rr: 'Target Distance / Stop Distance',
    planned_vs_realized_risk: 'max(Planned Stop Risk, Realized Loss)',
    temporal_exposure: 'Exit Timestamp - Entry Timestamp',
    asset_protocol: 'Side + Asset',
    stop_loss_distance: 'abs(Entry - Stop Loss) / Entry * 100',
    take_profit_distance: 'abs(Take Profit - Entry) / Entry * 100',
    sl_execution_drag: 'Losing Exit - Stop Loss Zone',
    risk_budget_adherence: 'Worst Risk / Risk Budget * 100',
    tp_capture_ratio: 'Captured Target Distance / Planned Target Distance * 100',
    edge_capture_quotient: 'Realized RR / Expected RR',
    unrealized_alpha_left: 'Planned Target PnL - Realized PnL',
    horizon_sync_rating: '(Duration - Scenario Min) / Scenario Range * 100',
    velocity_variance_index: 'Trade Velocity / Avg Strategy Velocity'
  };

  const benchmarks: Record<string, string> = {
    risk_budget_adherence: isRu ? '<= 100% значит риск в лимите.' : '<= 100% means risk is inside budget.',
    tp_capture_ratio: isRu ? 'Выше значение значит лучше захват target.' : 'Higher value means better target capture.',
    actual_vs_target_rr: isRu ? 'Сравнивается с target R/R стратегии.' : 'Compared against the strategy target R/R.',
    temporal_exposure: isRu ? 'Сравнивается с историческим диапазоном длительности.' : 'Compared with the historical duration range.',
    stop_loss_distance: isRu ? 'Показывает ширину stop относительно entry.' : 'Shows stop width relative to entry.',
    take_profit_distance: isRu ? 'Показывает target distance относительно entry.' : 'Shows target distance relative to entry.'
  };

  return { labels, descriptions, formulas, benchmarks };
});

const getAdvancedMetricLabel = (id: string) => formatDisplayLabel(advancedMetricCopy.value.labels[id] || id);

const getAdvancedMetricTooltip = (id: string) => ({
  description: advancedMetricCopy.value.descriptions[id] || (locale.value === 'ru'
    ? 'Advanced метрика из отчета сделки.'
    : 'Advanced metric from the trade report.'),
  formula: advancedMetricCopy.value.formulas[id] || '',
  benchmark: advancedMetricCopy.value.benchmarks[id] || ''
});

const SCORE_PATTERN_EXCLUDED_METRICS = new Set([
  'required_adherence',
  'additional_alpha',
  'protocol_strictness',
  'conditional_pnl_ratio',
  'setup_complexity',
  'cognitive_stability',
  'dominant_bias',
  'emotional_pnl_drag',
  'friction_density',
  'conditional_alpha_decay',
  'execution_confidence_index'
]);

const scorePatternInTradeMetricConfigs = (): CorrelationMetricConfig[] => {
  const text = studyMetricText.value;
  const specs: Array<{ id: string; kind: CorrelationMetricKind; format: CorrelationMetricFormat }> = [
    { id: 'meaningfulLossTime', kind: 'numeric', format: 'duration' },
    { id: 'meaningfulProfitTime', kind: 'numeric', format: 'duration' },
    { id: 'maxMeaningfulDrawdown', kind: 'numeric', format: 'percent' },
    { id: 'maxFavorableExcursion', kind: 'numeric', format: 'percent' },
    { id: 'profitCaptureRatio', kind: 'numeric', format: 'percent' },
    { id: 'pricePathShape', kind: 'category', format: 'text' },
    { id: 'firstImpulseDirection', kind: 'category', format: 'text' },
    { id: 'entryHeat', kind: 'numeric', format: 'duration' },
    { id: 'adverseBeforeProfit', kind: 'category', format: 'text' },
    { id: 'hadNews', kind: 'category', format: 'text' }
  ];

  return specs.map((spec) => ({
    id: `in_trade:${spec.id}`,
    label: text.labels[spec.id as keyof typeof text.labels] || spec.id,
    group: text.sectionTitle,
    kind: spec.kind,
    format: spec.format,
    extract: (trade: any) => getInTradeMetricValueForCorrelation(trade, spec.id)
  }));
};

const scorePatternMetricConfigs = () => {
  const baseMetrics = correlationMetricConfigs.value.filter((metric) => {
    if (metric.id.startsWith('in_trade:')) return false;
    if (SCORE_PATTERN_EXCLUDED_METRICS.has(metric.id)) return false;
    if (['Matrix Adherence', 'Behavioural'].includes(metric.group)) return false;
    return true;
  });

  return [...baseMetrics, ...scorePatternInTradeMetricConfigs()];
};

const scorePatternQuantile = (values: number[], ratio: number) => {
  if (!values.length) return Number.NaN;
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)));
  return sorted[index];
};

const formatScoreMetricPatternValue = (value: number | string, format: CorrelationMetricFormat) => {
  if (typeof value === 'string') return value;
  if (!Number.isFinite(value)) return 'N/A';
  if (format === 'duration') {
    if (value >= 24) return `${(value / 24).toFixed(value >= 240 ? 0 : 1)}d`;
    return `${value.toFixed(value >= 10 ? 0 : 1)}h`;
  }
  if (format === 'percent') return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
  if (format === 'currency') return formatCurrency(value);
  if (format === 'ratio') return value.toFixed(value >= 10 ? 1 : 2);
  if (format === 'count' || format === 'score') return value.toFixed(value >= 10 ? 0 : 1);
  return value.toFixed(value >= 10 ? 1 : 2);
};

const buildMajorityScorePatterns = (useProfitablePatterns: boolean) => {
  const pool = tradeScoreSourceTrades.value.filter((trade: any) => {
    const pnl = getNormalizedPnl(trade);
    return useProfitablePatterns ? pnl > 0 : pnl < 0;
  });
  if (!pool.length) return [];

  return scorePatternMetricConfigs()
    .map((metric) => {
      if (metric.kind === 'category') {
        const counts = new Map<string, number>();
        pool.forEach((trade: any) => {
          const raw = metric.extract(trade);
          const value = String(raw || '').trim();
          if (!value || value === 'N/A') return;
          counts.set(value, (counts.get(value) || 0) + 1);
        });
        const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
        if (!top) return null;
        const frequency = Math.round((top[1] / pool.length) * 100);
        if (frequency <= 50) return null;
        return {
          metricId: metric.id,
          label: metric.label,
          value: top[0],
          frequency
        };
      }

      const values = pool
        .map((trade: any) => Number(metric.extract(trade)))
        .filter((value: number) => Number.isFinite(value));
      if (!values.length) return null;

      const low = scorePatternQuantile(values, 0.2);
      const high = scorePatternQuantile(values, 0.8);
      if (!Number.isFinite(low) || !Number.isFinite(high)) return null;
      const inRange = values.filter((value: number) => value >= low && value <= high).length;
      const frequency = Math.round((inRange / pool.length) * 100);
      if (frequency <= 50) return null;
      const value = low === high
        ? formatScoreMetricPatternValue(low, metric.format)
        : `${formatScoreMetricPatternValue(low, metric.format)} - ${formatScoreMetricPatternValue(high, metric.format)}`;

      return {
        metricId: metric.id,
        label: metric.label,
        value,
        frequency
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.frequency - a.frequency || String(a.label).localeCompare(String(b.label)))
    .slice(0, 18);
};

const getScorePatternTooltip = (metricId: string) => {
  if (metricId.startsWith('in_trade:')) {
    const row = inTradeAnalysisRows.value.find((item: any) => `in_trade:${item.id}` === metricId);
    return {
      description: row?.hint || '',
      formula: '',
      benchmark: '',
      details: row?.detail || []
    };
  }

  return {
    ...getAdvancedMetricTooltip(metricId),
    details: []
  };
};

const resolvedRiskManagement = computed(() => {
  return resolveRiskManagementForStrategy(matrixNodes.value, matrixConnections.value, props.trade?.strategyId);
});

const resolvedStyleNode = computed(() => {
  const risk = resolvedRiskManagement.value;
  if (!risk.tradingStyle && risk.tradingStyleExtraType === null) return null;
  return {
    label: risk.tradingStyle || 'Style Undefined',
    params: {
      extraType: risk.tradingStyleExtraType
    }
  };
});

const resolvedTradingStyle = computed(() => {
  const extraType = resolvedExtraType.value;
  const isRu = locale.value === 'ru';
  if (typeof extraType === 'number') {
    const limit = styleLimits[extraType];
    if (limit) {
      if (isRu) {
        if (extraType === 0) return 'Внутридневная торговля';
        if (extraType === 1) return 'Свинг-трейдинг';
        if (extraType === 2) return 'Инвестирование';
      }
      return localizedTradingStyleLabel(limit.label);
    }
  }
  const label = resolvedStyleNode.value?.label?.replace(/_/g, ' ') || 'Style Undefined';
  if (isRu && label === 'Style Undefined') {
    return 'Неопределенный стиль';
  }
  return localizedTradingStyleLabel(label);
});

const resolvedExtraType = computed(() => {
  return resolvedStyleNode.value?.params?.extraType;
});

const calcPF = (tradeList: any[]) => {
  let gProf = 0, gLoss = 0;
  tradeList.forEach(tr => {
    const val = getNormalizedPnl(tr);
    if (val > 0) gProf += val;
    else if (val < 0) gLoss += Math.abs(val);
  });
  if (tradeList.length === 0) return 0;
  return gLoss === 0 ? (gProf > 0 ? 99.9 : 0) : gProf / gLoss;
};

const calcStats = (trades: any[], id: string, scenarioId?: string | null) => {
  if (trades.length === 0) return { freq: 0, pf: 1.0 };

  const presentIn = trades.filter(tr => tradeMatchesProtocol(tr, id, scenarioId));

  const freq = presentIn.length / trades.length;
  const pf = calcPF(presentIn);
  return { freq, pf };
};

const liveTradesList = computed(() => {
  const list = [...allTrades.value];
  const idx = list.findIndex(t => t.id === props.trade?.id);
  if (idx !== -1) {
    // Merge props.trade into the store version to ensure reactivity to panel edits
    list[idx] = { ...list[idx], ...props.trade } as any;
  } else if (props.trade?.id) {
    list.push(props.trade as any);
  }
  return list.sort((a, b) => {
    const timeA = new Date(a.dateExit || a.date).getTime();
    const timeB = new Date(b.dateExit || b.date).getTime();
    return timeA - timeB;
  });
});

const getProtocolStats = (id: string, scenarioId?: string | null) => {
  const list = liveTradesList.value;
  if (list.length === 0) return { freq: 0, pf: 1.0 };
  // Current Global State (including all trades)
  return calcStats(list, id, scenarioId);
};

const getProtocolStatsBefore = (id: string, scenarioId?: string | null) => {
  const list = liveTradesList.value;
  if (list.length <= 1) return { freq: 0, pf: 1.0 };
  
  // Previous Global State (all trades except the very last one in the timeline)
  // This calculates if the absolute most recent activity moved the needle up or down globally
  const filtered = list.slice(0, list.length - 1);
  return calcStats(filtered, id, scenarioId);
};

const enrichedTrade = computed(() => {
  if (!props.trade) return null;

  const allTrades = tradeStore.tradesByStrategy[props.trade.strategyId || ''] || [];
  const realTrade = allTrades.find(t => t.id === props.trade!.id);

  return {
    ...props.trade,
    asset: realTrade?.asset || (props.trade as any).asset || 'N/A',
    notes: realTrade?.notes || props.trade.notes || '',
    notesList: realTrade?.notesList || props.trade.notesList || [],
    images: realTrade?.images || props.trade.images || [],
    tradingStyle: resolvedTradingStyle.value,
    percentileRank: percentileRank.value,
    scenarios: props.trade.scenarios.map(s => {
      const sStats = getProtocolStats(s.id);
      const sPrev  = getProtocolStatsBefore(s.id);
      return {
        ...s,
        frequency: sStats.freq,
        prevFrequency: sPrev?.freq ?? undefined,
        profitability: sStats.pf,
        prevProfitability: sPrev?.pf ?? undefined,
        conditions: (s.conditions || []).map(c => {
          const cStats = getProtocolStats(c.id, s.id);
          const cPrev  = getProtocolStatsBefore(c.id, s.id);
          return {
            ...c,
            frequency: cStats.freq,
            prevFrequency: cPrev?.freq ?? undefined,
            profitability: cStats.pf,
            prevProfitability: cPrev?.pf ?? undefined
          };
        })
      };
    })
  };
});

const currentPage = ref(props.initialPage || 3);
watch(() => props.initialPage, (newPage) => {
  if (newPage) {
    currentPage.value = newPage;
  }
}, { immediate: true });
const totalPages = 2;

const duration = computed(() => {
  if (!props.trade) return 0;
  const start = new Date(props.trade.date || Date.now()).getTime();
  const end = new Date(props.trade.dateExit || props.trade.date || Date.now()).getTime();
  return (end - start) / (1000 * 60 * 60); // hours
});

const scenarioDurationStats = computed(() => {
  const trade = props.trade as any;
  if (!trade?.strategyId) return { minDays: 0, maxDays: 0, count: 0 };

  const scenarioId = trade.boardScenarioEntry?.id;
  if (!scenarioId) return { minDays: 0, maxDays: 0, count: 0 };

  const relatedTrades = allTrades.value.filter((t: any) => {
    if (t?.id === trade.id) return false;
    return t?.boardScenarioEntry?.id === scenarioId;
  });

  const durations = relatedTrades.map((t: any) => {
    const start = new Date(t.date || Date.now()).getTime();
    const end = new Date(t.dateExit || t.date || Date.now()).getTime();
    return Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
  }).filter((days: number) => days > 0);

  if (durations.length === 0) {
    const currentDays = Math.max(0, duration.value / 24);
    return { minDays: currentDays, maxDays: currentDays, count: 0 };
  }

  return {
    minDays: Math.min(...durations),
    maxDays: Math.max(...durations),
    count: durations.length
  };
});

const scenarioDurationLabel = computed(() => {
  const stats = scenarioDurationStats.value;
  const isRu = locale.value === 'ru';
  if (stats.count === 0) {
    return isRu ? 'Нет истории сценария' : 'No scenario history';
  }
  return isRu
    ? `Диапазон сценария (${stats.minDays.toFixed(2)}д - ${stats.maxDays.toFixed(2)}д)`
    : `Scenario range (${stats.minDays.toFixed(2)}d - ${stats.maxDays.toFixed(2)}d)`;
});

const tradingStyleDurationLimit = computed(() => {
  const extraType = resolvedExtraType.value;
  return typeof extraType === 'number' ? styleLimits[extraType] : null;
});

const durationAxisLabel = computed(() => {
  const limit = tradingStyleDurationLimit.value;
  const isRu = locale.value === 'ru';
  if (!limit) return scenarioDurationLabel.value;
  if (limit.maxExclusive && limit.max === 1) {
    return isRu ? 'Лимит стиля: < 24ч' : 'Style limit: < 24h';
  }
  if (limit.min !== undefined && limit.max !== undefined) {
    return isRu
      ? `Лимит стиля: ${limit.min}д - ${limit.max}д`
      : `Style limit: ${limit.min}d - ${limit.max}d`;
  }
  if (limit.min !== undefined) {
    return isRu ? `Лимит стиля: от ${limit.min}д` : `Style limit: from ${limit.min}d`;
  }
  if (limit.max !== undefined) {
    return isRu ? `Лимит стиля: до ${limit.max}д` : `Style limit: up to ${limit.max}d`;
  }
  return scenarioDurationLabel.value;
});

const durationContextLabel = computed(() => {
  const isRu = locale.value === 'ru';
  return tradingStyleDurationLimit.value
    ? (isRu ? 'лимит стиля' : 'style limit')
    : (isRu ? 'диапазон сценария' : 'scenario range');
});

const durationProgressMaxDays = computed(() => {
  const limit = tradingStyleDurationLimit.value;
  if (limit?.max !== undefined) return Math.max(limit.max, 0.0001);
  return Math.max(scenarioDurationStats.value.maxDays, 0.0001);
});

const durationText = computed(() => {
  if (!props.trade) return '0s';
  const start = new Date(props.trade.date || Date.now()).getTime();
  const end = new Date(props.trade.dateExit || props.trade.date || Date.now()).getTime();
  let diff = end - start;
  if (diff < 0) diff = 0;
  
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const parts = [];
  const isRu = locale.value === 'ru';
  
  if (days > 0) parts.push(isRu ? `${days}д` : `${days}d`);
  if (hours > 0 || days > 0) parts.push(isRu ? `${hours}ч` : `${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(isRu ? `${minutes}м` : `${minutes}m`);
  parts.push(isRu ? `${seconds}с` : `${seconds}s`);
  
  return parts.join(' ');
});

const durationParts = computed(() => {
  if (!props.trade) return [{ num: '0', unit: 's' }];
  const start = new Date(props.trade.date || Date.now()).getTime();
  const end = new Date(props.trade.dateExit || props.trade.date || Date.now()).getTime();
  let diff = end - start;
  if (diff < 0) diff = 0;
  
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const isRu = locale.value === 'ru';
  const parts = [];
  if (days > 0) parts.push({ num: String(days), unit: isRu ? 'д' : 'd' });
  if (hours > 0 || days > 0) parts.push({ num: String(hours), unit: isRu ? 'ч' : 'h' });
  if (minutes > 0 || hours > 0 || days > 0) parts.push({ num: String(minutes), unit: isRu ? 'м' : 'm' });
  parts.push({ num: String(seconds), unit: isRu ? 'с' : 's' });
  
  return parts;
});

const tradeDurationMinutes = computed(() => {
  if (!props.trade) return 0;
  const start = new Date(props.trade.date || Date.now()).getTime();
  const end = new Date(props.trade.dateExit || props.trade.date || Date.now()).getTime();
  return (end - start) / (1000 * 60);
});


const isStyleCompliant = computed(() => {
  const days = duration.value / 24;
  const limit = tradingStyleDurationLimit.value;
  if (limit) {
    if (limit.min !== undefined && days < limit.min) return false;
    if (limit.max !== undefined) {
      if (limit.maxExclusive ? days >= limit.max : days > limit.max) return false;
    }
  }

  const stats = scenarioDurationStats.value;
  if (stats.count === 0) return true;
  return days >= stats.minDays && days <= stats.maxDays;
});

const styleAlertMessage = computed(() => {
  const days = duration.value / 24;
  const isRu = locale.value === 'ru';
  const limit = tradingStyleDurationLimit.value;
  const styleName = resolvedTradingStyle.value;

  if (limit) {
    const belowMin = limit.min !== undefined && days < limit.min;
    const aboveMax = limit.max !== undefined && (limit.maxExclusive ? days >= limit.max : days > limit.max);
    if (belowMin || aboveMax) {
      const expected = limit.maxExclusive && limit.max === 1
        ? (isRu ? 'меньше 24ч' : 'under 24h')
        : durationAxisLabel.value.replace(/^Лимит стиля: |^Style limit: /, '');
      return isRu
        ? `Предупреждение: Длительность исполнения (${durationText.value}) не соответствует стилю «${styleName}». Ожидаемо: ${expected}.`
        : `Alert: Execution duration (${durationText.value}) does not match "${styleName}". Expected: ${expected}.`;
    }
  }

  const stats = scenarioDurationStats.value;
  if (stats.count === 0) return '';

  if (days < stats.minDays) {
    return isRu
      ? `Предупреждение: Длительность исполнения (${durationText.value}) ниже исторического минимума сценария (${stats.minDays.toFixed(2)} дн.).`
      : `Alert: Execution duration (${durationText.value}) is below the historical scenario minimum (${stats.minDays.toFixed(2)}d).`;
  }
  if (days > stats.maxDays) {
    return isRu
      ? `Предупреждение: Длительность исполнения (${durationText.value}) превышает исторический максимум сценария (${stats.maxDays.toFixed(2)} дн.).`
      : `Alert: Execution duration (${durationText.value}) exceeds the historical scenario maximum (${stats.maxDays.toFixed(2)}d).`;
  }
  return '';
});

const targetEfficiency = computed(() => percentileRank.value);
const animatedEfficiency = ref(0);
const isInitializing = ref(true);

onMounted(async () => {
  isInitializing.value = true;
  await ensureMatrixDataRestored();
  isInitializing.value = false;
  
  const duration = 1500; // 1.5s
  const start = performance.now();
  
  const step = (now: number) => {
    const progress = Math.min((now - start) / duration, 1);
    // Cubic out easing
    const eased = 1 - Math.pow(1 - progress, 3);
    animatedEfficiency.value = Math.floor(eased * targetEfficiency.value);
    
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };
  
  requestAnimationFrame(step);
});

const tacticalEfficiency = computed(() => animatedEfficiency.value);

// EMOTIONAL STATE CALCULATION
const emotionScores: Record<string, number> = {
  'Confidence': 10, 'confidence': 10,
  'Calm': 10, 'calm': 10,
  'Patience': 8, 'patience': 8,
  'Neutral': 0, 'neutral': 0,
  'Slight Anxiety': -5, 'anxiety': -5,
  'Boredom': -10, 'boredom': -10,
  'Frustration': -15, 'frustration': -15,
  'Fear': -15, 'fear': -15,
  'Greed': -20, 'greed': -20,
  'FOMO': -20, 'fomo': -20,
  'Anger': -25, 'anger': -25
};

const getEmotionName = (e: any): string => {
  if (!e) return '';
  if (typeof e === 'string') return e;
  if (typeof e === 'object' && e.name) return String(e.name);
  if (typeof e === 'object' && e.id) return String(e.id);
  return String(e);
};

const emotionMetrics = computed(() => {
  const all = allTrades.value;
  const currentExitRaw = props.trade?.exitTime ?? (props.trade as any)?.dateExit ?? (props.trade as any)?.date;
  const currentExitTime = currentExitRaw ? new Date(currentExitRaw).getTime() : Infinity;
  
  const result: Record<string, { score: number, frequency: number, prevFrequency: number, pf: number, prevPf: number }> = {};
  
  // Gather all unique emotions from the entire trade history + current trade
  const uniqueEmotions = new Set<string>();
  if (props.trade?.emotions) {
      props.trade.emotions.forEach(e => uniqueEmotions.add(getEmotionName(e)));
  }
  all.forEach(t => {
      const te = t as any;
      const allEmotions = [
          ...(te.emotions || []),
          ...(te.emotionsEntry || []),
          ...(te.emotionsDuring || []),
          ...(te.emotionsExit || [])
      ];
      allEmotions.forEach(e => uniqueEmotions.add(getEmotionName(e)));
  });

  // Initialize
  for (const emotion of uniqueEmotions) {
     result[emotion] = { 
        score: emotionScores[emotion] ?? 0, 
        frequency: 0, 
        prevFrequency: 0,
        pf: 0,
        prevPf: 0
     };
  }
  
  if (all.length === 0) return result;
  
  const allCount = all.length;
  const prevTrades = all.filter(t => {
      const tExit = (t as any).dateExit ?? (t as any).date;
      const exitTime = tExit ? new Date(tExit).getTime() : 0;
      return exitTime < currentExitTime;
  });
  const prevCount = prevTrades.length;
  
  for (const emotion of uniqueEmotions) {
      const entry = result[emotion];
      if (!entry) continue;

      const currentTrades = all.filter(t => {
          const te = t as any;
          const check = (list: any[]) => (list || []).some(e => getEmotionName(e) === emotion);
          return check(te.emotions) || check(te.emotionsEntry) || check(te.emotionsDuring) || check(te.emotionsExit);
      });
      entry.frequency = currentTrades.length / allCount;
      entry.pf = calcPF(currentTrades);
      
      if (prevCount === 0) {
          entry.prevFrequency = 0;
          entry.prevPf = 0;
      } else {
          const prevEmotionTrades = prevTrades.filter(t => {
              const te = t as any;
              const check = (list: any[]) => (list || []).some(e => getEmotionName(e) === emotion);
              return check(te.emotions);
          });
          entry.prevFrequency = prevEmotionTrades.length / prevCount;
          entry.prevPf = calcPF(prevEmotionTrades);
      }
  }
  
  return result;
});

import ExTooltip from "~/shared/ui/ExTooltip.vue"

const getPFColor = (pf: number) => {
  if (pf >= 2.2) return 'nier-text-primary border-black/40 dark:border-white/40 bg-black/[0.08] dark:bg-white/[0.08] shadow-[inset_0_0_10px_rgba(0,0,0,0.02)] dark:shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]';
  if (pf >= 1.8) return 'text-black/80 dark:text-white/80 border-black/20 dark:border-white/20 bg-black/[0.04] dark:bg-white/[0.04]';
  if (pf >= 1.5) return 'text-rose-600/70 border-rose-600/20 bg-rose-600/[0.03] dark:text-rose-300 dark:border-rose-300/20';
  if (pf >= 1.0) return 'text-rose-600 border-rose-600/30 bg-rose-600/[0.06] dark:text-rose-500';
  return 'text-rose-700 border-rose-700/40 bg-rose-700/[0.12] dark:text-rose-700 dark:border-rose-700/50';
}

const emotionalStateScore = computed(() => {
  const tradeEmotionsScore = (props.trade?.emotions || []).reduce((acc: number, curr: any) => acc + (emotionMetrics.value[getEmotionName(curr)]?.score || 0), 0);
  // Formula: Tactical_Efficiency + picked emotions + LAST EMOTIONAL STATE
  // Normalizing to 0-100 scale for simplicity
  const rawScore = tacticalEfficiency.value + tradeEmotionsScore + props.globalStability;
  return Math.max(0, Math.min(100, rawScore / 2.5)); // Adjusting divisor to keep it in 100 range
})

const emotionalStatus = computed(() => {
  const s = emotionalStateScore.value;
  if (s > 80) return { label: 'OPTIMAL', color: 'bg-emerald-400' };
  if (s > 60) return { label: 'STABLE', color: 'bg-green-300' };
  if (s > 40) return { label: 'NEUTRAL', color: 'bg-yellow-200' };
  if (s > 20) return { label: 'UNSTABLE', color: 'bg-orange-400' };
  return { label: 'CRITICAL', color: 'bg-red-500' };
})



const initialBalance = computed(() => {
  if (!props.trade) return 1000;
  return tradeStore.getInitialDeposit(props.trade.strategyId || 'MAIN_DIARY');
});

const balanceBeforeTrade = computed(() => {
  if (!props.trade) return 1000;

  const strategyId = props.trade.strategyId || 'MAIN_DIARY';
  const currentEntryTs = new Date(props.trade.date || props.trade.entryTime || props.trade.dateExit || Date.now()).getTime();
  const currentTradeId = props.trade.id;
  const startBalance = tradeStore.getInitialDeposit(strategyId);

  const toCashPnl = (trade: any) => {
    return getTradeCashPnl(trade, startBalance);
  };

  const priorTrades = allTrades.value
    .filter((trade: any) => {
      if (currentTradeId && trade?.id === currentTradeId) return false;
      if (!isClosedAnalysisTrade(trade)) return false;
      const tradeExitTs = new Date(trade?.dateExit || trade?.date || 0).getTime();
      return tradeExitTs > 0 && tradeExitTs < currentEntryTs;
    })
    .sort((a: any, b: any) => {
      const aTs = new Date(a?.dateExit || a?.date || 0).getTime();
      const bTs = new Date(b?.dateExit || b?.date || 0).getTime();
      return aTs - bTs;
    });

  return priorTrades.reduce((balance: number, trade: any) => balance + toCashPnl(trade), startBalance);
});

import ExEquityCurve2D from './ExEquityCurve2D.vue'

// REPORT GENERATION LOGIC

const reportTrades = computed(() => {
  if (!props.trade) return [];
  const historyTrades = allTrades.value;
  
  const currentTradeTime = new Date(props.trade.dateExit || props.trade.date || Date.now()).getTime();
  
  // Combine and ensure current trade is marked as projection for the curve to show it as "impact"
  const exists = historyTrades.some(t => t.id === props.trade.id);
  const combined = (exists ? [...historyTrades] : [...historyTrades, props.trade]).map(t => ({
    ...t,
    // We mark the current trade we are analyzing as the projection target
    isProjection: t.id === props.trade.id
  }));
  
  const sorted = combined.sort((a, b) => {
    const dA = new Date(a.dateExit || a.date || 0).getTime();
    const dB = new Date(b.dateExit || b.date || 0).getTime();
    return dA - dB;
  });
  
  // Filter: only show history up to this specific trade's exit
  return sorted.filter(t => {
    const tTime = new Date(t.dateExit || t.date || 0).getTime();
    return tTime <= currentTradeTime;
  });
});

const parsePositiveTradePrice = (value: any) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.NaN;
};

const getTradeDirection = (trade: any): 'LONG' | 'SHORT' | null => {
  const raw = String(trade?.side || trade?.direction || '').toUpperCase();
  if (raw.includes('SHORT')) return 'SHORT';
  if (raw.includes('LONG')) return 'LONG';
  return null;
};

const getDirectionalStopDistance = (entry: number, stopLoss: number, direction: 'LONG' | 'SHORT' | null) => {
  if (!Number.isFinite(entry) || !Number.isFinite(stopLoss)) return Number.NaN;
  if (direction === 'SHORT') return stopLoss > entry ? stopLoss - entry : Number.NaN;
  if (direction === 'LONG') return stopLoss < entry ? entry - stopLoss : Number.NaN;
  return Math.abs(entry - stopLoss);
};

const getDirectionalTargetDistance = (entry: number, takeProfit: number, direction: 'LONG' | 'SHORT' | null) => {
  if (!Number.isFinite(entry) || !Number.isFinite(takeProfit)) return Number.NaN;
  if (direction === 'SHORT') return takeProfit < entry ? entry - takeProfit : Number.NaN;
  if (direction === 'LONG') return takeProfit > entry ? takeProfit - entry : Number.NaN;
  return Math.abs(takeProfit - entry);
};

const RISK_FALLBACK_RATES: Record<string, number> = {
  EUR: 0.92,
  GBP: 0.78,
  JPY: 155,
  AUD: 1.53,
  CAD: 1.37,
  CHF: 0.90,
  NZD: 1.66
};

const normalizeTradeAssetSymbol = (asset: unknown) => String(asset || '').trim().toUpperCase();

const getTradeAssetVariants = (asset: unknown) => {
  const symbol = normalizeTradeAssetSymbol(asset);
  const compact = symbol.replace(/[^A-Z0-9]/g, '');
  const variants = new Set([symbol, compact]);

  if (/^[A-Z]{6}$/.test(compact)) {
    variants.add(`${compact.slice(0, 3)}/${compact.slice(3)}`);
  }

  return variants;
};

const resolveAnalysisAssetData = (trade: any) => {
  const variants = getTradeAssetVariants(trade?.asset || trade?.symbol || trade?.ticker);
  return (globalAssets as any[]).find((asset) => {
    const symbol = normalizeTradeAssetSymbol(asset?.symbol);
    const name = normalizeTradeAssetSymbol(asset?.name);
    const compactSymbol = symbol.replace(/[^A-Z0-9]/g, '');
    return variants.has(symbol) || variants.has(name) || variants.has(compactSymbol);
  });
};

const getAnalysisConversionRate = (currency: string) => {
  const normalized = String(currency || 'USD').toUpperCase();
  if (normalized === 'USD') return 1;
  try {
    const cached = typeof localStorage !== 'undefined'
      ? JSON.parse(localStorage.getItem('genesis_forex_rates') || '{}')
      : {};
    const cachedRate = Number(cached?.[normalized]);
    if (Number.isFinite(cachedRate) && cachedRate > 0) return cachedRate;
  } catch (error) {}
  return RISK_FALLBACK_RATES[normalized] || 1;
};

const isAnalysisForexTrade = (trade: any) => {
  const assetData = resolveAnalysisAssetData(trade);
  if (assetData) return String(assetData.type || '').toLowerCase() === 'forex';
  const symbol = normalizeTradeAssetSymbol(trade?.asset || trade?.symbol || trade?.ticker);
  const compact = symbol.replace(/[^A-Z]/g, '');
  return symbol.includes('/') || /^[A-Z]{6}$/.test(compact);
};

const calculateTradePriceMoveDollars = (trade: any, entryPrice: number, exitPrice: number, quantity: number) => {
  if (![entryPrice, exitPrice, quantity].every(Number.isFinite) || quantity <= 0) return Number.NaN;

  const direction = getTradeDirection(trade);
  const priceMove = direction === 'SHORT' ? entryPrice - exitPrice : exitPrice - entryPrice;

  if (isAnalysisForexTrade(trade)) {
    const symbol = normalizeTradeAssetSymbol(trade?.asset || trade?.symbol || trade?.ticker).replace(/[^A-Z]/g, '');
    const base = symbol.substring(0, 3);
    const quote = symbol.substring(3, 6);
    const isJpy = symbol.includes('JPY');
    const pips = isJpy ? priceMove * 100 : priceMove * 10000;
    const pipValue = quantity * 10;

    if (quote === 'USD') return pips * pipValue;
    if (isJpy) return (pips * pipValue * 100) / getAnalysisConversionRate('JPY');
    if (base === 'USD') return (pips * pipValue) / exitPrice;

    const quoteToUsdRate = 1 / getAnalysisConversionRate(quote);
    return (pips * pipValue) * quoteToUsdRate;
  }

  const assetData = resolveAnalysisAssetData(trade);
  if (assetData?.contractSize) {
    const rawProfit = priceMove * quantity * Number(assetData.contractSize);
    const assetCurrency = String(assetData.currency || 'USD').toUpperCase();
    return assetCurrency !== 'USD' ? rawProfit / getAnalysisConversionRate(assetCurrency) : rawProfit;
  }

  return priceMove * quantity;
};

const getSlDistPct = (t: any) => {
  if (!t) return Number.NaN;
  const entry = parsePositiveTradePrice(t.entry);
  const sl = parsePositiveTradePrice(t.stopLoss);
  const distance = getDirectionalStopDistance(entry, sl, getTradeDirection(t));
  return Number.isFinite(distance) && entry > 0 ? (distance / entry) * 100 : Number.NaN;
};

const getTpDistPct = (t: any) => {
  if (!t) return Number.NaN;
  const entry = parsePositiveTradePrice(t.entry);
  const tp = parsePositiveTradePrice(t.takeProfit);
  const distance = getDirectionalTargetDistance(entry, tp, getTradeDirection(t));
  return Number.isFinite(distance) && entry > 0 ? (distance / entry) * 100 : Number.NaN;
};

const currentSlDistPct = computed(() => {
  return getSlDistPct(props.trade);
});

const currentTpDistPct = computed(() => {
  return getTpDistPct(props.trade);
});

const strategyStats = computed(() => {
  if (!props.trade?.strategyId) return { avgPnl: 0, avgDuration: 0, avgRR: 0, avgVelocity: 0, avgAdherence: 0, avgSlDistPct: 0, avgTpDistPct: 0 };
  const trades = closedAllTrades.value;
  if (trades.length === 0) return { avgPnl: 0, avgDuration: 0, avgRR: 0, avgVelocity: 0, avgAdherence: 0, avgSlDistPct: 0, avgTpDistPct: 0 };
  
  const totalPnl = trades.reduce((acc, t) => acc + getNormalizedPnl(t), 0);
  const totalRR = trades.reduce((acc, t) => acc + (t.riskReward || 0), 0);
  const totalConditions = trades.reduce((acc, t) => acc + (t.boardConditions?.length || 0), 0);
  
  const totalDurationMs = trades.reduce((acc, t) => {
    const start = new Date(t.date).getTime();
    const end = new Date(t.dateExit || t.date).getTime();
    const diff = end - start;
    return acc + (diff > 0 ? diff : 0);
  }, 0);

  const totalDurationHours = totalDurationMs / (1000 * 60 * 60);

  const validSlTrades = trades.filter(t => Number.isFinite(getSlDistPct(t)));
  const totalSlDist = validSlTrades.reduce((acc, t) => acc + getSlDistPct(t), 0);
  const avgSlDistPct = validSlTrades.length > 0 ? totalSlDist / validSlTrades.length : 0;

  const validTpTrades = trades.filter(t => Number.isFinite(getTpDistPct(t)));
  const totalTpDist = validTpTrades.reduce((acc, t) => acc + getTpDistPct(t), 0);
  const avgTpDistPct = validTpTrades.length > 0 ? totalTpDist / validTpTrades.length : 0;

  return {
    avgPnl: totalPnl / trades.length,
    avgDuration: (totalDurationMs / trades.length) / (1000 * 60), // minutes
    avgRR: totalRR / trades.length,
    avgVelocity: totalDurationHours > 0 ? totalPnl / totalDurationHours : 0,
    avgAdherence: totalConditions / trades.length,
    avgSlDistPct,
    avgTpDistPct
  };
});

const tradeDetailStats = computed(() => {
  if (!props.trade) return { velocity: 0, yieldPct: 0, adherence: 0 };
  
  const durationHours = tradeDurationMinutes.value / 60;
  const pnl = currentTradePnl.value;
  const velocity = durationHours > 0 ? pnl / durationHours : pnl;
  const yieldPct = (pnl / balanceBeforeTrade.value) * 100;
  
  // Total conditions across all scenarios
  const adherence = props.trade.scenarios?.reduce((acc, s) => acc + (s.conditions?.length || 0), 0) || 0;
  
  return {
    velocity,
    yieldPct,
    adherence
  };
});

const resolvedRiskTradeNode = computed(() => {
  const risk = resolvedRiskManagement.value;
  if (risk.riskPerTradeValue === null) return null;
  return {
    params: {
      value: risk.riskPerTradeValue,
      unit: risk.riskPerTradeUnit
    }
  };
});

const resolvedRRNode = computed(() => {
  const risk = resolvedRiskManagement.value;
  if (risk.riskRewardRatio === null) return null;
  return {
    params: {
      value: risk.riskRewardRatio
    }
  };
});

const actualRR = computed(() => {
  return props.trade?.rr ?? (props.trade as any)?.riskReward ?? 0;
});

const targetRR = computed(() => {
  if (resolvedRRNode.value?.params?.value !== undefined) {
    const val = parseFloat(String(resolvedRRNode.value.params.value));
    if (!isNaN(val)) return val;
  }
  return strategyStats.value.avgRR || 0;
});

const plannedStopRiskDollars = computed(() => {
  const t = props.trade as any;
  if (!t) return Number.NaN;

  const entry = parsePositiveTradePrice(t.entry);
  const sl = parsePositiveTradePrice(t.stopLoss);
  const stopDistance = getDirectionalStopDistance(entry, sl, getTradeDirection(t));
  let size = parseFloat(t.size);

  if (Number.isFinite(stopDistance)) {
    if (isNaN(size) || size <= 0) {
      const sizeCurr = parseFloat(t.sizeInCurrency);
      if (!isNaN(sizeCurr) && sizeCurr > 0) {
        size = sizeCurr / entry;
      }
    }
    if (!isNaN(size) && size > 0) {
      const risk = Math.abs(calculateTradePriceMoveDollars(t, entry, sl, size));
      return Number.isFinite(risk) ? risk : stopDistance * size;
    }
  }

  return Number.NaN;
});

const realizedRiskDollars = computed(() => {
  const t = props.trade as any;
  if (!t) return 0;
  const pnl = getNormalizedPnl(t);
  return pnl < 0 ? Math.abs(pnl) : 0;
});

const actualRiskDollars = computed(() => {
  return plannedStopRiskDollars.value;
});

const actualRiskPct = computed(() => {
  if (balanceBeforeTrade.value <= 0) return 0;
  return (actualRiskDollars.value / balanceBeforeTrade.value) * 100;
});

const plannedStopRiskPct = computed(() => {
  if (balanceBeforeTrade.value <= 0) return 0;
  if (!Number.isFinite(plannedStopRiskDollars.value)) return Number.NaN;
  return (plannedStopRiskDollars.value / balanceBeforeTrade.value) * 100;
});

const realizedRiskPct = computed(() => {
  if (balanceBeforeTrade.value <= 0) return 0;
  return (realizedRiskDollars.value / balanceBeforeTrade.value) * 100;
});

const maxRiskTrade = computed(() => {
  if (!resolvedRiskTradeNode.value?.params) return null;
  const p = resolvedRiskTradeNode.value.params;
  const val = parseFloat(String(p.value));
  if (isNaN(val)) return null;
  return {
    value: val,
    unit: p.unit || '$'
  };
});

const riskBudgetDollars = computed(() => {
  if (!maxRiskTrade.value) return null;
  if (maxRiskTrade.value.unit === '%') {
    return (maxRiskTrade.value.value / 100) * balanceBeforeTrade.value;
  }
  return maxRiskTrade.value.value;
});

const tradeRiskAudit = computed(() => {
  const budget = riskBudgetDollars.value;
  const planned = plannedStopRiskDollars.value;
  const realized = realizedRiskDollars.value;
  const hasPlannedRisk = Number.isFinite(planned);
  const comparablePlanned = hasPlannedRisk ? planned : 0;
  const worst = Math.max(comparablePlanned, realized);
  const plannedRatio = budget && budget > 0 && hasPlannedRisk ? (planned / budget) * 100 : Number.NaN;
  const realizedRatio = budget && budget > 0 ? (realized / budget) * 100 : 0;
  const worstRatio = budget && budget > 0 ? (worst / budget) * 100 : 0;
  const plannedOk = hasPlannedRisk && (budget === null || planned <= budget);
  const realizedOk = budget === null || realized <= budget;
  const isRu = locale.value === 'ru';

  let status = isRu ? 'В лимите' : 'Within limit';
  let hint = isRu
    ? 'Риск по stop loss и фактический убыток находятся в пределах Risk Per Trade.'
    : 'Stop-loss risk and realized loss are within the Risk Per Trade budget.';

  if (!hasPlannedRisk && !realizedOk) {
    status = isRu ? 'Нет стопа + факт за лимитом' : 'No stop + realized breach';
    hint = isRu
      ? 'Stop loss не установлен, а фактический убыток превысил Risk Per Trade.'
      : 'Stop loss is not set and realized loss exceeded Risk Per Trade.';
  } else if (!hasPlannedRisk) {
    status = isRu ? 'Stop loss не задан' : 'Stop loss missing';
    hint = isRu
      ? 'Planned risk невозможно посчитать без установленного stop loss.'
      : 'Planned risk cannot be calculated without a stop loss.';
  } else if (!plannedOk && !realizedOk) {
    status = isRu ? 'Двойное превышение' : 'Double breach';
    hint = isRu
      ? 'И стоп был выставлен за пределами лимита, и фактический убыток превысил Risk Per Trade.'
      : 'Both stop placement and realized loss exceeded the Risk Per Trade budget.';
  } else if (!plannedOk) {
    status = isRu ? 'Стоп за лимитом' : 'Stop risk breach';
    hint = isRu
      ? 'Расстояние от entry до stop loss с учетом размера позиции превышает Risk Per Trade.'
      : 'The entry-to-stop distance, adjusted by position size, exceeds Risk Per Trade.';
  } else if (!realizedOk) {
    status = isRu ? 'Факт за лимитом' : 'Realized breach';
    hint = isRu
      ? 'Стоп был в лимите, но реализованный убыток превысил Risk Per Trade. Проверьте ручной выход, проскальзывание или изменение стопа.'
      : 'Stop risk was within budget, but realized loss exceeded Risk Per Trade. Check manual exit, slippage, or stop changes.';
  } else if (hasPlannedRisk && realized > planned && planned > 0) {
    status = isRu ? 'Факт хуже стопа' : 'Worse than stop';
    hint = isRu
      ? 'Фактический убыток больше риска по stop loss, даже если общий лимит не превышен.'
      : 'Realized loss is larger than the stop-loss risk, even though the total budget was not breached.';
  }

  return {
    budget,
    planned,
    realized,
    worst,
    plannedRatio,
    realizedRatio,
    worstRatio,
    plannedOk,
    realizedOk,
    hasPlannedRisk,
    ok: plannedOk && realizedOk && !(hasPlannedRisk && realized > planned && planned > 0),
    status,
    hint
  };
});

const protocolRecommendations = computed(() => {
  if (!enrichedTrade.value) return { recommended: [], avoid: [] };
  
  const allProtocols: { name: string; pf: number; freq: number; type: string }[] = [];
  
  enrichedTrade.value.scenarios.forEach(s => {
    if (!isDefaultProtocol(s.name)) {
      allProtocols.push({ name: s.name, pf: s.profitability, freq: s.frequency, type: 'SCENARIO' });
    }
    s.conditions.forEach(c => {
      if (!isDefaultProtocol(c.name)) {
        allProtocols.push({ name: c.name, pf: c.profitability, freq: c.frequency, type: 'CONDITION' });
      }
    });
  });
  
  // Unique by name, take highest PF
  const uniqueProtocols = Array.from(new Set(allProtocols.map(p => p.name)))
    .map(name => allProtocols.find(p => p.name === name)!)
    .sort((a, b) => b.pf - a.pf);
    
  return {
    recommended: uniqueProtocols.filter(p => p.pf >= 1.5).slice(0, 3),
    avoid: uniqueProtocols.filter(p => p.pf < 1.0).slice(0, 3)
  };
});

const tacticalAdvice = computed(() => {
  if (!props.trade) return { title: 'PENDING_ANALYSIS', message: 'Awaiting protocol data...', variant: 'neutral', ...protocolRecommendations.value };
  
  const isProfitable = currentTradePnl.value > 0;
  const isHighAdherence = (tradeDetailStats.value.adherence || 0) >= (strategyStats.value.avgAdherence || 1);
  const isStable = emotionalStateScore.value >= 40;
  
  let result = { 
    title: 'TACTICAL_REVIEW', 
    message: 'Session data integrated. Perform a manual review of archival logs to identify optimization vectors.', 
    variant: 'neutral',
    ...protocolRecommendations.value
  };
  
  if (isProfitable && isHighAdherence && isStable) {
    result = {
      title: 'OPTIMAL_EXECUTION',
      message: 'Protocol followed with high neural stability. Strategy core is stable. No adjustments required.',
      variant: 'success',
      ...protocolRecommendations.value
    };
  } else if (!isProfitable && isHighAdherence) {
    result = {
      title: 'STATISTICAL_VARIANCE',
      message: 'Strategic adherence confirmed. Negative outcome is a result of market variance, not execution error. Maintain current parameters.',
      variant: 'neutral',
      ...protocolRecommendations.value
    };
  } else if (isProfitable && !isHighAdherence) {
    result = {
      title: 'PROTOCOL_DIVERGENCE',
      message: 'Profit achieved through non-standard execution. High risk of unsustainable results. Recalibrate adherence to strategy core.',
      variant: 'warning',
      ...protocolRecommendations.value
    };
  } else if (!isStable) {
    result = {
      title: 'NEURAL_INSTABILITY',
      message: 'High emotional delta detected during session. Cognitive bias likely influenced execution protocols. Immediate recalibration recommended.',
      variant: 'danger',
      ...protocolRecommendations.value
    };
  }
  
  return result;
});

// -------------------------------------------------------------
// ADVANCED METRIC TAB FILTERING & TELEMETRY CALCULATIONS
// -------------------------------------------------------------
const activeReportMetricMode = ref<'simple' | 'advanced'>('simple');
const reportMetricModes: Array<{ id: 'simple' | 'advanced'; label: string }> = [
  { id: 'simple', label: 'Simple' },
  { id: 'advanced', label: 'Advanced' }
];
const activeMetricTab = ref('all'); // 'all', 'adherence', 'behavioural', 'execution'
const isTradeScoreExpanded = ref(false);

const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) return 'N/A';
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe < 0 ? '-' : ''}$${Math.abs(safe).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatRiskCurrency = (value: number) => Number.isFinite(value) ? `$${value.toFixed(2)}` : 'N/A';
const formatRiskPercent = (value: number) => Number.isFinite(value) ? `${value.toFixed(2)}%` : 'N/A';
const formatSignedStudyPercent = (value: number) => Number.isFinite(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : 'N/A';

const studyMetricText = computed(() => {
  const isRu = locale.value === 'ru';
  return {
    na: 'N/A',
    yes: isRu ? 'Да' : 'Yes',
    no: isRu ? 'Нет' : 'No',
    up: isRu ? 'Выросла' : 'Rose',
    down: isRu ? 'Упала' : 'Fell',
    points: isRu ? 'пункты' : 'pts',
    sectionTitle: isRu ? 'Анализ во время сделки' : 'In-Trade Analysis',
    labels: {
      meaningfulLossTime: isRu ? 'Время в значимом убытке' : 'Meaningful time in loss',
      meaningfulProfitTime: isRu ? 'Время в значимом плюсе' : 'Meaningful time in profit',
      maxMeaningfulDrawdown: isRu ? 'Макс. значимая просадка' : 'Max meaningful drawdown',
      maxFavorableExcursion: isRu ? 'Макс. движение в плюс' : 'Max favorable excursion',
      profitCaptureRatio: isRu ? 'Захват движения' : 'Profit capture ratio',
      pricePathShape: isRu ? 'Форма движения' : 'Price path shape',
      firstImpulseDirection: isRu ? 'Первый импульс' : 'First impulse',
      entryHeat: isRu ? 'Entry heat' : 'Entry heat',
      adverseBeforeProfit: isRu ? 'Просадка до плюса' : 'Adverse before profit',
      hadNews: isRu ? 'Новости во время сделки' : 'News during trade'
    },
    hints: {
      meaningfulLossTime: isRu
        ? 'Считает только движение за пределами шумовой зоны около входа. Ручная длительность имеет приоритет, если она введена.'
        : 'Counts only movement beyond the entry noise zone. Manual duration is used first when present.',
      meaningfulProfitTime: isRu
        ? 'Сколько времени публичная серия была в значимом плюсе относительно входа.'
        : 'How long the public candle series stayed in meaningful profit versus entry.',
      maxMeaningfulDrawdown: isRu
        ? 'Максимальная просадка от входа после фильтра шума. Ручный min/max имеет приоритет.'
        : 'Maximum adverse move from entry after the noise filter. Manual min/max has priority.',
      maxFavorableExcursion: isRu
        ? 'Максимальное благоприятное движение от входа. Ручный min/max имеет приоритет.'
        : 'Maximum favorable move from entry. Manual min/max has priority.',
      profitCaptureRatio: isRu
        ? 'Доля доступного движения, забранная фактическим выходом.'
        : 'Share of the available favorable move captured by the actual exit.',
      pricePathShape: isRu
        ? 'Классификация траектории по сгенерированным свечам; при ручных данных без свечей показывает ручной диапазон.'
        : 'Path classification from generated candles; manual-only ranges are marked separately.',
      firstImpulseDirection: isRu
        ? 'Первое значимое движение после входа: в сторону сделки или против нее.'
        : 'First meaningful move after entry: favorable or adverse.',
      entryHeat: isRu
        ? 'Время от входа до начала первого импульса, если первый импульс был просадкой.'
        : 'Time from entry to the first impulse start when that first impulse was adverse.',
      adverseBeforeProfit: isRu
        ? 'Показывает, была ли значимая просадка до первого значимого плюса.'
        : 'Shows whether meaningful adverse movement appeared before the first meaningful profit.',
      hadNews: isRu
        ? 'Ручная отметка пользователя о наличии новостей во время сделки.'
        : 'Manual user mark for whether news occurred during the trade.'
    },
    detail: {
      data: isRu ? 'Данные' : 'Data',
      period: isRu ? 'Период' : 'Period',
      start: isRu ? 'Начало' : 'Start',
      end: isRu ? 'Конец' : 'End',
      lossStart: isRu ? 'начало просадки' : 'drawdown start',
      lossEnd: isRu ? 'конец просадки' : 'drawdown end',
      profitStart: isRu ? 'начало плюса' : 'profit start',
      profitEnd: isRu ? 'конец плюса' : 'profit end',
      entry: 'Entry',
      exit: 'Exit',
      from: isRu ? 'от' : 'from',
      to: isRu ? 'до' : 'to',
      lossLevel: isRu ? 'уровень убытка' : 'loss level',
      profitLevel: isRu ? 'уровень плюса' : 'profit level',
      timeframe: isRu ? 'таймфрейм' : 'timeframe',
      sessionDay: isRu ? 'день сессии' : 'session day',
      realized: isRu ? 'реализовано' : 'realized',
      favorable: isRu ? 'доступное движение' : 'favorable move',
      captured: isRu ? 'захвачено' : 'captured',
      left: isRu ? 'оставлено' : 'left',
      source: isRu ? 'источник' : 'source',
      shape: isRu ? 'форма' : 'shape',
      firstLoss: isRu ? 'первая просадка' : 'first adverse',
      firstProfit: isRu ? 'первый плюс' : 'first profit',
      news: isRu ? 'новости' : 'news',
      impulse: isRu ? 'импульс' : 'impulse',
      delay: isRu ? 'длительность ожидания' : 'delay',
      flips: isRu ? 'смены состояний' : 'state flips',
      noiseShare: isRu ? 'доля шума' : 'noise share',
      drawdownPeriod: isRu ? 'просадка' : 'drawdown',
      recoveryPeriod: isRu ? 'восстановление' : 'recovery'
    },
    sources: {
      manual: isRu ? 'Ручные экстремумы' : 'Manual Extremes',
      manualInput: isRu ? 'Ручные данные' : 'Manual Input',
      generated: isRu ? 'Сгенерированные данные' : 'Generated Data',
      mixed: isRu ? 'Смешанные данные' : 'Mixed Data',
      none: 'N/A'
    },
    shapes: {
      trend_continuation: isRu ? 'Продолжение тренда' : 'Trend continuation',
      failed_follow_through: isRu ? 'Неудачное продолжение' : 'Failed follow-through',
      CHOPPY_PATH: isRu ? 'Рваное движение' : 'Choppy path',
      NOISE_RANGE: isRu ? 'Шумовой диапазон' : 'Noise range',
      ADVERSE_THEN_RECOVERY: isRu ? 'Просадка затем восстановление' : 'Adverse then recovery',
      FAVORABLE_THEN_PULLBACK: isRu ? 'Плюс затем откат' : 'Favorable then pullback',
      CLEAN_TREND_CAPTURE: isRu ? 'Чистый захват тренда' : 'Clean trend capture',
      LATE_EXIT_AFTER_MFE: isRu ? 'Поздний выход после MFE' : 'Late exit after MFE',
      FAVORABLE_FIRST: isRu ? 'Сначала плюс' : 'Favorable first',
      ADVERSE_FIRST: isRu ? 'Сначала просадка' : 'Adverse first',
      MANUAL_RANGE_ONLY: isRu ? 'Только ручной диапазон' : 'Manual range only'
    }
  };
});

const parseStudyNumber = (value: any) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
};

const currentTradeStudyMetrics = computed<Record<string, any>>(() => {
  const trade = props.trade as any;
  return trade?.tradeStudyMetrics || trade?.studyMetrics || {};
});

const hasTradeStudyMetrics = computed(() => {
  const trade = props.trade as any;
  return Boolean(trade?.tradeStudyMetrics || trade?.studyMetrics);
});

const isStudyForexTrade = computed(() => {
  const trade = props.trade as any;
  return String(trade?.assetType || '').toLowerCase() === 'forex';
});

const getTradeAssetKind = (trade: any) => {
  const type = String(trade?.assetType || '').trim().toLowerCase();
  if (['stocks', 'stock', 'equity', 'equities'].includes(type)) return 'stock';
  if (['forex', 'fx'].includes(type)) return 'forex';
  if (['crypto', 'cryptocurrency'].includes(type)) return 'crypto';
  if (['xstocks', 'xstock', 'tokenized stock'].includes(type)) return 'xstock';
  if (['metals', 'metal'].includes(type)) return 'metal';
  if (['commodities', 'commodity'].includes(type)) return 'commodity';
  if (['indices', 'index', 'indexes'].includes(type)) return 'index';
  return 'unknown';
};

const IN_TRADE_SESSION_DAY_SECONDS: Record<string, number> = {
  stock: 8 * 3600,
  forex: 24 * 3600,
  crypto: 24 * 3600,
  xstock: 24 * 3600,
  metal: 23 * 3600,
  commodity: 23 * 3600,
  index: 23 * 3600,
  unknown: 24 * 3600
};

const getInTradeSessionDaySeconds = (preferGenerated = true) => {
  if (preferGenerated) {
    const generatedSessionDay = parseStudyNumber(generatedInTradeAnalysis.value?.sessionDaySeconds);
    if (Number.isFinite(generatedSessionDay) && generatedSessionDay > 0) return generatedSessionDay;
  }
  return IN_TRADE_SESSION_DAY_SECONDS[getTradeAssetKind(props.trade)] || IN_TRADE_SESSION_DAY_SECONDS.unknown;
};

const formatStudyPrice = (value: any, isEntryOrExit = false) => {
  const numeric = parseStudyNumber(value);
  if (!Number.isFinite(numeric)) return studyMetricText.value.na;
  if (isStudyForexTrade.value) return `${numeric.toFixed(5)} ${studyMetricText.value.points}`;
  if (isEntryOrExit && ['stock', 'xstock', 'crypto'].includes(getTradeAssetKind(props.trade))) {
    return `$${numeric.toFixed(3)}`;
  }
  return `$${numeric.toFixed(2)}`;
};

const formatStudyDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return studyMetricText.value.na;

  const isRu = locale.value === 'ru';
  const sessionDaySeconds = getInTradeSessionDaySeconds();
  const days = Math.floor(seconds / sessionDaySeconds);
  const hours = Math.floor((seconds % sessionDaySeconds) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts: string[] = [];

  if (days > 0) parts.push(`${days}${isRu ? 'д' : 'd'}`);
  if (hours > 0 || days > 0) parts.push(`${hours}${isRu ? 'ч' : 'h'}`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}${isRu ? 'м' : 'm'}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}${isRu ? 'с' : 's'}`);

  return parts.join(' ');
};

const formatElapsedDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return studyMetricText.value.na;

  const isRu = locale.value === 'ru';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts: string[] = [];

  if (days > 0) parts.push(`${days}${isRu ? 'д' : 'd'}`);
  if (hours > 0 || days > 0) parts.push(`${hours}${isRu ? 'ч' : 'h'}`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}${isRu ? 'м' : 'm'}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}${isRu ? 'с' : 's'}`);

  return parts.join(' ');
};

const formatSessionLength = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return studyMetricText.value.na;
  const hours = seconds / 3600;
  const value = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return `${value}${locale.value === 'ru' ? 'ч' : 'h'}`;
};

const getStudyDurationSeconds = (prefix: string) => {
  const metrics = currentTradeStudyMetrics.value;
  const days = parseStudyNumber(metrics[`${prefix}Days`]) || 0;
  const hours = parseStudyNumber(metrics[`${prefix}Hours`]) || 0;
  const minutes = parseStudyNumber(metrics[`${prefix}Minutes`]) || 0;
  const seconds = parseStudyNumber(metrics[`${prefix}Seconds`]) || 0;
  return (days * getInTradeSessionDaySeconds()) + (hours * 3600) + (minutes * 60) + seconds;
};

const getTradeTimestamp = (value: any) => {
  const timestamp = new Date(value || 0).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
};

const getInTradeTimeRange = () => {
  const trade = props.trade as any;
  const start = getTradeTimestamp(trade?.date || trade?.entryTime);
  const end = getTradeTimestamp(trade?.dateExit || trade?.exitTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { start, end };
};

const formatInTradeTimestamp = (timestamp: number) => {
  if (!Number.isFinite(timestamp)) return studyMetricText.value.na;
  return new Intl.DateTimeFormat(locale.value === 'ru' ? 'ru-RU' : 'en-US', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
};

const getInTradePeriodValue = () => {
  const range = getInTradeTimeRange();
  if (!range) return studyMetricText.value.na;
  return `${formatInTradeTimestamp(range.start)} -> ${formatInTradeTimestamp(range.end)}`;
};

const getInTradeMetricPeriodBounds = (kind: 'loss' | 'profit') => {
  const analysis = generatedInTradeAnalysis.value;
  const start = parseStudyNumber(kind === 'loss' ? analysis.meaningfulLossStartTime : analysis.meaningfulProfitStartTime);
  const end = parseStudyNumber(kind === 'loss' ? analysis.meaningfulLossEndTime : analysis.meaningfulProfitEndTime);
  return {
    start: Number.isFinite(start) ? formatInTradeTimestamp(start) : studyMetricText.value.na,
    end: Number.isFinite(end) ? formatInTradeTimestamp(end) : studyMetricText.value.na
  };
};

const getInTradeTimeframeValue = () => String(generatedInTradeAnalysis.value?.timeframe || studyMetricText.value.na).toUpperCase();

const getInTradeThresholds = () => {
  const direction = getTradeDirection(props.trade);
  const entry = parsePositiveTradePrice((props.trade as any)?.entry);
  const noisePct = inTradeAnalysisNoisePct.value;
  if (!direction || !Number.isFinite(entry)) {
    return { entry, lossLevel: Number.NaN, profitLevel: Number.NaN };
  }
  return {
    entry,
    lossLevel: direction === 'LONG' ? entry * (1 - (noisePct / 100)) : entry * (1 + (noisePct / 100)),
    profitLevel: direction === 'LONG' ? entry * (1 + (noisePct / 100)) : entry * (1 - (noisePct / 100))
  };
};

const metricDetailRow = (label: string, value: string) => ({ label, value });

const getTimeMetricDetail = (kind: 'loss' | 'profit') => {
  const text = studyMetricText.value.detail;
  const bounds = getInTradeMetricPeriodBounds(kind);
  return [
    metricDetailRow(kind === 'loss' ? text.lossStart : text.profitStart, bounds.start),
    metricDetailRow(kind === 'loss' ? text.lossEnd : text.profitEnd, bounds.end)
  ];
};

const getDirectionalExtremePrice = (kind: 'drawdown' | 'favorable') => {
  const direction = getTradeDirection(props.trade);
  const extremes = inTradeExtremes.value;
  if (kind === 'drawdown') {
    return direction === 'LONG' ? extremes.minPrice : extremes.maxPrice;
  }
  return direction === 'LONG' ? extremes.maxPrice : extremes.minPrice;
};

const getMoveMetricDetail = (kind: 'drawdown' | 'favorable') => {
  const text = studyMetricText.value.detail;
  const entry = parsePositiveTradePrice((props.trade as any)?.entry);
  const target = getDirectionalExtremePrice(kind);
  const pct = kind === 'drawdown' ? inTradeMoveMetrics.value.maePct : inTradeMoveMetrics.value.mfePct;
  return [
    metricDetailRow(text.from, formatStudyPrice(entry, true)),
    metricDetailRow(text.to, formatStudyPrice(target)),
    metricDetailRow(kind === 'drawdown' ? text.lossLevel : text.profitLevel, formatSignedStudyPercent(pct))
  ];
};

const getCaptureMetricDetail = () => {
  const text = studyMetricText.value.detail;
  const direction = getTradeDirection(props.trade);
  const entry = parsePositiveTradePrice((props.trade as any)?.entry);
  const exit = parsePositiveTradePrice((props.trade as any)?.exit);
  const favorablePrice = getDirectionalExtremePrice('favorable');
  const realizedMove = Number.isFinite(exit) && Number.isFinite(entry)
    ? (direction === 'LONG' ? exit - entry : entry - exit)
    : Number.NaN;
  const favorableMove = Number.isFinite(favorablePrice) && Number.isFinite(entry)
    ? (direction === 'LONG' ? favorablePrice - entry : entry - favorablePrice)
    : Number.NaN;
  const capturedMove = Number.isFinite(realizedMove) ? Math.max(0, realizedMove) : Number.NaN;
  const leftMove = Number.isFinite(favorableMove) && Number.isFinite(capturedMove)
    ? Math.max(0, favorableMove - capturedMove)
    : Number.NaN;
  return [
    metricDetailRow(text.favorable, formatStudyPrice(favorableMove)),
    metricDetailRow(text.captured, formatCaptureRatio(inTradeMoveMetrics.value.captureRatio)),
    metricDetailRow(text.left, formatStudyPrice(leftMove)),
    metricDetailRow(text.exit, formatStudyPrice(exit, true))
  ];
};

const formatPathSegmentLabel = (state: string, index: number) => {
  const text = studyMetricText.value.detail;
  return `${state === 'loss' ? text.drawdownPeriod : text.recoveryPeriod} ${index + 1}`;
};

const getPathSegmentRows = () => {
  const text = studyMetricText.value.detail;
  const segments = Array.isArray(generatedInTradeAnalysis.value.pathSegments)
    ? generatedInTradeAnalysis.value.pathSegments
    : [];
  const counters: Record<string, number> = { loss: 0, profit: 0 };
  const rows = segments
    .filter((segment: any) => segment?.state === 'loss' || segment?.state === 'profit')
    .map((segment: any) => {
      const state = String(segment.state);
      const index = counters[state] || 0;
      counters[state] = index + 1;
      const start = parseStudyNumber(segment.start);
      const end = parseStudyNumber(segment.end);
      return metricDetailRow(
        formatPathSegmentLabel(state, index),
        Number.isFinite(start) && Number.isFinite(end)
          ? `${formatInTradeTimestamp(start)} -> ${formatInTradeTimestamp(end)}`
          : studyMetricText.value.na
      );
    });

  return rows.length ? rows : [metricDetailRow(text.period, studyMetricText.value.na)];
};

const getPathShapeMetricDetail = (shapeLabel: string) => {
  const text = studyMetricText.value.detail;
  return [
    metricDetailRow(text.shape, shapeLabel),
    metricDetailRow(text.timeframe, getInTradeTimeframeValue()),
    ...getPathSegmentRows()
  ];
};

const getFirstImpulseLabel = (value: any) => {
  const impulse = String(value || '').toUpperCase();
  const isRu = locale.value === 'ru';
  if (impulse === 'PROFIT') return isRu ? 'В плюс' : 'Favorable';
  if (impulse === 'LOSS') return isRu ? 'В минус' : 'Adverse';
  return studyMetricText.value.na;
};

const getFirstImpulseTone = (value: any) => {
  const impulse = String(value || '').toUpperCase();
  if (impulse === 'PROFIT') return 'positive';
  if (impulse === 'LOSS') return 'warning';
  return 'muted';
};

const formatEntryHeat = (seconds: number) => {
  if (Number.isFinite(seconds)) return formatElapsedDuration(seconds);
  return locale.value === 'ru' ? 'Нет просадки' : 'No adverse move';
};

const getEntryHeatTone = (seconds: number) => {
  if (!Number.isFinite(seconds)) return 'positive';
  if (seconds <= 15 * 60) return 'danger';
  if (seconds <= 60 * 60) return 'warning';
  return 'neutral';
};

const formatAdverseBeforeProfit = (value: any) => {
  if (value === true) return studyMetricText.value.yes;
  if (value === false) return studyMetricText.value.no;
  return studyMetricText.value.na;
};

const getFirstImpulseMetricDetail = () => {
  const text = studyMetricText.value.detail;
  const analysis = generatedInTradeAnalysis.value;
  const impulse = String(analysis.firstImpulseDirection || '').toUpperCase();
  const segments = Array.isArray(analysis.pathSegments) ? analysis.pathSegments : [];
  const firstMeaningfulSegment = segments.find((segment: any) => segment?.state === 'loss' || segment?.state === 'profit');
  const start = parseStudyNumber(firstMeaningfulSegment?.start);
  const end = parseStudyNumber(firstMeaningfulSegment?.end);
  return [
    metricDetailRow(text.impulse, getFirstImpulseLabel(analysis.firstImpulseDirection)),
    metricDetailRow(text.start, Number.isFinite(start) ? formatInTradeTimestamp(start) : studyMetricText.value.na),
    metricDetailRow(text.end, Number.isFinite(end) ? formatInTradeTimestamp(end) : studyMetricText.value.na)
  ];
};

const getEntryHeatMetricDetail = () => {
  const text = studyMetricText.value.detail;
  const analysis = generatedInTradeAnalysis.value;
  const heatSeconds = parseStudyNumber(analysis.entryHeatSeconds);
  const heatEnd = parseStudyNumber(analysis.entryHeatEndTime);
  const range = getInTradeTimeRange();
  return [
    metricDetailRow(text.delay, Number.isFinite(heatSeconds) ? formatElapsedDuration(heatSeconds) : studyMetricText.value.na),
    metricDetailRow(text.start, range ? formatInTradeTimestamp(range.start) : studyMetricText.value.na),
    metricDetailRow(text.end, Number.isFinite(heatEnd) ? formatInTradeTimestamp(heatEnd) : studyMetricText.value.na)
  ];
};

const getAdverseBeforeProfitMetricDetail = () => {
  const text = studyMetricText.value.detail;
  const analysis = generatedInTradeAnalysis.value;
  const firstLoss = parseStudyNumber(analysis.meaningfulLossStartTime);
  const firstProfit = parseStudyNumber(analysis.meaningfulProfitStartTime);
  return [
    metricDetailRow(text.firstLoss, Number.isFinite(firstLoss) ? formatInTradeTimestamp(firstLoss) : studyMetricText.value.na),
    metricDetailRow(text.firstProfit, Number.isFinite(firstProfit) ? formatInTradeTimestamp(firstProfit) : studyMetricText.value.na)
  ];
};

const getHadNewsMetricDetail = () => {
  const text = studyMetricText.value.detail;
  return [
    metricDetailRow(text.news, currentTradeStudyMetrics.value?.hadNews ? studyMetricText.value.yes : studyMetricText.value.no),
    metricDetailRow(text.data, studyMetricText.value.sources.manualInput)
  ];
};

const clampStudyScore = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const summarizePathCleanliness = (states: string[]) => {
  const validStates = states.filter(Boolean);
  const stateCount = validStates.length;
  if (!stateCount) return { score: Number.NaN, flips: Number.NaN, noiseSharePct: Number.NaN };

  let flips = 0;
  let previousMeaningful = '';
  let meaningfulCount = 0;
  let noiseCount = 0;

  validStates.forEach((state) => {
    if (state === 'noise') {
      noiseCount += 1;
      return;
    }
    meaningfulCount += 1;
    if (previousMeaningful && previousMeaningful !== state) flips += 1;
    previousMeaningful = state;
  });

  const noiseSharePct = (noiseCount / stateCount) * 100;
  const score = meaningfulCount
    ? Math.round(clampStudyScore(100 - (flips * 22) - (noiseSharePct * 0.25)))
    : 0;

  return { score, flips, noiseSharePct };
};

const STORED_CHART_TIMEFRAME_ORDER = ['1m', '15m', '1h', '4h'];
const DEFAULT_IN_TRADE_NOISE_PCT = 0.5;

const normalizeStoredAnalysisCandle = (candle: any) => {
  const normalized = {
    time: Number(candle?.time),
    open: Number(candle?.open),
    high: Number(candle?.high),
    low: Number(candle?.low),
    close: Number(candle?.close)
  };
  return Object.values(normalized).every(Number.isFinite) && normalized.high > 0 && normalized.low > 0 && normalized.high >= normalized.low
    ? normalized
    : null;
};

const getStoredAnalysisCandles = (metrics: Record<string, any>) => {
  const candlesByTimeframe = metrics?.generatedMarketData?.candlesByTimeframe;
  if (!candlesByTimeframe || typeof candlesByTimeframe !== 'object') return { timeframe: '', candles: [] as any[] };

  const timeframe = STORED_CHART_TIMEFRAME_ORDER.find(id => Array.isArray(candlesByTimeframe[id]) && candlesByTimeframe[id].length)
    || Object.keys(candlesByTimeframe).find(id => Array.isArray(candlesByTimeframe[id]) && candlesByTimeframe[id].length)
    || '';
  const candles = timeframe
    ? candlesByTimeframe[timeframe].map(normalizeStoredAnalysisCandle).filter(Boolean)
    : [];

  return { timeframe, candles };
};

const getStoredCandleWindow = (candles: any[], index: number, timeframeId: string) => {
  const current = Number(candles[index]?.time);
  const next = Number(candles[index + 1]?.time);
  const normalizedTimeframeId = String(timeframeId || '');
  const nominalStepSeconds = normalizedTimeframeId === '4h'
    ? 4 * 3600
    : normalizedTimeframeId === '1h'
      ? 3600
      : normalizedTimeframeId === '15m'
        ? 15 * 60
        : 60;
  const range = getInTradeTimeRange();
  if (Number.isFinite(current) && range) {
    const candleStart = current;
    const candleEnd = current + (nominalStepSeconds * 1000);
    const overlapStart = Math.max(candleStart, range.start);
    const overlapEnd = Math.min(candleEnd, range.end);
    return overlapEnd > overlapStart ? { start: overlapStart, end: overlapEnd } : null;
  }
  if (Number.isFinite(current) && Number.isFinite(next) && next > current) {
    return { start: current, end: current + Math.min(next - current, nominalStepSeconds * 1000) };
  }
  const previous = Number(candles[index - 1]?.time);
  if (Number.isFinite(current) && Number.isFinite(previous) && current > previous) {
    return { start: current, end: current + Math.min(current - previous, nominalStepSeconds * 1000) };
  }
  return Number.isFinite(current) ? { start: current, end: current + (nominalStepSeconds * 1000) } : null;
};

const getBodyAwareExtremePrices = (candles: any[], entryPrice: number) => {
  const confirmedHighs: number[] = [];
  const confirmedLows: number[] = [];
  let countedIndex = 0;

  candles.forEach((candle) => {
    const open = Number(candle.open);
    const close = Number(candle.close);
    const high = Number(candle.high);
    const low = Number(candle.low);
    if (![open, close, high, low].every(Number.isFinite)) return;

    const isFirstCountedCandle = countedIndex === 0;
    countedIndex += 1;

    if (isFirstCountedCandle) {
      if (close >= open) confirmedHighs.push(high);
      if (close <= open) confirmedLows.push(low);
      return;
    }

    const crossesEntry = low < entryPrice && high > entryPrice;
    const entirelyAboveEntry = low >= entryPrice;
    const entirelyBelowEntry = high <= entryPrice;

    if (entirelyAboveEntry || (crossesEntry && close >= open)) {
      confirmedHighs.push(high);
    }
    if (entirelyBelowEntry || (crossesEntry && close <= open)) {
      confirmedLows.push(low);
    }
  });

  return {
    maxPrice: confirmedHighs.length ? Math.max(...confirmedHighs) : entryPrice,
    minPrice: confirmedLows.length ? Math.min(...confirmedLows) : entryPrice
  };
};

const classifyStoredPricePathShape = (states: string[], firstImpulse: string | null, maePct: number, mfePct: number, captureRatio: number) => {
  const flips = states.reduce((count, state, index) => {
    if (!index || state === 'noise' || states[index - 1] === 'noise') return count;
    return state !== states[index - 1] ? count + 1 : count;
  }, 0);

  if (flips >= 3) return 'CHOPPY_PATH';
  if (Math.abs(maePct) < DEFAULT_IN_TRADE_NOISE_PCT && mfePct < DEFAULT_IN_TRADE_NOISE_PCT) return 'NOISE_RANGE';
  if (firstImpulse === 'LOSS' && mfePct >= DEFAULT_IN_TRADE_NOISE_PCT) return 'ADVERSE_THEN_RECOVERY';
  if (firstImpulse === 'PROFIT' && Math.abs(maePct) >= DEFAULT_IN_TRADE_NOISE_PCT) return 'FAVORABLE_THEN_PULLBACK';
  if (mfePct >= DEFAULT_IN_TRADE_NOISE_PCT && Number.isFinite(captureRatio) && captureRatio >= 65) return 'CLEAN_TREND_CAPTURE';
  if (mfePct >= DEFAULT_IN_TRADE_NOISE_PCT && Number.isFinite(captureRatio) && captureRatio < 35) return 'LATE_EXIT_AFTER_MFE';
  return firstImpulse === 'PROFIT' ? 'FAVORABLE_FIRST' : 'ADVERSE_FIRST';
};

const classifyStoredCandleState = (candle: any, direction: string, entry: number, lossLimit: number, profitLimit: number) => {
  const open = Number(candle.open);
  const close = Number(candle.close);
  const high = Number(candle.high);
  const low = Number(candle.low);
  if (![open, close, high, low].every(Number.isFinite)) return 'noise';

  const isBullish = close >= open;
  const isBearish = close <= open;
  const isLong = direction === 'LONG';
  const isLoss = isLong
    ? low <= lossLimit && (high <= entry || close <= entry || isBearish)
    : high >= lossLimit && (low >= entry || close >= entry || isBullish);
  const isProfit = isLong
    ? high >= profitLimit && (low >= entry || close >= entry || isBullish)
    : low <= profitLimit && (high <= entry || close <= entry || isBearish);

  if (isLoss && isProfit) {
    if (isLong) return close >= entry || isBullish ? 'profit' : 'loss';
    return close <= entry || isBearish ? 'profit' : 'loss';
  }
  if (isLoss) return 'loss';
  if (isProfit) return 'profit';
  return 'noise';
};

const buildGeneratedAnalysisFromStoredMarketData = (metrics: Record<string, any>) => {
  const direction = getTradeDirection(props.trade);
  const entry = parsePositiveTradePrice((props.trade as any)?.entry);
  const exit = parsePositiveTradePrice((props.trade as any)?.exit);
  const { timeframe, candles } = getStoredAnalysisCandles(metrics);
  if (!direction || !Number.isFinite(entry) || !candles.length) return {};

  const highs = candles.map(candle => Number(candle.high)).filter(Number.isFinite);
  const lows = candles.map(candle => Number(candle.low)).filter(Number.isFinite);
  if (!highs.length || !lows.length) return {};

  const { maxPrice, minPrice } = getBodyAwareExtremePrices(candles, entry);
  const lossLimit = direction === 'LONG'
    ? entry * (1 - (DEFAULT_IN_TRADE_NOISE_PCT / 100))
    : entry * (1 + (DEFAULT_IN_TRADE_NOISE_PCT / 100));
  const profitLimit = direction === 'LONG'
    ? entry * (1 + (DEFAULT_IN_TRADE_NOISE_PCT / 100))
    : entry * (1 - (DEFAULT_IN_TRADE_NOISE_PCT / 100));

  let meaningfulLossSeconds = 0;
  let meaningfulProfitSeconds = 0;
  let meaningfulLossStartTime: number | null = null;
  let meaningfulLossEndTime: number | null = null;
  let meaningfulProfitStartTime: number | null = null;
  let meaningfulProfitEndTime: number | null = null;
  let firstImpulse: string | null = null;
  const states: string[] = [];
  const pathSegments: Array<{ state: string; start: number; end: number }> = [];

  candles.forEach((candle, index) => {
    const state = classifyStoredCandleState(candle, direction, entry, lossLimit, profitLimit);
    const isLoss = state === 'loss';
    const isProfit = state === 'profit';
    const window = getStoredCandleWindow(candles, index, timeframe);
    const stepSeconds = window ? Math.max(0, (window.end - window.start) / 1000) : 0;

    if (isLoss) {
      meaningfulLossSeconds += stepSeconds;
      if (window) {
        meaningfulLossStartTime = meaningfulLossStartTime ?? window.start;
        meaningfulLossEndTime = window.end;
      }
    }
    if (isProfit) {
      meaningfulProfitSeconds += stepSeconds;
      if (window) {
        meaningfulProfitStartTime = meaningfulProfitStartTime ?? window.start;
        meaningfulProfitEndTime = window.end;
      }
    }
    if (!firstImpulse && (isLoss || isProfit)) firstImpulse = isLoss ? 'LOSS' : 'PROFIT';
    states.push(state);
    if (window) {
      const previous = pathSegments[pathSegments.length - 1];
      if (previous?.state === state && window.start <= previous.end + 1) {
        previous.end = window.end;
      } else {
        pathSegments.push({ state, start: window.start, end: window.end });
      }
    }
  });

  const rawMaePct = direction === 'LONG'
    ? ((minPrice - entry) / entry) * 100
    : ((entry - maxPrice) / entry) * 100;
  const rawMfePct = direction === 'LONG'
    ? ((maxPrice - entry) / entry) * 100
    : ((entry - minPrice) / entry) * 100;
  const maePct = rawMaePct <= -DEFAULT_IN_TRADE_NOISE_PCT ? rawMaePct : 0;
  const mfePct = rawMfePct >= DEFAULT_IN_TRADE_NOISE_PCT ? rawMfePct : 0;
  const maxFavorableMove = direction === 'LONG' ? maxPrice - entry : entry - minPrice;
  const realizedMove = Number.isFinite(exit) ? (direction === 'LONG' ? exit - entry : entry - exit) : Number.NaN;
  const captureRatio = maxFavorableMove > 0 && Number.isFinite(realizedMove) ? (realizedMove / maxFavorableMove) * 100 : Number.NaN;
  const pathCleanliness = summarizePathCleanliness(states);
  const tradeRange = getInTradeTimeRange();
  const firstMeaningfulSegment = pathSegments.find(segment => segment.state === 'loss' || segment.state === 'profit');
  const entryHeatEndTime = firstMeaningfulSegment?.state === 'loss' ? firstMeaningfulSegment.start : null;
  const entryHeatSeconds = entryHeatEndTime !== null && tradeRange
    ? Math.max(0, (entryHeatEndTime - tradeRange.start) / 1000)
    : Number.NaN;
  const adverseBeforeProfit = meaningfulProfitStartTime !== null
    ? Boolean(meaningfulLossStartTime !== null && meaningfulLossStartTime < meaningfulProfitStartTime)
    : null;

  return {
    source: 'generated',
    timeframe,
    noisePct: DEFAULT_IN_TRADE_NOISE_PCT,
    sessionDaySeconds: getInTradeSessionDaySeconds(false),
    direction,
    entry,
    exit: Number.isFinite(exit) ? exit : null,
    maxPrice,
    minPrice,
    meaningfulLossSeconds,
    meaningfulProfitSeconds,
    meaningfulLossStartTime,
    meaningfulLossEndTime,
    meaningfulProfitStartTime,
    meaningfulProfitEndTime,
    firstImpulseDirection: firstImpulse,
    entryHeatSeconds: Number.isFinite(entryHeatSeconds) ? entryHeatSeconds : null,
    entryHeatEndTime,
    adverseBeforeProfit,
    pathCleanlinessScore: Number.isFinite(pathCleanliness.score) ? pathCleanliness.score : null,
    pathFlipCount: Number.isFinite(pathCleanliness.flips) ? pathCleanliness.flips : null,
    pathNoiseSharePct: Number.isFinite(pathCleanliness.noiseSharePct) ? pathCleanliness.noiseSharePct : null,
    pathSegments,
    maxMeaningfulDrawdownPct: maePct,
    maxFavorableExcursionPct: mfePct,
    profitCaptureRatio: Number.isFinite(captureRatio) ? captureRatio : null,
    pricePathShape: classifyStoredPricePathShape(states, firstImpulse, maePct, mfePct, captureRatio)
  };
};

const generatedInTradeAnalysis = computed<Record<string, any>>(() => {
  const metrics = currentTradeStudyMetrics.value;
  const rebuilt = metrics?.generatedMarketData && typeof metrics.generatedMarketData === 'object'
    ? buildGeneratedAnalysisFromStoredMarketData(metrics)
    : {};
  if (metrics?.generatedInTradeAnalysis && typeof metrics.generatedInTradeAnalysis === 'object') {
    return {
      ...metrics.generatedInTradeAnalysis,
      ...rebuilt
    };
  }
  return rebuilt;
});

const inTradeAnalysisNoisePct = computed(() => {
  const generatedNoise = parseStudyNumber(generatedInTradeAnalysis.value.noisePct);
  return Number.isFinite(generatedNoise) && generatedNoise > 0 ? generatedNoise : 0.5;
});

const getManualMovePercent = (metrics: Record<string, any>, key: string, flagKey: string) => {
  if (!metrics?.[flagKey]) return Number.NaN;
  const value = parseStudyNumber(metrics[key]);
  return Number.isFinite(value) && value > 0 ? Math.abs(value) : Number.NaN;
};

const manualInTradeExtremes = computed(() => {
  const metrics = currentTradeStudyMetrics.value;
  const entry = parsePositiveTradePrice((props.trade as any)?.entry);
  const dropPct = getManualMovePercent(metrics, 'priceBelowEntryLongMovePercent', 'priceDroppedBelowEntryLong');
  const risePct = getManualMovePercent(metrics, 'priceAboveEntryShortMovePercent', 'priceRoseAboveEntryShort');
  const legacyMaxPrice = parseStudyNumber(metrics.maxPriceDuringTrade);
  const legacyMinPrice = parseStudyNumber(metrics.minPriceDuringTrade);
  const maxPrice = Number.isFinite(entry) && Number.isFinite(risePct)
    ? entry * (1 + (risePct / 100))
    : legacyMaxPrice;
  const minPrice = Number.isFinite(entry) && Number.isFinite(dropPct)
    ? Math.max(0, entry * (1 - (dropPct / 100)))
    : legacyMinPrice;

  return {
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : Number.NaN,
    minPrice: Number.isFinite(minPrice) && minPrice >= 0 ? minPrice : Number.NaN
  };
});

const inTradeExtremes = computed(() => {
  const manual = manualInTradeExtremes.value;
  const generated = generatedInTradeAnalysis.value;
  const generatedMax = parseStudyNumber(generated.maxPrice);
  const generatedMin = parseStudyNumber(generated.minPrice);
  const hasManualMax = Number.isFinite(manual.maxPrice);
  const hasManualMin = Number.isFinite(manual.minPrice);
  const hasGeneratedMax = Number.isFinite(generatedMax);
  const hasGeneratedMin = Number.isFinite(generatedMin);

  return {
    maxPrice: hasManualMax ? manual.maxPrice : (hasGeneratedMax ? generatedMax : Number.NaN),
    minPrice: hasManualMin ? manual.minPrice : (hasGeneratedMin ? generatedMin : Number.NaN),
    source: hasManualMax || hasManualMin
      ? ((hasGeneratedMax || hasGeneratedMin) ? 'mixed' : 'manual')
      : ((hasGeneratedMax || hasGeneratedMin) ? 'generated' : 'none')
  };
});

const inTradeLossSeconds = computed(() => {
  const metrics = currentTradeStudyMetrics.value;
  const direction = getTradeDirection(props.trade);
  if (direction === 'LONG' && metrics.priceDroppedBelowEntryLong) {
    const manualSeconds = getStudyDurationSeconds('priceBelowEntryLongDuration');
    if (manualSeconds > 0) return manualSeconds;
  }
  if (direction === 'SHORT' && metrics.priceRoseAboveEntryShort) {
    const manualSeconds = getStudyDurationSeconds('priceAboveEntryShortDuration');
    if (manualSeconds > 0) return manualSeconds;
  }
  const generatedSeconds = parseStudyNumber(generatedInTradeAnalysis.value.meaningfulLossSeconds);
  return Number.isFinite(generatedSeconds) && generatedSeconds > 0 ? generatedSeconds : Number.NaN;
});

const inTradeProfitSeconds = computed(() => {
  const generatedSeconds = parseStudyNumber(generatedInTradeAnalysis.value.meaningfulProfitSeconds);
  return Number.isFinite(generatedSeconds) && generatedSeconds > 0 ? generatedSeconds : Number.NaN;
});

const inTradeMoveMetrics = computed(() => {
  const direction = getTradeDirection(props.trade);
  const entry = parsePositiveTradePrice((props.trade as any)?.entry);
  const exit = parsePositiveTradePrice((props.trade as any)?.exit);
  const extremes = inTradeExtremes.value;
  const noisePct = inTradeAnalysisNoisePct.value;

  if (!Number.isFinite(entry) || entry <= 0 || !direction) {
    return {
      maePct: Number.NaN,
      mfePct: Number.NaN,
      captureRatio: Number.NaN
    };
  }

  const hasMax = Number.isFinite(extremes.maxPrice);
  const hasMin = Number.isFinite(extremes.minPrice);
  let rawMaePct = Number.NaN;
  let rawMfePct = Number.NaN;
  let maxFavorableMove = Number.NaN;

  if (direction === 'LONG') {
    rawMaePct = hasMin ? ((extremes.minPrice - entry) / entry) * 100 : Number.NaN;
    rawMfePct = hasMax ? ((extremes.maxPrice - entry) / entry) * 100 : Number.NaN;
    maxFavorableMove = hasMax ? extremes.maxPrice - entry : Number.NaN;
  } else {
    rawMaePct = hasMax ? ((entry - extremes.maxPrice) / entry) * 100 : Number.NaN;
    rawMfePct = hasMin ? ((entry - extremes.minPrice) / entry) * 100 : Number.NaN;
    maxFavorableMove = hasMin ? entry - extremes.minPrice : Number.NaN;
  }

  const maePct = Number.isFinite(rawMaePct) && rawMaePct <= -noisePct ? rawMaePct : 0;
  const mfePct = Number.isFinite(rawMfePct) && rawMfePct >= noisePct ? rawMfePct : 0;
  const realizedMove = Number.isFinite(exit)
    ? (direction === 'LONG' ? exit - entry : entry - exit)
    : Number.NaN;
  const generatedCaptureRatio = parseStudyNumber(generatedInTradeAnalysis.value.profitCaptureRatio);
  const captureRatio = maxFavorableMove > 0 && Number.isFinite(realizedMove)
    ? (realizedMove / maxFavorableMove) * 100
    : (Number.isFinite(generatedCaptureRatio) ? generatedCaptureRatio : Number.NaN);

  return {
    maePct,
    mfePct,
    captureRatio
  };
});

const getInTradeDataSourceLabel = () => {
  const text = studyMetricText.value;
  return text.sources[inTradeExtremes.value.source as keyof typeof text.sources] || text.sources.none;
};

const getDurationSourceLabel = (seconds: number, type: 'loss' | 'profit') => {
  if (!Number.isFinite(seconds)) return studyMetricText.value.sources.none;
  if (type === 'loss') {
    const metrics = currentTradeStudyMetrics.value;
    const direction = getTradeDirection(props.trade);
    const hasManualLoss = direction === 'LONG'
      ? metrics.priceDroppedBelowEntryLong && getStudyDurationSeconds('priceBelowEntryLongDuration') > 0
      : metrics.priceRoseAboveEntryShort && getStudyDurationSeconds('priceAboveEntryShortDuration') > 0;
    return hasManualLoss ? studyMetricText.value.sources.manual : studyMetricText.value.sources.generated;
  }
  return studyMetricText.value.sources.generated;
};

const formatCaptureRatio = (value: number) => {
  return Number.isFinite(value) ? `${value.toFixed(1)}%` : studyMetricText.value.na;
};

const inTradeAnalysisRows = computed(() => {
  const text = studyMetricText.value;
  const moveMetrics = inTradeMoveMetrics.value;
  const lossSeconds = inTradeLossSeconds.value;
  const profitSeconds = inTradeProfitSeconds.value;
  const sourceLabel = getInTradeDataSourceLabel();
  const shapeKey = String(generatedInTradeAnalysis.value.pricePathShape || (inTradeExtremes.value.source !== 'none' ? 'MANUAL_RANGE_ONLY' : ''));
  const shapeLabel = text.shapes[shapeKey as keyof typeof text.shapes] || text.na;
  const hasGeneratedShape = Boolean(generatedInTradeAnalysis.value.pricePathShape);
  const firstImpulseDirection = generatedInTradeAnalysis.value.firstImpulseDirection;
  const entryHeatSeconds = parseStudyNumber(generatedInTradeAnalysis.value.entryHeatSeconds);
  const hadNews = Boolean(currentTradeStudyMetrics.value?.hadNews);
  const hasGeneratedPathMetrics = Boolean(generatedInTradeAnalysis.value.source === 'generated' || generatedInTradeAnalysis.value.pricePathShape);

  return [
    {
      id: 'meaningfulLossTime',
      label: text.labels.meaningfulLossTime,
      value: formatStudyDuration(lossSeconds),
      subvalue: getDurationSourceLabel(lossSeconds, 'loss'),
      hint: text.hints.meaningfulLossTime,
      detail: getTimeMetricDetail('loss'),
      tone: Number.isFinite(lossSeconds) ? 'warning' : 'muted'
    },
    {
      id: 'meaningfulProfitTime',
      label: text.labels.meaningfulProfitTime,
      value: formatStudyDuration(profitSeconds),
      subvalue: getDurationSourceLabel(profitSeconds, 'profit'),
      hint: text.hints.meaningfulProfitTime,
      detail: getTimeMetricDetail('profit'),
      tone: Number.isFinite(profitSeconds) ? 'positive' : 'muted'
    },
    {
      id: 'maxMeaningfulDrawdown',
      label: text.labels.maxMeaningfulDrawdown,
      value: formatSignedStudyPercent(moveMetrics.maePct),
      subvalue: sourceLabel,
      hint: text.hints.maxMeaningfulDrawdown,
      detail: getMoveMetricDetail('drawdown'),
      tone: Number.isFinite(moveMetrics.maePct) && moveMetrics.maePct < 0 ? 'danger' : (Number.isFinite(moveMetrics.maePct) ? 'neutral' : 'muted')
    },
    {
      id: 'maxFavorableExcursion',
      label: text.labels.maxFavorableExcursion,
      value: formatSignedStudyPercent(moveMetrics.mfePct),
      subvalue: sourceLabel,
      hint: text.hints.maxFavorableExcursion,
      detail: getMoveMetricDetail('favorable'),
      tone: Number.isFinite(moveMetrics.mfePct) && moveMetrics.mfePct > 0 ? 'positive' : (Number.isFinite(moveMetrics.mfePct) ? 'neutral' : 'muted')
    },
    {
      id: 'profitCaptureRatio',
      label: text.labels.profitCaptureRatio,
      value: formatCaptureRatio(moveMetrics.captureRatio),
      subvalue: sourceLabel,
      hint: text.hints.profitCaptureRatio,
      detail: getCaptureMetricDetail(),
      tone: Number.isFinite(moveMetrics.captureRatio)
        ? (moveMetrics.captureRatio >= 65 ? 'positive' : (moveMetrics.captureRatio >= 35 ? 'warning' : 'danger'))
        : 'muted'
    },
    {
      id: 'pricePathShape',
      label: text.labels.pricePathShape,
      value: shapeLabel,
      subvalue: hasGeneratedShape ? text.sources.generated : sourceLabel,
      hint: text.hints.pricePathShape,
      detail: getPathShapeMetricDetail(shapeLabel),
      tone: hasGeneratedShape ? 'neutral' : (shapeKey ? 'warning' : 'muted')
    },
    {
      id: 'firstImpulseDirection',
      label: text.labels.firstImpulseDirection,
      value: getFirstImpulseLabel(firstImpulseDirection),
      subvalue: hasGeneratedPathMetrics ? text.sources.generated : text.sources.none,
      hint: text.hints.firstImpulseDirection,
      detail: getFirstImpulseMetricDetail(),
      tone: getFirstImpulseTone(firstImpulseDirection)
    },
    {
      id: 'entryHeat',
      label: text.labels.entryHeat,
      value: formatEntryHeat(entryHeatSeconds),
      subvalue: hasGeneratedPathMetrics ? text.sources.generated : text.sources.none,
      hint: text.hints.entryHeat,
      detail: getEntryHeatMetricDetail(),
      tone: getEntryHeatTone(entryHeatSeconds)
    },
    {
      id: 'adverseBeforeProfit',
      label: text.labels.adverseBeforeProfit,
      value: formatAdverseBeforeProfit(generatedInTradeAnalysis.value.adverseBeforeProfit),
      subvalue: hasGeneratedPathMetrics ? text.sources.generated : text.sources.none,
      hint: text.hints.adverseBeforeProfit,
      detail: getAdverseBeforeProfitMetricDetail(),
      tone: generatedInTradeAnalysis.value.adverseBeforeProfit === true ? 'warning' : (generatedInTradeAnalysis.value.adverseBeforeProfit === false ? 'positive' : 'muted')
    },
    {
      id: 'hadNews',
      label: text.labels.hadNews,
      value: hadNews ? text.yes : text.no,
      subvalue: text.sources.manualInput,
      hint: text.hints.hadNews,
      detail: getHadNewsMetricDetail(),
      tone: hadNews ? 'warning' : 'neutral'
    }
  ];
});

const visibleInTradeAnalysisRows = computed(() => {
  return ['all', 'in_trade'].includes(activeMetricTab.value) ? inTradeAnalysisRows.value : [];
});

const advancedMetricTabs = computed(() => [
  { id: 'all', label: locale.value === 'ru' ? 'Все' : 'All', count: 37 },
  { id: 'adherence', label: locale.value === 'ru' ? 'Matrix adherence' : 'Matrix Adherence', count: 5 },
  { id: 'behavioural', label: locale.value === 'ru' ? 'Поведение' : 'Behavioural', count: 5 },
  { id: 'execution', label: locale.value === 'ru' ? 'Исполнение и риск' : 'Execution & Risk', count: 8 },
  { id: 'strategy_execution', label: locale.value === 'ru' ? 'Стратегия vs исполнение' : 'Strategy vs. Execution', count: 9 },
  { id: 'in_trade', label: studyMetricText.value.sectionTitle, count: inTradeAnalysisRows.value.length }
]);

type CorrelationMetricKind = 'numeric' | 'category';
type CorrelationMetricFormat = 'currency' | 'percent' | 'ratio' | 'duration' | 'score' | 'count' | 'text';

interface CorrelationMetricConfig {
  id: string;
  label: string;
  group: string;
  kind: CorrelationMetricKind;
  format: CorrelationMetricFormat;
  extract: (trade: any) => number | string | null;
}

interface CorrelationPoint {
  id: string;
  asset: string;
  date: string;
  x: number;
  y: number;
  xLabel: string;
  yLabel: string;
  xPct: number;
  yPct: number;
}

interface CorrelationBucket {
  label: string;
  count: number;
  avgPnl: number;
  winRate: number;
  min: number;
  max: number;
}

interface CorrelationCategoryBucket {
  label: string;
  count: number;
  avgPnl: number;
  winRate: number;
  xPct: number;
  trades: Array<{ id: string; asset: string; pnl: number }>;
}

interface MetricEquityCurvePoint {
  id: string;
  x: number;
  metricY: number;
  equityY: number;
  metricValue: number;
  metricLabel: string;
  equity: number;
  equityLabel: string;
  asset: string;
  date: string;
}

const activeCorrelationMetricId = ref<string | null>(null);

const normalizeMetricLookupKey = (value: any) => String(value || '')
  .trim()
  .replace(/\s+/g, '_')
  .toUpperCase();

const getTradePnlValue = (trade: any) => getNormalizedPnl(trade);

const getTradeDurationHoursForMetric = (trade: any) => {
  const start = new Date(trade?.date || trade?.entryTime || 0).getTime();
  const end = new Date(trade?.dateExit || trade?.exitTime || trade?.date || 0).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return Number.NaN;
  return (end - start) / (1000 * 60 * 60);
};

const getCashPnlForMetric = (trade: any) => {
  return getTradeCashPnl(trade, initialBalance.value);
};

const getBalanceBeforeTradeForMetric = (trade: any) => {
  const strategyId = trade?.strategyId || props.trade?.strategyId || '';
  const startBalance = tradeStore.getInitialDeposit(strategyId) || 1000;
  const currentEntryTs = new Date(trade?.date || trade?.entryTime || trade?.dateExit || Date.now()).getTime();
  const currentTradeId = trade?.id;

  return allTrades.value
    .filter((item: any) => {
      if (currentTradeId && item?.id === currentTradeId) return false;
      if (!isClosedAnalysisTrade(item)) return false;
      const tradeExitTs = new Date(item?.dateExit || item?.date || 0).getTime();
      return tradeExitTs > 0 && tradeExitTs < currentEntryTs;
    })
    .reduce((balance: number, item: any) => balance + getCashPnlForMetric(item), startBalance);
};

const getTradeRrForMetric = (trade: any) => {
  const stored = parseStudyNumber(trade?.rr ?? trade?.riskReward);
  if (Number.isFinite(stored) && stored > 0) return stored;
  const entry = parsePositiveTradePrice(trade?.entry);
  const stopLoss = parsePositiveTradePrice(trade?.stopLoss);
  const takeProfit = parsePositiveTradePrice(trade?.takeProfit);
  const direction = getTradeDirection(trade);
  const stopDistance = getDirectionalStopDistance(entry, stopLoss, direction);
  const targetDistance = getDirectionalTargetDistance(entry, takeProfit, direction);
  return Number.isFinite(stopDistance) && stopDistance > 0 && Number.isFinite(targetDistance) && targetDistance > 0
    ? targetDistance / stopDistance
    : Number.NaN;
};

const getPlannedStopRiskDollarsForMetric = (trade: any) => {
  const entry = parsePositiveTradePrice(trade?.entry);
  const stopLoss = parsePositiveTradePrice(trade?.stopLoss);
  const stopDistance = getDirectionalStopDistance(entry, stopLoss, getTradeDirection(trade));
  let size = parseStudyNumber(trade?.size);

  if (!Number.isFinite(stopDistance)) return Number.NaN;
  if (!Number.isFinite(size) || size <= 0) {
    const sizeInCurrency = parseStudyNumber(trade?.sizeInCurrency);
    if (Number.isFinite(sizeInCurrency) && sizeInCurrency > 0 && Number.isFinite(entry) && entry > 0) {
      size = sizeInCurrency / entry;
    }
  }

  if (!Number.isFinite(size) || size <= 0) return Number.NaN;
  const risk = Math.abs(calculateTradePriceMoveDollars(trade, entry, stopLoss, size));
  return Number.isFinite(risk) ? risk : stopDistance * size;
};

const getRealizedRiskDollarsForMetric = (trade: any) => {
  const pnl = getCashPnlForMetric(trade);
  return pnl < 0 ? Math.abs(pnl) : 0;
};

const getRiskBudgetDollarsForMetric = (trade: any) => {
  const risk = resolvedRiskManagement.value;
  const value = risk.riskPerTradeValue;
  if (value === null || value === undefined) return Number.NaN;
  if (risk.riskPerTradeUnit === '%') {
    return (Number(value) / 100) * getBalanceBeforeTradeForMetric(trade);
  }
  return Number(value);
};

const getRiskBudgetRatioForMetric = (trade: any) => {
  const budget = getRiskBudgetDollarsForMetric(trade);
  if (!Number.isFinite(budget) || budget <= 0) return Number.NaN;
  const planned = getPlannedStopRiskDollarsForMetric(trade);
  const realized = getRealizedRiskDollarsForMetric(trade);
  const worst = Math.max(Number.isFinite(planned) ? planned : 0, realized);
  return (worst / budget) * 100;
};

const getRequiredAdherenceForMetric = (trade: any) => {
  const required = getEntryRequiredConditionSnapshot(trade);
  if (!required.length) return Number.NaN;
  const executedKeys = new Set(getEntryExecutedConditions(trade).map(conditionIdentity).filter(Boolean));
  const used = required.filter((condition: any) => executedKeys.has(conditionIdentity(condition))).length;
  return (used / required.length) * 100;
};

const getRuleCountForMetric = (trade: any) => {
  const scenarioRules = trade?.boardScenarioEntry?.info?.conditions;
  if (Array.isArray(scenarioRules)) return scenarioRules.length;
  if (Array.isArray(trade?.boardConditions)) return trade.boardConditions.length;
  return 0;
};

const getAdditionalConditionCountForMetric = (trade: any) => {
  const conditions = trade?.boardScenarioEntry?.info?.conditions;
  return Array.isArray(conditions)
    ? conditions.filter((condition: any) => condition?.info?.priority === 'ADDITIONAL' || condition?.priority === 'ADDITIONAL').length
    : 0;
};

const getSetupComplexityForMetric = (trade: any) => {
  const scenarioId = trade?.boardScenarioEntry?.id;
  const counts = closedAllTrades.value
    .filter((item: any) => !scenarioId || item?.boardScenarioEntry?.id === scenarioId)
    .map(getRuleCountForMetric)
    .filter((count: number) => count > 0)
    .sort((a: number, b: number) => a - b);
  if (!counts.length) return Number.NaN;
  const median = counts.length % 2
    ? counts[(counts.length - 1) / 2]
    : (counts[(counts.length / 2) - 1] + counts[counts.length / 2]) / 2;
  return median > 0 ? getRuleCountForMetric(trade) / median : Number.NaN;
};

const NEGATIVE_CORRELATION_EMOTIONS = new Set([
  'fomo', 'revenge', 'greed', 'fear', 'tilt', 'anxiety', 'boredom', 'fatigue', 'anger', 'impatience', 'frustration'
]);

const getTradeEmotionsForMetric = (trade: any) => Array.isArray(trade?.emotions)
  ? trade.emotions.map((emotion: any) => getEmotionName(emotion))
  : [];

const getNegativeEmotionsForMetric = (trade: any) => {
  return getTradeEmotionsForMetric(trade).filter((emotion: string) => NEGATIVE_CORRELATION_EMOTIONS.has(emotion.toLowerCase()));
};

const getCognitiveStabilityForMetric = (trade: any) => {
  return Math.max(10, 100 - (getNegativeEmotionsForMetric(trade).length * 15));
};

const getDominantBiasForMetric = (trade: any) => {
  const negative = getNegativeEmotionsForMetric(trade);
  if (!negative.length) return 'None';
  const priority = ['fomo', 'revenge', 'greed', 'fear', 'tilt', 'fatigue', 'boredom', 'frustration'];
  const match = priority.find((item) => negative.some((emotion: string) => emotion.toLowerCase() === item));
  return (match || negative[0]).toUpperCase();
};

const getFrictionDensityForMetric = (trade: any) => {
  const emotions = getTradeEmotionsForMetric(trade);
  if (!emotions.length) return 0;
  return (getNegativeEmotionsForMetric(trade).length / emotions.length) * 100;
};

const getYieldPctForMetric = (trade: any) => {
  const balance = getBalanceBeforeTradeForMetric(trade);
  return balance > 0 ? (getTradePnlValue(trade) / balance) * 100 : Number.NaN;
};

const getProfitVelocityForMetric = (trade: any) => {
  const hours = getTradeDurationHoursForMetric(trade);
  return Number.isFinite(hours) && hours > 0 ? getTradePnlValue(trade) / hours : Number.NaN;
};

const getTpCaptureForMetric = (trade: any) => {
  const entry = parsePositiveTradePrice(trade?.entry);
  const exit = parsePositiveTradePrice(trade?.exit);
  const tp = parsePositiveTradePrice(trade?.takeProfit);
  const direction = getTradeDirection(trade);
  const plannedDist = getDirectionalTargetDistance(entry, tp, direction);
  const isLong = direction !== 'SHORT';
  const actualDist = isLong ? Math.max(0, exit - entry) : Math.max(0, entry - exit);
  return Number.isFinite(plannedDist) && plannedDist > 0 ? Math.min(100, (actualDist / plannedDist) * 100) : Number.NaN;
};

const getSlExecutionDragForMetric = (trade: any) => {
  const entry = parsePositiveTradePrice(trade?.entry);
  const exit = parsePositiveTradePrice(trade?.exit);
  const stopLoss = parsePositiveTradePrice(trade?.stopLoss);
  const pnl = getCashPnlForMetric(trade);
  const direction = getTradeDirection(trade);
  const isLong = direction !== 'SHORT';
  if (!(Number.isFinite(entry) && Number.isFinite(exit) && Number.isFinite(stopLoss)) || pnl >= 0) return 0;
  const diff = isLong ? (exit - stopLoss) : (stopLoss - exit);
  return diff * (parseStudyNumber(trade?.size) || 1);
};

const getEdgeQuotientForMetric = (trade: any) => {
  const expectedRR = targetRR.value || strategyStats.value.avgRR || 1;
  const realizedRR = getTradeRrForMetric(trade);
  return expectedRR > 0 && Number.isFinite(realizedRR) ? realizedRR / expectedRR : Number.NaN;
};

const getUnrealizedAlphaLeftForMetric = (trade: any) => {
  const entry = parsePositiveTradePrice(trade?.entry);
  const exit = parsePositiveTradePrice(trade?.exit);
  const tp = parsePositiveTradePrice(trade?.takeProfit);
  const pnl = getCashPnlForMetric(trade);
  const direction = getTradeDirection(trade);
  const targetDistance = getDirectionalTargetDistance(entry, tp, direction);
  const exitDistance = Math.abs(exit - entry);
  const size = parseStudyNumber(trade?.size) || (exitDistance > 0 ? Math.abs(pnl) / exitDistance : 0);
  const plannedPnl = Number.isFinite(targetDistance) && size > 0 ? targetDistance * size : Number.NaN;
  return Number.isFinite(plannedPnl) && plannedPnl > pnl ? plannedPnl - pnl : 0;
};

const getScenarioDurationRangeForMetric = (trade: any) => {
  const scenarioId = trade?.boardScenarioEntry?.id;
  if (!scenarioId) return { minDays: 0, maxDays: 0, count: 0 };
  const durations = closedAllTrades.value
    .filter((item: any) => item?.id !== trade?.id && item?.boardScenarioEntry?.id === scenarioId)
    .map((item: any) => getTradeDurationHoursForMetric(item) / 24)
    .filter((days: number) => Number.isFinite(days) && days > 0)
    .sort((a: number, b: number) => a - b);
  if (!durations.length) return { minDays: 0, maxDays: 0, count: 0 };
  return { minDays: durations[0], maxDays: durations[durations.length - 1], count: durations.length };
};

const getHorizonSyncForMetric = (trade: any) => {
  const range = getScenarioDurationRangeForMetric(trade);
  if (!range.count) return Number.NaN;
  const days = getTradeDurationHoursForMetric(trade) / 24;
  const span = Math.max(range.maxDays - range.minDays, 0.0001);
  return Math.min(100, Math.max(0, ((days - range.minDays) / span) * 100));
};

const getVelocityVarianceForMetric = (trade: any) => {
  const baseline = strategyStats.value.avgVelocity || 1;
  const velocity = getProfitVelocityForMetric(trade);
  return baseline > 0 && Number.isFinite(velocity) ? velocity / baseline : Number.NaN;
};

const getAlphaDecayForMetric = (trade: any) => {
  const required = getEntryRequiredConditionSnapshot(trade);
  if (!required.length || !getNegativeEmotionsForMetric(trade).length) return 0;
  const executedKeys = new Set(getEntryExecutedConditions(trade).map(conditionIdentity).filter(Boolean));
  return required.filter((condition: any) => !executedKeys.has(conditionIdentity(condition))).length;
};

const getExecutionConfidenceForMetric = (trade: any) => {
  const adherenceScore = Number.isFinite(getRequiredAdherenceForMetric(trade)) ? getRequiredAdherenceForMetric(trade) : 100;
  const tpScore = Number.isFinite(getTpCaptureForMetric(trade)) ? getTpCaptureForMetric(trade) : 100;
  const riskRatio = getRiskBudgetRatioForMetric(trade);
  const riskScore = Number.isFinite(riskRatio) ? (riskRatio <= 100 ? 100 : Math.max(0, 100 - (riskRatio - 100))) : 100;
  const stability = getCognitiveStabilityForMetric(trade);
  return Math.round((adherenceScore * 0.3) + (tpScore * 0.3) + (riskScore * 0.2) + (stability * 0.2));
};

const getTradeStudyMetricsForMetric = (trade: any) => trade?.tradeStudyMetrics || trade?.studyMetrics || {};

const getGeneratedStudyForMetric = (trade: any) => {
  const metrics = getTradeStudyMetricsForMetric(trade);
  return metrics?.generatedInTradeAnalysis || trade?.generatedInTradeAnalysis || {};
};

const getStudyDurationSecondsForMetric = (trade: any, prefix: string) => {
  const metrics = getTradeStudyMetricsForMetric(trade);
  const days = parseStudyNumber(metrics[`${prefix}Days`]) || 0;
  const hours = parseStudyNumber(metrics[`${prefix}Hours`]) || 0;
  const minutes = parseStudyNumber(metrics[`${prefix}Minutes`]) || 0;
  const seconds = parseStudyNumber(metrics[`${prefix}Seconds`]) || 0;
  const total = (days * 86400) + (hours * 3600) + (minutes * 60) + seconds;
  return total > 0 ? total : Number.NaN;
};

const getInTradeMetricValueForCorrelation = (trade: any, id: string): number | string | null => {
  const generated = getGeneratedStudyForMetric(trade);
  const metrics = getTradeStudyMetricsForMetric(trade);
  if (id === 'meaningfulLossTime') {
    const manual = getStudyDurationSecondsForMetric(trade, 'meaningfulLoss');
    return Number.isFinite(manual) ? manual / 3600 : parseStudyNumber(generated.meaningfulLossSeconds) / 3600;
  }
  if (id === 'meaningfulProfitTime') {
    const manual = getStudyDurationSecondsForMetric(trade, 'meaningfulProfit');
    return Number.isFinite(manual) ? manual / 3600 : parseStudyNumber(generated.meaningfulProfitSeconds) / 3600;
  }
  if (id === 'maxMeaningfulDrawdown') return Math.abs(parseStudyNumber(generated.maxMeaningfulDrawdownPct ?? metrics.maxMeaningfulDrawdownPct));
  if (id === 'maxFavorableExcursion') return parseStudyNumber(generated.maxFavorableExcursionPct ?? metrics.maxFavorableExcursionPct);
  if (id === 'profitCaptureRatio') return parseStudyNumber(generated.profitCaptureRatio);
  if (id === 'pricePathShape') {
    const key = String(generated.pricePathShape || '');
    return key ? (studyMetricText.value.shapes[key as keyof typeof studyMetricText.value.shapes] || key) : 'N/A';
  }
  if (id === 'firstImpulseDirection') return String(generated.firstImpulseDirection || 'N/A');
  if (id === 'entryHeat') return parseStudyNumber(generated.entryHeatSeconds) / 3600;
  if (id === 'adverseBeforeProfit') {
    if (generated.adverseBeforeProfit === true) return locale.value === 'ru' ? 'Да' : 'Yes';
    if (generated.adverseBeforeProfit === false) return locale.value === 'ru' ? 'Нет' : 'No';
    return 'N/A';
  }
  if (id === 'hadNews') return metrics?.hadNews ? (locale.value === 'ru' ? 'Да' : 'Yes') : (locale.value === 'ru' ? 'Нет' : 'No');
  return null;
};

const correlationMetricConfigs = computed<CorrelationMetricConfig[]>(() => {
  const base: CorrelationMetricConfig[] = [
    { id: 'required_adherence', label: getAdvancedMetricLabel('required_adherence'), group: 'Matrix Adherence', kind: 'numeric', format: 'percent', extract: getRequiredAdherenceForMetric },
    { id: 'additional_alpha', label: getAdvancedMetricLabel('additional_alpha'), group: 'Matrix Adherence', kind: 'numeric', format: 'count', extract: getAdditionalConditionCountForMetric },
    { id: 'protocol_strictness', label: getAdvancedMetricLabel('protocol_strictness'), group: 'Matrix Adherence', kind: 'numeric', format: 'score', extract: (trade) => Math.min(10, (getEntryRequiredConditionSnapshot(trade).length * 2.5) + (getAdditionalConditionCountForMetric(trade) * 1.5) || 8.5) },
    { id: 'conditional_pnl_ratio', label: getAdvancedMetricLabel('conditional_pnl_ratio'), group: 'Matrix Adherence', kind: 'numeric', format: 'currency', extract: (trade) => {
      const conditions = getRuleCountForMetric(trade);
      return conditions > 0 ? getTradePnlValue(trade) / conditions : getTradePnlValue(trade);
    } },
    { id: 'setup_complexity', label: getAdvancedMetricLabel('setup_complexity'), group: 'Matrix Adherence', kind: 'numeric', format: 'ratio', extract: getSetupComplexityForMetric },
    { id: 'cognitive_stability', label: getAdvancedMetricLabel('cognitive_stability'), group: 'Behavioural', kind: 'numeric', format: 'percent', extract: getCognitiveStabilityForMetric },
    { id: 'dominant_bias', label: getAdvancedMetricLabel('dominant_bias'), group: 'Behavioural', kind: 'category', format: 'text', extract: getDominantBiasForMetric },
    { id: 'emotional_pnl_drag', label: getAdvancedMetricLabel('emotional_pnl_drag'), group: 'Behavioural', kind: 'numeric', format: 'currency', extract: (trade) => getNegativeEmotionsForMetric(trade).length ? getTradePnlValue(trade) - ((strategyStats.value.avgPnl || 0) * 1.15) : 0 },
    { id: 'friction_density', label: getAdvancedMetricLabel('friction_density'), group: 'Behavioural', kind: 'numeric', format: 'percent', extract: getFrictionDensityForMetric },
    { id: 'net_result_variance', label: getAdvancedMetricLabel('net_result_variance'), group: 'Execution & Risk', kind: 'numeric', format: 'currency', extract: (trade) => getTradePnlValue(trade) - (strategyStats.value.avgPnl || 0) },
    { id: 'yield_efficiency', label: getAdvancedMetricLabel('yield_efficiency'), group: 'Execution & Risk', kind: 'numeric', format: 'percent', extract: getYieldPctForMetric },
    { id: 'profit_velocity', label: getAdvancedMetricLabel('profit_velocity'), group: 'Execution & Risk', kind: 'numeric', format: 'currency', extract: getProfitVelocityForMetric },
    { id: 'actual_vs_target_rr', label: getAdvancedMetricLabel('actual_vs_target_rr'), group: 'Execution & Risk', kind: 'numeric', format: 'ratio', extract: getTradeRrForMetric },
    { id: 'planned_vs_realized_risk', label: getAdvancedMetricLabel('planned_vs_realized_risk'), group: 'Execution & Risk', kind: 'numeric', format: 'currency', extract: (trade) => Math.max(Number.isFinite(getPlannedStopRiskDollarsForMetric(trade)) ? getPlannedStopRiskDollarsForMetric(trade) : 0, getRealizedRiskDollarsForMetric(trade)) },
    { id: 'temporal_exposure', label: getAdvancedMetricLabel('temporal_exposure'), group: 'Execution & Risk', kind: 'numeric', format: 'duration', extract: getTradeDurationHoursForMetric },
    { id: 'asset_protocol', label: getAdvancedMetricLabel('asset_protocol'), group: 'Execution & Risk', kind: 'category', format: 'text', extract: (trade) => `${trade?.side || 'N/A'} ${trade?.asset || 'N/A'}` },
    { id: 'stop_loss_distance', label: getAdvancedMetricLabel('stop_loss_distance'), group: 'Execution & Risk', kind: 'numeric', format: 'percent', extract: getSlDistPct },
    { id: 'take_profit_distance', label: getAdvancedMetricLabel('take_profit_distance'), group: 'Execution & Risk', kind: 'numeric', format: 'percent', extract: getTpDistPct },
    { id: 'sl_execution_drag', label: getAdvancedMetricLabel('sl_execution_drag'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'currency', extract: getSlExecutionDragForMetric },
    { id: 'risk_budget_adherence', label: getAdvancedMetricLabel('risk_budget_adherence'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'percent', extract: getRiskBudgetRatioForMetric },
    { id: 'tp_capture_ratio', label: getAdvancedMetricLabel('tp_capture_ratio'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'percent', extract: getTpCaptureForMetric },
    { id: 'edge_capture_quotient', label: getAdvancedMetricLabel('edge_capture_quotient'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'ratio', extract: getEdgeQuotientForMetric },
    { id: 'unrealized_alpha_left', label: getAdvancedMetricLabel('unrealized_alpha_left'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'currency', extract: getUnrealizedAlphaLeftForMetric },
    { id: 'horizon_sync_rating', label: getAdvancedMetricLabel('horizon_sync_rating'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'percent', extract: getHorizonSyncForMetric },
    { id: 'velocity_variance_index', label: getAdvancedMetricLabel('velocity_variance_index'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'ratio', extract: getVelocityVarianceForMetric },
    { id: 'conditional_alpha_decay', label: getAdvancedMetricLabel('conditional_alpha_decay'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'count', extract: getAlphaDecayForMetric },
    { id: 'execution_confidence_index', label: getAdvancedMetricLabel('execution_confidence_index'), group: 'Strategy vs. Execution', kind: 'numeric', format: 'score', extract: getExecutionConfidenceForMetric }
  ];

  const inTradeConfigs = inTradeAnalysisRows.value.map((metric: any): CorrelationMetricConfig => ({
    id: `in_trade:${metric.id}`,
    label: metric.label,
    group: studyMetricText.value.sectionTitle,
    kind: ['pricePathShape', 'firstImpulseDirection', 'adverseBeforeProfit', 'hadNews'].includes(metric.id) ? 'category' : 'numeric',
    format: ['meaningfulLossTime', 'meaningfulProfitTime', 'entryHeat'].includes(metric.id)
      ? 'duration'
      : (['maxMeaningfulDrawdown', 'maxFavorableExcursion', 'profitCaptureRatio'].includes(metric.id) ? 'percent' : 'text'),
    extract: (trade: any) => getInTradeMetricValueForCorrelation(trade, metric.id)
  }));

  return [...base, ...inTradeConfigs];
});

const correlationMetricById = computed(() => new Map(correlationMetricConfigs.value.map((metric) => [metric.id, metric])));
const correlationMetricByLabel = computed(() => new Map(correlationMetricConfigs.value.map((metric) => [normalizeMetricLookupKey(metric.label), metric])));
const activeCorrelationMetric = computed(() => activeCorrelationMetricId.value ? correlationMetricById.value.get(activeCorrelationMetricId.value) || null : null);

const formatCorrelationMetricValue = (value: number | string | null, format: CorrelationMetricFormat) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  if (typeof value === 'string') return value;
  if (!Number.isFinite(value)) return 'N/A';
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percent') return `${value.toFixed(2)}%`;
  if (format === 'duration') {
    if (value < 24) return `${value.toFixed(value < 2 ? 1 : 0)}h`;
    return `${(value / 24).toFixed(value < 72 ? 1 : 0)}d`;
  }
  if (format === 'ratio') return `${value.toFixed(2)}x`;
  if (format === 'score') return value.toFixed(1);
  if (format === 'count') return String(Math.round(value));
  return String(value);
};

const formatCorrelationRange = (min: number, max: number, format: CorrelationMetricFormat) => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return 'N/A';
  if (Math.abs(max - min) < 0.000001) return formatCorrelationMetricValue(min, format);
  return `${formatCorrelationMetricValue(min, format)} - ${formatCorrelationMetricValue(max, format)}`;
};

const getCorrelationSourceRows = (metric: CorrelationMetricConfig) => {
  return allTrades.value
    .filter(isClosedAnalysisTrade)
    .map((trade: any) => {
      const rawX = metric.extract(trade);
      const y = getTradePnlValue(trade);
      return {
        trade,
        rawX,
        y,
        asset: String(trade?.asset || 'UNKNOWN'),
        date: new Date(trade?.dateExit || trade?.date || '').toLocaleDateString(),
        timestamp: new Date(trade?.dateExit || trade?.date || 0).getTime()
      };
    })
    .filter((row: any) => {
      if (!Number.isFinite(row.y)) return false;
      if (metric.kind === 'numeric') return Number.isFinite(Number(row.rawX));
      return row.rawX !== null && row.rawX !== undefined && String(row.rawX) !== '' && String(row.rawX) !== 'N/A';
    });
};

const getChartY = (value: number, min: number, max: number) => {
  const span = Math.max(max - min, 0.000001);
  return 92 - (((value - min) / span) * 84);
};

const buildMetricCurvePath = (points: Array<{ x: number; y: number }>) => {
  if (points.length < 2) return '';
  return points.reduce((path, point, index) => {
    return index === 0 ? `M ${point.x} ${point.y}` : `${path} L ${point.x} ${point.y}`;
  }, '');
};

const selectedMetricEquityCurve = computed(() => {
  const metric = activeCorrelationMetric.value;
  if (!metric) return null;

  const rows = getCorrelationSourceRows(metric)
    .filter((row: any) => Number.isFinite(row.timestamp))
    .sort((a: any, b: any) => a.timestamp - b.timestamp);

  if (rows.length < 2) return null;

  const categoryIndexes = new Map<string, number>();
  const strategyId = String(props.trade?.strategyId || 'MAIN_DIARY');
  let equity = tradeStore.getInitialDeposit(strategyId) || 1000;

  const rawPoints = rows.map((row: any, index: number) => {
    let metricValue = Number(row.rawX);
    let metricLabel = formatCorrelationMetricValue(row.rawX, metric.format);

    if (metric.kind === 'category') {
      const label = String(row.rawX);
      if (!categoryIndexes.has(label)) categoryIndexes.set(label, categoryIndexes.size + 1);
      metricValue = categoryIndexes.get(label) || 0;
      metricLabel = label;
    }

    equity += row.y;

    return {
      id: String(row.trade?.id || `${row.asset}-${row.timestamp}-${index}`),
      metricValue,
      metricLabel,
      equity,
      equityLabel: formatCurrency(equity),
      asset: row.asset,
      date: row.date
    };
  }).filter((point: any) => Number.isFinite(point.metricValue) && Number.isFinite(point.equity));

  if (rawPoints.length < 2) return null;

  const metricValues = rawPoints.map((point) => point.metricValue);
  const equityValues = rawPoints.map((point) => point.equity);
  const metricMin = Math.min(...metricValues);
  const metricMax = Math.max(...metricValues);
  const equityMin = Math.min(...equityValues);
  const equityMax = Math.max(...equityValues);
  const xSpan = Math.max(rawPoints.length - 1, 1);

  const points: MetricEquityCurvePoint[] = rawPoints.map((point, index) => ({
    ...point,
    x: (index / xSpan) * 100,
    metricY: getChartY(point.metricValue, metricMin, metricMax),
    equityY: getChartY(point.equity, equityMin, equityMax)
  }));

  let directMatches = 0;
  let inverseMatches = 0;
  let compared = 0;

  for (let index = 1; index < rawPoints.length; index += 1) {
    const metricDelta = rawPoints[index].metricValue - rawPoints[index - 1].metricValue;
    const equityDelta = rawPoints[index].equity - rawPoints[index - 1].equity;
    if (Math.abs(metricDelta) < 0.000001 || Math.abs(equityDelta) < 0.000001) continue;
    compared += 1;
    if (Math.sign(metricDelta) === Math.sign(equityDelta)) directMatches += 1;
    else inverseMatches += 1;
  }

  const directScore = compared > 0 ? (directMatches / compared) * 100 : 0;
  const inverseScore = compared > 0 ? (inverseMatches / compared) * 100 : 0;
  const relationshipMode = metric.kind === 'category'
    ? 'GROUP'
    : (directScore >= inverseScore ? 'DIRECT' : 'INVERSE');
  const relationshipScore = metric.kind === 'category'
    ? Number.NaN
    : Math.round(Math.max(directScore, inverseScore));

  return {
    metric,
    points,
    equityPath: buildMetricCurvePath(points.map((point) => ({ x: point.x, y: point.equityY }))),
    metricPath: buildMetricCurvePath(points.map((point) => ({ x: point.x, y: point.metricY }))),
    relationshipMode,
    relationshipScore,
    compared
  };
});

const calculatePearson = (pairs: Array<{ x: number; y: number }>) => {
  if (pairs.length < 3) return Number.NaN;
  const avgX = pairs.reduce((sum, item) => sum + item.x, 0) / pairs.length;
  const avgY = pairs.reduce((sum, item) => sum + item.y, 0) / pairs.length;
  const numerator = pairs.reduce((sum, item) => sum + ((item.x - avgX) * (item.y - avgY)), 0);
  const denomX = Math.sqrt(pairs.reduce((sum, item) => sum + Math.pow(item.x - avgX, 2), 0));
  const denomY = Math.sqrt(pairs.reduce((sum, item) => sum + Math.pow(item.y - avgY, 2), 0));
  return denomX > 0 && denomY > 0 ? numerator / (denomX * denomY) : Number.NaN;
};

const buildCorrelationBuckets = (rows: Array<{ x: number; y: number }>, format: CorrelationMetricFormat): CorrelationBucket[] => {
  if (!rows.length) return [];
  const sorted = [...rows].sort((a, b) => a.x - b.x);
  const bucketCount = Math.min(4, sorted.length);
  return Array.from({ length: bucketCount }, (_, index) => {
    const start = Math.floor((index / bucketCount) * sorted.length);
    const end = Math.floor(((index + 1) / bucketCount) * sorted.length);
    const slice = sorted.slice(start, Math.max(start + 1, end));
    const avgPnl = slice.reduce((sum, item) => sum + item.y, 0) / slice.length;
    const wins = slice.filter((item) => item.y > 0).length;
    const min = Math.min(...slice.map((item) => item.x));
    const max = Math.max(...slice.map((item) => item.x));
    return {
      label: formatCorrelationRange(min, max, format),
      count: slice.length,
      avgPnl,
      winRate: (wins / slice.length) * 100,
      min,
      max
    };
  });
};

const buildCorrelationCategoryBuckets = (rows: Array<{ rawX: any; y: number; trade: any; asset: string }>): CorrelationCategoryBucket[] => {
  const grouped = new Map<string, Array<{ rawX: any; y: number; trade: any; asset: string }>>();
  rows.forEach((row) => {
    const key = String(row.rawX);
    grouped.set(key, [...(grouped.get(key) || []), row]);
  });
  const buckets = Array.from(grouped.entries())
    .map(([label, items]) => {
      const avgPnl = items.reduce((sum, item) => sum + item.y, 0) / items.length;
      const wins = items.filter((item) => item.y > 0).length;
      return {
        label,
        count: items.length,
        avgPnl,
        winRate: (wins / items.length) * 100,
        xPct: 0,
        trades: items.slice(0, 4).map((item) => ({ id: String(item.trade?.id || item.asset), asset: item.asset, pnl: item.y }))
      };
    })
    .sort((a, b) => b.avgPnl - a.avgPnl)
    .slice(0, 8);
  return buckets.map((bucket, index) => ({
    ...bucket,
    xPct: buckets.length <= 1 ? 50 : 8 + ((index / (buckets.length - 1)) * 84)
  }));
};

const selectedCorrelationAnalysis = computed(() => {
  const metric = activeCorrelationMetric.value;
  if (!metric) return null;
  const sourceRows = getCorrelationSourceRows(metric);

  if (metric.kind === 'category') {
    const buckets = buildCorrelationCategoryBuckets(sourceRows as any);
    const best = buckets[0] || null;
    const worst = buckets[buckets.length - 1] || null;
    return {
      mode: 'category',
      metric,
      sampleSize: sourceRows.length,
      buckets,
      best,
      worst,
      points: [],
      trend: null,
      correlation: Number.NaN,
      xMin: 0,
      xMax: 0,
      yMin: Math.min(0, ...sourceRows.map((row: any) => row.y)),
      yMax: Math.max(0, ...sourceRows.map((row: any) => row.y))
    };
  }

  const numericRows = sourceRows.map((row: any) => ({ ...row, x: Number(row.rawX) }));
  const xs = numericRows.map((row) => row.x);
  const ys = numericRows.map((row) => row.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMinRaw = Math.min(0, ...ys);
  const yMaxRaw = Math.max(0, ...ys);
  const yPadding = Math.max((yMaxRaw - yMinRaw) * 0.08, 1);
  const yMin = yMinRaw - yPadding;
  const yMax = yMaxRaw + yPadding;
  const xSpan = Math.max(xMax - xMin, 0.000001);
  const ySpan = Math.max(yMax - yMin, 0.000001);
  const correlation = calculatePearson(numericRows);
  const avgX = numericRows.reduce((sum, row) => sum + row.x, 0) / Math.max(1, numericRows.length);
  const avgY = numericRows.reduce((sum, row) => sum + row.y, 0) / Math.max(1, numericRows.length);
  const varianceX = numericRows.reduce((sum, row) => sum + Math.pow(row.x - avgX, 2), 0);
  const covariance = numericRows.reduce((sum, row) => sum + ((row.x - avgX) * (row.y - avgY)), 0);
  const slope = varianceX > 0 ? covariance / varianceX : 0;
  const intercept = avgY - (slope * avgX);
  const trendStartY = (slope * xMin) + intercept;
  const trendEndY = (slope * xMax) + intercept;

  const points: CorrelationPoint[] = numericRows.map((row) => ({
    id: String(row.trade?.id || `${row.asset}-${row.date}`),
    asset: row.asset,
    date: row.date,
    x: row.x,
    y: row.y,
    xLabel: formatCorrelationMetricValue(row.x, metric.format),
    yLabel: formatCurrency(row.y),
    xPct: ((row.x - xMin) / xSpan) * 100,
    yPct: 100 - (((row.y - yMin) / ySpan) * 100)
  }));
  const buckets = buildCorrelationBuckets(numericRows, metric.format);
  const best = [...buckets].sort((a, b) => b.avgPnl - a.avgPnl)[0] || null;
  const worst = [...buckets].sort((a, b) => a.avgPnl - b.avgPnl)[0] || null;

  return {
    mode: 'numeric',
    metric,
    sampleSize: numericRows.length,
    buckets,
    best,
    worst,
    points,
    trend: {
      x1: 0,
      y1: 100 - (((trendStartY - yMin) / ySpan) * 100),
      x2: 100,
      y2: 100 - (((trendEndY - yMin) / ySpan) * 100)
    },
    correlation,
    xMin,
    xMax,
    yMin,
    yMax
  };
});

const correlationStrengthLabel = computed(() => {
  const analysis = selectedCorrelationAnalysis.value;
  if (!analysis || analysis.mode !== 'numeric' || !Number.isFinite(analysis.correlation)) return 'N/A';
  const abs = Math.abs(analysis.correlation);
  if (abs >= 0.55) return locale.value === 'ru' ? 'сильная' : 'strong';
  if (abs >= 0.25) return locale.value === 'ru' ? 'умеренная' : 'moderate';
  return locale.value === 'ru' ? 'слабая' : 'weak';
});

const correlationVerdict = computed(() => {
  const analysis = selectedCorrelationAnalysis.value;
  if (!analysis) return '';
  const metric = analysis.metric.label.replace(/_/g, ' ');
  if (analysis.mode === 'category') {
    if (!analysis.best) return locale.value === 'ru' ? 'Недостаточно данных для группировки.' : 'Not enough data for grouping.';
    return locale.value === 'ru'
      ? `Лучший результат у группы ${analysis.best.label}: средняя прибыль ${formatCurrency(analysis.best.avgPnl)}.`
      : `${analysis.best.label} has the strongest result: average PnL ${formatCurrency(analysis.best.avgPnl)}.`;
  }
  if (!Number.isFinite(analysis.correlation) || analysis.sampleSize < 3) {
    return locale.value === 'ru'
      ? `Для ${metric} пока недостаточно точек, чтобы оценить связь с прибылью.`
      : `Not enough points to judge how ${metric} relates to profit yet.`;
  }
  const bestRange = analysis.best?.label || 'N/A';
  if (analysis.correlation > 0.25) {
    return locale.value === 'ru'
      ? `Прибыль обычно растет, когда ${metric} увеличивается. Лучший диапазон сейчас: ${bestRange}.`
      : `Profit usually rises as ${metric} increases. The strongest range is ${bestRange}.`;
  }
  if (analysis.correlation < -0.25) {
    return locale.value === 'ru'
      ? `Прибыль обычно падает, когда ${metric} увеличивается. Лучший диапазон сейчас: ${bestRange}.`
      : `Profit usually falls as ${metric} increases. The strongest range is ${bestRange}.`;
  }
  return locale.value === 'ru'
    ? `У ${metric} нет явной линейной связи с прибылью. Лучший диапазон по факту: ${bestRange}.`
    : `${metric} has no clear linear relationship with profit. The best observed range is ${bestRange}.`;
});

const openCorrelationMetric = (metricId: string) => {
  if (!correlationMetricById.value.has(metricId)) return;
  activeCorrelationMetricId.value = metricId;
};

const closeCorrelationMetric = () => {
  activeCorrelationMetricId.value = null;
};

watch([currentPage, activeReportMetricMode], ([page, mode]) => {
  if (page !== 3 || mode !== 'advanced') {
    activeCorrelationMetricId.value = null;
  }
});

const handleAdvancedMetricGridClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;
  const explicit = target.closest('[data-correlation-metric-id]') as HTMLElement | null;
  const explicitId = explicit?.dataset?.correlationMetricId;
  if (explicitId) {
    openCorrelationMetric(explicitId);
    return;
  }

  const trigger = target.closest('.group.cursor-pointer') as HTMLElement | null;
  const label = trigger?.querySelector('span')?.textContent;
  const metric = correlationMetricByLabel.value.get(normalizeMetricLookupKey(label));
  if (metric) openCorrelationMetric(metric.id);
};

const tradeScoreBreakdown = computed(() => {
  const tr = props.trade as any;
  if (!tr) {
    return { percentile: 0, pnlScore: 0, rawScore: 0, comparedTrades: 0, lowerTrades: 0, patternMode: 'profit', patterns: [] };
  }

  const score = getUnifiedTradeScore(tr);
  const propPercentile = Number((tr as any)?.percentileRank);
  const percentile = score
    ? score.score
    : (Number.isFinite(propPercentile) ? propPercentile : 0);
  const scoredTrades = tradeScoreSourceTrades.value
    .map((trade: any) => getUnifiedTradeScore(trade))
    .filter(Boolean) as NonNullable<ReturnType<typeof getUnifiedTradeScore>>[];
  const lowerTrades = score
    ? scoredTrades.filter((item) => item.rawScore < score.rawScore).length
    : 0;
  const useProfitablePatterns = percentile > 51;

  return {
    percentile,
    pnlScore: score?.outcomeScore ?? 0,
    rawScore: score?.rawScore ?? 0,
    comparedTrades: scoredTrades.length,
    lowerTrades,
    patternMode: useProfitablePatterns ? 'profit' : 'loss',
    patterns: buildMajorityScorePatterns(useProfitablePatterns)
  };
});

const formatRatio = (value: number) => {
  const safe = Number.isFinite(value) && value > 0 ? value : 0;
  return `1:${safe.toFixed(2)}`;
};

const conditionIdentity = (condition: any) => {
  if (typeof condition === 'string') return condition.toLowerCase();
  return String(condition?.id ?? condition?.info?.id ?? condition?.name ?? condition?.label ?? condition?.info?.name ?? '').toLowerCase();
};

const conditionProtocolId = (condition: any) => {
  if (typeof condition === 'string') return condition;
  return String(condition?.id ?? condition?.info?.id ?? condition?.name ?? condition?.label ?? condition?.info?.name ?? '');
};

const conditionDisplayName = (condition: any) => {
  if (typeof condition === 'string') return condition;
  return String(condition?.info?.customName ?? condition?.info?.name ?? condition?.name ?? condition?.label ?? condition?.id ?? 'REQUIRED');
};

const conditionDescription = (condition: any) => {
  if (typeof condition === 'string') return '';
  return String(condition?.info?.description ?? condition?.description ?? condition?.info?.logic ?? '');
};

const getEntryRequiredConditionSnapshot = (trade: any) => {
  const directSnapshot = trade?.boardRequiredConditionsEntry;
  if (Array.isArray(directSnapshot) && directSnapshot.length > 0) return directSnapshot;

  const scenarioSnapshot = trade?.boardScenarioEntry?.info?.requiredConditions;
  if (Array.isArray(scenarioSnapshot) && scenarioSnapshot.length > 0) return scenarioSnapshot;

  const legacyConditions = trade?.boardScenarioEntry?.info?.conditions || [];
  return legacyConditions.filter((c: any) => c?.info?.priority === 'REQUIRED' || c?.priority === 'REQUIRED');
};

const getEntryExecutedConditions = (trade: any) => {
  const scenarioExecuted = trade?.boardScenarioEntry?.info?.conditions;
  return Array.isArray(trade?.boardConditions) && trade.boardConditions.length > 0
    ? trade.boardConditions
    : (Array.isArray(scenarioExecuted) ? scenarioExecuted : []);
};

const isRequiredConditionsExpanded = ref(false);

const requiredConditionRows = computed(() => {
  const tr = props.trade as any;
  const required = getEntryRequiredConditionSnapshot(tr);
  const executedKeys = new Set(getEntryExecutedConditions(tr).map(conditionIdentity).filter(Boolean));

  return required
    .map((condition: any, index: number) => {
      const id = conditionProtocolId(condition);
      const identity = conditionIdentity(condition);
      if (!id && !identity) return null;

      const name = conditionDisplayName(condition);
      const selected = executedKeys.has(identity);

      return {
        id: id || identity || `required-${index}`,
        name,
        description: conditionDescription(condition),
        selected,
        statusLabel: selected
          ? (locale.value === 'ru' ? 'выбрано' : 'selected')
          : (locale.value === 'ru' ? 'пропущено' : 'missing')
      };
    })
    .filter(Boolean);
});

const requiredConditionStats = computed(() => {
  const tr = props.trade as any;
  const required = getEntryRequiredConditionSnapshot(tr);
  const executed = getEntryExecutedConditions(tr);

  if (required.length === 0) {
    return { used: 0, total: 0 };
  }

  const executedKeys = new Set(executed.map(conditionIdentity).filter(Boolean));
  const used = required.filter((req: any) => executedKeys.has(conditionIdentity(req))).length;
  return { used, total: required.length };
});

// Tab A: Matrix Adherence Metrics
const matrixAdherenceMetrics = computed(() => {
  const tr = props.trade as any;
  if (!tr) return { reqRatio: 0, reqText: '0/0', addCount: 0, addAlpha: 0, strictness: 0, condPnl: 0, complexity: 1.0 };

  const conditions = tr.boardScenarioEntry?.info?.conditions || [];
  const reqConditions = getEntryRequiredConditionSnapshot(tr);
  const addConditions = conditions.filter((c: any) => c?.info?.priority === 'ADDITIONAL');
  const scenarioId = tr.boardScenarioEntry?.id;
  const getRuleCount = (trade: any) => {
    const scenarioRules = trade?.boardScenarioEntry?.info?.conditions;
    if (Array.isArray(scenarioRules)) return scenarioRules.length;
    if (Array.isArray(trade?.boardConditions)) return trade.boardConditions.length;
    return 0;
  };

  const requiredStats = requiredConditionStats.value;
  const reqRatio = requiredStats.total > 0 ? (requiredStats.used / requiredStats.total) * 100 : (conditions.length > 0 ? 0 : 100);
  const reqText = requiredStats.total > 0 ? `${requiredStats.used}/${requiredStats.total} Fulfilled` : '0/0';

  const avgPnl = strategyStats.value.avgPnl || 0;
  const pnl = getNormalizedPnl(tr);
  const pnlDiff = pnl - avgPnl;
  const addAlpha = addConditions.length > 0 ? (pnlDiff / (Math.abs(avgPnl) || 100)) * 100 : 0;

  const strictness = Math.min(10, (reqConditions.length * 2.5) + (addConditions.length * 1.5) || 8.5);
  const condPnl = conditions.length > 0 ? pnl / conditions.length : pnl;
  const historicalRuleCounts = allTrades.value
    .filter((trade: any) => !scenarioId || trade?.boardScenarioEntry?.id === scenarioId)
    .map(getRuleCount)
    .filter((count: number) => count > 0);
  const sortedRuleCounts = [...historicalRuleCounts].sort((a, b) => a - b);
  const medianRules = sortedRuleCounts.length > 0
    ? (sortedRuleCounts.length % 2 === 1
      ? sortedRuleCounts[(sortedRuleCounts.length - 1) / 2]
      : (sortedRuleCounts[(sortedRuleCounts.length / 2) - 1] + sortedRuleCounts[sortedRuleCounts.length / 2]) / 2)
    : 0;
  const currentRuleCount = getRuleCount(tr);
  const complexity = medianRules > 0 ? (currentRuleCount / medianRules) : 1.0;

  return {
    reqRatio,
    reqText,
    addCount: addConditions.length,
    addAlpha,
    strictness,
    condPnl,
    complexity
  };
});

// Tab B: Behavioural Metrics
const behaviouralMetrics = computed(() => {
  const tr = props.trade as any;
  if (!tr) return { stability: 100, bias: 'None', pnlDrag: 0, frictionCount: 0, frictionDensity: 0, hesitation: 'Nominal (<0.2s)' };

  const emotions = tr.emotions || [];
  const negativeSet = new Set([
    'FOMO', 'fomo', 'Revenge', 'revenge', 'Greed', 'greed', 'Fear', 'fear', 
    'Tilt', 'tilt', 'Anxiety', 'anxiety', 'Boredom', 'boredom', 'Fatigue', 'fatigue', 
    'Anger', 'anger', 'Impatience', 'impatience', 'Frustration', 'frustration'
  ]);
  
  const negativeEmotions = emotions.map(getEmotionName).filter((e: string) => negativeSet.has(e));
  const frictionCount = negativeEmotions.length;
  const frictionDensity = emotions.length > 0 ? (frictionCount / emotions.length) * 100 : 0;
  
  const stability = Math.max(10, 100 - (frictionCount * 15));

  const hasEmo = (name: string) => negativeEmotions.some((e: string) => e.toLowerCase() === name.toLowerCase());

  let bias = 'None (Clear Execution)';
  if (hasEmo('fomo')) bias = 'FOMO (Premature Entry Risk)';
  else if (hasEmo('revenge')) bias = 'Revenge (Over-Leverage Risk)';
  else if (hasEmo('greed')) bias = 'Greed (Target Overshoot Risk)';
  else if (hasEmo('fear')) bias = 'Fear (Premature Exit Risk)';
  else if (hasEmo('tilt')) bias = 'Tilt (Protocol Violation)';
  else if (hasEmo('fatigue')) bias = 'Fatigue (Cognitive Lethargy)';
  else if (hasEmo('boredom')) bias = 'Boredom (Low-Quality Setup)';
  else if (hasEmo('frustration')) bias = 'Frustration (Emotional Friction)';
  else if (negativeEmotions.length > 0) bias = `${negativeEmotions[0].toUpperCase()} (Cognitive Friction)`;

  const avgPnl = strategyStats.value.avgPnl || 0;
  const estCleanPnl = avgPnl * 1.15;
  const pnlDrag = frictionCount > 0 ? getNormalizedPnl(tr) - estCleanPnl : 0;

  return {
    stability,
    bias,
    pnlDrag,
    frictionCount,
    frictionDensity
  };
});

// Tab D: Strategy vs. Execution Metrics
const strategyExecutionMetrics = computed(() => {
  const tr = props.trade as any;
  if (!tr) return {
    slDrag: 0, slDragText: 'No SL Data',
    riskBudgetRatio: 100, riskBudgetText: 'Within Budget', actualRisk: 0, maxRisk: 250,
    tpCapture: 100, tpCaptureText: 'Target Achieved',
    edgeQuotient: 1.0, edgeQuotientText: 'Nominal Edge',
    unrealizedLeft: 0, unrealizedLeftText: 'Full Target Captured',
    horizonSync: 100, horizonSyncText: 'Optimal Sync',
    velocityDelta: 1.0, velocityDeltaText: 'Nominal Velocity',
    alphaDecay: 0, alphaDecayText: 'Zero Degradation',
    executionGrade: 100, executionGradeText: 'Flawless Execution'
  };

  const entry = parsePositiveTradePrice(tr.entry);
  const exit = parsePositiveTradePrice(tr.exit);
  const sl = parsePositiveTradePrice(tr.stopLoss);
  const tp = parsePositiveTradePrice(tr.takeProfit);
  const pnl = getNormalizedPnl(tr);
  const direction = getTradeDirection(tr);
  const isLong = direction !== 'SHORT';

  let slDrag = 0;
  let slDragText = 'No SL Breached';
  if (Number.isFinite(entry) && Number.isFinite(sl) && Number.isFinite(exit)) {
    if (pnl < 0) {
      const diff = isLong ? (exit - sl) : (sl - exit);
      slDrag = diff * (parseFloat(tr.size) || 1);
      slDragText = slDrag < 0 ? 'Slippage Drag (Worse than planned)' : 'Early Cut (Avoided full SL)';
    }
  }

  const actualRisk = tradeRiskAudit.value.worst;
  const isRu = locale.value === 'ru';
  const resolvedBudgetDollars = riskBudgetDollars.value;
  const maxRisk = resolvedBudgetDollars ?? 250;
  const riskBudgetRatio = maxRisk > 0 ? (actualRisk / maxRisk) * 100 : 0;
  const riskBudgetBudgetStr = resolvedBudgetDollars !== null
    ? (maxRiskTrade.value!.unit === '%'
      ? (isRu
        ? `${maxRiskTrade.value!.value}% от баланса до сделки = $${maxRisk.toFixed(2)}`
        : `${maxRiskTrade.value!.value}% of pre-trade balance = $${maxRisk.toFixed(2)}`)
      : `$${maxRisk.toFixed(2)}`)
    : 'No budget set';
  const riskBudgetText = resolvedBudgetDollars === null
    ? (isRu ? 'Бюджет матрицы не задан' : 'No matrix budget set')
    : `${tradeRiskAudit.value.status} · ${isRu ? 'стоп' : 'stop'} ${formatRiskCurrency(tradeRiskAudit.value.planned)} · ${isRu ? 'факт' : 'realized'} ${formatRiskCurrency(tradeRiskAudit.value.realized)} · ${isRu ? 'бюджет' : 'budget'} ${riskBudgetBudgetStr}`;

  let tpCapture = Number.NaN;
  let tpCaptureText = 'Full Target Achieved';
  if (Number.isFinite(entry) && Number.isFinite(tp) && Number.isFinite(exit)) {
    const plannedDist = getDirectionalTargetDistance(entry, tp, direction);
    const actualDist = isLong
      ? Math.max(0, exit - entry)
      : Math.max(0, entry - exit);
    if (Number.isFinite(plannedDist) && plannedDist > 0) {
      tpCapture = Math.min(100, (actualDist / plannedDist) * 100);
      tpCaptureText = tpCapture < 100 ? 'Premature Exit' : 'Full Target Achieved';
    }
  } else {
    tpCaptureText = 'No TP Data';
  }

  const realizedRR = actualRR.value || 1;
  const expectedRR = targetRR.value || strategyStats.value.avgRR || 1;
  const edgeQuotient = expectedRR > 0 ? (realizedRR / expectedRR) : 1.0;
  const edgeQuotientText = edgeQuotient >= 1 ? 'Alpha Generation' : 'Edge Dilution';

  let unrealizedLeft = 0;
  let unrealizedLeftText = 'Full Target Captured';
  if (Number.isFinite(entry) && Number.isFinite(tp) && Number.isFinite(exit)) {
    const targetDistance = getDirectionalTargetDistance(entry, tp, direction);
    const exitDistance = Math.abs(exit - entry);
    const plannedPnL = Number.isFinite(targetDistance) ? targetDistance * (parseFloat(tr.size) || (exitDistance > 0 ? Math.abs(pnl) / exitDistance : 0)) : Number.NaN;
    if (plannedPnL > pnl) {
      unrealizedLeft = plannedPnL - pnl;
      unrealizedLeftText = 'Target Unreached';
    }
  } else {
    unrealizedLeft = Number.NaN;
    unrealizedLeftText = 'No TP Data';
  }

  const days = duration.value / 24;
  const scenarioMinDays = scenarioDurationStats.value.minDays;
  const scenarioMaxDays = scenarioDurationStats.value.maxDays;
  let horizonSync = 50;
  let horizonSyncText = isRu ? 'Позиция в коридоре' : 'Position in Range';
  if (scenarioDurationStats.value.count > 0) {
    const span = Math.max(scenarioMaxDays - scenarioMinDays, 0.0001);
    const normalizedPosition = ((days - scenarioMinDays) / span) * 100;
    horizonSync = Math.min(100, Math.max(0, normalizedPosition));

    if (days < scenarioMinDays) {
      horizonSyncText = isRu
        ? `Ниже диапазона сценария (${scenarioMinDays.toFixed(2)}д - ${scenarioMaxDays.toFixed(2)}д)`
        : `Below scenario range (${scenarioMinDays.toFixed(2)}d - ${scenarioMaxDays.toFixed(2)}d)`;
    } else if (days > scenarioMaxDays) {
      horizonSyncText = isRu
        ? `Выше диапазона сценария (${scenarioMinDays.toFixed(2)}д - ${scenarioMaxDays.toFixed(2)}д)`
        : `Above scenario range (${scenarioMinDays.toFixed(2)}d - ${scenarioMaxDays.toFixed(2)}d)`;
    } else {
      horizonSyncText = isRu ? 'Позиция в коридоре' : 'Position in Range';
    }
  }

  const currentVelocity = tradeDetailStats.value.velocity || 0;
  const avgVelocity = strategyStats.value.avgVelocity || 1;
  const velocityDelta = avgVelocity > 0 ? (currentVelocity / avgVelocity) : 1.0;
  const velocityDeltaText = velocityDelta >= 1 ? 'High Momentum' : 'Grinding Tie-up';

  const emotions = tr.emotions || [];
  const negativeSet = new Set([
    'FOMO', 'fomo', 'Revenge', 'revenge', 'Greed', 'greed', 'Fear', 'fear', 
    'Tilt', 'tilt', 'Anxiety', 'anxiety', 'Boredom', 'boredom', 'Fatigue', 'fatigue', 
    'Anger', 'anger', 'Impatience', 'impatience', 'Frustration', 'frustration'
  ]);
  const hasNegative = emotions.map(getEmotionName).some((e: string) => negativeSet.has(e));
  const conditions = tr.boardScenarioEntry?.info?.conditions || [];
  const reqConditions = getEntryRequiredConditionSnapshot(tr);
  const executedConditions = Array.isArray(tr.boardConditions) && tr.boardConditions.length > 0
    ? tr.boardConditions
    : conditions;
  const missingRequiredRules = reqConditions.filter((req: any) =>
    !executedConditions.some((exec: any) => conditionIdentity(exec) === conditionIdentity(req))
  ).length;
  const alphaDecay = hasNegative ? missingRequiredRules : 0;
  const alphaDecayText = alphaDecay > 0 ? `Bypassed ${alphaDecay} Required Rules` : 'Zero Degradation';

  const adherenceScore = matrixAdherenceMetrics.value.reqRatio;
  const tpScore = Number.isFinite(tpCapture) ? tpCapture : 100;
  const riskScore = actualRisk <= maxRisk ? 100 : Math.max(0, 100 - ((actualRisk - maxRisk) / maxRisk) * 100);
  const stabilityScore = behaviouralMetrics.value.stability;
  const executionGrade = Math.round((adherenceScore * 0.3) + (tpScore * 0.3) + (riskScore * 0.2) + (stabilityScore * 0.2));
  let executionGradeText = 'Flawless Execution';
  if (executionGrade < 60) executionGradeText = 'Compromised Execution';
  else if (executionGrade < 80) executionGradeText = 'Sub-Optimal Execution';

  return {
    slDrag, slDragText,
    riskBudgetRatio, riskBudgetText, actualRisk, maxRisk,
    tpCapture, tpCaptureText,
    edgeQuotient, edgeQuotientText,
    unrealizedLeft, unrealizedLeftText,
    horizonSync, horizonSyncText,
    velocityDelta, velocityDeltaText,
    alphaDecay, alphaDecayText,
    executionGrade, executionGradeText
  };
});

const simpleMetricInsights = computed(() => {
  const tr = props.trade as any;
  const isRu = locale.value === 'ru';
  if (!tr) return [];

  const currentPnl = getNormalizedPnl(tr);
  const sameStrategyTrades = closedAllTrades.value.filter((trade: any) => trade?.id !== tr.id);
  const baselineTrades = sameStrategyTrades.length > 0 ? sameStrategyTrades : closedAllTrades.value;
  const normalizedPnls = baselineTrades
    .map((trade: any) => getNormalizedPnl(trade))
    .filter((value: number) => Number.isFinite(value));
  const winningPnls = normalizedPnls.filter((value: number) => value > 0);
  const losingPnls = normalizedPnls.filter((value: number) => value < 0);
  const avgWin = winningPnls.length ? winningPnls.reduce((sum: number, value: number) => sum + value, 0) / winningPnls.length : 0;
  const avgLoss = losingPnls.length ? losingPnls.reduce((sum: number, value: number) => sum + value, 0) / losingPnls.length : 0;

  const requiredStats = requiredConditionStats.value;

  const riskAudit = tradeRiskAudit.value;
  let riskValue = formatCurrency(riskAudit.planned);
  let riskSuffix = isRu ? 'риск по stop loss от entry' : 'stop-loss risk from entry';
  let riskBenchmarkLabel = isRu ? 'факт' : 'realized';
  let riskBenchmarkValue = formatCurrency(riskAudit.realized);
  let riskHint = riskAudit.hint;
  if (maxRiskTrade.value?.unit === '%') {
    const maxPct = maxRiskTrade.value.value;
    riskValue = formatRiskPercent(plannedStopRiskPct.value);
    riskSuffix = isRu ? 'по stop loss от капитала' : 'stop risk of capital';
    riskBenchmarkLabel = isRu ? 'факт' : 'realized';
    riskBenchmarkValue = `${realizedRiskPct.value.toFixed(2)}% / ${maxPct.toFixed(2)}%`;
  } else if (maxRiskTrade.value) {
    riskValue = formatCurrency(riskAudit.planned);
    riskSuffix = isRu ? 'по stop loss на сделку' : 'stop risk on this trade';
    riskBenchmarkValue = `${formatCurrency(riskAudit.realized)} / ${formatCurrency(maxRiskTrade.value.value)}`;
  }

  const rrHint = targetRR.value > 0 && actualRR.value > 0 && actualRR.value < targetRR.value
    ? (isRu
      ? 'Увеличьте R/R через более точное смещение stop loss и take profit.'
      : 'Improve R/R by adjusting stop loss and take profit placement.')
    : '';
  const scoreBreakdown = tradeScoreBreakdown.value;

  return [
    {
      id: 'score',
      label: isRu ? 'Общий score сделки' : 'Trade Score',
      prefix: isRu ? 'Лучше чем' : 'Better than',
      value: `${scoreBreakdown.percentile}%`,
      suffix: isRu ? 'сделок' : 'of trades',
      benchmarkLabel: isRu ? 'raw score' : 'raw score',
      benchmarkValue: formatCurrency(scoreBreakdown.rawScore),
      hint: '',
      tone: scoreBreakdown.percentile >= 70 ? 'positive' : (scoreBreakdown.percentile >= 40 ? 'warning' : 'negative')
    },
    {
      id: 'pnl',
      label: isRu ? 'Результат сделки' : 'Trade Result',
      prefix: currentPnl >= 0 ? (isRu ? 'Прибыль' : 'Profit') : (isRu ? 'Убыток' : 'Loss'),
      value: formatCurrency(currentPnl),
      suffix: isRu ? 'по текущей сделке' : 'on the current trade',
      benchmarkLabel: currentPnl >= 0 ? (isRu ? 'средняя прибыльная' : 'avg win') : (isRu ? 'средняя убыточная' : 'avg loss'),
      benchmarkValue: currentPnl >= 0 ? formatCurrency(avgWin) : formatCurrency(avgLoss),
      hint: '',
      tone: currentPnl >= 0 ? 'positive' : 'negative'
    },
    {
      id: 'required',
      label: isRu ? 'Обязательные условия' : 'Required Conditions',
      prefix: requiredStats.total > 0 ? (isRu ? 'Использовано' : 'Used') : (isRu ? 'Список' : 'List'),
      value: requiredStats.total > 0 ? `${requiredStats.used}/${requiredStats.total}` : 'N/A',
      suffix: requiredStats.total > 0 ? (isRu ? 'required условий' : 'required conditions') : (isRu ? 'required условий не найден' : 'required conditions not found'),
      benchmarkLabel: isRu ? 'статус' : 'status',
      benchmarkValue: requiredStats.total > 0 && requiredStats.used < requiredStats.total
        ? (isRu ? 'пропуск' : 'missing')
        : (isRu ? 'полно' : 'complete'),
      hint: requiredStats.total > 0 && requiredStats.used < requiredStats.total
        ? (isRu ? 'Проверьте, какие required условия были пропущены перед следующим входом.' : 'Review which required conditions were skipped before the next entry.')
        : '',
      tone: requiredStats.total > 0 && requiredStats.used < requiredStats.total ? 'warning' : 'positive'
    },
    {
      id: 'risk',
      label: isRu ? 'Риск сделки' : 'Trade Risk',
      prefix: isRu ? 'Риск' : 'Risk',
      value: riskValue,
      suffix: riskSuffix,
      benchmarkLabel: riskBenchmarkLabel,
      benchmarkValue: riskBenchmarkValue,
      hint: riskHint,
      benchmarkTone: riskAudit.realizedOk ? 'positive' : 'negative',
      tone: riskAudit.ok ? 'positive' : 'negative'
    },
    {
      id: 'rr',
      label: 'Risk/Reward',
      prefix: 'Risk/Reward',
      value: formatRatio(actualRR.value),
      suffix: isRu ? 'фактическое соотношение' : 'realized ratio',
      benchmarkLabel: isRu ? 'цель' : 'target',
      benchmarkValue: targetRR.value > 0 ? formatRatio(targetRR.value) : 'N/A',
      hint: rrHint,
      tone: targetRR.value > 0 && actualRR.value < targetRR.value ? 'warning' : 'positive'
    }
  ];
});

</script>

<template>
  <div
    ref="analysisPanelRoot"
    :class="[
      props.embeddedBrief ? 'embedded-brief' : '',
      props.embeddedBrief ? 'relative min-h-full w-full' : 'relative h-full w-full'
    ]"
  >
    <!-- CLOSE HANDLE (RIGHT EDGE) -->
    <button v-if="!props.embedded" @click="emit('close')"
            class="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-40 bg-theme-bg dark:bg-[#070707] border-t border-r border-b border-black/20 dark:border-white/20 flex items-center justify-center group/close-tab cursor-pointer hover:bg-theme-surface dark:hover:bg-[#111] transition-colors z-[100]">
       <div class="w-[1px] h-16 bg-black/10 dark:bg-white/10 group-hover/close-tab:bg-black/40 dark:group-hover/close-tab:bg-white/40 transition-all duration-300"></div>
       <span class="absolute text-[7px] font-mono tracking-[0.4em] uppercase text-black/10 dark:text-white/10 group-hover/close-tab:text-black/40 dark:group-hover/close-tab:text-white/40 rotate-90 whitespace-nowrap">Close Analysis</span>
    </button>

    <component
      :is="analysisPanelContainer"
      :class="props.embeddedBrief ? 'w-full' : 'h-full w-full'"
      v-bind="analysisPanelContainerProps"
    >
    <div v-if="isInitializing" class="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-[#ffffff]/90 dark:bg-[#070707]/80 backdrop-blur-md z-50 nier-text-primary">
      <div class="w-12 h-12 border-t-2 border-r-2 border-black dark:border-white rounded-full animate-spin"></div>
      <div class="flex flex-col items-center space-y-1">
        <span class="text-xs font-mono font-black uppercase tracking-[0.4em] opacity-80">Loading Matrix Data</span>
        <span class="text-[9px] font-mono opacity-40 tracking-widest uppercase">Initializing neural telemetry protocols...</span>
      </div>
    </div>
    <div v-else-if="enrichedTrade" :class="props.embeddedBrief ? 'relative flex w-full overflow-hidden nier-text-primary' : 'relative flex h-full overflow-hidden nier-text-primary'">
      
      <!-- MINIMALIST NAVIGATION SIDEBAR (INTERNAL) -->
      <div v-if="!activeCorrelationMetric && !props.embedded" class="w-12 h-full flex flex-col items-center py-6 border-r border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] z-20 shrink-0">
        <div class="flex flex-col space-y-6">
          <button v-for="(tab, idx) in [
            { id: 3, label: 'REPORT', icon: 'M9 17H15M9 13H15M9 9H10M13 3H14.6C15.7201 3 16.2802 3 16.708 3.21799C17.0843 3.40973 17.3903 3.71569 17.582 4.09202C17.8 4.51984 17.8 5.07989 17.8 6.2V17.8C17.8 18.9201 17.8 19.4802 17.582 19.908C17.3903 20.2843 17.0843 20.5903 16.708 20.782C16.2802 21 15.7201 21 14.6 21H9.4C8.2798 21 7.71984 21 7.29202 20.782C6.91569 20.5903 6.60973 20.2843 6.41799 19.908C6.2 19.4802 6.2 18.9201 6.2 17.8V6.2C6.2 5.07989 6.2 4.51984 6.41799 4.09202C6.60973 3.71569 6.91569 3.40973 7.29202 3.21799C7.71984 3 8.27989 3 9.4 3H10.2M12 3V5' },
            { id: 4, label: 'VISUALS', icon: 'M15 8H15.01M7 16H17M7 11L10.29 7.71C10.68 7.32 11.31 7.32 11.7 7.71L14.59 10.6M14.59 10.6L16.29 8.9C16.68 8.51 17.31 8.51 17.7 8.9L21 12.2M4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20Z' },
            { id: 5, label: 'NOTES', icon: 'M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z' }
          ]" :key="tab.id"
          @click="currentPage = tab.id"
          class="relative w-8 h-8 flex items-center justify-center transition-all duration-300 group/nav-item"
          :class="[currentPage === tab.id ? 'opacity-100 scale-110' : 'opacity-20 hover:opacity-50 hover:scale-105']">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" 
                 class="w-5 h-5 transition-all duration-500"
                 :class="currentPage === tab.id ? 'nier-text-primary' : 'nier-text-primary'">
              <path :d="tab.icon" />
            </svg>
            <!-- Active Indicator Dot -->
            <div v-if="currentPage === tab.id" class="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-1 nier-bg-inverted rounded-full"></div>
            
            <!-- Tooltip (Minimal) -->
            <div class="absolute left-full ml-4 px-2 py-1 nier-bg-inverted nier-text-primary text-[7px] font-mono tracking-widest uppercase opacity-0 group-hover/nav-item:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
               {{ formatDisplayLabel(tab.label) }}
            </div>
          </button>
        </div>
      </div>

      <div :class="props.embeddedBrief ? 'relative flex-grow overflow-visible' : 'relative flex-grow overflow-hidden h-full'">
      <!-- ADAPTIVE BACKGROUND DECORATIONS -->
      <div v-if="!props.embeddedBrief" class="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 opacity-20 dark:opacity-40">
        <!-- Tesseract / 3D Wireframe -->
        <div class="absolute -top-20 -right-20 w-96 h-96 border nier-border-primary rounded-full">
           <div class="absolute inset-10 border border-black/5 dark:border-white/5 rotate-45"></div>
           <div class="absolute inset-20 border border-black/5 dark:border-white/5 -rotate-12"></div>
        </div>

        <!-- Floating Squares / Tesseracts -->
        <div class="absolute top-1/4 left-10 w-12 h-12 border border-black/20 dark:border-white/20 rotate-12"></div>
        <div class="absolute bottom-1/4 right-10 w-24 h-24 border nier-border-primary -rotate-45"></div>

        <!-- Geometric Pulse Circles -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-black/[0.03] dark:border-white/[0.03] rounded-full"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-black/[0.02] dark:border-white/[0.02] rounded-full"></div>
        
        <!-- Tactical Grid Accents -->
        <div class="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,transparent_0%,currentColor_1px,transparent_1px)] bg-[length:40px_40px]"></div>

      </div>

      <!-- MAIN CONTENT WRAPPER (Relative to ensure it stays above decor) -->
      <div class="relative z-10 h-full">
      <!-- 0. STRATEGY LOCKOUT (WARNING) -->
      <div v-if="(enrichedTrade.tradingStyle === 'Main Diary' || enrichedTrade.strategyId === 'MAIN_DIARY') && currentPage === 3" class="h-full flex flex-col items-center justify-center p-8 text-center space-y-6 bg-black/[0.01] dark:bg-white/[0.01]">
          <div class="relative w-32 h-32 flex items-center justify-center shrink-0">
             <div class="absolute inset-0 border nier-border-primary rotate-45 animate-[pulse_4s_ease-in-out_infinite]"></div>
             <div class="absolute inset-4 border border-black/20 dark:border-white/20 -rotate-45"></div>
             <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-6xl font-serif italic text-black/10 dark:text-white/10">!</span>
             </div>
             <!-- Scanning effect -->
             <div class="absolute top-0 left-0 w-full h-[1px] bg-black/10 dark:bg-white/10 animate-[scan_3s_linear_infinite]"></div>
          </div>
          
          <div class="flex flex-col items-center space-y-3 max-w-sm">
             <div class="flex flex-col items-center space-y-1">
                <span class="text-[10px] font-mono uppercase tracking-[0.6em] font-black text-red-500/40">Diagnostic Lockout</span>
                <ExHeading level="h3" variant="module" class="!text-2xl nier-text-primary text-center animate-glow-red">PROTOCOL UNDEFINED</ExHeading>
             </div>
             <ExText variant="small" class="opacity-40 uppercase tracking-[0.2em] leading-relaxed text-center">
                High-fidelity analysis requires a specific strategy protocol. Tactical mapping is currently disabled for generic [Main Diary] entries.
             </ExText>
          </div>
          
          <div class="pt-6 flex flex-col items-center space-y-4">
             <div class="w-16 h-px bg-black/10 dark:bg-white/10"></div>
             <span class="text-[8px] font-mono uppercase tracking-[0.4em] opacity-20">Initialization Pending...</span>
          </div>
      </div>

      <Transition v-else name="page-slide" mode="out-in">
        <!-- MAIN ANALYSIS (HIDDEN DURING REPORT) -->
      <div :key="'analysis'" class="flex flex-col h-full overflow-hidden">
          <!-- 2. DYNAMIC CONTENT GRID (SWAPPABLE) -->
          <div :class="props.embeddedBrief ? 'p-0 flex-grow relative overflow-visible' : 'p-3 md:p-4 flex-grow relative overflow-y-auto custom-scrollbar overflow-x-hidden'">
            <Transition name="page-slide" mode="out-in">
              <!-- REPORT VIEW (MODE 3) -->
              <div
                v-if="currentPage === 3"
                :key="'report'"
                :class="props.embeddedBrief
                  ? 'relative min-h-full flex flex-col'
                  : (activeCorrelationMetric ? 'relative h-full min-h-0 overflow-hidden' : 'relative min-h-full flex flex-col p-4 space-y-6')"
              >
                <div
                  v-if="activeCorrelationMetric && selectedCorrelationAnalysis"
                  class="absolute inset-0 z-30 flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f5ef]/95 p-4 text-black backdrop-blur-xl dark:bg-[#080806]/95 dark:text-white md:p-5"
                >
                  <div class="mb-4 flex shrink-0 items-center gap-4">
                    <button
                      type="button"
                      class="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-black/15 transition-all duration-300 hover:bg-black hover:text-white dark:border-white/15 dark:hover:bg-white dark:hover:text-black"
                      @click="closeCorrelationMetric"
                    >
                      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 18l-6-6 6-6"></path>
                      </svg>
                    </button>

                    <div class="min-w-0">
                      <h2 class="truncate font-serif text-2xl italic leading-tight tracking-normal md:text-3xl">
                        {{ formatDisplayLabel(selectedCorrelationAnalysis.metric.label) }}
                      </h2>
                    </div>

                    <div
                      v-if="selectedMetricEquityCurve"
                      class="ml-auto shrink-0 font-mono text-[10px] font-black uppercase tracking-[0.22em] opacity-65"
                    >
                        {{ formatDisplayLabel(selectedMetricEquityCurve.relationshipMode) }}
                      <span v-if="Number.isFinite(selectedMetricEquityCurve.relationshipScore)">
                        {{ selectedMetricEquityCurve.relationshipScore }}%
                      </span>
                    </div>
                  </div>

                  <div class="relative min-h-0 flex-1 overflow-hidden border border-black/10 bg-white/35 p-3 dark:border-white/10 dark:bg-black/20 md:p-4">
                      <svg v-if="selectedMetricEquityCurve" class="block h-full w-full overflow-hidden" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <line v-for="tick in [20, 40, 60, 80]" :key="`x-${tick}`" :x1="tick" :x2="tick" y1="0" y2="100" stroke="currentColor" stroke-width="0.08" opacity="0.1"></line>
                        <line v-for="tick in [20, 40, 60, 80]" :key="`y-${tick}`" x1="0" x2="100" :y1="tick" :y2="tick" stroke="currentColor" stroke-width="0.08" opacity="0.1"></line>
                        <line x1="0" x2="100" y1="100" y2="100" stroke="currentColor" stroke-width="0.16" opacity="0.24"></line>
                        <line x1="0" x2="0" y1="0" y2="100" stroke="currentColor" stroke-width="0.16" opacity="0.24"></line>
                        <path
                          :d="selectedMetricEquityCurve.equityPath"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.35"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          opacity="0.92"
                          vector-effect="non-scaling-stroke"
                        ></path>
                        <path
                          :d="selectedMetricEquityCurve.metricPath"
                          fill="none"
                          class="stroke-emerald-500 dark:stroke-emerald-400"
                          stroke-width="1.15"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-dasharray="4 3"
                          opacity="0.88"
                          vector-effect="non-scaling-stroke"
                        ></path>
                        <g v-for="point in selectedMetricEquityCurve.points" :key="point.id">
                          <circle
                            :cx="point.x"
                            :cy="point.equityY"
                            r="1.15"
                            class="fill-white stroke-black dark:fill-black dark:stroke-white"
                            stroke-width="0.7"
                            opacity="0.7"
                            vector-effect="non-scaling-stroke"
                          >
                            <title>{{ point.asset }} // capital {{ point.equityLabel }} // {{ point.date }}</title>
                          </circle>
                          <circle
                            :cx="point.x"
                            :cy="point.metricY"
                            r="0.95"
                            class="fill-emerald-500 dark:fill-emerald-400"
                            opacity="0.74"
                            vector-effect="non-scaling-stroke"
                          >
                            <title>{{ point.asset }} // metric {{ point.metricLabel }} // {{ point.date }}</title>
                          </circle>
                        </g>
                      </svg>
                      <div v-else class="flex h-full items-center justify-center font-mono text-[10px] font-black uppercase tracking-[0.24em] opacity-35">
                        Not enough data
                      </div>
                  </div>
                </div>
                <!-- Temporal Verification -->
                <div v-if="!activeCorrelationMetric && !props.embeddedBrief" class="flex flex-col space-y-6 w-full p-4 md:p-6">
                   <div class="flex flex-col space-y-3">
                      <div class="flex justify-between items-center text-[9px] font-mono opacity-30 uppercase tracking-[0.2em] nier-text-primary">
                         <span>Execution Duration</span>
                         <span>Risk Element Type</span>
                      </div>
                      <div class="flex justify-between items-baseline">
                         <span class="text-3xl font-serif italic nier-text-primary leading-none">
                            <span v-for="(part, idx) in durationParts" :key="idx" class="inline-flex items-baseline mr-1.5">
                               <span>{{ part.num }}</span><span class="text-sm font-mono not-italic opacity-40 ml-0.5">{{ part.unit }}</span>
                            </span>
                         </span>
                          <div class="flex items-center gap-2">
                             <div class="w-1 h-1 nier-bg-inverted rotate-45"></div>
                             <span class="text-[10px] font-mono font-black uppercase tracking-widest nier-text-primary">
                               {{ formatDisplayLabel(resolvedTradingStyle) }}
                               <span class="opacity-40 ml-1">{{ formatDisplayLabel(durationContextLabel) }}</span>
                             </span>
                          </div>
                       </div>
                    </div>
                    <div class="space-y-2">
                       <div class="flex justify-between items-center text-[8px] font-mono uppercase tracking-widest opacity-30 nier-text-primary">
                          <span>Start Point</span>
                          <span>{{ formatDisplayLabel(durationAxisLabel) }}</span>
                       </div>
                       <div class="h-1 w-full bg-black/5 dark:bg-white/5 relative group">
                          <div class="h-full transition-all duration-1000 ease-[var(--nier-ease)]"
                               :class="isStyleCompliant ? 'nier-bg-inverted' : 'bg-rose-500'"
                               :style="{ width: `${Math.min((duration / 24 / durationProgressMaxDays) * 100, 100)}%` }">
                          </div>
                          <div v-if="!isStyleCompliant" class="absolute inset-y-0 right-0 w-px bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                       </div>
                    </div>
                    <div v-if="!isStyleCompliant" class="p-4 bg-rose-500/5 border border-rose-500/20 relative overflow-hidden">
                       <div class="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                       <p class="text-[8px] font-mono uppercase tracking-[0.2em] text-rose-500 leading-relaxed">
                          {{ styleAlertMessage }}
                       </p>
                    </div>
                   <div v-else class="flex items-center space-x-2 opacity-30 nier-text-primary">
                      <div class="w-8 h-px border-black/40 dark:border-white/40"></div>
                      <span class="text-[8px] font-mono uppercase tracking-widest italic">Duration remains within nominal strategy parameters.</span>
                   </div>
                </div>

                <!-- TOP SECTION: EQUITY TRAJECTORY (Expanded) -->
                <div v-if="!props.embeddedBrief" class="flex-grow relative min-h-[300px]">
                   <ExEquityCurve2D :trades="reportTrades" :initialBalance="initialBalance" />
                </div>

                <!-- BOTTOM SECTION: PERFORMANCE BENCHMARK (Detailed Grid) -->
                <div v-if="!props.embeddedBrief" class="flex flex-col gap-3 border-b nier-border-primary pb-3 mb-4 md:flex-row md:items-center md:justify-between">
                  <div class="flex flex-col">
                    <span class="text-[8px] font-mono uppercase tracking-[0.4em] opacity-30 nier-text-primary">
                      {{ props.embeddedBrief ? (locale === 'ru' ? 'Диагностический бриф' : 'Diagnostic Brief') : 'Performance Benchmark' }}
                    </span>
                    <span class="text-[10px] font-mono uppercase tracking-[0.22em] opacity-60 nier-text-primary">
                      {{ props.embeddedBrief ? 'Readable diagnostic brief' : (activeReportMetricMode === 'simple' ? 'Readable diagnostic brief' : 'Advanced telemetry grid') }}
                    </span>
                  </div>
                  <div v-if="!props.embeddedBrief" class="flex items-center border nier-border-primary bg-black/[0.02] dark:bg-white/[0.02] p-1 shrink-0">
                    <button
                      v-for="mode in reportMetricModes"
                      :key="mode.id"
                      @click="activeReportMetricMode = mode.id"
                      class="relative min-w-[96px] px-4 py-2 text-[9px] font-mono font-black uppercase tracking-[0.22em] transition-all duration-300"
                      :class="activeReportMetricMode === mode.id
                        ? 'nier-bg-inverted nier-text-primary shadow-sm'
                        : 'text-black/45 dark:text-white/45 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'">
                      {{ formatDisplayLabel(mode.label) }}
                    </button>
                  </div>
                </div>

                <div v-if="props.embeddedBrief || activeReportMetricMode === 'simple'" class="pb-6">
                  <div
                    v-for="(item, index) in simpleMetricInsights"
                    :key="item.id"
                    class="group relative grid grid-cols-[34px_minmax(0,1fr)] gap-4 border-b nier-border-primary px-4 py-4 transition-all duration-300 first:border-t hover:bg-black/[0.025] dark:hover:bg-white/[0.025] md:grid-cols-[42px_minmax(0,1fr)_minmax(148px,auto)] md:px-5"
                  >
                    <div class="absolute left-0 top-1/2 h-6 w-px -translate-y-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                         :class="item.tone === 'positive' ? 'bg-emerald-500' : (item.tone === 'negative' ? 'bg-rose-500' : 'bg-amber-500')"></div>

                    <div class="flex items-center justify-center">
                      <div class="relative flex h-7 w-7 items-center justify-center text-[9px] font-mono font-black opacity-45 transition-all duration-300 group-hover:opacity-100">
                        <div v-if="!props.embeddedBrief" class="absolute inset-0 rotate-45 border nier-border-primary transition-transform duration-300 group-hover:scale-110"></div>
                        <span class="relative">{{ index + 1 }}</span>
                      </div>
                    </div>

                    <div class="min-w-0">
                      <div class="mb-2 flex items-center gap-3">
                        <span class="text-[8px] font-mono font-black uppercase tracking-[0.32em] opacity-35 transition-opacity group-hover:opacity-60">
                          {{ formatDisplayLabel(item.label) }}
                        </span>
                        <span class="h-px min-w-8 flex-1 bg-current opacity-10"></span>
                      </div>
                      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span class="text-[11px] font-mono uppercase tracking-[0.2em] opacity-45">{{ item.prefix }}</span>
                        <span class="text-2xl font-mono font-black tracking-normal md:text-3xl"
                              :class="item.tone === 'positive' ? 'text-emerald-500 dark:text-emerald-400' : (item.tone === 'negative' ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400')">
                          {{ item.value }}
                        </span>
                        <span class="text-[12px] font-mono uppercase tracking-[0.12em] opacity-70">{{ item.suffix }}</span>
                      </div>
                      <p v-if="item.hint" class="mt-2 max-w-3xl text-[10px] font-mono uppercase leading-relaxed tracking-[0.16em] opacity-50">
                        {{ item.hint }}
                      </p>
                      <div v-if="item.id === 'score'" class="mt-4">
                        <button
                          type="button"
                          class="group/score-expand inline-flex items-center gap-3 border nier-border-primary px-3 py-2 text-[8px] font-mono font-black uppercase tracking-[0.24em] opacity-70 transition-all duration-300 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
                          @click.stop="isTradeScoreExpanded = !isTradeScoreExpanded"
                        >
                          <span class="relative h-3 w-3">
                            <span class="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-current"></span>
                            <span
                              class="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-300"
                              :class="isTradeScoreExpanded ? 'scale-y-0' : 'scale-y-100'"
                            ></span>
                          </span>
                          <span>
                            {{ isTradeScoreExpanded ? (locale === 'ru' ? 'Скрыть состав' : 'Hide score') : (locale === 'ru' ? 'Показать состав' : 'Show score') }}
                          </span>
                        </button>

                        <div v-if="isTradeScoreExpanded" class="mt-3 flex max-h-[360px] flex-col overflow-y-auto border-t nier-border-primary pr-1">
                          <ExTooltip
                            v-for="pattern in tradeScoreBreakdown.patterns"
                            :key="`${pattern.label}-${pattern.value}`"
                            :is-dark="isDark"
                            variant="basic"
                          >
                            <template #trigger>
                              <div class="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-3 border-b nier-border-primary px-2 py-3 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.035]">
                                <span class="truncate text-[9px] font-mono uppercase tracking-[0.2em] opacity-45">{{ formatDisplayLabel(pattern.label) }}</span>
                                <span class="max-w-[220px] truncate text-right text-[10px] font-mono font-black nier-text-primary">
                                  {{ pattern.value }}
                                </span>
                              </div>
                            </template>
                            <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col gap-2">
                              <div>{{ getScorePatternTooltip(pattern.metricId).description }}</div>
                              <div v-if="getScorePatternTooltip(pattern.metricId).benchmark" class="border-t nier-border-primary pt-2">
                                <span class="mb-1 block text-[9px] font-black uppercase tracking-widest opacity-40">{{ locale === 'ru' ? 'Benchmark' : 'Benchmark' }}</span>
                                <span class="text-[9px] opacity-70">{{ getScorePatternTooltip(pattern.metricId).benchmark }}</span>
                              </div>
                            </div>
                          </ExTooltip>
                          <div v-if="tradeScoreBreakdown.patterns.length === 0" class="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b nier-border-primary px-2 py-3">
                            <span class="text-[9px] font-mono uppercase tracking-[0.2em] opacity-45">
                              {{ tradeScoreBreakdown.patternMode === 'profit'
                                ? (locale === 'ru' ? 'Паттерны прибыльных' : 'Profitable patterns')
                                : (locale === 'ru' ? 'Паттерны убыточных' : 'Losing patterns') }}
                            </span>
                            <span class="text-[10px] font-mono font-black opacity-35">{{ locale === 'ru' ? 'нет majority' : 'no majority' }}</span>
                          </div>
                        </div>
                      </div>
                      <div v-if="item.id === 'required' && requiredConditionRows.length > 0" class="mt-4">
                        <button
                          type="button"
                          class="group/required-expand inline-flex items-center gap-3 border nier-border-primary px-3 py-2 text-[8px] font-mono font-black uppercase tracking-[0.24em] opacity-70 transition-all duration-300 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
                          @click.stop="isRequiredConditionsExpanded = !isRequiredConditionsExpanded"
                        >
                          <span class="relative h-3 w-3">
                            <span class="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-current"></span>
                            <span
                              class="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-current transition-transform duration-300"
                              :class="isRequiredConditionsExpanded ? 'scale-y-0' : 'scale-y-100'"
                            ></span>
                          </span>
                          <span>
                            {{ isRequiredConditionsExpanded ? (locale === 'ru' ? 'Скрыть условия' : 'Hide conditions') : (locale === 'ru' ? 'Показать условия' : 'Show conditions') }}
                          </span>
                        </button>

                        <div
                          v-if="isRequiredConditionsExpanded"
                          class="mt-3 flex flex-col border-t nier-border-primary"
                        >
                          <div
                            v-for="condition in requiredConditionRows"
                            :key="condition.id"
                            class="group/required-row relative grid grid-cols-[18px_minmax(0,1fr)_auto] items-start gap-3 border-b nier-border-primary px-2 py-3 transition-all duration-300"
                            :class="condition.selected
                              ? 'bg-black/[0.06] text-black dark:bg-white/[0.08] dark:text-white'
                              : 'text-black/35 dark:text-white/35'"
                          >
                            <span
                              class="mt-1 h-2.5 w-2.5 rotate-45 border transition-all duration-300"
                              :class="condition.selected
                                ? 'border-black bg-black shadow-[0_0_14px_rgba(0,0,0,0.25)] dark:border-white dark:bg-white dark:shadow-[0_0_16px_rgba(255,255,255,0.35)]'
                                : 'border-current bg-transparent opacity-45'"
                            ></span>
                            <span class="min-w-0">
                              <span class="block truncate text-[10px] font-mono font-black uppercase tracking-[0.22em]">
                                {{ formatDisplayLabel(condition.name) }}
                              </span>
                              <span
                                v-if="condition.description"
                                class="mt-1 block truncate text-[8px] font-mono uppercase tracking-[0.16em] opacity-45"
                              >
                                {{ condition.description }}
                              </span>
                            </span>
                            <span
                              class="shrink-0 text-[8px] font-mono font-black uppercase tracking-[0.2em]"
                              :class="condition.selected ? 'opacity-90' : 'opacity-40'"
                            >
                              {{ condition.statusLabel }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="col-start-2 flex items-center md:col-start-auto md:justify-end">
                      <div class="inline-flex items-center gap-2 border nier-border-primary px-3 py-2 text-[9px] font-mono uppercase tracking-[0.18em] opacity-70 transition-all duration-300 group-hover:opacity-100">
                        <span class="opacity-45">{{ item.benchmarkLabel }}</span>
                        <span class="font-black"
                              :class="(item.benchmarkTone || item.tone) === 'positive' ? 'text-emerald-500 dark:text-emerald-400' : ((item.benchmarkTone || item.tone) === 'negative' ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400')">
                          {{ item.benchmarkValue }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else>
                <!-- METRICS FILTER TABS -->
                <div class="flex flex-wrap items-center gap-2 border-b nier-border-primary pb-3 mb-4">
                  <button v-for="tab in advancedMetricTabs" :key="tab.id"
                  @click="activeMetricTab = tab.id"
                  class="relative flex items-center space-x-2 px-4 py-2 border transition-all duration-300 cursor-pointer"
                  :class="activeMetricTab === tab.id ? 'border-black dark:border-white bg-black/5 dark:bg-white/5 nier-text-primary font-bold shadow-sm' : 'nier-border-primary text-black/50 dark:text-white/50 hover:border-black/30 dark:hover:border-white/30'">
                    <div v-if="activeMetricTab === tab.id" class="w-1.5 h-1.5 nier-bg-inverted rotate-45 animate-pulse"></div>
                    <span class="text-[10px] font-mono tracking-wider uppercase">{{ formatDisplayLabel(tab.label) }}</span>
                    <span class="text-[8px] font-mono px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded-full opacity-60">{{ tab.count }}</span>
                  </button>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4" @click="handleAdvancedMetricGridClick">
                     <!-- TAB A: MATRIX ADHERENCE METRICS -->
                     <ExTooltip :is-dark="isDark" v-if="['all', 'adherence'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('required_adherence') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <span class="text-xl font-mono font-black" :class="matrixAdherenceMetrics.reqRatio === 100 ? 'text-emerald-400' : 'text-amber-400'">
                                    {{ (matrixAdherenceMetrics.reqRatio || 0).toFixed(2) }}%
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    {{ matrixAdherenceMetrics.reqText }}
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Evaluates the percentage of required matrix conditions fulfilled during execution.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 (Fulfilled / Required) * 100
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">100%</span><span class="text-emerald-500 font-bold">Perfect</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; 100%</span><span class="text-amber-500 font-bold">Sub-Optimal</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="matrixAdherenceMetrics.reqRatio === 100 ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ matrixAdherenceMetrics.reqRatio === 100 ? 'Perfect' : 'Sub-Optimal' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'adherence'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('additional_alpha') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <span class="text-xl font-mono font-black" :class="matrixAdherenceMetrics.addAlpha >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                                    {{ matrixAdherenceMetrics.addAlpha >= 0 ? '+' : '' }}{{ matrixAdherenceMetrics.addAlpha.toFixed(2) }}%
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    {{ matrixAdherenceMetrics.addCount }} Confirmations
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Calculates the PnL alpha generated by adding extra confirmation layers compared to the strategy baseline.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 ((PnL - Average PnL) / Average PnL) * 100
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt; 0%</span><span class="text-emerald-500 font-bold">Positive Alpha</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; 0%</span><span class="text-rose-500 font-bold">Negative Drag</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="matrixAdherenceMetrics.addAlpha >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                                 {{ matrixAdherenceMetrics.addAlpha >= 0 ? 'Positive' : 'Negative' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'adherence'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('protocol_strictness') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <span class="text-xl font-mono font-black nier-text-primary">
                                    {{ matrixAdherenceMetrics.strictness.toFixed(2) }} / 10
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    Weighted Rating
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>A weighted algorithmic score combining required and additional criteria to measure execution strictness.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 (Required Rules * 2.5) + (Additional Rules * 1.5)
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt;= 8.0</span><span class="text-emerald-500 font-bold">Good</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; 8.0</span><span class="text-amber-500 font-bold">Sub-Optimal</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="matrixAdherenceMetrics.strictness >= 8.0 ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ matrixAdherenceMetrics.strictness >= 8.0 ? 'Good' : 'Sub-Optimal' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'adherence'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('conditional_pnl_ratio') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <span class="text-xl font-mono font-black" :class="matrixAdherenceMetrics.condPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                                    {{ matrixAdherenceMetrics.condPnl >= 0 ? '+' : '' }}${{ matrixAdherenceMetrics.condPnl.toFixed(2) }}
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    Per Active Condition
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
	                           <div>Measures the ratio of profit captured per active condition in the setup.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
	                                 PnL / Active Conditions
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt; $0</span><span class="text-emerald-500 font-bold">Positive Yield</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; $0</span><span class="text-rose-500 font-bold">Negative Drag</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="matrixAdherenceMetrics.condPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                                 {{ matrixAdherenceMetrics.condPnl >= 0 ? 'Positive' : 'Negative' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'adherence'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('setup_complexity') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                <span class="text-xl font-mono font-black nier-text-primary">
                                    {{ matrixAdherenceMetrics.complexity.toFixed(2) }}x
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    vs Scenario Median
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Evaluates the total number of rules triggered versus the historical median rule count of the same entry scenario.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 Active Rules / Scenario Median
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&lt;= 1.5x</span><span class="text-emerald-500 font-bold">Good</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&gt; 1.5x</span><span class="text-amber-500 font-bold">Over-Complicated</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="matrixAdherenceMetrics.complexity <= 1.5 ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ matrixAdherenceMetrics.complexity <= 1.5 ? 'Good' : 'Over-Complicated' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <!-- TAB B: BEHAVIOURAL METRICS -->
                     <ExTooltip :is-dark="isDark" v-if="['all', 'behavioural'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('cognitive_stability') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <span class="text-xl font-mono font-black" :class="behaviouralMetrics.stability >= 70 ? 'text-emerald-400' : 'text-rose-400'">
                                    {{ (behaviouralMetrics.stability || 0).toFixed(2) }}%
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    Neural Telemetry
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Evaluates active emotional markers, deducting stability points for psychological friction tags.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 100 - (Friction Tags * 15)
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt;= 70%</span><span class="text-emerald-500 font-bold">Stable</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; 70%</span><span class="text-rose-500 font-bold">Unstable</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="behaviouralMetrics.stability >= 70 ? 'text-emerald-500' : 'text-rose-500'">
                                 {{ behaviouralMetrics.stability >= 70 ? 'Stable' : 'Unstable' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'behavioural'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('dominant_bias') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1 overflow-hidden">
                                 <span class="text-sm font-mono font-black nier-text-primary truncate">
                                    {{ behaviouralMetrics.bias.split(' ')[0] }}
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60 truncate">
                                    {{ behaviouralMetrics.bias.split(' ').slice(1).join(' ') || 'Nominal' }}
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Identifies the primary psychological friction marker present and maps it to its known execution risk profile.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 Highest Priority Friction Tag
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">None</span><span class="text-emerald-500 font-bold">Clear Execution</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">Active Bias</span><span class="text-amber-500 font-bold">Cognitive Risk</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="behaviouralMetrics.bias.startsWith('None') ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ behaviouralMetrics.bias.startsWith('None') ? 'Clear' : 'Cognitive Risk' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'behavioural'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('emotional_pnl_drag') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <span class="text-xl font-mono font-black" :class="behaviouralMetrics.pnlDrag >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                                    {{ behaviouralMetrics.pnlDrag >= 0 ? '+' : '' }}${{ behaviouralMetrics.pnlDrag.toFixed(2) }}
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    vs Clean Execution
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Calculates potential profit lost or left on the table due to psychological friction markers.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 Actual PnL - (Average PnL * 1.15)
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt;= $0</span><span class="text-emerald-500 font-bold">Zero Drag</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; $0</span><span class="text-rose-500 font-bold">Profit Drag</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="behaviouralMetrics.pnlDrag >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                                 {{ behaviouralMetrics.pnlDrag >= 0 ? 'Good' : 'Negative Drag' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'behavioural'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('friction_density') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <span class="text-xl font-mono font-black" :class="behaviouralMetrics.frictionDensity === 0 ? 'text-emerald-400' : 'text-amber-400'">
                                    {{ behaviouralMetrics.frictionDensity.toFixed(2) }}%
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    {{ behaviouralMetrics.frictionCount }} Friction Markers
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Total count of active negative emotional tags divided by total active tags.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 (Friction Tags / Total Tags) * 100
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">0%</span><span class="text-emerald-500 font-bold">Pristine</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&gt; 0%</span><span class="text-amber-500 font-bold">Friction Present</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="behaviouralMetrics.frictionDensity === 0 ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ behaviouralMetrics.frictionDensity === 0 ? 'Perfect' : 'Friction Present' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>



                     <!-- TAB C: EXECUTION & RISK METRICS (Existing) -->
                     <!-- PROFIT COMPARISON -->
                     <ExTooltip :is-dark="isDark" v-if="['all', 'execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('net_result_variance') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <div class="flex items-baseline space-x-2">
                                    <span class="text-xl font-mono font-black" :class="currentTradePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                                       {{ currentTradePnl >= 0 ? '+' : '' }}{{ currentTradePnl.toFixed(2) }}$
                                    </span>
                                 </div>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    vs avg <span class="font-black nier-text-primary">${{ strategyStats.avgPnl.toFixed(2) }}</span>
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Calculates the difference between the current trade's profit/loss and the historical average for this strategy.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 Trade PnL - Strategy Avg PnL
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt;= Avg</span><span class="text-emerald-500 font-bold">Above Average</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; Avg</span><span class="text-amber-500 font-bold">Below Average</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="currentTradePnl >= strategyStats.avgPnl ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ currentTradePnl >= strategyStats.avgPnl ? 'Good' : 'Sub-Optimal' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <!-- YIELD EFFICIENCY -->
                     <ExTooltip :is-dark="isDark" v-if="['all', 'execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('yield_efficiency') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <span class="text-xl font-mono font-black nier-text-primary uppercase">{{ tradeDetailStats.yieldPct.toFixed(2) }}%</span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    Balance Before Trade
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Measures the net impact of this trade relative to the account balance immediately before entry.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 (PnL / Balance Before Trade) * 100
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt; 0%</span><span class="text-emerald-500 font-bold">Positive Impact</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; 0%</span><span class="text-rose-500 font-bold">Drawdown</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="tradeDetailStats.yieldPct >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                                 {{ tradeDetailStats.yieldPct >= 0 ? 'Positive' : 'Negative' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <!-- PROFIT VELOCITY -->
                     <ExTooltip :is-dark="isDark" v-if="['all', 'execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('profit_velocity') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <span class="text-xl font-mono font-black nier-text-primary uppercase">${{ tradeDetailStats.velocity.toFixed(2) }}/h</span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    vs baseline <span class="font-black nier-text-primary">${{ strategyStats.avgVelocity.toFixed(2) }}/h</span>
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Capital efficiency metric showing USD earned per hour of market exposure.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 PnL / (Duration Minutes / 60)
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt;= Avg Velocity</span><span class="text-emerald-500 font-bold">High Efficiency</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; Avg Velocity</span><span class="text-amber-500 font-bold">Low Efficiency</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="tradeDetailStats.velocity >= strategyStats.avgVelocity ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ tradeDetailStats.velocity >= strategyStats.avgVelocity ? 'Good' : 'Sub-Optimal' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <!-- ACTUAL VS TARGET RR -->
                     <ExTooltip :is-dark="isDark" v-if="['all', 'execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('actual_vs_target_rr') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <div class="flex items-baseline space-x-2">
                                   <span class="text-xl font-mono font-black" :class="actualRR >= targetRR ? 'text-emerald-400' : 'text-amber-400'">
                                      1:{{ actualRR.toFixed(2) }}
                                   </span>
                                 </div>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    {{ resolvedRRNode ? 'vs target' : 'vs avg' }} <span class="font-black nier-text-primary">1:{{ resolvedRRNode ? targetRR.toFixed(2) : strategyStats.avgRR.toFixed(2) }}</span>
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>{{ resolvedRRNode ? 'Compares the realized Risk/Reward ratio against the matrix target protocol.' : 'The realized ratio of risk taken to potential reward captured during this session.' }}</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 Realized Reward / Realized Risk
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt;= Target RR</span><span class="text-emerald-500 font-bold">Target Met</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; Target RR</span><span class="text-amber-500 font-bold">Sub-Optimal</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="actualRR >= targetRR ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ actualRR >= targetRR ? 'Good' : 'Sub-Optimal' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <!-- PLANNED VS REALIZED RISK -->
                     <ExTooltip :is-dark="isDark" v-if="['all', 'execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('planned_vs_realized_risk') }}</span>
                              <div class="flex flex-col justify-center space-y-1 py-1">
                                 <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                                   <span class="text-lg font-mono font-black" :class="tradeRiskAudit.plannedOk ? 'text-emerald-400' : 'text-rose-400'">
                                      S: {{ formatRiskCurrency(tradeRiskAudit.planned) }}
                                   </span>
                                   <span class="text-lg font-mono font-black" :class="tradeRiskAudit.realizedOk ? 'text-emerald-400' : 'text-rose-400'">
                                      R: {{ formatRiskCurrency(tradeRiskAudit.realized) }}
                                   </span>
                                 </div>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    {{ tradeRiskAudit.status }} · max <span class="font-black nier-text-primary">{{ riskBudgetDollars !== null ? '$' + riskBudgetDollars.toFixed(2) : 'N/A' }}</span>
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Audits both planned stop-loss risk and realized loss against the Risk Per Trade budget, catching manual exits that lose more than the planned stop.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 Stop Risk = |Entry - Stop Loss| * Size · Realized Risk = max(0, -PnL)
                              </code>
                           </div>
                           <div class="pt-2 border-t nier-border-primary grid grid-cols-2 gap-2">
                              <div class="border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-2">
                                 <span class="text-[8px] opacity-40 block uppercase tracking-widest font-black">Stop Risk</span>
                                 <span class="text-[12px] font-black" :class="tradeRiskAudit.plannedOk ? 'text-emerald-500' : 'text-rose-500'">{{ formatRiskCurrency(tradeRiskAudit.planned) }}</span>
                              </div>
                              <div class="border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-2">
                                 <span class="text-[8px] opacity-40 block uppercase tracking-widest font-black">Realized Loss</span>
                                 <span class="text-[12px] font-black" :class="tradeRiskAudit.realizedOk ? 'text-emerald-500' : 'text-rose-500'">{{ formatRiskCurrency(tradeRiskAudit.realized) }}</span>
                              </div>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">Stop & Realized &lt;= Risk Per Trade</span><span class="text-emerald-500 font-bold">Compliant</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">Either value &gt; Risk Per Trade</span><span class="text-rose-500 font-bold">Breach Warning</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="tradeRiskAudit.ok ? 'text-emerald-500' : 'text-rose-500'">
                                 {{ tradeRiskAudit.status }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <!-- DURATION COMPARISON -->
                     <ExTooltip :is-dark="isDark" v-if="['all', 'execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('temporal_exposure') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <span class="text-xl font-mono font-black nier-text-primary uppercase flex items-baseline flex-wrap">
                                    <span v-for="(part, idx) in durationParts" :key="idx" class="inline-flex items-baseline mr-1">
                                       <span>{{ part.num }}</span><span class="text-[11px] font-normal opacity-40 ml-0.5">{{ part.unit }}</span>
                                    </span>
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    vs avg <span class="font-black nier-text-primary">{{ Math.floor(strategyStats.avgDuration / 60) }}h {{ Math.floor(strategyStats.avgDuration % 60) }}m</span>
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Total duration of the trade from entry to exit protocol completion.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 Exit Timestamp - Entry Timestamp
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&lt;= Avg Duration</span><span class="text-emerald-500 font-bold">Efficient</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&gt; Avg Duration</span><span class="text-amber-500 font-bold">Extended Hold</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="tradeDurationMinutes <= strategyStats.avgDuration ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ tradeDurationMinutes <= strategyStats.avgDuration ? 'Good' : 'Sub-Optimal' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <!-- ASSET PROTOCOL -->
                     <ExTooltip :is-dark="isDark" v-if="['all', 'execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('asset_protocol') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <span class="text-xl font-mono font-black nier-text-primary truncate uppercase">{{ props.trade.side }} {{ enrichedTrade?.asset || 'N/A' }}</span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    Active Tactical Layer
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>The specific market vehicle and direction (Long/Short) utilized for this tactical operation.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 Trade Side + Trade Asset
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">Valid Asset</span><span class="text-emerald-500 font-bold">Verified</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[14px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-emerald-500">
                                 Perfect
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <!-- STOP LOSS DISTANCE -->
                     <ExTooltip :is-dark="isDark" v-if="['all', 'execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('stop_loss_distance') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <span class="text-xl font-mono font-black nier-text-primary">{{ formatRiskPercent(currentSlDistPct) }}</span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    vs avg <span class="font-black nier-text-primary">{{ strategyStats.avgSlDistPct.toFixed(2) }}%</span>
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>The percentage distance between the entry price and the planned stop loss threshold.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 (|Entry Price - Stop Loss| / Entry Price) * 100
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&lt;= Avg SL Dist</span><span class="text-emerald-500 font-bold">Tight Stop</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&gt; Avg SL Dist</span><span class="text-amber-500 font-bold">Wide Stop</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="Number.isFinite(currentSlDistPct) && currentSlDistPct <= strategyStats.avgSlDistPct ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ Number.isFinite(currentSlDistPct) ? (currentSlDistPct <= strategyStats.avgSlDistPct ? 'Good' : 'Sub-Optimal') : 'N/A' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <!-- TAKE PROFIT DISTANCE -->
                     <ExTooltip :is-dark="isDark" v-if="['all', 'execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('take_profit_distance') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1">
                                 <span class="text-xl font-mono font-black nier-text-primary">{{ formatRiskPercent(currentTpDistPct) }}</span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                    vs avg <span class="font-black nier-text-primary">{{ strategyStats.avgTpDistPct.toFixed(2) }}%</span>
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>The percentage distance between the entry price and the planned take profit target.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 (|Take Profit - Entry Price| / Entry Price) * 100
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt;= Avg TP Dist</span><span class="text-emerald-500 font-bold">High Target</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; Avg TP Dist</span><span class="text-amber-500 font-bold">Low Target</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="Number.isFinite(currentTpDistPct) && currentTpDistPct >= strategyStats.avgTpDistPct ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ Number.isFinite(currentTpDistPct) ? (currentTpDistPct >= strategyStats.avgTpDistPct ? 'Good' : 'Sub-Optimal') : 'N/A' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <!-- TAB D: STRATEGY VS. EXECUTION METRICS -->
                     <ExTooltip :is-dark="isDark" v-if="['all', 'strategy_execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('sl_execution_drag') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1 overflow-hidden">
                                 <span class="text-xl font-mono font-black" :class="strategyExecutionMetrics.slDrag >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                                    {{ strategyExecutionMetrics.slDrag >= 0 ? '+' : '' }}${{ strategyExecutionMetrics.slDrag.toFixed(2) }}
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60 truncate">
                                    {{ strategyExecutionMetrics.slDragText }}
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Compares planned stop loss against actual exit price to measure execution slippage or premature cutting.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 Actual Exit - Planned Stop Loss
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt;= $0</span><span class="text-emerald-500 font-bold">Zero Drag</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; $0</span><span class="text-rose-500 font-bold">Slippage / Premature Cut</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="strategyExecutionMetrics.slDrag >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                                 {{ strategyExecutionMetrics.slDrag >= 0 ? 'Good' : 'Sub-Optimal' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'strategy_execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('risk_budget_adherence') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1 overflow-hidden">
                                 <span class="text-xl font-mono font-black" :class="tradeRiskAudit.ok ? 'text-emerald-400' : 'text-rose-400'">
                                    {{ strategyExecutionMetrics.riskBudgetRatio.toFixed(2) }}%
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60 truncate">
                                    {{ strategyExecutionMetrics.riskBudgetText }}
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Compares the worst value between planned stop risk and realized loss against the Risk Per Trade budget defined in the Genesis Matrix.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 max(Stop Risk, Realized Loss) / Risk Budget × 100
                              </code>
                           </div>
                           <div class="pt-2 border-t nier-border-primary grid grid-cols-2 gap-2">
                              <div class="border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-2">
                                 <span class="text-[8px] opacity-40 block uppercase tracking-widest font-black">Stop Risk</span>
                                 <span class="text-[12px] font-black" :class="tradeRiskAudit.plannedOk ? 'text-emerald-500' : 'text-rose-500'">{{ formatRiskCurrency(tradeRiskAudit.planned) }}</span>
                              </div>
                              <div class="border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-2">
                                 <span class="text-[8px] opacity-40 block uppercase tracking-widest font-black">Realized Loss</span>
                                 <span class="text-[12px] font-black" :class="tradeRiskAudit.realizedOk ? 'text-emerald-500' : 'text-rose-500'">{{ formatRiskCurrency(tradeRiskAudit.realized) }}</span>
                              </div>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&lt;= 100%</span><span class="text-emerald-500 font-bold">Compliant</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&gt; 100%</span><span class="text-rose-500 font-bold">Budget Exceeded</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="tradeRiskAudit.ok ? 'text-emerald-500' : 'text-rose-500'">
                                 {{ tradeRiskAudit.status }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'strategy_execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('tp_capture_ratio') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1 overflow-hidden">
                                 <span class="text-xl font-mono font-black" :class="Number.isFinite(strategyExecutionMetrics.tpCapture) && strategyExecutionMetrics.tpCapture === 100 ? 'text-emerald-400' : 'text-amber-400'">
                                    {{ formatRiskPercent(strategyExecutionMetrics.tpCapture) }}
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60 truncate">
                                    {{ strategyExecutionMetrics.tpCaptureText }}
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Measures how much of the planned reward toward take profit was realized before exit, using trade direction.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 (Reward Toward TP / Target Reward) * 100
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">100%</span><span class="text-emerald-500 font-bold">Full Capture</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; 100%</span><span class="text-amber-500 font-bold">Partial Capture</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="Number.isFinite(strategyExecutionMetrics.tpCapture) && strategyExecutionMetrics.tpCapture === 100 ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ Number.isFinite(strategyExecutionMetrics.tpCapture) ? (strategyExecutionMetrics.tpCapture === 100 ? 'Perfect' : 'Sub-Optimal') : 'N/A' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'strategy_execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('edge_capture_quotient') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1 overflow-hidden">
                                 <span class="text-xl font-mono font-black" :class="strategyExecutionMetrics.edgeQuotient >= 1 ? 'text-emerald-400' : 'text-rose-400'">
                                    {{ strategyExecutionMetrics.edgeQuotient.toFixed(2) }}x
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60 truncate">
                                    {{ strategyExecutionMetrics.edgeQuotientText }}
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Compares realized Risk/Reward ratio against the strategy's expected baseline R/R.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 Realized RR / Baseline RR
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt;= 1.0x</span><span class="text-emerald-500 font-bold">Edge Maintained</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; 1.0x</span><span class="text-rose-500 font-bold">Edge Diluted</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="strategyExecutionMetrics.edgeQuotient >= 1 ? 'text-emerald-500' : 'text-rose-500'">
                                 {{ strategyExecutionMetrics.edgeQuotient >= 1 ? 'Good' : 'Sub-Optimal' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'strategy_execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('unrealized_alpha_left') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1 overflow-hidden">
                                 <span class="text-xl font-mono font-black" :class="Number.isFinite(strategyExecutionMetrics.unrealizedLeft) && strategyExecutionMetrics.unrealizedLeft === 0 ? 'text-emerald-400' : 'text-amber-400'">
                                    {{ formatRiskCurrency(strategyExecutionMetrics.unrealizedLeft) }}
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60 truncate">
                                    {{ strategyExecutionMetrics.unrealizedLeftText }}
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Calculates additional profit that would have been captured if held to the planned Take Profit level.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 Planned TP Profit - Realized Profit
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">$0</span><span class="text-emerald-500 font-bold">Zero Left</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&gt; $0</span><span class="text-amber-500 font-bold">Left on Table</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="Number.isFinite(strategyExecutionMetrics.unrealizedLeft) && strategyExecutionMetrics.unrealizedLeft === 0 ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ Number.isFinite(strategyExecutionMetrics.unrealizedLeft) ? (strategyExecutionMetrics.unrealizedLeft === 0 ? 'Perfect' : 'Sub-Optimal') : 'N/A' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'strategy_execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('horizon_sync_rating') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1 overflow-hidden">
                                 <span class="text-xl font-mono font-black" :class="strategyExecutionMetrics.horizonSync === 100 ? 'text-emerald-400' : 'text-rose-400'">
                                    {{ (strategyExecutionMetrics.horizonSync || 0).toFixed(2) }}%
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60 truncate">
                                    {{ strategyExecutionMetrics.horizonSyncText }}
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Shows the trade duration position inside the historical scenario range, from minimum to maximum.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 (Trade Duration - Scenario Min) / (Scenario Max - Scenario Min) * 100
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">0%</span><span class="text-emerald-500 font-bold">Scenario Min</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">50%</span><span class="text-slate-500 font-bold">Scenario Mid</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">100%</span><span class="text-emerald-500 font-bold">Scenario Max</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 nier-text-primary">
                                 {{ strategyExecutionMetrics.horizonSyncText }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'strategy_execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('velocity_variance_index') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1 overflow-hidden">
                                 <span class="text-xl font-mono font-black" :class="strategyExecutionMetrics.velocityDelta >= 1 ? 'text-emerald-400' : 'text-amber-400'">
                                    {{ strategyExecutionMetrics.velocityDelta.toFixed(2) }}x
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60 truncate">
                                    {{ strategyExecutionMetrics.velocityDeltaText }}
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Compares realized profit velocity against the strategy's historical baseline velocity in dollars per hour.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 Realized Velocity / Baseline Velocity
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt;= 1.0x</span><span class="text-emerald-500 font-bold">Optimal Pacing</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; 1.0x</span><span class="text-amber-500 font-bold">Lagging Velocity</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="strategyExecutionMetrics.velocityDelta >= 1 ? 'text-emerald-500' : 'text-amber-500'">
                                 {{ strategyExecutionMetrics.velocityDelta >= 1 ? 'Good' : 'Sub-Optimal' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'strategy_execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('conditional_alpha_decay') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1 overflow-hidden">
                                 <span class="text-xl font-mono font-black" :class="strategyExecutionMetrics.alphaDecay === 0 ? 'text-emerald-400' : 'text-rose-400'">
                                    -{{ strategyExecutionMetrics.alphaDecay }} Rules
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60 truncate">
                                    {{ strategyExecutionMetrics.alphaDecayText }}
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>Correlates negative emotional markers with required rules missing from the executed condition set.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 Missing Required Rules * Emotion Penalty
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">0 Rules</span><span class="text-emerald-500 font-bold">Zero Decay</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&gt; 0 Rules</span><span class="text-rose-500 font-bold">Alpha Decay</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="strategyExecutionMetrics.alphaDecay === 0 ? 'text-emerald-500' : 'text-rose-500'">
                                 {{ strategyExecutionMetrics.alphaDecay === 0 ? 'Perfect' : 'Decay Warning' }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <ExTooltip :is-dark="isDark" v-if="['all', 'strategy_execution'].includes(activeMetricTab)" variant="basic">
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">{{ getAdvancedMetricLabel('execution_confidence_index') }}</span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1 overflow-hidden">
                                 <span class="text-xl font-mono font-black" :class="strategyExecutionMetrics.executionGrade >= 80 ? 'text-emerald-400' : (strategyExecutionMetrics.executionGrade >= 60 ? 'text-amber-400' : 'text-rose-400')">
                                    {{ (strategyExecutionMetrics.executionGrade || 0).toFixed(2) }} / 100
                                 </span>
                                 <span class="text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60 truncate">
                                    {{ strategyExecutionMetrics.executionGradeText }}
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col space-y-1">
                           <div>A unified composite score combining adherence, target capture efficiency, risk compliance, and cognitive stability.</div>
                           <div class="pt-2 border-t nier-border-primary">
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Formula</span>
                              <code class="block p-1 bg-black/5 dark:bg-white/5 rounded text-[9px] font-mono font-bold nier-text-primary tracking-tighter">
                                 0.3*Adherence + 0.3*TP Capture + 0.2*Risk Score + 0.2*Stability
                              </code>
                           </div>
                           <div>
                              <span class="text-[9px] opacity-40 block uppercase tracking-widest font-black mb-1">Benchmark</span>
                              <div class="text-[9px] space-y-0.5 bg-black/[0.02] dark:bg-white/[0.02] p-1 rounded border border-black/5 dark:border-white/5 font-medium">
                                 <div class="flex justify-between"><span class="opacity-70">&gt;= 80</span><span class="text-emerald-500 font-bold">High Confidence</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">60-79</span><span class="text-amber-500 font-bold">Moderate</span></div>
                                 <div class="flex justify-between"><span class="opacity-70">&lt; 60</span><span class="text-rose-500 font-bold">Low Confidence</span></div>
                              </div>
                           </div>
                           <div class="pt-2 border-t nier-border-primary flex items-center justify-between">
                              <span class="text-[9px] opacity-40 uppercase tracking-widest font-black">Evaluation</span>
                              <span class="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5"
                                    :class="strategyExecutionMetrics.executionGrade >= 80 ? 'text-emerald-500' : (strategyExecutionMetrics.executionGrade >= 60 ? 'text-amber-500' : 'text-rose-500')">
                                 {{ strategyExecutionMetrics.executionGrade >= 80 ? 'Good' : (strategyExecutionMetrics.executionGrade >= 60 ? 'Stable' : 'Sub-Optimal') }}
                              </span>
                           </div>
                        </div>
                     </ExTooltip>

                     <!-- TAB E: IN-TRADE ANALYSIS -->
                     <ExTooltip
                       v-for="metric in visibleInTradeAnalysisRows"
                       :key="metric.id"
                       :is-dark="isDark"
                       variant="basic"
                     >
                        <template #trigger>
                           <div class="flex flex-col space-y-1 group cursor-pointer" :data-correlation-metric-id="`in_trade:${metric.id}`">
                              <span class="text-[8px] font-mono opacity-40 uppercase tracking-widest font-black group-hover:opacity-60 transition-opacity">
                                 {{ formatDisplayLabel(metric.label) }}
                              </span>
                              <div class="flex flex-col justify-center space-y-0.5 py-1 overflow-hidden">
                                 <span
                                   class="truncate text-xl font-mono font-black"
                                   :class="metric.tone === 'positive' ? 'text-emerald-400' : (metric.tone === 'danger' ? 'text-rose-400' : (metric.tone === 'warning' ? 'text-amber-400' : (metric.tone === 'muted' ? 'text-black/35 dark:text-white/35' : 'nier-text-primary')))"
                                 >
                                   {{ metric.value }}
                                 </span>
                                 <span class="truncate text-[8px] font-mono uppercase tracking-[0.15em] text-black/60 dark:text-white/60">
                                   {{ formatDisplayLabel(metric.subvalue) }}
                                 </span>
                              </div>
                           </div>
                        </template>
                        <div class="w-full text-[10px] font-mono uppercase tracking-wider leading-relaxed flex flex-col gap-2">
                           <div>{{ metric.hint }}</div>
                           <div v-if="metric.detail?.length" class="border-t nier-border-primary pt-2 text-[9px] leading-relaxed tracking-[0.14em] opacity-70">
                              <div class="mb-1 font-black opacity-45">{{ studyMetricText.detail.data }}</div>
                              <div class="grid grid-cols-[minmax(80px,0.55fr)_minmax(0,1fr)] gap-x-3 gap-y-1">
                                 <template v-for="row in metric.detail" :key="row.label">
                                    <span class="opacity-45">{{ formatDisplayLabel(row.label) }}</span>
                                    <span class="min-w-0 break-words font-black nier-text-primary">{{ row.value }}</span>
                                 </template>
                              </div>
                           </div>
                        </div>
                     </ExTooltip>
                  </div>

                </div>

               </div>

               <!-- VISUALS VIEW (MODE 4) -->
               <div v-else-if="currentPage === 4" :key="'visuals'" class="min-h-full flex flex-col p-8 space-y-8 overflow-y-auto custom-scrollbar">
                  <div class="flex items-center justify-between border-b nier-border-primary pb-4">
                     <div class="flex flex-col">
                       <span class="text-[10px] font-mono font-black uppercase tracking-[0.4em] opacity-40 nier-text-primary">Archival Visual Stream</span>
                       <h2 class="text-xl font-mono tracking-widest uppercase font-black nier-text-primary mt-1">SITUATIONAL EVIDENCE</h2>
                     </div>
                     <ExButton variant="solid" @click="addImageSlot">
                        <div class="flex items-center space-x-3">
                           <span class="text-[10px] font-mono font-black uppercase tracking-widest">ADD VISUAL SLOT</span>
                           <div class="w-2 h-2 border border-current rotate-45"></div>
                        </div>
                     </ExButton>
                  </div>

                  <div v-if="!enrichedTrade?.images || enrichedTrade.images.length === 0" class="flex-grow flex flex-col items-center justify-center opacity-20 space-y-4">
                     <div class="w-24 h-24 border border-black dark:border-white border-dashed rotate-45 flex items-center justify-center">
                       <span class="text-4xl font-light -rotate-45">+</span>
                     </div>
                     <span class="text-[10px] font-mono uppercase tracking-[0.8em]">NO VISUAL DATA FOUND</span>
                  </div>

                  <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                     <div v-for="(img, idx) in enrichedTrade.images" :key="img.url || idx" class="relative">
                        <ExImageArchiveSlot 
                           :id="idx"
                           :imageUrl="img.url"
                           :timestamp="formatImageSlotDate(img.createdAt || img.timestamp || img.date)"
                           :name="img.name"
                           :tags="img.tags"
                           @upload="triggerUpload(idx)"
                           @fullscreen="showImageFullscreen(idx)"
                           @edit="editImage(idx)"
                           @remove="removeImage(idx)"
                           @update:name="(newName) => updateImageName(idx, newName)"
                           @update:tags="(newTags) => updateImageTags(idx, newTags)"
                        />
                        <input 
                           type="file" 
                           :id="`visual-upload-${idx}`" 
                           class="hidden" 
                           accept="image/*" 
                           @change="handleImageUpload($event, idx)" 
                        />
                     </div>
                  </div>
               </div>

               <!-- NOTES VIEW (MODE 5) -->
               <div v-else-if="currentPage === 5" :key="'notes'" class="min-h-full flex flex-col p-8 space-y-8 overflow-y-auto custom-scrollbar pb-20">
                  <div class="flex items-center justify-between border-b nier-border-primary pb-4">
                     <div class="flex flex-col">
                       <span class="text-[10px] font-mono font-black uppercase tracking-[0.4em] opacity-40 nier-text-primary">Neural Note Archive</span>
                       <h2 class="text-xl font-mono tracking-widest uppercase font-black nier-text-primary mt-1">SESSION POST MORTEM</h2>
                     </div>
                     <div class="flex items-center space-x-6">
                        <ExButton variant="solid" @click="isCreatingNote = true" v-if="!isCreatingNote">
                           <span class="text-[10px] font-mono font-black uppercase tracking-widest">ADD NEW RECORD</span>
                        </ExButton>
                     </div>
                  </div>

                  <!-- NEW NOTE TEXTAREA -->
                  <div v-if="isCreatingNote" class="flex flex-col space-y-4 bg-black/[0.03] dark:bg-white/[0.03] p-8 border nier-border-primary relative">
                       <div class="absolute top-4 right-4 flex space-x-4">
                          <button @click="cancelNoteEdit" class="text-[10px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100">Cancel</button>
                       </div>
                    
                       
                       <!-- FORMATTING TOOLBAR -->
                       <div class="flex items-center flex-wrap gap-2 pb-4 border-b border-black/5 dark:border-white/5 mb-4">
                          <div class="flex items-center bg-black/5 dark:bg-white/5 p-1 rounded-sm mr-4">
                             <button @click="isPreviewMode = false" 
                                     :class="['px-3 py-1 text-[9px] font-mono transition-all', !isPreviewMode ? 'nier-bg-inverted nier-text-primary' : 'opacity-40']">
                                EDITOR
                             </button>
                             <button @click="isPreviewMode = true" 
                                     :class="['px-3 py-1 text-[9px] font-mono transition-all', isPreviewMode ? 'nier-bg-inverted nier-text-primary' : 'opacity-40']">
                                PREVIEW
                             </button>
                          </div>

                          <div v-if="!isPreviewMode" class="flex items-center flex-wrap gap-2">
                            <button @click="insertFormatting('# ', '')" class="px-2 py-1 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[9px] font-mono transition-all">H1</button>
                            <button @click="insertFormatting('## ', '')" class="px-2 py-1 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[9px] font-mono transition-all">H2</button>
                            <button @click="insertFormatting('### ', '')" class="px-2 py-1 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[9px] font-mono transition-all">H3</button>
                            <div class="w-px h-4 bg-black/10 dark:bg-white/10 mx-1"></div>
                            <button @click="insertFormatting('**', '**')" class="px-2 py-1 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[9px] font-mono font-bold transition-all">B</button>
                            <button @click="insertFormatting('*', '*')" class="px-2 py-1 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[9px] font-mono italic transition-all">I</button>
                            <button @click="insertFormatting('~~', '~~')" class="px-2 py-1 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[9px] font-mono underline transition-all">U</button>
                            <div class="w-px h-4 bg-black/10 dark:bg-white/10 mx-1"></div>
                            <button @click="insertFormatting('- ', '')" class="px-2 py-1 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[9px] font-mono transition-all">LIST</button>
                            <button @click="insertFormatting('> ', '')" class="px-2 py-1 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[9px] font-mono transition-all">QUOTE</button>
                            <div class="w-px h-4 bg-black/10 dark:bg-white/10 mx-1"></div>
                            <button @click="insertFormatting('[color=#10b981]', '[/color]')" class="px-2 py-1 hover:scale-110 transition-all"><div class="w-3 h-3 bg-emerald-500 rounded-full"></div></button>
                            <button @click="insertFormatting('[color=#ef4444]', '[/color]')" class="px-2 py-1 hover:scale-110 transition-all"><div class="w-3 h-3 bg-rose-500 rounded-full"></div></button>
                            <button @click="insertFormatting('[color=#3b82f6]', '[/color]')" class="px-2 py-1 hover:scale-110 transition-all"><div class="w-3 h-3 bg-blue-500 rounded-full"></div></button>
                            <div class="w-px h-4 bg-black/10 dark:bg-white/10 mx-1"></div>
                            
                            <!-- Visual Attach Dropdown -->
                            <div class="relative group/visuals inline-block">
                              <button class="px-2 py-1 bg-black/[0.05] dark:bg-white/[0.05] hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-[9px] font-mono transition-all flex items-center gap-1">
                                ATTACH VISUAL
                                <svg class="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                              </button>
                              <div class="absolute top-full left-0 hidden group-hover/visuals:flex flex-col nier-bg-panel border nier-border-primary shadow-xl z-50 min-w-[150px]">
                                <div v-if="!enrichedTrade?.images?.length" class="px-3 py-2 text-[8px] font-mono opacity-50 uppercase whitespace-nowrap">NO VISUALS ARCHIVED</div>
                                <button v-else v-for="(img, idx) in enrichedTrade.images" :key="img.url" @click.prevent="insertFormatting(`[VISUAL_REF:${idx}]`, '')" class="px-3 py-2 text-[9px] font-mono text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors truncate max-w-[200px]">
                                  {{ formatDisplayLabel(img.name || `Visual_Node_${idx}`) }}
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
                             placeholder="REIFY SESSION THOUGHTS HERE..."
                             class="w-full h-full bg-transparent border-0 font-mono text-[13px] leading-relaxed tracking-wider outline-none resize-none placeholder:opacity-20 min-h-[200px]"
                             autofocus
                          ></textarea>
                          <div v-else 
                               class="w-full h-full font-mono text-[13px] leading-relaxed tracking-wider overflow-y-auto custom-scrollbar min-h-[200px]"
                               v-html="formatNote(noteText || 'NO CONTENT TO PREVIEW')">
                          </div>
                       </div>
                       <div class="flex justify-end">
                          <button @click="addNote" class="group/save relative h-10 px-10 bg-black text-white dark:bg-white dark:text-black font-black border border-black dark:border-white hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-all duration-500">
                            <span class="relative z-10 text-[9px] uppercase tracking-[0.4em]">Persist Record</span>
                          </button>
                       </div>
                    </div>
                  
                  <!-- EXISTING NOTES LIST -->
                  <div class="flex flex-col space-y-6">
                     <div v-for="note in [...(enrichedTrade?.notesList || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())" :key="note.id" 
                          class="flex flex-col p-6 border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] relative group/note cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
                          @click="toggleNote(note.id)"
                          @dblclick="startEditContent(note)">
                        <div class="flex items-center justify-between mb-2 pb-2" :class="expandedNoteIds.includes(note.id) ? 'border-b border-black/5 dark:border-white/5' : ''">
                           <div class="flex items-center space-x-4">
                              <div class="w-1.5 h-1.5 nier-bg-inverted transition-transform duration-300" :class="expandedNoteIds.includes(note.id) ? 'rotate-[135deg]' : 'rotate-45'"></div>
                              <div v-if="editingNoteId === note.id" @click.stop class="flex items-center gap-2">
                                <input 
                                  v-model="editNoteTitle" 
                                  @keydown.enter.prevent="saveNoteTitle(note.id)" 
                                  @blur="saveNoteTitle(note.id)"
                                  class="bg-transparent border-b border-black/30 dark:border-white/30 outline-none text-[9px] font-mono font-black uppercase tracking-[0.2em] nier-text-primary"
                                  autofocus
                                />
                                <span class="text-[7px] font-mono opacity-40 uppercase tracking-widest">(ENTER TO SAVE)</span>
                              </div>
                              <span v-else @click.stop="startEditNote(note, $event)" class="text-[9px] font-mono font-black uppercase tracking-[0.2em] hover:opacity-50 transition-opacity cursor-text">{{ formatDisplayLabel(note.title || 'ARCHIVED_RECORD') }}</span>
                           </div>
                           <div class="flex items-center space-x-4">
                              <span class="text-[10px] font-mono font-bold opacity-60 tracking-wider nier-text-primary">{{ formatDateTactical(note.date) }}</span>
                              <button type="button" @click.stop="deleteNote(note.id)" class="opacity-0 group-hover/note:opacity-40 hover:!opacity-100 transition-opacity text-rose-500">
                                 <span class="text-[9px] font-mono font-black uppercase tracking-widest">[Delete]</span>
                              </button>
                           </div>
                        </div>
                        <div v-if="expandedNoteIds.includes(note.id)" class="text-[12px] font-mono leading-relaxed opacity-70 whitespace-pre-wrap mt-2 animate-fade-in" v-html="formatNote(note.content)"></div>
                     </div>
                  </div>


               </div>
            </Transition>
          </div>
        </div>
      </Transition>
       </div>
      </div>
    </div>


    </component>

  <!-- DEEP DIVE EFFICIENCY MODAL -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="selectedDeepDiveProtocol" 
           class="fixed inset-0 z-[100000] flex items-center justify-center p-8 md:p-24 bg-black/60 backdrop-blur-md">
         <div class="w-full max-w-5xl h-[600px] shadow-2xl relative">
            <ExEfficiencyLattice 
               :trades="allTrades"
               :protocolId="selectedDeepDiveProtocol.id"
               :protocolName="selectedDeepDiveProtocol.name"
               @close="selectedDeepDiveProtocol = null"
            />
            <!-- Background close area -->
            <div class="absolute -inset-10 -z-10" @click="selectedDeepDiveProtocol = null"></div>
         </div>
      </div>
    </Transition>
  </Teleport>

  </div>

  <!-- EMOTION MATRIX OVERLAY -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showEmotionSelector" 
            class="fixed inset-0 z-[100000] flex items-center justify-center p-20 bg-black/40 dark:bg-black/80 backdrop-blur-md">
        <div class="relative w-full max-w-5xl nier-bg-panel border border-black/40 dark:border-white/40 shadow-[0_0_100px_rgba(0,0,0,0.2)] dark:shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
          
          <div class="flex items-center justify-between px-10 py-6 border-b nier-border-primary">
            <div class="flex items-center gap-4">
              <div class="w-2 h-2 nier-bg-inverted rotate-45"></div>
              <span class="text-xs uppercase tracking-[0.8em] font-black nier-text-primary">Emotion Matrix Protocol</span>
            </div>
          </div>

          <div class="p-12 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div class="grid grid-cols-3 gap-12">
              <div v-for="(emotions, category) in emotionsByCategory" :key="category" class="flex flex-col space-y-8">
                <div class="flex items-center gap-4">
                  <div class="h-[1px] flex-1 bg-black/10 dark:bg-white/10"></div>
                  <span class="text-[9px] font-mono tracking-[0.5em] text-black/40 dark:text-white/40 uppercase">{{ formatDisplayLabel(category) }}</span>
                </div>
                
                <div class="flex flex-col space-y-3">
                  <button v-for="emotion in emotions" :key="emotion.label"
                          @click="toggleEmotion(emotion.label)"
                          :disabled="!!isEmotionDisabled(emotion.label)"
                          class="flex flex-col p-6 border transition-all text-left group"
                          :class="[
                            selectedEmotions.includes(emotion.label) 
                              ? 'bg-black border-black dark:bg-white dark:border-white' 
                              : 'bg-transparent nier-border-primary hover:border-black/30 dark:hover:border-white/30',
                            isEmotionDisabled(emotion.label) ? 'opacity-20 cursor-not-allowed grayscale' : ''
                          ]">
                    <span class="text-[13px] font-mono font-black tracking-widest uppercase transition-colors"
                          :class="selectedEmotions.includes(emotion.label) ? 'nier-text-primary' : 'text-black/80 dark:text-white/80 group-hover:text-black dark:group-hover:text-white'">
                      {{ formatDisplayLabel(emotion.label) }}
                    </span>
                    <span class="text-[10px] font-mono uppercase mt-2 leading-relaxed"
                          :class="selectedEmotions.includes(emotion.label) ? 'text-white/80 dark:text-black/80' : 'text-black/80 dark:text-white/80'">
                      {{ emotion.description }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="px-10 py-8 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-12 bg-black/[0.02] dark:bg-white/[0.02]">
            <div class="flex gap-1 opacity-40">
              <div v-for="i in 3" :key="i" class="w-1 h-1 nier-bg-inverted rotate-45"></div>
            </div>
            <button @click="saveEmotions" 
                    class="group/save relative h-12 px-16 bg-black text-white dark:bg-white dark:text-black font-black border border-black dark:border-white hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-all duration-500 ease-in-out">
              <span class="relative z-10 text-[10px] uppercase tracking-[0.8em]">Update Protocol</span>
            </button>
            <div class="flex gap-1 opacity-40">
              <div v-for="i in 3" :key="i" class="w-1 h-1 nier-bg-inverted rotate-45"></div>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- CUSTOM CONTEXT MENU -->
  <Teleport to="body">
    <div v-if="activeContextMenu" 
         :style="{ top: activeContextMenu.y + 'px', left: activeContextMenu.x + 'px' }"
         class="fixed z-[200000] nier-bg-panel border nier-border-primary shadow-2xl py-1 min-w-[180px] animate-in fade-in zoom-in duration-200">
      
      <button @click="showImageFullscreen(activeContextMenu.idx); closeContextMenu()" 
              class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-emerald-500 hover:text-white transition-all group/ctx text-left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-emerald-500 group-hover/ctx:text-white transition-colors">
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span class="text-[10px] font-mono font-black uppercase tracking-widest text-black/80 dark:text-white/80 group-hover/ctx:text-white">Show Fullscreen</span>
      </button>

      <button @click="editImage(activeContextMenu.idx); closeContextMenu()" 
              class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-indigo-500 hover:text-white transition-all group/ctx text-left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-indigo-500 group-hover/ctx:text-white transition-colors">
          <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        <span class="text-[10px] font-mono font-black uppercase tracking-widest text-black/80 dark:text-white/80 group-hover/ctx:text-white">Edit Visuals</span>
      </button>

      <div class="h-px bg-black/5 dark:bg-white/5 my-1"></div>

      <button @click="removeImage(activeContextMenu.idx); closeContextMenu()" 
              class="w-full flex items-center space-x-3 px-4 py-3 hover:bg-rose-500 hover:text-white transition-all group/ctx text-left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-rose-500 group-hover/ctx:text-white transition-colors">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <span class="text-[10px] font-mono font-black uppercase tracking-widest text-black/80 dark:text-white/80 group-hover/ctx:text-white">Remove Slot</span>
      </button>
    </div>
  </Teleport>

  <!-- FULLSCREEN EDITOR OVERLAY -->
  <Teleport to="body">
    <ExImageEditor 
      :key="isEditorOpen ? (editorMode === 'preview' ? 'preview' : 'edit') + '-' + currentEditIdx : 'closed'"
      v-if="isEditorOpen"
      :isOpen="isEditorOpen"
      :imageUrl="editorImageSrc"
      :initialData="currentAnnotations"
      :previewMode="editorMode === 'preview'"
      @close="isEditorOpen = false"
      @save="onDrawingSave"
    />
  </Teleport>
</template>

<style scoped>
@keyframes glow-red {
  0%, 100% {
    text-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
    opacity: 0.8;
  }
  50% {
    text-shadow: 0 0 20px rgba(239, 68, 68, 0.8), 0 0 35px rgba(239, 68, 68, 0.4);
    opacity: 1;
    color: #ef4444;
  }
}

.animate-glow-red {
  animation: glow-red 3s ease-in-out infinite;
}

.font-serif {
  font-family: 'Cormorant Garamond', serif;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes scan {
  0% { transform: translateY(0); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(128px); opacity: 0; }
}

:global(.custom-scrollbar::-webkit-scrollbar) {
  display: block !important;
  width: 8px !important;
  height: 8px !important;
}

:global(.custom-scrollbar::-webkit-scrollbar-track) {
  background: transparent !important;
}

:global(.custom-scrollbar::-webkit-scrollbar-thumb) {
  background-color: rgba(0, 0, 0, 0.1) !important;
  border-radius: 0 !important;
}

:global(.dark .custom-scrollbar::-webkit-scrollbar-thumb) {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

:global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
  background-color: rgba(0, 0, 0, 0.4) !important;
}

:global(.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover) {
  background-color: rgba(255, 255, 255, 0.9) !important;
}

:global(.custom-scrollbar) {
  scrollbar-width: auto !important;
  scrollbar-color: rgba(0, 0, 0, 0.5) transparent !important;
}

:global(.dark .custom-scrollbar) {
  scrollbar-color: rgba(255, 255, 255, 0.9) transparent !important;
}

.embedded-brief :deep([class*="overflow-visible"][class*="z-50"]) {
  display: none !important;
}

.page-slide-enter-active,
.page-slide-leave-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
  filter: blur(4px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
  filter: blur(4px);
}

/* BACKGROUND DECORATION ANIMATIONS */
@keyframes slow-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes reverse-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(12deg); }
  50% { transform: translateY(-20px) rotate(15deg); }
}

@keyframes float-delayed {
  0%, 100% { transform: translateY(0) rotate(-45deg); }
  50% { transform: translateY(20px) rotate(-40deg); }
}

@keyframes pulse-slow {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.1; }
}

@keyframes orbit {
  0% { transform: rotate(0deg) translateX(50px) rotate(0deg); opacity: 0; }
  25% { opacity: 1; }
  75% { opacity: 1; }
  100% { transform: rotate(360deg) translateX(50px) rotate(-360deg); opacity: 0; }
}

.animate-slow-rotate {
  animation: slow-rotate 60s linear infinite;
}

.animate-reverse-rotate {
  animation: reverse-rotate 40s linear infinite;
}

.animate-float {
  animation: float 8s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 10s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulse-slow 15s ease-in-out infinite;
}

.animate-orbit {
  animation: orbit 20s linear infinite;
}
</style>
