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
    <section class="home-block" aria-labelledby="plans-title">
      <header class="section-intro">
        <h2 id="plans-title">{{ copy.plansTitle }}</h2>
        <p>{{ copy.plansIntro }}</p>
      </header>
      <div class="pricing-grid">
        <article class="pricing-card">
          <div class="pricing-card__topline">{{ t('landing.pricing.free.eyebrow') }}</div>
          <h3>{{ t('landing.pricing.free.name') }}</h3>
          <p class="pricing-card__description">{{ t('landing.pricing.free.description') }}</p>
          <div class="pricing-card__price">
            <strong>{{ t('landing.pricing.free.price') }}</strong>
            <span>{{ t('landing.pricing.free.period') }}</span>
          </div>
          <router-link to="/download" class="pricing-card__action">
            {{ t('landing.pricing.free.cta') }} <span aria-hidden="true">↗</span>
          </router-link>
          <div class="pricing-card__divider"></div>
          <p class="pricing-card__includes">{{ t('landing.pricing.free.includes') }}</p>
          <ul class="pricing-card__features">
            <li v-for="feature in freeFeatures" :key="feature.title">
              <span class="pricing-card__check" aria-hidden="true">✓</span>
              <div>
                <strong>{{ feature.title }}</strong>
                <small>{{ feature.desc }}</small>
              </div>
            </li>
          </ul>
        </article>

        <article class="pricing-card pricing-card--featured">
          <div class="pricing-card__topline">{{ t('landing.pricing.full.eyebrow') }}</div>
          <h3>{{ t('landing.pricing.full.name') }}</h3>
          <p class="pricing-card__description">{{ t('landing.pricing.full.description') }}</p>
          <div class="pricing-card__price">
            <strong>{{ t('landing.pricing.full.price') }}</strong>
            <span>{{ t('landing.pricing.full.period') }}</span>
          </div>
          <a href="https://www.patreon.com/checkout/jlgandr?rid=28845652" target="_blank" rel="noreferrer" class="pricing-card__action">
            {{ t('landing.pricing.full.cta') }} <span aria-hidden="true">↗</span>
          </a>
          <router-link to="/download" class="pricing-existing">{{ t('landing.downloadPage.alreadySubscribed') }}</router-link>
          <div class="pricing-card__divider"></div>
          <p class="pricing-card__includes">{{ t('landing.pricing.full.includes') }}</p>
          <ul class="pricing-card__features">
            <li v-for="feature in fullFeatures" :key="feature.title">
              <span class="pricing-card__check" aria-hidden="true">✓</span>
              <div>
                <strong>{{ feature.title }}</strong>
                <small>{{ feature.desc }}</small>
              </div>
            </li>
          </ul>
        </article>
      </div>
      <p class="pricing-note">{{ t('landing.pricing.note') }}</p>
      <router-link class="text-link" to="/pricing">{{ copy.compare }} ↗</router-link>
    </section>
    <section class="home-block final-cta" aria-labelledby="start-title">
      <h2 id="start-title">{{ copy.finalTitle }}</h2>
      <p>{{ copy.finalText }}</p>
      <router-link to="/download" class="action">{{ copy.download }} <span aria-hidden="true">↓</span></router-link>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VideoShowcase from './VideoShowcase.vue'
import { useI18n } from '../shared/i18n/useI18n'
import { homeContent } from '../shared/i18n/homeContent'

