<template>
  <div>
    <ul
      v-if="loading"
      class="card flex flex-col divide-y divide-border overflow-hidden"
      role="status"
      aria-busy="true"
      :aria-label="$t('common.loading')"
    >
      <li v-for="n in 4" :key="n" class="flex items-center justify-between gap-4 p-4 bg-surface">
        <div class="flex flex-col gap-2">
          <div class="h-4 w-32 rounded-full animate-pulse bg-surface-muted" />
          <div class="h-3 w-24 rounded-full animate-pulse bg-surface-muted" />
        </div>
        <div class="flex items-center gap-3">
          <div class="h-4 w-14 rounded-full animate-pulse bg-surface-muted" />
          <div class="h-5 w-16 rounded-full animate-pulse bg-surface-muted" />
        </div>
      </li>
    </ul>
    <p v-else-if="orders.length === 0" class="card p-6 text-text-muted">No orders yet.</p>
    <ul v-else class="card flex flex-col divide-y divide-border overflow-hidden">
      <li v-for="order in orders" :key="order._id">
        <router-link
          :to="`/orders/${order._id}`"
          class="flex items-center justify-between gap-4 p-4 bg-surface hover:bg-surface-muted transition-colors"
        >
          <div>
            <p class="font-medium">Order #{{ order._id.slice(-8) }}</p>
            <p class="text-sm text-text-muted capitalize">{{ order.provider }} &middot; {{ formatTime(order.createdAt) }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="font-medium">{{ formatMinor(order.amountMinor, order.currency) }}</span>
            <StatusBadge :status="order.status" />
          </div>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { formatMinor } from '../i18n';
import StatusBadge from '../components/StatusBadge.vue';

export default {
  name: 'OrdersList',
  components: { StatusBadge },
  data() {
    return { orders: [], loading: true };
  },
  async created() {
    this.orders = await this.fetchOrders();
    this.loading = false;
  },
  methods: {
    ...mapActions('checkout', ['fetchOrders']),
    formatMinor,
    formatTime(iso) {
      return new Date(iso).toLocaleDateString();
    },
  },
};
</script>
