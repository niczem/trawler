<template>
  <form v-on:submit.prevent="createJob">
    <h3>Start Crawl</h3>
    <div class="form-group">
      <label for="type">choose type</label>
      <select class="form-control" id="type" v-model="type">
        <option
          v-for="datasource in datasources"
          v-bind:key="datasource.identifier"
        >
          {{ datasource.identifier }}
        </option>
      </select>
    </div>

    <div v-for="datasource in datasources" v-bind:key="datasource.identifier">
      <div v-if="datasource.identifier == type">
        <div
          v-for="field in datasource.fields"
          v-bind:key="field.name"
          class="form-group"
        >
          <span>{{ field.title }}</span>

          <input
            v-if="field.type != 'select' && field.type != 'icon'"
            v-model="properties[field.name]"
            :name="field.name"
            :placeholder="field.title"
            :type="field.type"
            :step="field.step"
            class="form-control"
          />
          <select
            v-if="field.type == 'select'"
            v-model="properties[field.name]"
            class="form-control"
          >
            <option
              v-for="option in field.options"
              :key="option"
              :value="option"
            >
              {{ option }}
            </option>
          </select>
        </div>
      </div>
    </div>
    <div class="form-check" v-if="type">
      <input
        type="checkbox"
        class="form-check-input"
        id="exampleCheck1"
        value="1"
        v-model="continueCrawl"
      />
      <label class="form-check-label" for="exampleCheck1"
        >continue crawl with children</label
      >
    </div>


    <div class="form-check" v-if="type">
      <input
        type="checkbox"
        v-model="schedule.repeat"
        value="1"
        class="form-check-input"
      />
      <label class="form-check-label">schedule </label>
    </div>

    <div class="form-group" v-if="schedule.repeat" style="padding-left:15px;">
      <input class="form-control" placeholder="time" type="datetime-local" id="scheduletime" v-model="schedule.scheduletime"/>
    </div>

    <div class="form-check" v-if="type">
      <input
        type="checkbox"
        v-model="schedule.active"
        value="1"
        class="form-check-input"
      />
      <label class="form-check-label">repeat </label>
    </div>
    <div v-if="schedule.active" style="padding-left:15px;">
      <div class="custom-control custom-radio">
        <input
          type="radio"
          class="custom-control-input"
          id="defaultUnchecked1"
          name="schedule"
          v-model="schedule.interval"
          value="hourly"
        />
        <label class="custom-control-label" for="defaultUnchecked1"
          >Hourly</label
        >
      </div>
      <div class="custom-control custom-radio">
        <input
          type="radio"
          class="custom-control-input"
          id="defaultUnchecked2"
          name="schedule"
          v-model="schedule.interval"
          value="daily"
        />
        <label class="custom-control-label" for="defaultUnchecked2"
          >Daily</label
        >
      </div>

      <!-- Default checked -->
      <div class="custom-control custom-radio">
        <input
          type="radio"
          class="custom-control-input"
          id="defaultChecked3"
          name="schedule"
          v-model="schedule.interval"
          value="weekly"
        />
        <label class="custom-control-label" for="defaultChecked3">Weekly</label>
      </div>
      <!-- Default checked -->
      <div class="custom-control custom-radio">
        <input
          type="radio"
          class="custom-control-input"
          id="defaultChecked4"
          name="schedule"
          v-model="schedule.interval"
          value="monthly"
        />
        <label class="custom-control-label" for="defaultChecked4"
          >Monthly</label
        >
      </div>
      <div class="form-check">
        <input type="checkbox" value="1" class="form-check-input" />
        <label class="form-check-label"
          >merge datasets with previous crawls</label
        >
      </div>
    </div>

    <button type="submit" class="btn btn-primary">Submit</button>
  </form>
</template>

<script>
import axios from 'axios';
import Fields from '../../../utils/Fields.js';

export default {
  name: 'Dashboard',
  data: () => ({
    jobs: [],
    type: null,
    continueCrawl: 1,
    datasources: [],
    properties: {},
    schedule: { active: false },
  }),
  methods: {
    createJob: function () {
      this.properties.type = this.type;
      this.properties.continue = this.continueCrawl;

      if (this.schedule.active === true) {
        //delete  propertie as its not needed in the job
        delete this.schedule.active;
        this.properties.schedule = this.schedule;
      }

      let self = this;
      axios
        .post(process.env.VUE_APP_API_BASE_URL+'/jobs', {
          type: this.type,
          properties: this.properties,
        })
        .then((response) => {
          console.log(response);
          if (response.data.ok) {
            alert('the job has been quoed');
            self.properties = {};
            self.type = null;
            window.location.reload();
          }
        });
    },
  },
  mounted: function () {
    this.datasources = new Fields().fields;
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
form {
  padding: 10px;
  background: #f4f4f4;
  margin-bottom: 15px;
}

.form-check {
  margin-bottom: 15px;
}
</style>
