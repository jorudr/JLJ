<template>
  <div class="content-page relative min-h-screen bg-black text-white/80">
    <PageGradflowBackground />
    <div class="content-shell relative z-[1] mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
      <SiteNav :always-dark="true" />

      <main class="content-main flex-1" aria-labelledby="content-title" :lang="locale">
        <header class="content-intro">
          <span class="content-eyebrow">{{ locale === 'ru' ? 'Руководство' : 'Guide' }}</span>
          <router-link class="content-language" :to="counterpart" :hreflang="locale === 'ru' ? 'en' : 'ru'">{{ locale === 'ru' ? 'English' : 'Русский' }}</router-link>
          <h1 id="content-title">{{ title }}</h1>
          <p v-if="subtitle">{{ subtitle }}</p>
        </header>

        <article class="content-body" v-html="html"></article>

        <nav class="content-cta" :aria-label="locale === 'ru' ? 'Дальнейшие шаги' : 'Next steps'">
          <router-link to="/download" class="content-cta__link">{{ locale === 'ru' ? 'Скачать JORU' : 'Download JORU' }} ↗</router-link>
          <router-link to="/pricing" class="content-cta__link">{{ locale === 'ru' ? 'Сравнить тарифы' : 'Compare plans' }} ↗</router-link>
        </nav>
      </main>

      <AppFooter hide-hero />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../shared/i18n/useI18n'
import SiteNav from './SiteNav.vue'
import AppFooter from './AppFooter.vue'
import PageGradflowBackground from './PageGradflowBackground.vue'
import { renderMarkdown } from '../shared/legal/renderMarkdown'

const props = defineProps({
  path: { type: String, required: true },
  doc: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  titleRu: { type: String, required: true },
  subtitleRu: { type: String, default: '' },
})
const { locale } = useI18n()
const counterpart = computed(() => locale.value === 'ru' ? props.path : `/ru${props.path}`)
const title = computed(() => locale.value === 'ru' ? props.titleRu : props.title)
const subtitle = computed(() => locale.value === 'ru' ? props.subtitleRu : props.subtitle)

const sources = import.meta.glob('../shared/content/*.md', { query: '?raw', import: 'default', eager: true })
const html = computed(() => renderMarkdown(sources[`../shared/content/${props.doc}.${locale.value}.md`] || sources[`../shared/content/${props.doc}.en.md`] || ''))
</script>

<style scoped>
.content-page {
  font-family: 'Cormorant Garamond', serif;
}

.content-main {
  width: min(100%, 880px);
  margin: 0 auto;
  padding: clamp(72px, 9vw, 112px) 0;
}

.content-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.content-eyebrow {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.42;
}

.content-language { margin-top: 14px; color: rgba(245,245,240,.55); font: 12px ui-sans-serif, system-ui, sans-serif; text-decoration: underline; text-underline-offset: 3px; }

.content-intro h1 {
  margin-top: 20px;
  color: #f5f5f0;
  font-size: clamp(2.3rem, 5vw, 4.2rem);
  font-weight: 300;
  line-height: 1.02;
}

.content-intro p {
  max-width: 640px;
  margin-top: 20px;
  color: rgba(245, 245, 240, 0.62);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
}

.content-body {
  margin-top: clamp(48px, 6vw, 72px);
  color: rgba(245, 245, 240, 0.72);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  line-height: 1.7;
}

.content-body :deep(h2) {
  margin: 48px 0 16px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  color: #f5f5f0;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  font-weight: 400;
  line-height: 1.15;
  scroll-margin-top: 96px;
}

.content-body :deep(h2:first-child) {
  margin-top: 0;
  padding-top: 0;
  border-top: 0;
}

.content-body :deep(p),
.content-body :deep(ul) {
  margin-top: 14px;
}

.content-body :deep(ul) {
  display: grid;
  gap: 8px;
  padding-left: 20px;
  list-style: disc;
}

.content-body :deep(li::marker) {
  color: rgba(245, 245, 240, 0.36);
}

.content-body :deep(strong) {
  color: #f5f5f0;
  font-weight: 550;
}

.content-body :deep(a) {
  color: #f5f5f0;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(245, 245, 240, 0.4);
}

.content-body :deep(a:hover) {
  text-decoration-color: #f5f5f0;
}

.content-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: clamp(40px, 6vw, 56px);
  padding-top: 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
}

.content-cta__link {
  padding: 10px 18px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 25px;
  color: #f5f5f0;
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.86rem;
  text-decoration: none;
  transition: border-color 160ms ease, background 160ms ease;
}

.content-cta__link:hover {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.06);
}

@media (max-width: 640px) {
  .content-main {
    padding-top: 56px;
    padding-bottom: 72px;
  }
}
</style>
