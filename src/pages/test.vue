<template>
  <div class="relative h-screen overflow-x-hidden overflow-y-auto bg-[#07111f] text-white">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(87,177,255,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(24,105,255,0.16),_transparent_24%),linear-gradient(180deg,_rgba(7,17,31,1)_0%,_rgba(8,12,20,1)_100%)]"></div>
    <div class="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:42px_42px]"></div>

    <main class="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section class="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <p class="text-[11px] font-mono uppercase tracking-[0.45em] text-cyan-200/60">
              myfxbook / csv analyzer
            </p>
            <h1 class="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Статистика по выбранному файлу
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              Файл читается из <code class="rounded bg-white/10 px-1.5 py-0.5 text-white/80">public/data/myfxbook</code>,
              строки обрабатываются в хронологическом порядке от самой ранней даты к самой поздней, а ведущие
              <code class="rounded bg-white/10 px-1.5 py-0.5 text-white/80">Deposit</code> строки считаются стартовым депозитом.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm sm:max-w-xl sm:grid-cols-4 lg:max-w-none lg:justify-end">
            <div class="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div class="text-[10px] uppercase tracking-[0.3em] text-white/40">Файлов</div>
              <div class="mt-2 text-2xl font-semibold text-cyan-100">{{ fileOptions.length }}</div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div class="text-[10px] uppercase tracking-[0.3em] text-white/40">Показано</div>
              <div class="mt-2 text-2xl font-semibold text-cyan-100">{{ filteredFiles.length }}</div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div class="text-[10px] uppercase tracking-[0.3em] text-white/40">Сделок</div>
              <div class="mt-2 text-2xl font-semibold text-cyan-100">{{ stats?.tradeCount ?? 0 }}</div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div class="text-[10px] uppercase tracking-[0.3em] text-white/40">Статус</div>
              <div class="mt-2 text-sm font-medium text-cyan-100">
                {{ loading ? 'Загрузка...' : errorMessage ? 'Ошибка' : 'Готово' }}
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm transition-colors"
            :class="activeTab === 'single' ? 'border-cyan-300/30 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/5 text-white/50 hover:text-white/80'"
            @click="activeTab = 'single'"
          >
            Один файл
          </button>
          <button
            type="button"
            class="rounded-full border px-4 py-2 text-sm transition-colors"
            :class="activeTab === 'overview' ? 'border-cyan-300/30 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/5 text-white/50 hover:text-white/80'"
            @click="activeTab = 'overview'"
          >
            Среднее по всем
          </button>
        </div>

        <div v-if="activeTab === 'single'" class="mt-8 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div class="space-y-4">
            <label class="block text-[11px] font-mono uppercase tracking-[0.35em] text-white/45">
              Поиск файла
            </label>
            <div class="relative group">
              <!-- Search Icon -->
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-cyan-200/50 group-focus-within:text-cyan-300 transition-colors">
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
                </svg>
              </div>

              <!-- Input -->
              <input
                v-model="searchText"
                type="text"
                class="w-full rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent py-4 pl-12 pr-12 text-sm text-white shadow-inner shadow-black/20 outline-none backdrop-blur-md transition-all placeholder:text-white/30 focus:border-cyan-400/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] focus:ring-1 focus:ring-cyan-400/50"
                placeholder="Введите часть имени файла..."
                @focus="dropdownOpen = true; ($event.target as HTMLInputElement)?.select?.()"
                @input="dropdownOpen = true"
                @keydown.esc="dropdownOpen = false"
              />

              <!-- Chevron Toggle -->
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center pr-4 text-white/40 hover:text-cyan-300 transition-colors"
                @click="dropdownOpen = !dropdownOpen"
              >
                <svg
                  class="h-5 w-5 transform transition-transform duration-300"
                  :class="dropdownOpen ? 'rotate-180 text-cyan-400' : ''"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                </svg>
              </button>

              <!-- Dropdown -->
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="translate-y-2 opacity-0 scale-95"
                enter-to-class="translate-y-0 opacity-100 scale-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="translate-y-0 opacity-100 scale-100"
                leave-to-class="translate-y-2 opacity-0 scale-95"
              >
                <div
                  v-if="dropdownOpen"
                  class="absolute z-30 mt-3 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#08101d] shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5"
                >
                  <div class="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3">
                    <span class="text-[10px] font-medium uppercase tracking-widest text-cyan-200/50">Список файлов</span>
                    <span class="rounded-full bg-cyan-900/40 px-2 py-0.5 text-[10px] font-bold text-cyan-300">{{ filteredFiles.length }}</span>
                  </div>

                  <div class="max-h-[380px] overflow-y-auto overscroll-contain scrollbar-thin">
                    <button
                      v-for="file in filteredFiles"
                      :key="file"
                      type="button"
                      class="group relative flex w-full flex-col items-start gap-1 border-b border-white/[0.03] p-4 text-left transition-all hover:bg-cyan-900/20"
                      @mousedown.prevent="selectFile(file)"
                    >
                      <!-- Active indicator -->
                      <div
                        class="absolute left-0 top-0 h-full w-[3px] bg-cyan-400 transition-opacity"
                        :class="file === selectedFile ? 'opacity-100' : 'opacity-0'"
                      ></div>
                      
                      <div class="flex w-full items-start justify-between gap-4 pl-1">
                        <div class="min-w-0 flex-1">
                          <div
                            class="truncate text-[13px] font-medium transition-colors"
                            :class="file === selectedFile ? 'text-cyan-300' : 'text-white/80 group-hover:text-cyan-100'"
                          >
                            {{ prettyFileLabel(file) }}
                          </div>
                          <div class="mt-1 truncate text-[11px] text-white/30 transition-colors group-hover:text-white/50">
                            {{ file }}
                          </div>
                        </div>
                        <span
                          class="shrink-0 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-white/40 transition-colors group-hover:border-cyan-500/30 group-hover:text-cyan-200/60"
                        >
                          {{ fileGroup(file) }}
                        </span>
                      </div>
                    </button>

                    <div v-if="!filteredFiles.length" class="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <svg class="mb-3 h-8 w-8 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                      <p class="text-sm text-white/40">Файлы не найдены</p>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <div class="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div class="flex flex-wrap items-center gap-3">
                <div class="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-cyan-100">
                  Активный файл
                </div>
                <div class="text-sm text-white/60 break-all">
                  {{ selectedFile || 'Не выбран' }}
                </div>
              </div>

              <div class="mt-4 grid gap-3 text-sm text-white/65">
                <div class="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  Число строк: <span class="text-white">{{ stats?.rowsCount ?? 0 }}</span>
                </div>
                <div class="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  {{ stats?.sourceKind === 'myfxbook' ? 'Стартовый депозит' : 'Стартовый баланс' }}:
                  <span class="text-white">{{ formatMoney(stats?.initialDeposit ?? 0) }}</span>
                </div>
                <div class="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  Финальный капитал: <span class="text-white">{{ formatMoney(stats?.finalCapital ?? 0) }}</span>
                </div>
                <div class="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  <div class="text-white/55">Используемые активы</div>
                  <div v-if="stats?.symbols.length" class="mt-2 flex flex-wrap gap-2">
                    <span
                      v-for="symbol in stats.symbols"
                      :key="symbol"
                      class="rounded-full border border-cyan-300/15 bg-cyan-300/10 px-3 py-1 text-[11px] font-medium text-cyan-100"
                    >
                      {{ symbol }}
                    </span>
                  </div>
                  <div v-else class="mt-2 text-white/35">—</div>
                </div>
              </div>

              <p class="mt-4 text-xs leading-5 text-white/35">
                <template v-if="stats?.sourceKind === 'myfxbook'">
                  В статистику попадают сделки, а движения капитала из
                  <code class="rounded bg-white/10 px-1 py-0.5 text-white/70">Deposit</code>
                  и
                  <code class="rounded bg-white/10 px-1 py-0.5 text-white/70">Withdrawal</code>
                  учитываются отдельно в equity curve.
                </template>
                <template v-else>
                  В статистику попадают сделки, а балансовые операции из
                  <code class="rounded bg-white/10 px-1 py-0.5 text-white/70">Balance</code>
                  учитываются отдельно в equity curve.
                </template>
              </p>
            </div>
          </div>

          <div class="space-y-6">
            <Transition name="fade-fast">
              <div v-if="errorMessage" class="rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-100">
                {{ errorMessage }}
              </div>
            </Transition>

            <Transition name="fade-fast">
              <div v-if="loading" class="rounded-3xl border border-white/10 bg-black/20 p-8 text-sm text-white/55">
                Загружаю CSV и строю метрики...
              </div>
            </Transition>

            <div v-if="stats" class="space-y-6">
              <section class="rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
                <div class="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div class="text-[10px] uppercase tracking-[0.35em] text-white/35">Trading performance</div>
                    <div class="mt-2 text-lg font-semibold text-white">Конечный капитал минус initial deposit</div>
                  </div>
                </div>

                <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <StatCard label="Profit factor" :value="formatNumber(stats.profitFactor, 2)" hint="gross profit / gross loss" />
                  <StatCard
                    label="Средний R/R"
                    :value="formatOptionalNumber(stats.avgRiskReward, 2)"
                    :hint="stats.sourceKind === 'myfxbook' ? 'по сделкам из Risk:Reward' : 'нет колонки Risk:Reward'"
                  />
                  <StatCard label="Торговый результат" :value="formatMoney(stats.netResult)" :hint="formatPercent(stats.netResultPercent)" />
                  <StatCard label="Количество сделок" :value="formatInteger(stats.tradeCount)" hint="без deposit / withdrawal" />
                  <StatCard label="Средняя длительность" :value="formatDuration(stats.avgDurationSeconds)" hint="по закрытым сделкам" />
                  <StatCard
                    label="Максимальная просадка"
                    :value="formatSignedMoney(stats.maxDrawdownAmount * -1)"
                    :hint="formatPercent(stats.maxDrawdownPercent)"
                    valueClass="text-red-300"
                    hintClass="text-red-200/55"
                  />
                  <StatCard label="Win rate" :value="formatPercent(stats.winRate)" hint="победные сделки" />
                  <StatCard label="Сумма прибыльных" :value="formatMoney(stats.grossProfit)" hint="сумма всех плюсовых сделок" />
                  <StatCard label="Сумма убыточных" :value="formatMoney(stats.grossLoss * -1)" hint="сумма всех минусовых сделок" valueClass="text-red-300" hintClass="text-red-200/55" />
                  <StatCard label="Первая сделка" :value="stats.firstTradeDate" hint="самая ранняя закрытая сделка" />
                  <StatCard label="Последняя сделка" :value="stats.lastTradeDate" hint="самая поздняя закрытая сделка" />
                  <StatCard label="Макс. win streak" :value="formatInteger(stats.maxWinStreak)" hint="серия побед подряд" />
                  <StatCard label="Макс. loss streak" :value="formatInteger(stats.maxLossStreak)" hint="серия поражений подряд" />
                </div>
              </section>

              <section class="rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
                <div class="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div class="text-[10px] uppercase tracking-[0.35em] text-white/35">Cash flow</div>
                    <div class="mt-2 text-lg font-semibold text-white">Детализация баланса и пополнений</div>
                  </div>
                </div>

                <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <StatCard
                    :label="stats.sourceKind === 'myfxbook' ? 'Initial deposit' : 'Initial balance'"
                    :value="formatMoney(stats.initialDeposit)"
                    :hint="stats.sourceKind === 'myfxbook' ? 'сумма стартовых deposit' : 'сумма стартовых balance'"
                  />
                  <StatCard label="Финальный капитал" :value="formatMoney(stats.finalCapital)" hint="после всех cash flow" />
                  <StatCard
                    :label="stats.sourceKind === 'myfxbook' ? 'Доп. депозиты' : 'Положительные balance'"
                    :value="formatMoney(stats.additionalDeposits)"
                    :hint="stats.sourceKind === 'myfxbook' ? 'после initial deposit' : 'положительные balance после старта'"
                  />
                  <StatCard
                    :label="stats.sourceKind === 'myfxbook' ? 'Выводы' : 'Отрицательные balance'"
                    :value="formatMoney(stats.withdrawals)"
                    :hint="stats.sourceKind === 'myfxbook' ? 'withdrawal после старта' : 'отрицательные balance после старта'"
                    valueClass="text-red-300"
                    hintClass="text-red-200/55"
                  />
                  <StatCard label="Net cash flow" :value="formatMoney(stats.netCashFlow)" hint="доп. депозиты + выводы" />
                  <StatCard
                    label="Балансовая просадка"
                    :value="formatSignedMoney(stats.maxDrawdownAmount * -1)"
                    :hint="formatPercent(stats.maxDrawdownPercent)"
                    valueClass="text-red-300"
                    hintClass="text-red-200/55"
                  />
                </div>

                <div class="mt-5 overflow-hidden rounded-2xl border border-white/8 bg-[#060d18] p-3">
                  <div class="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-white/35">
                    <span>Equity curve</span>
                    <span>{{ stats.equityCurve.length }} points</span>
                  </div>

                  <svg
                    v-if="stats.equityCurve.length > 1"
                    viewBox="0 0 1000 320"
                    class="h-[280px] w-full"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="equityStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="#67e8f9" />
                        <stop offset="100%" stop-color="#22d3ee" />
                      </linearGradient>
                    </defs>

                    <g opacity="0.18">
                      <line x1="0" y1="40" x2="1000" y2="40" stroke="white" stroke-width="1" />
                      <line x1="0" y1="120" x2="1000" y2="120" stroke="white" stroke-width="1" />
                      <line x1="0" y1="200" x2="1000" y2="200" stroke="white" stroke-width="1" />
                      <line x1="0" y1="280" x2="1000" y2="280" stroke="white" stroke-width="1" />
                    </g>

                    <polyline
                      :points="equityCurveLinePoints(stats.equityCurve)"
                      fill="none"
                      stroke="url(#equityStroke)"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>

                  <div v-else class="flex h-[280px] items-center justify-center text-sm text-white/40">
                    Недостаточно точек для графика
                  </div>
                </div>
              </section>
            </div>

            <div v-else class="rounded-3xl border border-white/10 bg-black/20 p-8 text-sm text-white/45">
              Выберите файл слева, чтобы увидеть рассчитанные метрики.
            </div>
          </div>
        </div>

        <div v-else class="mt-8 space-y-6">
            <div class="rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-6">
              <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div class="text-[10px] uppercase tracking-[0.35em] text-white/35">Overview</div>
                  <div class="mt-2 text-lg font-semibold text-white">Средние метрики по всем файлам</div>
                </div>
                <div class="text-sm text-white/50">
                {{ aggregateLoading ? 'Считаю...' : `${aggregateStats?.filesCount ?? 0} / ${fileOptions.length} файлов` }}
                </div>
              </div>

              <div class="mt-5 max-w-sm">
                <label class="mb-2 block text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
                  Benchmark, %
                </label>
                <input
                  v-model.number="benchmarkPercent"
                  type="number"
                  step="0.1"
                  min="0"
                  class="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-cyan-300/40 focus:bg-black/40"
                  placeholder="28"
                />
                <p class="mt-2 text-xs leading-5 text-white/35">
                  Сравниваем по общему результату файла за весь срок.
                </p>
              </div>

            <Transition name="fade-fast">
              <div v-if="aggregateError" class="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
                {{ aggregateError }}
              </div>
            </Transition>

            <Transition name="fade-fast">
              <div v-if="aggregateLoading" class="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/55">
                Загружаю и усредняю все файлы...
              </div>
            </Transition>

                <div v-if="benchmarkStats" class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="В плюсе"
                    :value="formatInteger(benchmarkStats.profitableFiles)"
                    :hint="`${formatPercent(benchmarkStats.profitableShare)} файлов`"
                  />
                  <StatCard
                    :label="`Выше ${formatNumber(benchmarkPercent, 1)}%`"
                    :value="formatInteger(benchmarkStats.benchmarkFiles)"
                    :hint="`${formatPercent(benchmarkStats.benchmarkShare)} файлов`"
                  />
                  <StatCard
                    label="Средний результат выше benchmark"
                    :value="formatMoney(benchmarkStats.averageAboveBenchmark)"
                    hint="средний net result среди прошедших порог"
                  />
                  <StatCard
                    label="Средний результат ниже benchmark"
                    :value="formatMoney(benchmarkStats.averageBelowBenchmark)"
                    hint="средний net result среди остальных"
                  />
                </div>

                <div v-if="aggregateStats" class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <StatCard label="Средний торговый результат" :value="formatMoney(aggregateStats.meanNetResult)" hint="обычное среднее" />
                  <StatCard label="Медиана торгового результата" :value="formatMoney(aggregateStats.medianNetResult)" hint="типичный файл" />
                  <StatCard label="Trimmed mean 10%" :value="formatMoney(aggregateStats.trimmedMeanNetResult)" hint="без крайних 10% значений" />
                  <StatCard label="Медианный R/R" :value="formatOptionalNumber(aggregateStats.medianRiskReward, 2)" hint="типичный файл" />
                  <StatCard label="Trimmed mean R/R" :value="formatOptionalNumber(aggregateStats.trimmedMeanRiskReward, 2)" hint="без крайних 10% файлов" />
                  <StatCard label="Средний R/R" :value="formatOptionalNumber(aggregateStats.meanRiskReward, 2)" hint="только файлы с Risk:Reward" />
                  <StatCard label="Средний profit factor" :value="formatNumber(aggregateStats.avgProfitFactor, 2)" hint="по поддерживаемым файлам" />
                  <StatCard label="Среднее число сделок" :value="formatNumber(aggregateStats.avgTradeCount, 0)" hint="по файлам" />
                  <StatCard label="Средний win rate" :value="formatPercent(aggregateStats.avgWinRate)" hint="по файлам" />
                  <StatCard label="Средняя просадка" :value="formatPercent(aggregateStats.avgMaxDrawdownPercent)" hint="по файлам" />
                  <StatCard label="Средний initial balance" :value="formatMoney(aggregateStats.avgInitialDeposit)" hint="стартовая база по всем файлам" />
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, ref, watch } from 'vue'

