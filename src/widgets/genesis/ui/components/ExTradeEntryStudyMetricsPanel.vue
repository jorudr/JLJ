<script setup>
import { inject } from 'vue'
import { useI18n } from '~/shared/i18n/useI18n'
import ExPanel from '~/shared/ui/ExPanel.vue'

const { locale } = useI18n()

const {
  showTradeStudyMetrics,
  tradeStudyMetrics,
  resetTradeStudyMetrics,
  commitState
} = inject('tradeState')

const copy = {
  en: {
    title: 'TRADE_STUDY_METRICS',
    subtitle: 'Manual post-trade dataset',
    reset: 'RESET',
    boolOn: 'YES',
    boolOff: 'NO',
    directionUp: 'ROSE',
    directionDown: 'FELL',
    groups: {
      pricePath: 'PRICE_PATH',
      news: 'NEWS_CONTEXT'
    },
    fields: {
      maxPriceDuringTrade: 'Max price during trade',
      minPriceDuringTrade: 'Min price during trade',
      priceDroppedBelowEntryLong: 'Price dropped below entry point for long vector',
      priceRoseAboveEntryShort: 'Price rose above entry point for short vector',
      hadNews: 'News during trade',
      priceDirectionBeforeNews: 'Price direction before the news',
      priceDirectionAfterNews: 'Price direction after the news'
    },
    placeholders: {
      maxPriceDuringTrade: 'ex. 4312.50',
      minPriceDuringTrade: 'ex. 4268.25'
    }
  },
  ru: {
    title: 'МЕТРИКИ_ИЗУЧЕНИЯ_СДЕЛКИ',
    subtitle: 'Ручной набор данных после сделки',
    reset: 'СБРОС',
    boolOn: 'ДА',
    boolOff: 'НЕТ',
    directionUp: 'ВЫРОСЛА',
    directionDown: 'УПАЛА',
    groups: {
      pricePath: 'ПУТЬ_ЦЕНЫ',
      news: 'НОВОСТИ_И_КОНТЕКСТ'
    },
    fields: {
      maxPriceDuringTrade: 'Макс. цена во время сделки',
      minPriceDuringTrade: 'Мин. цена во время сделки',
      priceDroppedBelowEntryLong: 'Цена упала ниже точки входа для вектора long',
      priceRoseAboveEntryShort: 'Цена выросла выше точки входа для вектора short',
      hadNews: 'Были новости',
      priceDirectionBeforeNews: 'Цена перед новостью',
      priceDirectionAfterNews: 'Цена после новости'
    },
    placeholders: {
      maxPriceDuringTrade: 'напр. 4312.50',
      minPriceDuringTrade: 'напр. 4268.25'
    }
  }
}

const ui = () => copy[locale.value] || copy.en

const groups = [
  {
    id: 'pricePath',
    fields: [
      { key: 'maxPriceDuringTrade', type: 'number' },
      { key: 'minPriceDuringTrade', type: 'number' },
      { key: 'priceDroppedBelowEntryLong', type: 'boolean' },
      { key: 'priceRoseAboveEntryShort', type: 'boolean' }
    ]
  },
  {
    id: 'news',
    fields: [
      { key: 'hadNews', type: 'boolean' },
      { key: 'priceDirectionBeforeNews', type: 'direction' },
      { key: 'priceDirectionAfterNews', type: 'direction' }
    ]
  }
]

const splitFields = (fields) => {
  const midpoint = Math.ceil(fields.length / 2)
  return [fields.slice(0, midpoint), fields.slice(midpoint)]
}

const toggleDirection = (key, value) => {
  tradeStudyMetrics.value[key] = tradeStudyMetrics.value[key] === value ? '' : value
}
</script>

