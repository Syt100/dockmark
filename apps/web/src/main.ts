import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router, { preloadPrimaryRoutes } from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')

if ('requestIdleCallback' in window) {
  window.requestIdleCallback(preloadPrimaryRoutes, { timeout: 1500 })
} else {
  window.setTimeout(preloadPrimaryRoutes, 1000)
}