type ParsedRow = {
  originalIndex: number
  action: string
  symbol: string
  profit: number
  durationSeconds: number
  eventTimestamp: number
  kind: 'trade' | 'cashflow'
  riskReward?: number
}

type FileStats = {
  sourceKind: 'myfxbook' | 'mql5' | 'mql4'
  rowsCount: number
  initialDeposit: number
  finalCapital: number
  netResult: number
  netResultPercent: number
  additionalDeposits: number
  withdrawals: number
  netCashFlow: number
  tradeCount: number
  grossProfit: number
  grossLoss: number
  profitFactor: number
  avgDurationSeconds: number
  maxDrawdownAmount: number
  maxDrawdownPercent: number
  winRate: number
  firstTradeDate: string
  lastTradeDate: string
  maxWinStreak: number
  maxLossStreak: number
  avgRiskReward: number | null
  symbols: string[]
  equityCurve: EquityPoint[]
}

type AggregateStats = {
  filesCount: number
  meanNetResult: number
  medianNetResult: number
  trimmedMeanNetResult: number
  meanRiskReward: number | null
  medianRiskReward: number | null
  trimmedMeanRiskReward: number | null
  avgProfitFactor: number
  avgTradeCount: number
  avgWinRate: number
  avgMaxDrawdownPercent: number
  avgInitialDeposit: number
}

