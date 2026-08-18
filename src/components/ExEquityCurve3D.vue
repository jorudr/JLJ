<template>
  <section ref="container" class="equity-demo" aria-label="Interactive equity curve demonstration">
    <canvas
      ref="canvas"
      class="equity-demo__canvas"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerLeave"
      @wheel="onWheel"
    />

    <Transition name="equity-fade">
      <div v-if="booting" class="equity-demo__boot">
        <div class="equity-demo__boot-rule"></div>
        <span>ESTABLISHING_NEURAL_LINK</span>
        <div class="equity-demo__progress"><i :style="{ width: `${bootProgress}%` }"></i></div>
        <small>SYSTEM_CODE: 0x44_REIFY&nbsp;&nbsp; / &nbsp;&nbsp;MATRIX_STABILITY: {{ Math.round(bootProgress) }}%</small>
      </div>
    </Transition>

    <div class="equity-demo__hud">
      <button class="equity-demo__strategy" type="button" @click="strategyMenu = !strategyMenu">
        <b></b><span>MAIN DIARY</span><i :class="{ open: strategyMenu }"></i>
      </button>
      <div v-if="strategyMenu" class="equity-demo__strategy-menu">MAIN DIARY <em>{{ sortedTrades.length }} TRADES</em></div>
      <div class="equity-demo__rule"></div>
      <strong>{{ formattedBalance }}</strong>
      <small>REIFIED_BALANCE_SNAPSHOT</small>
    </div>

    <div v-if="hoveredTrade" class="equity-demo__trade-tip" :style="tooltipStyle">
      <span>TRADE_{{ String(hoveredTrade.index + 1).padStart(2, '0') }} / {{ hoveredTrade.trade.asset }}</span>
      <b :class="hoveredTrade.pnl >= 0 ? 'positive' : 'negative'">{{ signedCurrency(hoveredTrade.pnl) }}</b>
      <small>{{ hoveredTrade.trade.side.toUpperCase() }} · {{ shortDate(hoveredTrade.trade.date) }}</small>
    </div>

    <div v-if="metricsOpen" class="equity-demo__metrics">
      <header><span>STRATEGY_METRICS</span><b>30 TRADES</b></header>
      <div class="equity-demo__metric-grid">
        <div><small>NET PROFIT</small><strong :class="metrics.netProfit >= 0 ? 'positive' : 'negative'">{{ signedCurrency(metrics.netProfit) }}</strong></div>
        <div><small>WIN RATE</small><strong>{{ metrics.winRate.toFixed(1) }}%</strong></div>
        <div><small>PROFIT FACTOR</small><strong>{{ metrics.profitFactor.toFixed(2) }}</strong></div>
        <div><small>EXPECTED VALUE</small><strong>{{ signedCurrency(metrics.expectedValue) }}</strong></div>
        <div><small>AVERAGE WIN</small><strong class="positive">{{ signedCurrency(metrics.avgWin) }}</strong></div>
        <div><small>AVERAGE LOSS</small><strong class="negative">{{ signedCurrency(metrics.avgLoss) }}</strong></div>
        <div><small>GROSS PROFIT</small><strong>{{ signedCurrency(metrics.grossProfit) }}</strong></div>
        <div><small>MAX DRAWDOWN</small><strong class="negative">{{ metrics.maxDrawdown.toFixed(2) }}%</strong></div>
      </div>
    </div>

    <div v-if="calendarOpen" class="equity-demo__calendar">
      <header>{{ calendarTitle }}</header>
      <div class="equity-demo__week"><span v-for="day in weekDays" :key="day">{{ day }}</span></div>
      <div class="equity-demo__days">
        <div v-for="(day, index) in calendarDays" :key="index" :class="day.className">
          <small v-if="day.inMonth">{{ day.number }}</small>
          <template v-if="day.trades">
            <b>{{ day.pnl >= 0 ? '+' : '' }}{{ day.pnl.toFixed(0) }}</b><em>{{ day.trades }} TRADES</em>
          </template>
        </div>
      </div>
      <footer><button type="button" :disabled="monthIndex === 0" @click="changeMonth(-1)">‹</button><span>{{ calendarValueMode === 'currency' ? '$' : '%' }}</span><button type="button" :disabled="monthIndex === months.length - 1" @click="changeMonth(1)">›</button></footer>
    </div>

    <div v-if="menuOpen" class="equity-demo__menu">
      <span>CURVE_DISPLAY</span><button type="button" @click="autoRotate = !autoRotate">{{ autoRotate ? 'AUTO_ROTATE: ON' : 'AUTO_ROTATE: OFF' }}</button><button type="button" @click="resetView">RESET_VIEW</button>
    </div>

    <div class="equity-demo__bottom-panel">
      <button type="button" class="primary" title="NEW_TRADE"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></button>
      <button type="button" title="STRATEGY_METRICS" :class="{ active: metricsOpen }" @click="metricsOpen = !metricsOpen; calendarOpen = false"><svg v-if="metricsOpen" viewBox="0 0 24 24"><path d="M3 12h18M12 3l9 9-9 9" /></svg><svg v-else viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /></svg></button>
      <button type="button" title="CENTER_CURVE" @click="resetView"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /><circle cx="12" cy="12" r="1" fill="currentColor" /></svg></button>
      <button v-if="!metricsOpen" type="button" title="SELECT_SYSTEM_TARGET"><svg viewBox="0 0 24 24"><path d="M5 21V4M5 4c4-3 7 3 14 0v9c-7-3-10-3-14 0" /></svg></button>
      <button type="button" title="VIEW_CALENDAR_MODE" :class="{ active: calendarOpen }" @click="calendarOpen = !calendarOpen; metricsOpen = false"><svg v-if="calendarOpen" viewBox="0 0 24 24"><path d="M3 12h18M12 3l9 9-9 9" /></svg><svg v-else viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg></button>
      <button type="button" title="MENU" :class="{ active: menuOpen }" @click="menuOpen = !menuOpen"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  trades: { type: Array, default: () => [] },
  initialBalance: { type: Number, default: 10000 },
})

