import { ref, computed } from 'vue'
import { translations, type Locale } from './translations'

// Global state for persistence
const currentLocale = ref<Locale>('en')

// Load initial locale from localStorage if available (for Tauri/Web persistence)
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('app_locale') as Locale
  if (saved && translations[saved]) {
    currentLocale.value = saved
  }
}

export function useI18n() {
  const setLocale = (locale: Locale) => {
    if (translations[locale]) {
      currentLocale.value = locale
      localStorage.setItem('app_locale', locale)
    }
  }

  // The helper function described by the user for {{ t('key') }}
  const t = (path: string): string => {
    const keys = path.split('.')
    let result: any = translations[currentLocale.value]
    
    for (const key of keys) {
      if (result && result[key]) {
        result = result[key]
      } else {
        // Fallback to English if key missing in current locale
        result = translations['en']
        for (const fallbackKey of keys) {
          result = result?.[fallbackKey]
        }
        return result || path // Return path if totally missing
      }
    }
    
    return typeof result === 'string' ? result : path
  }

  const tm = (path: string): any => {
    const keys = path.split('.')
    let result: any = translations[currentLocale.value]

    for (const key of keys) {
      if (result && result[key]) {
        result = result[key]
      } else {
        result = translations.en
        for (const fallbackKey of keys) {
          result = result?.[fallbackKey]
        }
        return result || {}
      }
    }

    return result
  }

  return {
    locale: computed(() => currentLocale.value),
    setLocale,
    t,
    tm
  }
}