type EquityPoint = {
  timestamp: number
  equity: number
}

const fileOptions = [
  '/data/myfxbook/fundamental/statement19ec5db431f93d250f7c16c567e976c7.csv',
  '/data/myfxbook/fundamental/statement1f663e03f5fe66752f31191e5d85bacf.csv',
  '/data/myfxbook/fundamental/statement28455109a9c7bedd40fe91c6d5dc811f.csv',
  '/data/myfxbook/fundamental/statement40f924c76a1ff7cd830805e60c62a7e9.csv',
  '/data/myfxbook/fundamental/statementa197197ceefd61c0fef7c72d5e0b96ca.csv',
  '/data/myfxbook/fundamental/statementa87553e67a90bb8cb4a79f862f6c3911.csv',
  '/data/myfxbook/fundamental/statementc90783fa5e48691a598ee17d044075a4.csv',
  '/data/myfxbook/fundamental/statementd8cd2c206c4a86e50491629390728f68.csv',
  '/data/myfxbook/statement1b99c459ef8c3510aecf4756d79373a3.csv',
  '/data/myfxbook/statement339560dabb8d138cd713f846fc323b79.csv',
  '/data/myfxbook/statement3da79ccfced258b57ae1aaf5024c6890.csv',
  '/data/myfxbook/statement46d2e91e0e6a9e4122ec89fc0ab77db4.csv',
  '/data/myfxbook/statement4f9528cdf6d1978a7164b143cc14423a.csv',
  '/data/myfxbook/statement5225b0b248330bf25bcc32206119c7a1.csv',
  '/data/myfxbook/statement5c74b6977ea17c1410cd1c98d7a9ab6b.csv',
  '/data/myfxbook/statement5e0400933c893de52794b7b864a98a2b.csv',
  '/data/myfxbook/statement5f50addc57c0750f30e709ce4a24904a.csv',
  '/data/myfxbook/statement63df3c6a34945c42524b8c92cf92cd79.csv',
  '/data/myfxbook/statement64f4bdf4a57e76259eb0cfe9cc087dd8.csv',
  '/data/myfxbook/statement82d8faac5cfcf7194ebe5f7d88e346bb.csv',
  '/data/myfxbook/statementb0770cc9d9884489ee6a9448399c53ad.csv',
  '/data/myfxbook/statementbcf840f32290b370029c69772e2fa71d.csv',
  '/data/myfxbook/statementc85768eb317de38b72bd368e8df9d993.csv',
  '/data/myfxbook/statementd8a85b11821f29bd7243ac49d8852a93.csv',
  '/data/myfxbook/statemente308e5b8a1af637b89fb3c611eb6119c.csv',
  '/data/myfxbook/statemente76fbd580f61465f308e3516147940f9.csv',
  '/data/myfxbook/statementf993ffd820ef7c14dc042f9827223baf.csv',
  '/data/myfxbook/technical/statement05c0f45f59037c0162b5dcb8bdb84a76.csv',
  '/data/myfxbook/technical/statement0852f173b03bb9ee1d723d2f75125c5a.csv',
  '/data/myfxbook/technical/statement0abd833ae88f03292b810308b6eafa72.csv',
  '/data/myfxbook/technical/statement1666e233ab8fbce4a3bed6b1b2119fb8.csv',
  '/data/myfxbook/technical/statement1b96ee217e9d6a437b0eba8755783f79.csv',
  '/data/myfxbook/technical/statement1bfe1ad330f27e14459397575e8005b6.csv',
  '/data/myfxbook/technical/statement2017f5b30159ccd1176eadf33acb9a6e.csv',
  '/data/myfxbook/technical/statement22f88d538a9fb8c4342bca7f5a26a278.csv',
  '/data/myfxbook/technical/statement279ff7e4399aeeebf5e4e4a2730d0390.csv',
  '/data/myfxbook/technical/statement2847eeb4abac86ceb80db4456b44a6f8.csv',
  '/data/myfxbook/technical/statement383eeb8d21650e91bea5a57e2151dd18.csv',
  '/data/myfxbook/technical/statement3a794dadca70b0ac351115807a343564.csv',
  '/data/myfxbook/technical/statement497b10908e843129ad75ec99ddc080b8.csv',
  '/data/myfxbook/technical/statement5113aaa2229adbbd834c597c9ff93f8e.csv',
  '/data/myfxbook/technical/statement5c304150272db8864ed155eb07dc74e2.csv',
  '/data/myfxbook/technical/statement5d874f798a4299621c6335cca8c5cef2.csv',
  '/data/myfxbook/technical/statement5e548ab59763641e3c2109243dbc8247.csv',
  '/data/myfxbook/technical/statement6a7807a298e2ac2ea45aa203c9a76bdf.csv',
  '/data/myfxbook/technical/statement6ae8446e9b3e04450057e1bfa7840f38.csv',
  '/data/myfxbook/technical/statement7121825464c7656ef36e2cff75af26db.csv',
  '/data/myfxbook/technical/statement7b259ee915bd69eaafe2659671e64498.csv',
  '/data/myfxbook/technical/statement85007d98bbb4cfefa4d53e20f214f190.csv',
  '/data/myfxbook/technical/statement8bed1879d429203a47be7aa737cc9346.csv',
  '/data/myfxbook/technical/statement8c20d772ded1292d04ab2640da210911.csv',
  '/data/myfxbook/technical/statement9153132ec098ea96c34786187ae30a4e.csv',
  '/data/myfxbook/technical/statement95441bb10b82ea440977e4fa41a97752.csv',
  '/data/myfxbook/technical/statement9900d9c89621e45064d5b4eae71f36fb.csv',
  '/data/myfxbook/technical/statement9d5a7816f5b05a8cd5f0fac930cb9e61.csv',
  '/data/myfxbook/technical/statementa1dd9ad5ccbe770ad6a5849369124e86.csv',
  '/data/myfxbook/technical/statementa843b8272dee5fc7a95bf51da87a7f47.csv',
  '/data/myfxbook/technical/statementab78dae9e504092efe9f3730b5ea6337.csv',
  '/data/myfxbook/technical/statementae98c4869884096c403bc37834ea57a9.csv',
  '/data/myfxbook/technical/statementb699850765e0c251a7b16eedc09ca5df.csv',
  '/data/myfxbook/technical/statementba7ee2873d372691aa24ecf2008352c2.csv',
  '/data/myfxbook/technical/statementbbc510b43baf87c7f9d45c4a39f428b3.csv',
  '/data/myfxbook/technical/statementc1dbbb3ebcb87592ac88b94cca7d0259.csv',
  '/data/myfxbook/technical/statementc8cf8656b6f0f4b065b93c55f5d57459.csv',
  '/data/myfxbook/technical/statementce183ea008d013507b505b0c68c4f3a2.csv',
  '/data/myfxbook/technical/statementcfbe28a5bf0f0ed67afdd2bb64712156.csv',
  '/data/mql5/crypto/1521998.positions.csv',
  '/data/mql5/crypto/2329657.positions.csv',
  '/data/mql5/crypto/2343825.positions.csv',
  '/data/mql5/crypto/2357980.positions.csv',
  '/data/mql5/crypto/2362109.positions.csv',
  '/data/mql5/crypto/2365176.positions.csv',
  '/data/mql5/crypto/2365503.positions.csv',
  '/data/mql5/crypto/2368574.positions.csv',
  '/data/mql5/crypto/2368681.positions.csv',
  '/data/mql5/crypto/2371732.positions.csv',
  '/data/mql5/crypto/2373462.positions.csv',
  '/data/mql5/crypto/2373733.positions.csv',
  '/data/mql5/crypto/2374744.positions.csv',
  '/data/mql5/crypto/2375224.positions.csv',
  '/data/mql5/forex/2265103.positions.csv',
  '/data/mql5/forex/2272390.positions.csv',
  '/data/mql5/forex/2278370.positions.csv',
  '/data/mql5/forex/2309024.positions.csv',
  '/data/mql5/forex/2310721.positions.csv',
  '/data/mql5/forex/2326263.positions.csv',
  '/data/mql5/forex/2340695.positions.csv',
  '/data/mql5/forex/2349559.positions.csv',
  '/data/mql5/forex/2349913.positions.csv',
  '/data/mql5/forex/2354677.positions.csv',
  '/data/mql5/forex/2356223.positions.csv',
  '/data/mql5/forex/2359069.positions.csv',
  '/data/mql5/forex/2360613.positions.csv',
  '/data/mql5/forex/2361472.positions.csv',
  '/data/mql5/forex/2363661.positions.csv',
  '/data/mql5/forex/2364807.positions.csv',
  '/data/mql5/forex/2367701.positions.csv',
  '/data/mql5/forex/2370196.positions.csv',
  '/data/mql5/forex/2372826.positions.csv',
  '/data/mql5/forex/2372884.positions.csv',
  '/data/mql5/forex/2373259.positions.csv',
  '/data/mql5/forex/2374304.positions.csv',
  '/data/mql5/forex/2376003.positions.csv',
  '/data/mql5/forex/2376124.positions.csv',
  '/data/mql5/stocks/2236750.positions.csv',
  '/data/mql5/stocks/2276528.positions.csv',
  '/data/mql5/stocks/2315126.positions.csv',
  '/data/mql5/stocks/2364988.positions.csv',
  '/data/mql4/1149879.history.csv',
  '/data/mql4/1501662.history.csv',
  '/data/mql4/2178786.history.csv',
  '/data/mql4/2188470.history.csv',
  '/data/mql4/2195090.history.csv',
  '/data/mql4/2198360.history.csv',
  '/data/mql4/2201409.history.csv',
  '/data/mql4/2223380.history.csv',
  '/data/mql4/2223423.history.csv',
  '/data/mql4/2245972.history.csv',
  '/data/mql4/2253805.history.csv',
  '/data/mql4/2254521.history.csv',
  '/data/mql4/2261437.history.csv',
  '/data/mql4/2267681.history.csv',
  '/data/mql4/2276647.history.csv',
  '/data/mql4/2279861.history.csv',
  '/data/mql4/2281294.history.csv',
  '/data/mql4/2283610.history.csv',
  '/data/mql4/2290347.history.csv',
  '/data/mql4/2305268.history.csv',
  '/data/mql4/2306187.history.csv',
  '/data/mql4/2306648.history.csv',
  '/data/mql4/2307209.history.csv',
  '/data/mql4/2312839.history.csv',
  '/data/mql4/2313935.history.csv',
  '/data/mql4/2320492.history.csv',
  '/data/mql4/2325232.history.csv',
  '/data/mql4/2328330.history.csv',
  '/data/mql4/2335169.history.csv',
  '/data/mql4/2335372.history.csv',
  '/data/mql4/2337302.history.csv',
  '/data/mql4/2337332.history.csv',
  '/data/mql4/2339016.history.csv',
  '/data/mql4/2340436.history.csv',
  '/data/mql4/2341570.history.csv',
  '/data/mql4/2342449.history.csv',
  '/data/mql4/2342868.history.csv',
  '/data/mql4/2343472.history.csv',
  '/data/mql4/2344833.history.csv',
  '/data/mql4/2346537.history.csv',
  '/data/mql4/2349061.history.csv',
  '/data/mql4/2352153.history.csv',
  '/data/mql4/2353566.history.csv',
  '/data/mql4/2354845.history.csv',
  '/data/mql4/2355111.history.csv',
  '/data/mql4/2356092.history.csv',
  '/data/mql4/2356217.history.csv',
  '/data/mql4/2357667.history.csv',
  '/data/mql4/2359031.history.csv',
  '/data/mql4/2359749.history.csv',
  '/data/mql4/2360441.history.csv',
  '/data/mql4/2361838.history.csv',
  '/data/mql4/2363350.history.csv',
  '/data/mql4/2364106.history.csv',
  '/data/mql4/2364904.history.csv',
  '/data/mql4/2365565.history.csv',
  '/data/mql4/2367419.history.csv',
  '/data/mql4/2367576.history.csv',
  '/data/mql4/2368150.history.csv',
  '/data/mql4/2369462.history.csv',
  '/data/mql4/2370207.history.csv',
  '/data/mql4/2372343.history.csv',
  '/data/mql4/2373699.history.csv',
  '/data/mql4/2375320.history.csv',
  '/data/mql4/2375347.history.csv',
  '/data/mql4/2375387.history.csv',
  '/data/mql4/965838.history.csv'
]

