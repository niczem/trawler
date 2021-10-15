<template>
  <div class="home">
    <v-app data-app>
      <Dashboard></Dashboard>
    </v-app>
  </div>
</template>

<script>
// @ is an alias to /src
import Dashboard from '@/components/Dashboard.vue';

export default {
  name: 'Home',
  components: {
    Dashboard,
  },
};
</script>
