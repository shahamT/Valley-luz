import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import installVueQuery from './plugins/vueQuery'
import './assets/css/main.scss'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

app.use(router)

installVueQuery(app)

app.mount('#app')
