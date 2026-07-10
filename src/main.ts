import './assets/main.css'
import 'primeicons/primeicons.css'

import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import pt from "./locales/pt.json"
import { primevue } from './plugins/primevue'


import App from './App.vue'
import router from './router'
import RpgFichaPreset from './theme'

const app = createApp(App)

app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: RpgFichaPreset
  },
  locale: pt
})
app.use(primevue);

router.isReady().then(() => {
  app.mount('#app')
})
