import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { markInitialLoadDone } from './shared/pageTransition'

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
  if (!loader) {
    markInitialLoadDone()
    return
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    loader.remove()
    markInitialLoadDone()
    return
  }

  const startTime = window.__loaderStartTime || performance.now()
  const TOTAL_ANIMATION_TIME = 1850

  const finishLoader = () => {
    if (!isAppReady) {
      setTimeout(finishLoader, 40)
      return
    }

    const elapsed = performance.now() - startTime
    const delayUntilReveal = Math.max(0, TOTAL_ANIMATION_TIME - elapsed)

    setTimeout(() => {
      loader.classList.add('loader-fade-out')
      setTimeout(() => {
        loader.remove()
        markInitialLoadDone()
      }, 750)
    }, delayUntilReveal)
  }

  finishLoader()
}

triggerLoaderExit()
