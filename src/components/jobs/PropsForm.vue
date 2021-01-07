<template>
  <div>
    <h4 v-if="isChild">Configure follow up job:</h4>
    <div class="form-group">
      <label for="type">choose type</label>
      <select class="form-control" id="type" v-model="type" v-on:change="(event) => this.$emit('changeType',event)">
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
            v-on:change="changeProperties()"

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
    <div class="form-check" v-if="type&&!isChild">
      <input
        type="checkbox"
        class="form-check-input"
        id="exampleCheck1"
        value="1"
        v-model="continueCrawl"
        v-on:change="changeMeta()"
      />
      <label class="form-check-label" for="exampleCheck1"
        >continue crawl with children</label
      >
    </div>

    <div class="form-check" v-if="type&&!isChild">
      <input
        type="checkbox"
        v-model="schedule.repeat"
        value="1"
        class="form-check-input"
      />
      <label class="form-check-label">schedule </label>
    </div>

    <div class="form-group" v-if="schedule.repeat" style="padding-left: 15px">
      <input
        class="form-control"
        placeholder="time"
        type="datetime-local"
        id="scheduletime"
        v-model="schedule.scheduletime"
        v-on:change="changeMeta()"
      />
    </div>

    <!-- schedule start -->
    <div class="form-check" v-if="type&&!isChild">
      <input
        type="checkbox"
        v-model="schedule.active"
        value="1"
        class="form-check-input"
      />
      <label class="form-check-label">repeat </label>
    </div>
    <div v-if="schedule.active" style="padding-left: 15px">
      <div class="custom-control custom-radio">
        <input
          type="radio"
          class="custom-control-input"
          id="defaultUnchecked1"
          name="schedule"
          v-model="schedule.interval"
          value="hourly"
          v-on:change="changeMeta()"
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
          v-on:change="changeMeta()"
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
          v-on:change="changeMeta()"
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
          v-on:change="changeMeta()"
          value="monthly"
        />
        <label class="custom-control-label" for="defaultChecked4"
          >Monthly</label
        >
      </div>
    </div>
    <!-- schedule stop -->
    <div class="form-check" v-if="type">
      <input
        type="checkbox"
        class="form-check-input"
        id="continuteWithJob"
        value="1"
        v-model="continue_with_job"
      />
      <label class="form-check-label" for="continuteWithJob"
        >continue with job (output_file of current job will be input_file of follow up job)</label
      >
    </div>
    <PropsForm isChild="true" v-if="continue_with_job" v-on:changeChildProperties="changeChildProperties"></PropsForm>
  </div>
</template>

<script>

import PropsForm from './PropsForm.vue';
import Fields from '../../../utils/Fields.js';

export default {
  name: 'PropsForm',
  data: () => ({
    type: null,
    continue_with_job: false,
    continueCrawl: 0,
    datasources: [],
    properties: {},
    schedule: { active: false },
  }),
  props: ['isChild'],
  methods: {
    //this function is used to reach through properties to parent job
    changeChildProperties:function(child_properties){
        if(!this.isChild)
            this.$emit('changeChildProperties', child_properties);
        else{
            this.properties.continue_with_job = child_properties;
            this.$emit('changeChildProperties', this.properties);
        }

    },
    changeProperties: function() {
        this.properties.type = this.type;
        if(this.isChild)
            this.$emit('changeChildProperties', this.properties);
        else
            this.$emit('changeProperties', this.properties);
    },
    changeMeta: function() {
        this.$emit('changeMeta', {
            continue_with_job:this.continue_with_job,
            continueCrawl:this.continueCrawl,
            schedule:this.schedule
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
