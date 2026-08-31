import { api } from '../../api/client';

export default {
  namespaced: true,
  state: () => ({
    items: [],
    categories: [],
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    loading: false,
    activeCategory: '',
    query: '',
  }),
  mutations: {
    SET_LIST(state, { items, page, limit, total, totalPages }) {
      state.items = items;
      state.page = page;
      state.limit = limit;
      state.total = total;
      state.totalPages = totalPages;
    },
    SET_CATEGORIES(state, categories) {
      state.categories = categories;
    },
    SET_LOADING(state, val) {
      state.loading = val;
    },
    SET_FILTERS(state, { category, query }) {
      if (category !== undefined) state.activeCategory = category;
      if (query !== undefined) state.query = query;
    },
  },
  actions: {
    async fetchCategories({ commit }) {
      const { data } = await api.get('/products/categories');
      commit('SET_CATEGORIES', data.categories);
    },
    async fetchProducts({ commit, state, rootState }, { page = 1 } = {}) {
      commit('SET_LOADING', true);
      try {
        const { data } = await api.get('/products', {
          params: {
            page,
            limit: state.limit,
            category: state.activeCategory || undefined,
            q: state.query || undefined,
            currency: rootState.currency.current,
          },
        });
        commit('SET_LIST', data);
      } finally {
        commit('SET_LOADING', false);
      }
    },
  },
};
