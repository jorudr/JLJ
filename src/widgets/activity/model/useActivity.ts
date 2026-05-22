import { ref, computed, nextTick } from 'vue'
import { useAuthStore } from '~/entities/user/auth.store'
import { useForumStore } from '~/features/store/useForum'

export function useActivity() {
    const auth = useAuthStore()
    const forum = useForumStore()

    const activeUserId = computed(() => auth.user?.uid)
    const activeUser = computed(() => activeUserId.value ? forum.users.get(activeUserId.value) : null)

    const isSubmittingActivity = ref(false)
    const todaysNote = ref('')
    const heatmapContainer = ref<HTMLElement | null>(null)

    const tooltipState = ref({
        show: false,
        x: 0,
        y: 0,
        content: ''
    })

    const getTodayDateString = () => {
        const d = new Date()
        return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0] || ''
    }

    const todayStr = getTodayDateString()

    const calculateStreak = (activities: any[]) => {
        if (!activities.length) return 0
        const sorted = [...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        let streak = 0
        let current = new Date()
        current.setHours(0, 0, 0, 0)

        for (const act of sorted) {
            const actDate = new Date(act.date)
            actDate.setHours(0, 0, 0, 0)
            const diff = (current.getTime() - actDate.getTime()) / (1000 * 60 * 60 * 24)
            if (diff <= 1) {
                streak++
                current = actDate
            } else break
        }
        return streak
    }

    const dailyActivityList = computed(() => activeUser.value?.dailyActivity || [])
    const checkInUsedToday = computed(() => dailyActivityList.value.some((a: any) => a.date === todayStr))
    const currentStreak = computed(() => calculateStreak(dailyActivityList.value))

    const heatmapCells = computed(() => {
        const cells = []
        const now = new Date()
        const totalDays = 126
        const dayOfWeek = now.getDay()
        const daysToEndOfWeek = 6 - dayOfWeek
        const totalVisible = totalDays + daysToEndOfWeek

        for (let i = totalVisible; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i + daysToEndOfWeek)
            const dateStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
            const isFuture = d > now
            const activity = !isFuture ? dailyActivityList.value.find((a: any) => a.date === dateStr) : null

            cells.push({
                date: dateStr,
                active: !!activity,
                isFuture,
                label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d)
            })
        }
        return cells
    })

    const submitDailyActivity = async (userId: string, note: string, date: string) => {
        isSubmittingActivity.value = true
        try {
            // Mocking the update into the store as we don't have the specific composable here
            console.log('Submitting activity:', { userId, note, date })
            // In a real implementation, you'd likely call an action on a store or a service
        } finally {
            isSubmittingActivity.value = false
        }
    }

    const handleCheckIn = async () => {
        const userId = activeUserId.value
        if (!userId) return
        await submitDailyActivity(userId, todaysNote.value, todayStr)
    }

    const initializeArchive = async () => {
        if (!activeUserId.value) return
        await forum.fetchUser(activeUserId.value)
        await forum.fetchThreadList()
        nextTick(() => {
            if (heatmapContainer.value) {
                (heatmapContainer.value as HTMLElement).scrollLeft = (heatmapContainer.value as HTMLElement).scrollWidth
            }
        })
    }

    const handleMouseEnter = (event: MouseEvent, cell: any) => {
        const target = event.target as HTMLElement
        const rect = target.getBoundingClientRect()
        let statusText = cell.active ? 'Active Record' : 'Void'
        if (cell.isFuture) statusText = 'Temporal Unknown'

        tooltipState.value = {
            show: true,
            x: rect.left + rect.width / 2,
            y: rect.top,
            content: `${cell.label} • ${statusText}`
        }
    }

    const handleMouseLeave = () => {
        tooltipState.value.show = false
    }

    return {
        auth,
        forum,
        activeUserId,
        activeUser,
        isSubmittingActivity,
        todaysNote,
        heatmapContainer,
        tooltipState,
        todayStr,
        dailyActivityList,
        checkInUsedToday,
        currentStreak,
        heatmapCells,
        handleCheckIn,
        initializeArchive,
        handleMouseEnter,
        handleMouseLeave
    }
}
