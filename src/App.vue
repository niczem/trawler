<template>
  <div id="app">
    <Login v-if="modal == 'login'"></Login>
    <div id="nav">
      <router-link to="/">Home</router-link>
    </div>
    <router-view />
  </div>
</template>
<script lang="ts">
import Login from '@/components/Login.vue';
import { serverBus } from './main';

export default {
  name: 'app',
  components: {
    Login
  },
  data: () => ({
    modal: '',
    modal_data: {},
    show_loadingscreen: true,
    initial_replication_done: false
  }),
  methods: {
  },
  created: function() {

    serverBus.$on('show_login_screen', () => {
      this.show_loadingscreen = false;
      this.modal_data = {};
      this.modal = 'login';
    });

    //set on change listener on positions because its usually the largest database
    this.$db.setOnInitialReplicationDone(
      'positions',
      'hide_loadingscreen',
      () => {
        this.show_loadingscreen = false;
        this.initial_replication_done = true;
      }
    );
  },
};
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}

button,
[type='button'],
[type='reset'],
[type='submit'],
[role='button'] {
  /*color: #fff!important;*/
}
</style>
