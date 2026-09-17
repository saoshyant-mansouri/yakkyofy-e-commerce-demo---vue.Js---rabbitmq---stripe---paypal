import { api, dedupedGet } from '../../api/client';

export default {
  namespaced: true,
  state: () => ({
    user: null,
    initialized: false,
  }),
  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    SET_INITIALIZED(state, val) {
      state.initialized = val;
    },
  },
  actions: {
    async fetchMe({ commit }) {
      try {
        // Deduped: the route guard and a layout can both ask on first load.
        const { data } = await dedupedGet('/auth/me');
        commit('SET_USER', data.user);
      } catch {
        commit('SET_USER', null);
      } finally {
        commit('SET_INITIALIZED', true);
      }
    },
    async register({ commit }, payload) {
      const { data } = await api.post('/auth/register', payload);
      commit('SET_USER', data.user);
    },
    async login({ commit }, payload) {
      const { data } = await api.post('/auth/login', payload);
      commit('SET_USER', data.user);
    },
    async logout({ commit }) {
      await api.post('/auth/logout');
      commit('SET_USER', null);
    },
  },
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
  },
};
