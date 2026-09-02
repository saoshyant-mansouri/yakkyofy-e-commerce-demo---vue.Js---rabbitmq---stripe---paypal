<template>
  <div class="grid lg:grid-cols-2 lg:min-h-[600px]">
    <div class="hidden lg:flex flex-col justify-between p-12 bg-chrome border-r border-border">
      <div>
        <p class="text-xs uppercase tracking-widest text-brand-teal font-medium mb-4">Portfolio project</p>
        <h2 class="text-3xl font-semibold text-text leading-tight mb-4">
          A real checkout, built to demonstrate the craft.
        </h2>
        <p class="text-text-secondary max-w-sm">
          Vue, Node.js, MongoDB, and RabbitMQ, with Stripe and PayPal wired against their sandbox APIs —
          by Mehdi Mansouri.
        </p>
      </div>
      <div class="flex flex-col gap-3 text-sm">
        <a
          href="https://www.mhdmansouri.com/"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-text-secondary hover:text-text transition-colors w-fit"
        >
          mhdmansouri.com
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M17 7H8M17 7v9" />
          </svg>
        </a>
        <router-link to="/system-design" class="inline-flex items-center gap-1.5 text-brand-orange hover:underline w-fit">
          System design &amp; architecture →
        </router-link>
      </div>
    </div>

    <div class="flex items-center justify-center p-6 sm:p-12">
      <div class="w-full max-w-sm">
        <h1 class="text-2xl font-semibold mb-6">{{ $t('auth.registerTitle') }}</h1>
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
          <button type="submit" class="btn-primary" :disabled="submitting">
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

export default {
  name: 'RegisterView',
  components: { Spinner },
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
        this.$router.push('/products');
      } catch (err) {
        this.error = err.response?.data?.error || this.$t('common.error');
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>
