<template>
  <section class="video-showcase" aria-label="Product video showcase">
    <div class="video-showcase__selector" role="group" :aria-label="t('landing.videoShowcase.selector')">
      <button
        v-for="(video, index) in videos"
        :key="video.id"
        type="button"
        :aria-pressed="activeVideo === index"
        :class="{ active: activeVideo === index }"
        @click="selectVideo(index)"
      >
        <svg v-if="video.id === 'matrix'" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" />
          <rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" />
        </svg>
        <svg v-else-if="video.id === 'equity'" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 18 9 12l4 3 7-9" /><path d="M4 20h16" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 6h14M5 12h14M5 18h9" /><circle cx="3" cy="6" r=".75" fill="currentColor" /><circle cx="3" cy="12" r=".75" fill="currentColor" /><circle cx="3" cy="18" r=".75" fill="currentColor" />
        </svg>
        <span>{{ t(video.labelKey) }}</span>
      </button>
    </div>

    <div class="video-showcase__frame">
      <Transition name="video-fade" mode="out-in">
        <video
          :key="selectedVideo.src"
          class="video-showcase__video"
          :src="selectedVideo.src"
          autoplay
          muted
          loop
          playsinline
          disablepictureinpicture
          disableremoteplayback
          controlslist="nodownload nofullscreen noremoteplayback"
          tabindex="-1"
          preload="metadata"
          :aria-label="`${selectedVideo.label} product video`"
          @contextmenu.prevent
        />
      </Transition>
    </div>
    <p class="video-showcase__caption">{{ selectedVideo.caption }}</p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '../shared/i18n/useI18n'

const { t } = useI18n()

const videos = [
  { id: 'log', label: 'LOG', labelKey: 'landing.features.tradesTree.title', captionKey: 'landing.videoShowcase.log', src: '/assets/videos/log.mov' },
  { id: 'equity', label: 'EQUITY', labelKey: 'landing.features.equity.title', captionKey: 'landing.videoShowcase.equity', src: '/assets/videos/equity.mov' },
  { id: 'matrix', label: 'MATRIX', labelKey: 'landing.features.genesis.title', captionKey: 'landing.videoShowcase.matrix', src: '/assets/videos/matrix.mov' },
]

const activeVideo = ref(0)
const selectedVideo = computed(() => ({ ...videos[activeVideo.value], caption: t(videos[activeVideo.value].captionKey) }))

function selectVideo(index) {
  activeVideo.value = index
}
</script>

<style scoped>
.video-showcase { --ink: #050505; --paper: #f4f3ee; width: 100%; color: var(--paper); }
.video-showcase__selector { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.video-showcase__selector button { display: flex; gap: 10px; align-items: center; min-height: 44px; padding: 10px 16px; color: rgba(255,255,255,.7); background: #000; border: 1px solid rgba(255,255,255,.25); cursor: pointer; font: .8rem/1.5 ui-sans-serif, system-ui, sans-serif; transition: color .3s, border-color .3s, background .3s; }
.video-showcase__selector button:focus-visible { outline: 2px solid #f5f5f0; outline-offset: 3px; }
.video-showcase__selector button:hover { color: #fff; border-color: rgba(255,255,255,.55); transform: translateY(-2px); }
.video-showcase__selector button.active { color: #000; background: var(--paper); border-color: var(--paper); }
.video-showcase__selector svg { width: 20px; height: 20px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.3; }
.video-showcase__frame { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: #000; border: 1px solid rgba(255,255,255,.18); box-shadow: 0 28px 70px rgba(0,0,0,.18); }
.video-showcase__video { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; user-select: none; }
.video-showcase__caption { max-width: 760px; margin: 20px 0 0; color: rgba(255,255,255,.7); font: 400 1rem/1.6 ui-sans-serif, system-ui, sans-serif; }
.video-fade-enter-active, .video-fade-leave-active { transition: opacity .25s ease; }
.video-fade-enter-from, .video-fade-leave-to { opacity: 0; }
@media (max-width: 640px) {
  .video-showcase__selector button { padding: 10px; font-size: .75rem; }
  .video-showcase__caption { font-size: 16px; }
}
</style>
