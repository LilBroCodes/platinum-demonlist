import routes from './routes.js';
import { reset } from './pages/List.js';

export const store = Vue.reactive({
    listContext: null,
    dark: JSON.parse(localStorage.getItem('dark')) || false,
    listType: 'demon', // Initialize listType to 'demon'
    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
    },
});

const app = Vue.createApp({
    data: () => ({ store }),
});
const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

app.use(router);

app.mount('#app');

document.getElementById('listType').addEventListener('change', () => {
    // Pass the store as context to reset
    reset(); // Updated line
});
