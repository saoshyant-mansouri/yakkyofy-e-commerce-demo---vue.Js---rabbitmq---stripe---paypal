<template>
  <div class="min-h-screen bg-bg text-text">
    <AppSidebar />
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-navy/40 lg:hidden"
      aria-hidden="true"
      @click="closeSidebar"
    />
    <!-- The page sits on a gray canvas with a rounded top-left corner, offset 10px from the top,
         beside a sidebar rail that shares the page background (the original's signature layout). -->
    <div class="min-w-0 lg:pl-[250px] lg:pt-2.5">
      <div class="min-h-screen lg:min-h-[calc(100vh-10px)] flex flex-col bg-canvas lg:rounded-tl-[45px]">
        <AppTopbar />
        <main id="main-content" class="flex-1 w-full max-w-[1400px] px-4 pb-10 sm:px-6">
          <h1 v-if="!$route.meta.hideTitle" class="page-title mb-3">{{ $route.meta.title }}</h1>
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import AppSidebar from '../components/AppSidebar.vue';
import AppTopbar from '../components/AppTopbar.vue';
import { prefetchDashboardRoutes } from '../router';

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
        if (val) {
          this.fetchCart();
          prefetchDashboardRoutes();
        }
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