const searchText = ref('')
const dropdownOpen = ref(false)
const selectedFile = ref(fileOptions[0] ?? '')
const loading = ref(false)
const errorMessage = ref('')
const stats = ref<FileStats | null>(null)
const activeTab = ref<'single' | 'overview'>('single')
const aggregateLoading = ref(false)
const aggregateError = ref('')
const aggregateStats = ref<AggregateStats | null>(null)
const aggregateFileStats = ref<FileStats[]>([])
const benchmarkPercent = ref(28)
const parsedCache = new Map<string, FileStats>()
let activeRequestId = 0
let aggregateRequestId = 0

const filteredFiles = computed(() => {
  const query = searchText.value.trim().toLowerCase()
  const selectedLabel = selectedFile.value ? prettyFileLabel(selectedFile.value).toLowerCase() : ''
  
  if (!query || query === selectedLabel) {
    return fileOptions
  }

  const terms = query.split(/\s+/)
  return fileOptions.filter((file) => {
    const searchTarget = file.toLowerCase()
    return terms.every(term => searchTarget.includes(term))
  })
})

onMounted(() => {
  if (selectedFile.value) {
    void loadSelectedFile(selectedFile.value)
  }
})

watch(activeTab, (value) => {
  if (value === 'overview' && !aggregateStats.value && !aggregateLoading.value) {
    void loadAggregateStats()
  }
})

