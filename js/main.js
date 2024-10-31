import routes from './routes.js';
import { resetList } from './pages/List.js';
import { resetLeaderboard } from './pages/Leaderboard.js';
import { resetRoulette } from './pages/Roulette.js';
import { resetSubmissions } from './pages/Submissions.js';
export const store = Vue.reactive({
    submissionsContext: null,
    leaderboardContext: null,
    rouletteContext: null,
    listContext: null,
    dark: JSON.parse(localStorage.getItem('dark')) || false,
    listType: (localStorage.getItem("listType") != "") ? localStorage.getItem("listType") : "demon", // Initialize listType to 'demon'
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

if (localStorage.getItem("listType") == "") {
    localStorage.setItem("listType", "demon");
}

document.getElementById('listType').addEventListener('change', () => {
    localStorage.setItem("listType", store.listType);
    resetList(); // Updated line
    resetLeaderboard();
    resetRoulette();
    resetSubmissions();
});
