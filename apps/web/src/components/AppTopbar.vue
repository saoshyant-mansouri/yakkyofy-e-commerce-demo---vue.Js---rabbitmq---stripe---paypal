<template>
  <header class="sticky top-0 z-20 h-16 flex items-center gap-2 sm:gap-3 border-b border-border bg-chrome/90 backdrop-blur px-4 sm:px-6 lg:px-8">
    <button
      type="button"
      class="lg:hidden icon-btn"
      :aria-label="$t('nav.openMenu')"
      @click="openSidebar"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <div class="flex-1" />

    <label class="sr-only" for="currency-select">Currency</label>
    <select
      id="currency-select"
      :value="currentCurrency"
      class="bg-surface-muted border border-border-strong rounded-full text-sm px-3 py-1.5 text-text focus-visible:outline-brand-orange"
      @change="onCurrencyChange"
    >
      <option v-for="c in supportedCurrencies" :key="c" :value="c">{{ c }}</option>
    </select>

    <button
      type="button"
      class="icon-btn"
      :aria-label="theme === 'dark' ? $t('nav.lightMode') : $t('nav.darkMode')"
      @click="toggleTheme"
    >
      <svg v-if="theme === 'dark'" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="4.5" />
        <path stroke-linecap="round" d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
      </svg>
      <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z" />
      </svg>
    </button>

    <router-link
      to="/cart"
      class="icon-btn"
      :aria-label="`${$t('nav.cart')} (${itemCount})`"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3 3h2l.4 2M7 13h10l3.6-8H5.4M7 13L5.4 5M7 13l-1.5 6h11.6M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
        />
      </svg>
      <span
        v-if="itemCount > 0"
        class="absolute -top-1 -right-1 bg-brand-orange text-ink text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
      >
        {{ itemCount }}
      </span>
    </router-link>

    <button
      v-if="isAuthenticated"
      type="button"
      class="hidden sm:inline-flex btn-outline"
      @click="handleLogout"
    >
      {{ $t('nav.logout') }}
    </button>
    <router-link v-else to="/login" class="btn-primary !px-4 !py-1.5 text-sm">
      {{ $t('nav.login') }}
    </router-link>
  </header>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  name: 'AppTopbar',
  computed: {
    ...mapState('currency', { currentCurrency: 'current', supportedCurrencies: 'supported' }),
    ...mapState('ui', ['theme']),
    ...mapGetters('auth', ['isAuthenticated']),
    ...mapGetters('cart', ['itemCount']),
  },
  methods: {
    ...mapActions('auth', ['logout']),
    ...mapActions('currency', ['setCurrency']),
    ...mapActions('catalog', ['fetchProducts']),
    ...mapActions('cart', ['fetchCart']),
    ...mapActions('ui', ['openSidebar', 'toggleTheme']),
    onCurrencyChange(event) {
      this.setCurrency(event.target.value);
      this.fetchProducts({ page: 1 });
      if (this.isAuthenticated) this.fetchCart();
    },
    async handleLogout() {
      await this.logout();
      this.$router.push({ name: 'landing' });
    },
  },
};
</script>
