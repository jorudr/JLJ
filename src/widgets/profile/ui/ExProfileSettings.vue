<template>
  <!-- UNIFIED PROFILE SETTINGS COMPONENT -->
  <ExPanel noPadding variant="standard" title="SYSTEM_PREFERENCES // ROOT_ACCESS" telemetry="v2.5.0" class="w-full max-w-6xl mx-auto">
    <div class="flex flex-col lg:flex-row min-h-[600px] bg-theme-bg text-theme-text border-t border-theme-border">
      
      <!-- TACTICAL SIDEBAR -->
      <div class="w-full lg:w-[320px] flex flex-col border-b lg:border-b-0 lg:border-r border-theme-border bg-theme-text/[0.02]">
        
        <!-- Identity Header -->
        <div class="flex items-center space-x-4 p-8 border-b border-theme-border">
          <div class="w-16 h-16 bg-theme-text flex items-center justify-center relative overflow-hidden group shrink-0">
            <!-- Scanning effect -->
            <div class="absolute inset-0 bg-theme-bg/20 animate-[scan_2s_linear_infinite] pointer-events-none"></div>
            <span class="text-theme-bg font-mono font-black text-3xl">E</span>
            <div class="absolute inset-0 border-2 border-theme-bg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          <div class="flex flex-col">
            <div class="flex items-center space-x-2">
              <span class="text-[13px] font-mono uppercase tracking-widest text-theme-text font-black">Operator_0x4F</span>
              <div class="w-1.5 h-1.5 bg-theme-accent rounded-full animate-pulse"></div>
            </div>
            <span class="text-[9px] font-mono uppercase tracking-[0.3em] opacity-40 text-theme-text mt-1">Status: Synced</span>
          </div>
        </div>

        <!-- Navigation Lattice -->
        <nav class="flex flex-col flex-1 p-6 space-y-2">
          <button v-for="tab in tabs" :key="tab.id"
                  @click="activeTab = tab.id"
                  class="relative flex items-center justify-between text-left group px-4 py-4 border border-transparent transition-all"
                  :class="activeTab === tab.id ? 'bg-theme-text/5 border-theme-border' : 'hover:bg-theme-text/[0.02]'">
            
            <!-- Active Indicator -->
            <div class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/4 bg-theme-text transition-all duration-300"
                 :class="activeTab === tab.id ? 'opacity-100' : 'opacity-0 scale-y-0 group-hover:opacity-30 group-hover:scale-y-50'"></div>
            
            <div class="flex items-center space-x-4 pl-2">
              <span class="text-[10px] font-mono tracking-[0.4em] uppercase text-theme-text"
                    :class="activeTab === tab.id ? 'font-black' : 'opacity-60 group-hover:opacity-100'">
                {{ tab.label }}
              </span>
            </div>
            <span class="text-[8px] font-mono transition-opacity"
                  :class="activeTab === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'">
              {{ activeTab === tab.id ? '[ ACTIVE ]' : '[ STANDBY ]' }}
            </span>
          </button>
        </nav>
      </div>

      <!-- MAIN CONFIGURATION CONTENT -->
      <div class="flex-1 p-8 lg:p-12 relative overflow-y-auto">
        <!-- Background Decor -->
        <div class="absolute top-0 right-0 w-64 h-64 border border-theme-text opacity-[0.02] rounded-full blur-3xl pointer-events-none"></div>

        <!-- TAB: IDENTITY_CORE -->
        <div v-if="activeTab === 'identity'" class="flex flex-col space-y-12 animate-fade-in">
          <div class="flex flex-col space-y-2 border-b border-theme-border pb-6">
            <ExHeading level="h2" class="!text-2xl tracking-[0.2em]">Identity_Core</ExHeading>
            <ExText variant="telemetry" class="opacity-50">Modify central parameters for systemic integration.</ExText>
          </div>

          <!-- Input Matrix -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div class="flex flex-col space-y-4">
              <div class="flex items-center justify-between border-b border-theme-border pb-2">
                <span class="text-[9px] font-mono uppercase tracking-[0.4em] opacity-60">Designation</span>
                <span class="text-[8px] font-mono uppercase tracking-widest opacity-20">AUTH_01</span>
              </div>
              <input type="text" value="Evan Vosh" 
                     class="w-full bg-theme-bg border border-theme-border p-4 text-[12px] font-mono tracking-widest focus:outline-none focus:border-theme-text transition-all text-theme-text placeholder:opacity-20 uppercase" />
            </div>

            <div class="flex flex-col space-y-4">
              <div class="flex items-center justify-between border-b border-theme-border pb-2">
                <span class="text-[9px] font-mono uppercase tracking-[0.4em] opacity-60">Comms_Channel</span>
                <span class="text-[8px] font-mono uppercase tracking-widest opacity-20">AUTH_02</span>
              </div>
              <input type="email" value="evan@genesis.app" 
                     class="w-full bg-theme-bg border border-theme-border p-4 text-[12px] font-mono tracking-widest focus:outline-none focus:border-theme-text transition-all text-theme-text placeholder:opacity-20 uppercase" />
            </div>
          </div>

          <!-- Tactical Toggles -->
          <div class="flex flex-col space-y-6 pt-8 border-t border-theme-border">
            <ExText variant="telemetry" class="opacity-40">Systemic_Overrides</ExText>

            <!-- Toggle: Cross-Node Sync -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-theme-border bg-theme-text/[0.02] hover:border-theme-text/40 transition-colors">
              <div class="flex flex-col">
                <span class="text-[11px] font-mono font-black uppercase tracking-widest">Cross-Node Sync</span>
                <span class="text-[9px] font-mono opacity-50 tracking-[0.2em] uppercase mt-1">Maintain identical configuration across all archival nodes.</span>
              </div>
              <label class="relative flex items-center cursor-pointer group">
                <input type="checkbox" v-model="settings.crossNodeSync" class="sr-only peer" />
                <div class="w-10 h-4 border border-theme-border peer-checked:border-theme-text flex items-center px-0.5 transition-colors">
                  <div class="w-3 h-3 bg-theme-border peer-checked:bg-theme-text peer-checked:translate-x-5 transition-transform duration-300"></div>
                </div>
                <span class="ml-4 text-[9px] w-12 font-mono tracking-[0.3em] uppercase transition-opacity"
                      :class="settings.crossNodeSync ? 'opacity-100 font-black' : 'opacity-40'">
                  {{ settings.crossNodeSync ? 'Active' : 'Bypass' }}
                </span>
              </label>
            </div>
            
            <!-- Toggle: Developer Mode -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-theme-border bg-theme-text/[0.02] hover:border-theme-text/40 transition-colors">
              <div class="flex flex-col">
                <span class="text-[11px] font-mono font-black uppercase tracking-widest">Developer Mode</span>
                <span class="text-[9px] font-mono opacity-50 tracking-[0.2em] uppercase mt-1">Enable deep diagnostic overlays and experimental protocols.</span>
              </div>
              <label class="relative flex items-center cursor-pointer group">
                <input type="checkbox" v-model="settings.devMode" class="sr-only peer" />
                <div class="w-10 h-4 border border-theme-border peer-checked:border-theme-text flex items-center px-0.5 transition-colors">
                  <div class="w-3 h-3 bg-theme-border peer-checked:bg-theme-text peer-checked:translate-x-5 transition-transform duration-300"></div>
                </div>
                <span class="ml-4 text-[9px] w-12 font-mono tracking-[0.3em] uppercase transition-opacity"
                      :class="settings.devMode ? 'opacity-100 font-black' : 'opacity-40'">
                  {{ settings.devMode ? 'Active' : 'Bypass' }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- TAB: SECURITY_MATRIX -->
        <div v-else-if="activeTab === 'security'" class="flex flex-col space-y-12 animate-fade-in">
          <div class="flex flex-col space-y-2 border-b border-theme-border pb-6">
            <ExHeading level="h2" class="!text-2xl tracking-[0.2em]">Security_Matrix</ExHeading>
            <ExText variant="telemetry" class="opacity-50">Manage authentication protocols and session persistence.</ExText>
          </div>

          <div class="flex flex-col space-y-8">
            <div class="flex items-center justify-between p-6 border border-theme-border bg-theme-text/[0.02]">
               <div class="flex flex-col">
                  <span class="text-[11px] font-mono font-black uppercase tracking-widest">Encryption Key</span>
                  <span class="text-[9px] font-mono opacity-50 tracking-[0.2em] uppercase mt-1">Last rotated: 42 cycles ago.</span>
               </div>
               <ExButton variant="tactical">Rotate_Key</ExButton>
            </div>

            <!-- Toggle: 2FA -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-theme-border bg-theme-text/[0.02] hover:border-theme-text/40 transition-colors">
              <div class="flex flex-col">
                <span class="text-[11px] font-mono font-black uppercase tracking-widest">Two-Factor Authentication</span>
                <span class="text-[9px] font-mono opacity-50 tracking-[0.2em] uppercase mt-1">Require physical verification for critical tactical actions.</span>
              </div>
              <label class="relative flex items-center cursor-pointer group">
                <input type="checkbox" v-model="settings.twoFactor" class="sr-only peer" />
                <div class="w-10 h-4 border border-theme-border peer-checked:border-theme-text flex items-center px-0.5 transition-colors">
                  <div class="w-3 h-3 bg-theme-border peer-checked:bg-theme-text peer-checked:translate-x-5 transition-transform duration-300"></div>
                </div>
                <span class="ml-4 text-[9px] w-12 font-mono tracking-[0.3em] uppercase transition-opacity"
                      :class="settings.twoFactor ? 'opacity-100 font-black' : 'opacity-40'">
                  {{ settings.twoFactor ? 'Active' : 'Bypass' }}
                </span>
              </label>
            </div>

            <!-- Active Sessions -->
            <div class="flex flex-col space-y-4 pt-8 border-t border-theme-border">
               <ExText variant="telemetry" class="opacity-40">Active_Link_Sessions</ExText>
               <div class="border border-theme-border overflow-hidden">
                  <div class="grid grid-cols-4 gap-4 p-4 bg-theme-text/5 border-b border-theme-border text-[9px] font-mono uppercase tracking-widest opacity-60">
                     <span class="col-span-2">Origin</span>
                     <span>Status</span>
                     <span class="text-right">Action</span>
                  </div>
                  <div class="grid grid-cols-4 gap-4 p-4 items-center hover:bg-theme-text/[0.02] transition-colors border-b border-theme-border">
                     <div class="col-span-2 flex flex-col">
                        <span class="text-[11px] font-mono font-black uppercase tracking-widest">Main_Terminal // macOS</span>
                        <span class="text-[8px] font-mono opacity-40 tracking-[0.2em] uppercase">IP: 192.168.0.42</span>
                     </div>
                     <div class="flex items-center space-x-2">
                        <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span class="text-[9px] font-mono uppercase tracking-[0.3em]">Current</span>
                     </div>
                     <div class="text-right">
                        <span class="text-[9px] font-mono uppercase tracking-[0.3em] opacity-30">Active</span>
                     </div>
                  </div>
                  <div class="grid grid-cols-4 gap-4 p-4 items-center hover:bg-theme-text/[0.02] transition-colors">
                     <div class="col-span-2 flex flex-col">
                        <span class="text-[11px] font-mono font-black uppercase tracking-widest">Mobile_Node // iOS</span>
                        <span class="text-[8px] font-mono opacity-40 tracking-[0.2em] uppercase">IP: 10.0.1.15</span>
                     </div>
                     <div class="flex items-center space-x-2">
                        <div class="w-1 h-1 bg-theme-text opacity-40"></div>
                        <span class="text-[9px] font-mono uppercase tracking-[0.3em] opacity-60">Dormant</span>
                     </div>
                     <div class="text-right">
                        <button class="text-[9px] font-mono uppercase tracking-[0.3em] text-red-500 hover:text-red-400 transition-colors">Sever</button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        <!-- TAB: NETWORK_RELAY -->
        <div v-else-if="activeTab === 'network'" class="flex flex-col space-y-12 animate-fade-in">
          <div class="flex flex-col space-y-2 border-b border-theme-border pb-6">
            <ExHeading level="h2" class="!text-2xl tracking-[0.2em]">Network_Relay</ExHeading>
            <ExText variant="telemetry" class="opacity-50">Manage external connections and API tokens.</ExText>
          </div>
          
          <div class="flex flex-col items-center justify-center py-20 border border-dashed border-theme-border bg-theme-text/[0.02]">
             <div class="relative w-16 h-16 mb-8">
                <div class="absolute inset-0 border border-theme-text opacity-20 rotate-45 animate-spin-slow"></div>
                <div class="absolute inset-2 border border-theme-text opacity-40 rotate-[15deg] animate-spin-slow-reverse"></div>
                <div class="absolute inset-0 flex items-center justify-center text-xl font-mono font-black text-theme-text">N</div>
             </div>
             <span class="text-[11px] font-mono font-black uppercase tracking-widest mb-2">No Active Integrations</span>
             <span class="text-[9px] font-mono opacity-40 tracking-[0.2em] uppercase max-w-md text-center leading-relaxed">
               System is operating in isolated mode. Connect API endpoints to enable real-time tactical synchronization.
             </span>
             <ExButton variant="solid" class="mt-8">Generate_API_Token</ExButton>
          </div>
        </div>

        <!-- TAB: ARCHIVAL_PREFS -->
        <div v-else-if="activeTab === 'archival'" class="flex flex-col space-y-12 animate-fade-in">
          <div class="flex flex-col space-y-2 border-b border-theme-border pb-6">
            <ExHeading level="h2" class="!text-2xl tracking-[0.2em]">Archival_Prefs</ExHeading>
            <ExText variant="telemetry" class="opacity-50">Storage limits and local reification settings.</ExText>
          </div>

          <div class="flex flex-col space-y-8">
             <div class="flex flex-col space-y-4">
                <div class="flex items-center justify-between">
                   <span class="text-[9px] font-mono uppercase tracking-[0.4em] opacity-60">Storage_Allocation</span>
                   <span class="text-[9px] font-mono uppercase tracking-widest font-black">42.8 GB / 100 GB</span>
                </div>
                <div class="h-2 w-full bg-theme-text/[0.05] border border-theme-border overflow-hidden flex">
                   <div class="h-full bg-theme-text" style="width: 42.8%"></div>
                </div>
             </div>

             <div class="flex flex-col space-y-4">
               <div class="flex items-center justify-between border-b border-theme-border pb-2">
                 <span class="text-[9px] font-mono uppercase tracking-[0.4em] opacity-60">Default_Export_Format</span>
                 <span class="text-[8px] font-mono uppercase tracking-widest opacity-20">PREF_01</span>
               </div>
               <select class="w-full bg-theme-bg border border-theme-border p-4 text-[12px] font-mono tracking-widest focus:outline-none focus:border-theme-text transition-all text-theme-text uppercase appearance-none cursor-pointer">
                  <option value="json">Raw JSON Matrix</option>
                  <option value="csv">CSV Tactical Log</option>
                  <option value="pdf">Visual PDF Report</option>
               </select>
             </div>
          </div>
        </div>

        <!-- GLOBAL SAVE FOOTER -->
        <div class="absolute bottom-0 left-0 w-full p-8 border-t border-theme-border bg-theme-bg/90 backdrop-blur-md flex items-center justify-between">
           <div class="flex items-center space-x-3 text-[9px] font-mono tracking-[0.4em] uppercase">
              <span class="opacity-40">Profile_State:</span>
              <span class="text-green-500 font-black">Optimal</span>
           </div>
           <ExButton variant="tactical">Commit_All_Changes</ExButton>
        </div>

      </div>
    </div>
  </ExPanel>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ExPanel from '~/shared/ui/ExPanel.vue'
import ExButton from '~/shared/ui/ExButton.vue'
import ExHeading from '~/shared/ui/ExHeading.vue'
import ExText from '~/shared/ui/ExText.vue'

const activeTab = ref('identity')

const tabs = [
  { id: 'identity', label: 'Identity_Core' },
  { id: 'security', label: 'Security_Matrix' },
  { id: 'network', label: 'Network_Relay' },
  { id: 'archival', label: 'Archival_Prefs' }
]

const settings = reactive({
  crossNodeSync: true,
  devMode: false,
  twoFactor: false
})
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