<template>
  <Teleport to="body">
    <Transition name="nier-fade">
      <div
        v-if="showTradeStudyMetrics"
        class="fixed inset-0 z-[10006] flex items-center justify-center bg-black/20 p-6 backdrop-blur-md"
        @click.self="showTradeStudyMetrics = false"
      >
        <ExPanel
          variant="light"
          :show-corners="true"
          :no-padding="true"
          :no-shadow="true"
          class="max-h-[84vh] w-full max-w-6xl !border-black/20 dark:!border-white/20"
        >
          <div class="flex items-center justify-between border-b border-black/10 bg-white/10 px-6 py-4 dark:border-white/10 dark:bg-black/20">
            <div class="flex min-w-0 flex-col gap-1">
              <span class="text-[10px] font-black uppercase tracking-[0.5em] nier-text-primary">{{ ui().title }}</span>
              <span class="text-[8px] font-mono uppercase tracking-[0.28em] text-black/40 dark:text-white/35">{{ ui().subtitle }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="border border-black/15 px-4 py-2 text-[8px] font-black uppercase tracking-[0.35em] nier-text-primary transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:hover:bg-white dark:hover:text-black"
                :disabled="commitState === 'loading'"
                @click="resetTradeStudyMetrics"
              >
                {{ ui().reset }}
              </button>
            </div>
          </div>

          <div class="max-h-[calc(84vh-72px)] overflow-y-auto custom-scrollbar p-7">
            <div class="grid grid-cols-1 gap-6">
              <section
                v-for="group in groups"
                :key="group.id"
                class="border border-black/10 bg-white/[0.03] p-5 dark:border-white/10 dark:bg-black/[0.08]"
              >
                <div class="mb-5 flex items-center gap-3">
                  <div class="h-1.5 w-1.5 rotate-45 nier-bg-inverted"></div>
                  <span class="text-[8px] font-black uppercase tracking-[0.42em] nier-text-primary">{{ ui().groups[group.id] }}</span>
                </div>

                <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <div
                    v-for="(fieldColumn, columnIndex) in splitFields(group.fields)"
                    :key="`${group.id}-${columnIndex}`"
                    class="flex min-w-0 flex-col gap-4 border-black/10 dark:border-white/10"
                    :class="columnIndex === 1 ? 'lg:border-l lg:pl-5' : ''"
                  >
                    <label
                      v-for="field in fieldColumn"
                      :key="field.key"
                      class="flex min-w-0 flex-col gap-2"
                    >
                      <span class="min-h-[20px] text-[8px] font-bold uppercase leading-relaxed tracking-[0.18em] text-black/50 dark:text-white/40">{{ ui().fields[field.key] }}</span>

                      <button
                        v-if="field.type === 'boolean'"
                        type="button"
                        class="flex h-14 items-center justify-between border border-black/15 bg-transparent px-4 text-[11px] font-mono font-black uppercase tracking-[0.25em] nier-text-primary transition-colors hover:border-black/40 dark:border-white/15 dark:hover:border-white/40"
                        @click="tradeStudyMetrics[field.key] = !tradeStudyMetrics[field.key]"
                      >
                        <span>{{ tradeStudyMetrics[field.key] ? ui().boolOn : ui().boolOff }}</span>
                        <span class="grid h-4 w-4 place-items-center border border-black/30 dark:border-white/35">
                          <span v-if="tradeStudyMetrics[field.key]" class="h-2 w-1 rotate-45 border-b-2 border-r-2 border-current"></span>
                        </span>
                      </button>

                      <div v-else-if="field.type === 'direction'" class="grid grid-cols-2 gap-2">
                        <button
                          v-for="option in ['up', 'down']"
                          :key="`${field.key}-${option}`"
                          type="button"
                          class="flex h-14 items-center justify-center border px-3 text-[10px] font-mono font-black uppercase tracking-[0.2em] transition-colors"
                          :class="tradeStudyMetrics[field.key] === option
                            ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                            : 'border-black/15 bg-transparent nier-text-primary hover:border-black/40 dark:border-white/15 dark:hover:border-white/40'"
                          @click="toggleDirection(field.key, option)"
                        >
                          {{ option === 'up' ? ui().directionUp : ui().directionDown }}
                        </button>
                      </div>

                      <input
                        v-else
                        v-model="tradeStudyMetrics[field.key]"
                        type="number"
                        step="any"
                        :placeholder="ui().placeholders[field.key]"
                        class="h-14 min-w-0 border border-black/15 bg-transparent px-4 text-[13px] font-mono outline-none transition-colors placeholder:text-[10px] placeholder:tracking-[0.16em] placeholder:text-black/25 focus:border-black dark:border-white/15 dark:placeholder:text-white/20 dark:focus:border-white"
                      />
                    </label>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </ExPanel>
      </div>
    </Transition>
  </Teleport>
</template>
