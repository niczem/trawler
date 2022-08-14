<template>
  <div class="hello">
    <div class="filter">
      <button
        type="button"
        class="btn btn-sm"
        v-bind:class="{
          'btn-outline-primary': !filter.children,
          'btn-primary': filter.children,
        }"
        v-on:click="filter.children = !filter.children"
      >
        Show Child Processes
      </button>
      <button
        type="button"
        class="btn btn-sm"
        v-bind:class="{
          'btn-outline-primary': !filter.running,
          'btn-primary': filter.running,
        }"
        v-on:click="filter.running = !filter.running"
      >
        Running
      </button>
      <button
        type="button"
        class="btn btn-sm"
        v-bind:class="{
          'btn-outline-secondary': !filter.quoed,
          'btn-secondary': filter.quoed,
        }"
        v-on:click="filter.quoed = !filter.quoed"
      >
        Quoed
      </button>
      <button
        type="button"
        class="btn btn-sm"
        v-bind:class="{
          'btn-outline-success': !filter.done,
          'btn-success': filter.done,
        }"
        v-on:click="filter.done = !filter.done"
      >
        Done
      </button>
    </div>
    <table
      class="table table-striped"
      v-bind:class="{
        'filter-done': filter.done,
        'filter-quoed': filter.quoed,
        'filter-running': filter.running,
      }"
    >
      <tr>
        <td>Timestamp</td>
        <td>Type</td>
        <td>Identifier</td>
        <td>Status</td>
        <td>Parent</td>
        <td>Action</td>
      </tr>
      <tr
        v-for="job in jobs.data"
        v-bind:key="job.id"
        v-bind:class="job.status"
        class="tablerow"
      >
        <template v-if="!job.properties.parent || filter.children">
          <td>
            {{ ('0' + (new Date(job.timestamp).getUTCDate() + 1)).slice(-2) }}.
            {{ '0' + (new Date(job.timestamp).getUTCMonth() + 1) }} -
            {{ ('0' + (new Date(job.timestamp).getHours() + 1)).slice(-2) }}:{{
              ('0' + (new Date(job.timestamp).getMinutes() + 1)).slice(-2)
            }}
          </td>
          <td>{{ job.properties.type }}</td>
          <td v-if="job.properties.identifier">
            {{
              job.properties.identifier
                .replace('/story.php?story_fbid=', '')
                .replace(
                  '&fs=0&focus_composer=0&__tn__=S%2AW-R&fs=0&focus_composer=0',
                  ''
                )
                .replace(/&id=[0-9]*[0-9]+/g, '')
            }}
          </td>
          <td>{{ job.status }}</td>
          <td>{{ job.properties.parent }}</td>
          <td>
            <a v-on:click="redoAction(job)">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-arrow-repeat"
                viewBox="0 0 16 16"
              >
                <path
                  d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"
                />
                <path
                  fill-rule="evenodd"
                  d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"
                />
              </svg>
            </a>
            <a v-on:click="showDialog(job.timestamp)">
              <v-dialog v-model="dialog[job.timestamp]" max-width="80%">
                <v-card>
                  <v-card-title class="headline grey lighten-2">
                    {{ job.id }} LOG
                  </v-card-title>

                  <v-card-text>
                    <v-data-table
                      :headers="headers"
                      :items="job.log"
                      :items-per-page="25"
                      class="elevation-1"
                    ></v-data-table>
                  </v-card-text>

                  <v-divider></v-divider>
                  <v-card-actions>
                    <v-btn
                      color="primary"
                      text
                      @click.stop="hideDialog([job.timestamp])"
                      >Close</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-dialog>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                fill="currentColor"
                class="bi bi-list-ol"
                viewBox="0 0 16 16"
              >
                <path
                  fill-rule="evenodd"
                  d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"
                />
                <path
                  d="M1.713 11.865v-.474H2c.217 0 .363-.137.363-.317 0-.185-.158-.31-.361-.31-.223 0-.367.152-.373.31h-.59c.016-.467.373-.787.986-.787.588-.002.954.291.957.703a.595.595 0 0 1-.492.594v.033a.615.615 0 0 1 .569.631c.003.533-.502.8-1.051.8-.656 0-1-.37-1.008-.794h.582c.008.178.186.306.422.309.254 0 .424-.145.422-.35-.002-.195-.155-.348-.414-.348h-.3zm-.004-4.699h-.604v-.035c0-.408.295-.844.958-.844.583 0 .96.326.96.756 0 .389-.257.617-.476.848l-.537.572v.03h1.054V9H1.143v-.395l.957-.99c.138-.142.293-.304.293-.508 0-.18-.147-.32-.342-.32a.33.33 0 0 0-.342.338v.041zM2.564 5h-.635V2.924h-.031l-.598.42v-.567l.629-.443h.635V5z"
                />
              </svg>
            </a>
          </td>
        </template>
      </tr>
    </table>
  </div>
</template>
<script>
import axios from 'axios';

export default {
  name: 'Dashboard',
  data: () => ({
    jobs: [],
    filter: {
      running: true,
      quoed: true,
      done: false,
      children: false,
    },
    headers: [
      { text: 'Type', value: 'type' },
      { text: 'Timestamp', value: 'timestamp' },
      { text: 'Value', value: 'value' },
    ],
    dialog: [],
  }),
  methods: {
    getJobs: function () {
      axios
        .get(process.env.VUE_APP_API_BASE_URL + '/jobs')
        .then((response) => (this.jobs = response));
    },
    showDialog: function (timestamp) {
      this.dialog[timestamp] = true;
      this.$forceUpdate();
    },
    hideDialog: function (timestamp) {
      this.dialog[timestamp] = false;
      this.$forceUpdate();
    },
    redoAction: function (job) {
      let self = this;
      axios
        .post(process.env.VUE_APP_API_BASE_URL + '/jobs', {
          type: job.properties.type,
          properties: job.properties,
        })
        .then((response) => {
          console.log(response);
          if (response.data.ok) {
            alert('the job has been quoed');
            window.location.reload();
          }
        });
    },
  },
  mounted: function () {
    this.getJobs();
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.filter {
  color: #fff;
  position: absolute;
  top: 5px;
  right: 40px;
  font-size: 20px;
}
.filter span,
.filter button {
  margin-left: 5px;
}

.running,
.quoed,
.done {
  display: none;
}

.filter-quoed .quoed,
.filter-running .running,
.filter-done .done {
  display: table-row;
}

.btn.btn-sm.btn-outline-success,
.btn.btn-sm.btn-outline-secondary,
.btn.btn-sm.btn-outline-primary {
  color: #3c3c3c;
}
</style>