const container = ref(null)
const canvas = ref(null)
const booting = ref(true)
const bootProgress = ref(0)
const reveal = ref(0)
const strategyMenu = ref(false)
const metricsOpen = ref(false)
const calendarOpen = ref(false)
const menuOpen = ref(false)
const autoRotate = ref(false)
const monthIndex = ref(0)
const calendarValueMode = ref('currency')
const hoveredTrade = ref(null)
const tooltipStyle = ref({ left: '0px', top: '0px' })
const targetRotation = ref({ x: 0, y: 0 })
const rotation = ref({ x: 0, y: 0 })
const zoom = ref(2.2)
const dragging = ref(false)
const lastPointer = ref({ x: 0, y: 0 })

const sortedTrades = computed(() => [...props.trades].sort((a, b) => new Date(a.date) - new Date(b.date)))
const pnl = (trade) => Number(trade.profitInCurrency ?? trade.pnl ?? trade.result ?? 0)
const balances = computed(() => {
  const values = [props.initialBalance]
  sortedTrades.value.forEach((trade) => values.push(values[values.length - 1] + pnl(trade)))
  return values
})
const netProfit = computed(() => balances.value[balances.value.length - 1] - props.initialBalance)
const revealedBalance = computed(() => props.initialBalance + netProfit.value * reveal.value)
const formattedBalance = computed(() => revealedBalance.value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }))
const metrics = computed(() => {
  const values = sortedTrades.value.map(pnl)
  const wins = values.filter((value) => value > 0)
  const losses = values.filter((value) => value < 0)
  const grossProfit = wins.reduce((sum, value) => sum + value, 0)
  const grossLoss = Math.abs(losses.reduce((sum, value) => sum + value, 0))
  let peak = props.initialBalance
  let balance = props.initialBalance
  let maxDrawdown = 0
  values.forEach((value) => { balance += value; peak = Math.max(peak, balance); maxDrawdown = Math.max(maxDrawdown, peak ? (peak - balance) / peak * 100 : 0) })
  return { netProfit: netProfit.value, winRate: values.length ? wins.length / values.length * 100 : 0, profitFactor: grossLoss ? grossProfit / grossLoss : 0, expectedValue: values.length ? (grossProfit - grossLoss) / values.length : 0, avgWin: wins.length ? grossProfit / wins.length : 0, avgLoss: losses.length ? -grossLoss / losses.length : 0, grossProfit, maxDrawdown }
})