const benchmarkStats = computed(() => {
  const statsList = aggregateFileStats.value
  if (!statsList.length) {
    return null
  }

  const benchmarkValue = Number.isFinite(benchmarkPercent.value) ? benchmarkPercent.value : 0
  const profitableFiles = statsList.filter((item) => item.netResult > 0).length
  const benchmarkFiles = statsList.filter((item) => item.netResultPercent > benchmarkValue).length
  const aboveBenchmarkResults = statsList
    .filter((item) => item.netResultPercent > benchmarkValue)
    .map((item) => item.netResult)
  const belowBenchmarkResults = statsList
    .filter((item) => item.netResultPercent <= benchmarkValue)
    .map((item) => item.netResult)

  return {
    profitableFiles,
    profitableShare: (profitableFiles / statsList.length) * 100,
    benchmarkFiles,
    benchmarkShare: (benchmarkFiles / statsList.length) * 100,
    averageAboveBenchmark: aboveBenchmarkResults.length ? average(aboveBenchmarkResults) : 0,
    averageBelowBenchmark: belowBenchmarkResults.length ? average(belowBenchmarkResults) : 0
  }
})

function selectFile(file: string, closeDropdown = true) {
  selectedFile.value = file
  searchText.value = prettyFileLabel(file)
  void loadSelectedFile(file)
  if (closeDropdown) {
    dropdownOpen.value = false
  }
}

async function loadSelectedFile(file: string) {
  const requestId = ++activeRequestId
  loading.value = true
  errorMessage.value = ''

  try {
    const computedStats = await getFileStats(file)

    if (requestId !== activeRequestId) {
      return
    }

    stats.value = computedStats
  } catch (error) {
    if (requestId !== activeRequestId) {
      return
    }

    stats.value = null
    errorMessage.value = error instanceof Error ? error.message : 'Не удалось разобрать CSV'
  } finally {
    if (requestId === activeRequestId) {
      loading.value = false
    }
  }
}

