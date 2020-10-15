<template>
  <div class="hello">
    <div class="filter">
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
      </tr>
      <tr
        v-for="job in jobs.data"
        v-bind:key="job.id"
        v-bind:class="job.status"
        class="tablerow"
      >
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
    },
  }),
  methods: {
    getJobs: function () {
      axios
        .get('http://localhost:3000/jobs')
        .then((response) => (this.jobs = response));
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
