import axios from 'axios';
import { trackRequestEnd, trackRequestStart } from '../boot/progress';
import { markApiOnline } from '../boot/apiStatus';

// withCredentials so the browser sends/receives the HttpOnly auth cookies
// set by the API. No token handling happens in JS at all here — unlike the
// real Yakkyofy app, there's nothing for client-side script to read or steal.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
});

let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

// Background polling (e.g. order status) passes `silent: true` so it doesn't pulse the progress bar.
api.interceptors.request.use((config) => {
  if (!config.silent) trackRequestStart();
  return config;
});

function settle(config) {
  if (config && !config.silent && !config._settled) {
    config._settled = true;
    trackRequestEnd();
  }
}

// One shared refresh for a burst of 401s: when several requests expire at once (the dashboard
// fires orders + cart together), they all wait on a single /auth/refresh instead of each one
// rotating the refresh token and racing the others.
let refreshing = null;

api.interceptors.response.use(
  (res) => {
    settle(res.config);
    markApiOnline();
    return res;
  },
  async (error) => {
    const original = error.config;
    settle(original);
    if (error.response?.status === 401 && original && !original._retry && !original.url.includes('/auth/')) {
      original._retry = true;
      original._settled = false;
      try {
        refreshing ||= api.post('/auth/refresh').finally(() => { refreshing = null; });
        await refreshing;
        return api(original);
      } catch {
        if (onUnauthorized) onUnauthorized();
      }
    }
    return Promise.reject(error);
  }
);

// Identical GETs already in flight share one request. Components and store watchers often ask
// for the same resource at the same moment (the layout and the cart page both load the cart on
// navigation); the real Yakkyofy dashboard fires its stats request twice on every load for the
// same reason.
const inFlight = new Map();

export function dedupedGet(url, config = {}) {
  const key = `${url}?${JSON.stringify(config.params || {})}`;
  if (!inFlight.has(key)) {
    inFlight.set(key, api.get(url, config).finally(() => inFlight.delete(key)));
  }
  return inFlight.get(key);
}