async function getFileStats(file: string) {
  const cached = parsedCache.get(file)
  if (cached) {
    return cached
  }

  const response = await fetch(encodeURI(file))
  if (!response.ok) {
    throw new Error(`Не удалось загрузить файл: ${response.status} ${response.statusText}`)
  }

  const csvText = await response.text()
  const computedStats = analyzeCsv(csvText, file)
  parsedCache.set(file, computedStats)
  return computedStats
}

async function loadAggregateStats() {
  const requestId = ++aggregateRequestId
  aggregateLoading.value = true
  aggregateError.value = ''

  try {
    const settled = await Promise.allSettled(fileOptions.map((file) => getFileStats(file)))
    if (requestId !== aggregateRequestId) {
      return
    }

    const statsList = settled
      .filter((result): result is PromiseFulfilledResult<FileStats> => result.status === 'fulfilled')
      .map((result) => result.value)

    if (!statsList.length) {
      throw new Error('Не удалось собрать статистику ни по одному файлу')
    }

    aggregateFileStats.value = statsList

    const finiteProfitFactors = statsList.map((item) => item.profitFactor).filter((value) => Number.isFinite(value))
    const finiteRiskRewards = statsList
      .map((item) => item.avgRiskReward)
      .filter((value): value is number => value !== null && Number.isFinite(value))
    const netResults = statsList.map((item) => item.netResult)
    const aggregate: AggregateStats = {
      filesCount: statsList.length,
      meanNetResult: average(netResults),
      medianNetResult: median(netResults),
      trimmedMeanNetResult: trimmedMean(netResults, 0.1),
      meanRiskReward: finiteRiskRewards.length ? average(finiteRiskRewards) : null,
      medianRiskReward: finiteRiskRewards.length ? median(finiteRiskRewards) : null,
      trimmedMeanRiskReward: finiteRiskRewards.length ? trimmedMean(finiteRiskRewards, 0.1) : null,
      avgProfitFactor: finiteProfitFactors.length ? average(finiteProfitFactors) : 0,
      avgTradeCount: average(statsList.map((item) => item.tradeCount)),
      avgWinRate: average(statsList.map((item) => item.winRate)),
      avgMaxDrawdownPercent: average(statsList.map((item) => item.maxDrawdownPercent)),
      avgInitialDeposit: average(statsList.map((item) => item.initialDeposit))
    }

    aggregateStats.value = aggregate
  } catch (error) {
    if (requestId !== aggregateRequestId) {
      return
    }

    aggregateStats.value = null
    aggregateFileStats.value = []
    aggregateError.value = error instanceof Error ? error.message : 'Не удалось собрать агрегированную статистику'
  } finally {
    if (requestId === aggregateRequestId) {
      aggregateLoading.value = false
    }
  }
}

