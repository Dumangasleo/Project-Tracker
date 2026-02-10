// 1. Eto lang dapat ang CSS import mo (yung may @tailwind base, etc.)
import './style.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import {createPinia} from "pinia";


const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')


console.log('%c --- FINTECH HANDSHAKE DEBUG --- ', 'background: #222; color: #bada55');
console.log('Is Vite Environment defined?', !!import.meta.env);
console.log('Secret Key Value:', import.meta.env.VITE_SECRET_KEY || 'MISSING');
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL || 'MISSING');