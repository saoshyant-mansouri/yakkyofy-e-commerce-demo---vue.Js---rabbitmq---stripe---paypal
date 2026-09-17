import { api } from '../../api/client';

const STORAGE_KEY = 'yk_currency';
const RATES_CACHE_KEY = 'yk_rates';
const RATES_TTL_MS = 60 * 60 * 1000;

// Exchange rates barely move within an hour. Serving the last copy from localStorage means a
// reload never waits on (or wakes) the API just to format prices; a fresh copy is fetched in the
// background once the cached one is stale.
function readCachedRates() {
  try {
    const cached = JSON.parse(localStorage.getItem(RATES_CACHE_KEY));
    return cached && cached.rates ? cached : null;
  } catch {
    return null;
  }
}

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
      const cached = readCachedRates();
      if (cached) {
        commit('SET_RATES', cached);
        if (Date.now() - cached.savedAt < RATES_TTL_MS) return;
      }
      const { data } = await api.get('/currencies');
      commit('SET_RATES', { rates: data.rates, currencies: data.currencies });
      try {
        localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({ rates: data.rates, currencies: data.currencies, savedAt: Date.now() }));
      } catch {
        // Storage full or blocked: the rates still apply for this session.
      }
    },
    setCurrency({ commit }, currency) {
      commit('SET_CURRENCY', currency);
    },
  },
};
