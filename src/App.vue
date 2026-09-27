<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from './shared/i18n/useI18n'
import { homeContent } from './shared/i18n/homeContent'

const route = useRoute()
const { t, locale } = useI18n()

const baseTitle = 'J. L. JÖRMUNGANDR'
const setMeta = (selector, content) => {
  const element = document.querySelector(selector)
  if (element) element.setAttribute('content', content)
}

const updateTitle = () => {
  const titleKey = route.meta?.titleKey
  if (route.path === '/') {
    const copy = homeContent[locale.value] || homeContent.en
    document.title = locale.value === 'ru'
      ? 'J.L.JÖRMUNGANDR — торговый журнал для трейдеров'
      : 'J.L.JÖRMUNGANDR — Trading Journal for Traders'
    setMeta('meta[name="description"]', copy.seoText)
    setMeta('meta[property="og:title"]', document.title)
    setMeta('meta[property="og:description"]', copy.seoText)
    document.documentElement.lang = locale.value
  } else if (titleKey) {
    const pageTitle = t(titleKey)
    document.title = pageTitle && pageTitle !== titleKey ? `${baseTitle} — ${pageTitle}` : baseTitle
    document.documentElement.lang = locale.value
  } else if (route.meta?.title) {
    document.title = `${baseTitle} — ${route.meta.title}`
  } else {
    document.title = baseTitle
  }
}

watch([() => route.path, () => route.meta, locale], updateTitle, { immediate: true })
</script>

<template>
  <div class="w-full min-h-screen bg-black">
    <router-view />
  </div>
</template>
