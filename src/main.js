import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.mount('#app')

const loader = document.getElementById('app-loader')
if (loader) {
  loader.classList.add('app-loader-done')
  loader.addEventListener('transitionend', () => loader.remove())
}
