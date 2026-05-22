import { defineStore } from 'pinia'
import { loadFromDisk, saveToDisk } from '~/shared/diskStorage'

export interface ThemeSettings {
  headerBg: string
  footerBg: string
  contentBg: string
  isGradient: boolean
  gradientAngle: number
  gradientStart: string
  gradientEnd: string
  themeName: string
  isDark: boolean
  useHeaderBlur: boolean
  bgImage: string
  bgImageBlur: number
  bgImageOpacity: number
  bgImageBrightness: number
  isImageBg: boolean
}

const DEFAULT_THEME: ThemeSettings = {
  headerBg: 'transparent',
  footerBg: 'transparent',
  contentBg: '#f7f5fa',
  isGradient: false,
  gradientAngle: 135,
  gradientStart: '#f7f5fa',
  gradientEnd: '#e2e8f0',
  themeName: 'Default',
  isDark: false,
  useHeaderBlur: true,
  bgImage: '',
  bgImageBlur: 0,
  bgImageOpacity: 50,
  bgImageBrightness: 100,
  isImageBg: false
}

const STORAGE_KEY = 'user_theme_settings_v1'

export const useThemeStore = defineStore('theme', {
  state: () => {
    const isDark = typeof window !== 'undefined' ? localStorage.getItem('dark') === 'true' : false
    return {
      settings: { ...DEFAULT_THEME, isDark } as ThemeSettings,
      isLoaded: false,
      isReady: false
    }
  },

  actions: {
    async init() {
      if (this.isLoaded) return
      
      // Apply initial theme immediately to prevent flash
      this.applyTheme()

      const saved = await loadFromDisk<ThemeSettings>(STORAGE_KEY)
      if (saved) {
        this.settings = { ...this.settings, ...saved }
      }
      this.applyTheme()
      this.isLoaded = true
      this.isReady = true
    },

    setTheme(newSettings: Partial<ThemeSettings>) {
      // If we are currently in Default theme and moving to a Custom/Preset theme,
      // we must capture the current native dark mode state so it doesn't reset to light.
      if (this.settings.themeName === 'Default' && newSettings.themeName !== 'Default') {
        const nativeIsDark = localStorage.getItem('dark') === 'true'
        this.settings.isDark = nativeIsDark
      }

      this.settings = { ...this.settings, ...newSettings }
      if (typeof window !== 'undefined') {
        localStorage.setItem('dark', String(this.settings.isDark))
      }
      this.applyTheme()
      this.save()
    },

    resetToDefault() {
      this.settings = { ...DEFAULT_THEME }
      if (typeof window !== 'undefined') {
        localStorage.setItem('dark', String(this.settings.isDark))
      }
      this.applyTheme()
      this.save()
    },

    async save() {
      await saveToDisk(STORAGE_KEY, this.settings)
    },

    unifyColors() {
      this.settings.headerBg = 'transparent'
      this.settings.footerBg = 'transparent'
      this.settings.themeName = 'Custom'
      this.applyTheme()
      this.save()
    },

    toggleDark() {
      this.settings.isDark = !this.settings.isDark
      if (typeof window !== 'undefined') {
        localStorage.setItem('dark', String(this.settings.isDark))
      }
      this.applyTheme()
      
      // If we are not in the Default theme, we also persist to the theme config file
      if (this.settings.themeName !== 'Default') {
        this.save()
      }
    },

    hexToRgba(hex: string, alpha: number) {
      if (!hex.startsWith('#')) return hex
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    },

    applyTheme() {
      if (process.server) return

      const root = document.documentElement

      // Apply Background Image Layer (Universal)
      if (this.settings.isImageBg && this.settings.bgImage) {
        root.style.setProperty('--bg-image', `url(${this.settings.bgImage})`)
        root.style.setProperty('--bg-image-blur', `${this.settings.bgImageBlur}px`)
        root.style.setProperty('--bg-image-opacity', `${this.settings.bgImageOpacity / 100}`)
        root.style.setProperty('--bg-image-brightness', `${this.settings.bgImageBrightness / 100}`)
      } else {
        root.style.removeProperty('--bg-image')
        root.style.removeProperty('--bg-image-blur')
        root.style.removeProperty('--bg-image-opacity')
        root.style.removeProperty('--bg-image-brightness')
      }

      if (this.settings.themeName === 'Default') {
        const nativeIsDark = localStorage.getItem('dark') === 'true'
        // Sync our internal state to match the native dark mode if we're in default
        this.settings.isDark = nativeIsDark
        this.settings.contentBg = nativeIsDark ? '#050505' : '#f7f5fa'
        this.settings.headerBg = 'transparent'
        this.settings.footerBg = 'transparent'
        
        root.classList.toggle('dark', nativeIsDark)
        
        // Universal settings (apply regardless of theme)
        root.style.setProperty('--header-blur', this.settings.useHeaderBlur ? 'blur(20px)' : 'none')
        root.style.setProperty('--header-border', this.settings.useHeaderBlur 
          ? (nativeIsDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.03)') 
          : 'none')
        
        root.style.removeProperty('--header-bg')
        root.style.removeProperty('--footer-bg')
        root.style.removeProperty('--content-bg')
        root.style.removeProperty('--text-heading')
        root.style.removeProperty('--text-description')
        root.style.removeProperty('--icon-color')
        return
      }

      // Sync dark mode class for custom/preset themes
      root.classList.toggle('dark', this.settings.isDark)

      // Apply Header Blur
      root.style.setProperty('--header-blur', this.settings.useHeaderBlur ? 'blur(20px)' : 'none')
      root.style.setProperty('--header-border', this.settings.useHeaderBlur 
        ? (this.settings.isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.03)') 
        : 'none')

      // Apply Header
      let headerBg = this.settings.headerBg
      if (this.settings.useHeaderBlur && headerBg.startsWith('#') && headerBg.length === 7) {
        headerBg = this.hexToRgba(headerBg, 0.75)
      }
      root.style.setProperty('--header-bg', headerBg)
      
      // Apply Footer
      root.style.setProperty('--footer-bg', this.settings.footerBg)
      
      // Apply Content Background
      if (this.settings.isGradient) {
        const gradient = `linear-gradient(${this.settings.gradientAngle}deg, ${this.settings.gradientStart}, ${this.settings.gradientEnd})`
        root.style.setProperty('--content-bg', gradient)
      } else {
        root.style.setProperty('--content-bg', this.settings.contentBg)
      }
    }
  }
})
