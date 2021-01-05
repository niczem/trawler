<template>
  <div class="hello">
    <table class="table table-striped">
      <tr>
        <td>Timestamp</td>
        <td>Type</td>
        <td>Identifier</td>
        <td>Filetype</td>
        <td>Download</td>
      </tr>
      <tr v-for="crawl in crawls.data" v-bind:key="crawl">
        <td>
          {{ ('0' + (new Date(crawl.date).getUTCDate() + 1)).slice(-2) }}.{{
            '0' + (new Date(crawl.date).getUTCMonth() + 1)
          }}
          - {{ ('0' + (new Date(crawl.date).getHours() + 1)).slice(-2) }}:{{
            ('0' + (new Date(crawl.date).getMinutes() + 1)).slice(-2)
          }}
        </td>
        <td>
          <a :href="'/datasets/' + crawl.filename">{{
            crawl.filename.split('_').slice(1, -1).join('_')
          }}</a>
        </td>
        <td>
          <a :href="'/datasets/' + crawl.filename">{{
            crawl.filename.split('_').pop().split('.')[0]
          }}</a>
        </td>
        <td>
          <a :href="'/datasets/' + crawl.filename">{{
            crawl.filename.split('.').pop()
          }}</a>
        </td>
        <td>
          <a :href="'/downloaddataset/' + crawl.filename">
            <svg
              width="1em"
              height="1em"
              viewBox="0 0 16 16"
              class="bi bi-download"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"
              />
              <path
                fill-rule="evenodd"
                d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"
              />
            </svg>
          </a>
          <a v-on:click="deleteDataset(crawl.filename)">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              fill="currentColor"
              class="bi bi-trash"
              viewBox="0 0 16 16"
            >
              <path
                d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"
              />
              <path
                fill-rule="evenodd"
                d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
              />
            </svg>
          </a>
        </td>
      </tr>
    </table>
  </div>
</template>
<script>
import axios from 'axios';

export default {
  name: 'Overview',
  data: () => ({
    crawls: [],
  }),
  methods: {
    getCrawls: function () {
      axios
        .get(process.env.VUE_APP_API_BASE_URL + '/datasets')
        .then((response) => {
          this.crawls = response.data;
          for (let i in this.crawls.data) {
            this.crawls.data[i] = {
              filename: this.crawls.data[i],
              date: new Date(parseInt(this.crawls.data[i].split('_')[0])),
            };
          }
        });
    },
    deleteDataset: function (filename) {
      var r = confirm('Are you sure to delete the dataset ' + filename + '?');
      if (r == true) {
        axios
          .delete(process.env.VUE_APP_API_BASE_URL + '/datasets/' + filename)
          .then((response) => {
            alert('the dataset was deleted');
            window.location.reload();
          });
      }
    },
  },
  mounted: function () {
    this.getCrawls();
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
</style>
