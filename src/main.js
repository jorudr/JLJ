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

router.isReady().then(() => {
  app.mount('#app')
  triggerLoaderExit()
})

function triggerLoaderExit() {
  const loader = document.getElementById('app-loader')

  if (!loader) return

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    loader.remove()
    return
  }

  const startTime = window.__loaderStartTime || performance.now()
  const elapsed = performance.now() - startTime
  const minBlackDuration = 700
  const remaining = Math.max(0, minBlackDuration - elapsed)

  setTimeout(() => {
    loader.classList.add('loader-filling-white')

    setTimeout(() => {
      loader.classList.add('loader-fade-out')
      setTimeout(() => {
        loader.remove()
      }, 400)
    }, 700)
  }, remaining)
}
