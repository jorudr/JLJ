<template>
  <div class="fixed inset-0 z-[10000] bg-theme-bg flex flex-col items-center justify-center overflow-hidden">
    <!-- Background Ambience -->
    <div class="absolute inset-0 opacity-20 pointer-events-none">
       <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--theme-text)_0%,transparent_70%)] opacity-5"></div>
       <div class="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.5)_100%)]"></div>
    </div>

    <!-- Center Assembly -->
    <div class="relative flex flex-col items-center space-y-12 z-10">
      
      <!-- Core Icon -->
      <div class="relative w-32 h-32 flex items-center justify-center">
        <div class="absolute inset-0 border-2 border-theme-text opacity-40 animate-[spin_10s_linear_infinite]"></div>
        <div class="absolute inset-4 border border-theme-text opacity-60 animate-[spin_6s_linear_infinite_reverse]"></div>
        <div class="w-4 h-4 bg-theme-text rotate-45 animate-pulse"></div>
        
        <!-- Corner Brackets (Expanding) -->
        <div class="absolute -top-4 -left-4 w-6 h-6 border-t-2 border-l-2 border-theme-text"></div>
        <div class="absolute -bottom-4 -right-4 w-6 h-6 border-b-2 border-r-2 border-theme-text"></div>
      </div>

      <!-- Identity -->
      <div class="flex flex-col items-center space-y-2">
        <ExHeading level="h1" variant="cinematic" class="!text-5xl tracking-[0.6em]">Archival_Node</ExHeading>
        <ExText variant="telemetry" class="!opacity-30 tracking-[1em]">Universal_Reification_Pod</ExText>
      </div>

      <!-- Loading Progress -->
      <div class="w-64 flex flex-col space-y-4">
        <div class="flex justify-between items-end">
          <ExText variant="small" class="!opacity-40">System_Initialization</ExText>
          <ExText variant="small" class="font-black">{{ Math.floor(progress) }}%</ExText>
        </div>
        <div class="h-px w-full bg-theme-border relative">
          <div 
            class="absolute top-0 left-0 h-full bg-theme-text transition-all duration-300"
            :style="{ width: `${progress}%` }"
          ></div>
        </div>
        
        <!-- Sequential Logs -->
        <div class="h-8 overflow-hidden relative">
          <Transition name="log-slide" mode="out-in">
            <ExText :key="currentLog" variant="small" class="text-center lowercase italic opacity-20">
               {{ currentLog }}
            </ExText>
          </Transition>
        </div>
      </div>

      <!-- Final Initiation Action -->
      <Transition name="fade-up">
        <div v-if="progress >= 100" class="pt-8">
          <ExButton variant="tactical" @click="$emit('initiate')">
            Initiate_Neural_Link
          </ExButton>
        </div>
      </Transition>
    </div>

    <!-- Bottom Telemetry -->
    <div class="fixed bottom-12 left-0 right-0 px-12 flex justify-between items-center opacity-20">
      <ExText variant="small">ID: 0x4F.F7 // REIFIED</ExText>
      <ExText variant="small">B_ARCHIVE_ESTABLISHED</ExText>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ExHeading from '../ExHeading.vue'
import ExText from '../ExText.vue'
import ExButton from '../ExButton.vue'

const emit = defineEmits(['initiate'])

const progress = ref(0)
const currentLog = ref('Initializing core logic...')

const logs = [
  'Verifying tactical protocols...',
  'Synchronizing archival lattice...',
  'Calibrating neural interface...',
  'Establishing secure reification channel...',
  'Archival pods: ONLINE',
  'Ready for operator input.'
]

onMounted(() => {
  const interval = setInterval(() => {
    if (progress.value < 100) {
      progress.value += Math.random() * 5
      
      // Update logs based on progress
      const logIndex = Math.floor((progress.value / 100) * logs.length)
      if (logs[logIndex]) currentLog.value = logs[logIndex]
    } else {
      progress.value = 100
      currentLog.value = logs[logs.length - 1]
      clearInterval(interval)
    }
  }, 150)
})
</script>

<style scoped>
.log-slide-enter-active, .log-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.log-slide-enter-from { opacity: 0; transform: translateY(10px); }
.log-slide-leave-to { opacity: 0; transform: translateY(-10px); }

.fade-up-enter-active {
  transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
</style>
