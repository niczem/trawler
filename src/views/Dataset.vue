<template>
  <div class="about">
    <h1>Dataset {{ $route.params.id }}</h1>
    <p></p>
    <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
    ></v-text-field>
    <div v-for="(rows, index) in data.data" v-bind:key="index">
      <h3 v-if="index !== 'sqlite_sequence'">table: {{ index }}</h3>

      <v-data-table
        v-if="index !== 'sqlite_sequence'"
        :headers="rows.field_names"
        :items="rows"
        :items-per-page="25"
        class="datatable"
        :search="search"
      ></v-data-table>
    </div>
  </div>
</template>
<script>
import axios from 'axios';

export default {
  name: 'Dataset',
  data: () => ({
    data: [],
    search: ''
  }),
  methods: {
    getData: function () {
      axios
        .get('http://localhost:3000/datasets/' + this.$route.params.id)
        .then((response) => {
          for (let table_index in response.data.data) {
            console.log(table_index);
            for (let row_index in response.data.data[table_index]) {
              response.data.data[table_index].field_names = [];
              for (let column_index in response.data.data[table_index][
                row_index
              ]) {
                if (
                  response.data.data[table_index].field_names.indexOf(
                    column_index
                  ) == -1
                )
                  response.data.data[table_index].field_names.push({
                    text: column_index,
                    value: column_index,
                  });
              }
            }
          }
          this.data = response.data;
        });
    },
  },
  mounted: function () {
    this.getData();
  },
};
</script>
<style scoped>
.datatable {
  text-align: left;
}
</style>
