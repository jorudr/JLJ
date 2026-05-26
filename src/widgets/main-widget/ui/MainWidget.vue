<template>
  <main :class="activeTab === 'genesis' ? 'p-0 pt-0' : 'p-16 pt-32'"
        class="relative z-50 flex items-start justify-center min-h-screen transition-all duration-700">
    <Transition name="page-reify" mode="out-in">
    <div :key="activeTab"
         :class="[
           activeTab === 'genesis' ? 'max-w-none w-screen h-screen bg-transparent backdrop-blur-none border-none overflow-hidden' : 'max-w-[65rem] w-full bg-current/5 focus-widget p-12 min-h-[35rem]'
         ]"
         class="relative transition-all duration-700">
        
        <!-- Structural Anchors -->
        <div class="absolute top-0 left-0 w-12 h-12 border-t border-l border-current/10"></div>
        <div class="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-current/10"></div>

        <div class="grid grid-cols-12 gap-16 h-full">
          
          <!-- Left HUD: Status and System Info -->
          <div v-if="Object.keys(route.query).length === 0" class="col-span-4 border-r border-current/5 pr-12">
            <StatusIdentity :activeTab="activeTab" />
          </div>

          <!-- Right Pane: Main Activity/Content -->
          <div :class="[
                 Object.keys(route.query).length === 0 ? 'col-span-8' : 'col-span-12',
                 activeTab === 'genesis' ? 'h-screen overflow-hidden' : 'h-full scroll-minimal'
               ]" class="flex flex-col">
            <ActivityLog v-show="activeTab === 'archive'" />
            <ExForum v-show="activeTab === 'forum'" />
            <ExGenesis v-show="activeTab === 'genesis'" :activeTab="activeTab" @exit="$emit('exit')" />
          </div>
        </div>
      </div>
    </Transition>
  </main>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import StatusIdentity from '~/widgets/status/ui/StatusIdentity.vue'
import ActivityLog from '~/widgets/activity/ui/ActivityLog.vue'
import ExForum from '~/widgets/exforum/ui/ExForum.vue'
import ExGenesis from '~/widgets/genesis/ui/ExGenesis.vue'

defineProps<{
  activeTab: string
}>()

const emit = defineEmits(['exit'])

const route = useRoute()
</script>

<style scoped>
.page-reify-enter-active, .page-reify-leave-active {
  transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.page-reify-enter-from { opacity: 0; transform: scale(1.01); filter: blur(30px) brightness(1.5); }
.page-reify-leave-to { opacity: 0; transform: scale(0.99); filter: blur(15px) brightness(1.2); }

.scroll-minimal::-webkit-scrollbar { display: none; }
.scroll-minimal { scrollbar-width: none; }

.focus-widget {
  background: rgba(var(--text-primary-rgb), 0.01);
  backdrop-filter: blur(2px) saturate(1.05);
}
</style>
