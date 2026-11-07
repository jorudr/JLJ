import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

if (typeof window !== 'undefined') {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
  }
  window.scrollTo(0, 0)
  window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0)
  })
}

const app = createApp(App)
app.use(router)

let isAppReady = false
router.isReady().then(() => {
  app.mount('#app')
  isAppReady = true
})

function triggerLoaderExit() {
  const loader = document.getElementById('app-loader')
  if (!loader) return

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    loader.remove()
    return
  }

  const startTime = window.__loaderStartTime || performance.now()
  const WHITE_START_TIME = 900
  const REVEAL_TIME = 1750

  const runWhitePhase = () => {
    if (!isAppReady) {
      setTimeout(runWhitePhase, 40)
      return
    }

    loader.classList.add('loader-filling-white')

    const elapsedSoFar = performance.now() - startTime
    const delayUntilReveal = Math.max(0, REVEAL_TIME - elapsedSoFar)

    setTimeout(() => {
      loader.classList.add('loader-fade-out')
      setTimeout(() => {
        loader.remove()
      }, 750)
    }, delayUntilReveal)
  }

  const elapsed = performance.now() - startTime
  const delayUntilWhite = Math.max(0, WHITE_START_TIME - elapsed)
  setTimeout(runWhitePhase, delayUntilWhite)
}

triggerLoaderExit()
