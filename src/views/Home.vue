<template>
  <div class="home">
    <Dashboard></Dashboard>
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
