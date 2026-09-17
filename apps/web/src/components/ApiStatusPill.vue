<template>
  <span
    v-if="status.state === 'waking'"
    class="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-surface-muted text-xs font-medium text-text-secondary whitespace-nowrap"
    role="status"
    title="The demo API scales to zero when idle — a cold start takes 10–30 seconds. Public pages work meanwhile."
  >
    <span class="api-dot bg-brand-orange" aria-hidden="true" />
    <span :class="compact && 'hidden sm:inline'">Waking API…</span>
    <span v-if="compact" class="sr-only sm:hidden">Waking API…</span>
  </span>
  <button
    v-else-if="status.state === 'offline'"
    type="button"
    class="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-surface-muted text-xs font-medium text-text-secondary whitespace-nowrap hover:text-text"
    :title="`The API didn't respond (${status.error}). Click to try again.`"
    @click="retry"
  >
    <span class="api-dot api-dot--static bg-brand-pink" aria-hidden="true" />
    <span :class="compact && 'hidden sm:inline'">API offline · Retry</span>
    <span v-if="compact" class="sr-only sm:hidden">API offline, retry</span>
  </button>
</template>

<script>
import { apiStatus, wakeApi } from '../boot/apiStatus';

export default {
  name: 'ApiStatusPill',
  props: {
    // Icon-only on small screens, for crowded headers.
    compact: { type: Boolean, default: false },
  },
  computed: {
    status: () => apiStatus,
  },
  methods: {
    retry: () => wakeApi(),
  },
};
</script>

<style scoped>
.api-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  flex-shrink: 0;
  animation: api-dot-pulse 1.2s ease-in-out infinite;
}
.api-dot--static {
  animation: none;
}
@keyframes api-dot-pulse {
  50% { opacity: 0.35; }
}
@media (prefers-reduced-motion: reduce) {
  .api-dot { animation: none; }
}
</style>
