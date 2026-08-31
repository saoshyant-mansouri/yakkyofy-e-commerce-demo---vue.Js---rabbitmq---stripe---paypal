import Vue from 'vue';
import Vuex from 'vuex';
import auth from './modules/auth';
import catalog from './modules/catalog';
import cart from './modules/cart';
import currency from './modules/currency';
import checkout from './modules/checkout';
import ui from './modules/ui';

Vue.use(Vuex);

export const store = new Vuex.Store({
  modules: { auth, catalog, cart, currency, checkout, ui },
  strict: import.meta.env.DEV,
});
