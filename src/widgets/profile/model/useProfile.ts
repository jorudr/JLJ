import { ref, onMounted } from 'vue'
import { getAuth, updateProfile, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '~/shared/firebase.client'
import { useAuthStore } from '~/entities/user/auth.store'
import { useI18n } from '~/shared/i18n/useI18n'
import { useRouter } from 'vue-router'

export type ProfileTab = 'PROFILE' | 'APPEARANCE'

export function useProfile() {
  const { locale } = useI18n()
  const authStore = useAuthStore()
  const router = useRouter()

  const activeTab = ref<ProfileTab>('PROFILE')
  const displayName = ref('')
  const description = ref('')
  const isSubmitting = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  const loadProfile = async () => {
    if (authStore.user) {
      displayName.value = authStore.user.displayName || ''
      try {
        const userDoc = await getDoc(doc(db, 'users', authStore.user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          if (data.description) {
            description.value = data.description
          }
        }
      } catch (e) {
        console.error('Failed to load user profile description', e)
      }
    }
  }

  const navigateBack = () => {
    router.push('/')
  }

  const handleSignOut = async () => {
    try {
      const auth = getAuth()
      await signOut(auth)
      authStore.clearUser()
      navigateBack()
    } catch (error: any) {
      console.error('Failed to sign out', error)
    }
  }

  const saveProfile = async () => {
    errorMessage.value = ''
    successMessage.value = ''
    
    if (!authStore.user) {
      errorMessage.value = locale.value === 'ru' ? 'Ошибка аутентификации' : 'Authentication error'
      return
    }

    const trimmedName = displayName.value.trim()
    const trimmedDesc = description.value.trim()
    
    if (!trimmedName) {
      errorMessage.value = locale.value === 'ru' ? 'Никнейм обязателен' : 'Nickname is required'
      return
    }

    isSubmitting.value = true

    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (currentUser) {
        await updateProfile(currentUser, {
          displayName: trimmedName
        })
      }
      
      const userRef = doc(db, 'users', authStore.user.uid)
      await setDoc(userRef, {
        displayName: trimmedName,
        description: trimmedDesc
      }, { merge: true })
      
      if (authStore.user) {
        authStore.user.displayName = trimmedName
      }

      successMessage.value = locale.value === 'ru' ? 'ПРОФИЛЬ УСПЕШНО ОБНОВЛЕН' : 'PROFILE SUCCESSFULLY UPDATED'
      
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)

    } catch (error: any) {
      console.error('Failed to update profile:', error)
      errorMessage.value = `${locale.value === 'ru' ? 'ОШИБКА' : 'ERROR'}: ${error.message}`
    } finally {
      isSubmitting.value = false
    }
  }

  onMounted(() => {
    loadProfile()
  })

  return {
    activeTab,
    displayName,
    description,
    isSubmitting,
    errorMessage,
    successMessage,
    loadProfile,
    saveProfile,
    handleSignOut,
    navigateBack,
    locale
  }
}
