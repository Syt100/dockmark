import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router, { preloadPrimaryRoutes } from './router'

const app = createApp(App)

app.use(router)

app.mount('#app')

window.setTimeout(preloadPrimaryRoutes, 0)
