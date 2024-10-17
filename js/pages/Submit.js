import { store } from "../main.js";

export default {
   template: `
   <main class="submit-record">
      <h1>Submit Level or Record</h1>
      <h2 style="font-style: italic; color: #535353; font-weight: lighter;">Dropdown in the top-right will be used to select list</h2>
      <form @submit.prevent="submitSubmission">
         <label for="type">Submission Type:</label>
         <select v-model="type" id="type" required>
            <option value="record">Record</option>
            <option value="level">Level</option>
         </select>
         <input v-if="type === 'record'" type="text" v-model="levelName" placeholder="Level Name" required @input="fetchLevelNames" />
         <div class="autocomplete-list" v-if="filteredLevelNames.length">
            <ul>
               <li class="autocomplete-item" v-for="name in filteredLevelNames" :key="name" @click="selectLevelName(name)">{{ name }}</li>
            </ul>
         </div>
         <input v-if="type === 'record'" type="text" v-model="playerName" placeholder="Player Name" required />
         <input v-if="type === 'level'" type="number" v-model.number="id" placeholder="Level ID" required />
         <input v-if="type === 'level'" type="text" v-model="name" placeholder="Level Name" required />
         <textarea v-if="type === 'level'" v-model="creators" placeholder="Creators (comma-separated)" required></textarea>
         <input v-if="type === 'level'" type="text" v-model="verifier" placeholder="Verifier" required />
         <input v-if="type === 'level'" type="url" v-model="verification" placeholder="Verification Video URL" required />
         <input v-if="type === 'record'" type="number" v-model.number="percentage" placeholder="Percentage" required />
         <input v-if="type === 'record'" type="number" v-model.number="hz" placeholder="Hz" required />
         <input v-if="type === 'record'" type="url" v-model="video" placeholder="YouTube Video URL" required />

         <button type="submit">Submit</button>
      </form>
   </main>
   `,
   data: () => ({
      type: "record", // Default to 'record'
      playerName: "",
      levelName: "",
      id: null, // Only used for level submissions
      name: "", // Only used for level submissions
      creators: "", // Only used for level submissions, comma-separated
      verifier: "", // Only used for level submissions
      verification: "", // Only used for level submissions
      percentage: "",
      video: "",
      hz: NaN,
      levelNames: [], // Store fetched level names
      filteredLevelNames: [], // Store filtered level names for autocomplete
      store,
   }),
   methods: {
      async fetchLevelNames() {
         try {
            const response = await fetch(`https://platinum.141412.xyz/getList.php?type=${this.store.listType}`);
            const data = await response.json();
            this.levelNames = data; // Data is already a list of level names
            
            const input = this.levelName.toLowerCase();
            const scoredLevels = this.levelNames.map(name => {
               let score = 0;
               const lowerName = name.toLowerCase();
               let earliestIndex = Infinity;
               
               // Score based on character frequency and earliest occurrence
               for (let char of input) {
                  const occurrences = lowerName.split(char).length - 1;
                  score += occurrences;
                  if (occurrences > 0) {
                     earliestIndex = Math.min(earliestIndex, lowerName.indexOf(char));
                  }
               }
               
               // Score based on substring match
               for (let i = 0; i < lowerName.length - 1; i++) {
                  if (input.includes(lowerName.substring(i, i + 2))) {
                     score++;
                  }
               }
               
               return { name, score, earliestIndex };
            });
            
            // Sort by score descending, then by earliest index ascending
            scoredLevels.sort((a, b) => {
               if (b.score !== a.score) {
                  return b.score - a.score;
               }
               return a.earliestIndex - b.earliestIndex;
            });
            
            // Take top matches
            this.filteredLevelNames = scoredLevels.slice(0, 10).map(level => level.name);
         } catch (error) {
            console.error("Failed to fetch level names:", error);
         }
      },
      selectLevelName(name) {
         this.levelName = name;
         this.filteredLevelNames = []; // Clear the suggestions after selection
      },
      async submitSubmission() {
      if (this.type === "record" && !this.levelNames.includes(this.levelName)) {
         alert("Please enter a valid Level Name.");
         return;
      }

      if (this.type === "record" && !this.validateYouTubeURL(this.video)) {
         alert("Please enter a valid YouTube URL.");
         return;
      }

      if (this.type === "level" && !this.validateYouTubeURL(this.verification)) {
         alert("Please enter a valid YouTube URL.");
         return;
      }

      if (this.type === "record" && (isNaN(this.hz) || this.hz <= 0)) {
         alert("Please enter a valid Hz value.");
         return;
      }

      // Convert creators to an array
      const creatorsArray = this.creators.split(",").map((creator) => creator.trim());

      const response = await fetch("https://platinum.141412.xyz/uploadSubmission.php",
         {
            method: "POST",
            headers: {
               "Content-Type": "application/json",
            },
            body: JSON.stringify({
               type: this.type,
               playerName: this.playerName,
               levelName: this.levelName,
               id: this.id,
               name: this.name,
               creators: creatorsArray,
               verifier: this.verifier,
               verification: this.verification,
               percentage: this.percentage,
               video: this.video,
               hz: this.hz,
               listType: store.listType,
            }),
         },
      );

      const result = await response.json();

      if (response.ok) {
         this.playerName = "";
         (this.levelName = ""), (this.id = null);
         this.name = "";
         this.creators = "";
         this.verifier = "";
         this.verification = "";
         this.percentage = "";
         this.video = "";
         this.hz = NaN;
         alert(result.message || "Submission successful!");
      } else {
         alert(result.error || "Failed to submit");
      }
   },
      validateYouTubeURL(url) {
         const pattern = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
         return pattern.test(url);
      },
   },
};
