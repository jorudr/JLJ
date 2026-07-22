<script setup>
import { computed, inject, watch } from 'vue'
import { useI18n } from '~/shared/i18n/useI18n'
import ExPanel from '~/shared/ui/ExPanel.vue'

const { locale } = useI18n()

const {
  side,
  currentAssetData,
  isForex,
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
      priceDirectionBeforeNewsChangePercent: 'How much price changed before the news, %',
      priceDirectionAfterNews: 'Price direction after the news',
      priceDirectionAfterNewsChangePercent: 'How much price changed after the news, %'
    },
    placeholders: {
      maxPriceDuringTrade: 'ex. 4312.50',
      minPriceDuringTrade: 'ex. 4268.25',
      forexMaxPriceDuringTrade: 'ex. 1.00542',
      forexMinPriceDuringTrade: 'ex. 1.00180',
      durationDays: 'ex. 0',
      durationHours: 'ex. 1',
      durationMinutes: 'ex. 25',
      durationSeconds: 'ex. 30',
      percentMove: 'ex. 1.2'
    },
    duration: {
      belowLong: 'How long price stayed below entry',
      aboveShort: 'How long price stayed above entry',
      days: 'Days',
      hours: 'Hours',
      minutes: 'Minutes',
      seconds: 'Seconds'
    },
    units: {
      money: '$',
      forex: 'POINTS'
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
      priceDirectionBeforeNewsChangePercent: 'На сколько изменилась цена перед новостью, %',
      priceDirectionAfterNews: 'Цена после новости',
      priceDirectionAfterNewsChangePercent: 'На сколько изменилась цена после новости, %'
    },
    placeholders: {
      maxPriceDuringTrade: 'напр. 4312.50',
      minPriceDuringTrade: 'напр. 4268.25',
      forexMaxPriceDuringTrade: 'напр. 1.00542',
      forexMinPriceDuringTrade: 'напр. 1.00180',
      durationDays: 'напр. 0',
      durationHours: 'напр. 1',
      durationMinutes: 'напр. 25',
      durationSeconds: 'напр. 30',
      percentMove: 'напр. 1.2'
    },
    duration: {
      belowLong: 'Как долго цена была ниже входа',
      aboveShort: 'Как долго цена была выше входа',
      days: 'Дни',
      hours: 'Часы',
      minutes: 'Минуты',
      seconds: 'Секунды'
    },
    units: {
      money: '$',
      forex: 'ПУНКТЫ'
    }
  }
}

const ui = () => copy[locale.value] || copy.en

const groups = [
  {
    id: 'pricePath',
    fields: [
      { key: 'maxPriceDuringTrade', type: 'number', unit: 'price' },
      { key: 'minPriceDuringTrade', type: 'number', unit: 'price' },
      { key: 'priceDroppedBelowEntryLong', type: 'boolean' },
      { key: 'priceRoseAboveEntryShort', type: 'boolean' }
    ]
  },
  {
    id: 'news',
    fields: [
      { key: 'hadNews', type: 'boolean' },
      { key: 'priceDirectionBeforeNews', type: 'direction' },
      { key: 'priceDirectionBeforeNewsChangePercent', type: 'directionPercent', directionKey: 'priceDirectionBeforeNews' },
      { key: 'priceDirectionAfterNews', type: 'direction' },
      { key: 'priceDirectionAfterNewsChangePercent', type: 'directionPercent', directionKey: 'priceDirectionAfterNews' }
    ]
  }
]

const durationFieldGroups = {
  priceDroppedBelowEntryLong: {
    titleKey: 'belowLong',
    fields: [
      { key: 'priceBelowEntryLongDurationDays', unitKey: 'days', placeholderKey: 'durationDays' },
      { key: 'priceBelowEntryLongDurationHours', unitKey: 'hours', placeholderKey: 'durationHours' },
      { key: 'priceBelowEntryLongDurationMinutes', unitKey: 'minutes', placeholderKey: 'durationMinutes' },
      { key: 'priceBelowEntryLongDurationSeconds', unitKey: 'seconds', placeholderKey: 'durationSeconds' }
    ]
  },
  priceRoseAboveEntryShort: {
    titleKey: 'aboveShort',
    fields: [
      { key: 'priceAboveEntryShortDurationDays', unitKey: 'days', placeholderKey: 'durationDays' },
      { key: 'priceAboveEntryShortDurationHours', unitKey: 'hours', placeholderKey: 'durationHours' },
      { key: 'priceAboveEntryShortDurationMinutes', unitKey: 'minutes', placeholderKey: 'durationMinutes' },
      { key: 'priceAboveEntryShortDurationSeconds', unitKey: 'seconds', placeholderKey: 'durationSeconds' }
    ]
  }
}

