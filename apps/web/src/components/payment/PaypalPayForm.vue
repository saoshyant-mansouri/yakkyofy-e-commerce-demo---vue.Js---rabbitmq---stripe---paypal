<template>
  <div>
    <div v-if="loading" class="flex items-center gap-2 text-text-muted text-sm py-3" role="status">
      <Spinner size="sm" />
      {{ $t('common.loading') }}
    </div>
    <div ref="buttonContainer" />
    <p v-if="error" class="text-brand-pink text-sm mt-2" role="alert">{{ error }}</p>
    <p class="text-xs text-text-muted mt-3">
      Sandbox checkout: log in with a PayPal sandbox <em>personal (buyer)</em> account — not your
      real PayPal login. Create or find one at
      <a
        href="https://developer.paypal.com/dashboard/accounts"
        target="_blank"
        rel="noopener noreferrer"
        class="text-brand-orange hover:underline"
        >developer.paypal.com → Sandbox → Accounts</a
      >.
    </p>
  </div>
</template>

<script>
import { loadScript } from '@paypal/paypal-js';
import Spinner from '../Spinner.vue';

export default {
  name: 'PaypalPayForm',
  components: { Spinner },
  props: {
    paypalOrderId: { type: String, required: true },
    currency: { type: String, required: true },
  },
  data() {
    return { loading: true, error: '' };
  },
  async mounted() {
    try {
      // Must match the currency the order was actually created in
      // server-side — PayPal rejects approval/capture on a mismatch, so
      // this can't be left undefined (which silently falls back to
      // whatever the sandbox business account's default currency is).
      const paypal = await loadScript({
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
        currency: this.currency,
      });
      // The order was already created server-side in checkout/start, so the
      // client just needs to hand PayPal that existing order id back.
      paypal
        .Buttons({
          createOrder: () => this.paypalOrderId,
          onApprove: async () => {
            this.$emit('approved');
          },
          onError: (err) => {
            this.error = err?.message || this.$t('checkout.failure');
          },
        })
        .render(this.$refs.buttonContainer);
    } catch (err) {
      this.error = err.message || 'PayPal failed to load.';
    } finally {
      this.loading = false;
    }
  },
};
</script>
