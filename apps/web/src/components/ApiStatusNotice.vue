<template>
  <div
    v-if="status.state === 'waking' || status.state === 'offline'"
    class="rounded-card bg-surface-muted p-4 text-sm mb-6 flex gap-3"
    role="status"
    aria-live="polite"
  >
    <Spinner v-if="status.state === 'waking'" size="sm" label="Waking the API" class="text-brand-orange shrink-0 mt-0.5" />
    <div>
      <template v-if="status.state === 'waking'">
        <p class="font-medium text-text">The demo API is waking up</p>
        <p class="text-text-secondary">
          It scales to zero when idle, so the first request takes 10–30 seconds. You can fill in the form meanwhile.
        </p>
      </template>
      <template v-else>
        <p class="font-medium text-text">The API isn't responding</p>
        <p class="text-text-secondary">
          It may still be starting ({{ status.error }}).
          <button type="button" class="text-brand-orange hover:underline" @click="retry">Try again</button>
        </p>
      </template>
    </div>
  </div>
</template>

<script>
import Spinner from './Spinner.vue';
import { apiStatus, wakeApi } from '../boot/apiStatus';

export default {
  name: 'ApiStatusNotice',
  components: { Spinner },
  computed: {
    status: () => apiStatus,
  },
  methods: {
    retry: () => wakeApi(),
  },
};
</script>
