<template>
  <aside
    class="genesis-node-details absolute right-8 top-1/2 z-[90] max-h-[calc(100vh-4rem)] w-[360px] -translate-y-1/2 border border-black/20 bg-white text-black shadow-[0_24px_70px_rgba(0,0,0,0.18)] pointer-events-auto dark:border-white/20 dark:bg-[#090909] dark:text-white"
    @pointerdown.stop
    @pointermove.stop
    @click.stop
  >
    <button
      class="absolute -left-6 top-1/2 z-[100] flex h-40 w-6 -translate-y-1/2 cursor-pointer items-center justify-center border-l border-t border-b border-black/20 bg-white transition-colors hover:bg-[#f2f2f2] group/close-tab dark:border-white/20 dark:bg-[#070707] dark:hover:bg-[#111]"
      type="button"
      @click="$emit('close')"
    >
      <div class="h-16 w-px bg-black/10 transition-all duration-300 group-hover/close-tab:bg-black/40 dark:bg-white/10 dark:group-hover/close-tab:bg-white/40"></div>
      <span class="absolute -rotate-90 whitespace-nowrap font-mono text-[7px] font-black uppercase tracking-[0.4em] text-black/20 transition-colors group-hover/close-tab:text-black/45 dark:text-white/20 dark:group-hover/close-tab:text-white/45">
        {{ t('genesis.tree.details.close') }}
      </span>
    </button>

    <div class="max-h-[calc(100vh-4rem)] overflow-y-auto p-5">
      <header class="border-b border-black/15 pb-4 dark:border-white/15">
        <p class="font-mono text-[10px] font-black uppercase leading-none tracking-[0.18em] text-black/70 dark:text-white/72">
          {{ typeLabel }}
        </p>
        <h3 class="mt-3 font-mono text-[18px] font-black uppercase leading-[1.15] tracking-[0.02em] text-black dark:text-white">
          {{ title }}
        </h3>
      </header>

      <section class="mt-5 grid grid-cols-2 gap-3">
        <div
          v-for="metric in metrics"
          :key="metric.key"
          class="min-w-0 border border-black/12 bg-black/[0.025] p-3 dark:border-white/14 dark:bg-white/[0.035]"
        >
          <p class="font-mono text-[10px] font-black uppercase leading-none tracking-[0.08em] text-black/78 dark:text-white/78">
            {{ metric.label }}
          </p>
          <p
            class="mt-2 max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono font-black leading-none"
            :class="[metric.valueClass, metric.sizeClass]"
            :title="metric.value"
          >
            {{ metric.value }}
          </p>
        </div>
      </section>

      <section class="mt-5 border-t border-black/15 pt-4 dark:border-white/15">
        <h4 class="font-mono text-[10px] font-black uppercase leading-none tracking-[0.12em] text-black/78 dark:text-white/78">
          {{ t('genesis.tree.details.recentTrades') }}
        </h4>

        <div class="mt-3 flex max-h-[124px] flex-col gap-2 overflow-y-auto overscroll-contain pb-1 pr-1 [scrollbar-gutter:stable]">
          <button
            v-for="trade in recentTrades"
            :key="trade.id || `${trade.asset}-${trade.date}-${trade.pnl}`"
            class="flex shrink-0 items-center justify-between gap-3 border border-black/12 bg-black/[0.015] px-3 py-2 text-left transition-colors hover:border-black/32 hover:bg-black/[0.035] disabled:cursor-default dark:border-white/14 dark:bg-white/[0.025] dark:hover:border-white/32 dark:hover:bg-white/[0.05]"
            :disabled="!trade.id"
            type="button"
            @click="$emit('openTradeArchive', trade)"
          >
            <span class="min-w-0">
              <span class="block truncate font-mono text-[11px] font-black uppercase leading-tight tracking-[0.04em] text-black dark:text-white">
                {{ trade.asset || 'N/A' }}
              </span>
              <span class="mt-1 block truncate font-mono text-[9px] font-bold uppercase leading-none tracking-[0.08em] text-black/62 dark:text-white/62">
                {{ trade.date || '—' }}
              </span>
            </span>
            <span class="shrink-0 font-mono text-[11px] font-black leading-none" :class="tradePnlClass(trade)">
              {{ trade.pnlLabel || '$0.00' }}
            </span>
          </button>

          <div
            v-if="recentTrades.length === 0"
            class="shrink-0 border border-black/12 px-3 py-4 text-center font-mono text-[10px] font-black uppercase tracking-[0.12em] text-black/45 dark:border-white/14 dark:text-white/48"
          >
            {{ t('genesis.tree.details.noTrades') }}
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '~/shared/i18n/useI18n'

const props = defineProps<{
  node: any
  title: string
  typeLabel: string
}>()

defineEmits<{
  close: []
  openTradeArchive: [trade: { id?: string, strategyId?: string } | null | undefined]
}>()

const { t } = useI18n()

const recentTrades = computed(() => props.node?.recentTrades || [])

const metrics = computed(() => [
  {
    key: 'trades',
    label: t('genesis.tree.details.trades'),
    value: props.node?.tradeCountLabel || '0',
    valueClass: 'text-black dark:text-white',
    sizeClass: 'text-[21px]'
  },
  {
    key: 'winrate',
    label: t('genesis.tree.details.winrate'),
    value: props.node?.winrateLabel || '0%',
    valueClass: props.node?.winrateColorClass || 'text-rose-500 dark:text-rose-400',
    sizeClass: 'text-[21px]'
  },
  {
    key: 'pf',
    label: t('genesis.tree.details.pf'),
    value: props.node?.profitFactorRatioLabel || '0.00',
    valueClass: props.node?.profitFactorRatioColorClass || 'text-amber-500 dark:text-amber-400',
    sizeClass: 'text-[21px]'
  },
  {
    key: 'netPnl',
    label: t('genesis.tree.details.netPnl'),
    value: props.node?.netPnlLabel || '$0.00',
    valueClass: Number(props.node?.netPnlValue || 0) >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400',
    sizeClass: netPnlSizeClass(props.node?.netPnlLabel)
  }
])

const tradePnlClass = (trade: any) => {
  const pnl = Number(trade?.pnl || 0)
  if (pnl > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (pnl < 0) return 'text-rose-600 dark:text-rose-400'
  return 'text-black/60 dark:text-white/60'
}

const netPnlSizeClass = (label: string | undefined) => {
  const length = (label || '$0.00').length
  if (length >= 18) return 'text-[11px]'
  if (length >= 15) return 'text-[12px]'
  if (length >= 12) return 'text-[14px]'
  if (length >= 10) return 'text-[16px]'
  return 'text-[21px]'
}
</script>

<style scoped>
.genesis-node-details {
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
  transform: translateY(-50%) translateZ(0);
}
</style>