const { t, tm, locale } = useI18n()
const copy = computed(() => homeContent[locale.value] || homeContent.en)
const freeFeatures = computed(() => tm('landing.pricing.free.features'))
const fullFeatures = computed(() => tm('landing.pricing.full.features'))
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
.pricing-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: min(100%, 1060px); gap: 18px; margin: 0 auto; }
.pricing-card { display: flex; padding: clamp(30px, 3.2vw, 42px); border: 1px solid rgba(255,255,255,.18); flex-direction: column; background: #000; color: #f5f5f0; }
.pricing-card--featured { border-color: #f5f5f0; background: #f5f5f0; color: #000; }
.pricing-card__topline { display: block; width: max-content; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .61rem; font-weight: 400; letter-spacing: .14em; opacity: .42; text-transform: uppercase; }
.pricing-card h3 { margin-top: 27px; font-size: clamp(2.5rem, 4vw, 4rem); font-weight: 300; letter-spacing: .01em; line-height: .95; }
.pricing-card__description { max-width: 450px; min-height: 72px; margin-top: 15px; color: inherit; font-size: .92rem; line-height: 1.55; opacity: .62; }
.pricing-card__price { display: flex; min-height: 48px; margin-top: 22px; align-items: baseline; gap: 7px; }
.pricing-card__price strong { font-size: clamp(2.35rem, 3.4vw, 3.2rem); font-weight: 400; letter-spacing: -.03em; line-height: 1; }
.pricing-card__price span { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .84rem; opacity: .52; }
.pricing-card__action { display: flex; width: max-content; min-height: 42px; margin-top: 24px; padding: 0 18px; border: 1px solid rgba(255,255,255,.24); align-items: center; gap: 16px; color: #f5f5f0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .78rem; letter-spacing: .1em; text-transform: uppercase; transition: background 180ms ease, color 180ms ease; }
.pricing-card__action:hover { background: rgba(255,255,255,.08); }
.pricing-card--featured .pricing-card__action { border-color: #000; background: #000; color: #f5f5f0; }
.pricing-card--featured .pricing-card__action:hover { background: #242424; }
.pricing-card__action span { font-size: .95rem; }
.pricing-existing { margin-top: 16px; font-family: ui-sans-serif, system-ui, sans-serif; font-size: .8rem; text-decoration: underline; text-underline-offset: 4px; }
.pricing-card__divider { margin: 31px 0 24px; border-top: 1px solid currentColor; opacity: .18; }
.pricing-card__includes { color: inherit; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .78rem; font-weight: 400; letter-spacing: .08em; opacity: .44; text-transform: uppercase; }
.pricing-card__features { display: grid; gap: 17px; margin: 22px 0 0; padding: 0; list-style: none; }
.pricing-card__features li { display: grid; grid-template-columns: 18px 1fr; gap: 12px; align-items: start; }
.pricing-card__check { padding-top: 2px; font-size: .75rem; opacity: .48; }
.pricing-card__features strong, .pricing-card__features small { display: block; font-family: ui-sans-serif, system-ui, sans-serif; }
.pricing-card__features strong { font-size: .88rem; font-weight: 550; line-height: 1.3; }
.pricing-card__features small { margin-top: 4px; font-size: .76rem; line-height: 1.45; opacity: .5; }
.pricing-note { width: min(100%, 1060px); margin: 20px auto 0; color: rgba(255,255,255,.36); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .58rem; letter-spacing: .08em; text-align: center; text-transform: uppercase; }
.action { display: inline-flex; align-items: center; justify-content: space-between; gap: 24px; padding: 15px 20px; border: 1px solid currentColor; font: .8rem/1.5 ui-monospace, monospace; }
.action:hover { opacity: .8; }
.text-link { display: inline-block; margin-top: 24px; text-decoration: underline; text-underline-offset: 5px; font: .9rem/1.6 ui-sans-serif, system-ui, sans-serif; }
.final-cta { border-top: 1px solid #ffffff24; }
.final-cta .action { margin-top: 28px; background: #f5f5f0; color: #000; border-color: #f5f5f0; }
a:focus-visible { outline: 2px solid currentColor; outline-offset: 5px; }
@media (max-width: 700px) {
  .home-block { padding: 36px 24px; }
  .pricing-grid { grid-template-columns: 1fr; }
  .pricing-card { padding: 28px 24px 34px; }
  .pricing-card__description { min-height: auto; }
  .community-grid { grid-template-columns: 1fr; }
}
</style>
