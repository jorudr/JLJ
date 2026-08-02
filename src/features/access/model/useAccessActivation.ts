import { ref } from 'vue'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore'
import { auth, db } from '~/shared/firebase.client'

export type AccessActivationState = 'checking' | 'requires_key' | 'granted' | 'error'

const DEFAULT_ACCESS_WORKER_URL = 'https://exgenesis-access-worker.waltzno19inaminor.workers.dev'
const MAX_ACCESS_KEY_ATTEMPTS = 5
const ACCESS_KEY_LOCK_MS = 15 * 60 * 1000
const accessState = ref<AccessActivationState>('checking')
const accessError = ref('')
const accessLockRemainingSeconds = ref(0)
const accessAttemptFailedCount = ref(0)
let accessUnsubscribe: (() => void) | null = null
let accessAttemptsUnsubscribe: (() => void) | null = null
let accessLockTimer: ReturnType<typeof setInterval> | null = null
let activeUserId = ''
let activeLockUntilMs = 0

function getAccessWorkerUrl(): string {
  const configured = String(import.meta.env.VITE_ACCESS_WORKER_URL || '').trim()
  return (configured || DEFAULT_ACCESS_WORKER_URL).replace(/\/$/, '')
}

function getAccessErrorMessage(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return 'Unable to activate access. Please try again.'
}

function getAccessAttemptsRef(userId: string) {
  return doc(db, 'users', userId, 'accessKeyAttempts', 'state')
}

function toMillis(value: unknown): number {
  if (!value) return 0
  if (value instanceof Timestamp) return value.toMillis()
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'object' && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value).getTime()
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function updateAccessLockRemaining() {
  accessLockRemainingSeconds.value = Math.max(0, Math.ceil((activeLockUntilMs - Date.now()) / 1000))
}

function ensureAccessLockTimer() {
  if (accessLockTimer || typeof window === 'undefined') return
  accessLockTimer = window.setInterval(updateAccessLockRemaining, 1000)
}

function stopAccessLockTimer() {
  if (!accessLockTimer) return
  clearInterval(accessLockTimer)
  accessLockTimer = null
}

async function readAccessAttemptLock(userId: string): Promise<number> {
  const snapshot = await getDoc(getAccessAttemptsRef(userId))
  const data = snapshot.data()
  const lockedUntilMs = toMillis(data?.lockedUntil)
  activeLockUntilMs = lockedUntilMs
  accessAttemptFailedCount.value = Number(data?.failedCount || 0)
  updateAccessLockRemaining()
  return accessLockRemainingSeconds.value
}

async function recordAccessAttemptFailure(userId: string, forceLock = false) {
  const snapshot = await getDoc(getAccessAttemptsRef(userId))
  const data = snapshot.data()
  const previousFailedCount = Math.max(0, Number(data?.failedCount || 0))
  const failedCount = forceLock ? MAX_ACCESS_KEY_ATTEMPTS : Math.min(MAX_ACCESS_KEY_ATTEMPTS, previousFailedCount + 1)
  const shouldLock = failedCount >= MAX_ACCESS_KEY_ATTEMPTS
  const lockedUntil = shouldLock ? new Date(Date.now() + ACCESS_KEY_LOCK_MS) : null

  await setDoc(getAccessAttemptsRef(userId), {
    failedCount,
    lockedUntil: lockedUntil ? Timestamp.fromDate(lockedUntil) : null,
    lastFailedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true })

  activeLockUntilMs = lockedUntil?.getTime() || 0
  accessAttemptFailedCount.value = failedCount
  updateAccessLockRemaining()
}

async function resetAccessAttemptFailure(userId: string) {
  await setDoc(getAccessAttemptsRef(userId), {
    failedCount: 0,
    lockedUntil: null,
    updatedAt: serverTimestamp()
  }, { merge: true })

  activeLockUntilMs = 0
  accessAttemptFailedCount.value = 0
  updateAccessLockRemaining()
}

