import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
   owner: "crown",
   admin: "user-gear",
   helper: "user-shield",
   dev: "code",
   trial: "user-lock",
};

export default {
   components: { Spinner, LevelAuthors },
   template: `
      <main v-if="loading">
         <Spinner></Spinner>
      </main>
      <main v-else class="page-list">
         <div class="list-container blur-deez-nuts">
            <table class="list" v-if="list">
               <tr v-for="([level, err], i) in list">
                  <td class="rank">
                     <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                     <p v-else class="type-label-lg">Legacy</p>
                  </td>
                  <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                     <button @click="selected = i">
                        <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                     </button>
                  </td>
               </tr>
            </table>
         </div>
         <div class="level-container blur-deez-nuts">
            <div class="level" v-if="level">
               <h1>{{ level.name }}</h1>
               <button v-if="this.loggedIn" class="move-button font" @Click="showPlacementPopup(level)">Move</button>
               <LevelAuthors :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
               <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
               <ul class="stats">
                  <li>
                     <div class="type-title-sm">Points when completed</div>
                     <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                  </li>
                  <li>
                     <div class="type-title-sm">ID</div>
                     <p>{{ level.id }}</p>
                  </li>
                  <li>
                     <div class="type-title-sm">Password</div>
                     <p>{{ level.password || 'Free to Copy' }}</p>
                  </li>
               </ul>
               <h2>Records</h2>
               <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
               <p v-else-if="selected +1 <= 150"><strong>100%</strong> or better to qualify</p>
               <p v-else>This level does not accept new records.</p>
               <table class="records">
                  <tr v-for="record in level.records" class="record">
                     <td class="percent">
                        <p>{{ record.percent }}%</p>
                     </td>
                     <td class="user">
                        <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                     </td>
                     <td class="mobile">
                        <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                     </td>
                     <td class="hz">
                        <p>{{ record.hz }}Hz</p>
                     </td>
                  </tr>
               </table>
            </div>
            <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
               <p>(ノಠ益ಠ)ノ彡┻━┻</p>
            </div>
         </div>
         <div class="meta-container blur-deez-nuts">
            <div class="meta">
               <div class="errors" v-show="errors.length > 0">
                  <p class="error" v-for="error of errors">{{ error }}</p>
               </div>
               <div class="og">
                  <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
               </div>
               <template v-if="editors">
                  <h3>List Editors</h3>
                  <ol class="editors">
                     <li v-for="editor in editors">
                        <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                        <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                        <p v-else>{{ editor.name }}</p>
                     </li>
                  </ol>
               </template>
               <h3>Submission Requirements</h3>
               <p>
                  Achieved the record without using hacks (however, FPS bypass is allowed, up to 360fps)
               </p>
               <p>
                  Achieved the record on the level that is listed on the site - please check the level ID before you submit a record
               </p>
               <p>
                  Have either source audio or clicks/taps in the video. Edited audio only does not count
               </p>
               <p>
                  The recording must have a previous attempt and entire death animation shown before the completion, unless the completion is on the first attempt. Everyplay records are exempt from this
               </p>
               <p>
                  The recording must also show the player hit the endwall, or the completion will be invalidated.
               </p>
               <p>
                  Do not use secret routes or bug routes
               </p>
               <p>
                  Do not use easy modes, only a record of the unmodified level qualifies
               </p>
               <p>
                  Once a level falls onto the Legacy List, we accept records for it for 24 hours after it falls off, then afterwards we never accept records for said level
               </p>
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
            <button class="accept-button" @click="confirmPlacement(level)" :disabled="selectedPlacementIndex === null">Confirm</button>
            <button class="close-button" @click="closePlacementPopup">Close</button>
         </div>
      </div>
      </main>
   `,
   data: () => ({
      list: [],
      editors: [],
      loading: true,
      selected: 0,
      errors: [],
      roleIconMap,
      store,
      placementPopupVisible: false,
      selectedPlacementIndex: null,
      levelList: [],
   }),
   computed: {
      level() {
         return this.list[this.selected][0];
      },
      video() {
         if (!this.level.showcase) {
            return embed(this.level.verification);
         }

         return embed(
            this.toggledShowcase ? this.level.showcase : this.level.verification,
         );
      },
      loggedIn() {
         return localStorage.getItem('sessionCode') != null;
      },
   },
   async mounted() {
      store.listContext = this;
      await resetList();
   },
   methods: {
      showPlacementPopup(submission) {
         const mainElements = document.getElementsByClassName('blur-deez-nuts');
         for (const mainElement of mainElements) {
            mainElement.classList.add('blur'); // Add blur class when opening popup
         }
         this.selectedSubmission = submission;
         this.placementPopupVisible = true;
         this.fetchLevelList();
      },
      closePlacementPopup() {
         this.placementPopupVisible = false;
         const mainElements = document.getElementsByClassName('blur-deez-nuts');
         for (const mainElement of mainElements) {
            mainElement.classList.remove('blur'); // Remove blur class when closing popup
         }
         this.$emit('close');
      },
      selectPlacement(index) {
         this.selectedPlacementIndex = index;
      },
      async getSubmissionid(level_id) {
         try {
            const response = await fetch(
               `https://platinum.141412.xyz/getSubmissionId.php?id=${level_id}`,
               {
                  method: "GET",
                  headers: {
                     "Content-Type": "application/json",
                  }                     
               },
            );
            const data = response.json();
            return data.id;
         } catch (error) {
            console.error("Failed to get submission id:", error);
         }
      },
      async confirmPlacement(submission) {
         this.closePlacementPopup();
         const id = await this.getSubmissionid(submission.id);
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
                     name: submission.name,
                     type: "level",
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
      isSelectedPlacement(index) {
         return this.selectedPlacementIndex == index;
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
      embed,
      score,
   },
};

export async function resetList() {
   store.listContext.loading = true;

   // Hide loading spinner
   store.listContext.list = await fetchList();
   store.listContext.editors = await fetchEditors();

   // Error handling
   if (!store.listContext.list) {
      store.listContext.errors = [
         "Failed to load list. Retry in a few minutes or notify list staff.",
      ];
   } else {
      store.listContext.errors.push(
         ...store.listContext.list
            .filter(([_, err]) => err)
            .map(([_, err]) => {
               return `Failed to load level. (${err}.json)`;
            }),
      );
      if (!store.listContext.editors) {
         store.listContext.errors.push("Failed to load list editors.");
      }
   }

   store.listContext.loading = false;
}
