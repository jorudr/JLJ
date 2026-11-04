// Fallback URLs if the GitHub API lookup below fails (e.g. rate limit, offline build).
// Update these whenever a new release is cut, in case the API call doesn't resolve.
import { reactive } from 'vue'

const REPO = 'jorudr/JLJ'

export const downloads = reactive([
  { id: 'windows', name: 'Windows', url: 'https://github.com/jorudr/JLJ/releases/download/1.1.7/JLJ_2.0.6_windows-x86_64-setup.exe', label: 'landing.downloadWindows' },
  { id: 'macos', name: 'macOS', url: 'https://github.com/jorudr/JLJ/releases/download/1.1.7/JORU_Installer.dmg', label: 'landing.downloadMac' },
])

// Prefixes (case-insensitive) that identify each platform's installer asset.
const PREFIXES = {
  windows: 'jlj_',
  macos: 'joru_',
}

let refreshed = false

// Picks the most recently uploaded release asset whose name starts with the given
// prefix, so new installer files can be dropped into the GitHub release without
// ever touching this file again.
export async function refreshDownloads() {
  if (refreshed) return
  refreshed = true
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
    if (!res.ok) return
    const release = await res.json()
    const assets = Array.isArray(release.assets) ? release.assets : []

    for (const entry of downloads) {
      const prefix = PREFIXES[entry.id]
      if (!prefix) continue
      const match = assets
        .filter((a) => typeof a.name === 'string' && a.name.toLowerCase().startsWith(prefix))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      if (match) entry.url = match.browser_download_url
    }
  } catch {
    // Keep the fallback URLs above.
  }
}
