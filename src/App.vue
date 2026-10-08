<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from './shared/i18n/useI18n'
import { homeContent } from './shared/i18n/homeContent'

const route = useRoute()
const { t, locale } = useI18n()

const tabTitle = 'JÖRU'
const setMeta = (selector, content) => {
  const element = document.querySelector(selector)
  if (element) element.setAttribute('content', content)
}

const updateTitle = () => {
  const titleKey = route.meta?.titleKey
  const pageTitle = titleKey ? t(titleKey) : route.meta?.title
  document.title = route.path !== '/' && pageTitle && pageTitle !== titleKey
    ? `${tabTitle} — ${pageTitle}`
    : tabTitle
  if (route.path === '/') {
    const copy = homeContent[locale.value] || homeContent.en
    const seoTitle = locale.value === 'ru'
      ? 'JÖRMUNGANDR — торговый журнал для трейдеров'
      : 'JÖRMUNGANDR — Trading Journal for Traders'
    setMeta('meta[name="description"]', copy.seoText)
    setMeta('meta[property="og:title"]', seoTitle)
    setMeta('meta[property="og:description"]', copy.seoText)
  }
  document.documentElement.lang = locale.value
}

watch([() => route.path, () => route.meta, locale], updateTitle, { immediate: true })
</script>

<template>
  <div class="w-full min-h-screen bg-black">
    <router-view />
  </div>
</template>
