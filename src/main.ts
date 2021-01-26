import Vue from 'vue';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';

import { PouchWrapper } from './utils/pouchWrapper';

Vue.config.productionTip = false;

export const serverBus = new Vue();

new Vue({
  router,
  vuetify,
  render: (h) => h(App),
}).$mount('#app');

Vue.prototype.$db = new PouchWrapper();

Vue.prototype.$db.setLoginCallback(function() {
  serverBus.$emit('show_login_screen');
});