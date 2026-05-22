import { ref } from 'vue'
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '~/shared/firebase.client'

export interface DailyActivity {
  date: string // YYYY-MM-DD
  note: string
}

export const isSubmittingActivity = ref(false)
export const activityStatus = ref<'idle' | 'success' | 'error'>('idle')

export function calculateStreak(activities: DailyActivity[]): number {
  if (!activities || activities.length === 0) return 0
  
  // Sort by date descending
  const sorted = [...activities].sort((a, b) => b.date.localeCompare(a.date))
  
  const today = new Date()
  const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = new Date(yesterday.getTime() - (yesterday.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
  
  // If the last activity is not today or yesterday, streak is 0
  if (sorted[0]?.date !== todayStr && sorted[0]?.date !== yesterdayStr) return 0
  
  let streak = 1
  for (let i = 0; i < sorted.length - 1; i++) {
    const sCurrent = sorted[i]
    const sNext = sorted[i+1]
    
    if (!sCurrent || !sNext) break

    const current = new Date(sCurrent.date)
    const next = new Date(sNext.date)
    
    // Check if next is exactly one day before current
    const diffTime = current.getTime() - next.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      streak++
    } else if (diffDays === 0) {
      // same day, skip
      continue
    } else {
      break
    }
  }
  
  return streak
}

export async function submitDailyActivity(
  userId: string,
  note: string,
  date: string
) {
  if (!userId) return

  isSubmittingActivity.value = true
  activityStatus.value = 'idle'

  try {
    const userRef = doc(db, 'users', userId)
    
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      const userData = userSnap.data()
      const dailyActivity: DailyActivity[] = userData.dailyActivity || []
      
      const existingEntryIndex = dailyActivity.findIndex(a => a.date === date)
      
      if (existingEntryIndex >= 0 && dailyActivity[existingEntryIndex]) {
        dailyActivity[existingEntryIndex].note = note.trim()
        await updateDoc(userRef, {
          dailyActivity
        })
      } else {
        await updateDoc(userRef, {
          dailyActivity: arrayUnion({
            date: date,
            note: note.trim()
          })
        })
      }
    }

    activityStatus.value = 'success'
  } catch (e) {
    console.error(e)
    activityStatus.value = 'error'
  } finally {
    isSubmittingActivity.value = false
  }
}
