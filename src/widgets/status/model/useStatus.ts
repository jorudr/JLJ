import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/entities/user/auth.store'

export const useStatus = () => {
    const auth = useAuthStore()
    const user = computed(() => auth.user)
    
    const currentTimeReadout = ref("")
    let tickerTimer: ReturnType<typeof setInterval> | null = null

    const updateTicker = () => {
        const now = new Date()
        const yr = now.getFullYear()
        const mo = String(now.getMonth() + 1).padStart(2, '0')
        const dy = String(now.getDate()).padStart(2, '0')
        const hh = String(now.getHours()).padStart(2, '0')
        const mm = String(now.getMinutes()).padStart(2, '0')
        const ss = String(now.getSeconds()).padStart(2, '0')
        currentTimeReadout.value = `YR_${yr}.MO_${mo}.DY_${dy} // ${hh}:${mm}:${ss}`
    }

    onMounted(() => {
        updateTicker()
        tickerTimer = setInterval(updateTicker, 1000)
    })

    onUnmounted(() => {
        if (tickerTimer) clearInterval(tickerTimer)
    })
    
    return {
        user,
        currentTimeReadout
    }
}
