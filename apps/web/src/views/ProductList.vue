<template>
  <div>
    <div class="card p-4 flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
      <label class="sr-only" for="search-input">{{ $t('common.search') }}</label>
      <input
        id="search-input"
        v-model="searchInput"
        type="search"
        :placeholder="$t('common.search')"
        class="input-field flex-1 px-4 py-2.5"
        @keyup.enter="applyFilters"
      />
      <label class="sr-only" for="category-select">{{ $t('product.category') }}</label>
      <select
        id="category-select"
        v-model="categoryInput"
        class="input-field w-full sm:w-56 shrink-0 px-4 py-2.5"
        @change="applyFilters"
      >
        <option value="">{{ $t('common.allCategories') }}</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>

    <div
      class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 transition-opacity"
      :class="loading && loaded && 'opacity-60'"
      role="status"
      :aria-busy="loading"
    >
      <!-- Skeletons only for the very first load; paging/filtering keeps the current grid
           visible (dimmed) until the next page arrives, so the layout never collapses. -->
      <template v-if="loading && !loaded">
        <ProductCardSkeleton v-for="n in limit" :key="n" />
      </template>
      <template v-else>
        <ProductCard v-for="p in items" :key="p._id" :product="p" />
      </template>
    </div>

    <PaginationBar v-if="loaded && totalPages > 1" :page="page" :total-pages="totalPages" @change="goToPage" />
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import ProductCard from '../components/ProductCard.vue';
import ProductCardSkeleton from '../components/ProductCardSkeleton.vue';
import PaginationBar from '../components/PaginationBar.vue';

export default {
  name: 'ProductList',
  components: { ProductCard, ProductCardSkeleton, PaginationBar },
  data() {
    return {
      searchInput: '',
      categoryInput: '',
    };
  },
  computed: {
    ...mapState('catalog', ['items', 'categories', 'page', 'totalPages', 'loading', 'loaded', 'limit']),
  },
  created() {
    this.fetchCategories();
    this.fetchProducts({ page: 1 });
  },
  methods: {
    ...mapActions('catalog', ['fetchProducts', 'fetchCategories']),
    applyFilters() {
      this.$store.commit('catalog/SET_FILTERS', {
        query: this.searchInput,
        category: this.categoryInput,
      });
      this.fetchProducts({ page: 1 });
    },
    goToPage(page) {
      this.fetchProducts({ page });
    },
  },
};
</script>
