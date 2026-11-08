<template>
  <section ref="carouselEl" class="carousel-strip" aria-label="Application screenshots">
    <div class="carousel-strip__header">
      <div class="carousel-strip__nav">
        <button
          type="button"
          class="btn-arrow"
          :aria-label="isRu ? 'Предыдущий скриншот' : 'Previous screenshot'"
          @click="scrollPrev"
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          type="button"
          class="btn-arrow"
          :aria-label="isRu ? 'Следующий скриншот' : 'Next screenshot'"
          @click="scrollNext"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>

    <!-- Multi-screenshot horizontal track -->
    <div ref="trackEl" class="carousel-track">
      <figure
        v-for="(slide, index) in slides"
        :key="slide.src"
        class="shot-card"
        :class="{ 'is-in': isRevealed }"
        :style="{ '--i': index }"
      >
        <div class="shot-card__frame">
          <img
            :src="slide.src"
            :alt="isRu ? slide.alt.ru : slide.alt.en"
            width="1440"
            height="900"
            class="shot-card__img"
            loading="lazy"
            decoding="async"
          />
        </div>
        <figcaption class="shot-card__cap">
          <span class="shot-card__num">{{ isRu ? 'Рис.' : 'Fig.' }} {{ index + 1 }}</span>
          <span class="shot-card__sep">—</span>
          <span class="shot-card__title">{{ isRu ? slide.title.ru : slide.title.en }}</span>
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  isRu: {
    type: Boolean,
    default: false,
  },
})

const slides = [
  {
    src: '/dev/demo/1.png',
    title: {
      en: 'Equity Curve',
      ru: 'Кривая капитала',
    },
    alt: {
      en: 'Equity curve in JORU trading journal',
      ru: 'Кривая капитала в торговом журнале JORU',
    },
  },
  {
    src: '/dev/demo/2.png',
    title: {
      en: 'Risk & Execution Report',
      ru: 'Отчёт по риску и исполнению',
    },
    alt: {
      en: 'Risk & execution report in JORU',
      ru: 'Отчёт по риску и исполнению в JORU',
    },
  },
  {
    src: '/dev/demo/3.png',
    title: {
      en: 'Profits & Losses Report',
      ru: 'Отчёт по прибыли и убыткам',
    },
    alt: {
      en: 'Profits & losses report in JORU',
      ru: 'Отчёт по прибыли и убыткам в JORU',
    },
  },
  {
    src: '/dev/demo/4.png',
    title: {
      en: 'Scenarios & Conditions Report',
      ru: 'Отчёт по сценариям и условиям',
    },
    alt: {
      en: 'Scenarios & conditions report in JORU',
      ru: 'Отчёт по сценариям и условиям в JORU',
    },
  },
  {
    src: '/dev/demo/5.png',
    title: {
      en: 'In-Trade Metrics',
      ru: 'Внутрисделочные метрики',
    },
    alt: {
      en: 'In-trade metrics in JORU',
      ru: 'Внутрисделочные метрики в JORU',
    },
  },
  {
    src: '/dev/demo/6.png',
    title: {
      en: 'Strategy Execution',
      ru: 'Исполнение стратегии',
    },
    alt: {
      en: 'Strategy execution in JORU',
      ru: 'Исполнение стратегии в JORU',
    },
  },
  {
    src: '/dev/demo/7.png',
    title: {
      en: 'X-Ray Equity Analysis',
      ru: 'Рентген-анализ капитала X-Ray',
    },
    alt: {
      en: 'X-Ray equity analysis in JORU',
      ru: 'Рентген-анализ капитала X-Ray в JORU',
    },
  },
]

const carouselEl = ref(null)
const trackEl = ref(null)
const isRevealed = ref(false)
let observer = null

const scrollPrev = () => {
  if (!trackEl.value) return
  const firstCard = trackEl.value.querySelector('.shot-card')
  const step = (firstCard ? firstCard.offsetWidth : 420) + 20
  trackEl.value.scrollBy({ left: -step, behavior: 'smooth' })
}

