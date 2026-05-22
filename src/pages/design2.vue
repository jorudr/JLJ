<template>
  <div class="theme-dark min-h-screen bg-theme-bg text-theme-text flex items-center justify-center font-mono">
    <div class="flex flex-col items-center space-y-12">
      <div class="flex flex-col items-center space-y-4">
        <div class="w-12 h-12 border-2 border-theme-text rotate-45 flex items-center justify-center animate-pulse">
          <div class="w-4 h-4 bg-theme-text"></div>
        </div>
        <h1 class="text-2xl font-black uppercase tracking-[0.5em]">System_Interface_Test</h1>
        <p class="text-[10px] opacity-30 uppercase tracking-[0.3em]">Protocol // Condition_Creator_Isolation</p>
      </div>

      <ExButton variant="tactical" @click="isCreatorOpen = true">
        Open_Condition_Creator
      </ExButton>
    </div>

    <!-- The Component -->
    <ExConditionCreator 
      :is-open="isCreatorOpen" 
      @close="isCreatorOpen = false" 
      @create="handleCreate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ExButton from '~/shared/ui/ExButton.vue'
import ExConditionCreator from '~/shared/ui/components/ExConditionCreator.vue'

const isCreatorOpen = ref(true)

const handleCreate = (data: any) => {
  console.log('Condition Created:', data)
  isCreatorOpen.value = false
}
</script>

<style>
/* Ensure theme variables are available */
.theme-dark {
  --theme-bg: #0a0a0a;
  --theme-text: #ffffff;
  --theme-border: rgba(255, 255, 255, 0.1);
  --theme-border-strong: rgba(255, 255, 255, 0.3);
}

body {
  background-color: #0a0a0a;
  margin: 0;
  color: white;
}
</style>
