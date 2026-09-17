<template>
  <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
    <!-- Onboarding stepper, like the original's "Connect your first store" carousel. -->
    <section v-if="!loadingOrders && orders.length === 0" class="card lg:col-span-2 px-6 py-8 sm:px-14 relative">
      <button
        type="button"
        class="icon-btn absolute left-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex"
        :disabled="activeStep === 0"
        aria-label="Previous step"
        @click="activeStep -= 1"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div class="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10">
        <div class="grid place-items-center w-28 h-28 sm:w-40 sm:h-40 shrink-0 rounded-full bg-accent text-brand-orange mx-auto sm:mx-0" aria-hidden="true">
          <svg class="w-14 h-14 sm:w-20 sm:h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
            <path stroke-linecap="round" stroke-linejoin="round" :d="currentStep.icon" />
          </svg>
        </div>
        <div class="min-w-0">
          <h2 class="text-2xl sm:text-[28px] font-semibold text-brand-orange">{{ currentStep.title }}</h2>
          <p class="mt-2 max-w-xl text-[15px] text-text-secondary">{{ currentStep.body }}</p>
          <router-link :to="currentStep.to" class="btn-primary mt-4">{{ currentStep.cta }}</router-link>
          <ol class="mt-6 flex items-center" aria-label="Getting started progress">
            <li v-for="(step, i) in steps" :key="step.title" class="flex items-center">
              <button
                type="button"
                class="grid place-items-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors"
                :class="i === activeStep ? 'bg-brand-orange border-brand-orange text-ink' : step.done ? 'border-brand-orange text-brand-orange' : 'border-border-strong text-text-muted'"
                :aria-current="i === activeStep ? 'step' : null"
                :aria-label="`Step ${i + 1}: ${step.title}${step.done ? ' (done)' : ''}`"
                @click="activeStep = i"
              >
                {{ i + 1 }}
              </button>
              <span v-if="i < steps.length - 1" class="w-12 sm:w-16 h-0.5" :class="step.done ? 'bg-brand-orange' : 'bg-border-strong'" aria-hidden="true" />
            </li>
          </ol>
        </div>
      </div>
      <button
        type="button"
        class="icon-btn absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex"
        :disabled="activeStep === steps.length - 1"
        aria-label="Next step"
        @click="activeStep += 1"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
      </button>
    </section>

    <div class="flex flex-col gap-5 min-w-0">
      <div class="card flex items-center gap-4 border-l-4 border-l-text px-5 py-4">
        <span class="text-3xl" aria-hidden="true">👋</span>
        <div class="min-w-0">
          <p class="font-medium text-text">Welcome back{{ firstName ? `, ${firstName}` : '' }}</p>
          <p class="text-[15px] text-text-secondary">Here’s how your store is doing. Browse the catalogue, check out with a sandbox payment, and follow your orders.</p>
        </div>
      </div>

      <div class="grid gap-5 sm:grid-cols-3">
        <StatCard label="Total orders" :value="loadingOrders ? '—' : orders.length">
          <template #icon>
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path stroke-linecap="round" stroke-linejoin="round" d="M6 4h9l5 5v11a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1zM14 4v5h5M9 13h6M9 17h6" /></svg>
          </template>
        </StatCard>
        <StatCard label="Total spent" :value="loadingOrders ? '—' : spent.value" :unit="spent.unit">
          <template #icon>
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="6" width="18" height="13" rx="2" /><path stroke-linecap="round" d="M3 10h18M16 15h2" /></svg>
          </template>
        </StatCard>
        <StatCard label="Items in cart" :value="cartLoaded ? itemCount : '—'">
          <template #icon>
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l3.6-8H5.4M7 13L5.4 5M7 13l-1.5 6h11.6M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" /></svg>
          </template>
        </StatCard>
      </div>

      <section class="card p-6" aria-labelledby="recent-orders-title">
        <div class="flex items-center justify-between mb-4">
          <h2 id="recent-orders-title" class="text-xl font-semibold text-text">Recent orders</h2>
          <router-link v-if="orders.length" to="/orders" class="text-sm font-medium text-brand-orange hover:underline">View all</router-link>
        </div>
        <ul v-if="loadingOrders" class="divide-y divide-border" aria-busy="true" :aria-label="$t('common.loading')">
          <li v-for="n in 3" :key="n" class="flex items-center justify-between py-3">
            <div class="h-4 w-40 rounded-full animate-pulse bg-surface-muted" />
            <div class="h-5 w-20 rounded-full animate-pulse bg-surface-muted" />
          </li>
        </ul>
        <p v-else-if="orders.length === 0" class="text-text-muted py-6">No activity yet. Your orders will show up here.</p>
        <ul v-else class="divide-y divide-border">
          <li v-for="order in orders.slice(0, 5)" :key="order._id">
            <router-link :to="`/orders/${order._id}`" class="flex items-center justify-between gap-4 py-3 -mx-2 px-2 rounded-lg hover:bg-surface-muted transition-colors">
              <div class="min-w-0">
                <p class="font-medium truncate">Order #{{ order._id.slice(-8) }}</p>
                <p class="text-sm text-text-muted capitalize">{{ order.provider }} &middot; {{ formatDate(order.createdAt) }}</p>
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <span class="font-medium tabular-nums">{{ formatMinor(order.amountMinor, order.currency) }}</span>
                <StatusBadge :status="order.status" />
              </div>
            </router-link>
          </li>
        </ul>
      </section>
    </div>

    <aside class="flex flex-col gap-5">
      <section class="card p-5" aria-labelledby="orders-info-title">
        <h2 id="orders-info-title" class="text-xl font-semibold text-text mb-2">Orders info:</h2>
        <dl class="divide-y divide-border">
          <div v-for="row in orderInfo" :key="row.label" class="flex items-center justify-between py-2.5">
            <dt class="text-text-secondary">{{ row.label }}</dt>
            <dd class="text-sm font-medium tabular-nums">{{ loadingOrders ? '—' : row.value }}</dd>
          </div>
        </dl>
      </section>

      <section class="card p-5" aria-labelledby="cart-summary-title">
        <h2 id="cart-summary-title" class="text-xl font-semibold text-text mb-3">Cart</h2>
        <template v-if="cartLoaded && itemCount > 0">
          <p class="text-text-secondary">{{ itemCount }} {{ itemCount === 1 ? 'item' : 'items' }}</p>
          <p class="text-2xl font-semibold mt-1 tabular-nums">{{ formatMinor(subtotalMinor, cartCurrency) }}</p>
          <router-link to="/checkout" class="btn-primary w-full mt-4">{{ $t('cart.checkout') }}</router-link>
        </template>
        <template v-else>
          <p class="text-text-muted">{{ cartLoaded ? $t('cart.empty') : $t('common.loading') }}</p>
          <router-link to="/products" class="btn-outline w-full mt-4">{{ $t('cart.browse') }}</router-link>
        </template>
      </section>
    </aside>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import { formatMinor } from '../i18n';