const splitFields = (fields) => {
  const midpoint = Math.ceil(fields.length / 2)
  return [fields.slice(0, midpoint), fields.slice(midpoint)]
}

const usesForexPriceFormat = computed(() => {
  return Boolean(isForex?.value || currentAssetData?.value?.type === 'Forex')
})

const getFieldPlaceholder = (field) => {
  if (field.unit === 'price' && usesForexPriceFormat.value) {
    return ui().placeholders[`forex${field.key.charAt(0).toUpperCase()}${field.key.slice(1)}`]
  }
  return ui().placeholders[field.key]
}

const getFieldUnit = (field) => {
  if (field.unit !== 'price') return ''
  return usesForexPriceFormat.value ? ui().units.forex : ui().units.money
}

const directionPercentKeys = {
  priceDirectionBeforeNews: 'priceDirectionBeforeNewsChangePercent',
  priceDirectionAfterNews: 'priceDirectionAfterNewsChangePercent'
}

const normalizeDirectionPercent = (field, rawValue = tradeStudyMetrics.value[field.key]) => {
  const direction = tradeStudyMetrics.value[field.directionKey]
  if (!direction) {
    tradeStudyMetrics.value[field.key] = ''
    return
  }

  if (rawValue === '' || rawValue === null || rawValue === undefined) {
    tradeStudyMetrics.value[field.key] = ''
    return
  }

  const numericValue = Number(rawValue)
  if (!Number.isFinite(numericValue)) return

  const signedValue = direction === 'up' ? Math.abs(numericValue) : -Math.abs(numericValue)
  tradeStudyMetrics.value[field.key] = String(signedValue)
}

const toggleDirection = (key, value) => {
  if (!tradeStudyMetrics.value.hadNews) return
  tradeStudyMetrics.value[key] = tradeStudyMetrics.value[key] === value ? '' : value
  const percentKey = directionPercentKeys[key]
  if (!percentKey) return

  if (!tradeStudyMetrics.value[key]) {
    tradeStudyMetrics.value[percentKey] = ''
  } else {
    normalizeDirectionPercent({ key: percentKey, directionKey: key })
  }
}

const isVectorLocked = (field) => {
  if (field.key === 'priceDroppedBelowEntryLong') return side.value !== 'long'
  if (field.key === 'priceRoseAboveEntryShort') return side.value !== 'short'
  return false
}

const clearDurationGroup = (group) => {
  group?.fields.forEach(field => {
    tradeStudyMetrics.value[field.key] = ''
  })
}

const toggleBoolean = (field) => {
  if (isVectorLocked(field)) return
  tradeStudyMetrics.value[field.key] = !tradeStudyMetrics.value[field.key]
  if (!tradeStudyMetrics.value[field.key]) clearDurationGroup(durationFieldGroups[field.key])
  if (field.key === 'hadNews' && !tradeStudyMetrics.value.hadNews) {
    tradeStudyMetrics.value.priceDirectionBeforeNews = ''
    tradeStudyMetrics.value.priceDirectionBeforeNewsChangePercent = ''
    tradeStudyMetrics.value.priceDirectionAfterNews = ''
    tradeStudyMetrics.value.priceDirectionAfterNewsChangePercent = ''
  }
}

const shouldShowDuration = (field) => {
  return Boolean(durationFieldGroups[field.key] && tradeStudyMetrics.value[field.key] && !isVectorLocked(field))
}

const shouldShowDirectionPercent = (field) => {
  return Boolean(field.type === 'directionPercent' && tradeStudyMetrics.value.hadNews && tradeStudyMetrics.value[field.directionKey])
}

const visibleFields = (fields) => {
  return fields.filter(field => field.type !== 'directionPercent' || shouldShowDirectionPercent(field))
}

