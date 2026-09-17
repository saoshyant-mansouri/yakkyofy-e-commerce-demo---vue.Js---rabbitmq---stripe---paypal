<template>
  <header class="sticky top-0 z-20 h-[70px] shrink-0 flex items-center gap-2 sm:gap-3 bg-canvas/60 backdrop-blur-md px-4 sm:px-6 lg:rounded-tl-[45px]">
    <button
      type="button"
      class="lg:hidden icon-btn -ml-2"
      :aria-label="$t('nav.openMenu')"
      @click="openSidebar"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <nav aria-label="Breadcrumb" class="min-w-0 hidden sm:block">
      <ol class="flex items-center gap-2 text-sm text-text-muted">
        <li>
          <router-link to="/dashboard" class="flex hover:text-brand-orange" aria-label="Dashboard">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 3.2l9 7V21h-6.5v-6h-5v6H3V10.2l9-7z" />
            </svg>
          </router-link>
        </li>
        <li v-for="crumb in breadcrumbs" :key="crumb.label" class="flex items-center gap-2 min-w-0">
          <span aria-hidden="true">&gt;</span>
          <router-link v-if="crumb.to" :to="crumb.to" class="truncate hover:text-brand-orange">{{ crumb.label }}</router-link>
          <span v-else class="truncate text-text-secondary" aria-current="page">{{ crumb.label }}</span>
        </li>
      </ol>
    </nav>

    <div class="flex-1" />

    <ApiStatusPill compact />

    <label class="sr-only" for="currency-select">Currency</label>
    <select
      id="currency-select"
      :value="currentCurrency"
      class="h-10 bg-surface rounded-card text-sm font-medium px-3 text-text border border-transparent hover:border-border-strong focus-visible:border-brand-orange cursor-pointer"
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
      <svg class="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3 3h2l.4 2M7 13h10l3.6-8H5.4M7 13L5.4 5M7 13l-1.5 6h11.6M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
        />
      </svg>
      <span
        v-if="itemCount > 0"
        class="absolute -top-0.5 -right-0.5 bg-brand-orange text-ink text-[11px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center"
      >
        {{ itemCount }}
      </span>
    </router-link>

    <div v-if="isAuthenticated" ref="menu" class="relative">
      <button
        type="button"
        class="grid place-items-center w-11 h-11 rounded-full border-2 border-brand-orange text-brand-orange text-sm font-semibold transition-colors hover:bg-accent"
        :aria-expanded="String(menuOpen)"
        aria-haspopup="menu"
        :aria-label="`Account menu for ${user.name}`"
        @click="menuOpen = !menuOpen"
      >
        {{ initials }}
      </button>
      <div
        v-if="menuOpen"
        role="menu"
        class="absolute right-0 top-full mt-2 w-60 rounded-card bg-surface border border-border shadow-[0_2px_12px_rgb(0_0_0/10%)] py-2"
      >
        <div class="px-4 py-2 border-b border-border mb-1">
          <p class="text-sm font-semibold text-text truncate">{{ user.name }}</p>
          <p class="text-xs text-text-muted truncate">{{ user.email }}</p>
        </div>
        <router-link to="/orders" role="menuitem" class="block px-4 py-2 text-sm hover:bg-accent" @click.native="menuOpen = false">
          {{ $t('nav.orders') }}
        </router-link>
        <button type="button" role="menuitem" class="w-full text-left px-4 py-2 text-sm hover:bg-accent" @click="handleLogout">
          {{ $t('nav.logout') }}
        </button>
      </div>
    </div>
    <router-link v-else to="/login" class="btn-primary !px-4 !py-2 text-sm">
      {{ $t('nav.login') }}
    </router-link>
  </header>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import ApiStatusPill from './ApiStatusPill.vue';

export default {
  name: 'AppTopbar',
  components: { ApiStatusPill },
  data() {
    return { menuOpen: false };
  },
  computed: {
    ...mapState('currency', { currentCurrency: 'current', supportedCurrencies: 'supported' }),
    ...mapState('ui', ['theme']),
    ...mapState('auth', ['user']),
    ...mapGetters('auth', ['isAuthenticated']),
    ...mapGetters('cart', ['itemCount']),
    initials() {
      const parts = (this.user?.name || '').trim().split(/\s+/).filter(Boolean);
      return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] || '?').slice(0, 2)).toUpperCase();
    },
    breadcrumbs() {
      const { meta } = this.$route;
      const crumbs = [];
      if (meta.parent) {
        const parent = this.$router.resolve({ name: meta.parent }).route;
        crumbs.push({ label: parent.meta.title, to: { name: meta.parent } });
      }
      if (meta.title && this.$route.name !== 'dashboard') crumbs.push({ label: meta.title });
      if (this.$route.name === 'dashboard') crumbs.push({ label: 'Dashboard' });
      return crumbs;
    },
  },
  watch: {
    $route() {
      this.menuOpen = false;
    },
    menuOpen(open) {
      const method = open ? 'addEventListener' : 'removeEventListener';
      document[method]('pointerdown', this.onPointerDown);
      document[method]('keydown', this.onKeydown);
    },
  },
  beforeDestroy() {
    document.removeEventListener('pointerdown', this.onPointerDown);
    document.removeEventListener('keydown', this.onKeydown);
  },
  methods: {
    ...mapActions('auth', ['logout']),
    ...mapActions('currency', ['setCurrency']),
    ...mapActions('catalog', ['fetchProducts']),
    ...mapActions('cart', ['fetchCart']),
    ...mapActions('ui', ['openSidebar', 'toggleTheme']),
    onPointerDown(event) {
      if (this.$refs.menu && !this.$refs.menu.contains(event.target)) this.menuOpen = false;
    },
    onKeydown(event) {
      if (event.key === 'Escape') this.menuOpen = false;
    },
    onCurrencyChange(event) {
      this.setCurrency(event.target.value);
      // Only the catalogue page shows the product list; refetching it elsewhere was a wasted request.
      if (this.$route.name === 'products') this.fetchProducts({ page: 1 });
      if (this.isAuthenticated) this.fetchCart();
    },
    async handleLogout() {
      this.menuOpen = false;
      await this.logout();
      this.$router.push({ name: 'landing' });
    },
  },
};
</script>
