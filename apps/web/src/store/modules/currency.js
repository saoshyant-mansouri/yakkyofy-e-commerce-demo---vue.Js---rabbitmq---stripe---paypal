import { api } from '../../api/client';

const STORAGE_KEY = 'yk_currency';

export default {
  namespaced: true,
  state: () => ({
    current: localStorage.getItem(STORAGE_KEY) || 'EUR',
    supported: ['EUR', 'USD', 'GBP', 'CAD'],
    rates: { EUR: 1 },
  }),
  mutations: {
    SET_CURRENCY(state, currency) {
      state.current = currency;
      localStorage.setItem(STORAGE_KEY, currency);
    },
    SET_RATES(state, { rates, currencies }) {
      state.rates = rates;
      if (currencies) state.supported = currencies;
    },
  },
  actions: {
    async fetchRates({ commit }) {
      const { data } = await api.get('/currencies');
      commit('SET_RATES', { rates: data.rates, currencies: data.currencies });
    },
    setCurrency({ commit }, currency) {
      commit('SET_CURRENCY', currency);
    },
  },
};
