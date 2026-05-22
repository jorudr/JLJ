<template>
  <div></div>
</template>
<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { openSettings } from '~/widgets/settings/model/useSettings'

const router = useRouter()
onMounted(() => {
  router.replace('/')
  openSettings()
})
</script>
