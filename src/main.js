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
app.mount('#app')

const loader = document.getElementById('app-loader')
if (loader) {
  loader.classList.add('app-loader-done')
  loader.addEventListener('transitionend', () => loader.remove())
}
