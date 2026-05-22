<template>
  <div class="absolute inset-0 w-full h-full pointer-events-none">
    <!-- TradingView widget gets injected here -->
    <div ref="containerRef" class="tradingview-widget-container" style="height: 100%; width: 100%;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  symbol: {
    type: String,
    default: 'NASDAQ:AAPL'
  },
  theme: {
    type: String,
    default: 'dark'
  }
})

const containerRef = ref<HTMLElement>()
let checkInterval: any = null
let safetyTimeout: any = null

const applySandbox = () => {
  if (!containerRef.value) return
  
  // Look for the iframe injected by TradingView
  checkInterval = setInterval(() => {
    const iframe = containerRef.value?.querySelector('iframe')
    if (iframe) {
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms')
      if (checkInterval) {
        clearInterval(checkInterval)
        checkInterval = null
      }
    }
  }, 100)
  
  // Safety timeout to stop checking after 5s
  safetyTimeout = setTimeout(() => {
    if (checkInterval) {
      clearInterval(checkInterval)
      checkInterval = null
    }
  }, 5000)
}

const renderWidget = () => {
  if (!containerRef.value) return

  // Wipe previous
  containerRef.value.innerHTML = ''
  
  if (!props.symbol) return

  const innerDiv = document.createElement('div')
  innerDiv.className = 'tradingview-widget-container__widget'
  innerDiv.style.height = '100%'
  innerDiv.style.width = '100%'
  containerRef.value.appendChild(innerDiv)

  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
  script.async = true
  script.innerHTML = JSON.stringify({
    "symbol": props.symbol,
    "width": "100%",
    "height": "100%",
    "locale": "en",
    "dateRange": "12M",
    "colorTheme": props.theme,
    "isTransparent": true,
    "autosize": true,
    "largeChartUrl": ""
  })
  
  containerRef.value.appendChild(script)
  
  // Apply the sandbox restriction to the new iframe
  applySandbox()
}

onMounted(() => {
  renderWidget()
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
  if (safetyTimeout) clearTimeout(safetyTimeout)
})

watch(() => props.symbol, () => {
  renderWidget()
})
</script>
