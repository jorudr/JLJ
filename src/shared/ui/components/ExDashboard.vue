<template>
  <div class="h-full flex flex-col p-12 max-w-7xl mx-auto space-y-12 relative overflow-hidden">
    <!-- 1. Header / Global Status -->
    <header class="flex justify-between items-start z-10">
      <div class="flex flex-col space-y-2">
        <ExHeading level="h1" variant="cinematic" class="!text-3xl">{{ t('dashboard.title') }}</ExHeading>
        <div class="flex items-center space-x-4">
           <ExTag>v1.0.4_REIFIED</ExTag>
           <ExText variant="small" class="opacity-30 tracking-[0.4em]">{{ t('dashboard.subtitle') }}</ExText>
        </div>
      </div>

      <div class="flex items-center space-x-12">
        <!-- Language Selector -->
        <div class="flex items-center space-x-4 border-r border-theme-border pr-8">
          <button 
            v-for="l in ['en', 'ru']" 
            :key="l"
            @click="setLocale(l)"
            class="text-[10px] font-mono tracking-widest uppercase transition-all duration-300"
            :class="locale === l ? 'text-theme-text font-bold underline underline-offset-4' : 'opacity-30 hover:opacity-100'"
          >
            {{ l }}
          </button>
        </div>

        <!-- User Identity -->
        <ExIdentity name="Operator_0x4F" rank="System Architect" />
      </div>
    </header>

    <!-- 2. The Module Grid (Central Hub) -->
    <main class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-8 z-10">
      <div v-for="module in dashboardModules" :key="module.id" class="relative group h-full">
        <button 
          @click="$emit('navigate', module.id)"
          class="w-full h-full text-left flex flex-col p-8 border border-theme-border bg-theme-bg/40 backdrop-blur-sm transition-all duration-700 hover:border-theme-text/40 hover:bg-theme-bg/60 relative overflow-hidden"
        >
          <!-- Background Accents -->
          <div class="absolute -top-12 -right-12 w-32 h-32 border border-theme-text opacity-60 rotate-45 group-hover:rotate-[135deg] transition-transform duration-1000"></div>
          
          <div class="flex flex-col h-full space-y-8 relative z-10">
            <div class="flex justify-between items-start">
               <div class="w-10 h-10 border border-theme-border flex items-center justify-center group-hover:border-theme-text transition-colors">
                  <ExText variant="telemetry" class="opacity-40 group-hover:opacity-100">{{ module.code }}</ExText>
               </div>
               <div class="w-1.5 h-1.5 bg-theme-accent rotate-45 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            <div class="flex flex-col space-y-2">
              <ExHeading level="h3" variant="cinematic" class="!text-xl group-hover:opacity-100 opacity-50 transition-all duration-700 whitespace-pre-line">{{ t(module.titleKey) }}</ExHeading>
              <ExText variant="small" class="opacity-40 leading-relaxed">{{ module.description }}</ExText>
            </div>

            <div class="mt-auto pt-6 border-t border-theme-border opacity-0 group-hover:opacity-100 transition-opacity duration-700">
               <div class="flex items-center space-x-2">
                  <div class="w-1 h-1 bg-theme-text"></div>
                  <ExText variant="telemetry" class="tracking-widest">ACCESS_PROTOCOL</ExText>
               </div>
            </div>
          </div>
          
          <!-- Hover Edge Slide -->
          <div class="absolute bottom-0 left-0 w-full h-0.5 bg-theme-text transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
        </button>
      </div>
    </main>

    <!-- 3. Bottom Utility Bar -->
    <footer class="flex justify-between items-center z-10 opacity-100 pt-8 border-t border-theme-border">
      <div class="flex space-x-12 items-center">
        <ExText variant="small" class="tracking-widest uppercase">System_Time: 04:22:19</ExText>
        <ExText variant="small" class="tracking-widest uppercase">Encryption: AES-256_REIFIED</ExText>
      </div>
      <div class="flex space-x-4">
         <div v-for="i in 4" :key="i" class="w-1 h-1 border border-theme-text rotate-45"></div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../../i18n/useI18n'
import ExHeading from '../ExHeading.vue'
import ExText from '../ExText.vue'
import ExTag from '../ExTag.vue'
import ExIdentity from '../ExIdentity.vue'

defineEmits(['navigate'])

const { t, locale, setLocale } = useI18n()

const dashboardModules = [
  { 
    id: 'forum', 
    code: 'F1', 
    titleKey: 'dashboard.modules.knowledge_matrix', 
    description: 'Collaborative protocol exchange and strategic link network.' 
  },
  { 
    id: 'activity', 
    code: 'A2', 
    titleKey: 'dashboard.modules.activity_monitor', 
    description: 'Core tactical data repository and historical consistency matrix.' 
  },
  { 
    id: 'genesis', 
    code: 'G3', 
    titleKey: 'dashboard.modules.genesis_protocol', 
    description: 'Module management and neural diary reification sequence.' 
  }
]
</script>
