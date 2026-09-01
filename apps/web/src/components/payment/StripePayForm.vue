<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <div class="relative">
      <div
        id="stripe-card-element"
        ref="cardElement"
        class="bg-surface border border-border-strong rounded-lg px-3 py-3 min-h-[46px]"
      />
      <div v-if="!cardReady" class="absolute inset-0 flex items-center justify-center bg-surface rounded-lg">
        <Spinner size="sm" />
      </div>
    </div>
    <p v-if="error" class="text-brand-pink text-sm" role="alert">{{ error }}</p>
    <button
      type="submit"
      class="btn-primary"
      :disabled="submitting || !cardReady"
    >
      <Spinner v-if="submitting" size="sm" />
      {{ submitting ? $t('checkout.processing') : $t('checkout.pay', { amount: amountLabel }) }}
    </button>
    <p class="text-xs text-text-muted">Test card: 4242 4242 4242 4242, any future date, any CVC.</p>
  </form>
</template>

<script>
import { loadStripe } from '@stripe/stripe-js';
import { mapState } from 'vuex';
import Spinner from '../Spinner.vue';

// Stripe renders the card field inside its own iframe, so it can't read our
// CSS custom properties — colors have to be passed as literal values and
// re-applied whenever the theme toggles.
const STRIPE_ELEMENT_COLORS = {
  dark: { color: '#f7f8fa', placeholder: '#8b909a' },
  light: { color: '#14161a', placeholder: '#6b707a' },
};

export default {
  name: 'StripePayForm',
  components: { Spinner },
  props: {
    clientSecret: { type: String, required: true },
    amountLabel: { type: String, required: true },
  },
  data() {
    return { stripe: null, elements: null, card: null, cardReady: false, submitting: false, error: '' };
  },
  computed: {
    ...mapState('ui', ['theme']),
  },
  watch: {
    theme(next) {
      if (this.card) this.card.update({ style: this.elementStyle(next) });
    },
  },
  async mounted() {
    this.stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
    if (!this.stripe) {
      this.error = 'Stripe failed to load. Check VITE_STRIPE_PUBLISHABLE_KEY.';
      return;
    }
    this.elements = this.stripe.elements();
    this.card = this.elements.create('card', { style: this.elementStyle(this.theme) });
    this.card.mount(this.$refs.cardElement);
    this.card.on('ready', () => {
      this.cardReady = true;
    });
  },
  beforeDestroy() {
    if (this.card) this.card.destroy();
  },
  methods: {
    elementStyle(theme) {
      const { color, placeholder } = STRIPE_ELEMENT_COLORS[theme] || STRIPE_ELEMENT_COLORS.dark;
      return { base: { color, fontFamily: 'Inter, sans-serif', '::placeholder': { color: placeholder } } };
    },
    async submit() {
      this.submitting = true;
      this.error = '';
      try {
        const result = await this.stripe.confirmCardPayment(this.clientSecret, {
          payment_method: { card: this.card },
        });
        if (result.error) {
          this.error = result.error.message;
          return;
        }
        if (result.paymentIntent.status === 'succeeded') {
          this.$emit('success');
        } else {
          this.error = this.$t('checkout.failure');
        }
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>
