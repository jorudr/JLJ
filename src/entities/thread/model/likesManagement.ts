import { doc, runTransaction, serverTimestamp, increment, getDoc } from 'firebase/firestore'
import { db } from '@/shared/firebase.client'

export async function likeThread(threadId: string, userId: string) {
  const threadRef = doc(db, 'threads', threadId)
  const likeRef = doc(db, 'threads', threadId, 'likes', userId)

  await runTransaction(db, async (transaction) => {
    const likeSnap = await transaction.get(likeRef)

    if (likeSnap.exists()) {
      return
    }

    transaction.set(likeRef, {
      createdAt: serverTimestamp()
    })

    transaction.update(threadRef, {
      likesCount: increment(1)
    })
  })
}

export async function removeThreadLike(threadId: string, userId: string) {
  const threadRef = doc(db, 'threads', threadId)
  const likeRef = doc(db, 'threads', threadId, 'likes', userId)

  await runTransaction(db, async (transaction) => {
    const likeSnap = await transaction.get(likeRef)

    if (!likeSnap.exists()) {
      return
    }

    transaction.delete(likeRef)

    transaction.update(threadRef, {
      likesCount: increment(-1)
    })
  })
}

export async function isThreadLikedByUser(threadId: string, userId: string) {
  if (!userId) return false
  const likeRef = doc(db, 'threads', threadId, 'likes', userId)
  const snap = await getDoc(likeRef)
  return snap.exists()
}
