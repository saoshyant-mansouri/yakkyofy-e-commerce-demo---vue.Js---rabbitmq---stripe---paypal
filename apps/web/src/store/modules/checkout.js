import { api } from '../../api/client';

export default {
  namespaced: true,
  state: () => ({
    currentOrder: null,
    starting: false,
  }),
  mutations: {
    SET_ORDER(state, order) {
      state.currentOrder = order;
    },
    SET_STARTING(state, val) {
      state.starting = val;
    },
  },
  actions: {
    async start({ commit, rootState }, provider) {
      commit('SET_STARTING', true);
      try {
        const { data } = await api.post('/checkout/start', {
          provider,
          currency: rootState.currency.current,
        });
        return data;
      } finally {
        commit('SET_STARTING', false);
      }
    },
    async confirmStripe(_ctx, orderId) {
      const { data } = await api.post('/checkout/stripe/confirm', { orderId });
      return data.order;
    },
    async capturePaypal(_ctx, orderId) {
      const { data } = await api.post('/checkout/paypal/capture', { orderId });
      return data.order;
    },
    async payMangopay(_ctx, payload) {
      const { data } = await api.post('/checkout/mangopay/pay', payload);
      return data.order;
    },
    async fetchOrder(_ctx, orderId) {
      const { data } = await api.get(`/orders/${orderId}`);
      return data.order;
    },
    async fetchOrders() {
      const { data } = await api.get('/orders');
      return data.orders;
    },
  },
};
