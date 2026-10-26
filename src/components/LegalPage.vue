<template>
  <div class="legal-page relative min-h-screen bg-black text-white/80">
    <PageGradflowBackground />
    <div class="legal-shell relative z-[1] mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 pt-4 sm:px-10 sm:pt-6">
      <SiteNav :always-dark="true" />

      <main class="legal-main flex-1" aria-labelledby="legal-title">
        <header class="legal-intro">
          <span class="legal-eyebrow">{{ t('landing.legal.eyebrow') }}</span>
          <h1 id="legal-title">{{ t(titleKey) }}</h1>
          <nav class="legal-switch" :aria-label="t('landing.legal.eyebrow')">
            <router-link to="/terms">{{ t('landing.legal.termsTitle') }}</router-link>
            <router-link to="/privacy">{{ t('landing.legal.privacyTitle') }}</router-link>
          </nav>
        </header>

        <article class="legal-body" :lang="locale" v-html="html"></article>
      </main>

      <AppFooter hide-hero />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SiteNav from './SiteNav.vue'
import AppFooter from './AppFooter.vue'
import PageGradflowBackground from './PageGradflowBackground.vue'
import { useI18n } from '../shared/i18n/useI18n'
import { renderMarkdown } from '../shared/legal/renderMarkdown'

const props = defineProps({
  doc: {
    type: String,
    required: true,
    validator: value => ['privacy', 'terms'].includes(value),
  },
})

const sources = import.meta.glob('../shared/legal/*.md', { query: '?raw', import: 'default', eager: true })

const { t, locale } = useI18n()
const titleKey = computed(() => `landing.legal.${props.doc}Title`)
const html = computed(() => {
  const source = sources[`../shared/legal/${props.doc}.${locale.value}.md`]
    || sources[`../shared/legal/${props.doc}.en.md`]
  return renderMarkdown(source || '')
})
</script>

<style scoped>
.legal-page {
  font-family: 'Cormorant Garamond', serif;
}

.legal-main {
  width: min(100%, 880px);
  margin: 0 auto;
  padding: clamp(72px, 9vw, 112px) 0;
}

.legal-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.legal-eyebrow {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  opacity: 0.42;
}

.legal-intro h1 {
  margin-top: 20px;
  color: #f5f5f0;
  font-size: clamp(2.7rem, 5.6vw, 5rem);
  font-weight: 300;
  line-height: 0.95;
}

.legal-switch {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
}

.legal-switch a {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 25px;
  color: rgba(245, 245, 240, 0.62);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.82rem;
  transition: border-color 160ms ease, color 160ms ease;
}

.legal-switch a:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #f5f5f0;
}

.legal-switch a.router-link-exact-active {
  border-color: #f5f5f0;
  background: #f5f5f0;
  color: #000;
}

.legal-body {
  margin-top: clamp(48px, 6vw, 72px);
  color: rgba(245, 245, 240, 0.72);
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 0.95rem;
  line-height: 1.7;
}

.legal-body :deep(h2) {
  margin: 56px 0 18px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  color: #f5f5f0;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(1.7rem, 2.6vw, 2.2rem);
  font-weight: 400;
  line-height: 1.1;
  scroll-margin-top: 96px;
}

.legal-body :deep(h2:first-child) {
  margin-top: 0;
}

.legal-body :deep(p),
.legal-body :deep(ul),
.legal-body :deep(.legal-table) {
  margin-top: 14px;
}

.legal-body :deep(ul) {
  display: grid;
  gap: 8px;
  padding-left: 20px;
  list-style: disc;
}

.legal-body :deep(li::marker) {
  color: rgba(245, 245, 240, 0.36);
}

.legal-body :deep(strong) {
  color: #f5f5f0;
  font-weight: 550;
}

.legal-body :deep(a) {
  color: #f5f5f0;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(245, 245, 240, 0.4);
}

.legal-body :deep(a:hover) {
  text-decoration-color: #f5f5f0;
}

.legal-body :deep(.legal-table) {
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.legal-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
  line-height: 1.5;
}

.legal-body :deep(th),
.legal-body :deep(td) {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
  vertical-align: top;
}

.legal-body :deep(th) {
  color: rgba(245, 245, 240, 0.48);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.legal-body :deep(tr:last-child td) {
  border-bottom: 0;
}

@media (max-width: 640px) {
  .legal-main {
    padding-top: 56px;
    padding-bottom: 72px;
  }

  .legal-body :deep(table) {
    min-width: 520px;
  }
}
</style>
