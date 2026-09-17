<template>
  <article
    class="group card overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-brand-orange"
  >
    <router-link :to="`/products/${product.slug}`" class="block aspect-square overflow-hidden">
      <ProductImageTile
        :icon="product.icon"
        :category="product.category"
        :product="product"
        class="w-full h-full transition-transform duration-300 group-hover:scale-105"
      />
    </router-link>
    <div class="p-4 flex flex-col gap-2 flex-1">
      <p class="text-xs uppercase tracking-wide text-brand-teal">{{ product.category }}</p>
      <router-link :to="`/products/${product.slug}`" class="font-medium text-text hover:underline">
        {{ product.title }}
      </router-link>
      <!-- Space is always reserved (no height/layout change on hover) —
           only opacity animates, so a hovered card can never push its
           siblings' shared CSS Grid row track taller. -->
      <p class="text-xs text-text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {{ product.stock > 0 ? $t('product.inStock', { count: product.stock }) : $t('product.outOfStock') }}
      </p>
      <div class="mt-auto flex items-center justify-between pt-2">
        <span class="font-semibold text-text">{{ price }}</span>
        <button
          type="button"
          class="text-sm font-semibold px-3 py-1.5 rounded-lg bg-brand-orange text-ink hover:bg-brand-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          :disabled="adding"
          @click="handleAdd"
        >
          <Spinner v-if="adding" size="sm" />
          {{ $t('product.addToCart') }}
        </button>
      </div>
    </div>
  </article>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { formatMinor } from '../i18n';
import ProductImageTile from './ProductImageTile.vue';
import Spinner from './Spinner.vue';

export default {
  name: 'ProductCard',
  components: { ProductImageTile, Spinner },
  props: {
    product: { type: Object, required: true },
  },
  data() {
    return { adding: false };
  },
  computed: {
    ...mapGetters('auth', ['isAuthenticated']),
    price() {
      return formatMinor(this.product.displayPriceMinor, this.product.displayCurrency);
    },
  },
  methods: {
    ...mapActions('cart', ['addItem']),
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
