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
            <select v-model="filter" class="filter-select">
               <option value="0">Unread</option>
               <option value="1">Accepted</option>
               <option value="2">Denied</option>
            </select>
            <div class="tab-switcher">
               <h2 class="tab" :class="{ selected: isSelected('records') }" @click="selectTab('records')">Records</h2>
               <h2 class="tab" :class="{ selected: isSelected('levels') }" @click="selectTab('levels')">Levels</h2>
            </div>
            <div class="submissions-list">
               <h1 v-if="this.sortedSubmissions.length === 0" class="no-submissions">No submissions found.</h1>
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
               <button v-if="selectedSubmission.type === 'level'" class="accept-button" @click="showPlacementPopup(selectedSubmission)">Accept</button>
               <button v-if="selectedSubmission.type === 'record'" class="accept-button" @click="acceptSubmission(selectedSubmission)">Accept</button>
               <button class="deny-button" @click="denySubmission(selectedSubmission)">Deny</button>
            </div>
         </div>
         <div class="placement-popup-overlay" v-if="placementPopupVisible">
            <div class="popup-content">
               <h2>Select Placement for {{ selectedSubmission.name }}</h2>
               <h2 style="font-style: italic; color: #535353; font-weight: 100; font-size: 15pt; text-align: center;">Level will be placed above the selected level</h2>          
               <div class="level-list"><ul class="font">
                  <li v-for="(level, index) in levelList" :key="index" @click="selectPlacement(index)" class="listElement" :class="{ selected: isSelectedPlacement(index)}">
                     {{ level }}
                  </li>
                  <li @click="selectPlacement(levelList.length)" class="listElement" :class="{ selected: this.selectedPlacementIndex === levelList.length}">Place at end</li>
               </ul></div>
               <button class="accept-button" @click="confirmPlacement" :disabled="selectedPlacementIndex === null">Confirm</button>
               <button class="close-button" @click="closePlacementPopup">Close</button>
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
         placementPopupVisible: false,
         selectedSubmission: null,
         levelList: [],
         selectedPlacementIndex: null,
         filter: 0,
      };
   },
   computed: {
      sortedSubmissions() {
         let ret = this.submissions
            .filter((submission) => submission.state == this.filter)
            .slice()
            .sort((a, b) => a.state - b.state);
         return ret;
      },
      recordSubmissions() {
         return this.submissions.filter((submission) => submission.type === "record" && submission.state == this.filter);
      },
      levelSubmissions() {
         return this.submissions.filter((submission) => submission.type === "level" && submission.state == this.filter);
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
               localStorage.setItem('sessionCode', data.sessionCode);
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
      async fetchLevelList() {
         try {
            const response = await fetch(`https://platinum.141412.xyz/getList.php?type=${store.listType}`);
            const data = await response.json();
            this.levelList = data;
         } catch (error) {
            console.error("Failed to fetch level list:", error);
         }
      },
      async acceptSubmission(submission) {
         let type = submission.type;
         let id = type === "record" ? submission.id : submission.submissionId;
         let name = type === "record" ? submission.levelName : submission.name;
         try {
            await fetch(
               "https://platinum.141412.xyz/updateSubmission.php",
               {
                  method: "POST",
                  headers: {
                     "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                     sessionCode: localStorage.getItem("sessionCode"),
                     raw: submission,
                     name: name,
                     type: type,
                     id: id,
                     state: 1,
                     placementIndex: this.selectedPlacementIndex,
                  }),
               },
            );
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
            await fetch(
               "https://platinum.141412.xyz/updateSubmission.php",
               {
                  method: "POST",
                  headers: {
                     "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                     sessionCode: localStorage.getItem("sessionCode"),
                     raw: submission,
                     name: name,
                     type: type,
                     id: id,
                     state: 2,
                  }),
               },
            );
            console.log("Denied:", submission);
            // document.location.reload();
         } catch (error) {
            console.error("Failed to deny submission:", error);
         }
      },
      async logout() {
         try {
            await fetch(
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
      showPlacementPopup(submission) {
         this.popupVisible = false;
         this.selectedSubmission = submission;
         this.placementPopupVisible = true;
         this.fetchLevelList();
      },
      closePlacementPopup() {
         this.placementPopupVisible = false;
         const mainElement = document.querySelector('main');
         if (mainElement) {
            mainElement.classList.remove('blur'); // Remove blur class when closing popup
         }
         this.$emit('close');
      },
      selectPlacement(index) {
         this.selectedPlacementIndex = index;
      },
      confirmPlacement() {
         this.acceptSubmission(this.selectedSubmission);
         this.closePlacementPopup();
      },
      isSelectedPlacement(index) {
         return this.selectedPlacementIndex == index;
      },
      confirmDisabled() {
         return !this.selectedPlacementIndex != null;
      }
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
