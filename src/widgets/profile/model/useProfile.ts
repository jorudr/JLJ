import { ref } from 'vue'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '~/shared/firebase.client'

export const isSubmitting = ref(false)
export const status = ref<'idle' | 'success' | 'error'>('idle')

export const FOCUS_OPTIONS = [
  'Equities', 'Macro', 'Fixed Income', 'Order Flow', 'FX', 
  'Commodities', 'Crypto', 'Technical Analysis', 'Quantitative', 'Risk Management'
]

export const ACTIVITY_OPTIONS = [
  'Long-form', 'Technical Charts', 'Deep Research', 
  'Intraday Journal', 'Strategic Analysis', 'Weekly Briefings'
]

export async function changeBio(
  authorId: string,
  profileId: string,
  bio: string
) {
  if (authorId !== profileId) return
  if (!bio.trim()) return

  isSubmitting.value = true
  status.value = 'idle'

  try {
    const userRef = doc(db, 'users', authorId)

    await updateDoc(userRef, {
      bio: bio.trim()
    })

    status.value = 'success'
  } catch (e) {
    console.error(e)
    status.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

export async function changeName(
  authorId: string,
  profileId: string,
  displayName: string
) {
  if (authorId !== profileId) return
  if (!displayName.trim()) return

  isSubmitting.value = true
  status.value = 'idle'

  try {
    const userRef = doc(db, 'users', authorId)

    await updateDoc(userRef, {
      displayName: displayName.trim()
    })

    status.value = 'success'
  } catch (e) {
    console.error(e)
    status.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

import { arrayUnion, arrayRemove, increment } from 'firebase/firestore'

export async function followUser(
  currentUserId: string,
  targetUserId: string
) {
  if (currentUserId === targetUserId) return

  isSubmitting.value = true
  status.value = 'idle'

  try {
    const currentUserRef = doc(db, 'users', currentUserId)
    const targetUserRef = doc(db, 'users', targetUserId)

    await updateDoc(currentUserRef, {
      followed: arrayUnion(targetUserId)
    })

    await updateDoc(targetUserRef, {
      followers: increment(1)
    })

    status.value = 'success'
  } catch (e) {
    console.error(e)
    status.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
) {
  if (currentUserId === targetUserId) return

  isSubmitting.value = true
  status.value = 'idle'

  try {
    const currentUserRef = doc(db, 'users', currentUserId)
    const targetUserRef = doc(db, 'users', targetUserId)

    await updateDoc(currentUserRef, {
      followed: arrayRemove(targetUserId)
    })

    await updateDoc(targetUserRef, {
      followers: increment(-1)
    })

    status.value = 'success'
  } catch (e) {
    console.error(e)
    status.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

export async function updateProfileFields(
  authorId: string,
  profileId: string,
  data: any
) {
  if (authorId !== profileId) return

  isSubmitting.value = true
  status.value = 'idle'

  try {
    const userRef = doc(db, 'users', authorId)
    await updateDoc(userRef, data)
    status.value = 'success'
  } catch (e) {
    console.error(e)
    status.value = 'error'
    throw e
  } finally {
    isSubmitting.value = false
  }
}

