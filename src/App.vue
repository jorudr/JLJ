<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from './shared/i18n/useI18n'
import { homeAlternates, pageSeo, SOCIAL_IMAGE } from './shared/seo'

const route = useRoute()
const { locale } = useI18n()

const setMeta = (selector, content) => {
  const element = document.querySelector(selector)
  if (element) element.setAttribute('content', content)
}

const updateTitle = () => {
  const seo = pageSeo(route.path, locale.value)
  document.title = seo.title
  setMeta('meta[name="description"]', seo.description)
  setMeta('meta[name="robots"]', seo.index ? 'index, follow, max-image-preview:large' : 'noindex, follow')
  setMeta('meta[property="og:title"]', seo.title)
  setMeta('meta[property="og:description"]', seo.description)
  setMeta('meta[property="og:url"]', seo.canonical || '')
  setMeta('meta[property="og:image"]', SOCIAL_IMAGE)
  const canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) {
    if (seo.canonical) canonical.setAttribute('href', seo.canonical)
    else canonical.removeAttribute('href')
  }
  for (const [language, href] of Object.entries(homeAlternates)) {
    let alternate = document.querySelector(`link[rel="alternate"][hreflang="${language}"]`)
    if (route.path === '/' || route.path === '/ru/') {
      if (!alternate) {
        alternate = document.createElement('link')
        alternate.rel = 'alternate'
        alternate.hreflang = language
        document.head.appendChild(alternate)
      }
      alternate.href = href
    } else alternate?.remove()
  }
  document.documentElement.lang = locale.value
}

watch([() => route.path, locale], updateTitle, { immediate: true })
</script>

<template>
  <div class="w-full min-h-screen bg-black">
    <router-view />
  </div>
</template>
