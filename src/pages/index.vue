<template>
  <div class="flex flex-col min-h-screen">
    <Header 
      class="sticky top-0 z-50 transition-all duration-500 rounded-b-3xl" 
      :class="{ 'bg-white/80 dark:bg-[#050505]/80 shadow-sm': themeStore.settings.themeName === 'Default' }"
    />
    <DashboardMain v-if="auth.isAuthenticated" />
    <Main v-else class="grow" />
    <Footer />
  </div>
</template>


<script setup>
import Header from "@/widgets/header/ui/Header.vue";
import Main from "@/widgets/main/Main.vue";
import DashboardMain from "@/widgets/dashboard/ui/DashboardMain.vue";
import Footer from "@/widgets/footer/Footer.vue";

import { onMounted } from 'vue'
import { useForumStore } from "~/features/store/useForum";
import { useAuthStore } from "~/entities/user/auth.store";
import { useThemeStore } from "~/features/store/useTheme";

const forum = useForumStore()
const auth = useAuthStore()
const themeStore = useThemeStore()

onMounted(async () => {
  await forum.fetchThreadList()
})

definePageMeta({
  public: true
})

</script>

