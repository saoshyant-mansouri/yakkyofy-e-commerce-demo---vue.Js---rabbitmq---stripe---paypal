import Vue from 'vue';
import { wakeBackend } from './wakeBackend';

/**
 * Background API wake-up, exposed as a tiny reactive status instead of a full-screen splash.
 *
 * The API container scales to zero when idle (infra/container_app_api.tf), so the first request
 * can take 10–30 seconds. Public pages never depend on the API, so nothing waits on this: it only
 * feeds the small status pill in the headers and the notice on the auth forms.
 *
 * States: 'checking' (first moments, shown as nothing so a warm API never flashes UI),
 * 'waking' (still no answer after SHOW_AFTER_MS), 'online', 'offline' (budget exhausted).
 */

const SHOW_AFTER_MS = 1_500;

export const apiStatus = Vue.observable({ state: 'checking', error: '' });

let running = null;

/** Any successful API response proves the server is up, whatever the ping is doing. */
export function markApiOnline() {
  apiStatus.state = 'online';
  apiStatus.error = '';
}

export function wakeApi() {
  if (running) return running;
  if (apiStatus.state === 'offline') apiStatus.state = 'waking';
  const showTimer = setTimeout(() => {
    if (apiStatus.state === 'checking') apiStatus.state = 'waking';
  }, SHOW_AFTER_MS);

  // Same base URL as the axios client, so the ping wakes the API the app will actually call.
  running = wakeBackend({ url: `${import.meta.env.VITE_API_BASE_URL || '/api'}/ping` })
    .then((result) => {
      if (result.ok) {
        markApiOnline();
      } else if (apiStatus.state !== 'online') {
        apiStatus.state = 'offline';
        apiStatus.error = result.error;
      }
      return result;
    })
    .finally(() => {
      clearTimeout(showTimer);
      running = null;
    });
  return running;
}