function analyzeCsv(csvText: string, file: string): FileStats {
  const lines = getStatementLines(csvText)
  if (lines.length < 2) {
    throw new Error('CSV пустой или содержит только заголовок')
  }

  const sourceKind = file.startsWith('/data/mql5/')
    ? 'mql5'
    : file.startsWith('/data/mql4/')
      ? 'mql4'
      : 'myfxbook'
  const delimiter = sourceKind === 'myfxbook' ? ',' : ';'
  const header = splitCsvLine(lines[0] || '', delimiter).map((value) => value.replace(/^\uFEFF/, '').trim())
  const headerMap = new Map<string, number>()

  header.forEach((name, index) => {
    headerMap.set(name, index)
  })

  const parsedRows: ParsedRow[] = []
  if (sourceKind === 'myfxbook') {
    const actionIndex = headerMap.get('Action') ?? -1
    const symbolIndex = headerMap.get('Symbol') ?? -1
    const profitIndex = headerMap.get('Profit') ?? -1
    const riskRewardIndex = headerMap.get('Risk:Reward') ?? -1
    const durationIndex = headerMap.get('Duration (DD:HH:MM:SS)') ?? -1
    const openDateIndex = headerMap.get('Open Date') ?? -1
    const closeDateIndex = headerMap.get('Close Date') ?? -1

    if (actionIndex === -1) {
      throw new Error('CSV не содержит колонку Action')
    }

    if (profitIndex === -1) {
      throw new Error('CSV не содержит колонку Profit; по колонке Gain денежный результат считать нельзя')
    }

    for (let index = 1; index < lines.length; index += 1) {
      const line = lines[index]
      if (!line || !line.trim()) {
        continue
      }

      const cells = splitCsvLine(line, delimiter)
      const action = (cells[actionIndex] ?? '').trim()
      const symbol = symbolIndex >= 0 ? (cells[symbolIndex] ?? '').trim() : ''
      const closeDate = closeDateIndex >= 0 ? (cells[closeDateIndex] ?? '').trim() : ''
      const isCashFlow = isCashFlowAction(action)
      const isExcludedSymbol = symbol.toUpperCase() === 'SUMMAR'

      if (!isCashFlow && closeDateIndex >= 0 && !closeDate) {
        continue
      }

      if (isExcludedSymbol) {
        continue
      }

      const profit = parseNumber(cells[profitIndex] ?? '0')
      const riskRewardRaw = riskRewardIndex >= 0 ? String(cells[riskRewardIndex] ?? '').trim() : ''
      const riskReward = riskRewardRaw ? parseNumber(riskRewardRaw) : Number.NaN

      parsedRows.push({
        originalIndex: index,
        action,
        symbol,
        profit,
        durationSeconds: durationIndex >= 0 ? parseDurationToSeconds(cells[durationIndex] ?? '') : 0,
        eventTimestamp: parseEventTimestamp(
          closeDate ||
            (openDateIndex >= 0 ? cells[openDateIndex] : '')?.trim() ||
            ''
        ),
        kind: isCashFlow ? 'cashflow' : 'trade',
        riskReward: !isCashFlow && Number.isFinite(riskReward) ? riskReward : undefined
      })
    }
  } else if (sourceKind === 'mql5') {
    const typeIndex = headerMap.get('Type') ?? 1
    const symbolIndex = headerMap.get('Symbol') ?? 3
    const profitIndex = headerMap.get('Profit') ?? 10

    for (let index = 1; index < lines.length; index += 1) {
      const line = lines[index]
      if (!line || !line.trim()) {
        continue
      }

      const cells = splitCsvLine(line, delimiter)
      const action = (cells[typeIndex] ?? '').trim()
      if (!action) {
        continue
      }

      const symbol = symbolIndex >= 0 ? (cells[symbolIndex] ?? '').trim() : ''
      const openTime = (cells[0] ?? '').trim()
      const closeTime = (cells[6] ?? '').trim()
      const profit = parseNumber(cells[profitIndex] ?? '0')
      const isCashFlow = action.toLowerCase() === 'balance'

      if (!isCashFlow && !closeTime) {
        continue
      }

      const openTimestamp = parseMql5Timestamp(openTime)
      const closeTimestamp = parseMql5Timestamp(closeTime || openTime)

      const eventTimestamp = isCashFlow ? openTimestamp : closeTimestamp
      if (!Number.isFinite(eventTimestamp)) {
        continue
      }

      parsedRows.push({
        originalIndex: index,
        action,
        symbol,
        profit,
        durationSeconds: !isCashFlow && Number.isFinite(openTimestamp) && Number.isFinite(closeTimestamp)
          ? Math.max(0, Math.floor((closeTimestamp - openTimestamp) / 1000))
          : 0,
        eventTimestamp,
        kind: isCashFlow ? 'cashflow' : 'trade'
      })
    }
  } else {
    const typeIndex = headerMap.get('Type') ?? 1
    const symbolIndex = headerMap.get('Symbol') ?? 3
    const profitIndex = headerMap.get('Profit') ?? 11
    const commentIndex = headerMap.get('Comment') ?? -1

    for (let index = 1; index < lines.length; index += 1) {
      const line = lines[index]
      if (!line || !line.trim()) {
        continue
      }

      const cells = splitCsvLine(line, delimiter)
      const action = (cells[typeIndex] ?? '').trim()
      if (!action) {
        continue
      }

      const comment = commentIndex >= 0 ? (cells[commentIndex] ?? '').trim() : ''
      if (comment.toLowerCase().includes('cancel')) {
        continue
      }

      const symbol = symbolIndex >= 0 ? (cells[symbolIndex] ?? '').trim() : ''
      const openTime = (cells[0] ?? '').trim()
      const closeTime = (cells[7] ?? '').trim()
      const profit = parseNumber(cells[profitIndex] ?? '0')
      const isCashFlow = action.toLowerCase() === 'balance'

      if (!isCashFlow && !closeTime) {
        continue
      }

      const openTimestamp = parseMql5Timestamp(openTime)
      const closeTimestamp = parseMql5Timestamp(closeTime || openTime)
      const eventTimestamp = isCashFlow ? openTimestamp : closeTimestamp

      if (!Number.isFinite(eventTimestamp)) {
        continue
      }

      parsedRows.push({
        originalIndex: index,
        action,
        symbol,
        profit,
        durationSeconds: !isCashFlow && Number.isFinite(openTimestamp) && Number.isFinite(closeTimestamp)
          ? Math.max(0, Math.floor((closeTimestamp - openTimestamp) / 1000))
          : 0,
        eventTimestamp,
        kind: isCashFlow ? 'cashflow' : 'trade'
      })
    }
  }

  const timelineRows = parsedRows.slice().sort((left, right) => {
    if (left.eventTimestamp !== right.eventTimestamp) {
      return left.eventTimestamp - right.eventTimestamp
    }

    return left.originalIndex - right.originalIndex
  })

  const leadingCashFlowCount = sourceKind === 'myfxbook'
    ? countLeadingDeposits(timelineRows)
    : countLeadingBalanceRows(timelineRows)
  const initialDeposit = timelineRows
    .slice(0, leadingCashFlowCount)
    .reduce((sum, row) => sum + row.profit, 0)

  const timelineRowsAfterDeposit = timelineRows.slice(leadingCashFlowCount)
  const tradeRiskRewards = timelineRowsAfterDeposit
    .map((row) => row.riskReward)
    .filter((value): value is number => Number.isFinite(value))
  const symbols = [...new Set(
    timelineRowsAfterDeposit
      .map((row) => row.symbol.trim())
      .filter((symbol) => symbol.length > 0)
  )].sort((left, right) => left.localeCompare(right))

  let capital = initialDeposit
  let peakCapital = initialDeposit
  let maxDrawdownAmount = 0
  let additionalDeposits = 0
  let withdrawals = 0
  let tradeCount = 0
  let winningTrades = 0
  let grossProfit = 0
  let grossLoss = 0
  let durationTotal = 0
  let durationCount = 0
  let currentWinStreak = 0
  let currentLossStreak = 0
  let maxWinStreak = 0
  let maxLossStreak = 0
  let firstTradeTimestamp = Number.POSITIVE_INFINITY
  let lastTradeTimestamp = 0
  const equityCurve: EquityPoint[] = [{ timestamp: timelineRows[0]?.eventTimestamp ?? 0, equity: initialDeposit }]

  for (const row of timelineRowsAfterDeposit) {
    const action = row.action.toLowerCase()
    const isCashFlow = row.kind === 'cashflow'

    capital += row.profit

    if (isCashFlow) {
      if (sourceKind === 'myfxbook' ? action.includes('deposit') : action === 'balance' && row.profit > 0) {
        additionalDeposits += row.profit
      } else if (sourceKind === 'myfxbook' ? action.includes('withdrawal') : action === 'balance' && row.profit < 0) {
        withdrawals += row.profit
      }
    }

    if (!isCashFlow) {
      tradeCount += 1
      if (row.eventTimestamp < firstTradeTimestamp) {
        firstTradeTimestamp = row.eventTimestamp
      }
      if (row.eventTimestamp > lastTradeTimestamp) {
        lastTradeTimestamp = row.eventTimestamp
      }

      if (row.profit > 0) {
        grossProfit += row.profit
        winningTrades += 1
        currentWinStreak += 1
        currentLossStreak = 0
        if (currentWinStreak > maxWinStreak) {
          maxWinStreak = currentWinStreak
        }
      } else if (row.profit < 0) {
        grossLoss += Math.abs(row.profit)
        currentLossStreak += 1
        currentWinStreak = 0
        if (currentLossStreak > maxLossStreak) {
          maxLossStreak = currentLossStreak
        }
      } else {
        currentWinStreak = 0
        currentLossStreak = 0
      }

      if (row.durationSeconds > 0) {
        durationTotal += row.durationSeconds
        durationCount += 1
      }
    }

    if (capital > peakCapital) {
      peakCapital = capital
    }

    const drawdown = peakCapital - capital
    if (drawdown > maxDrawdownAmount) {
      maxDrawdownAmount = drawdown
    }

    equityCurve.push({
      timestamp: row.eventTimestamp,
      equity: capital
    })
  }

  const finalCapital = capital
  const netResult = finalCapital - initialDeposit
  const netResultPercent = initialDeposit > 0 ? (netResult / initialDeposit) * 100 : 0
  const netCashFlow = additionalDeposits + withdrawals
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0
  const avgDurationSeconds = durationCount > 0 ? durationTotal / durationCount : 0
  const maxDrawdownPercent = peakCapital > 0 ? -((maxDrawdownAmount / peakCapital) * 100) : 0
  const winRate = tradeCount > 0 ? (winningTrades / tradeCount) * 100 : 0
  const avgRiskReward = tradeRiskRewards.length ? average(tradeRiskRewards) : null

  return {
    rowsCount: parsedRows.length,
    sourceKind,
    initialDeposit,
    finalCapital,
    netResult,
    netResultPercent,
    additionalDeposits,
    withdrawals,
    netCashFlow,
    tradeCount,
    grossProfit,
    grossLoss,
    profitFactor,
    avgDurationSeconds,
    maxDrawdownAmount,
    maxDrawdownPercent,
    winRate,
    firstTradeDate: firstTradeTimestamp === Number.POSITIVE_INFINITY ? '—' : formatDate(firstTradeTimestamp),
    lastTradeDate: lastTradeTimestamp === 0 ? '—' : formatDate(lastTradeTimestamp),
    maxWinStreak,
    maxLossStreak,
    avgRiskReward,
    symbols,
    equityCurve
  }
}

