import { api, dedupedGet } from '../../api/client';

// The URL (?page=&category=&q=) is the source of truth for which page of the catalogue is shown;
// this module only caches what was fetched for it. Returning to a list you just saw (browser back,
// "Back to products") renders the cached page instantly with no request, and a cached page older
// than FRESH_MS is shown immediately and refreshed quietly in the background.

const FRESH_MS = 60_000;

// Guards against out-of-order responses when the user pages or filters faster than the API answers.
let latestProductsRequest = 0;

function listKey({ page, category, q, currency }) {
  return JSON.stringify([page, category || '', q || '', currency]);
}

export default {
  namespaced: true,
  state: () => ({
    items: [],
    categories: [],
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    // Which list `items` belongs to, and when it was fetched.
    key: '',
    fetchedAt: 0,
    // True only while the grid is showing another list's items and waiting for the requested one.
    loading: false,
    // The catalogue query last shown, so "Back to products" returns to that exact page.
    lastQuery: {},
  }),
  getters: {
    loaded: (state) => state.key !== '',
    // A product already in the loaded list, so the detail page can render it immediately.
    findProduct: (state) => (idOrSlug) => state.items.find((p) => p.slug === idOrSlug || p._id === idOrSlug),
  },
  mutations: {
    SET_LIST(state, { data, key }) {
      state.items = data.items;
      state.page = data.page;
      state.limit = data.limit;
      state.total = data.total;
      state.totalPages = data.totalPages;
      state.key = key;
      state.fetchedAt = Date.now();
    },
    SET_CATEGORIES(state, categories) {
      state.categories = categories;
    },
    SET_LOADING(state, val) {
      state.loading = val;
    },
    SET_LAST_QUERY(state, query) {
      state.lastQuery = query;
    },
  },
  actions: {
    async fetchCategories({ commit, state }) {
      // Categories don't change within a session; revisiting the catalogue shouldn't refetch them.
      if (state.categories.length) return;
      const { data } = await dedupedGet('/products/categories');
      commit('SET_CATEGORIES', data.categories);
    },
    async loadProducts({ commit, state, rootState }, { page = 1, category = '', q = '' } = {}) {
      const currency = rootState.currency.current;
      const key = listKey({ page, category, q, currency });
      const sameList = key === state.key;
      if (sameList && Date.now() - state.fetchedAt < FRESH_MS) return;

      const requestId = ++latestProductsRequest;
      // Refreshing the list already on screen happens silently; only a different list dims the grid.
      if (!sameList) commit('SET_LOADING', true);
      try {
        const { data } = await api.get('/products', {
          params: { page, limit: state.limit, category: category || undefined, q: q || undefined, currency },
          silent: sameList,
        });
        if (requestId === latestProductsRequest) commit('SET_LIST', { data, key });
      } finally {
        if (requestId === latestProductsRequest) commit('SET_LOADING', false);
      }
    },
  },
};
