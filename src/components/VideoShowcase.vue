<template>
  <section class="video-showcase" aria-label="Product video showcase">
    <div class="video-showcase__selector" role="tablist" aria-label="Choose a product video">
      <button
        v-for="(video, index) in videos"
        :key="video.id"
        type="button"
        role="tab"
        :aria-selected="activeVideo === index"
        :aria-label="`Play ${video.label} video`"
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
          preload="metadata"
          :aria-label="`${selectedVideo.label} product video`"
        />
      </Transition>
      <div class="video-showcase__meta">
        <span class="video-showcase__caption">{{ selectedVideo.caption }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '../shared/i18n/useI18n'

const { t } = useI18n()

const videos = [
  { id: 'equity', label: 'EQUITY', description: 'Performance, reified', captionKey: 'landing.videoShowcase.equity', src: '/assets/videos/equity.mov' },
  { id: 'matrix', label: 'MATRIX', description: 'Strategy architecture', captionKey: 'landing.videoShowcase.matrix', src: '/assets/videos/matrix.mov' },
  { id: 'log', label: 'LOG', description: 'Every decision recorded', captionKey: 'landing.videoShowcase.log', src: '/assets/videos/log.mov' },
]

const activeVideo = ref(0)
const selectedVideo = computed(() => ({ ...videos[activeVideo.value], caption: t(videos[activeVideo.value].captionKey) }))

function selectVideo(index) {
  activeVideo.value = index
}
</script>

<style scoped>
.video-showcase { --ink: #050505; --paper: #f4f3ee; width: 100%; color: var(--paper); }
.video-showcase__selector { display: grid; grid-template-columns: repeat(3, 44px); gap: 4px; width: max-content; margin: 0 auto 12px; padding: 4px; background: #000; border: 1px solid rgba(255,255,255,.2); }
.video-showcase__selector button { display: grid; width: 44px; height: 44px; place-items: center; padding: 0; color: rgba(255,255,255,.6); background: #000; border: 1px solid rgba(255,255,255,.18); cursor: pointer; transition: color .3s, border-color .3s, background .3s, transform .3s; }
.video-showcase__selector button:hover { color: #fff; border-color: rgba(255,255,255,.55); transform: translateY(-2px); }
.video-showcase__selector button.active { color: #000; background: var(--paper); border-color: var(--paper); }
.video-showcase__selector svg { width: 20px; height: 20px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.3; }
.video-showcase__frame { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: #000; border: 1px solid rgba(255,255,255,.18); box-shadow: 0 28px 70px rgba(0,0,0,.18); }
.video-showcase__video { display: block; width: 100%; height: 100%; object-fit: cover; }
.video-showcase__meta { position: absolute; right: 0; bottom: 0; left: 0; display: flex; flex-direction: column; padding: 84px 20px 22px; color: #fff; background: linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.62) 34%, transparent 100%); }
.video-showcase__caption { max-width: 660px; color: #fff; font: 400 clamp(16px, 2vw, 24px)/1.15 'Cormorant Garamond', serif; letter-spacing: .01em; }
.video-fade-enter-active, .video-fade-leave-active { transition: opacity .25s ease; }
.video-fade-enter-from, .video-fade-leave-to { opacity: 0; }
@media (max-width: 640px) {
  .video-showcase__selector { grid-template-columns: repeat(3, 40px); }
  .video-showcase__selector button { width: 40px; height: 40px; }
  .video-showcase__meta { padding: 58px 14px 14px; }
  .video-showcase__caption { font-size: 16px; }
}
</style>
