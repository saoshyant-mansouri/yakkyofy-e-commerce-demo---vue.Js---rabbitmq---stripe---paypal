import Vue from 'vue';
import App from './App.vue';
import { router } from './router';
import { store } from './store';
import { i18n } from './i18n';
import { setUnauthorizedHandler } from './api/client';
import { wakeApi } from './boot/apiStatus';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import './assets/main.css';

Vue.config.productionTip = false;

setUnauthorizedHandler(() => {
  store.commit('auth/SET_USER', null);
  if (router.currentRoute.meta.requiresAuth) {
    router.push({ name: 'login', query: { redirect: router.currentRoute.fullPath } });
  }
});

// The API container scales to zero when idle (see infra/container_app_api.tf). Nothing blocks on
// it: public pages render straight away, the ping below gives the container a head start, and a
// small status pill in the header (plus a notice on the auth forms) shows a cold start instead of a
// full-screen splash.
wakeApi();
store.dispatch('currency/fetchRates').catch(() => {});

new Vue({
  router,
  store,
  i18n,
  render: (h) => h(App),
}).$mount('#app');
