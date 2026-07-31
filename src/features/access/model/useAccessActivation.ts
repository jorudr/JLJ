import { ref } from 'vue'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '~/shared/firebase.client'

export type AccessActivationState = 'checking' | 'requires_key' | 'granted' | 'error'

const DEFAULT_ACCESS_WORKER_URL = 'https://exgenesis-access-worker.waltzno19inaminor.workers.dev'
const accessState = ref<AccessActivationState>('checking')
const accessError = ref('')
let accessUnsubscribe: (() => void) | null = null
let activeUserId = ''

function getAccessWorkerUrl(): string {
  const configured = String(import.meta.env.VITE_ACCESS_WORKER_URL || '').trim()
  return (configured || DEFAULT_ACCESS_WORKER_URL).replace(/\/$/, '')
}

function getAccessErrorMessage(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return 'Unable to activate access. Please try again.'
}

export function useAccessActivation() {
  const beginAccessListener = (userId?: string | null) => {
    const normalizedUserId = String(userId || '').trim()
    if (accessUnsubscribe && activeUserId === normalizedUserId) return

    accessUnsubscribe?.()
    accessUnsubscribe = null
    activeUserId = normalizedUserId
    accessError.value = ''

    if (!normalizedUserId) {
      accessState.value = 'checking'
      return
    }

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
  }

  const stopAccessListener = () => {
    accessUnsubscribe?.()
    accessUnsubscribe = null
    activeUserId = ''
    accessError.value = ''
    accessState.value = 'checking'
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
        accessState.value = 'requires_key'
        return false
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
    beginAccessListener,
    stopAccessListener,
    retryAccessCheck,
    activateAccessKey
  }
}