import StatCard from '../components/StatCard.vue';
import StatusBadge from '../components/StatusBadge.vue';

export default {
  name: 'DashboardView',
  components: { StatCard, StatusBadge },
  data() {
    return { orders: [], loadingOrders: true, activeStep: 0 };
  },
  computed: {
    ...mapState('auth', ['user']),
    ...mapState('cart', { cartLoaded: 'loaded', subtotalMinor: 'subtotalMinor', cartCurrency: 'currency' }),
    ...mapState('currency', { currentCurrency: 'current' }),
    ...mapGetters('cart', ['itemCount']),
    firstName() {
      return (this.user?.name || '').trim().split(/\s+/)[0] || '';
    },
    steps() {
      return [
        {
          title: 'Browse the catalogue',
          body: 'Explore mock supplier products with live multi-currency pricing. Switch currency any time from the top bar.',
          cta: 'Browse products',
          to: '/products',
          icon: 'M4 5.5A1.5 1.5 0 015.5 4h5A1.5 1.5 0 0112 5.5v5A1.5 1.5 0 0110.5 12h-5A1.5 1.5 0 014 10.5v-5zm10 0A1.5 1.5 0 0115.5 4h5A1.5 1.5 0 0122 5.5v5A1.5 1.5 0 0120.5 12h-5A1.5 1.5 0 0114 10.5v-5zM4 15.5A1.5 1.5 0 015.5 14h5a1.5 1.5 0 011.5 1.5v5A1.5 1.5 0 0110.5 22h-5A1.5 1.5 0 014 20.5v-5zm10 0a1.5 1.5 0 011.5-1.5h5a1.5 1.5 0 011.5 1.5v5a1.5 1.5 0 01-1.5 1.5h-5a1.5 1.5 0 01-1.5-1.5v-5z',
          done: this.itemCount > 0,
        },
        {
          title: 'Fill your cart',
          body: 'Add a few products. Your cart is saved on the server, so it follows you across devices and sessions.',
          cta: 'View cart',
          to: '/cart',
          icon: 'M3 3h2l.4 2M7 13h10l3.6-8H5.4M7 13L5.4 5M7 13l-1.5 6h11.6M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z',
          done: this.itemCount > 0,
        },
        {
          title: 'Check out in sandbox',
          body: 'Pay with Stripe, PayPal or Mangopay test credentials, then watch the RabbitMQ worker settle your order live.',
          cta: this.itemCount > 0 ? 'Go to checkout' : 'Browse products',
          to: this.itemCount > 0 ? '/checkout' : '/products',
          icon: 'M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zM3 10h18M7 15h3',
          done: false,
        },
      ];
    },
    currentStep() {
      return this.steps[this.activeStep];
    },
    orderInfo() {
      const count = (status) => this.orders.filter((o) => o.status === status).length;
      return [
        { label: 'Total orders:', value: this.orders.length },
        { label: 'Paid:', value: count('paid') },
        { label: 'In processing:', value: count('processing') },
        { label: 'Pending:', value: count('pending') },
        { label: 'Failed:', value: count('failed') },
      ];
    },
    // Orders keep the currency they were paid in, so only paid orders in the currently selected
    // currency are summed; mixing currencies into one number would be wrong.
    spent() {
      const minor = this.orders
        .filter((o) => o.status === 'paid' && o.currency === this.currentCurrency)
        .reduce((sum, o) => sum + (o.amountMinor || 0), 0);
      return { value: (minor / 100).toLocaleString('en', { maximumFractionDigits: 2 }), unit: this.currentCurrency };
    },
  },
  watch: {
    itemCount: {
      immediate: true,
      handler(count) {
        // Open the stepper on the first step that isn't done yet.
        this.activeStep = count > 0 ? 2 : 0;
      },
    },
  },
  async created() {
    try {
      this.orders = await this.fetchOrders();
    } catch {
      this.orders = [];
    } finally {
      this.loadingOrders = false;
    }
  },
  methods: {
    ...mapActions('checkout', ['fetchOrders']),
    formatMinor,
    formatDate(iso) {
      return new Date(iso).toLocaleDateString();
    },
  },
};
</script>
