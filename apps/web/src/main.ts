import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router, { preloadPrimaryRoutes } from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')

const idleWindow = window as Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number
}

if (typeof idleWindow.requestIdleCallback === 'function') {
  idleWindow.requestIdleCallback(preloadPrimaryRoutes, { timeout: 1500 })
} else {
  globalThis.setTimeout(preloadPrimaryRoutes, 1000)
}
