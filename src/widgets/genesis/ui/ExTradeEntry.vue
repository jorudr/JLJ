<script setup>
import { computed, provide, watch } from 'vue'
import { useExTradeEntry } from '../model/useExTradeEntry'
import DesignVignette from '~/widgets/style/ui/DesignVignette.vue'

import ExTradeEntryCmeNotice from './components/ExTradeEntryCmeNotice.vue'
import ExTradeEntryProtocolSelect from './components/ExTradeEntryProtocolSelect.vue'
import ExTradeEntryMiddleSection from './components/ExTradeEntryMiddleSection.vue'
import ExTradeEntryEmotionMatrix from './components/ExTradeEntryEmotionMatrix.vue'
import ExTradeEntryConditionLibrary from './components/ExTradeEntryConditionLibrary.vue'
import ExTradeEntryMethodMatrix from './components/ExTradeEntryMethodMatrix.vue'
import ExTradeEntryStudyMetricsPanel from './components/ExTradeEntryStudyMetricsPanel.vue'

const emit = defineEmits(['addTrade', 'updateTrade', 'close', 'panelChange'])
const props = defineProps({
  initialTrade: {
    type: Object,
    default: null
  }
})

const state = useExTradeEntry(props, emit)
provide('tradeState', state)

const getActivePanel = () => {
  if (state.showConditionLibrary.value) return 'matrix'
  if (state.showEntryMethod.value) return 'method'
  if (state.viewMode.value === 'journal') return 'journal'
  return null
}

watch(
  [state.showConditionLibrary, state.showEntryMethod, state.viewMode],
  () => emit('panelChange', getActivePanel()),
  { immediate: true }
)

const closeTradeEntryPanels = () => {
  state.showConditionLibrary.value = false
  state.showEmotionSelector.value = false
  state.showEntryMethod.value = false
  state.showTradeStudyMetrics.value = false
}

const openTradeEntryPanel = (panel) => {
  closeTradeEntryPanels()

  if (panel === 'close') {
    state.isClosed.value = !state.isClosed.value
    return state.isClosed.value
  }

  if (panel === 'matrix') {
    state.viewMode.value = 'tactical'
    state.showConditionLibrary.value = true
  } else if (panel === 'journal') {
    state.viewMode.value = 'journal'
  } else if (panel === 'method') {
    state.showEntryMethod.value = true
  }

  return true
}

defineExpose({
  openPanel: openTradeEntryPanel,
  closePanels: closeTradeEntryPanels
})

const { isDark, scrollContainer } = state

const tradeEntryThemeStyle = computed(() => isDark.value
  ? {
      '--theme-bg': '#000000',
      '--theme-bg-rgb': '0 0 0',
      '--theme-panel': 'rgba(5, 5, 5, 0.92)',
      '--theme-text': '#F9F6F0',
      '--theme-text-rgb': '249 246 240',
      '--theme-border': 'rgba(249, 246, 240, 0.12)',
      backgroundColor: '#000000'
    }
  : {
      backgroundColor: 'var(--theme-bg)'
    }
)
</script>

<template>
  <div ref="scrollContainer" 
       class="trade-entry-shell flex flex-col items-center h-full w-full overflow-x-hidden overflow-y-auto custom-scrollbar transition-colors duration-500 pb-40 bg-theme-bg nier-text-primary"
       :class="isDark ? 'dark is-dark theme-dark' : 'theme-light'"
       :style="tradeEntryThemeStyle">
     <DesignVignette :is-dark="isDark" />
     
     <ExTradeEntryCmeNotice />
     <ExTradeEntryProtocolSelect @close="emit('close')" />
     <ExTradeEntryMiddleSection />
     <ExTradeEntryEmotionMatrix />
     <ExTradeEntryConditionLibrary />
     <ExTradeEntryMethodMatrix />
     <ExTradeEntryStudyMetricsPanel />
  </div>
</template>

<style>
.custom-scrollbar {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
.custom-scrollbar::-webkit-scrollbar {
  display: none !important;
}

.trade-entry-shell.page-reify-enter-active,
.trade-entry-shell.page-reify-leave-active {
  transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.trade-entry-shell.page-reify-enter-from,
.trade-entry-shell.page-reify-leave-to {
  opacity: 0 !important;
  transform: none !important;
  filter: none !important;
}

.nier-input {
  background: transparent;
  border: none;
  font-family: 'Inter', monospace;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 0.15em;
  color: white;
  padding: 0;
  outline: none;
}
.nier-input::placeholder {
  color: rgba(255, 255, 255, 0.2);
}

input::-webkit-outer-spin-button, 
input::-webkit-inner-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
input[type=number] { 
  -moz-appearance: textfield; 
  appearance: textfield;
}

/* Animations */
@keyframes scan-fast {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

@keyframes scan-slow {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes scan-vertical {
  from { transform: translateY(-100%); }
  to { transform: translateY(100%); }
}

.animate-scan-fast {
  animation: scan-fast 1.5s infinite linear;
}

.animate-scan-slow {
  animation: scan-slow 3s infinite linear;
}

@keyframes scan-vertical {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(500%); }
}

.animate-scan {
  animation: scan-vertical 4s linear infinite;
}

/* Transitions */
.risk-warn-enter-active,
.risk-warn-leave-active {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.risk-warn-enter-from,
.risk-warn-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
  filter: blur(4px);
}
.risk-warn-enter-to,
.risk-warn-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
  filter: blur(0px);
}

.protocol-slide-enter-active, .protocol-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.protocol-slide-enter-from, .protocol-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.nier-fade-enter-active, .nier-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.nier-fade-enter-from, .nier-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.sector-swap-enter-active, .sector-swap-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.sector-swap-enter-from { opacity: 0; transform: translateX(20px); }
.sector-swap-leave-to { opacity: 0; transform: translateX(-20px); }

.insight-slide-enter-active, .insight-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.insight-slide-enter-from { 
  opacity: 0; 
  transform: translate(-30px, -50%); 
}
.insight-slide-leave-to { 
  opacity: 0; 
  transform: translate(-30px, -50%); 
}
</style>
