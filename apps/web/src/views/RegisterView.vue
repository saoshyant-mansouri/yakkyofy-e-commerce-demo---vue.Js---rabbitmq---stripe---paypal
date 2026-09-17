<template>
  <div class="grid lg:grid-cols-2 lg:min-h-[600px] flex-1">
    <!-- Form first, dark hero panel on the right: the original login screen's split layout. -->
    <div class="hidden lg:flex order-last relative overflow-hidden flex-col justify-between p-12 bg-navy text-white">
      <div class="pointer-events-none absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-brand-orange/30 blur-3xl" aria-hidden="true" />
      <div class="pointer-events-none absolute right-24 top-16 w-40 h-40 rounded-full bg-brand-purple/25 blur-3xl" aria-hidden="true" />
      <div>
        <p class="relative text-xs uppercase tracking-widest text-brand-orange-light font-semibold mb-4">Portfolio project</p>
        <h2 class="relative text-3xl font-semibold text-white leading-tight mb-4">
          A real checkout, built to demonstrate the craft.
        </h2>
        <p class="relative text-white/75 max-w-sm">
          Vue, Node.js, MongoDB, and RabbitMQ, with Stripe and PayPal wired against their sandbox APIs —
          by Saoshyant Mansouri.
        </p>
      </div>
      <div class="relative flex flex-col gap-3 text-sm">
        <a
          href="https://www.mhdmansouri.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-white/75 hover:text-white transition-colors w-fit"
        >
          mhdmansouri.com
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M17 7H8M17 7v9" />
          </svg>
        </a>
        <router-link to="/system-design" class="inline-flex items-center gap-1.5 text-brand-orange-light hover:underline w-fit">
          System design &amp; architecture →
        </router-link>
      </div>
    </div>

    <div class="flex items-center justify-center p-6 sm:p-12 bg-surface">
      <div class="w-full max-w-sm">
        <h1 class="text-4xl font-bold tracking-tight mb-2">Get started.</h1>
        <p class="text-text-secondary mb-6">{{ $t('auth.registerTitle') }} to try the full checkout flow.</p>
        <ApiStatusNotice />
        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <label class="flex flex-col gap-1 text-sm">
            {{ $t('auth.name') }}
            <input
              v-model="name"
              type="text"
              autocomplete="name"
              required
              class="input-field w-full"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm">
            {{ $t('auth.email') }}
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="input-field w-full"
            />
          </label>
          <label class="flex flex-col gap-1 text-sm">
            {{ $t('auth.password') }}
            <input
              v-model="password"
              type="password"
              autocomplete="new-password"
              minlength="8"
              required
              class="input-field w-full"
            />
          </label>
          <p v-if="error" class="text-brand-pink text-sm" role="alert">{{ error }}</p>
          <button type="submit" class="btn-primary w-full mt-2" :disabled="submitting">
            <Spinner v-if="submitting" size="sm" />
            {{ $t('nav.register') }}
          </button>
        </form>
        <p class="text-sm text-text-muted mt-4">
          {{ $t('auth.haveAccount') }}
          <router-link to="/login" class="text-brand-orange hover:underline">{{ $t('nav.login') }}</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import Spinner from '../components/Spinner.vue';
import ApiStatusNotice from '../components/ApiStatusNotice.vue';

export default {
  name: 'RegisterView',
  components: { Spinner, ApiStatusNotice },
  data() {
    return { name: '', email: '', password: '', error: '', submitting: false };
  },
  methods: {
    ...mapActions('auth', ['register']),
    async submit() {
      this.submitting = true;
      this.error = '';
      try {
        await this.register({ name: this.name, email: this.email, password: this.password });
        this.$router.push('/dashboard');
      } catch (err) {
        this.error = err.response?.data?.error || this.$t('common.error');
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>
