const THEME_KEY = 'yakkyofy-demo-theme';

function getInitialTheme() {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export default {
  namespaced: true,
  state: () => ({
    theme: getInitialTheme(),
    sidebarOpen: false,
  }),
  mutations: {
    SET_THEME(state, theme) {
      state.theme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      try {
        window.localStorage.setItem(THEME_KEY, theme);
      } catch {
        // localStorage unavailable (private mode, etc.) — theme still applies for this load.
      }
    },
    SET_SIDEBAR_OPEN(state, open) {
      state.sidebarOpen = open;
    },
  },
  actions: {
    toggleTheme({ state, commit }) {
      commit('SET_THEME', state.theme === 'dark' ? 'light' : 'dark');
    },
    openSidebar({ commit }) {
      commit('SET_SIDEBAR_OPEN', true);
    },
    closeSidebar({ commit }) {
      commit('SET_SIDEBAR_OPEN', false);
    },
  },
};