export function useAccessActivation() {
  const beginAccessListener = (userId?: string | null) => {
    const normalizedUserId = String(userId || '').trim()
    if (accessUnsubscribe && activeUserId === normalizedUserId) return

    accessUnsubscribe?.()
    accessAttemptsUnsubscribe?.()
    accessUnsubscribe = null
    accessAttemptsUnsubscribe = null
    activeUserId = normalizedUserId
    activeLockUntilMs = 0
    accessAttemptFailedCount.value = 0
    accessLockRemainingSeconds.value = 0
    accessError.value = ''

    if (!normalizedUserId) {
      accessState.value = 'checking'
      stopAccessLockTimer()
      return
    }

    ensureAccessLockTimer()
    accessState.value = 'checking'
    accessUnsubscribe = onSnapshot(
      doc(db, 'users', normalizedUserId, 'access', 'state'),
      (snapshot) => {
        const data = snapshot.data()
        accessState.value = data?.isActivated === true ? 'granted' : 'requires_key'
        if (accessState.value !== 'error') accessError.value = ''
      },
      () => {
        accessState.value = 'error'
        accessError.value = 'Unable to verify your access status.'
      }
    )

    accessAttemptsUnsubscribe = onSnapshot(
      getAccessAttemptsRef(normalizedUserId),
      (snapshot) => {
        const data = snapshot.data()
        accessAttemptFailedCount.value = Number(data?.failedCount || 0)
        activeLockUntilMs = toMillis(data?.lockedUntil)
        updateAccessLockRemaining()
      },
      () => {
        activeLockUntilMs = 0
        accessLockRemainingSeconds.value = 0
      }
    )
  }

  const stopAccessListener = () => {
    accessUnsubscribe?.()
    accessAttemptsUnsubscribe?.()
    accessUnsubscribe = null
    accessAttemptsUnsubscribe = null
    activeUserId = ''
    activeLockUntilMs = 0
    accessAttemptFailedCount.value = 0
    accessLockRemainingSeconds.value = 0
    accessError.value = ''
    accessState.value = 'checking'
    stopAccessLockTimer()
  }

  const retryAccessCheck = () => {
    beginAccessListener(activeUserId)
  }

  const activateAccessKey = async (key: string): Promise<boolean> => {
    const currentUser = auth.currentUser
    if (!currentUser || currentUser.uid !== activeUserId) {
      accessState.value = 'error'
      accessError.value = 'Your authentication session has expired. Please sign in again.'
      return false
    }

    accessError.value = ''
    try {
      let lockRemainingSeconds = 0
      try {
        lockRemainingSeconds = await readAccessAttemptLock(currentUser.uid)
      } catch (error) {
        console.warn('[Access] Unable to read local activation attempt lock:', error)
      }

      if (lockRemainingSeconds > 0) {
        accessError.value = 'Activation is temporarily locked. Please wait before trying again.'
        accessState.value = 'requires_key'
        return false
      }

      const idToken = await currentUser.getIdToken()
      const response = await fetch(`${getAccessWorkerUrl()}/v1/redeem`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key })
      })
      const payload = await response.json().catch(() => ({})) as { activated?: boolean; error?: unknown }
      if (!response.ok || payload.activated !== true) {
        accessError.value = getAccessErrorMessage(payload.error)
        try {
          await recordAccessAttemptFailure(currentUser.uid, response.status === 429)
        } catch (error) {
          console.warn('[Access] Unable to record failed activation attempt:', error)
        }
        accessState.value = 'requires_key'
        return false
      }

      try {
        await resetAccessAttemptFailure(currentUser.uid)
      } catch (error) {
        console.warn('[Access] Unable to reset activation attempts:', error)
      }
      accessState.value = 'granted'
      return true
    } catch {
      accessError.value = 'Unable to reach the access service. Please try again.'
      accessState.value = 'requires_key'
      return false
    }
  }

  return {
    accessState,
    accessError,
    accessLockRemainingSeconds,
    accessAttemptFailedCount,
    beginAccessListener,
    stopAccessListener,
    retryAccessCheck,
    activateAccessKey
  }
}
