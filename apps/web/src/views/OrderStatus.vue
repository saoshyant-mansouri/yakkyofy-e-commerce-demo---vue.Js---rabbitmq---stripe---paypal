<template>
  <div class="card max-w-lg p-6">
    <div v-if="loading" class="flex flex-col gap-4" role="status" aria-busy="true" :aria-label="$t('common.loading')">
      <div class="flex items-center justify-between">
        <div class="h-4 w-24 rounded-full animate-pulse bg-surface-muted" />
        <div class="h-5 w-16 rounded-full animate-pulse bg-surface-muted" />
      </div>
      <div class="h-8 w-32 rounded-full animate-pulse bg-surface-muted" />
      <div class="flex flex-col gap-3 border-t border-border pt-4">
        <div class="h-4 w-3/4 rounded-full animate-pulse bg-surface-muted" />
        <div class="h-4 w-2/3 rounded-full animate-pulse bg-surface-muted" />
        <div class="h-4 w-1/2 rounded-full animate-pulse bg-surface-muted" />
      </div>
    </div>
    <div v-else-if="order" class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="text-text-muted text-sm">Order #{{ order._id.slice(-8) }}</span>
        <StatusBadge :status="order.status" />
      </div>
      <p class="text-2xl font-semibold">{{ formatMinor(order.amountMinor, order.currency) }}</p>
      <ol class="flex flex-col gap-2 border-t border-border pt-4">
        <li v-for="(event, i) in order.events" :key="i" class="flex items-center gap-3 text-sm">
          <span class="w-2 h-2 rounded-full bg-brand-teal shrink-0" aria-hidden="true" />
          <span class="text-text-secondary">{{ event.message }}</span>
          <span class="text-text-muted ml-auto text-xs">{{ formatTime(event.at) }}</span>
        </li>
      </ol>
      <p v-if="order.status === 'processing'" class="text-sm text-text-muted" role="status">
        {{ $t('checkout.processing') }} (async worker is settling this via RabbitMQ)
      </p>
      <p v-else-if="order.status === 'paid'" class="text-sm text-brand-teal">{{ $t('checkout.success') }}</p>
      <p v-else-if="order.status === 'failed'" class="text-sm text-brand-pink">{{ $t('checkout.failure') }}</p>
      <router-link to="/products" class="text-sm text-text-muted hover:underline mt-2">
        {{ $t('cart.browse') }}
      </router-link>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { formatMinor } from '../i18n';
import StatusBadge from '../components/StatusBadge.vue';

const POLL_INTERVAL_MS = 2000;
const POLL_TERMINAL_STATUSES = ['paid', 'failed'];

export default {
  name: 'OrderStatus',
  components: { StatusBadge },
  props: {
    id: { type: String, required: true },
  },
  data() {
    return { order: null, loading: true, pollHandle: null };
  },
  created() {
    this.load();
  },
  beforeDestroy() {
    if (this.pollHandle) clearTimeout(this.pollHandle);
  },
  methods: {
    ...mapActions('checkout', ['fetchOrder']),
    formatMinor,
    formatTime(iso) {
      return new Date(iso).toLocaleTimeString();
    },
    async load() {
      // Only show the skeleton on the first load — poll refreshes update the
      // order in place so the timeline doesn't flash blank every 2 seconds.
      if (!this.order) this.loading = true;
      try {
        // Poll refreshes are silent so the top progress bar doesn't pulse every 2 seconds.
        this.order = await this.fetchOrder({ id: this.id, silent: Boolean(this.order) });
      } finally {
        this.loading = false;
      }
      if (this.order && !POLL_TERMINAL_STATUSES.includes(this.order.status)) {
        this.pollHandle = setTimeout(() => this.load(), POLL_INTERVAL_MS);
      }
    },
  },
};
</script>
