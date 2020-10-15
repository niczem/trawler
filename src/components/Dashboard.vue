<template>
  <div class="container">
    <div class="row">
      <div class="col-12">
        <div id="jobs">
          <h2>Datasets</h2>
          <DatasetOverview></DatasetOverview>
        </div>
      </div>
      <div class="col-12">
        <div id="jobs">
          <h2>Jobs</h2>
          <a
            v-on:click="showCreateCrawl = true"
            v-if="!showCreateCrawl"
            class="btn btn-outline-success btn-sm"
            title="create crawl"
            href="#"
            style="position: absolute; top: 5px; right: 5px"
            >+</a
          >
          <a
            class="closeCreateCrawl"
            v-if="showCreateCrawl"
            v-on:click="showCreateCrawl = false"
            >&times;</a
          >
          <CreateJob v-if="showCreateCrawl"></CreateJob>
          <JobOverview></JobOverview>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import JobOverview from '@/components/jobs/Overview.vue';
import DatasetOverview from '@/components/datasets/Overview.vue';
import CreateJob from '@/components/jobs/Create.vue';

export default {
  name: 'Dashboard',
  data: () => ({
    showCreateCrawl: false,
  }),
  props: {
    msg: String,
  },
  components: {
    JobOverview,
    DatasetOverview,
    CreateJob,
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

.closeCreateCrawl {
  position: absolute;
  right: 17px;
  cursor: pointer;
}
</style>
