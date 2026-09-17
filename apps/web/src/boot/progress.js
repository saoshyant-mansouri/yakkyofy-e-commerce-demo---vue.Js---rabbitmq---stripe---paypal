import Vue from 'vue';

/**
 * Shared loading state for the thin top progress bar: in-flight API requests plus a pending
 * route change (which includes downloading a lazy route chunk). Kept outside Vuex because it
 * changes on every request and isn't application state worth recording in devtools.
 */
export const progress = Vue.observable({ requests: 0, navigating: false });

export function trackRequestStart() {
  progress.requests += 1;
}

export function trackRequestEnd() {
  progress.requests = Math.max(0, progress.requests - 1);
}

export function setNavigating(value) {
  progress.navigating = value;
}
