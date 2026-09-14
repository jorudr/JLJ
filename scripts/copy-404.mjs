import { copyFileSync, mkdirSync } from 'node:fs'

copyFileSync('dist/index.html', 'dist/404.html')

// GitHub Pages serves the SPA fallback with a 404 status for unknown paths.
// Publish an HTML entry point for each known route so direct visits return 200.
for (const route of ['about', 'pricing', 'download', 'philosophy', 'announcement']) {
  mkdirSync(`dist/${route}`, { recursive: true })
  copyFileSync('dist/index.html', `dist/${route}/index.html`)
}