const months = computed(() => Array.from(new Set(sortedTrades.value.map((trade) => String(trade.date).slice(0, 7)))).sort())
const activeMonth = computed(() => months.value[monthIndex.value] || '2026-01')
const calendarTitle = computed(() => new Date(`${activeMonth.value}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase())
const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const calendarDays = computed(() => {
  const [year, month] = activeMonth.value.split('-').map(Number)
  const first = new Date(Date.UTC(year, month - 1, 1))
  const offset = (first.getUTCDay() + 6) % 7
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const daily = new Map()
  sortedTrades.value.forEach((trade) => { const date = new Date(trade.date); if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1) { const day = date.getUTCDate(); const item = daily.get(day) || { pnl: 0, trades: 0 }; item.pnl += pnl(trade); item.trades += 1; daily.set(day, item) } })
  const days = Array.from({ length: offset }, () => ({ inMonth: false, className: 'empty' }))
  for (let number = 1; number <= count; number += 1) { const item = daily.get(number); days.push({ inMonth: true, number, pnl: item?.pnl || 0, trades: item?.trades || 0, className: item ? (item.pnl >= 0 ? 'win' : 'loss') : 'plain' }) }
  return days
})

function formatCurrency(value) { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function signedCurrency(value) { return `${Number(value) >= 0 ? '+' : '−'}${formatCurrency(Math.abs(Number(value) || 0))}` }
function shortDate(value) { return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase() }
function stableDepth(index) { return ((index * 73) % 11 - 5) * 8 }
function rotate(point) { const cy = Math.cos(rotation.value.y); const sy = Math.sin(rotation.value.y); const cx = Math.cos(rotation.value.x); const sx = Math.sin(rotation.value.x); const y = point.y * cx - (point.z * cy - point.x * sy) * sx; const z = point.y * sx + (point.z * cy - point.x * sy) * cx; return { x: point.x * cy + point.z * sy, y, z } }
function project(point, width, height) { const rotated = rotate(point); const perspective = 1000 / (1000 + Math.max(-999, rotated.z)); return { x: rotated.x * perspective * zoom.value + width / 2, y: rotated.y * perspective * zoom.value + height / 2 } }
function drawLine(ctx, points, color, width, dashed = false, alpha = 1) { if (points.length < 2) return; ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; if (dashed) ctx.setLineDash([4, 4]); ctx.beginPath(); points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)); ctx.stroke(); ctx.restore() }
function render() {
  const element = canvas.value; if (!element) return
  const rect = element.getBoundingClientRect(); const ctx = element.getContext('2d'); if (!ctx || !rect.width) return
  const ratio = Math.min(window.devicePixelRatio || 1, 2); if (element.width !== Math.floor(rect.width * ratio)) { element.width = Math.floor(rect.width * ratio); element.height = Math.floor(rect.height * ratio) }
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, rect.width, rect.height)
  if (!booting.value) reveal.value = Math.min(1, reveal.value + 0.012)
  if (autoRotate.value && !dragging.value) targetRotation.value.y += 0.0018
  rotation.value.x += (targetRotation.value.x - rotation.value.x) * 0.08; rotation.value.y += (targetRotation.value.y - rotation.value.y) * 0.08
  const grid = []
  for (let index = -5; index <= 5; index += 1) grid.push([project({ x: -200, y: 100, z: index * 40 }, rect.width, rect.height), project({ x: 200, y: 100, z: index * 40 }, rect.width, rect.height)])
  grid.forEach((line) => drawLine(ctx, line, 'rgba(255,255,255,.12)', .5, false, .75))
  drawLine(ctx, [project({ x: -200, y: 105, z: 0 }, rect.width, rect.height), project({ x: 200, y: 105, z: 0 }, rect.width, rect.height)], 'rgba(255,255,255,.55)', 1, false, .55)
  const values = balances.value; const min = Math.min(...values); const range = Math.max(1, Math.max(...values) - min); const step = 400 / Math.max(1, sortedTrades.value.length); const visible = Math.max(1, Math.floor((values.length - 1) * reveal.value) + 1)
  const points = values.slice(0, visible).map((value, index) => project({ x: -200 + index * step, y: 95 - (value - min) * 135 / range, z: index ? stableDepth(index) : 0 }, rect.width, rect.height))
  ctx.save(); ctx.shadowColor = '#f5f5f0'; ctx.shadowBlur = 18; drawLine(ctx, points, '#f5f5f0', 3); ctx.restore()
  points.slice(1).forEach((point, index) => { ctx.save(); ctx.fillStyle = hoveredTrade.value?.index === index ? '#63e6be' : (pnl(sortedTrades.value[index]) >= 0 ? '#f5f5f0' : '#8a929d'); ctx.beginPath(); ctx.arc(point.x, point.y, hoveredTrade.value?.index === index ? 5 : 2.5, 0, Math.PI * 2); ctx.fill(); ctx.restore() })
  ctx.fillStyle = 'rgba(245,245,240,.42)'; ctx.font = '9px monospace'; if (points[0]) ctx.fillText('DEPOSIT', points[0].x - 24, points[0].y + 34); if (points[points.length - 1]) ctx.fillText(sortedTrades.value[sortedTrades.value.length - 1]?.date ? shortDate(sortedTrades.value[sortedTrades.value.length - 1].date) : '', points[points.length - 1].x - 18, points[points.length - 1].y + 34)
}
function position(event) { const rect = canvas.value.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top } }
function hitTest(point) { const rect = canvas.value.getBoundingClientRect(); const values = balances.value; const min = Math.min(...values); const range = Math.max(1, Math.max(...values) - min); const step = 400 / Math.max(1, sortedTrades.value.length); let nearest = null; sortedTrades.value.forEach((trade, index) => { const screen = project({ x: -200 + (index + 1) * step, y: 95 - (values[index + 1] - min) * 135 / range, z: stableDepth(index + 1) }, rect.width, rect.height); const distance = Math.hypot(point.x - screen.x, point.y - screen.y); if (distance < 18 && (!nearest || distance < nearest.distance)) nearest = { index, distance } }); return nearest ? { index: nearest.index, trade: sortedTrades.value[nearest.index], pnl: pnl(sortedTrades.value[nearest.index]) } : null }
function onPointerDown(event) { dragging.value = true; lastPointer.value = { x: event.clientX, y: event.clientY }; canvas.value?.setPointerCapture?.(event.pointerId) }
function onPointerMove(event) { const point = position(event); if (dragging.value) { targetRotation.value.y += (event.clientX - lastPointer.value.x) * .008; targetRotation.value.x = Math.max(-1.2, Math.min(1.2, targetRotation.value.x + (event.clientY - lastPointer.value.y) * .006)); lastPointer.value = { x: event.clientX, y: event.clientY }; hoveredTrade.value = null } else { hoveredTrade.value = hitTest(point); if (hoveredTrade.value) tooltipStyle.value = { left: `${Math.min(point.x + 18, canvas.value.clientWidth - 190)}px`, top: `${Math.max(80, point.y - 12)}px` } } }
function onPointerUp() { dragging.value = false }
function onPointerLeave() { dragging.value = false; hoveredTrade.value = null }
function onWheel(event) { event.preventDefault(); zoom.value = Math.max(1.35, Math.min(3.2, zoom.value - event.deltaY * .001)) }
function resetView() { targetRotation.value = { x: 0, y: 0 }; zoom.value = 2.2 }
function changeMonth(delta) { monthIndex.value = Math.max(0, Math.min(months.value.length - 1, monthIndex.value + delta)) }

let frame; let bootTimer; let observer
onMounted(() => { observer = new ResizeObserver(render); if (container.value) observer.observe(container.value); const start = performance.now(); const tick = (now) => { bootProgress.value = Math.min(100, (now - start) / 900 * 100); if (bootProgress.value < 100) bootTimer = requestAnimationFrame(tick); else { booting.value = false; reveal.value = 0 } }; bootTimer = requestAnimationFrame(tick); const loop = () => { render(); frame = requestAnimationFrame(loop) }; loop() })
onUnmounted(() => { cancelAnimationFrame(frame); cancelAnimationFrame(bootTimer); observer?.disconnect() })
</script>

<style scoped>
.equity-demo { position: relative; width: 100%; height: min(76vh, 720px); min-height: 590px; overflow: hidden; background: #000; color: #f5f5f0; font-family: 'Cormorant Garamond', serif; }
.equity-demo__canvas { position: absolute; inset: 0; width: 100%; height: 100%; cursor: grab; touch-action: none; }
.equity-demo__canvas:active { cursor: grabbing; }
.equity-demo__hud { position: absolute; top: 74px; left: 48px; z-index: 10; pointer-events: none; }
.equity-demo__strategy { display: flex; align-items: center; gap: 12px; padding: 0; color: #f5f5f0; background: none; border: 0; cursor: pointer; pointer-events: auto; font: 900 10px/1 monospace; letter-spacing: .5em; opacity: .72; }
.equity-demo__strategy b { width: 6px; height: 6px; background: #f5f5f0; transform: rotate(45deg); animation: equity-pulse 1.8s infinite; }
.equity-demo__strategy i { width: 8px; height: 8px; border-right: 1px solid #fff; border-bottom: 1px solid #fff; transform: rotate(45deg); transition: .25s; }
.equity-demo__strategy i.open { transform: rotate(225deg) translate(-2px, -2px); }
.equity-demo__strategy-menu { position: absolute; top: 28px; left: 0; width: 220px; padding: 14px 18px; border: 1px solid rgba(255,255,255,.2); color: #fff; background: #0a0a0a; font: 10px monospace; letter-spacing: .18em; }
.equity-demo__strategy-menu em { display: block; margin-top: 8px; color: rgba(255,255,255,.4); font-size: 8px; font-style: normal; }
.equity-demo__rule { width: 190px; height: 1px; margin: 28px 0 18px; background: rgba(255,255,255,.12); }
.equity-demo__hud strong { display: block; font: 700 clamp(32px, 5vw, 60px)/1 monospace; letter-spacing: -.08em; }
.equity-demo__hud small { display: block; margin-top: 10px; color: rgba(255,255,255,.3); font: 8px monospace; letter-spacing: .35em; }
.equity-demo__bottom-panel { position: absolute; bottom: 42px; left: 50%; z-index: 20; display: flex; gap: 6px; padding: 6px; transform: translateX(-50%); border: 1px solid rgba(255,255,255,.2); background: rgba(10,10,10,.9); box-shadow: 0 25px 50px rgba(0,0,0,.3); backdrop-filter: blur(20px); }
.equity-demo__bottom-panel button { display: grid; width: 40px; height: 40px; place-items: center; color: rgba(255,255,255,.62); background: transparent; border: 1px solid transparent; cursor: pointer; transition: .25s; }
.equity-demo__bottom-panel button:hover, .equity-demo__bottom-panel button.active { color: #fff; border-color: rgba(255,255,255,.25); background: rgba(255,255,255,.08); }
.equity-demo__bottom-panel button.primary { color: #000; background: #fff; border-color: #fff; }
.equity-demo__bottom-panel svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.5; }
.equity-demo__boot { position: absolute; inset: 0; z-index: 30; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 22px; background: #0a0a0a; font: 900 10px monospace; letter-spacing: .8em; }
.equity-demo__boot-rule { width: 64px; height: 1px; background: #f5f5f0; opacity: .2; }
.equity-demo__progress { position: relative; width: 256px; height: 1px; background: rgba(255,255,255,.12); overflow: hidden; }
.equity-demo__progress i { display: block; height: 100%; background: #f5f5f0; transition: width .2s; }
.equity-demo__boot small { color: rgba(255,255,255,.35); font: 7px monospace; letter-spacing: .2em; }
.equity-demo__trade-tip { position: absolute; z-index: 25; width: 180px; padding: 12px; border: 1px solid rgba(255,255,255,.2); background: rgba(10,10,10,.94); box-shadow: 0 12px 30px rgba(0,0,0,.4); pointer-events: none; font-family: monospace; }
.equity-demo__trade-tip span, .equity-demo__trade-tip small { display: block; color: rgba(255,255,255,.5); font-size: 8px; letter-spacing: .08em; }
.equity-demo__trade-tip b { display: block; margin: 7px 0; font-size: 16px; }
.positive { color: #63e6be !important; }.negative { color: #ff6b7a !important; }
.equity-demo__metrics, .equity-demo__calendar { position: absolute; inset: 0; z-index: 12; padding: 80px 48px 140px; background: #000; font-family: monospace; }
.equity-demo__metrics header { display: flex; justify-content: space-between; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,.18); font-size: 11px; letter-spacing: .3em; }
.equity-demo__metrics header b { color: rgba(255,255,255,.4); font-size: 9px; font-weight: 400; }
.equity-demo__metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; margin-top: 38px; border: 1px solid rgba(255,255,255,.1); }
.equity-demo__metric-grid div { min-height: 110px; padding: 20px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.025); }
.equity-demo__metric-grid small { display: block; color: rgba(255,255,255,.42); font-size: 8px; letter-spacing: .18em; }.equity-demo__metric-grid strong { display: block; margin-top: 18px; font-size: 20px; font-weight: 400; }
.equity-demo__calendar { max-width: 920px; margin: auto; padding-top: 84px; }
.equity-demo__calendar > header { padding-bottom: 22px; border-bottom: 1px solid rgba(255,255,255,.2); text-align: center; font-size: 25px; font-weight: 900; letter-spacing: .2em; }
.equity-demo__week, .equity-demo__days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; }.equity-demo__week { margin: 28px 0 12px; color: rgba(255,255,255,.45); text-align: center; font-size: 9px; letter-spacing: .15em; }.equity-demo__days > div { position: relative; min-height: 82px; padding: 10px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.025); }.equity-demo__days > div.empty { border-color: transparent; background: transparent; }.equity-demo__days > div.win { border-color: rgba(255,255,255,.25); background: rgba(255,255,255,.08); }.equity-demo__days > div.loss { border-color: rgba(255,80,100,.35); background: rgba(255,50,80,.1); }.equity-demo__days small { color: rgba(255,255,255,.45); font-size: 9px; }.equity-demo__days b { display: block; margin-top: 22px; font-size: 13px; font-weight: 400; }.equity-demo__days em { display: block; margin-top: 3px; color: rgba(255,255,255,.4); font-size: 7px; font-style: normal; }.equity-demo__calendar footer { display: flex; justify-content: center; gap: 12px; margin-top: 26px; }.equity-demo__calendar footer button, .equity-demo__calendar footer span { display: grid; width: 30px; height: 30px; place-items: center; color: #fff; background: transparent; border: 1px solid rgba(255,255,255,.2); }.equity-demo__calendar footer button:disabled { opacity: .2; }
.equity-demo__menu { position: absolute; right: 48px; bottom: 105px; z-index: 22; display: flex; flex-direction: column; gap: 8px; width: 190px; padding: 14px; border: 1px solid rgba(255,255,255,.2); background: #0a0a0a; font: 9px monospace; letter-spacing: .1em; }.equity-demo__menu span { color: rgba(255,255,255,.4); }.equity-demo__menu button { padding: 8px; color: #fff; background: transparent; border: 1px solid rgba(255,255,255,.15); font: inherit; text-align: left; cursor: pointer; }
@keyframes equity-pulse { 50% { opacity: .3; transform: rotate(45deg) scale(.65); } }
@media (max-width: 700px) { .equity-demo { height: 720px; min-height: 620px; }.equity-demo__hud { top: 34px; left: 22px; }.equity-demo__metrics, .equity-demo__calendar { padding: 40px 18px 120px; }.equity-demo__metric-grid { grid-template-columns: repeat(2, 1fr); margin-top: 24px; }.equity-demo__metric-grid div { min-height: 92px; padding: 13px; }.equity-demo__metric-grid strong { margin-top: 12px; font-size: 15px; }.equity-demo__week, .equity-demo__days { gap: 4px; }.equity-demo__days > div { min-height: 60px; padding: 5px; }.equity-demo__days b { margin-top: 13px; font-size: 10px; }.equity-demo__days em { font-size: 5px; }.equity-demo__bottom-panel { bottom: 24px; }.equity-demo__bottom-panel button { width: 36px; height: 36px; }.equity-demo__menu { right: 18px; bottom: 82px; } }
</style>
