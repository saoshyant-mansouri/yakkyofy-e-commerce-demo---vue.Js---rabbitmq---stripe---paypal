import { api, dedupedGet } from '../../api/client';

export default {
  namespaced: true,
  state: () => ({
    items: [],
    currency: 'EUR',
    subtotalMinor: 0,
    loading: false,
    loaded: false,
  }),
  mutations: {
    SET_CART(state, { items, currency, subtotalMinor }) {
      state.items = items;
      state.currency = currency;
      state.subtotalMinor = subtotalMinor;
      state.loaded = true;
    },
    SET_LOADING(state, val) {
      state.loading = val;
    },
  },
  getters: {
    itemCount: (state) => state.items.reduce((sum, i) => sum + i.qty, 0),
  },
  actions: {
    async fetchCart({ commit, state, rootState }) {
      // Skeleton only when there's nothing to show yet; refreshes update the cart in place.
      if (!state.loaded) commit('SET_LOADING', true);
      try {
        const { data } = await dedupedGet('/cart', {
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