function countLeadingDeposits(rows: ParsedRow[]) {
  let count = 0

  for (const row of rows) {
    const action = row.action.toLowerCase()
    if (row.kind === 'cashflow' && action.includes('deposit')) {
      count += 1
      continue
    }

    break
  }

  return count
}

function countLeadingBalanceRows(rows: ParsedRow[]) {
  let count = 0

  for (const row of rows) {
    if (row.kind === 'cashflow' && row.action.toLowerCase() === 'balance') {
      count += 1
      continue
    }

    break
  }

  return count
}

function getStatementLines(csvText: string) {
  const lines: string[] = []

  for (const line of csvText.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) {
      continue
    }

    if (isSecondaryStatementSection(trimmed)) {
      break
    }

    lines.push(line)
  }

  return lines
}

function isCashFlowAction(action: string) {
  const normalized = action.toLowerCase()
  return normalized.includes('deposit') || normalized.includes('withdrawal') || normalized === 'balance'
}

function isSecondaryStatementSection(value: string) {
  const normalized = value.toLowerCase()
  return normalized === 'open trades' || normalized === 'open orders'
}

function splitCsvLine(line: string, delimiter = ',') {
  const cells: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        quoted = !quoted
      }
      continue
    }

    if (character === delimiter && !quoted) {
      cells.push(current)
      current = ''
      continue
    }

    current += character
  }

  cells.push(current)
  return cells
}

function parseNumber(value: string) {
  const normalized = String(value).trim().replace(/\s+/g, '').replace(/,/g, '')
  if (!normalized) {
    return 0
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseDurationToSeconds(value: string) {
  const raw = String(value).trim()
  if (!raw) {
    return 0
  }

  const parts = raw.split(':').map((segment) => Number(segment))
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    return 0
  }

  const [days = 0, hours = 0, minutes = 0, seconds = 0] = parts
  return days * 86400 + hours * 3600 + minutes * 60 + seconds
}

function parseEventTimestamp(value: string) {
  const raw = String(value).trim()
  if (!raw) {
    return Number.POSITIVE_INFINITY
  }

  const [datePart = '', timePart = '00:00'] = raw.split(/\s+/)
  const [month = 0, day = 0, year = 0] = datePart.split('/').map((segment) => Number(segment))
  const [hours = 0, minutes = 0] = timePart.split(':').map((segment) => Number(segment))

  if (
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(year) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    year < 1900 ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return Number.POSITIVE_INFINITY
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime()
}

function parseMql5Timestamp(value: string) {
  const raw = String(value).trim()
  if (!raw) {
    return Number.POSITIVE_INFINITY
  }

  const match = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/)
  if (!match) {
    return Number.POSITIVE_INFINITY
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hours = Number(match[4])
  const minutes = Number(match[5])
  const seconds = Number(match[6])

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    year < 1900 ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return Number.POSITIVE_INFINITY
  }

  return new Date(year, month - 1, day, hours, minutes, seconds, 0).getTime()
}

function prettyFileLabel(file: string) {
  if (file.startsWith('/data/myfxbook/')) {
    return file.replace('/data/myfxbook/', 'myfxbook / ')
  }

  if (file.startsWith('/data/mql5/')) {
    return file.replace('/data/mql5/', 'mql5 / ')
  }

  return file.replace('/data/', '')
}

function fileGroup(file: string) {
  const relative = file
    .replace('/data/myfxbook/', '')
    .replace('/data/mql5/', '')
  const [group = 'root'] = relative.split('/')
  return group
}

function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) {
    return '∞'
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value)
}

function formatOptionalNumber(value: number | null, digits = 2) {
  return value === null ? '—' : formatNumber(value, digits)
}

function average(values: number[]) {
  if (!values.length) {
    return 0
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function median(values: number[]) {
  if (!values.length) {
    return 0
  }

  const sorted = values.slice().sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
  }

  return sorted[middle] ?? 0
}

function trimmedMean(values: number[], trimRatio: number) {
  if (!values.length) {
    return 0
  }

  const sorted = values.slice().sort((left, right) => left - right)
  const trimCount = Math.floor(sorted.length * trimRatio)
  const start = trimCount
  const end = sorted.length - trimCount
  const trimmed = start < end ? sorted.slice(start, end) : sorted

  return average(trimmed)
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  }).format(value)
}

function formatMoney(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${formatNumber(Math.abs(value), 2)}`
}

function formatSignedMoney(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${formatNumber(Math.abs(value), 2)}`
}

function formatPercent(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  return `${sign}${formatNumber(Math.abs(value), 2)}%`
}

function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '0s'
  }

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  const parts: string[] = []
  if (days > 0) {
    parts.push(`${days}d`)
  }
  if (hours > 0 || parts.length) {
    parts.push(`${hours}h`)
  }
  if (minutes > 0 || parts.length) {
    parts.push(`${minutes}m`)
  }
  if (!parts.length || seconds > 0) {
    parts.push(`${seconds}s`)
  }

  return parts.join(' ')
}

function formatDate(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return '—'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(timestamp))
}

function equityCurveLinePoints(points: EquityPoint[]) {
  return buildEquityPoints(points)
    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
    .join(' ')
}

function buildEquityPoints(points: EquityPoint[]) {
  if (!points.length) {
    return []
  }

  const equities = points.map((point) => point.equity)
  const min = Math.min(...equities)
  const max = Math.max(...equities)
  const range = max - min || 1
  const count = Math.max(points.length - 1, 1)

  return points.map((point, index) => {
    const x = (index / count) * 1000
    const normalized = (point.equity - min) / range
    const y = 300 - normalized * 260

    return { x, y }
  })
}

const StatCard = defineComponent({
  name: 'StatCard',
  props: {
    label: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    hint: {
      type: String,
      default: ''
    },
    valueClass: {
      type: String,
      default: 'text-white'
    },
    hintClass: {
      type: String,
      default: 'text-cyan-100/55'
    }
  },
  setup(props) {
    return () =>
      h(
        'div',
        {
          class:
            'rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 shadow-lg shadow-black/20 backdrop-blur-md'
        },
        [
          h('div', { class: 'text-[10px] uppercase tracking-[0.35em] text-white/35' }, props.label),
          h('div', { class: ['mt-3 text-2xl font-semibold', props.valueClass] }, props.value),
          props.hint
            ? h('div', { class: ['mt-2 text-xs leading-5', props.hintClass] }, props.hint)
            : null
        ]
      )
  }
})
</script>

<style scoped>
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* Custom Scrollbar */
.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
