<template>
  <div class="home-details" :lang="locale">
    <section id="demo" class="home-block" aria-labelledby="demo-title">
      <header class="section-intro">
        <h2 id="demo-title">{{ copy.videoTitle }}</h2>
        <p>{{ copy.videoIntro }}</p>
      </header>
      <VideoShowcase />
      <div class="integrations">
        <h3>{{ copy.integrations }}</h3>
        <ul><li v-for="name in platforms" :key="name">{{ name }}</li></ul>
      </div>
    </section>
    <section class="home-block community" aria-labelledby="community-title">
      <header class="section-intro">
        <h2 id="community-title">{{ copy.communityTitle }}</h2>
        <p>{{ copy.communityIntro }}</p>
      </header>
      <div class="community-grid">
        <article v-for="(item, index) in copy.community" :key="item.eyebrow" class="community-card">
          <img :src="communityImages[index]" :alt="item.title" loading="lazy" decoding="async" width="1440" height="900" />
          <div class="community-copy">
            <span>{{ item.eyebrow }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </div>
        </article>
      </div>
    </section>
    <section class="home-block final-cta" aria-labelledby="start-title">
      <h2 id="start-title">{{ copy.finalTitle }}</h2>
      <p>{{ copy.finalText }}</p>
      <div class="final-cta__actions">
        <router-link to="/download" class="action">{{ copy.download }} <span aria-hidden="true">↓</span></router-link>
        <router-link to="/pricing" class="text-link">{{ copy.pricingDetails }} ↗</router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VideoShowcase from './VideoShowcase.vue'
import { useI18n } from '../shared/i18n/useI18n'
import { homeContent } from '../shared/i18n/homeContent'

const { locale } = useI18n()
const copy = computed(() => homeContent[locale.value] || homeContent.en)
const platforms = ['MetaTrader 5', 'Bybit', 'Binance', 'Kraken', 'Interactive Brokers']
const communityImages = ['/screenshots/event.png', '/screenshots/forum.png']
</script>

<style scoped>
.home-details { position: relative; z-index: 10; color: #f5f5f0; font-family: 'Cormorant Garamond', serif; }
.home-block { width: min(100%, 1280px); padding: clamp(40px, 6vw, 80px) 40px; margin: 0 auto; scroll-margin-top: 80px; }
.section-intro { max-width: 800px; margin-bottom: 40px; }
h2 { font-size: clamp(2.1rem, 4vw, 3.6rem); font-weight: 300; line-height: 1.1; }
h3 { font-size: clamp(1.8rem, 3vw, 2.6rem); font-weight: 300; line-height: 1.15; }
p { font-family: ui-sans-serif, system-ui, sans-serif; font-size: .98rem; line-height: 1.65; color: rgba(245,245,240,.65); }
.section-intro p, .final-cta p { margin-top: 20px; max-width: 650px; }
.integrations { padding: 22px 0; margin-top: 28px; border-top: 1px solid #ffffff1f; border-bottom: 1px solid #ffffff1f; }
.integrations h3 { color: rgba(245,245,240,.42); font: .66rem/1.4 ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; }
.integrations ul { display: flex; flex-wrap: wrap; gap: 8px 0; margin: 14px 0 10px; padding: 0; list-style: none; color: rgba(245,245,240,.72); font: .8rem/1.4 ui-sans-serif, system-ui, sans-serif; }
.integrations li { display: flex; align-items: center; }
.integrations li:not(:last-child)::after { width: 1px; height: 12px; margin: 0 14px; background: rgba(255,255,255,.2); content: ''; }
.community-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.community-card { min-width: 0; border: 1px solid #ffffff30; overflow: hidden; }
.community-card img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-bottom: 1px solid #ffffff30; }
.community-copy { padding: clamp(24px, 3vw, 36px); }
.community-copy > span { display: block; margin-bottom: 18px; color: rgba(245,245,240,.42); font: .66rem/1.4 ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; }
.community-copy h3 { font-size: clamp(1.8rem, 3vw, 2.6rem); }
.community-copy p { margin-top: 16px; }
.action { display: inline-flex; align-items: center; justify-content: space-between; gap: 24px; padding: 15px 20px; border: 1px solid currentColor; font: .8rem/1.5 ui-monospace, monospace; }
.action:hover { opacity: .8; }
.final-cta { border-top: 1px solid #ffffff24; }
.final-cta__actions { display: flex; flex-direction: column; align-items: flex-start; }
.final-cta .action { margin-top: 28px; background: #f5f5f0; color: #000; border-color: #f5f5f0; }
.text-link { display: inline-block; margin-top: 20px; text-decoration: underline; text-underline-offset: 5px; font: .9rem/1.6 ui-sans-serif, system-ui, sans-serif; color: rgba(245,245,240,.72); transition: color 150ms ease; }
.text-link:hover { color: #fff; }
a:focus-visible { outline: 2px solid currentColor; outline-offset: 5px; }
@media (max-width: 700px) {
  .home-block { padding: 36px 24px; }
  .community-grid { grid-template-columns: 1fr; }
}
</style>
