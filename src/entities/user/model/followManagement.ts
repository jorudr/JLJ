import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore'
import { db } from '@/shared/firebase.client'

export async function followUser(currentUserId: string, targetUserId: string) {
  if (!currentUserId || !targetUserId) return
  const userRef = doc(db, 'users', currentUserId)
  await updateDoc(userRef, {
    followed: arrayUnion(targetUserId)
  })
}

export async function unfollowUser(currentUserId: string, targetUserId: string) {
  if (!currentUserId || !targetUserId) return
  const userRef = doc(db, 'users', currentUserId)
  await updateDoc(userRef, {
    followed: arrayRemove(targetUserId)
  })
}

export async function isFollowingUser(currentUserId: string, targetUserId: string) {
  if (!currentUserId || !targetUserId) return false
  const userRef = doc(db, 'users', currentUserId)
  const snap = await getDoc(userRef)
  if (!snap.exists()) return false
  const data = snap.data()
  return data.followed?.includes(targetUserId) || false
}
