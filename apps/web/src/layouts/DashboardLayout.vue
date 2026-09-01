<template>
  <div class="min-h-screen flex bg-bg text-text">
    <AppSidebar />
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/50 lg:hidden"
      aria-hidden="true"
      @click="closeSidebar"
    />
    <div class="flex-1 flex flex-col min-w-0 lg:pl-64">
      <AppTopbar />
      <main id="main-content" class="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import AppSidebar from '../components/AppSidebar.vue';
import AppTopbar from '../components/AppTopbar.vue';

export default {
  name: 'DashboardLayout',
  components: { AppSidebar, AppTopbar },
  computed: {
    ...mapState('ui', ['sidebarOpen']),
    ...mapGetters('auth', ['isAuthenticated']),
  },
  watch: {
    isAuthenticated: {
      immediate: true,
      handler(val) {
        if (val) this.fetchCart();
      },
    },
    sidebarOpen(open) {
      document.body.classList.toggle('overflow-hidden', open);
    },
    $route() {
      this.closeSidebar();
    },
  },
  methods: {
    ...mapActions('cart', ['fetchCart']),
    ...mapActions('ui', ['closeSidebar']),
  },
};
</script>
