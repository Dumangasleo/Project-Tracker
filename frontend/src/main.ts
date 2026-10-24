import './assets/styles/main.css';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './app/App.vue';
import { router } from './app/router';
import { setupHttpAuth } from './app/setup-http-auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
setupHttpAuth(pinia, router);
app.use(router);
app.mount('#app');
