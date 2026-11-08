<template>
  <section class="carousel-sec" aria-labelledby="carousel-title" tabindex="0" @keydown="handleKeydown">
    <div class="label mono">
      <span>{{ isRu ? 'Интерфейс приложения' : 'Inside the application' }}</span>
      <span class="carousel-counter">{{ pad(current + 1) }} / {{ pad(slides.length) }}</span>
    </div>

    <div class="carousel-body">
      <!-- Main view: screen and caption -->
      <div 
        class="carousel-viewport" 
        @touchstart="handleTouchStart" 
        @touchmove="handleTouchMove" 
        @touchend="handleTouchEnd"
      >
        <div class="carousel-frame">
          <transition name="carousel-fade" mode="out-in">
            <img
              :key="currentSlide.src"
              :src="currentSlide.src"
              :alt="isRu ? currentSlide.alt.ru : currentSlide.alt.en"
              width="1440"
              height="900"
              class="carousel-img"
              loading="lazy"
              decoding="async"
            />
          </transition>
        </div>

        <!-- Floating navigation arrows -->
        <button
          type="button"
          class="carousel-nav carousel-nav--prev"
          :aria-label="isRu ? 'Предыдущий скриншот' : 'Previous screenshot'"
          @click="prev"
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          type="button"
          class="carousel-nav carousel-nav--next"
          :aria-label="isRu ? 'Следующий скриншот' : 'Next screenshot'"
          @click="next"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <!-- Slide description & tabs -->
      <div class="carousel-meta">
        <div class="carousel-info">
          <h2 id="carousel-title" class="carousel-title">
            {{ isRu ? currentSlide.title.ru : currentSlide.title.en }}
          </h2>
          <p class="carousel-desc">
            {{ isRu ? currentSlide.desc.ru : currentSlide.desc.en }}
          </p>
        </div>

        <!-- Thumbnails / Selector buttons -->
        <div class="carousel-tabs" role="tablist" :aria-label="isRu ? 'Выбор скриншота' : 'Select screenshot'">
          <button
            v-for="(slide, index) in slides"
            :key="slide.src"
            type="button"
            role="tab"
            :aria-selected="current === index"
            :class="{ 'is-active': current === index }"
            class="carousel-tab"
            @click="goTo(index)"
          >
            <span class="carousel-tab__num">{{ pad(index + 1) }}</span>
            <span class="carousel-tab__label">{{ isRu ? slide.short.ru : slide.short.en }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  isRu: {
    type: Boolean,
    default: false,
  },
})

const pad = n => String(n).padStart(2, '0')

const slides = [
  {
    src: '/dev/demo/1.png',
    short: { en: 'Journal', ru: 'Журнал' },
    title: {
      en: 'Trade Log & Execution Review',
      ru: 'Журнал сделок и разбор исполнений',
    },
    desc: {
      en: 'Complete trade list with P/L, win rate, assets, session tags and execution notes in one unified view.',
      ru: 'Полный журнал сделок с P/L, винрейтом, активами, тегами сессий и заметками в едином интерфейсе.',
    },
    alt: {
      en: 'JORU trade journal list view with performance overview',
      ru: 'Журнал сделок JORU: список ордеров и сводка результатов',
    },
  },
  {
    src: '/dev/demo/2.png',
    short: { en: 'Replay', ru: 'Реплей' },
    title: {
      en: 'Candlestick Chart Replay',
      ru: 'Реплей сделки на свечном графике',
    },
    desc: {
      en: 'Inspect planned setups, entry executions, stop-loss, take-profit and actual exit points directly on price candles.',
      ru: 'Воспроизведение точек входа, стоп-лосса, тейк-профита и фактического выхода прямо на японских свечах.',
    },
    alt: {
      en: 'Candlestick chart replay with execution annotations in JORU',
      ru: 'Свечной график цен с точками входа и выхода в JORU',
    },
  },
  {
    src: '/dev/demo/3.png',
    short: { en: 'Karl-Nikolai', ru: 'Karl-Nikolai' },
    title: {
      en: 'Karl-Nikolai I Pattern Detector',
      ru: 'Детектив привычек Karl-Nikolai I',
    },
    desc: {
      en: 'Pinpoint quiet, costly habits across your trading history and calculate their exact dollar impact on results.',
      ru: 'Поиск скрытых убыточных привычек в истории сделок с расчётом их точного влияния на общий капитал.',
    },
    alt: {
      en: 'Karl-Nikolai I pattern investigation screen in JORU',
      ru: 'Экран расследования убыточных паттернов Karl-Nikolai I',
    },
  },
  {
    src: '/dev/demo/4.png',
    short: { en: 'Matrix', ru: 'Матрица' },
    title: {
      en: 'Genesis Matrix Strategy Modeling',
      ru: 'Матрица стратегии Genesis',
    },
    desc: {
      en: 'Map your trading strategy as a visual graph of condition nodes, each tracking its occurrence rate and profit factor.',
      ru: 'Описание правил стратегии в виде графа условий, где каждый узел отражает частоту и профит-фактор.',
    },
    alt: {
      en: 'Genesis Matrix visual strategy node graph in JORU',
      ru: 'Карта стратегии Genesis Matrix с узлами условий в JORU',
    },
  },
  {
    src: '/dev/demo/5.png',
    short: { en: 'Monte Carlo', ru: 'Монте-Карло' },
    title: {
      en: 'Monte Carlo Risk Simulation',
      ru: 'Симуляция риска методом Монте-Карло',
    },
    desc: {
      en: 'Stress-test your edge with 300 randomized order paths to evaluate worst-case drawdowns and survival probability.',
      ru: 'Стресс-тест торгового преимущества: 300 случайных перестановок сделок для оценки риска просадки.',
    },
    alt: {
      en: 'Monte Carlo simulation equity curves in JORU',
      ru: 'Симуляция Монте-Карло с путями капитала в JORU',
    },
  },
  {
    src: '/dev/demo/6.png',
    short: { en: 'Metrics', ru: 'Метрики' },
    title: {
      en: '31 Performance & Behavior Metrics',
      ru: '31 глубокая метрика торговли',
    },
    desc: {
      en: 'Comprehensive metrics across 5 groups: matrix adherence, behavior, execution and risk, strategy and in-trade stats.',
      ru: 'Метрики в пяти ключевых группах: соблюдение правил, психология, исполнение, риск и внутрисделочный анализ.',
    },
    alt: {
      en: 'Detailed performance metrics grid in JORU',
      ru: 'Сетка подробных показателей и метрик торговли в JORU',
    },
  },
  {
    src: '/dev/demo/7.png',
    short: { en: 'Reports', ru: 'Отчёты' },
    title: {
      en: 'Comprehensive Trading Reports',
      ru: 'Торговые отчёты и распределение',
    },
    desc: {
      en: 'Inspect profit/loss distributions, drawdowns, results by trading session and asset performance in one place.',
      ru: 'Анализ распределения прибылей и убытков, просадок, результатов по торговым сессиям и активам.',
    },
    alt: {
      en: 'Comprehensive trading report analytics in JORU',
      ru: 'Комплексная аналитика и отчёты по сделкам в JORU',
    },
  },
]

