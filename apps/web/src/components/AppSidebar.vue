<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-chrome border-r border-border transform transition-transform duration-200 ease-out lg:translate-x-0"
    :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    aria-label="Primary"
  >
    <div class="h-16 flex items-center gap-2 px-5 border-b border-border shrink-0">
      <router-link to="/products" class="font-semibold text-lg tracking-tight text-text">
        yakkyofy<span class="text-brand-orange">.demo</span>
      </router-link>
      <button
        type="button"
        class="ml-auto lg:hidden icon-btn"
        :aria-label="$t('nav.closeMenu')"
        @click="closeSidebar"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
      <router-link to="/products" class="sidebar-link" @click.native="closeSidebar">
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 5.5A1.5 1.5 0 015.5 4h5A1.5 1.5 0 0112 5.5v5A1.5 1.5 0 0110.5 12h-5A1.5 1.5 0 014 10.5v-5zm10 0A1.5 1.5 0 0115.5 4h5A1.5 1.5 0 0122 5.5v5A1.5 1.5 0 0120.5 12h-5A1.5 1.5 0 0114 10.5v-5zM4 15.5A1.5 1.5 0 015.5 14h5a1.5 1.5 0 011.5 1.5v5A1.5 1.5 0 0110.5 22h-5A1.5 1.5 0 014 20.5v-5zm10 0a1.5 1.5 0 011.5-1.5h5a1.5 1.5 0 011.5 1.5v5a1.5 1.5 0 01-1.5 1.5h-5a1.5 1.5 0 01-1.5-1.5v-5z" />
        </svg>
        {{ $t('nav.products') }}
      </router-link>

      <router-link
        v-if="isAuthenticated"
        to="/orders"
        class="sidebar-link"
        @click.native="closeSidebar"
      >
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 4h9l5 5v11a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1zM14 4v5h5M9 13h6M9 17h6" />
        </svg>
        {{ $t('nav.orders') }}
      </router-link>

      <router-link to="/cart" class="sidebar-link" @click.native="closeSidebar">
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3 3h2l.4 2M7 13h10l3.6-8H5.4M7 13L5.4 5M7 13l-1.5 6h11.6M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
          />
        </svg>
        {{ $t('nav.cart') }}
        <span v-if="itemCount > 0" class="ml-auto bg-brand-orange text-ink text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
          {{ itemCount }}
        </span>
      </router-link>
    </nav>

    <div class="border-t border-border p-3 shrink-0 flex flex-col gap-1">
      <router-link to="/system-design" class="sidebar-link" @click.native="closeSidebar">
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h4a2 2 0 012 2v3a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 15a2 2 0 012-2h4a2 2 0 012 2v3a2 2 0 01-2 2h-4a2 2 0 01-2-2v-3zM6 15v2a2 2 0 002 2h2M18 6v-.5a2 2 0 00-2-2h-2" />
        </svg>
        System design
      </router-link>
      <a
        href="https://www.mhdmansouri.com/"
        target="_blank"
        rel="noopener noreferrer"
        class="sidebar-link"
      >
        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7M17 7H8M17 7v9" />
        </svg>
        mhdmansouri.com
      </a>
    </div>
  </aside>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  name: 'AppSidebar',
  computed: {
    ...mapState('ui', ['sidebarOpen']),
    ...mapGetters('auth', ['isAuthenticated']),
    ...mapGetters('cart', ['itemCount']),
  },
  methods: {
    ...mapActions('ui', ['closeSidebar']),
  },
};
</script>
