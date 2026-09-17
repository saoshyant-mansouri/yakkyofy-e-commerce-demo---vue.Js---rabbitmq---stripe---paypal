<template>
  <div>
    <router-link
      :to="{ name: 'products', query: $store.state.catalog.lastQuery }"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text transition-colors mb-6"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {{ $t('common.backToProducts') }}
    </router-link>

    <div v-if="loading" class="grid md:grid-cols-2 gap-8" role="status" aria-busy="true" :aria-label="$t('common.loading')">
      <div class="w-full rounded-card aspect-square animate-pulse bg-surface-muted" />
      <div class="flex flex-col gap-4">
        <div class="h-3 w-20 rounded-full animate-pulse bg-surface-muted" />
        <div class="h-7 w-3/4 rounded-full animate-pulse bg-surface-muted" />
        <div class="h-4 w-full rounded-full animate-pulse bg-surface-muted" />
        <div class="h-4 w-2/3 rounded-full animate-pulse bg-surface-muted" />
        <div class="h-4 w-1/3 rounded-full animate-pulse bg-surface-muted" />
        <div class="h-9 w-28 rounded-full animate-pulse bg-surface-muted" />
        <div class="h-11 w-40 rounded-full animate-pulse bg-surface-muted mt-2" />
      </div>
    </div>
    <div v-else-if="!product" class="text-text-muted">Product not found.</div>
    <div v-else class="card p-6 grid md:grid-cols-2 gap-8">
      <ProductImageTile
        :icon="product.icon"
        :category="product.category"
        :product="product"
        sizes="(min-width: 768px) 40vw, 100vw"
        eager
        class="w-full rounded-card aspect-square"
      />
      <div class="flex flex-col gap-4">
        <p class="text-xs uppercase tracking-wide text-brand-teal">{{ product.category }}</p>
        <h1 class="text-2xl font-semibold text-text">{{ product.title }}</h1>
        <p class="text-text-secondary">{{ product.description }}</p>
        <p class="text-sm text-text-muted">{{ $t('product.supplier') }}: {{ product.supplier }}</p>
        <p class="text-sm text-text-muted">
          {{ product.stock > 0 ? $t('product.inStock', { count: product.stock }) : $t('product.outOfStock') }}
        </p>
        <p class="text-3xl font-semibold text-text">{{ price }}</p>
        <button
          type="button"
          class="self-start btn-primary"
          :disabled="adding || product.stock === 0"
          @click="handleAdd"
        >
          <Spinner v-if="adding" size="sm" />
          {{ $t('product.addToCart') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { api } from '../api/client';
import { formatMinor } from '../i18n';
import ProductImageTile from '../components/ProductImageTile.vue';
import Spinner from '../components/Spinner.vue';

export default {
  name: 'ProductDetail',
  components: { ProductImageTile, Spinner },
  props: {
    idOrSlug: { type: String, required: true },
  },
  data() {
    // A product opened from the catalogue is already in the store: show it straight away instead of
    // a skeleton, then refresh it from the API (for stock and price) without blanking the page.
    const cached = this.$store.getters['catalog/findProduct'](this.idOrSlug) || null;
    return { product: cached, loading: !cached, adding: false };
  },
  computed: {
    ...mapGetters('auth', ['isAuthenticated']),
    price() {
      if (!this.product) return '';
      return formatMinor(this.product.displayPriceMinor, this.product.displayCurrency);
    },
  },
  watch: {
    '$store.state.currency.current'() {
      this.load();
    },
  },
  created() {
    this.load();
  },
  methods: {
    ...mapActions('cart', ['addItem']),
    async load() {
      if (!this.product) this.loading = true;
      try {
        const { data } = await api.get(`/products/${this.idOrSlug}`, {
          params: { currency: this.$store.state.currency.current },
        });
        this.product = data.product;
      } catch {
        // Keep showing the cached product if the refresh fails; only a product we never had is "not found".
        if (!this.product?.displayPriceMinor) this.product = null;
      } finally {
        this.loading = false;
      }
    },
    async handleAdd() {
      if (!this.isAuthenticated) {
        this.$router.push({ name: 'login', query: { redirect: this.$route.fullPath } });
        return;
      }
      this.adding = true;
      try {
        await this.addItem({ productId: this.product._id, qty: 1 });
      } finally {
        this.adding = false;
      }
    },
  },
};
</script>
