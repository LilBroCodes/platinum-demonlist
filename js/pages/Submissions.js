import { store } from '../main.js';

export default {
   template: `
      <div>
         <main class="login-page" v-if="!loggedIn">
            <h1>Login</h1>
            <form @submit.prevent="handleLogin">
               <label for="username">Username</label>
               <input
                  v-model="username"
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  required
               />
               <label for="password">Password</label>
               <input
                  v-model="password"
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  required
               />
               <button type="submit">Login</button>
               <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
            </form>
         </main>
         <div v-else></div>
         <main class="submissions-page" v-else>
            <button @click="logout" class="logout-button">Logout</button>
            <div class="tab-switcher">
               <h2 class="tab" :class="{ selected: isSelected('records') }" @click="selectTab('records')">Records</h2>
               <h2 class="tab" :class="{ selected: isSelected('levels') }" @click="selectTab('levels')">Levels</h2>
            </div>
            <div class="submissions-list">
               <div class="submission-card" v-for="submission in recordSubmissions" :key="submission.id" v-if="selectedTab === 'records'" @click="selectSubmission(submission)">
                  <h2>{{ submission.playerName }}</h2>
                  <p class="submission-date">{{ submission.submissionDate }}</p>
                  <p class="submission-level">{{ submission.levelName }} - {{ Math.round(parseFloat(submission.percentage)) }}% on {{ Math.round(parseFloat(submission.hz)) }}hz</p>
               </div>
               <div class="submission-card" v-for="submission in levelSubmissions" :key="submission.id" v-if="selectedTab === 'levels'" @click="selectSubmission(submission)">
                  <h2>{{ submission.name }}</h2>
                  <p class="submission-date">{{ submission.submissionDate }}</p>
                  <p class="submission-level">By {{ formatCreators(submission.creators) }}</p>
               </div>
            </div>
         </main>
         <div class="popup-overlay" v-if="popupVisible">
            <div class="popup-content">
               <h2 v-if="selectedSubmission.type === 'record'">{{ selectedSubmission.levelName }}</h2>
               <h2 v-if="selectedSubmission.type === 'level'">{{ selectedSubmission.name }}</h2>
               <p v-if="selectedSubmission.type === 'record'">Player: {{ selectedSubmission.playerName }}</p>
               <p v-if="selectedSubmission.type === 'record'">{{ Math.round(parseFloat(selectedSubmission.percentage)) }}% on {{ Math.round(parseFloat(selectedSubmission.hz)) }}hz</p>
               <p v-if="selectedSubmission.type === 'level'">By {{ formatCreators(selectedSubmission.creators) }}</p>
               <p v-if="selectedSubmission.type === 'level'">Verifier: {{ selectedSubmission.verifier }}</p>
               <p>Status: {{ getStatusText(selectedSubmission.state) }}</p>
               <p>Date: {{ formatDate(selectedSubmission.submissionDate) }}</p>
               <button class="close-button" @click="closePopup">Close</button>
               <div class="video-container">
                  <iframe
                     style="border-radius: 25px; margin-top: 10px; margin-bottom: 45px;"
                     width="100%"
                     height="315"
                     :src="'https://www.youtube.com/embed/' + (selectedSubmission.type === 'level' ? selectedSubmission.verification.split('v=')[1] : selectedSubmission.video.split('v=')[1])"
                     frameborder="0"
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     allowfullscreen
                  ></iframe>
               </div>
               <button class="accept-button" @click="acceptSubmission(selectedSubmission)">Accept</button>
               <button class="deny-button" @click="denySubmission(selectedSubmission)">Deny</button>
            </div>
         </div>
      </div>
   `,
   data() {
      return {
         username: "",
         password: "",
         loggedIn: false,
         errorMessage: "",
         submissions: [],
         filteredSubmissions: [],
         filter: 'all',
         selectedTab: 'records',
         popupVisible: false,
         selectedSubmission: null,
      };
   },
   computed: {
      sortedSubmissions() {
         let ret = this.submissions
            .filter((submission) => submission.state !== 1)
            .slice()
            .sort((a, b) => a.state - b.state);
         return ret;
      },
      recordSubmissions() {
         return this.submissions.filter((submission) => submission.type === "record" && submission.state !== 1);
      },
      levelSubmissions() {
         return this.submissions.filter((submission) => submission.type === "level" && submission.state !== 1);
      },
   },
   methods: {
      isSelected(tab) {
         return this.selectedTab === tab;
      },
      selectTab(tab) {
         this.selectedTab = tab;
      },
      getStatusText(state) {
         return state === 0 ? "Unread" : state === 1 ? "Accepted" : "Denied";
      },
      getStatusClass(state) {
         return state === 0
            ? "status-unread"
            : state === 1
               ? "status-accepted"
               : "status-denied";
      },
      formatDate(dateString) {
         const options = {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
         };
         const date = new Date(dateString);
         return date.toLocaleDateString(undefined, options);
      },
      formatCreators(creators) {
         try {
            return JSON.parse(creators).join(", ");
         } catch (e) {
            console.error("Failed to parse creators:", e);
            return creators;
         }
      },
      async handleLogin() {
         const URL = "https://platinum.141412.xyz/demonlistLogin.php";
         const payload = {
            username: this.username,
            password: this.password
         };

         try {
            const response = await fetch(URL, {
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json'
               },
               body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (data.success) {
               this.loggedIn = true;
               this.errorMessage = "";
               localStorage.setItem('sessionCode', data.sessionCode); // Save session code to localStorage
               await this.fetchSubmissions();
            } else {
               this.loggedIn = false;
               this.errorMessage = data.message;
            }
         } catch (e) {
            console.log("An error occurred:", e);
         }
      },
      async fetchSubmissions() {
         try {
            const response = await fetch(
               `https://platinum.141412.xyz/getSubmissions.php?sessionCode=${localStorage.getItem("sessionCode")}&type=${store.listType}`,
            );
            const data = await response.json();
            if (!data.message === "No submissions found." || data.message == undefined) {
               this.submissions = data.submissions;
            } else {
               this.submissions = [];
            }
            console.log(this.submissions);
         } catch (error) {
            console.error("Failed to fetch submissions:", error);
         }
      },
      async acceptSubmission(submission) {
         let type = submission.type;
         let id = type === "record" ? submission.id : submission.submissionId;
         let name = type === "record" ? submission.levelName : submission.name;
         try {
            const response = await fetch(
               "https://platinum.141412.xyz/updateSubmission.php",
               {
                  method: "POST",
                  headers: {
                     "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                     raw: submission,
                     name: name,
                     type: type,
                     id: id,
                     state: 1,
                  }),
               },
            );
            console.log("Accepted:", submission);
            document.location.reload();
         } catch (error) {
            console.error("Failed to accept submission:", error);
         }
      },
      async denySubmission(submission) {
         let type = submission.type;
         let id = type === "record" ? submission.id : submission.submissionId;
         let name = type === "record" ? submission.levelName : submission.name;
         try {
            const response = await fetch(
               "https://platinum.141412.xyz/updateSubmission.php",
               {
                  method: "POST",
                  headers: {
                     "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                     raw: submission,
                     name: name,
                     type: type,
                     id: id,
                     state: 2,
                  }),
               },
            );
            console.log("Denied:", submission);
            document.location.reload();
         } catch (error) {
            console.error("Failed to deny submission:", error);
         }
      },
      async logout() {
         try {
            const response = await fetch(
               `https://platinum.141412.xyz/demonlistLogOut.php?session_code=${localStorage.getItem("sessionCode")}`,
            );
            this.loggedIn = false;
            localStorage.removeItem('sessionCode');
            document.location.reload();
         } catch (error) {
            console.error("Failed to logout:", error);
         }
      },
      toggleDetails(id) {
         const submission = this.submissions.find(sub => sub.id === id);
         submission.expanded = !submission.expanded;
      },
      filterSubmissions() {
         if (this.filter === 'all') {
            this.filteredSubmissions = this.submissions;
         } else {
            const stateMap = {
               accepted: 1,
               denied: 2,
               unread: 0,
            };
            this.filteredSubmissions = this.submissions.filter(sub => sub.state === stateMap[this.filter]);
         }
      },
      sortSubmissions(criteria) {
         if (criteria === 'date') {
            this.filteredSubmissions.sort((a, b) => new Date(b.date) - new Date(a.date));
         } else if (criteria === 'name') {
            this.filteredSubmissions.sort((a, b) => a.levelName.localeCompare(b.levelName));
         }
      },
      closePopup() {
         this.popupVisible = false;
         const mainElement = document.querySelector('main');
         if (mainElement) {
            mainElement.classList.remove('blur'); // Remove blur class when closing popup
         }
         this.$emit('close');
      },
      selectSubmission(submission) {
         this.selectedSubmission = submission;
         this.popupVisible = true;
         const mainElement = document.querySelector('main');
         if (mainElement) {
            mainElement.classList.add('blur'); // Add blur class when opening popup
         }
      },
   },
   async created() {
      store.submissionsContext = this;
      if (localStorage.getItem("sessionCode")) {
         this.loggedIn = true;
      }
      try {
         const response = await fetch(
            `https://platinum.141412.xyz/checkAuth.php?session_code=${localStorage.getItem("sessionCode")}&type=${localStorage.getItem("listType")}`,
            {
               headers: {
                  "Content-Type": "application/json",
               },
            },
         );
         const data = await response.json();
         if (data.auth) {
            this.loggedIn = true;
            await this.fetchSubmissions();
         }
      } catch (error) {
         console.error("Failed to check authentication:", error);
      }
   },
   mounted() {
      this.fetchSubmissions(); // Fetch submissions on mount
   },
};

export async function resetSubmissions() {
   localStorage.setItem("listType", store.listType);
   document.location.reload();
}
