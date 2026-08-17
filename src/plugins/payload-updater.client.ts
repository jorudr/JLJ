import { invoke } from '@tauri-apps/api/core'
import { relaunch } from '@tauri-apps/plugin-process'

type PayloadInstallResult = {
  downloadedFiles: number
  reusedFiles: number
  state: {
    version?: string | null
    active: boolean
  }
}

export default defineNuxtPlugin(async () => {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) return

  const config = useRuntimeConfig()
  const manifestUrl = String(config.public.payloadManifestUrl || '').trim()
  if (!manifestUrl) return

  try {
    const result = await invoke<PayloadInstallResult>('payload_update_install_from_feed', {
      manifestUrl,
    })
    if (result.downloadedFiles > 0 && result.state.active) {
      await relaunch()
    }
  } catch (error) {
    console.warn('[payload-updater] update check failed', error)
  }
})