const current = ref(0)
const currentSlide = computed(() => slides[current.value])

const prev = () => {
  current.value = (current.value - 1 + slides.length) % slides.length
}

const next = () => {
  current.value = (current.value + 1) % slides.length
}

const goTo = index => {
  current.value = index
}

const handleKeydown = e => {
  if (e.key === 'ArrowLeft') {
    prev()
  } else if (e.key === 'ArrowRight') {
    next()
  }
}

let touchStartX = 0
let touchEndX = 0

const handleTouchStart = e => {
  touchStartX = e.changedTouches[0].clientX
}

const handleTouchMove = e => {
  touchEndX = e.changedTouches[0].clientX
}

const handleTouchEnd = () => {
  const diff = touchEndX - touchStartX
  if (Math.abs(diff) > 40) {
    if (diff > 0) prev()
    else next()
  }
  touchStartX = 0
  touchEndX = 0
}
</script>

<style scoped>
.carousel-sec {
  border-bottom: 2px solid #000;
  background: #fff;
  color: #000;
  outline: none;
}
.carousel-counter {
  font-family: var(--mono, monospace);
  font-size: 12px;
  letter-spacing: 0.05em;
}
.carousel-body {
  padding: clamp(20px, 3cqw, 40px) var(--edge, clamp(14px, 1.6cqw, 24px));
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.carousel-viewport {
  position: relative;
  width: 100%;
}
.carousel-frame {
  width: 100%;
  aspect-ratio: 1440 / 900;
  border: 2px solid #000;
  background: #000;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}
.carousel-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

/* Slide Transition */
.carousel-fade-enter-active,
.carousel-fade-leave-active {
  transition: opacity 0.25s ease;
}
.carousel-fade-enter-from,
.carousel-fade-leave-to {
  opacity: 0;
}

/* Nav buttons */
.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background: #fff;
  color: #000;
  border: 2px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--mono, monospace);
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, transform 0.12s;
  z-index: 2;
  user-select: none;
}
.carousel-nav:hover {
  background: #000;
  color: #fff;
}
.carousel-nav--prev {
  left: 12px;
}
.carousel-nav--next {
  right: 12px;
}
.carousel-nav:active {
  transform: translateY(-50%) scale(0.95);
}

/* Meta below image */
.carousel-meta {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.carousel-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.carousel-title {
  margin: 0;
  font-weight: 800;
  font-size: clamp(20px, 2.2cqw, 32px);
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.carousel-desc {
  margin: 0;
  font-size: clamp(14px, 1.15cqw, 17px);
  line-height: 1.35;
  opacity: 0.82;
  max-width: 65ch;
}

/* Tab bar */
.carousel-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}
.carousel-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 2px solid #000;
  background: transparent;
  color: #000;
  font-family: var(--mono, monospace);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transition: background 0.1s, color 0.1s, border-color 0.1s;
}
.carousel-tab:hover {
  background: rgba(0, 0, 0, 0.05);
}
.carousel-tab.is-active {
  background: #000;
  color: #fff;
}
.carousel-tab__num {
  font-weight: 700;
  opacity: 0.6;
}
.carousel-tab.is-active .carousel-tab__num {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .carousel-nav {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }
  .carousel-nav--prev {
    left: 8px;
  }
  .carousel-nav--next {
    right: 8px;
  }
  .carousel-tabs {
    gap: 6px;
  }
  .carousel-tab {
    padding: 6px 10px;
    font-size: 11px;
  }
}
</style>
