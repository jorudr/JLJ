<template>
  <div class="h-full min-h-screen flex items-center justify-center p-12 transition-all duration-1000 ethereal-void"
       :class="[isDark ? 'is-dark dark theme-dark' : 'theme-light']">
    
    <div class="w-full max-w-2xl flex flex-col space-y-8">

      <div class="flex items-center space-x-4 border-b border-theme-border pb-6">
        <svg class="w-6 h-6 text-theme-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <ExHeading level="h2" variant="cinematic" class="!text-2xl uppercase tracking-[0.2em] !mb-0">Transmit_Report</ExHeading>
      </div>

      <form @submit.prevent="submitReport" class="flex flex-col space-y-6">
        
        <!-- Type Selection -->
        <div class="flex flex-col space-y-3">
          <label class="text-[10px] font-mono tracking-widest uppercase opacity-50 text-theme-text">Report_Classification</label>
          <div class="flex items-center space-x-4">
            <button 
              type="button"
              @click="reportType = 'PROBLEM'"
              class="flex-1 py-3 border text-[10px] font-mono uppercase tracking-widest transition-all duration-300"
              :class="reportType === 'PROBLEM' ? 'border-theme-text bg-theme-text text-theme-bg font-bold' : 'border-theme-border text-theme-text opacity-40 hover:opacity-100'"
            >
              System_Anomaly
            </button>
            <button 
              type="button"
              @click="reportType = 'IDEA'"
              class="flex-1 py-3 border text-[10px] font-mono uppercase tracking-widest transition-all duration-300"
              :class="reportType === 'IDEA' ? 'border-theme-text bg-theme-text text-theme-bg font-bold' : 'border-theme-border text-theme-text opacity-40 hover:opacity-100'"
            >
              Feature_Proposal
            </button>
          </div>
        </div>

        <!-- Title -->
        <div class="flex flex-col space-y-3">
          <label class="text-[10px] font-mono tracking-widest uppercase opacity-50 text-theme-text">Primary_Designation</label>
          <input 
            v-model="title" 
            type="text" 
            required 
            placeholder="E.G. 'UI OVERLAP ON MOBILE' OR 'ADD DARK MODE HOTKEY'"
            class="bg-transparent border border-theme-border p-4 text-[12px] font-mono tracking-wider focus:outline-none focus:border-theme-text transition-colors text-theme-text placeholder:opacity-20 uppercase"
            :disabled="isSubmitting"
          />
        </div>

        <!-- Description -->
        <div class="flex flex-col space-y-3">
          <label class="text-[10px] font-mono tracking-widest uppercase opacity-50 text-theme-text">Detailed_Telemetry</label>
          <textarea 
            v-model="description" 
            required 
            rows="4"
            placeholder="PROVIDE ADDITIONAL CONTEXT OR SPECIFICS..."
            class="bg-transparent border border-theme-border p-4 text-[12px] font-mono tracking-wider focus:outline-none focus:border-theme-text transition-colors text-theme-text placeholder:opacity-20 uppercase resize-none"
            :disabled="isSubmitting"
          ></textarea>
        </div>

        <Transition name="fade-quick">
          <div v-if="errorMessage" class="border border-red-500/40 bg-red-500/10 px-4 py-3">
            <span class="text-[10px] font-mono text-red-400 tracking-widest">{{ errorMessage }}</span>
          </div>
        </Transition>
        
        <Transition name="fade-quick">
          <div v-if="successMessage" class="border border-green-500/40 bg-green-500/10 px-4 py-3">
            <span class="text-[10px] font-mono text-green-400 tracking-widest">{{ successMessage }}</span>
          </div>
        </Transition>

        <div class="flex items-center justify-between pt-6 border-t border-theme-border">
          <button 
            type="button" 
            @click="navigateBack"
            class="px-8 py-3 border border-theme-border text-theme-text text-[10px] font-mono uppercase tracking-widest opacity-60 hover:opacity-100 hover:bg-theme-text/10 hover:border-theme-text/50 transition-all duration-300"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            :disabled="isSubmitting || !title.trim() || !description.trim()"
            class="px-10 py-3 bg-black text-white dark:bg-white dark:text-black text-[10px] font-bold font-mono uppercase tracking-widest hover:bg-black/80 dark:hover:bg-white/80 transition-all duration-300 disabled:opacity-30 disabled:hover:bg-black dark:disabled:hover:bg-white"
          >
            {{ isSubmitting ? 'Processing...' : 'Transmit_Data' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '~/shared/firebase.client'
import { useAuthStore } from '~/entities/user/auth.store'
import { useThemeStore } from '~/features/store/useTheme'
import ExHeading from '~/shared/ui/ExHeading.vue'
import { useRouter } from 'vue-router'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.settings.isDark)

const authStore = useAuthStore()
const router = useRouter()

const reportType = ref<'PROBLEM' | 'IDEA'>('PROBLEM')
const title = ref('')
const description = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const navigateBack = () => {
  router.push('/')
}

const submitReport = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  
  if (!authStore.user?.email) {
    errorMessage.value = 'AUTH_ERROR: OPERATOR EMAIL NOT FOUND'
    return
  }

  const trimmedTitle = title.value.trim()
  const trimmedDescription = description.value.trim()
  
  if (!trimmedTitle || !trimmedDescription) {
    errorMessage.value = 'VALIDATION_ERROR: ALL FIELDS ARE REQUIRED'
    return
  }

  // Check rate limit using localStorage to avoid requiring Firestore composite indexes
  const lastReportTimeStr = localStorage.getItem('last_report_time')
  if (lastReportTimeStr) {
    const lastDate = new Date(parseInt(lastReportTimeStr, 10))
    const now = new Date()
    const diffMs = now.getTime() - lastDate.getTime()
    const hours24 = 24 * 60 * 60 * 1000
    
    if (diffMs < hours24) {
      const hoursLeft = Math.ceil((hours24 - diffMs) / (60 * 60 * 1000))
      errorMessage.value = `RATE_LIMIT_EXCEEDED: PLEASE WAIT ${hoursLeft} HOURS BEFORE TRANSMITTING ANOTHER REPORT.`
      return
    }
  }

  isSubmitting.value = true

  try {
    const userEmail = authStore.user.email
    const reportsRef = collection(db, 'reports')

    // Submit report directly without complex queries
    await addDoc(reportsRef, {
      type: reportType.value,
      title: trimmedTitle,
      description: trimmedDescription,
      email: userEmail,
      date: serverTimestamp()
    })
    
    // Update local rate limit cache
    localStorage.setItem('last_report_time', Date.now().toString())

    successMessage.value = 'TRANSMISSION_SUCCESSFUL: REPORT LOGGED IN ARCHIVE.'
    title.value = ''
    description.value = ''
    
    // Redirect after brief delay
    setTimeout(() => {
      navigateBack()
    }, 2000)

  } catch (error: any) {
    console.error('Failed to submit report:', error)
    errorMessage.value = `TRANSMISSION_FAILED: ${error.message}`
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
/* THEME DEFINITIONS */
.theme-dark {
  --theme-bg: #0a0a0a;
  --theme-text: rgba(255, 255, 255, 0.7);
  --theme-border: rgba(255, 255, 255, 0.1);
  --theme-border-strong: rgba(255, 255, 255, 0.25);
}

.theme-light {
  --theme-bg: #FFFFFF;
  --theme-text: #2C3E50;
  --theme-border: rgba(44, 62, 80, 0.1);
  --theme-border-strong: rgba(44, 62, 80, 0.25);
}

.ethereal-void {
  background-color: var(--theme-bg);
  color: var(--theme-text);
  font-family: 'Cormorant Garamond', serif;
}

.bg-theme-bg { background-color: var(--theme-bg); }
.text-theme-text { color: var(--theme-text); }
.border-theme-border { border-color: var(--theme-border); }
.border-theme-text { border-color: var(--theme-text); }

.fade-quick-enter-active, .fade-quick-leave-active {
  transition: opacity 0.3s ease;
}
.fade-quick-enter-from, .fade-quick-leave-to { opacity: 0; }
</style>
