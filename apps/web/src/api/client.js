import axios from 'axios';

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

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes('/auth/')) {
      original._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(original);
      } catch {
        if (onUnauthorized) onUnauthorized();
      }
    }
    return Promise.reject(error);
  }
);
