import Vue from 'vue';
import App from './App.vue';
import { router } from './router';
import { store } from './store';
import { i18n } from './i18n';
import { setUnauthorizedHandler } from './api/client';
import './assets/main.css';

Vue.config.productionTip = false;

setUnauthorizedHandler(() => {
  store.commit('auth/SET_USER', null);
  if (router.currentRoute.meta.requiresAuth) {
    router.push({ name: 'login', query: { redirect: router.currentRoute.fullPath } });
  }
});

store.dispatch('currency/fetchRates');

new Vue({
  router,
  store,
  i18n,
  render: (h) => h(App),
}).$mount('#app');
