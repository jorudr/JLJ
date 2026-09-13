// Place installers in public/downloads/ or replace these URLs with release URLs.
const base = import.meta.env.BASE_URL

export const downloads = [
  { id: 'windows', name: 'Windows', url: base + 'downloads/JLJ-Windows.exe', label: 'landing.downloadWindows' },
  { id: 'macos', name: 'macOS', url: base + 'downloads/JLJ-macOS.dmg', label: 'landing.downloadMac' },
]
