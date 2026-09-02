<template>
  <div>
    <h1 class="text-2xl font-semibold mb-6">{{ $t('cart.title') }}</h1>

    <ul
      v-if="loading"
      class="flex flex-col divide-y divide-border border border-border rounded-card overflow-hidden"
      role="status"
      aria-busy="true"
      :aria-label="$t('common.loading')"
    >
      <li v-for="n in 3" :key="n" class="flex items-center gap-4 p-4 bg-surface">
        <div class="w-16 h-16 rounded-lg shrink-0 animate-pulse bg-surface-muted" />
        <div class="flex-1 min-w-0 flex flex-col gap-2">
          <div class="h-4 w-1/2 rounded-full animate-pulse bg-surface-muted" />
          <div class="h-3 w-1/4 rounded-full animate-pulse bg-surface-muted" />
        </div>
        <div class="h-9 w-16 rounded-lg animate-pulse bg-surface-muted" />
        <div class="h-4 w-14 rounded-full animate-pulse bg-surface-muted" />
      </li>
    </ul>

    <div v-else-if="items.length === 0" class="text-center py-16">
      <p class="text-text-muted mb-4">{{ $t('cart.empty') }}</p>
      <router-link to="/products" class="btn-primary">
        {{ $t('cart.browse') }}
      </router-link>
    </div>

    <div v-else class="flex flex-col gap-4">
      <ul class="flex flex-col divide-y divide-border border border-border rounded-card overflow-hidden">
        <li
          v-for="item in items"
          :key="item.product._id"
          class="flex items-center gap-4 p-4 bg-surface"
        >
          <ProductImageTile
            :icon="item.product.icon"
            :category="item.product.category"
            class="w-16 h-16 rounded-lg shrink-0"
          />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ item.product.title }}</p>
            <p class="text-sm text-text-muted">{{ formatMinor(item.unitPriceMinor, currency) }} each</p>
          </div>
          <label class="sr-only" :for="`qty-${item.product._id}`">{{ $t('cart.quantity') }}</label>
          <input
            :id="`qty-${item.product._id}`"
            type="number"
            min="1"
            max="99"
            :value="item.qty"
            class="input-field w-16 text-center px-2 py-1.5"
            @change="onQtyChange(item.product._id, $event.target.value)"
          />
          <p class="w-24 text-right font-medium">{{ formatMinor(item.lineTotalMinor, currency) }}</p>
          <button
            type="button"
            class="text-sm text-brand-pink hover:underline"
            @click="removeItem({ productId: item.product._id })"
          >
            {{ $t('cart.remove') }}
          </button>
        </li>
      </ul>

      <div class="flex items-center justify-between border-t border-border pt-4">
        <span class="text-lg font-semibold">{{ $t('cart.subtotal') }}</span>
        <span class="text-lg font-semibold">{{ formatMinor(subtotalMinor, currency) }}</span>
      </div>

      <router-link to="/checkout" class="self-end btn-primary">
        {{ $t('cart.checkout') }}
      </router-link>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { formatMinor } from '../i18n';
import ProductImageTile from '../components/ProductImageTile.vue';

export default {
  name: 'CartView',
  components: { ProductImageTile },
  computed: {
    ...mapState('cart', ['items', 'currency', 'subtotalMinor', 'loading']),
  },
  created() {
    this.fetchCart();
  },
  methods: {
    ...mapActions('cart', ['fetchCart', 'updateQty', 'removeItem']),
    formatMinor,
    onQtyChange(productId, value) {
      const qty = Math.max(1, Math.min(99, Number(value) || 1));
      this.updateQty({ productId, qty });
    },
  },
};
</script>
