<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from './shared/i18n/useI18n'

const route = useRoute()
const { t, locale } = useI18n()

const baseTitle = 'J. L. JÖRMUNGANDR'

const updateTitle = () => {
  const titleKey = route.meta?.titleKey
  if (titleKey) {
    const pageTitle = t(titleKey)
    document.title = pageTitle && pageTitle !== titleKey ? `${baseTitle} — ${pageTitle}` : baseTitle
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
