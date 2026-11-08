<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from './shared/i18n/useI18n'
import { pageSeo, SITE, SOCIAL_IMAGE } from './shared/seo'
import { isTransitioning, isFadingOut } from './shared/pageTransition'

const route = useRoute()
const { locale } = useI18n()

const setMeta = (nameOrProperty, attrKey, content) => {
  let element = document.querySelector(`meta[${attrKey}="${nameOrProperty}"]`)
  if (!element && content) {
    element = document.createElement('meta')
    element.setAttribute(attrKey, nameOrProperty)
    document.head.appendChild(element)
  }
  if (element) {
    if (content) {
      element.setAttribute('content', content)
    } else {
      element.remove()
    }
  }
}

const updateTitle = () => {
  const seo = pageSeo(route.path, locale.value)
  document.title = seo.title

  setMeta('description', 'name', seo.description)
  setMeta('keywords', 'name', seo.keywords || '')
  setMeta('robots', 'name', seo.index ? 'index, follow, max-image-preview:large' : 'noindex, follow')

  // Open Graph
  setMeta('og:title', 'property', seo.title)
  setMeta('og:description', 'property', seo.description)
  setMeta('og:url', 'property', seo.canonical || '')
  setMeta('og:image', 'property', SOCIAL_IMAGE)
  setMeta('og:image:width', 'property', '1440')
  setMeta('og:image:height', 'property', '900')
  setMeta('og:image:type', 'property', 'image/png')
  setMeta('og:locale', 'property', locale.value === 'ru' ? 'ru_RU' : 'en_US')
  setMeta('og:locale:alternate', 'property', locale.value === 'ru' ? 'en_US' : 'ru_RU')

  // Twitter Cards
  setMeta('twitter:card', 'name', 'summary_large_image')
  setMeta('twitter:title', 'name', seo.title)
  setMeta('twitter:description', 'name', seo.description)
  setMeta('twitter:image', 'name', SOCIAL_IMAGE)

  const canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) {
    if (seo.canonical) canonical.setAttribute('href', seo.canonical)
    else canonical.removeAttribute('href')
  }

  const alternates = seo.alternates || {}
  for (const language of ['en', 'ru', 'x-default']) {
    let alternate = document.querySelector(`link[rel="alternate"][hreflang="${language}"]`)
    const href = alternates[language]
    if (href) {
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
  <div class="w-full min-h-screen bg-white">
    <router-view />
    <div
      v-if="isTransitioning"
      id="page-loader"
      :class="{ 'loader-fade-out': isFadingOut }"
      aria-hidden="true"
    >
      <div class="loader-stripe"><div class="bar-black"></div><div class="bar-white"></div></div>
      <div class="loader-stripe"><div class="bar-black"></div><div class="bar-white"></div></div>
      <div class="loader-stripe"><div class="bar-black"></div><div class="bar-white"></div></div>
      <div class="loader-stripe"><div class="bar-black"></div><div class="bar-white"></div></div>
      <div class="loader-stripe"><div class="bar-black"></div><div class="bar-white"></div></div>
    </div>
  </div>
</template>
