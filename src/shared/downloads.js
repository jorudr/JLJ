const DEMO_DOWNLOADS = {
  macos: 'https://github.com/jorudr/JLJ/releases/download/v1.0.5/JLJ_1.0.5_universal.dmg',
  windows: 'https://github.com/jorudr/JLJ/releases/download/v1.0.5/JLJ_1.0.5_x64-setup.exe'
}

export const getDemoDownloadUrl = () => {
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent.toLowerCase()
  return /macintosh|mac os x/.test(userAgent) ? DEMO_DOWNLOADS.macos : DEMO_DOWNLOADS.windows
}
