const THEME_KEY = 'yakkyofy-demo-theme';

function getInitialTheme() {
  let theme;
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    theme = stored === 'light' || stored === 'dark'
      ? stored
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    theme = 'light';
  }
  // SET_THEME normally applies data-theme to <html>, but that mutation only
  // runs when the user actively toggles. Without this, every [data-theme]
  // CSS variable (surface/text/border colors) is undefined on first load —
  // most elements coincidentally still look right off the browser's default
  // black-text fallback, but anything relying on a *specific* themed value
  // (e.g. white text on an always-dark diagram node) silently renders
  // invisible until the user happens to toggle the theme once.
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
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
