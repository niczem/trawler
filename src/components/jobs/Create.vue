<template>
  <form v-on:submit.prevent="createJob">
    <PropsForm v-on:changeType="changeType" v-on:changeProperties="changeProperties"></PropsForm>
    <button type="submit" class="btn btn-primary">Submit</button>
  </form>
</template>

<script>
import axios from 'axios';

import PropsForm from './PropsForm.vue';

import Fields from '../../../utils/Fields.js';

export default {
  name: 'Dashboard',
  components: {
    PropsForm,
  },
  data: () => ({
    jobs: [],
    type: null,
    continue_with_job: null,
    continueCrawl: 0,
    datasources: [],
    properties: {},
    schedule: { active: false },
  }),
  methods: {
    changeType:function(event){
      alert('asd');
      const { value } = event.target;
      this.type = value;
    },
    changeMeta:function(meta){
      this.continue_with_job = meta.continue_with_job;
      this.continueCrawl = meta.continueCrawl;
      this.schedule = meta.schedule;
    },
    changeProperties: function(properties) {
      this.properties = properties;
    },
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
        .post(process.env.VUE_APP_API_BASE_URL + '/jobs', {
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
