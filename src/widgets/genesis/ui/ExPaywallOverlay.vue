<template>
  <Teleport to="body">
    <Transition name="fade-blur">
      <div v-if="isOpen" 
           class="fixed inset-0 z-[10050] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-8"
           @click.self="emit('close')">
        
        <div class="flex flex-col items-center max-w-md w-full relative z-10 border border-nier-border-light dark:border-nier-border-dark bg-nier-white dark:bg-nier-black p-10 shadow-2xl">
          
          <!-- Minimal Anchor -->
          <div class="w-2 h-2 bg-nier-text-light dark:bg-nier-text-dark rotate-45 mb-6 opacity-40"></div>

          <h2 class="text-xl font-black uppercase tracking-[0.2em] text-nier-text-light dark:text-nier-text-dark mb-4 font-mono text-center">
            Premium Access Required
          </h2>
          
          <div class="h-px w-12 bg-nier-text-light dark:bg-nier-text-dark opacity-20 mb-6"></div>

          <p class="text-[10px] font-mono tracking-widest leading-loose text-nier-text-light/60 dark:text-nier-text-dark/60 text-center uppercase mb-8">
            THIS ANALYTICAL STRUCTURE IS LOCKED. <br/><br/> UPGRADE TO A PREMIUM SUBSCRIPTION TO ACCESS ADVANCED DIAGNOSTIC TOOLS AND MATRIX CAPABILITIES.
          </p>

          <div class="flex items-center space-x-4 w-full mt-2">
            <ExButton 
              variant="solid" 
              class="w-full border-nier-text-light dark:border-nier-text-dark" 
              @click.prevent
            >
              UPGRADE_NOW
            </ExButton>
            <ExButton 
              variant="tactical" 
              class="w-full opacity-60 hover:opacity-100" 
              @click="emit('close')"
            >
              CLOSE
            </ExButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import ExButton from '~/shared/ui/ExButton.vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])
</script>

<style scoped>
.fade-blur-enter-active, .fade-blur-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-blur-enter-from, .fade-blur-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}
.fade-blur-enter-to, .fade-blur-leave-from {
  opacity: 1;
  backdrop-filter: blur(12px);
}
</style>
