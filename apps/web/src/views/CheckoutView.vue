<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-2xl font-semibold mb-2">{{ $t('checkout.title') }}</h1>
    <p class="text-text-muted mb-6">
      {{ $t('cart.subtotal') }}: <span class="text-text font-semibold">{{ amountLabel }}</span>
    </p>

    <div v-if="!session" class="flex flex-col gap-4">
      <p class="text-sm text-text-muted">{{ $t('checkout.payWith') }}</p>
      <div class="grid grid-cols-3 gap-3">
        <div v-for="p in providers" :key="p" class="relative group">
          <button
            type="button"
            class="w-full px-4 py-3 rounded-lg border border-border-strong font-medium capitalize transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            :class="!isProviderDisabled(p) && 'hover:bg-surface-muted'"
            :disabled="starting || isProviderDisabled(p)"
            @click="selectProvider(p)"
          >
            <Spinner v-if="starting && startingProvider === p" size="sm" />
            {{ p }}
          </button>
          <div
            v-if="isProviderDisabled(p)"
            role="tooltip"
            class="pointer-events-none absolute left-1/2 -top-9 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-muted opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
          >
            {{ $t('checkout.notAvailable') }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="mt-6">
      <StripePayForm
        v-if="session.provider === 'stripe'"
        :client-secret="session.clientSecret"
        :amount-label="amountLabel"
        @success="onStripeSuccess"
      />
      <PaypalPayForm
        v-else-if="session.provider === 'paypal'"
        :paypal-order-id="session.paypalOrderId"
        :currency="currency"
        @approved="onPaypalApproved"
      />
      <MangopayPayForm
        v-else-if="session.provider === 'mangopay'"
        :card-registration="session.cardRegistration"
        :amount-label="amountLabel"
        @tokenized="onMangopayTokenized"
      />
      <button type="button" class="mt-4 text-sm text-text-muted hover:underline" @click="session = null">
        Choose a different payment method
      </button>
    </div>

    <p v-if="finalStatus === 'error'" class="text-brand-pink mt-6" role="alert">{{ $t('checkout.failure') }}</p>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { formatMinor } from '../i18n';
import StripePayForm from '../components/payment/StripePayForm.vue';
import PaypalPayForm from '../components/payment/PaypalPayForm.vue';
import MangopayPayForm from '../components/payment/MangopayPayForm.vue';
import Spinner from '../components/Spinner.vue';

export default {
  name: 'CheckoutView',
  components: { StripePayForm, PaypalPayForm, MangopayPayForm, Spinner },
  data() {
    return {
      providers: ['stripe', 'paypal', 'mangopay'],
      session: null,
      finalStatus: null,
      startingProvider: null,
    };
  },
  computed: {
    ...mapState('cart', ['subtotalMinor', 'currency']),
    ...mapState('checkout', ['starting']),
    amountLabel() {
      return formatMinor(this.subtotalMinor, this.currency);
    },
  },
  created() {
    this.fetchCart();
  },
  methods: {
    ...mapActions('cart', ['fetchCart']),
    ...mapActions('checkout', ['start', 'confirmStripe', 'capturePaypal', 'payMangopay']),
    isProviderDisabled(provider) {
      // Mangopay's classic CardRegistration flow needs a real sandbox app
      // (client id + API key) — this demo ships without one configured.
      return provider === 'mangopay';
    },
    async selectProvider(provider) {
      this.finalStatus = null;
      this.startingProvider = provider;
      try {
        const data = await this.start(provider);
        this.session = { provider, ...data };
      } catch {
        this.finalStatus = 'error';
      } finally {
        this.startingProvider = null;
      }
    },
    async onStripeSuccess() {
      try {
        const order = await this.confirmStripe(this.session.orderId);
        this.goToOrder(order);
      } catch {
        this.finalStatus = 'error';
      }
    },
    async onPaypalApproved() {
      try {
        const order = await this.capturePaypal(this.session.orderId);
        this.goToOrder(order);
      } catch {
        this.finalStatus = 'error';
      }
    },
    async onMangopayTokenized({ registrationId, registrationData }) {
      try {
        const order = await this.payMangopay({
          orderId: this.session.orderId,
          registrationId,
          registrationData,
          mpUserId: this.session.mpUserId,
          walletId: this.session.walletId,
        });
        this.goToOrder(order);
      } catch {
        this.finalStatus = 'error';
      }
    },
    goToOrder(order) {
      // The server already cleared the cart on successful payment — refresh
      // so the sidebar badge doesn't keep showing the pre-checkout count.
      this.fetchCart();
      this.$router.push({ name: 'order-status', params: { id: order._id } });
    },
  },
};
</script>