const scrollNext = () => {
  if (!trackEl.value) return
  const firstCard = trackEl.value.querySelector('.shot-card')
  const step = (firstCard ? firstCard.offsetWidth : 420) + 20
  trackEl.value.scrollBy({ left: step, behavior: 'smooth' })
}

onMounted(() => {
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isRevealed.value = true
          observer?.disconnect()
        }
      })
    }, { threshold: 0.15 })

    if (carouselEl.value) {
      observer.observe(carouselEl.value)
    }
  } else {
    isRevealed.value = true
  }

  // Fallback timer ensures reveal triggers even if scroll is missed
  setTimeout(() => {
    isRevealed.value = true
  }, 400)
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.carousel-strip {
  --edge: clamp(20px, 3cqw, 48px);
  --gut: clamp(20px, 2.5cqw, 36px);
  border-bottom: 2px solid #000;
  background: #fff;
  color: #000;
  padding-top: clamp(20px, 3cqw, 40px);
  position: relative;
  overflow: hidden;
}

.carousel-strip__header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 var(--edge) clamp(16px, 2cqw, 24px);
}

.carousel-strip__nav {
  display: inline-flex;
  gap: 8px;
}

.btn-arrow {
  width: 44px;
  height: 44px;
  background: #fff;
  color: #000;
  border: 2px solid #000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--mono, 'JetBrains Mono', monospace);
  font-size: 19px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, transform 0.1s;
  user-select: none;
}

.btn-arrow:hover {
  background: #000;
  color: #fff;
}

.btn-arrow:active {
  transform: scale(0.93);
}

/* ── Horizontal Track showing multiple screenshots ── */
.carousel-track {
  display: flex;
  gap: var(--gut);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: var(--edge);
  scroll-padding-left: var(--edge);
  scroll-padding-right: var(--edge);
  padding: 16px var(--edge) clamp(32px, 4.5cqw, 56px);
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.carousel-track::-webkit-scrollbar {
  display: none;
}

.carousel-track::after {
  content: '';
  flex: 0 0 1px;
  margin-right: calc(var(--edge) - var(--gut));
}

/* ── Screenshot Card with 3D Tilt and Curtain Wipe Reveal ── */
.shot-card {
  margin: 0;
  flex: 0 0 clamp(300px, 40cqw, 520px);
  scroll-snap-align: start;
  scroll-margin-left: var(--edge);
  perspective: 1600px;
  position: relative;
  display: flex;
  flex-direction: column;
}

.shot-card__frame {
  width: 100%;
  position: relative;
}

.shot-card__img {
  display: block;
  width: 100%;
  height: auto;
  border: 2px solid #000;
  background: #000;
  transform-origin: 50% 0;
  transform: rotateX(12deg);
  box-shadow: 0 28px 56px -18px rgba(0, 0, 0, 0.22), 0 10px 20px -10px rgba(0, 0, 0, 0.1);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  clip-path: inset(0 100% 0 0);
  transition: 
    clip-path 0.9s cubic-bezier(0.7, 0, 0.2, 1) calc(var(--i) * 110ms),
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, clip-path;
}

.shot-card.is-in .shot-card__img {
  clip-path: inset(0 0 0 0);
}

.shot-card:hover .shot-card__img {
  transform: rotateX(0deg) translateY(-4px);
  box-shadow: 0 38px 70px -18px rgba(0, 0, 0, 0.32), 0 12px 24px -8px rgba(0, 0, 0, 0.15);
}

.shot-card__cap {
  margin-top: 14px;
  font-family: var(--mono, 'JetBrains Mono', monospace);
  font-size: 13px;
  line-height: 1.3;
  color: rgba(0, 0, 0, 0.6);
  display: flex;
  gap: 8px;
  align-items: baseline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shot-card__num {
  font-weight: 700;
  color: #000;
}

.shot-card__sep {
  opacity: 0.35;
}

.shot-card__title {
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (prefers-reduced-motion: reduce) {
  .shot-card__img {
    transform: none !important;
    clip-path: none !important;
    transition: none !important;
  }
}

@media (max-width: 768px) {
  .shot-card {
    flex: 0 0 82vw;
  }
  .btn-arrow {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }
}
</style>