watch(side, (vector) => {
  if (vector === 'long') {
    tradeStudyMetrics.value.priceRoseAboveEntryShort = false
    clearDurationGroup(durationFieldGroups.priceRoseAboveEntryShort)
  } else {
    tradeStudyMetrics.value.priceDroppedBelowEntryLong = false
    clearDurationGroup(durationFieldGroups.priceDroppedBelowEntryLong)
  }
}, { immediate: true })
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
                      v-for="field in visibleFields(fieldColumn)"
                      :key="field.key"
                      class="relative flex min-w-0 flex-col gap-2"
                    >
                      <span class="min-h-[20px] text-[8px] font-bold uppercase leading-relaxed tracking-[0.18em] text-black/50 dark:text-white/40">{{ ui().fields[field.key] }}</span>

                      <button
                        v-if="field.type === 'boolean'"
                        type="button"
                        class="flex h-14 items-center justify-between border px-4 text-[11px] font-mono font-black uppercase tracking-[0.25em] transition-colors"
                        :class="[
                          isVectorLocked(field)
                            ? 'cursor-not-allowed border-black/5 bg-black/[0.02] text-black/20 dark:border-white/5 dark:text-white/15'
                            : 'border-black/15 bg-transparent nier-text-primary hover:border-black/40 dark:border-white/15 dark:hover:border-white/40'
                        ]"
                        :disabled="isVectorLocked(field)"
                        @click="toggleBoolean(field)"
                      >
                        <span>{{ tradeStudyMetrics[field.key] ? ui().boolOn : ui().boolOff }}</span>
                        <span class="grid h-4 w-4 place-items-center border border-black/30 dark:border-white/35">
                          <span v-if="tradeStudyMetrics[field.key]" class="h-2 w-1 rotate-45 border-b-2 border-r-2 border-current"></span>
                        </span>
                      </button>

                      <div v-if="shouldShowDuration(field)" class="border border-black/10 p-3 dark:border-white/10">
                        <span class="mb-3 block text-[7px] font-black uppercase tracking-[0.22em] text-black/35 dark:text-white/30">{{ ui().duration[durationFieldGroups[field.key].titleKey] }}</span>
                        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <label
                            v-for="durationField in durationFieldGroups[field.key].fields"
                            :key="durationField.key"
                            class="flex min-w-0 flex-col gap-1"
                          >
                            <span class="text-[7px] font-bold uppercase tracking-[0.16em] text-black/35 dark:text-white/30">{{ ui().duration[durationField.unitKey] }}</span>
                            <input
                              v-model="tradeStudyMetrics[durationField.key]"
                              type="number"
                              min="0"
                              step="1"
                              :placeholder="ui().placeholders[durationField.placeholderKey]"
                              class="h-10 min-w-0 border border-black/15 bg-transparent px-3 text-[12px] font-mono outline-none transition-colors placeholder:text-[9px] placeholder:tracking-[0.14em] placeholder:text-black/25 focus:border-black dark:border-white/15 dark:placeholder:text-white/20 dark:focus:border-white"
                            />
                          </label>
                        </div>
                      </div>

                      <div v-else-if="field.type === 'direction'" class="grid grid-cols-2 gap-2">
                        <button
                          v-for="option in ['up', 'down']"
                          :key="`${field.key}-${option}`"
                          type="button"
                          class="flex h-14 items-center justify-center border px-3 text-[10px] font-mono font-black uppercase tracking-[0.2em] transition-colors"
                          :class="[
                            !tradeStudyMetrics.hadNews
                              ? 'cursor-not-allowed border-black/5 bg-black/[0.02] text-black/20 dark:border-white/5 dark:text-white/15'
                              : tradeStudyMetrics[field.key] === option
                                ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                                : 'border-black/15 bg-transparent nier-text-primary hover:border-black/40 dark:border-white/15 dark:hover:border-white/40'
                          ]"
                          :disabled="!tradeStudyMetrics.hadNews"
                          @click="toggleDirection(field.key, option)"
                        >
                          {{ option === 'up' ? ui().directionUp : ui().directionDown }}
                        </button>
                      </div>

                      <input
                        v-else-if="shouldShowDirectionPercent(field)"
                        v-model="tradeStudyMetrics[field.key]"
                        type="number"
                        step="any"
                        :min="tradeStudyMetrics[field.directionKey] === 'up' ? 0 : undefined"
                        :max="tradeStudyMetrics[field.directionKey] === 'down' ? 0 : undefined"
                        :placeholder="ui().placeholders.percentMove"
                        @input="normalizeDirectionPercent(field, $event.target.value)"
                        @blur="normalizeDirectionPercent(field)"
                        class="h-14 min-w-0 border border-black/15 bg-transparent px-4 text-[13px] font-mono outline-none transition-colors placeholder:text-[10px] placeholder:tracking-[0.16em] placeholder:text-black/25 focus:border-black dark:border-white/15 dark:placeholder:text-white/20 dark:focus:border-white"
                      />

                      <input
                        v-else-if="field.type === 'number'"
                        v-model="tradeStudyMetrics[field.key]"
                        type="number"
                        step="any"
                        :placeholder="getFieldPlaceholder(field)"
                        class="h-14 min-w-0 border border-black/15 bg-transparent px-4 text-[13px] font-mono outline-none transition-colors placeholder:text-[10px] placeholder:tracking-[0.16em] placeholder:text-black/25 focus:border-black dark:border-white/15 dark:placeholder:text-white/20 dark:focus:border-white"
                        :class="field.unit === 'price' ? 'pr-24' : ''"
                      />
                      <span
                        v-if="getFieldUnit(field)"
                        class="pointer-events-none absolute bottom-0 right-3 flex h-14 items-center text-[8px] font-black uppercase tracking-[0.22em] text-black/35 dark:text-white/30"
                      >
                        {{ getFieldUnit(field) }}
                      </span>
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
