<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <div class="grid grid-cols-2 gap-4">
      <label class="col-span-2 flex flex-col gap-1 text-sm">
        Card number
        <input
          v-model="cardNumber"
          type="text"
          inputmode="numeric"
          autocomplete="cc-number"
          placeholder="4970 1000 0000 0000"
          class="input-field w-full"
          required
        />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        Expiry (MMYY)
        <input
          v-model="expiry"
          type="text"
          inputmode="numeric"
          autocomplete="cc-exp"
          placeholder="1228"
          maxlength="4"
          class="input-field w-full"
          required
        />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        CVC
        <input
          v-model="cvx"
          type="text"
          inputmode="numeric"
          autocomplete="cc-csc"
          placeholder="123"
          maxlength="4"
          class="input-field w-full"
          required
        />
      </label>
    </div>
    <p v-if="error" class="text-brand-pink text-sm" role="alert">{{ error }}</p>
    <button
      type="submit"
      class="btn-primary"
      :disabled="submitting"
    >
      <Spinner v-if="submitting" size="sm" />
      {{ submitting ? $t('checkout.processing') : $t('checkout.pay', { amount: amountLabel }) }}
    </button>
    <p class="text-xs text-text-muted">
      Sandbox test card: 4970 1000 0000 0000, any future MMYY, CVC 123. Tokenized directly with
      Mangopay's servers — the raw card number never touches this app's backend.
    </p>
  </form>
</template>

<script>
import Spinner from '../Spinner.vue';

export default {
  name: 'MangopayPayForm',
  components: { Spinner },
  props: {
    cardRegistration: { type: Object, required: true }, // { id, accessKey, preregistrationData, cardRegistrationURL }
    amountLabel: { type: String, required: true },
  },
  data() {
    return { cardNumber: '', expiry: '', cvx: '', submitting: false, error: '' };
  },
  methods: {
    async submit() {
      this.submitting = true;
      this.error = '';
      try {
        // Mangopay's classic CardRegistration tokenization contract: a
        // form-urlencoded POST straight to the per-registration
        // CardRegistrationURL, bypassing our own backend entirely (so raw
        // PAN data never enters our server — required for PCI scope). This
        // has been Mangopay's stable, documented tokenization mechanism for
        // years; verify field names against your sandbox docs if Mangopay
        // has since changed them.
        const body = new URLSearchParams({
          data: this.cardRegistration.preregistrationData,
          accessKeyRef: this.cardRegistration.accessKey,
          cardNumber: this.cardNumber.replace(/\s+/g, ''),
          cardExpirationDate: this.expiry,
          cardCvx: this.cvx,
          cardType: 'CB_VISA_MASTERCARD',
        });

        const res = await fetch(this.cardRegistration.cardRegistrationURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });
        const text = await res.text();
        const parsed = new URLSearchParams(text);
        const registrationData = parsed.get('data');
        if (!res.ok || !registrationData) {
          throw new Error('Card tokenization failed. Check the card details and try again.');
        }

        this.$emit('tokenized', {
          registrationId: this.cardRegistration.id,
          registrationData,
        });
      } catch (err) {
        this.error = err.message || this.$t('checkout.failure');
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>
