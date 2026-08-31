import { api } from '../../api/client';

export default {
  namespaced: true,
  state: () => ({
    items: [],
    currency: 'EUR',
    subtotalMinor: 0,
    loading: false,
  }),
  mutations: {
    SET_CART(state, { items, currency, subtotalMinor }) {
      state.items = items;
      state.currency = currency;
      state.subtotalMinor = subtotalMinor;
    },
    SET_LOADING(state, val) {
      state.loading = val;
    },
  },
  getters: {
    itemCount: (state) => state.items.reduce((sum, i) => sum + i.qty, 0),
  },
  actions: {
    async fetchCart({ commit, rootState }) {
      commit('SET_LOADING', true);
      try {
        const { data } = await api.get('/cart', {
          params: { currency: rootState.currency.current },
        });
        commit('SET_CART', data);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    async addItem({ dispatch, rootState }, { productId, qty = 1 }) {
      await api.post(
        '/cart/items',
        { productId, qty },
        { params: { currency: rootState.currency.current } }
      );
      await dispatch('fetchCart');
    },
    async updateQty({ dispatch, rootState }, { productId, qty }) {
      await api.patch(
        `/cart/items/${productId}`,
        { qty },
        { params: { currency: rootState.currency.current } }
      );
      await dispatch('fetchCart');
    },
    async removeItem({ dispatch, rootState }, { productId }) {
      await api.delete(`/cart/items/${productId}`, {
        params: { currency: rootState.currency.current },
      });
      await dispatch('fetchCart');
    },
  },
};
